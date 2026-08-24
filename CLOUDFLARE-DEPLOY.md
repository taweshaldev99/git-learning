# Deploying the Git Challenge Tracker to Cloudflare

The tracker now has two ways to run:

| | Local (`start-tracker.bat`) | Cloudflare (`tracker-worker/`) |
|---|---|---|
| Runtime | Node.js HTTP server | Cloudflare Worker |
| Data | `data/db.json` | D1 database |
| Lessons | read from `lessons/*.md` at request time | bundled into the Worker at build time |
| Frontend | served from `tracker-backend/public` | same files, uploaded as Workers static assets |
| Cost | free | free tier is enough |

**Nothing about the local setup changed.** `start-tracker.bat` still works exactly as before. The Cloudflare build reads the *same* `lessons/` and the *same* `tracker-backend/public`, so a lesson edit ships to both.

---

## Why the first attempt failed

Cloudflare does not run a Node process. It runs a V8 isolate that answers `fetch()` events, and that isolate has:

- **no filesystem** — `fs.readFileSync`, `data/db.json`, `data/.secret`, `lessons/*.md` all fail
- **no listening sockets** — `http.createServer(...).listen(5000)` has no meaning
- **no `child_process` / `os`** — the browser-opener and the LAN-address banner cannot run
- **no `crypto.scryptSync`** — Workers ship WebCrypto, which has no scrypt
- **no shared memory between requests** — the `Map`-based rate limiters would reset constantly
- **10ms of CPU per request on the Free plan** — expensive password hashing has to be tuned to fit

`tracker-backend/server.js` uses all six. That is the restriction you hit — it was never a Cloudflare configuration problem. `tracker-worker/` is the same API rewritten against what the platform does offer.

| Old | New |
|---|---|
| `data/db.json` | D1 tables `users`, `activities` |
| `data/.secret` | `SESSION_SECRET` Worker secret |
| `lessons/*.md` read per request | bundled into `src/lessons.generated.js` at build time |
| `crypto.scryptSync` | PBKDF2-SHA256 via WebCrypto |
| in-memory rate-limit `Map`s | D1 `throttle` table, swept hourly by a cron trigger |
| `serveStatic()` + CSP header in code | Workers static assets + a generated `_headers` file |

The API paths, request bodies, responses and the sequential lesson gating are unchanged, so `public/app.js` needed no edits at all.

---

## Deploy

All commands run **inside `tracker-worker/`**.

```bash
cd tracker-worker
npm install
npx wrangler login
```

### Fast path — one command

```powershell
npm run setup
```

[scripts/setup-and-deploy.ps1](tracker-worker/scripts/setup-and-deploy.ps1) does steps 1–3 below in order and skips anything already done, so it is safe to re-run. It creates the D1 database, writes the real `database_id` into `wrangler.jsonc`, loads `schema.sql`, builds, deploys, then generates and stores `SESSION_SECRET`. It never touches the Git-connected dashboard project, so a wrong framework preset there cannot break it.

Windows PowerShell. On any other OS, run the three steps below by hand — they are the same thing.

### 1. Create the database

```bash
npx wrangler d1 create git-challenge-tracker
```

It prints a `database_id`. Open [tracker-worker/wrangler.jsonc](tracker-worker/wrangler.jsonc) and paste it over `PASTE_YOUR_D1_DATABASE_ID_HERE`.

Create the tables:

```bash
npm run db:init
```

### 2. Set the session secret

This signs login tokens. Any long random string; losing it just signs everyone out.

```bash
npx wrangler secret put SESSION_SECRET
```

Generate one to paste in:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

### 3. Deploy

```bash
npm run deploy
```

`npm run deploy` runs the build first, which regenerates `dist/public` and `src/lessons.generated.js`. **Always deploy through this script**, never bare `wrangler deploy`, or you ship stale lessons.

You get a `https://git-challenge-tracker.<your-subdomain>.workers.dev` URL. Sign up there and confirm it works before attaching your domain.

### 4. Your own domain

