# Day 29: Disaster Recovery Drills

> Phase 3 · Advanced Workflows · 90 minutes
> **Goal:** Work through ten broken-repo scenarios and fix each one.

---

## 🎯 Learning Objective

Become the person the team hands the broken laptop to. Ten disasters, drilled until
your pulse doesn't move.

**Success criteria**
- ✅ All ten drills solved (lookups allowed, logged)
- ✅ For each: the fix AND the one-line prevention
- ✅ Your personal incident runbook written — the deliverable that outlives today

**Format today:** 5-min triage doctrine · 15-min worked drills (1–3 guided) ·
40-min drills 4–9 solo · 20-min drill 10, the composite · 10-min runbook + reflection.

---

## 🧠 The Triage Doctrine (5 min)

Every Git disaster, same first three moves:

```
 1. STOP     no more commands "to see if it fixes it" — entropy only grows
 2. LOOK     git status · git log --oneline -5 · git reflog | head · git stash list
             (four reads, zero writes — the full picture in 30 seconds)
 3. CLASSIFY committed?           → recoverable, near-certain (reflog/fsck)
             staged-not-committed? → maybe (fsck dangling blobs)
             untracked/never-added?→ Git can't help; think editors, backups
             shared/pushed?        → coordinate FIRST, act second (no rewrites!)
```

And the standing rule from Day 24: when unsure, **`git branch rescue <sha>`** before
any destructive move — you can't make it worse from a labeled safepoint.

---

## 🚶 Worked Drills 1–3 (15 min)

