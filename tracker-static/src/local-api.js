/* Local API shim for the static build of the Git Challenge Tracker.

   There is no server on a static host, so this file stands in for one. It wraps
   window.fetch and answers every /api/* call out of localStorage, returning real
   Response objects — so public/app.js runs completely unmodified.

   Loaded before app.js by the generated index.html.

   Trade-offs, stated plainly:

   - Progress lives in this browser only. No sync between devices, and clearing
     site data erases it. Use "Export progress" as your backup.
   - The sign-in screen is a local profile lock, not access control. The password
     is PBKDF2-hashed rather than stored in the clear, but anyone at this browser
     can read or clear localStorage. There is nobody else to keep out.
   - Lessons are plain files under /lessons/, so the day-by-day unlock is a UI
     convention here, not something the server enforces. Anyone who wants to can
     open day 30 directly. On this course that costs you nothing.
*/

(function () {
  'use strict';

  const realFetch = window.fetch.bind(window);
  const DB_KEY = 'gct_local_db';

  // Must stay in sync with TASKS and REFLECTION_QUESTIONS in curriculum.js.
  const TASK_KEYS = ['concept', 'walkthrough', 'exerciseA', 'exerciseB', 'exerciseC', 'challenge', 'reflection'];
  const REFLECTION_KEYS = ['q1', 'q2', 'q3', 'q4', 'q5'];

  const PBKDF2_ITERATIONS = 150000;

  /* ------------------------------- storage ------------------------------- */

  function blankDatabase() {
    return { users: [], activities: {} };
  }

  function loadDatabase() {
    try {
      const parsed = JSON.parse(localStorage.getItem(DB_KEY));
      if (!parsed || typeof parsed !== 'object') return blankDatabase();
      parsed.users = Array.isArray(parsed.users) ? parsed.users : [];
      parsed.activities = parsed.activities && typeof parsed.activities === 'object' ? parsed.activities : {};
      return parsed;
    } catch {
      return blankDatabase();
    }
  }

  function saveDatabase(db) {
    try {
      localStorage.setItem(DB_KEY, JSON.stringify(db));
    } catch (err) {
      // Quota exhausted, or Safari private mode. Better a visible failure than
      // silently pretending the save worked.
      throw new Error('could not save progress in this browser: ' + (err.message || err.name));
    }
  }

  function blankDay(day) {
    return { day, tasks: {}, minutes: 0, reflection: {}, confidence: null };
  }

  /* ------------------------------ passwords ------------------------------ */

  // crypto.subtle exists only in a secure context: https, or http on localhost.
  // Opening the files straight off disk (file://) will not work.
  function subtle() {
    if (!window.crypto || !window.crypto.subtle) {
      throw new Error('this page needs https (or localhost) — open it over a web address, not from a file');
    }
    return window.crypto.subtle;
  }

  const toHex = (bytes) => [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('');

  function fromHex(hex) {
    if (typeof hex !== 'string' || hex.length % 2) return new Uint8Array(0);
    const out = new Uint8Array(hex.length / 2);
    for (let i = 0; i < out.length; i++) out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
    return out;
  }

  async function pbkdf2(password, salt, iterations) {
    const key = await subtle().importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
    const bits = await subtle().deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations }, key, 256);
    return new Uint8Array(bits);
  }

  // Same record format the Worker build uses: the cost factor travels with the
  // hash, so raising PBKDF2_ITERATIONS later never locks an old profile out.
  async function hashPassword(password) {
    const salt = window.crypto.getRandomValues(new Uint8Array(16));
    const hash = await pbkdf2(password, salt, PBKDF2_ITERATIONS);
    return 'pbkdf2-sha256$' + PBKDF2_ITERATIONS + '$' + toHex(salt) + '$' + toHex(hash);
  }

  async function verifyPassword(password, stored) {
    const [algo, iterText, saltHex, hashHex] = String(stored || '').split('$');
    if (algo !== 'pbkdf2-sha256') return false;
    const iterations = Number(iterText);
    if (!Number.isInteger(iterations) || iterations < 1000 || iterations > 1000000) return false;
    const actual = await pbkdf2(password, fromHex(saltHex), iterations);
    const expected = fromHex(hashHex);
    if (actual.length !== expected.length) return false;
    let diff = 0;
    for (let i = 0; i < actual.length; i++) diff |= actual[i] ^ expected[i];
    return diff === 0;
  }

  /* -------------------------------- tokens ------------------------------- */

  // Not signed. Signing would prove nothing here: the key would have to live in
  // this same browser, next to the data it was meant to protect.
  function makeToken(userId) {
    return 'local.' + userId;
  }

  function userFromToken(db, request) {
    const header = request.headers.get('authorization') || '';
    const token = header.replace(/^Bearer\s+/i, '');
    if (!token.startsWith('local.')) return null;
    const id = token.slice('local.'.length);
    return db.users.find((u) => u.id === id) || null;
  }

  function uuid() {
    if (window.crypto && window.crypto.randomUUID) return window.crypto.randomUUID();
    const bytes = window.crypto.getRandomValues(new Uint8Array(16));
    return toHex(bytes);
  }

  /* ------------------------------ responses ------------------------------ */

  function json(status, data) {
    return new Response(JSON.stringify(data), {
      status,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  async function readBody(request) {
    const text = await request.text();
    if (!text) return {};
    try {
      return JSON.parse(text);
    } catch {
      throw new Error('invalid json');
    }
  }

  /* -------------------------------- routes ------------------------------- */

  const ROUTES = {
    'POST /api/auth/signup': async (request) => {
      const { email, password, name } = await readBody(request);
      if (!email || !password || !name) return json(400, { error: 'email, password and name are required' });
      if (String(password).length < 8) return json(400, { error: 'password must be at least 8 characters' });
      if (String(password).length > 200) return json(400, { error: 'password must be at most 200 characters' });
      if (String(name).trim().length > 100) return json(400, { error: 'name must be at most 100 characters' });

      const normalized = String(email).trim().toLowerCase();
      if (normalized.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
        return json(400, { error: 'enter a valid email address' });
      }

      const db = loadDatabase();
      if (db.users.some((u) => u.email === normalized)) {
        return json(409, { error: 'a profile with that email already exists in this browser' });
      }

      const user = {
        id: uuid(),
        email: normalized,
        name: String(name).trim(),
        password: await hashPassword(String(password)),
        createdAt: new Date().toISOString(),
        startDate: new Date().toISOString().slice(0, 10),
      };
      db.users.push(user);
      db.activities[user.id] = {};
      saveDatabase(db);

      return json(201, {
        token: makeToken(user.id),
        user: { id: user.id, email: user.email, name: user.name, startDate: user.startDate },
      });
    },

    'POST /api/auth/login': async (request) => {
      const { email, password } = await readBody(request);
      const db = loadDatabase();
      const user = db.users.find((u) => u.email === String(email || '').trim().toLowerCase());
      if (!user || !(await verifyPassword(String(password || ''), user.password))) {
        // No rate limiting: there is no network attacker to slow down, and a
        // lockout would only ever lock out the person who owns the browser.
        return json(401, { error: 'invalid email or password' });
      }
      return json(200, {
        token: makeToken(user.id),
        user: { id: user.id, email: user.email, name: user.name, startDate: user.startDate },
      });
    },

    'GET /api/me': async (request) => {
      const db = loadDatabase();
      const user = userFromToken(db, request);
      if (!user) return json(401, { error: 'unauthorized' });
      return json(200, { id: user.id, email: user.email, name: user.name, startDate: user.startDate });
    },

    'GET /api/lesson': async (request, url) => {
      const db = loadDatabase();
      const user = userFromToken(db, request);
      if (!user) return json(401, { error: 'unauthorized' });

      const day = Number(url.searchParams.get('day'));
      if (!Number.isInteger(day) || day < 1 || day > 30) {
        return json(400, { error: 'day must be an integer between 1 and 30' });
      }

      const bucket = db.activities[user.id] || {};
      if (day !== 1 && !(bucket[day - 1] && bucket[day - 1].lessonRead)) {
        return json(403, { locked: true, error: `day ${day} is locked — finish reading day ${day - 1}'s lesson first` });
      }

      // The build renames lessons/Day-07-Undoing-Changes.md to day-07.md, so the
      // path is derivable and no manifest lookup is needed.
      const file = 'lessons/day-' + String(day).padStart(2, '0') + '.md';
      const res = await realFetch(file, { cache: 'no-cache' });
      if (!res.ok) return json(404, { error: `no lesson file found for day ${day}` });
      return json(200, { day, markdown: await res.text() });
    },

    'POST /api/lesson/read': async (request) => {
      const db = loadDatabase();
      const user = userFromToken(db, request);
      if (!user) return json(401, { error: 'unauthorized' });

      const { day } = await readBody(request);
      const dayNum = Number(day);
      if (!Number.isInteger(dayNum) || dayNum < 1 || dayNum > 30) {
        return json(400, { error: 'day must be an integer between 1 and 30' });
      }

      const bucket = (db.activities[user.id] = db.activities[user.id] || {});
      if (dayNum !== 1 && !(bucket[dayNum - 1] && bucket[dayNum - 1].lessonRead)) {
        return json(403, { locked: true, error: `day ${dayNum} is locked — finish reading day ${dayNum - 1}'s lesson first` });
      }

      const existing = bucket[dayNum] || blankDay(dayNum);
      existing.lessonRead = true;
      existing.lessonReadAt = existing.lessonReadAt || new Date().toISOString();
      existing.readPct = 100;
      existing.updatedAt = new Date().toISOString();
      bucket[dayNum] = existing;
      saveDatabase(db);
      return json(200, existing);
    },

    'GET /api/activities': async (request) => {
      const db = loadDatabase();
      const user = userFromToken(db, request);
      if (!user) return json(401, { error: 'unauthorized' });
      return json(200, db.activities[user.id] || {});
    },

    'PUT /api/activities': async (request) => {
      const db = loadDatabase();
      const user = userFromToken(db, request);
      if (!user) return json(401, { error: 'unauthorized' });

      const { day, patch } = await readBody(request);
      const dayNum = Number(day);
      if (!Number.isInteger(dayNum) || dayNum < 1 || dayNum > 30) {
        return json(400, { error: 'day must be an integer between 1 and 30' });
      }
      if (!patch || typeof patch !== 'object') return json(400, { error: 'patch object required' });

      // Same validation the server did. It is not a security boundary here, but
      // it keeps the stored shape clean and the export file predictable.
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

      let readPct;
      if ('readPct' in patch) {
        readPct = Number(patch.readPct);
        if (!(Number.isInteger(readPct) && readPct >= 0 && readPct <= 100)) {
          return json(400, { error: 'readPct must be an integer 0-100' });
        }
      }

      const bucket = (db.activities[user.id] = db.activities[user.id] || {});
      const existing = bucket[dayNum] || blankDay(dayNum);

      const merged = Object.assign({}, existing,
        tasks !== undefined ? { tasks: Object.assign({}, existing.tasks, tasks) } : {},
        reflection !== undefined ? { reflection: Object.assign({}, existing.reflection, reflection) } : {},
        'minutes' in patch ? { minutes: Math.max(0, Math.min(600, Number(patch.minutes) || 0)) } : {},
        confidence !== undefined ? { confidence } : {},
        readPct !== undefined ? { readPct: Math.max(existing.readPct || 0, readPct) } : {},
        { day: dayNum, updatedAt: new Date().toISOString() }
      );

      merged.completed = TASK_KEYS.every((key) => Boolean(merged.tasks && merged.tasks[key]));
      if (merged.completed && !existing.completedAt) merged.completedAt = new Date().toISOString();
      if (!merged.completed) delete merged.completedAt;

      bucket[dayNum] = merged;
      saveDatabase(db);
      return json(200, merged);
    },

    'GET /api/export': async (request) => {
      const db = loadDatabase();
      const user = userFromToken(db, request);
      if (!user) return json(401, { error: 'unauthorized' });
      const body = JSON.stringify(
        {
          exportedAt: new Date().toISOString(),
          user: { email: user.email, name: user.name },
          activities: db.activities[user.id] || {},
        },
        null,
        2
      );
      return new Response(body, { headers: { 'Content-Type': 'application/json' } });
    },
  };

  /* ------------------------------ the wrapper ---------------------------- */

  window.fetch = async function (input, init) {
    let url;
    try {
      url = new URL(typeof input === 'string' ? input : input.url, location.href);
    } catch {
      return realFetch(input, init);
    }

    // Everything that is not an API call — the lesson markdown, the font — goes
    // to the network untouched.
    if (url.origin !== location.origin || !url.pathname.startsWith('/api/')) {
      return realFetch(input, init);
    }

    const request = new Request(input, init);
    const handler = ROUTES[request.method.toUpperCase() + ' ' + url.pathname];
    if (!handler) return json(404, { error: 'not found' });

    try {
      return await handler(request, url);
    } catch (err) {
      return json(400, { error: err.message || 'request failed' });
    }
  };
})();
