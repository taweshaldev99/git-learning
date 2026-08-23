# Git Challenge Tracker — User Manual

A private activity tracker for a 30-day Git/GitHub learning challenge. Runs entirely on
one computer, stores all data locally, and needs no cloud account, no internet, and no
paid services. Several people can share one install — each gets their own login and
their own isolated progress.

---

## 1. Quick start

1. Double-click **`D:\git_learning\start-tracker.bat`**
   (or from a terminal: `cd D:\git_learning\tracker-backend` then `node server.js`).
2. Your browser opens `http://localhost:5000` a moment later.
3. First time: click **Create one**, enter a name, email, and password (8+ characters).
   You land on the dashboard immediately — no email confirmation.
4. Keep the black server window open while using the tracker. `Ctrl+C` (or closing it)
   stops the server; your data is safe either way.

**Requirement:** Node.js 18 or newer — the only thing to install. There are no
dependencies and nothing to `npm install`.

> ⚠️ **There is no password reset.** Passwords are stored one-way hashed. Write yours
> down. A forgotten password means creating a new account (or deleting
> `data\db.json` to wipe everyone and start over).

---

## 2. The 30-day challenge

30 lessons × 90 minutes across three phases:

| Phase | Days | Covers |
|---|---|---|
| 1 — Git Fundamentals | 1–10 | commits, branches, merging, undoing |
| 2 — GitHub Collaboration | 11–20 | remotes, pull requests, review, teamwork |
| 3 — Advanced Workflows | 21–30 | rebase, recovery, CI, shipping a release |

