# Day 5: Merging — Fast-forward vs 3-way

> Phase 1 · Git Fundamentals · 90 minutes
> **Goal:** Combine branches and explain which merge strategy Git chose and why.

---

## 🎯 Learning Objective

Merge branches confidently and predict — before running the command — whether Git will
fast-forward or create a merge commit.

**Success criteria**
- ✅ Perform both merge types on purpose
- ✅ Read `git log --graph` and identify each merge type after the fact
- ✅ Explain what a merge commit's two parents are

---

## 🧠 Concept (5 min)

**Merging = "bring that branch's commits into this one."** You always merge *into* the
branch you're standing on.

**Case 1 — Fast-forward.** `main` hasn't moved since you branched. Your branch is
simply *ahead*. Git doesn't need to combine anything — it slides the `main` label forward:

```
 before:  A ─── B ─── C ─── D          after:   A ─── B ─── C ─── D
                │           │                                     │
              main       feature                            main, feature
```

No new commit. History stays a straight line.

**Case 2 — 3-way merge.** Both branches moved. Now there are two sets of changes to
combine, so Git creates a **merge commit** with **two parents**:

```
 before:  A ─── B ─── C  (main)        after:   A ─── B ─── C ──── M  (main)
                 \                                       \        /
                  D ─── E (feature)                       D ─── E  (feature)
```

Why "3-way"? Git compares three snapshots: the common ancestor (B), yours (C), and
theirs (E). Changes relative to the ancestor are combined. When both sides changed the
*same lines*, that's a conflict — tomorrow's whole lesson. Today's merges stay clean.

---

## 🚶 Guided Walkthrough (15 min)

### 1. A fast-forward, on purpose

```bash
mkdir day5-merge && cd day5-merge && git init
echo base > app.txt && git add . && git commit -m "Base"
git switch -c feature
echo feat >> app.txt && git commit -am "Add feature"
git switch main                      # main did NOT move meanwhile
git merge feature
```

Output says `Fast-forward`. Check `git log --oneline --graph` — straight line, no
merge commit. Clean up: `git branch -d feature`.

### 2. A 3-way merge, on purpose

```bash
git switch -c topic
echo topic-work > topic.txt && git add . && git commit -m "Topic work"
git switch main
echo main-work > main.txt && git add . && git commit -m "Main work"   # main moved!
git merge topic
```

Git opens an editor with a prepared message (`Merge branch 'topic'`) — save and close.

```bash
git log --oneline --graph
```

```
*   m3rg3d (HEAD -> main) Merge branch 'topic'
|\
| * t0p1c1 Topic work
* | ma1n01 Main work
|/
* ba5e00 Base
```

The diamond. Inspect the merge commit: `git show HEAD` — note the line
`Merge: ma1n01 t0p1c1` — **two parents**.

### 3. Control the behavior

```bash
git merge --no-ff <branch>   # force a merge commit even when ff was possible
git merge --ff-only <branch> # refuse unless ff is possible (fails safe)
```

Teams pick a policy: `--no-ff` keeps a visible record that a feature branch existed;
ff-only keeps history perfectly linear. Know both; follow your team.

### 4. Aborting

Started a merge and regret it (conflicts, wrong branch)? Before committing it:

```bash
git merge --abort
```

Everything returns to the pre-merge state. This command removes most merge fear.

---

## 🛠️ Practice (40 min)

### Exercise A — Basic (10 min)
1. Fresh repo, commit on `main`.
2. Branch `a`, one commit. Merge into main. **Predict first:** ff or 3-way? Verify.
3. Branch `b`, one commit; meanwhile add one commit on main. Merge `b`.
   **Predict first.** Verify with the graph.

**Check:** both predictions right, and you can say *why* in terms of "did main move?"

### Exercise B — Intermediate (15 min)
1. Recreate a fast-forward setup (branch ahead, main untouched).
2. Merge with `--no-ff`. Compare the graph with Exercise A's ff result.
3. Recreate again; this time run `git merge --ff-only` after moving main — read the
   failure message. What is it protecting you from?
4. Two sentences: when is a straight-line history worth more, and when is a visible
   feature-branch bubble worth more?

### Exercise C — Advanced (15 min)
Multi-branch day, no conflicts:
1. From a base commit, create `feat-1`, `feat-2`, `feat-3` — each adds its **own new
   file**, one commit each.
2. Merge all three into main, one after another.
3. Before each merge, predict ff/3-way. (First merge: ff. Second: main has moved — 3-way. Third: 3-way.)
4. Final `git log --oneline --graph --all` — annotate a screenshot or sketch: which
   commits are merge commits, and what are the parents of each?

---

## 🎬 Challenge (20 min)

**Scenario:** Release day. Three teammates finished work overnight:

- `feature-auth` — adds `auth.txt` (2 commits)
- `feature-api` — adds `api.txt` (1 commit)
- `hotfix-typo` — fixes a typo in `README.txt` (1 commit) — **must ship first and be a
  fast-forward** per team policy; the features must land as **visible merge commits**.

Build it:

```bash
mkdir release-day && cd release-day && git init
echo "# Poject" > README.txt && git add . && git commit -m "Init"   # typo intended
git switch -c feature-auth && echo a1 > auth.txt && git add . && git commit -m "Auth base"
echo a2 >> auth.txt && git commit -am "Auth sessions"
git switch main && git switch -c feature-api
echo api > api.txt && git add . && git commit -m "API routes"
git switch main && git switch -c hotfix-typo
sed -i 's/Poject/Project/' README.txt && git commit -am "Fix README typo"
git switch main
```

Ship it per policy. Then delete all three branches.

**Success:** graph shows the hotfix inline (no bubble) + two merge bubbles;
`git branch` lists only main; all three files present; README typo gone.

---

## 🤔 Reflection (10 min) — answer in your tracker

1. What was the hardest concept today?
2. Explain fast-forward vs 3-way using the sticky-note model from Day 4.
3. When would you use `--no-ff` deliberately in real work?
4. What edge case do you still want to explore? (e.g. merging a branch that was already merged?)
5. What would raise your confidence one point?

---

## ⚠️ Common Mistakes

| Mistake | Fix |
|---|---|
| Merged the wrong direction (feature ← main when you wanted main ← feature) | You merge **into** where you stand. Check `git branch` first, always. If it happened: the merge is on the wrong branch — `git merge --abort` if still open, Day 7's reset if committed. |
| Stuck in the merge-message editor | It's probably vim: `Esc` then `:wq` Enter. Or set `git config --global core.editor "code --wait"` once and be free. |
| "Already up to date" | The target has nothing the current branch lacks — you probably already merged it, or you're merging the wrong name. |

---

## 📖 Resources

- Book: [Basic Branching and Merging](https://git-scm.com/book/en/v2/Git-Branching-Basic-Branching-and-Merging)
- [learngitbranching.js.org](https://learngitbranching.js.org/) — "Merging" level

**Next up — Day 6:** Merge conflicts — the thing everyone fears, defanged in 90 minutes.
