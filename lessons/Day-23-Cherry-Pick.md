# Day 23: Cherry-pick & Surgical Fixes

> Phase 3 · Advanced Workflows · 90 minutes
> **Goal:** Move a single commit between branches without dragging along the rest.

---

## 🎯 Learning Objective

Lift exactly the commits you need — a hotfix to a release branch, a lost commit to
the right branch — with full awareness of the duplicate-commit trade.

**Success criteria**
- ✅ Cherry-pick a single commit and a range across branches
- ✅ Resolve a cherry-pick conflict with `--continue` / `--abort`
- ✅ Explain when cherry-pick is right and when it's the wrong tool wearing a cape

---

## 🧠 Concept (5 min)

`git cherry-pick <sha>` = **take that commit's change and replay it here**, as a new
commit on the current branch.

```
   main:      A ─ B ─ C ─ D
                       │
   release:   A ─ B ───┴──▶  + C'      git switch release && git cherry-pick <C>
```

Like rebase (it's the same replay machinery): `C'` has C's *changes* but a **new
ID**. C exists twice now — once on each line of history. That duplication is the
price, and it's fine when the branches will never merge (release lines) and
confusing when they will (Git usually copes at merge time, but the history reads
oddly).

**Legit uses:** hotfix → older release branches · rescuing a commit made on the
wrong branch · pulling one finished commit out of an unfinished branch.
**Wrong uses:** moving *many* commits (that's a merge/rebase), habitual "sync by
cherry-pick" between long-lived branches (drift + duplicates forever).

Range syntax: `git cherry-pick A..B` = commits after A up through B, replayed in
order. `-x` appends `(cherry picked from commit …)` to the message — do it whenever
the source is public; future-you tracing "is the fix on 1.x?" will send thanks.

---

## 🚶 Guided Walkthrough (15 min)

### 1. The classic: hotfix to a release branch

```bash
mkdir day23 && cd day23 && git init
echo v1 > app.txt && git add . && git commit -m "v1"
git branch release-1.0                        # ship it: 1.0 frozen here
echo feature2 >> app.txt && git commit -am "Feature for 2.0"
echo "fix: escape input" > security.txt
git add . && git commit -m "Security fix"     # <- needed on BOTH lines
echo more2 >> app.txt && git commit -am "More 2.0 work"
git log --oneline                             # note the security fix's sha
```

The 1.0 customers need that security fix — not the 2.0 features around it:

```bash
git switch release-1.0
git cherry-pick -x <security-sha>
git log --oneline            # v1 + Security fix (cherry picked from ...)
cat app.txt                  # still v1 — ONLY the fix came over ✓
```

### 2. Conflicts (same rhythm, third verse)

```bash
git switch main && echo "needs-context" >> security.txt && git commit -am "Harden fix further"
git switch release-1.0
git cherry-pick <harden-sha>
# CONFLICT — the hardening was written against files 1.0 doesn't have identically
git status                   # both modified: security.txt
# resolve (Day 6), then:
git add security.txt && git cherry-pick --continue
# or bail entirely: git cherry-pick --abort
```

### 3. The rescue: committed on the wrong branch

```bash
git switch main
echo "oops feature" > oops.txt && git add . && git commit -m "Feature meant for a branch"
# rescue in three moves:
git switch -c feature-oops main~1     # branch from BEFORE the mistake... or simpler:
git switch main && git switch -c feature-oops   # branch carries the commit
git switch main && git reset --hard HEAD~1      # remove from main (LOCAL commits only!)
git log --oneline main feature-oops   # commit lives on the branch, main is clean
```

*(That reset is Day 7's rule in action: main was local-only. If it had been pushed —
revert on main + cherry-pick to the branch instead.)*

### 4. Ranges

```bash
git switch main
for i in 1 2 3; do echo step$i >> steps.txt; git add .; git commit -m "Step $i"; done
git switch release-1.0
git cherry-pick main~2..main          # steps 1-3 replayed in order
```

---

## 🛠️ Practice (40 min)

### Exercise A — Basic (10 min)
1. Rebuild the hotfix flow from memory: main with 4 commits, one marked as the fix;
   frozen `release` branch; pick the fix across with `-x`.
2. Verify surgical precision: `git diff release main --stat` — everything EXCEPT
   the fix still differs.
3. Read the picked commit's message on release — find the `-x` breadcrumb.

### Exercise B — Intermediate (15 min)
Wrong-branch rescue, both variants:
1. Variant one (unpushed): commit on main by "mistake", rescue via
   branch-then-reset. Verify both endpoints.
2. Variant two (pushed — simulate with a bare hub): the same mistake, but pushed.
   Now the legal rescue: `git revert` on main (push it), branch + cherry-pick the
   original commit onto the feature branch. Two new commits, zero rewritten history.
3. Two sentences: what forced the different treatments? (Day 7's shared-history rule
   deciding cherry-pick strategy — the tools compose.)

### Exercise C — Advanced (15 min)
Duplicate-commit archaeology (see the cost up close):
1. Cherry-pick a commit from `feature` to `main`. Then finish the feature and
   **merge** `feature` into main anyway (the "wrong use" scenario).
2. Inspect: `git log --oneline` — does the change appear twice? (Usually the merge
   is clean — Git detects the identical patch — but the *log* shows both commits.)
3. Try `git cherry main feature` (the command, not the fruit): `-` marks commits
   whose changes main already has, `+` marks truly new ones. This is how you audit
   "what's actually unmerged" when cherry-picks have muddied the water.
4. One sentence: why do release lines tolerate duplicates but merging lines suffer them?

---

## 🎬 Challenge (20 min)

**Scenario:** You maintain `release-1.0` and `release-2.0` while `main` marches
toward 3.0. Overnight, main gained five commits:

```bash
mkdir multiline && cd multiline && git init
echo core > core.txt && git add . && git commit -m "Core"
git branch release-1.0 && git branch release-2.0
echo exp1 > exp.txt        && git add . && git commit -m "Experimental UI"
echo "fix: null crash" > fix1.txt && git add . && git commit -m "Fix null-input crash"
echo exp2 >> exp.txt       && git commit -am "More experimental UI"
echo "fix: leak" > fix2.txt && git add . && git commit -m "Fix memory leak in core"
echo "docs" > docs.txt     && git add . && git commit -m "3.0 docs draft"
```

**Policy:** crash + leak fixes go to *both* release lines (with provenance);
experimental UI and 3.0 docs go to *neither*.

1. Identify the two fix shas (Day 3 skills — `log --oneline`).
2. Apply both to `release-2.0`, then both to `release-1.0`, `-x` every time,
   in original order.
3. Audit each release with `git cherry` (Ex C's tool) and `--stat` diffs: fixes
   present, experiments absent.
4. Curveball: on `release-1.0`, one pick conflicts? Resolve it; none conflicted?
   Engineer a third fix on main that *will* (touching a line the releases changed —
   give release-1.0 a small divergent commit first), and pick it through the
   conflict. The drill isn't done until you've resolved one for real.

**Success:** both release logs show exactly core + two (or three) fixes with
breadcrumbs; `exp.txt`/`docs.txt` exist on neither; you can answer "is the leak
fix on 1.0?" with a command, not a guess.

---

## 🤔 Reflection (10 min) — answer in your tracker

1. What was the hardest concept today?
2. Cherry-pick vs merge vs rebase — one sentence each on what moves and what it costs.
3. Which situation in your real work is a legitimate cherry-pick (if any)?
4. What edge case do you still want to explore? (e.g. cherry-picking a MERGE commit — why does it need `-m`?)
5. What would raise your confidence one point?

---

## ⚠️ Common Mistakes

| Mistake | Fix |
|---|---|
| Picked onto the wrong branch | It's just a local commit: `git reset --hard HEAD~1` (unpushed), redo in the right place. |
| Syncing whole branches by serial cherry-pick | That's a merge/rebase job. Picks are for *exceptions*, not pipelines. |
| Forgot `-x`, provenance lost | Amend the message if fresh; else note it in the PR. Adopt `-x` as default for public sources. |
| Mid-pick limbo | Same trio as rebase: `--continue` / `--skip` / `--abort`. `git status` always names your state. |

---

## 📖 Resources

- `git help cherry-pick` — note `-x`, `-n` (stage without committing), `-m`
- Book: [Distributed Git — Maintaining a Project](https://git-scm.com/book/en/v2/Distributed-Git-Maintaining-a-Project) — picks in maintainer workflows

**Next up — Day 24:** Reflog — the undo of last resort, where "deleted" commits go to be found.