Each session is the same seven blocks (they are the day's checklist):
Concept (5 min) → Walkthrough (15) → Exercise A (10) → B (15) → C (15) →
Challenge (20) → Reflection (10). **A day counts as complete only when all seven are
ticked** — that's what drives streaks, phase totals, and milestones.

**Lesson content:** all 30 lessons live in the `lessons\` folder — one markdown file
per day, each following the same seven-block structure as the tracker's checklist,
with runnable commands, three progressive exercises, a real-world challenge, and the
five reflection questions. Open the day's file, work through it top to bottom, and
tick the tracker as you go.

---

## 3. Daily workflow

1. Open the tracker → the dashboard hero shows your next day → click **Start/Resume
   session**.
2. Optionally start the **timer** (right rail). It keeps counting even if you browse
   other pages or refresh — it belongs to the day you started it on, and the card says
   *"timing day N"* if you wander. **Add elapsed** logs the minutes to that day.
3. Work the lesson; tick each checklist block as you finish it. **Ticks save
   instantly** — there is no save button anywhere.
4. Answer the five reflection questions. They **autosave as you type** (watch the
   "Saving… → ✓ Saved" indicator).
5. Rate your confidence 1–5. Days rated 1–2 are collected under **Worth revisiting**
   in the Journal so you know what to circle back to.
6. Tick the seventh block → the progress ring pulses, the day is complete, your streak
   grows. Come back tomorrow.

When all 30 days are done the dashboard switches to a completion state with your
totals and an export shortcut.

---

## 4. The four views

- **Dashboard** — greeting, next-day hero, four stat tiles (days, streak, hours with a
  trend sparkline, avg confidence), all 30 days grouped by phase with per-day progress
  bars, pace card, and milestones.
- **Session** — one day's checklist, reflection questions, progress ring, timer, and
  confidence rating. Prev/Next moves between days; any day can be opened any time.
- **Journal** — every reflection you've written, newest first, plus the low-confidence
  "Worth revisiting" list.
- **Statistics** — completion %, total hours, best streak, a clickable 30-day progress
  map, minutes-per-session chart with the 90-minute target line, and a full session
  log table. Hover (or keyboard-focus) any bar or map cell for exact values; click one
  to open that day.

**Milestones:** nine badges unlock automatically — first commit (day 1), 5-day streak,
week one, phase completions, 10 hours, 10 journal entries, halfway, all 30.

---

## 5. Interface tips

- **Keyboard shortcuts:** `g` dashboard · `s` session · `j` journal (ignored while
  typing).
- **Theme:** moon icon next to your avatar toggles dark/light; the choice sticks.
- **Export progress:** sidebar → downloads your complete history as a JSON file.
- **Phones/tablets:** the layout adapts — navigation becomes a bottom tab bar, and all
  touch targets are sized for fingers. Same URL, nothing to configure.
- Sessions stay signed in for 30 days per browser.

---

## 6. Sharing with friends

### Same wifi (ready now)
1. Start the tracker on the host PC. The server window prints the share URL, e.g.
   `http://192.168.1.83:5000` — it can change if the router reassigns addresses, so
   trust the window, not memory.
2. Friends open that URL and create their own accounts. Progress is fully separate
   per account.
3. Works only while the host PC runs the server, and only on the same network.

This machine is already configured: `enable-lan-sharing-keep-public.ps1` (run as
admin) opened TCP 5000 inbound, restricted to your own subnet, without reclassifying
the network as trusted — so Windows keeps its guard up for everything except this one
port. Undo it with `disable-lan-sharing.ps1`.

⚠️ Because that rule applies on every network profile, it does **not** close itself
when you move to café or airport wifi. Run `disable-lan-sharing.ps1` when you leave a
network you trust. To run the server local-only without touching the firewall at all:
`HOST=127.0.0.1 node server.js`.

### Friends elsewhere
Zip the `D:\git_learning` folder **without the `data\` folder** (it contains password
hashes and the signing key — never share it) and send it. They unzip, install Node.js,
and double-click `start-tracker.bat` for their own private copy.

### Never the open internet — put it on Cloudflare instead
This Node server has no HTTPS and no password reset, so don't tunnel it through
ngrok or similar. To reach it from anywhere, deploy the Cloudflare Worker build in
`tracker-worker\` — same app, same lessons, HTTPS and your own domain:
[CLOUDFLARE-DEPLOY.md](CLOUDFLARE-DEPLOY.md). It runs alongside this local setup;
neither one affects the other.

### Built-in protections
- Wrong password 10× → that device is locked out of sign-in for 15 minutes.
- Max 5 new accounts per device per hour.
- Each account can only ever read and write its own data.

---

## 7. Your data

```
D:\git_learning\data\
  db.json     every account and all progress (plain JSON)
  .secret     signing key for login sessions
```

- **Backup** = copy `db.json` somewhere safe (or use Export for a per-user file).
- **Full reset** = delete `db.json` — all accounts and progress gone, recreated empty
  on the next signup.
- Both files are readable by anyone with access to this folder; `.gitignore` already
  excludes `data/` from any repository.

---

## 8. Troubleshooting

| Symptom | Cause / fix |
|---|---|
| Page won't load | Server not running — run `start-tracker.bat` |
| *"The tracker is already running (port 5000 is in use)"* | A server window is already open — use it, don't start a second |
| Friends can't reach the share URL | Host PC asleep, different wifi, or IP changed — check the server window for the current URL |
| *"invalid email or password"* | Wrong password. No reset exists — see §1 warning |
| *"too many failed attempts"* | 15-minute sign-in lockout after 10 wrong passwords — wait it out |
| *"too many accounts created from this device"* | 5-per-hour signup cap — wait an hour |
| *"Server unreachable — is the tracker window still open?"* toast | The server stopped mid-session — restart it; nothing typed before the last "✓ Saved" is lost |
| UI looks broken after an update | Shouldn't happen anymore (assets auto-revalidate); a plain refresh fixes any residue |

---

## 9. Customising

- **Lesson titles/goals:** edit `tracker-backend/public/curriculum.js` freely.
- **Checklist blocks:** defined in the same file. If you change their `key` values,
  update `TASK_KEYS` at the top of `tracker-backend/server.js` to match, or completion
  won't calculate.
- **Reflection questions:** same file; their keys (`q1`–`q5`) must match
  `REFLECTION_KEYS` in `server.js`.
- Restart the server after editing.

---

## 10. File layout

```
D:\git_learning\
  start-tracker.bat              launcher (double-click this)
  TRACKER-SETUP.md               this manual
  lessons\                       all 30 daily lessons (Day-01 … Day-30)
  enable-lan-sharing-keep-public.ps1   open the tracker to your wifi (admin)
  disable-lan-sharing.ps1        close it again (admin)
  tracker-backend\
    server.js                    HTTP server, auth, storage, validation
    public\
      index.html                 app shell
      styles.css                 design system (WCAG AA verified)
      app.js                     views and interactions
      curriculum.js              the 30-day plan
    test\render-test.js          run with: node test/render-test.js
  data\                          accounts + progress (created on first run)
  CLOUDFLARE-DEPLOY.md           putting it online, with your own domain
  tracker-worker\                Cloudflare Workers build of the same app
    wrangler.jsonc               Cloudflare config (database id, domain, vars)
    schema.sql                   D1 tables that replace data\db.json
    src\index.js                 the same API, rewritten for the Workers runtime
    scripts\                     build, db migration, password reset
```
