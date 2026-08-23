/* Git Challenge Tracker — Cloudflare Worker edition.

   Same API and same frontend as tracker-backend/server.js, rebuilt for the
   Workers runtime, which has no filesystem, no listening sockets and no
   node:crypto scrypt:

     db.json       -> D1 (tables: users, activities)
     data/.secret  -> the SESSION_SECRET worker secret
     lessons/*.md  -> bundled at build time (src/lessons.generated.js)
     scrypt        -> PBKDF2-SHA256 via WebCrypto
     in-memory
     rate limits   -> D1 `throttle` table (isolates are ephemeral; a Map is not
                      shared between them, so counts would reset constantly)
     public/       -> Workers static assets (env.ASSETS)
*/

import { LESSONS } from './lessons.generated.js';

// A day counts as complete only when every one of these checklist items is ticked.
// Must stay in sync with TASKS in public/curriculum.js.
const TASK_KEYS = ['concept', 'walkthrough', 'exerciseA', 'exerciseB', 'exerciseC', 'challenge', 'reflection'];
// Must stay in sync with REFLECTION_QUESTIONS in public/curriculum.js.
const REFLECTION_KEYS = ['q1', 'q2', 'q3', 'q4', 'q5'];

const TOKEN_TTL_MS = 30 * 864e5;

// PBKDF2 rounds used for NEW passwords. Every round burns CPU inside the
// request and the Workers Free plan allows only 10ms of CPU per request, so
// wrangler.jsonc sets PBKDF2_ITERATIONS to a Free-safe 25000; raise it on the
// Paid plan. Each stored hash carries the round count it was made with, so
// changing this never locks anyone out.
const DEFAULT_ITERATIONS = 100000;

function iterationsFor(env) {
  const n = Number(env.PBKDF2_ITERATIONS);
  return Number.isInteger(n) && n >= 1000 && n <= 1000000 ? n : DEFAULT_ITERATIONS;
}

/* ------------------------------- encoding -------------------------------- */

const enc = new TextEncoder();

function toHex(bytes) {
  return [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('');
}

function fromHex(hex) {
  if (typeof hex !== 'string' || hex.length % 2) return new Uint8Array(0);
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  return out;
}

function b64urlEncode(bytes) {
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function b64urlDecode(text) {
  const padded = text.replace(/-/g, '+').replace(/_/g, '/');
  const bin = atob(padded + '='.repeat((4 - (padded.length % 4)) % 4));
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function timingSafeEqual(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

/* ------------------------------- passwords ------------------------------- */

async function pbkdf2(password, salt, iterations) {
  const key = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations }, key, 256);
  return new Uint8Array(bits);
}

// Stored as `pbkdf2-sha256$<iterations>$<saltHex>$<hashHex>` so the cost factor
// travels with the hash and can be raised later without a flag day.
async function hashPassword(password, iterations) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await pbkdf2(password, salt, iterations);
  return 'pbkdf2-sha256$' + iterations + '$' + toHex(salt) + '$' + toHex(hash);
}

async function verifyPassword(password, stored) {
  const [algo, iterText, saltHex, hashHex] = String(stored || '').split('$');
  if (algo !== 'pbkdf2-sha256') return false;
  const iterations = Number(iterText);
  if (!Number.isInteger(iterations) || iterations < 1000 || iterations > 1000000) return false;
  const actual = await pbkdf2(password, fromHex(saltHex), iterations);
  return timingSafeEqual(actual, fromHex(hashHex));
}

/* -------------------------------- tokens --------------------------------- */

async function macKey(secret) {
  return crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);
}

async function sign(payload, secret) {
  const body = b64urlEncode(enc.encode(JSON.stringify(payload)));
  const mac = await crypto.subtle.sign('HMAC', await macKey(secret), enc.encode(body));
  return body + '.' + b64urlEncode(new Uint8Array(mac));
}

