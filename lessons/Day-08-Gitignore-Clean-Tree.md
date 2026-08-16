# Day 8: .gitignore & a Clean Working Tree

> Phase 1 · Git Fundamentals · 90 minutes
> **Goal:** Keep secrets and build artifacts out of history, and untrack what slipped in.

---

## 🎯 Learning Objective

Decide what belongs in history — and enforce it automatically.

**Success criteria**
- ✅ Write ignore patterns: exact, wildcard, directory, and negation
- ✅ Untrack an already-committed file without deleting it from disk
- ✅ Explain why ignoring a tracked file does nothing (the #1 gitignore confusion)

---

## 🧠 Concept (5 min)

Three kinds of files live in a project:

1. **Source** — code, docs, config templates → committed
2. **Generated** — builds, logs, caches, `node_modules/` → recreatable, never committed
3. **Secret** — passwords, API keys, `.env` → NEVER committed (history is forever —
   deleting a secret in a later commit does not remove it from earlier ones)

`.gitignore` is a text file of patterns. Files matching a pattern are invisible to
`git add .` and `git status`.

**The rule everyone learns the hard way:** `.gitignore` only affects **untracked**
files. Once a file is committed, Git tracks it forever — adding it to `.gitignore`
changes nothing. You must *untrack* it first (`git rm --cached`), and its past
versions remain in history regardless.

```
 pattern            matches
 secret.txt         that name, anywhere in the repo
 /secret.txt        only at the repo root
 *.log              every .log file
 build/             the whole directory
 doc/*.pdf          pdfs directly in doc/
 **/temp            any directory named temp, any depth
 !keep.log          EXCEPTION — do track this one (order matters: after *.log)
```

---

## 🚶 Guided Walkthrough (15 min)

```bash
mkdir day8-ignore && cd day8-ignore && git init
echo code > app.js
echo "PASSWORD=hunter2" > .env
echo "debug line" > debug.log
mkdir build && echo compiled > build/out.js
git status                          # everything untracked, including the secret
```

### 1. Write the ignore file

```bash
cat > .gitignore << 'EOF'
# secrets
.env

# generated
*.log
build/
EOF
git status
```

Only `app.js` and `.gitignore` remain visible. `git add .` is now safe.

```bash
git add . && git commit -m "Init with ignore rules"
```

**Commit `.gitignore` itself** — it's team policy, everyone needs it.

### 2. Verify and debug patterns

```bash
git check-ignore -v .env build/out.js
```

Shows exactly which file, line, and pattern matched — the debugger for "why is/isn't
this ignored?"

```bash
git status --ignored               # see what's being hidden
```

### 3. The trap, on purpose

```bash
echo "session data" > cache.txt
git add cache.txt && git commit -m "Oops, committed cache"
echo "cache.txt" >> .gitignore
git commit -am "Ignore cache.txt"
echo "more data" >> cache.txt
git status                          # cache.txt: modified — STILL TRACKED
```

Ignoring did nothing. Now the real fix:

```bash
git rm --cached cache.txt           # untrack; file stays on disk
git commit -m "Stop tracking cache.txt"
echo again >> cache.txt
git status                          # clean — now it's ignored
ls                                  # cache.txt still exists locally ✓
```

*(`git rm cache.txt` without `--cached` would delete it from disk too.)*

### 4. Global ignores

Editor litter (`.vscode/`, `.DS_Store`, `*.swp`) belongs in your personal global
ignore, not every project's file:

```bash
git config --global core.excludesFile ~/.gitignore_global
echo ".DS_Store" >> ~/.gitignore_global
```

---

## 🛠️ Practice (40 min)

### Exercise A — Basic (10 min)
Fresh repo. Create: `main.py`, `notes.txt`, `secret.key`, `run.log`, `error.log`,
`dist/bundle.js`, `dist/bundle.map`.
1. Write a `.gitignore` so only `main.py`, `notes.txt`, and `.gitignore` are visible
   to `git status`.
2. Prove it with `git status` and `git check-ignore -v` on each hidden file.
3. Commit.

### Exercise B — Intermediate (15 min)
Negation and depth:
1. Add `logs/app.log`, `logs/audit.log`, `src/logs/tmp.log`.
2. Requirement: ignore **all** `.log` files everywhere, EXCEPT `logs/audit.log`
   (compliance must be tracked).
3. Write the patterns (you'll need `!logs/audit.log` — and discover that if you
   ignored the whole `logs/` *directory*, the negation can't resurrect files inside
   it; you must ignore by `*.log` pattern instead. This subtlety is the exercise.)
4. Prove with `git status`: only `audit.log` from the logs shows up.

### Exercise C — Advanced (15 min)
The retrofit. Simulate an old project that never had ignore rules:
1. Create and **commit all of**: `app.js`, `.env`, `node_modules/lib.js` (fake it),
   `out.log`.
2. Now retrofit: write the proper `.gitignore`, untrack everything that shouldn't be
   tracked (files stay on disk), commit the cleanup as one commit:
   `"Add gitignore, untrack generated and secret files"`.
3. Verify: `git status` clean; edit `.env` → still clean; `ls` shows all files present.
4. Sting in the tail: `git show HEAD~1:.env` — the secret is still readable in
   history. Write one sentence on what that means for a *real* leaked password.
   *(Rotate the credential. History rewriting exists but the secret must be
   considered burned the moment it was pushed.)*

---

## 🎬 Challenge (20 min)

**Scenario:** You inherit a teammate's project. `git status` shows 40 lines of noise —
build junk, logs, an `.env`, editor folders — plus real source files. Your job:
make `git status` **useful again** in one commit, without losing anyone's local files.

```bash
mkdir inherited && cd inherited && git init
mkdir -p .vscode dist src
echo real > src/index.js
echo cfg > .vscode/settings.json
echo "API_KEY=abcd1234" > .env
echo bundle > dist/app.js && echo map > dist/app.js.map
echo log1 > npm-debug.log
echo readme > README.md
git add . && git commit -m "Everything, tragically"
echo edit >> src/index.js
echo noise >> npm-debug.log
echo tweak >> .vscode/settings.json
```

Deliver:
- `.gitignore` covering `.env`, `dist/`, all `*.log`, `.vscode/`
- The junk untracked (still on disk!), the source still tracked
- One cleanup commit with a message a reviewer would thank you for
- `git status` afterwards shows **only** `src/index.js` modified

**Success check:** run all four verifications yourself; then `git log --oneline` tells
an honest two-commit story.

---

## 🤔 Reflection (10 min) — answer in your tracker

1. What was the hardest concept today?
2. Explain to a teammate why adding a tracked file to `.gitignore` does nothing.
3. Which generated/secret files exist in your *real* projects that need this today?
4. What edge case do you still want to explore? (e.g. per-directory .gitignore files?)
5. What would raise your confidence one point?

---

## ⚠️ Common Mistakes

| Mistake | Fix |
|---|---|
| "It's in .gitignore but still shows as modified" | It's tracked. `git rm --cached <file>`, commit. |
| `git rm` deleted the actual file | You forgot `--cached`. Restore it: `git restore <file>` — wait, it's untracked now; recover from the previous commit: `git checkout HEAD~1 -- <file>` — then redo with `--cached`. |
| Ignored directory, negation won't un-ignore a child | Ignore by file pattern (`dir/*`) instead of the directory itself, then negate. |
| Secret committed and pushed | Rotate the secret immediately. Cleanup (Day 29 touches history surgery) is about hygiene, not safety — assume it was read. |

---

## 📖 Resources

- [gitignore.io](https://www.toptal.com/developers/gitignore) — generate stacks-specific templates
- [github.com/github/gitignore](https://github.com/github/gitignore) — the canonical collection
- `git help gitignore` — pattern rules, precisely

**Next up — Day 9:** Stashing — the pocket dimension for half-done work, and the end of the dirty-switch problem from Day 4.
