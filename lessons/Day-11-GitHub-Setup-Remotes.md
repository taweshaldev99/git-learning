# Day 11: GitHub Setup, SSH Keys & First Remote

> Phase 2 · GitHub Collaboration · 90 minutes
> **Goal:** Authenticate with GitHub and connect a local repo to a remote.

*(You'll need a free GitHub account and internet today — Phase 2 is the multiplayer phase.)*

---

## 🎯 Learning Objective

Get code flowing between your machine and GitHub, authenticated properly.

**Success criteria**
- ✅ SSH key created, added to GitHub, connection verified
- ✅ A local repo pushed to a new GitHub repository
- ✅ Explain what `origin` actually is (and isn't)

---

## 🧠 Concept (5 min)

Everything from Phase 1 lives in `.git` on your disk. A **remote** is just another
copy of that repository somewhere else — on GitHub's servers — that your local repo
knows by a nickname.

```
  your machine                         github.com
 ┌───────────────┐    git push       ┌────────────────┐
 │ repo (.git)   │ ────────────────▶ │ repo (bare)     │
 │               │ ◀──────────────── │ "origin"        │
 └───────────────┘  git fetch/pull   └────────────────┘
```

- `origin` = the conventional nickname for "the main remote." Not magic, not
  special — a saved URL with a short name. You could call it `github` or `backup`.
- GitHub adds things *around* the repo: issues, pull requests, permissions, CI.
  The Git data itself is the same objects you've been making all week.

**Authentication:** GitHub stopped accepting passwords for Git operations. Two
options: **SSH keys** (a keypair; public half uploaded to GitHub — today's method,
set up once, works forever) or **HTTPS + credential manager** (fine too; if
`git push` over HTTPS opens a browser login and works, you're already set).

---

## 🚶 Guided Walkthrough (15 min)

### 1. Create your identity key (skip if `ls ~/.ssh` shows `id_ed25519.pub`)

```bash
ssh-keygen -t ed25519 -C "your-email@example.com"
# Enter to accept the default path; passphrase optional (recommended)
```

### 2. Give GitHub the PUBLIC half

```bash
cat ~/.ssh/id_ed25519.pub     # copy the whole line, starts with ssh-ed25519
```

GitHub → profile photo → **Settings → SSH and GPG keys → New SSH key** → paste → save.
*(Private key never leaves your machine. Anyone asking for the file without `.pub` is
attacking you.)*

### 3. Verify

```bash
ssh -T git@github.com
# "Hi <username>! You've successfully authenticated..." = done
```

*(First time asks to trust github.com's fingerprint — yes.)*

### 4. Local repo → GitHub

```bash
mkdir day11-remote && cd day11-remote && git init
echo "# Day 11" > README.md && git add . && git commit -m "Init"
```

On GitHub: **+ → New repository** → name `day11-remote` → **no** README/license
(the repo must be empty; your local one is the truth) → create. Copy the SSH URL
(`git@github.com:you/day11-remote.git`). Then:

```bash
git remote add origin git@github.com:YOU/day11-remote.git
git remote -v                      # fetch + push URLs listed
git push -u origin main
```

`-u` links local `main` to `origin/main` so future pushes are just `git push`.
Refresh the GitHub page — your commit is there. That's the whole magic trick.

### 5. Round-trip check

```bash
echo "line from laptop" >> README.md
git commit -am "Update from laptop"
git push
```

Then edit README **on GitHub** (pencil icon → commit there), and:

```bash
git pull
cat README.md          # both lines present — full round trip
git log --oneline      # GitHub's web commit is now local history
```

---

## 🛠️ Practice (40 min)

### Exercise A — Basic (10 min)
1. Push your Phase-1 `recipe-box` capstone repo (or any Day 1–9 repo) to a new GitHub
   repository.
2. On GitHub, click around: Commits view (your Day 10 history!), a file's **Blame**
   view, the branch dropdown. Find the diff view for one of your merge commits.

### Exercise B — Intermediate (15 min)
Remote bookkeeping:
1. `git remote rename origin github` — everything still works? Push to prove it.
   Rename back.
2. Add a *second* remote pointing at any URL (`git remote add backup <url>` — fake is
   fine), list both, then remove it. When would two remotes be real?
   *(Preview: forks, Day 13.)*
3. Run `git branch -vv` and read what `[origin/main]` next to your branch means.
4. `git remote show origin` — read the whole report; note the "local out of date"
   line's meaning.

### Exercise C — Advanced (15 min)
Understand `origin/main` as a real thing:
1. `git log --oneline --all --decorate` — find `origin/main`. It's a **remote-tracking
   branch**: your local, read-only bookmark of "where the remote was, last time we talked."
2. Commit locally WITHOUT pushing. `git status` → "ahead of 'origin/main' by 1
   commit". The bookmark didn't move; your branch did.
3. Push. Run status again. Explain in one sentence what `push` did to the bookmark.
4. Make a commit on GitHub's web editor. Locally run `git fetch` (not pull!) —
   status now says "behind." Where is the web commit sitting right now?
   (`git log origin/main` shows it; your `main` doesn't have it yet — that's
   tomorrow's whole lesson.)

---

## 🎬 Challenge (20 min)

**Scenario:** Your machine and "a second machine" (simulate with a second folder).
Prove you can move work through GitHub as a hub — the daily reality of work laptop +
home laptop.

1. Clone your `day11-remote` repo into a *sibling folder* as if it were another
   computer: `cd .. && git clone git@github.com:YOU/day11-remote.git laptop-b`
2. In `laptop-b`: add a file `from-b.txt`, commit, push.
3. In the original folder: pull; verify `from-b.txt` arrived.
4. In the original: create branch `feature-x` with one commit and push it
   (`git push -u origin feature-x`).
5. In `laptop-b`: fetch, then `git switch feature-x` (watch it wire up to the remote
   branch automatically), add a commit, push.
6. Back in the original: pull on `feature-x`; verify the round trip.

**Success:** both folders show identical `git log --oneline --all` for main and
feature-x; you can narrate every arrow of the flow diagram from the concept section.

---

## 🤔 Reflection (10 min) — answer in your tracker

1. What was the hardest concept today?
2. Explain `origin` and `origin/main` in your own words (they're different things!).
3. Which of your real projects should be on GitHub by end of week?
4. What edge case do you still want to explore? (e.g. what if the GitHub repo *wasn't* empty at connect time?)
5. What would raise your confidence one point?

---

## ⚠️ Common Mistakes

| Mistake | Fix |
|---|---|
| `Permission denied (publickey)` | Key not added to GitHub, or ssh-agent doesn't have it: `eval "$(ssh-agent -s)" && ssh-add ~/.ssh/id_ed25519`, retest `ssh -T`. |
| `failed to push... rejected (fetch first)` | You created the GitHub repo WITH a README — remote has a commit you lack. `git pull --rebase origin main` then push (Day 12 explains the machinery). |
| `remote origin already exists` | `git remote set-url origin <url>` to change it, or `remote remove` then re-add. |
| Pushed but nothing on GitHub | Check `git remote -v` (right repo?) and the branch name you pushed vs the one GitHub shows by default. |

---

## 📖 Resources

- [GitHub Docs: Connecting with SSH](https://docs.github.com/en/authentication/connecting-to-github-with-ssh)
- Book: [Working with Remotes](https://git-scm.com/book/en/v2/Git-Basics-Working-with-Remotes)

**Next up — Day 12:** `push`, `pull`, `fetch` — what each one *actually* moves, so you can predict instead of pray.