async function verifyToken(token, secret) {
  if (typeof token !== 'string' || !token.includes('.')) return null;
  const [body, mac] = token.split('.');
  let ok = false;
  try {
    ok = await crypto.subtle.verify('HMAC', await macKey(secret), b64urlDecode(mac), enc.encode(body));
  } catch {
    return null;
  }
  if (!ok) return null;
  try {
    const payload = JSON.parse(new TextDecoder().decode(b64urlDecode(body)));
    if (payload.exp && payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

async function authed(request, env) {
  const header = request.headers.get('authorization') || '';
  return verifyToken(header.replace(/^Bearer\s+/i, ''), env.SESSION_SECRET);
}

/* ------------------------------- responses ------------------------------- */

function json(code, data) {
  return new Response(JSON.stringify(data), {
    status: code,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}

async function readBody(request) {
  if (Number(request.headers.get('content-length') || 0) > 1000000) throw new Error('payload too large');
  const text = await request.text();
  if (!text) return {};
  if (text.length > 1000000) throw new Error('payload too large');
  try {
    return JSON.parse(text);
  } catch {
    throw new Error('invalid json');
  }
}

/* ------------------------------ rate limits ------------------------------ */

// Throttle state lives in D1 because a Worker isolate is short-lived and there
// are many of them: an in-process Map would forget the count between requests.
const MAX_FAILURES = 10;
const BLOCK_MS = 15 * 60 * 1000;
const SIGNUP_LIMIT = 5;
const SIGNUP_WINDOW_MS = 60 * 60 * 1000;

function clientIp(request) {
  return request.headers.get('cf-connecting-ip') || 'unknown';
}

async function authBlocked(env, request) {
  const row = await env.DB.prepare('SELECT blocked_until FROM throttle WHERE key = ?')
    .bind('login:' + clientIp(request))
    .first();
  return Boolean(row && row.blocked_until > Date.now());
}

async function recordAuthFailure(env, request) {
  const now = Date.now();
  await env.DB.prepare(
    `INSERT INTO throttle (key, count, reset_at, blocked_until) VALUES (?1, 1, ?2, 0)
     ON CONFLICT(key) DO UPDATE SET
       blocked_until = CASE WHEN throttle.count + 1 >= ?3 THEN ?4 ELSE throttle.blocked_until END,
       count         = CASE WHEN throttle.count + 1 >= ?3 THEN 0  ELSE throttle.count + 1 END,
       reset_at      = ?2`
  )
    .bind('login:' + clientIp(request), now + BLOCK_MS + 60 * 60 * 1000, MAX_FAILURES, now + BLOCK_MS)
    .run();
}

async function clearAuthFailures(env, request) {
  await env.DB.prepare('DELETE FROM throttle WHERE key = ?').bind('login:' + clientIp(request)).run();
}

async function signupBlocked(env, request) {
  const row = await env.DB.prepare('SELECT count, reset_at FROM throttle WHERE key = ?')
    .bind('signup:' + clientIp(request))
    .first();
  return Boolean(row && row.reset_at > Date.now() && row.count >= SIGNUP_LIMIT);
}

async function recordSignup(env, request) {
  const now = Date.now();
  await env.DB.prepare(
    `INSERT INTO throttle (key, count, reset_at, blocked_until) VALUES (?1, 1, ?2, 0)
     ON CONFLICT(key) DO UPDATE SET
       count    = CASE WHEN throttle.reset_at <= ?3 THEN 1  ELSE throttle.count + 1 END,
       reset_at = CASE WHEN throttle.reset_at <= ?3 THEN ?2 ELSE throttle.reset_at END`
  )
    .bind('signup:' + clientIp(request), now + SIGNUP_WINDOW_MS, now)
    .run();
}

/* -------------------------------- storage -------------------------------- */

function blankDay(day) {
  return { day, tasks: {}, minutes: 0, reflection: {}, confidence: null };
}

async function getDay(env, userId, day) {
  const row = await env.DB.prepare('SELECT data FROM activities WHERE user_id = ? AND day = ?').bind(userId, day).first();
  if (!row) return null;
  try {
    return JSON.parse(row.data);
  } catch {
    return null;
  }
}

async function putDay(env, userId, day, value) {
  await env.DB.prepare(
    `INSERT INTO activities (user_id, day, data, updated_at) VALUES (?1, ?2, ?3, ?4)
     ON CONFLICT(user_id, day) DO UPDATE SET data = ?3, updated_at = ?4`
  )
    .bind(userId, day, JSON.stringify(value), value.updatedAt || new Date().toISOString())
    .run();
}

async function getActivities(env, userId) {
  const { results } = await env.DB.prepare('SELECT day, data FROM activities WHERE user_id = ?').bind(userId).all();
  const out = {};
  for (const row of results || []) {
    try {
      out[row.day] = JSON.parse(row.data);
    } catch {
      /* one unreadable row must not sink the whole dashboard */
    }
  }
  return out;
}

// Sequential unlock: day 1 is always readable; day N needs day N-1 marked read.
// Marking read is itself gated, so the chain can't be skipped by induction.
async function lessonUnlocked(env, userId, day) {
  if (day === 1) return true;
  const previous = await getDay(env, userId, day - 1);
  return Boolean(previous && previous.lessonRead);
}

async function requireUser(request, env) {
  const session = await authed(request, env);
  if (!session) return null;
  return env.DB.prepare('SELECT id, email, name, start_date FROM users WHERE id = ?').bind(session.id).first();
}

/* --------------------------------- routes -------------------------------- */

const ROUTES = {
  'POST /api/auth/signup': async (request, env) => {
    if (await signupBlocked(env, request)) {
      return json(429, { error: 'too many accounts created from this device — try again in an hour' });
    }
    const { email, password, name } = await readBody(request);
    if (!email || !password || !name) return json(400, { error: 'email, password and name are required' });
    if (String(password).length < 8) return json(400, { error: 'password must be at least 8 characters' });
    if (String(password).length > 200) return json(400, { error: 'password must be at most 200 characters' });
    if (String(name).trim().length > 100) return json(400, { error: 'name must be at most 100 characters' });

    const normalized = String(email).trim().toLowerCase();
    if (normalized.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
      return json(400, { error: 'enter a valid email address' });
    }

    const clash = await env.DB.prepare('SELECT id FROM users WHERE email = ?').bind(normalized).first();
    if (clash) return json(409, { error: 'an account with that email already exists' });

    const user = {
      id: crypto.randomUUID(),
      email: normalized,
      name: String(name).trim(),
      createdAt: new Date().toISOString(),
      startDate: new Date().toISOString().slice(0, 10),
    };
    const stored = await hashPassword(String(password), iterationsFor(env));

    try {
      await env.DB.prepare('INSERT INTO users (id, email, name, password, created_at, start_date) VALUES (?, ?, ?, ?, ?, ?)')
        .bind(user.id, user.email, user.name, stored, user.createdAt, user.startDate)
        .run();
    } catch (err) {
      // UNIQUE(email) is the real guard when two signups race.
      if (String(err.message || '').includes('UNIQUE')) {
        return json(409, { error: 'an account with that email already exists' });
      }
      throw err;
    }
    await recordSignup(env, request);

    return json(201, {
      token: await sign({ id: user.id, exp: Date.now() + TOKEN_TTL_MS }, env.SESSION_SECRET),
      user: { id: user.id, email: user.email, name: user.name, startDate: user.startDate },
    });
  },

  'POST /api/auth/login': async (request, env) => {
    if (await authBlocked(env, request)) {
      return json(429, { error: 'too many failed attempts — try again in 15 minutes' });
    }
    const { email, password } = await readBody(request);
    if (String(password || '').length > 200) {
      await recordAuthFailure(env, request);
      return json(401, { error: 'invalid email or password' });
    }
    const user = await env.DB.prepare('SELECT id, email, name, password, start_date FROM users WHERE email = ?')
      .bind(String(email || '').trim().toLowerCase())
      .first();
    if (!user || !(await verifyPassword(String(password || ''), user.password))) {
      await recordAuthFailure(env, request);
      return json(401, { error: 'invalid email or password' });
    }
    await clearAuthFailures(env, request);
    return json(200, {
      token: await sign({ id: user.id, exp: Date.now() + TOKEN_TTL_MS }, env.SESSION_SECRET),
      user: { id: user.id, email: user.email, name: user.name, startDate: user.start_date },
    });
  },

  'GET /api/me': async (request, env) => {
    const user = await requireUser(request, env);
    if (!user) return json(401, { error: 'unauthorized' });
    return json(200, { id: user.id, email: user.email, name: user.name, startDate: user.start_date });
  },

  'GET /api/lesson': async (request, env, url) => {
    const session = await authed(request, env);
    if (!session) return json(401, { error: 'unauthorized' });

    const day = Number(url.searchParams.get('day'));
    if (!Number.isInteger(day) || day < 1 || day > 30) {
      return json(400, { error: 'day must be an integer between 1 and 30' });
    }
    if (!(await lessonUnlocked(env, session.id, day))) {
      return json(403, { locked: true, error: `day ${day} is locked — finish reading day ${day - 1}'s lesson first` });
    }
    const markdown = LESSONS[day];
    if (!markdown) return json(404, { error: `no lesson file found for day ${day}` });
    return json(200, { day, markdown });
  },

  'POST /api/lesson/read': async (request, env) => {
    const session = await authed(request, env);
    if (!session) return json(401, { error: 'unauthorized' });

    const { day } = await readBody(request);
    const dayNum = Number(day);
    if (!Number.isInteger(dayNum) || dayNum < 1 || dayNum > 30) {
      return json(400, { error: 'day must be an integer between 1 and 30' });
    }
    if (!(await lessonUnlocked(env, session.id, dayNum))) {
      return json(403, { locked: true, error: `day ${dayNum} is locked — finish reading day ${dayNum - 1}'s lesson first` });
    }

    const existing = (await getDay(env, session.id, dayNum)) || blankDay(dayNum);
    existing.lessonRead = true;
    existing.lessonReadAt ||= new Date().toISOString();
    existing.readPct = 100;
    existing.updatedAt = new Date().toISOString();
    await putDay(env, session.id, dayNum, existing);
    return json(200, existing);
  },

  'GET /api/activities': async (request, env) => {
    const session = await authed(request, env);
    if (!session) return json(401, { error: 'unauthorized' });
    return json(200, await getActivities(env, session.id));
  },

  'PUT /api/activities': async (request, env) => {
    const session = await authed(request, env);
    if (!session) return json(401, { error: 'unauthorized' });

    const { day, patch } = await readBody(request);
    const dayNum = Number(day);
    if (!Number.isInteger(dayNum) || dayNum < 1 || dayNum > 30) {
      return json(400, { error: 'day must be an integer between 1 and 30' });
    }
    if (!patch || typeof patch !== 'object') return json(400, { error: 'patch object required' });

    // Validate before touching the store: only known task keys (coerced to
    // booleans), only known reflection keys, confidence must be 1–5 or null.
    let tasks;
    if ('tasks' in patch) {
      if (!patch.tasks || typeof patch.tasks !== 'object') return json(400, { error: 'tasks must be an object' });
      tasks = {};
      for (const key of TASK_KEYS) if (key in patch.tasks) tasks[key] = Boolean(patch.tasks[key]);
    }

    let reflection;
    if ('reflection' in patch) {
      if (!patch.reflection || typeof patch.reflection !== 'object') return json(400, { error: 'reflection must be an object' });
      reflection = {};
      for (const key of REFLECTION_KEYS) {
        if (key in patch.reflection) reflection[key] = String(patch.reflection[key]).slice(0, 5000);
      }
    }

    let confidence;
    if ('confidence' in patch) {
      confidence = patch.confidence === null ? null : Number(patch.confidence);
      if (confidence !== null && !(Number.isInteger(confidence) && confidence >= 1 && confidence <= 5)) {
        return json(400, { error: 'confidence must be an integer 1-5 or null' });
      }
    }

    // Reading progress is a high-water mark; lessonRead itself is only ever
    // set through POST /api/lesson/read so the unlock chain stays honest.
    let readPct;
    if ('readPct' in patch) {
      readPct = Number(patch.readPct);
      if (!(Number.isInteger(readPct) && readPct >= 0 && readPct <= 100)) {
        return json(400, { error: 'readPct must be an integer 0-100' });
      }
    }

    const existing = (await getDay(env, session.id, dayNum)) || blankDay(dayNum);
    const merged = {
      ...existing,
      ...(tasks !== undefined ? { tasks: { ...existing.tasks, ...tasks } } : {}),
      ...(reflection !== undefined ? { reflection: { ...existing.reflection, ...reflection } } : {}),
      ...('minutes' in patch ? { minutes: Math.max(0, Math.min(600, Number(patch.minutes) || 0)) } : {}),
      ...(confidence !== undefined ? { confidence } : {}),
      ...(readPct !== undefined ? { readPct: Math.max(existing.readPct || 0, readPct) } : {}),
      day: dayNum,
      updatedAt: new Date().toISOString(),
    };

    merged.completed = TASK_KEYS.every((key) => Boolean(merged.tasks && merged.tasks[key]));
    if (merged.completed && !existing.completedAt) merged.completedAt = new Date().toISOString();
    if (!merged.completed) delete merged.completedAt;

    await putDay(env, session.id, dayNum, merged);
    return json(200, merged);
  },

  'GET /api/export': async (request, env) => {
    const user = await requireUser(request, env);
    if (!user) return json(401, { error: 'unauthorized' });
    const body = JSON.stringify(
      {
        exportedAt: new Date().toISOString(),
        user: { email: user.email, name: user.name },
        activities: await getActivities(env, user.id),
      },
      null,
      2
    );
    return new Response(body, {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': 'attachment; filename="git-challenge-progress.json"',
        'Cache-Control': 'no-store',
      },
    });
  },
};

export default {
  async fetch(request, env) {
    if (!env.SESSION_SECRET) {
      return json(500, { error: 'server not configured: run `npx wrangler secret put SESSION_SECRET`' });
    }
    const url = new URL(request.url);
    const handler = ROUTES[`${request.method} ${url.pathname}`];

    if (handler) {
      try {
        return await handler(request, env, url);
      } catch (err) {
        console.error(err);
        return json(400, { error: err.message || 'request failed' });
      }
    }

    if (url.pathname.startsWith('/api/')) return json(404, { error: 'not found' });
    if (request.method !== 'GET' && request.method !== 'HEAD') return json(405, { error: 'method not allowed' });

    // Anything that is not an API call is a static file. Static assets are
    // normally served before this Worker runs at all; reaching here means no
    // file matched, so ASSETS answers with its own 404.
    return env.ASSETS.fetch(request);
  },

  // Hourly sweep so the throttle table never grows unbounded.
  async scheduled(event, env, ctx) {
    const now = Date.now();
    ctx.waitUntil(
      env.DB.prepare('DELETE FROM throttle WHERE reset_at <= ? AND blocked_until <= ?').bind(now, now).run()
    );
  },
};
