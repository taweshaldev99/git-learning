/* Assembles the static build into tracker-static/dist.

   Output is a plain folder of files - no server, no database, no build system
   on Cloudflare's side. Contents:

     index.html      copied from tracker-backend/public, with one <script> added
     local-api.js    the localStorage-backed stand-in for the API
     lessons/day-NN.md   the 30 lessons, renamed so the path is derivable
     _headers        the same CSP the Node server sent

   Run: npm run build
*/

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const STATIC_DIR = path.join(HERE, '..');
const REPO = path.join(STATIC_DIR, '..');

const PUBLIC_SRC = path.join(REPO, 'tracker-backend', 'public');
const LESSONS_SRC = path.join(REPO, 'lessons');
const SHIM = path.join(STATIC_DIR, 'src', 'local-api.js');
const DIST = path.join(STATIC_DIR, 'dist');

for (const [label, dir] of [['frontend', PUBLIC_SRC], ['lessons', LESSONS_SRC]]) {
  if (!fs.existsSync(dir)) {
    console.error(`build failed: no ${label} at ${dir}`);
    process.exit(1);
  }
}

/* --------------------------------- clean --------------------------------- */

// Empty the folder rather than deleting it: on Windows a running dev server
// holds a handle on dist/, and removing the directory itself then fails EPERM.
if (fs.existsSync(DIST)) {
  for (const entry of fs.readdirSync(DIST)) {
    try {
      fs.rmSync(path.join(DIST, entry), { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
    } catch (err) {
      console.warn(`  warning: could not remove dist/${entry} (${err.code}) - overwriting instead`);
    }
  }
}
fs.mkdirSync(DIST, { recursive: true });

/* -------------------------------- frontend ------------------------------- */

fs.cpSync(PUBLIC_SRC, DIST, { recursive: true });
fs.copyFileSync(SHIM, path.join(DIST, 'local-api.js'));

// local-api.js must replace window.fetch before app.js issues its first call.
const indexFile = path.join(DIST, 'index.html');
const html = fs.readFileSync(indexFile, 'utf8');
const anchor = '<script src="curriculum.js"></script>';
if (!html.includes(anchor)) {
  console.error(`build failed: could not find ${anchor} in index.html`);
  process.exit(1);
}
fs.writeFileSync(
  indexFile,
  html.replace(anchor, '<script src="local-api.js"></script>\n' + anchor)
);

/* -------------------------------- lessons -------------------------------- */

// Renamed to day-NN.md so local-api.js can build the path from the day number
// without shipping a manifest.
const lessonsOut = path.join(DIST, 'lessons');
fs.mkdirSync(lessonsOut, { recursive: true });

let copied = 0;
const found = new Set();
for (const file of fs.readdirSync(LESSONS_SRC).sort()) {
  const match = /^Day-(\d{2})-.*\.md$/.exec(file);
  if (!match) continue;
  const day = Number(match[1]);
  fs.copyFileSync(path.join(LESSONS_SRC, file), path.join(lessonsOut, `day-${match[1]}.md`));
  found.add(day);
  copied++;
}

if (!copied) {
  console.error(`build failed: no Day-NN-*.md files in ${LESSONS_SRC}`);
  process.exit(1);
}

const missing = [];
for (let day = 1; day <= 30; day++) if (!found.has(day)) missing.push(day);
if (missing.length) console.warn(`  warning: no lesson file for day(s) ${missing.join(', ')}`);

/* -------------------------------- headers -------------------------------- */

// The Node server set these in code. On a static host they come from _headers,
// which Cloudflare Pages reads as configuration and does not serve.
fs.writeFileSync(
  path.join(DIST, '_headers'),
  `/*
  X-Content-Type-Options: nosniff
  Referrer-Policy: no-referrer
  Strict-Transport-Security: max-age=31536000; includeSubDomains
  Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'

/lessons/*
  Content-Type: text/markdown; charset=utf-8
`
);

/* --------------------------------- 404 ----------------------------------- */

// Without this, Cloudflare Pages answers every unknown path with index.html and
// a 200, so a typo silently boots the whole app instead of reporting a bad URL.
fs.writeFileSync(
  path.join(DIST, '404.html'),
  `<!doctype html>
<html lang="en" data-theme="dark">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Not found — Git Challenge Tracker</title>
  <link rel="stylesheet" href="/styles.css">
</head>
<body style="display:grid;place-items:center;min-height:100vh;margin:0;text-align:center">
  <div style="padding:32px">
    <p style="font-size:13px;letter-spacing:.08em;text-transform:uppercase;color:var(--text-mute)">Error 404</p>
    <h1 style="margin:8px 0 12px">That page does not exist</h1>
    <p style="color:var(--text-mute);margin:0 0 24px">The tracker lives at the root of this site.</p>
    <a href="/" style="color:var(--green)">Back to the tracker</a>
  </div>
</body>
</html>
`
);

console.log(`  lessons copied: ${copied}`);
console.log(`  output:         ${path.relative(REPO, DIST)}`);
