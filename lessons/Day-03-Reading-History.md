# Day 3: Reading History — log, diff, show

> Phase 1 · Git Fundamentals · 90 minutes
> **Goal:** Investigate what changed, when, and why using Git's inspection commands.

---

## 🎯 Learning Objective

Answer any "what happened here?" question about a repository in under a minute.

**Success criteria**
- ✅ Filter `git log` by file, author, date, and text
- ✅ Read a diff fluently: hunks, `-`/`+` lines, context
- ✅ Use `git blame` to find who last touched a specific line — and why

---

## 🧠 Concept (5 min)

A Git repository is a database of every change ever made, with a message attached to
each. Most developers only ever run bare `git log` and scroll. The inspection commands
are actually a query language:

```
 "what happened?"            git log
 "what happened to THIS?"    git log -- file      / git log -p -- file
 "what's different?"         git diff A B
 "show me that commit"       git show <id>
 "who wrote this line?"      git blame file
 "which commit mentions X?"  git log --grep=X  /  git log -S "X"
```

**Key insight:** every commit ID (`a1b2c3d…`) is a name you can hand to almost any Git
command. `HEAD` means "the commit I'm on"; `HEAD~1` its parent; `HEAD~3` three back.

---

## 🚶 Guided Walkthrough (15 min)

Build a repo with history worth reading:

```bash
mkdir day3-history && cd day3-history && git init
echo "v1" > app.txt;    git add . && git commit -m "Initial app"
echo "v2" >> app.txt;   git commit -am "Add feature A"
echo "cfg" > conf.txt;  git add . && git commit -m "Add config"
echo "v3" >> app.txt;   git commit -am "Fix bug in feature A"
```

### 1. Shape the log

```bash
git log --oneline                 # compact
git log --oneline -2              # last two only
git log --oneline -- app.txt      # only commits touching app.txt
git log --grep="bug"              # message contains "bug"
git log --since="1 hour ago"
git log --stat                    # which files, how many lines
git log --oneline --graph --all   # the picture (matters more after branches)
```

### 2. Read a diff for real

```bash
git diff HEAD~1 HEAD
```

```
--- a/app.txt          ← the older version
+++ b/app.txt          ← the newer version
@@ -1,2 +1,3 @@        ← hunk header: old lines 1-2, new lines 1-3
 v1                     ← context (unchanged)
 v2
+v3                     ← added line
```

`git diff A B` always reads as: *"what would I do to A to make it B."*

### 3. Inspect one commit

```bash
git show HEAD          # newest commit: message + full diff
git show HEAD~2        # two commits ago
git show HEAD:app.txt  # the FILE as it was at HEAD (no diff — the content)
```

### 4. Who wrote this line?

```bash
git blame app.txt
```

Each line: commit ID, author, date, line. The workflow that makes blame useful:
blame → copy the commit ID → `git show <id>` → read the message and the *whole*
change with context. Blame tells you *who*; show tells you *why*.

---

## 🛠️ Practice (40 min)

### Exercise A — Basic (10 min)
In your walkthrough repo:
1. Show the last 2 commits, one line each.
2. List only the commits that touched `conf.txt`.
3. Show the full diff introduced by the "Add feature A" commit (find its ID first).
4. Print `app.txt` **as it was in the very first commit** without checking anything
   out. (`git show <first-id>:app.txt`)

### Exercise B — Intermediate (15 min)
1. Make 6 more commits quickly, alternating between `app.txt` and `conf.txt`, using
   messages like `"feat: ..."`, `"fix: ..."`, `"docs: ..."`.
2. Answer with a single command each:
   - all `fix:` commits
   - all commits from the last 10 minutes touching `app.txt`
   - total insertions/deletions per commit (`--stat`)
   - the one-line summary of everything between the 3rd commit and HEAD
     (`git log --oneline <id>..HEAD`)
3. Write down the command you had to look up — that's the one to drill.

### Exercise C — Advanced (15 min)
The pickaxe. `git log -S "text"` finds commits where the *number of occurrences* of
`text` changed — i.e. where it was added or removed.

1. Add the line `TIMEOUT=30` to `conf.txt`, commit. Three commits later change it to
   `TIMEOUT=60`, commit. Later remove it entirely, commit.
2. Now find the complete life story of `TIMEOUT` with one command:
   `git log -S "TIMEOUT" --oneline` — birth, change, death.
3. Compare with `git log -G "TIMEOUT"` (regex, fires on any diff line matching).
   When would `-S` and `-G` give different answers?

---

## 🎬 Challenge (20 min)

**Scenario:** Production broke. The error points at `pricing.txt` line 3. You've just
joined the team — you know nothing about this file.

Build the crime scene:

```bash
mkdir crime && cd crime && git init
printf "base=100\ntax=0.10\ndiscount=0.05\n" > pricing.txt
git add . && git commit -m "Initial pricing rules"
git commit --allow-empty -m "Deploy infra"
sed -i 's/discount=0.05/discount=0.50/' pricing.txt
git commit -am "Adjust seasonal discount"
git commit --allow-empty -m "Update docs"
```

(A 50% discount instead of 5% — that's the bug.)

**Your investigation — produce written answers using only Git commands:**
1. Which commit last changed line 3? (`git blame`)
2. What was the line before that change? (`git show <id>^:pricing.txt` — `^` = parent)
3. What did the author *say* they were doing? Does the message match the change?
4. One-line verdict: what happened, in which commit, what the fix is.

**Success:** your four answers cite commit IDs, and you never opened the file in an editor.

---

## 🤔 Reflection (10 min) — answer in your tracker

1. What was the hardest concept today?
2. Explain what a diff hunk header (`@@ -1,2 +1,3 @@`) means in your own words.
3. When would `git log -S` beat searching your editor in real work?
4. What edge case do you still want to explore? (e.g. how does blame handle a renamed file?)
5. What would raise your confidence one point?

---

## ⚠️ Common Mistakes

| Mistake | Fix |
|---|---|
| `git log app.txt` errors or acts weird | Use the `--` separator: `git log -- app.txt`. It tells Git "this is a path, not a branch name." |
| Trapped in the log pager | It's `less`: `q` quits, `/text` searches, `n` next match. |
| `git show <id>` shows the wrong thing | You probably want `<id>:file` (file content) not `<id> -- file` (that commit's diff for the file). Both exist; note the difference. |

---

## 📖 Resources

- Book: [Viewing the Commit History](https://git-scm.com/book/en/v2/Git-Basics-Viewing-the-Commit-History)
- `git help log` — the `--pretty=format:` section for custom output

**Next up — Day 4:** Branches: parallel universes for your code.
