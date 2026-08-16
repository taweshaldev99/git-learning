const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const os = require('node:os');
const { exec } = require('node:child_process');

const PORT = 5000;
const ROOT = path.join(__dirname, '..');
const DATA_DIR = path.join(ROOT, 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');
const SECRET_FILE = path.join(DATA_DIR, '.secret');
const PUBLIC_DIR = path.join(__dirname, 'public');

// A day counts as complete only when every one of these checklist items is ticked.
// Must stay in sync with TASKS in public/curriculum.js.
const TASK_KEYS = ['concept', 'walkthrough', 'exerciseA', 'exerciseB', 'exerciseC', 'challenge', 'reflection'];
// Must stay in sync with REFLECTION_QUESTIONS in public/curriculum.js.
const REFLECTION_KEYS = ['q1', 'q2', 'q3', 'q4', 'q5'];

// Lesson content lives as markdown next to the app; day N maps to Day-NN-*.md.
// Built once at boot — lesson files don't change while the server runs.
const LESSONS_DIR = path.join(ROOT, 'lessons');
const LESSON_FILES = {};
try {
  for (const f of fs.readdirSync(LESSONS_DIR)) {
    const m = /^Day-(\d{2})-.*\.md$/.exec(f);
    if (m) LESSON_FILES[Number(m[1])] = path.join(LESSONS_DIR, f);
  }
} catch {
  console.error(`  lessons folder not found at ${LESSONS_DIR} — lesson reading disabled`);
}

// Sequential unlock: day 1 is always readable; day N needs day N-1 marked read.
// Marking read is itself gated, so the chain can't be skipped by induction.
function lessonUnlocked(bucket, day) {
  return day === 1 || Boolean(bucket?.[day - 1]?.lessonRead);
}

fs.mkdirSync(DATA_DIR, { recursive: true });

if (!fs.existsSync(SECRET_FILE)) {
  fs.writeFileSync(SECRET_FILE, crypto.randomBytes(48).toString('hex'), { mode: 0o600 });
}
const SECRET = fs.readFileSync(SECRET_FILE, 'utf8');

function loadDB() {
  if (!fs.existsSync(DB_FILE)) return { users: [], activities: {} };
  try {
    return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
  } catch {
    const backup = `${DB_FILE}.corrupt-${Date.now()}`;
    fs.copyFileSync(DB_FILE, backup);
    console.error(`db.json unreadable, moved aside to ${backup}`);
    return { users: [], activities: {} };
  }
}

function saveDB(db) {
  const tmp = `${DB_FILE}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(db, null, 2));
  fs.renameSync(tmp, DB_FILE);
}

function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return { salt, hash };
}

function verifyPassword(password, salt, expected) {
  const actual = crypto.scryptSync(password, salt, 64).toString('hex');
  const a = Buffer.from(actual, 'hex');
  const b = Buffer.from(expected, 'hex');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function sign(payload) {
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const mac = crypto.createHmac('sha256', SECRET).update(body).digest('base64url');
  return `${body}.${mac}`;
}

function verifyToken(token) {
  if (typeof token !== 'string' || !token.includes('.')) return null;
  const [body, mac] = token.split('.');
  const expected = crypto.createHmac('sha256', SECRET).update(body).digest('base64url');
  const a = Buffer.from(mac);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    if (payload.exp && payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

function json(res, code, data) {
  const body = JSON.stringify(data);
  res.writeHead(code, {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(body),
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
  });
  res.end(body);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', (c) => {
      size += c.length;
      if (size > 1_000_000) {
        reject(new Error('payload too large'));
        req.destroy();
        return;
      }
      chunks.push(c);
    });
    req.on('end', () => {
      if (!chunks.length) return resolve({});
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')));
      } catch {
        reject(new Error('invalid json'));
      }
    });
    req.on('error', reject);
  });
}

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
};

function serveStatic(req, res, urlPath) {
  const rel = urlPath === '/' ? 'index.html' : urlPath.slice(1);
  const target = path.resolve(PUBLIC_DIR, rel);
  if (!target.startsWith(PUBLIC_DIR + path.sep) && target !== PUBLIC_DIR) {
    return json(res, 403, { error: 'forbidden' });
  }
  fs.readFile(target, (err, data) => {
    if (err) return json(res, 404, { error: 'not found' });

    // no-cache = browsers may cache but must revalidate, so every update to
    // the app reaches every client on the next load — no more stale-asset
    // mismatches after an upgrade. Unchanged files answer 304 via the ETag.
    const etag = `"${crypto.createHash('sha1').update(data).digest('base64url')}"`;
    const headers = {
      'Content-Type': MIME[path.extname(target)] || 'application/octet-stream',
      'Cache-Control': 'no-cache',
      'X-Content-Type-Options': 'nosniff',
      ETag: etag,
    };
    if (target.endsWith('.html')) {
      headers['Content-Security-Policy'] =
        "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; base-uri 'none'; frame-ancestors 'none'";
    }
    if (req.headers['if-none-match'] === etag) {
      res.writeHead(304, headers);
      return res.end();
    }
    res.writeHead(200, headers);
    res.end(req.method === 'HEAD' ? undefined : data);
  });
}

function authed(req) {
  const header = req.headers.authorization || '';
  return verifyToken(header.replace(/^Bearer\s+/i, ''));
}

// Throttle repeated failed sign-ins per client address: after 10 wrong
// passwords, that address is locked out of auth endpoints for 15 minutes.
const authFailures = new Map();
const MAX_FAILURES = 10;
const BLOCK_MS = 15 * 60 * 1000;

function authBlocked(req) {
  const entry = authFailures.get(req.socket.remoteAddress);
  if (!entry) return false;
  if (entry.blockedUntil && entry.blockedUntil <= Date.now()) {
    authFailures.delete(req.socket.remoteAddress);
    return false;
  }
  return Boolean(entry.blockedUntil);
}

function recordAuthFailure(req) {
  const ip = req.socket.remoteAddress;
  const entry = authFailures.get(ip) || { count: 0, blockedUntil: 0 };
  entry.count += 1;
  entry.seenAt = Date.now();
  if (entry.count >= MAX_FAILURES) {
    entry.blockedUntil = Date.now() + BLOCK_MS;
    entry.count = 0;
  }
  authFailures.set(ip, entry);
}

// Sweep stale throttle entries so the maps never grow unbounded.
setInterval(() => {
  const now = Date.now();
  for (const [ip, e] of authFailures) {
    if (e.blockedUntil < now && (e.seenAt || 0) < now - 60 * 60 * 1000) authFailures.delete(ip);
  }
  for (const [ip, e] of signupCounts) {
    if (e.resetAt <= now) signupCounts.delete(ip);
  }
}, 30 * 60 * 1000).unref();

// At most 5 new accounts per address per hour — generous for a cohort of real
// people, a wall for anything scripted.
const signupCounts = new Map();
const SIGNUP_LIMIT = 5;
const SIGNUP_WINDOW_MS = 60 * 60 * 1000;

function signupBlocked(req) {
  const ip = req.socket.remoteAddress;
  const entry = signupCounts.get(ip);
  if (!entry || entry.resetAt <= Date.now()) return false;
  return entry.count >= SIGNUP_LIMIT;
}

function recordSignup(req) {
  const ip = req.socket.remoteAddress;
  const entry = signupCounts.get(ip);
  if (!entry || entry.resetAt <= Date.now()) {
    signupCounts.set(ip, { count: 1, resetAt: Date.now() + SIGNUP_WINDOW_MS });
  } else {
    entry.count += 1;
  }
}

const routes = {
  'POST /api/auth/signup': async (req, res) => {
    if (signupBlocked(req)) {
      return json(res, 429, { error: 'too many accounts created from this device — try again in an hour' });
    }
    const { email, password, name } = await readBody(req);
    if (!email || !password || !name) return json(res, 400, { error: 'email, password and name are required' });
    if (String(password).length < 8) return json(res, 400, { error: 'password must be at least 8 characters' });
    if (String(password).length > 200) return json(res, 400, { error: 'password must be at most 200 characters' });
    if (String(name).trim().length > 100) return json(res, 400, { error: 'name must be at most 100 characters' });

    const normalized = String(email).trim().toLowerCase();
    if (normalized.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
      return json(res, 400, { error: 'enter a valid email address' });
    }

    const db = loadDB();
    if (db.users.some((u) => u.email === normalized)) {
      return json(res, 409, { error: 'an account with that email already exists' });
    }

    const { salt, hash } = hashPassword(String(password));
    const user = {
      id: crypto.randomUUID(),
      email: normalized,
      name: String(name).trim(),
      salt,
      hash,
      createdAt: new Date().toISOString(),
      startDate: new Date().toISOString().slice(0, 10),
    };
    db.users.push(user);
    db.activities[user.id] = {};
    saveDB(db);
    recordSignup(req);

    json(res, 201, {
      token: sign({ id: user.id, exp: Date.now() + 30 * 864e5 }),
      user: { id: user.id, email: user.email, name: user.name, startDate: user.startDate },
    });
  },

  'POST /api/auth/login': async (req, res) => {
    if (authBlocked(req)) {
      return json(res, 429, { error: 'too many failed attempts — try again in 15 minutes' });
    }
    const { email, password } = await readBody(req);
    if (String(password || '').length > 200) {
      recordAuthFailure(req);
      return json(res, 401, { error: 'invalid email or password' });
    }
    const db = loadDB();
    const user = db.users.find((u) => u.email === String(email || '').trim().toLowerCase());
    if (!user || !verifyPassword(String(password || ''), user.salt, user.hash)) {
      recordAuthFailure(req);
      return json(res, 401, { error: 'invalid email or password' });
    }
    authFailures.delete(req.socket.remoteAddress);
    json(res, 200, {
      token: sign({ id: user.id, exp: Date.now() + 30 * 864e5 }),
      user: { id: user.id, email: user.email, name: user.name, startDate: user.startDate },
    });
  },

  'GET /api/me': (req, res) => {
    const session = authed(req);
    if (!session) return json(res, 401, { error: 'unauthorized' });
    const db = loadDB();
    const user = db.users.find((u) => u.id === session.id);
    if (!user) return json(res, 401, { error: 'unauthorized' });
    json(res, 200, { id: user.id, email: user.email, name: user.name, startDate: user.startDate });
  },

  'GET /api/lesson': (req, res) => {
    const session = authed(req);
    if (!session) return json(res, 401, { error: 'unauthorized' });

    const day = Number(new URL(req.url, 'http://localhost').searchParams.get('day'));
    if (!Number.isInteger(day) || day < 1 || day > 30) {
      return json(res, 400, { error: 'day must be an integer between 1 and 30' });
    }

    const db = loadDB();
    if (!lessonUnlocked(db.activities[session.id], day)) {
      return json(res, 403, { locked: true, error: `day ${day} is locked — finish reading day ${day - 1}'s lesson first` });
    }

    const file = LESSON_FILES[day];
    if (!file) return json(res, 404, { error: `no lesson file found for day ${day}` });
    fs.readFile(file, 'utf8', (err, markdown) => {
      if (err) return json(res, 500, { error: 'could not read lesson file' });
      json(res, 200, { day, markdown });
    });
  },

  'POST /api/lesson/read': async (req, res) => {
    const session = authed(req);
    if (!session) return json(res, 401, { error: 'unauthorized' });

    const { day } = await readBody(req);
    const dayNum = Number(day);
    if (!Number.isInteger(dayNum) || dayNum < 1 || dayNum > 30) {
      return json(res, 400, { error: 'day must be an integer between 1 and 30' });
    }

    const db = loadDB();
    const bucket = (db.activities[session.id] ||= {});
    if (!lessonUnlocked(bucket, dayNum)) {
      return json(res, 403, { locked: true, error: `day ${dayNum} is locked — finish reading day ${dayNum - 1}'s lesson first` });
    }

    const existing = bucket[dayNum] || { day: dayNum, tasks: {}, minutes: 0, reflection: {}, confidence: null };
    existing.lessonRead = true;
    existing.lessonReadAt ||= new Date().toISOString();
    existing.readPct = 100;
    existing.updatedAt = new Date().toISOString();
    bucket[dayNum] = existing;
    saveDB(db);
    json(res, 200, existing);
  },

  'GET /api/activities': (req, res) => {
    const session = authed(req);
    if (!session) return json(res, 401, { error: 'unauthorized' });
    const db = loadDB();
    json(res, 200, db.activities[session.id] || {});
  },

  'PUT /api/activities': async (req, res) => {
    const session = authed(req);
    if (!session) return json(res, 401, { error: 'unauthorized' });

    const { day, patch } = await readBody(req);
    const dayNum = Number(day);
    if (!Number.isInteger(dayNum) || dayNum < 1 || dayNum > 30) {
      return json(res, 400, { error: 'day must be an integer between 1 and 30' });
    }
    if (!patch || typeof patch !== 'object') return json(res, 400, { error: 'patch object required' });

    // Validate before touching the store: only known task keys (coerced to
    // booleans), only known reflection keys, confidence must be 1–5 or null.
    let tasks;
    if ('tasks' in patch) {
      if (!patch.tasks || typeof patch.tasks !== 'object') return json(res, 400, { error: 'tasks must be an object' });
      tasks = {};
      for (const key of TASK_KEYS) if (key in patch.tasks) tasks[key] = Boolean(patch.tasks[key]);
    }

    let reflection;
    if ('reflection' in patch) {
      if (!patch.reflection || typeof patch.reflection !== 'object') return json(res, 400, { error: 'reflection must be an object' });
      reflection = {};
      for (const key of REFLECTION_KEYS) {
        if (key in patch.reflection) reflection[key] = String(patch.reflection[key]).slice(0, 5000);
      }
    }

    let confidence;
    if ('confidence' in patch) {
      confidence = patch.confidence === null ? null : Number(patch.confidence);
      if (confidence !== null && !(Number.isInteger(confidence) && confidence >= 1 && confidence <= 5)) {
        return json(res, 400, { error: 'confidence must be an integer 1-5 or null' });
      }
    }

    // Reading progress is a high-water mark; lessonRead itself is only ever
    // set through POST /api/lesson/read so the unlock chain stays honest.
    let readPct;
    if ('readPct' in patch) {
      readPct = Number(patch.readPct);
      if (!(Number.isInteger(readPct) && readPct >= 0 && readPct <= 100)) {
        return json(res, 400, { error: 'readPct must be an integer 0-100' });
      }
    }

    const db = loadDB();
    const bucket = (db.activities[session.id] ||= {});
    const existing = bucket[dayNum] || { day: dayNum, tasks: {}, minutes: 0, reflection: {}, confidence: null };

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

    merged.completed = TASK_KEYS.every((key) => Boolean(merged.tasks?.[key]));
    if (merged.completed && !existing.completedAt) merged.completedAt = new Date().toISOString();
    if (!merged.completed) delete merged.completedAt;

    bucket[dayNum] = merged;
    saveDB(db);
    json(res, 200, merged);
  },

  'GET /api/export': (req, res) => {
    const session = authed(req);
    if (!session) return json(res, 401, { error: 'unauthorized' });
    const db = loadDB();
    const user = db.users.find((u) => u.id === session.id);
    const body = JSON.stringify(
      { exportedAt: new Date().toISOString(), user: { email: user.email, name: user.name }, activities: db.activities[session.id] || {} },
      null,
      2
    );
    res.writeHead(200, {
      'Content-Type': 'application/json',
      'Content-Disposition': 'attachment; filename="git-challenge-progress.json"',
    });
    res.end(body);
  },
};

