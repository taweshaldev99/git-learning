# Static deploy — Cloudflare Pages, no server at all

The simplest way to get the tracker on the internet. No database, no secret, no build system on Cloudflare's side, no framework preset that can be set wrong. You upload a folder of files and you are done.

If you want real accounts and progress that follows you between devices, use [CLOUDFLARE-DEPLOY.md](CLOUDFLARE-DEPLOY.md) instead — that one is also free.

---

## What you give up

Be clear-eyed about this before you pick it. A static host runs no code of yours, so the server side has to move into the browser.

| | Worker build | Static build |
|---|---|---|
| Where progress lives | D1 database | this browser's localStorage |
| Same progress on phone and laptop | yes | **no** |
| Clearing site data | harmless | **erases your progress** |
| Accounts | real, password checked server-side | a local profile lock, per browser |
| Lesson unlock order | enforced by the server | a UI convention — the `.md` files are public |
| Cost | free | free |

The two that actually matter day to day:

**Progress is per-browser.** Nothing syncs. Use **Export progress** in the sidebar as your backup — it downloads a JSON file with everything.

**The unlock chain is honour-system.** Lessons ship as `/lessons/day-01.md` … `day-30.md`, so anyone can open day 30 in a new tab. The app still gates them in order. On your own course that costs you nothing; if it bothers you, use the Worker build.

For one person working through 30 days on one machine, this is a fair trade.

---

## How it works

`app.js` is **completely unmodified** — the same file the local Node server serves. [tracker-static/src/local-api.js](tracker-static/src/local-api.js) loads before it and replaces `window.fetch`, answering every `/api/*` call out of localStorage with a real `Response` object. Anything that is not an API call goes to the network untouched.

Every rule the server enforced still runs, just client-side: the same task and reflection key validation, the same 1–30 day range, the same 1–5 confidence check, the same `readPct` high-water mark, the same sequential unlock, the same export format. Passwords are PBKDF2-SHA256 hashed rather than stored in the clear.

`npm run build` assembles `tracker-static/dist/`:

```
index.html        with one <script src="local-api.js"> added
local-api.js      the stand-in API
app.js curriculum.js md.js styles.css fonts/
lessons/day-01.md … day-30.md
_headers          the same CSP the Node server sent
404.html          so a bad URL reports a bad URL
```

Everything is generated from `tracker-backend/public/` and `lessons/`, so editing a lesson and rebuilding ships it to all three ways of running the app.

---

## Deploy

### Easiest — drag and drop, no CLI

```bash
cd tracker-static
npm run build
```

Then in the Cloudflare dashboard: **Workers & Pages → Create → Pages → Upload assets**, name it `git-challenge-tracker`, and drag the whole `tracker-static/dist` folder in.

That's it. No Git connection, no build command, no framework preset — none of the machinery that failed before is involved.

### Or connect the Git repo

**Workers & Pages → your project → Settings → Build**, with:

| Field | Value |
|---|---|
| Framework preset | none |
| Root directory | `tracker-static` |
| Build command | `npm run build` |
| Build output directory | `dist` |

Every push to `main` then rebuilds and deploys on its own. Getting any of these wrong is what produces `Couldn't find any 'pages' or 'app' directory` — that error means the preset is still set to Next.js.

### Or from the command line

```bash
cd tracker-static
npx wrangler login
npm run create-project     # first time only
npm run deploy
```

Redeploy later with just `npm run deploy`.

### Your own domain

**Workers & Pages → git-challenge-tracker → Custom domains → Set up a domain.**

The domain has to be a zone in the same Cloudflare account already (**Add a site**, with your registrar's nameservers pointed at Cloudflare). Cloudflare creates the DNS record and the certificate; first issue takes a few minutes.

---

## Testing it before you upload

```bash
cd tracker-static
npm run dev
```

Opens on http://localhost:8080.

Use this rather than double-clicking `dist/index.html`: `crypto.subtle` only exists in a secure context, so over `file://` sign-in fails with *"this page needs https (or localhost)"*. `https://` and `http://localhost` both count as secure; a plain `http://` address on your LAN does not.

---

## Things worth knowing

**Free tier.** Pages gives unlimited requests and unlimited bandwidth on the free plan. Direct upload does not consume build minutes at all.

**Editing content.** Change `lessons/*.md` or anything in `tracker-backend/public/`, then `npm run build` and re-upload. Never edit `tracker-static/dist/` — it is wiped on every build.

**Moving to the Worker build later.** Export your progress first (sidebar → **Export progress**). The export format is identical between the two, and `tracker-worker/scripts/migrate-db.mjs` reads the same shape.

**Resetting.** Clearing site data for the domain wipes the local profile and starts fresh. There is no server-side copy to fall back on.
