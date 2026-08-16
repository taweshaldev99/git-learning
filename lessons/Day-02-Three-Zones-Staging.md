# Day 2: The Three Zones & Staging Deep Dive

> Phase 1 · Git Fundamentals · 90 minutes
> **Goal:** Move changes deliberately between working directory, staging area, and repository.

---

## 🎯 Learning Objective

Control *exactly* what goes into each commit, even when you've changed many things at once.

**Success criteria**
- ✅ Stage some changes while leaving others unstaged — on purpose
- ✅ Unstage a file without losing the edits
- ✅ Use `git diff` vs `git diff --staged` and explain the difference from memory

---

## 🧠 Concept (5 min)

Yesterday you met the three zones. Today you learn why professionals live in the staging area.

```
 WORKING DIRECTORY        STAGING AREA           REPOSITORY
 (your real files)        (the next commit,      (permanent
                           under construction)     history)
        │                        │                     │
        │──── git add ──────────▶│                     │
        │◀─── git restore ───────│  (--staged)         │
        │                        │──── git commit ────▶│
        │◀────────── git restore <file> ──────────────│
```

The staging area is a **draft of your next commit**. You assemble it change by change,
review it, then commit it. This is what lets one messy hour of editing become three
clean, logical commits.

**Key insight:** `git add` copies a *snapshot of the file as it is right now*. Edit the
file again afterwards and the new edit is NOT staged — the staged copy is frozen until
you `add` again. This surprises everyone once. Today it stops surprising you.

---

## 🚶 Guided Walkthrough (15 min)

Set up a fresh playground:

```bash
mkdir day2-staging && cd day2-staging
git init
echo "line one" > notes.txt
git add notes.txt
git commit -m "Start notes"
```

### 1. Stage, then edit again

```bash
echo "line two" >> notes.txt
git add notes.txt
echo "line three" >> notes.txt
git status
```

Look carefully — `notes.txt` appears **twice**:

```
Changes to be committed:
        modified:   notes.txt      ← the staged snapshot (has line two)
Changes not staged for commit:
        modified:   notes.txt      ← line three, added after the add
```

### 2. See the two diffs

```bash
git diff            # working directory vs staging  → shows line three
git diff --staged   # staging vs last commit        → shows line two
```

Two different answers, because there are three zones. `--cached` is an older alias for
`--staged` — same thing.

### 3. Commit only what's staged

```bash
git commit -m "Add line two"
git status          # line three still waiting, un-lost
```

### 4. Unstage without losing work

```bash
git add notes.txt
git restore --staged notes.txt   # pulls it OUT of staging
git status                        # edit still in working directory ✓
```

### 5. Stage *part of a file*

```bash
git add -p notes.txt
```

Git shows each change ("hunk") and asks: `Stage this hunk [y,n,q,a,d,s,e,?]?`
`y` = stage it, `n` = skip, `s` = split into smaller hunks, `q` = quit.
This is the power tool: one file, two unrelated edits, two clean commits.

---

## 🛠️ Practice (40 min)

### Exercise A — Basic (10 min)
1. Create `shopping.txt` with three lines (one per `echo >>`).
2. Commit it. Then edit **all three lines**.
3. Stage the file, then edit line one *again*.
4. Run `git diff` and `git diff --staged`. Before running them, **write down** what
   you expect each to show. Were you right?

**Check:** you can predict both diffs without running them.

### Exercise B — Intermediate (15 min)
1. Create `config.py` with a database section AND a logging section (4–6 lines each).
2. Commit it.
3. Edit *both* sections in one editing pass.
4. Using `git add -p`, stage **only** the database change and commit it as
   `"Tune database settings"`.
5. Stage and commit the logging change separately: `"Adjust log level"`.
6. `git log --oneline` — two commits, each telling one story.

**Hint:** if Git shows both edits as one hunk, they're too close together — use `s`
to split, or put a blank line between the sections and retry.

### Exercise C — Advanced (15 min)
The rescue drill. In your repo:
1. Edit a file, stage it, edit again, stage again, edit a *third* time.
2. Without committing, get the file back to **exactly the last committed version** —
   staged copy and working copy both. (Answer: `git restore --staged file` then
   `git restore file` — or discover `git restore --source=HEAD --staged --worktree file`.)
3. Verify with `git status` (clean) and `git diff HEAD` (empty).
4. Write one sentence: which command was destructive, and at what moment was your
   third edit unrecoverable?

---

## 🎬 Challenge (20 min)

**Scenario:** You're fixing a bug in `checkout.js` when you notice a typo in a comment
and an unrelated dead function nearby. You fix all three things in one editing session
because you're already there. Your team requires **one logical change per commit**.

Simulate it:

```bash
cat > checkout.js << 'EOF'
// Calcuates the total price     <- typo: Calcuates
function total(items) {
  return items.reduce((s, i) => s + i.price, 0);   // BUG: was s - i.price
}
function legacyDiscount() {      // dead code, unused anywhere
  return 0;
}
EOF
git add checkout.js && git commit -m "Add checkout module"
```

Now make all three fixes in the file, then produce **three commits**:
1. `Fix total calculation adding instead of subtracting`
2. `Fix typo in total() comment`
3. `Remove unused legacyDiscount()`

**Rules:** every commit must leave the file in a working state; `git add -p` only —
no editing the file between commits to fake it.

**Success:** `git log --oneline` shows 4 commits; `git show <id>` on each fix commit
shows only its own change.

---

## 🤔 Reflection (10 min) — answer in your tracker

1. What was the hardest concept today?
2. Explain the staging area in your own words (no using the word "staging").
3. When would `git add -p` matter in your real work?
4. What edge case do you still want to explore? (e.g. what does staging a *deleted* file look like?)
5. What would raise your confidence one point?

---

## ⚠️ Common Mistakes

| Mistake | Fix |
|---|---|
| "I committed but my newest edit is missing!" | You edited after `git add`. The staged snapshot was frozen. `git add` again, commit again — or `git commit -a` next time (stages all *tracked* files). |
| `git restore file` deleted my work | Yes — that's what it does. It's the destructive one. Unstage with `--staged` first if you only meant to pull it out of the draft. |
| `add -p` shows one giant hunk | Press `s` to split; if it won't split, the changes touch adjacent lines. |

---

## 📖 Resources

- Book: [Git Basics — Recording Changes](https://git-scm.com/book/en/v2/Git-Basics-Recording-Changes-to-the-Repository)
- `git help add` — search for "INTERACTIVE MODE"

**Next up — Day 3:** Reading History: `log`, `diff`, `show` — answering "who changed what, when, and why."