*(Each drill: run the setup verbatim, then fix. Guided solutions here; from drill 4
you're on your own with hints only.)*

### Drill 1 — "I committed to main instead of a branch" (unpushed)

```bash
mkdir d1 && cd d1 && git init && echo a > f && git add . && git commit -m base
echo feature-work >> f && git commit -am "feat: belongs on a branch"
```

**Fix:** `git branch feat-rescue` (label it) → `git reset --hard HEAD~1` (main
retreats) → work lives on `feat-rescue`. **Prevention:** status prompt showing
branch; Day 17 protection makes the *pushed* version impossible.

### Drill 2 — "Merge conflict mid-merge and I want out"

```bash
mkdir ../d2 && cd ../d2 && git init && echo x > f && git add . && git commit -m base
git switch -c b && echo left > f && git commit -am left && git switch main
echo right > f && git commit -am right && git merge b
```

**Fix:** decide: resolve (Day 6) or `git merge --abort` — both are complete
answers; the disaster is only *not knowing* the exits. **Prevention:** none needed —
conflicts are weather, not disasters.

### Drill 3 — "I amended/rebased and my old commits vanished"

```bash
mkdir ../d3 && cd ../d3 && git init
for i in 1 2 3; do echo $i >> f; git add .; git commit -m "c$i"; done
GIT_SEQUENCE_EDITOR="sed -i 's/pick/drop/g'" git rebase -i HEAD~2   # drops c2, c3
```

**Fix:** `git reflog` → find pre-rebase HEAD → `git reset --hard HEAD@{1}` (or the
sha). Day 24, verbatim. **Prevention:** it needs none — reflog IS the prevention;
knowing it exists converts this from disaster to inconvenience.

---

## 🛠️ Drills 4–9, Solo (40 min — ~7 min each; hints inverted at the end)

### Drill 4 — The detached-HEAD orphan

```bash
mkdir ../d4 && cd ../d4 && git init && for i in 1 2 3; do echo $i >> f; git add .; git commit -m c$i; done
git switch --detach HEAD~1 && echo precious >> f && git commit -am "precious work"
git switch main       # warning scrolled by, commit now unreachable
```

Recover "precious work" onto a real branch. *Hint: the switch printed the sha; so
does reflog.*

### Drill 5 — Stash soup

```bash
mkdir ../d5 && cd ../d5 && git init && echo base > f && git add . && git commit -m base
for i in 1 2 3 4 5; do echo wip$i >> f; git stash; done
```

Five anonymous stashes; the one you need says `wip3`. Find it (inspect, don't
guess), apply ONLY it, drop the rest safely. *Hint: `git stash show -p stash@{n}`
in a loop; then targeted pop/drop by index — indexes shift on drop, mind the order.*

### Drill 6 — The pushed secret

```bash
mkdir ../d6-remote && git init --bare ../d6-remote && mkdir ../d6 && cd ../d6 && git init
git remote add origin ../d6-remote && echo code > app && git add . && git commit -m app
echo "API_KEY=sk-live-12345" > .env && git add . && git commit -m "config" && git push -u origin main 2>/dev/null || git push -u origin master
```

The key is on the remote. Do everything that *actually matters*, in order, and
write WHY the order is what it is. *Hint: rotation beats rewriting; then history
surgery (`rebase -i` drop + force-with-lease) + ignore-file so it can't recur —
and the honest admission that any fetcher already has it.*

### Drill 7 — "Pulled and now everything is conflicts I don't want"

```bash
mkdir ../d7 && cd ../d7 && git init && git remote add origin ../d6-remote
git fetch && git switch main 2>/dev/null || git switch master
echo local-change >> app && git commit -am "local work"
# teammate force-moved the remote meanwhile:
cd ../d6 && git commit --amend -m "app (rewritten)" && git push --force 2>/dev/null; cd ../d7
git pull 2>&1 | tail -2   # divergence mess
```

Get to: your local work preserved on a branch, main matching the (rewritten)
remote. *Hint: branch-label your work first, then `git reset --hard origin/...` —
and a word with the teammate about Day 21's golden rule is part of the fix.*

### Drill 8 — The wrong-directory repo (a repo inside a repo by accident)

```bash
mkdir -p ../d8/project && cd ../d8/project && git init && echo real > app && git add . && git commit -m real
cd .. && git init   # oops: initialized the PARENT too
echo junk > stray && git add . 2>/dev/null; git status | head -5
```

The parent `.git` is shadowing/confusing everything. Remove the wrong repo without
harming the right one, and verify the inner repo is intact. *Hint: a repo IS its
`.git` folder; deleting the parent's `.git` deletes only the accident. `git -C
project log` to verify the survivor.*

### Drill 9 — "Binary bloat: someone committed a 'video'"

```bash
mkdir ../d9 && cd ../d9 && git init && echo code > app && git add . && git commit -m code
dd if=/dev/zero of=demo.mp4 bs=1M count=5 2>/dev/null || fsutil file createnew demo.mp4 5242880
git add . && git commit -m "add demo video" && echo more >> app && git commit -am "more work"
```

The repo must lose the blob from history (unpushed, luckily), keep all code
commits, and never accept videos again. *Hint: interactive rebase `edit` at the
video commit (Day 22 Ex C did exactly this dance) — or `--onto` surgery; then
`.gitignore` + (bonus) mention what you'd use at real scale: `git filter-repo` /
LFS migration.*

---

## 🎬 Drill 10 — The Composite (20 min, timed)

**Scenario:** Friday 5pm. The intern's laptop. Four things are wrong AT ONCE.
Triage order is part of the grade.

```bash
mkdir ../d10 && cd ../d10 && git init
echo v1 > app && git add . && git commit -m "app v1"
git switch -c feature && echo f1 >> app && git commit -am "feature 1"
echo f2 >> app && git commit -am "feature 2"
echo "PASSWORD=oops" > secrets.txt && git add . && git commit -m "notes"     # (1) secret committed
git switch main && echo hot > hotfix && git add . && git commit -m "hotfix"   # main moved
git switch feature && git rebase main 2>/dev/null
GIT_SEQUENCE_EDITOR="sed -i '2,3s/pick/drop/'" git rebase -i main 2>/dev/null # (2) botched rebase: dropped both feature commits
git switch main && git branch -D feature 2>/dev/null                          # (3) then deleted the branch
echo uncommitted-important >> app                                             # (4) plus dirty uncommitted work
```

**Deliver, in your triage order:** the uncommitted edit protected → the feature
branch resurrected *with* both feature commits → the secret gone from every
surviving commit → main + hotfix intact → tree clean → and a four-line handoff
note to the intern: what broke, what you did, what they should do differently
(kind — Day 15 tone; blameless — Day 24 spirit).

**Success:** `git log --oneline --all` shows main(v1+hotfix) and
feature(f1+f2, no secrets.txt anywhere — verify `git log --all -- secrets.txt`
empty); the note would make the intern *better*, not smaller. Under 20 minutes.

---

## 🤔 The Runbook + Reflection (10 min)

**The deliverable:** `MY-GIT-RUNBOOK.md` — write it now, while the drills are hot:

```
 # When Git breaks — my runbook
 ## First three moves (always)
 ## The classification table (committed/staged/untracked/shared)
 ## My five most-likely disasters + exact fixes  (from today's drills — YOURS)
 ## Numbers I trust: reflog ~30d, fsck for the deep cuts
 ## The rule I'll actually follow: rescue-branch before every destructive command
```

Commit it to your `til` repo. This file is Day 29's real product — the drills were
just the forge. *(Tracker reflection: hardest drill? Which fix surprised you by
being easy? Which prevention are you adopting Monday?)*

---

## ⚠️ Meta-Mistakes (the ones that turn incidents into disasters)

| Meta-mistake | The doctrine says |
|---|---|
| Fixing before looking | LOOK is three reads. Skipping it is how drills 4 and 7 combine. |
| Force-push as a reflex under stress | Shared history + stress = the one combination with no reflog. Coordinate first. |
| Deleting things to "clean up" mid-panic | Entropy only grows. Rescue-branch, THEN tidy. |
| Not telling the team | Day 15's culture: blameless, fast, factual. The silent fix that resurfaces in review costs triple. |

---

## 📖 Resources

- [Oh Sh*t, Git!?!](https://ohshitgit.com/) — the community's collective runbook
- [git filter-repo](https://github.com/newren/git-filter-repo) — history surgery at scale (the real tool behind drill 9's bonus)
- Day 24 (reflog) and Day 7 (undo) — today's drills cite them constantly; re-skim any that wobbled

**Next up — Day 30:** The final capstone. Everything, assembled: a real project from `git init` to a tagged, CI-verified release. One session. You're ready.