Your domain must already be a zone in the same Cloudflare account (added at **Add a site**, with your registrar's nameservers pointed at Cloudflare).

Then uncomment the `routes` block at the bottom of `wrangler.jsonc` and set your hostname:

```jsonc
"routes": [
  { "pattern": "tracker.yourdomain.com", "custom_domain": true }
]
```

```bash
npm run deploy
```

`custom_domain: true` makes wrangler create the DNS record and the certificate for you. An apex domain (`yourdomain.com`) works the same way. First issue takes a few minutes.

Dashboard alternative: **Workers & Pages → git-challenge-tracker → Settings → Domains & Routes → Add → Custom domain**.

---

## Push-to-deploy from Git (optional)

Skip this if `npm run deploy` from your own machine is enough. That path needs no dashboard settings at all and is the one to use if you just want the site up.

If you connected the repo in the dashboard and the build died with:

```
Error: > Couldn't find any `pages` or `app` directory. Please create one under the project root
```

that is **Next.js** talking, not Cloudflare. The project was created with the **Next.js framework preset**, so the build runner executed `next build` at the repo root. There is no Next app in this repo and there never will be — nothing in the code is wrong. The project was created as the wrong type.

**This repo is a Worker, not a Pages site.** Pages cannot host it as-is: it needs a D1 binding, a static-assets binding and a cron trigger, and [tracker-worker/wrangler.jsonc](tracker-worker/wrangler.jsonc) declares all three. Recreate it properly:

1. Delete the broken project — **Workers & Pages → the project → Settings → Delete**.
2. **Workers & Pages → Create → Workers → Import a repository**, and pick this repo.
3. Where it offers a framework preset, choose **none**.
4. Settings → **Build**:

   | Field | Value |
   |---|---|
   | Framework preset | *(none)* |
   | Root directory | `/tracker-worker` |
   | Build command | `npm run build` |
   | Deploy command | `npx wrangler deploy` |

   The root [package.json](package.json) forwards both scripts into `tracker-worker/`, so leaving **Root directory** at `/` with the same two commands works as well.

5. Settings → **Variables and Secrets** → add `SESSION_SECRET`, type **Secret**. The build runner cannot run `wrangler secret put` on your behalf.
6. `database_id` in `wrangler.jsonc` has to be your real id **and committed**. Cloudflare builds the commit, so the placeholder fails there exactly as it does locally.

After that, every push to `main` builds and deploys. The D1 database and the secret are account resources — they survive deleting and recreating the project, so steps 1–2 cost you no data.

---

## Bringing your existing progress across

You have one real account in `data/db.json`. Progress migrates cleanly; the password cannot, because the stored hash is scrypt and Workers cannot compute scrypt.

```bash
node scripts/migrate-db.mjs
npx wrangler d1 execute git-challenge-tracker --remote --file=./migrate.sql
node scripts/set-password.mjs dev2sl.py@gmail.com "a password you choose"
npx wrangler d1 execute git-challenge-tracker --remote --file=./set-password.sql
rm set-password.sql migrate.sql
```

Delete `set-password.sql` when it has run — it is a live credential. Both files are git-ignored.

The alternative, if you would rather start clean: skip this entirely and sign up again on the deployed site.

---

## Running it locally against the real Worker code

```bash
cp .dev.vars.example .dev.vars     # then edit SESSION_SECRET
npm run db:init:local
npm run dev
```

This is Cloudflare's own runtime with a local SQLite D1 — it catches platform problems that `node server.js` never would. Open http://127.0.0.1:8787.

---

## Things worth knowing

**Free plan and password hashing.** The Free plan gives each request 10ms of CPU. Password hashing is the only thing in this app that gets near it, so `PBKDF2_ITERATIONS` ships at `25000` (~4ms measured). If signup or login ever returns "exceeded CPU time", lower it further. On the Workers Paid plan ($5/mo, 30s CPU) raise it to `210000` — each stored hash records its own round count, so old passwords keep working across the change.

**Free tier limits.** 100k Worker requests/day, 5GB D1 storage, 5M D1 row reads/day. A 30-day course for a handful of people is nowhere near any of them.

**Lessons stay private.** They are compiled into the Worker, not into `dist/public`, so the day-by-day unlock still holds — there is no URL that serves an unread lesson.

**Editing content.** Change `lessons/*.md` or anything in `tracker-backend/public/`, then `npm run deploy`. Never edit `tracker-worker/dist/` or `src/lessons.generated.js`; both are wiped and rebuilt on every build.

**Watching it run.** `npm run tail` streams live logs. D1 queries: `npx wrangler d1 execute git-challenge-tracker --remote --command "SELECT email, start_date FROM users"`.

**Backups.** `npx wrangler d1 export git-challenge-tracker --remote --output backup.sql`.

---

## Troubleshooting

| Symptom | Cause |
|---|---|
| Dashboard build: `Couldn't find any pages or app directory` | project was created with the Next.js preset — recreate it as a Worker, see [Push-to-deploy from Git](#push-to-deploy-from-git-optional) |
| Dashboard build: `next build` / `npm ci` runs at all | wrong root directory or a framework preset is still set |
| `Couldn't find a D1 DB with the name or binding` | `database_id` in `wrangler.jsonc` is still the placeholder |
| `server not configured: run npx wrangler secret put SESSION_SECRET` | secret not set for this Worker |
| `no such table: users` | `npm run db:init` not run (or run against `--local` only) |
| `Worker exceeded CPU time limit` on signup/login | lower `PBKDF2_ITERATIONS`, then redeploy |
| Custom domain 522/pending | zone not active in this Cloudflare account yet, or certificate still issuing |
| Old lesson text after a deploy | deployed with bare `wrangler deploy`; use `npm run deploy` |