const server = http.createServer(async (req, res) => {
  const urlPath = new URL(req.url, 'http://localhost').pathname;
  const handler = routes[`${req.method} ${urlPath}`];

  if (handler) {
    try {
      await handler(req, res);
    } catch (err) {
      if (!res.headersSent) json(res, 400, { error: err.message });
    }
    return;
  }

  if (urlPath.startsWith('/api/')) return json(res, 404, { error: 'not found' });
  if (req.method !== 'GET' && req.method !== 'HEAD') return json(res, 405, { error: 'method not allowed' });
  serveStatic(req, res, urlPath);
});

// Bind to every interface so others on the same network can reach the tracker.
// Set HOST=127.0.0.1 to go back to this-machine-only.
const HOST = process.env.HOST || '0.0.0.0';

function lanAddresses() {
  return Object.values(os.networkInterfaces())
    .flat()
    .filter((n) => n && n.family === 'IPv4' && !n.internal)
    .map((n) => n.address);
}

// The launcher sets OPEN_BROWSER=1. Opening from here — inside the listen
// callback — means the port is already accepting connections, so there is no
// race to lose. Running `node server.js` by hand opens nothing.
function openBrowser(url) {
  const command = process.platform === 'win32' ? `start "" "${url}"`
    : process.platform === 'darwin' ? `open "${url}"`
    : `xdg-open "${url}"`;
  exec(command, { shell: true }, (err) => {
    if (err) console.log(`  (could not open a browser automatically - visit ${url})`);
  });
}

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n  The tracker is already running (port ${PORT} is in use).`);
    console.error(`  Use the window that is already open, or close it and run this again.\n`);
  } else {
    console.error(`\n  Could not start the server: ${err.message}\n`);
  }
  process.exit(1);
});

server.listen(PORT, HOST, () => {
  // Plain ASCII only in console output: the Windows console renders UTF-8
  // arrows as mojibake, and this banner is the first thing every user sees.
  console.log(`\n  Git Challenge Tracker`);
  console.log(`  -> http://localhost:${PORT}      (this computer)`);

  if (HOST === '127.0.0.1') {
    console.log(`\n  Local only. Set HOST=0.0.0.0 to share on your network.`);
  } else {
    for (const address of lanAddresses()) {
      console.log(`  -> http://${address}:${PORT}   (share this one)`);
    }
    console.log(`\n  Reachable by anyone on this network. Traffic is not encrypted,`);
    console.log(`  so use it on trusted wifi only. Ctrl+C stops the server.`);
  }

  console.log(`\n  data: ${DB_FILE}\n`);

  if (process.env.OPEN_BROWSER === '1') openBrowser(`http://localhost:${PORT}`);
});
