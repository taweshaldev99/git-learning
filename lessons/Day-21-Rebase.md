# Day 21: Rebase — Rewriting History Safely

> Phase 3 · Advanced Workflows · 90 minutes
> **Goal:** Rebase a feature branch and articulate the golden rule of rebasing.

---

## 🎯 Learning Objective

Use rebase to keep feature branches current with a linear history — without ever
endangering shared work.

**Success criteria**
- ✅ Rebase a feature branch onto a moved main; compare the graph vs merging
- ✅ Recite and *apply* the golden rule
- ✅ Use `--force-with-lease` correctly after rebasing a pushed feature branch

---

## 🧠 Concept (5 min)

Day 5 gave you merge: join two lines with a merge commit. Rebase is the other
answer: **replay your commits on top of the new base**, as if you'd started your
branch today.

```
 before:            A ─── B ─── C   (main)
                     \
                      D ─── E       (feature)

 merge:   A ─ B ─ C ─────── M       rebase:   A ─ B ─ C ─ D' ─ E'
           \               /                            (feature)
            D ──── E ─────
        true history, bubble          linear story, REWRITTEN history
```

Critical mechanics: `D'` and `E'` are **new commits** — same changes, different
parents, different IDs. The originals still exist (Day 24 will prove it), but the
branch label moved to the copies.

**The golden rule: never rebase commits that exist outside your repository** —
anything pushed that others may have built on. Rebasing shared history creates
duplicate commits and forces everyone else into conflict archaeology. Your unpushed
work, or your own feature branch nobody else touches: rebase freely.

Merge vs rebase isn't religion, it's fit: merge preserves truth (good for shared
branches), rebase curates story (good for getting *your* branch clean before it
joins the world).

---

## 🚶 Guided Walkthrough (15 min)

### 1. The classic: update a stale feature branch

```bash
mkdir day21 && cd day21 && git init
echo base > app.txt && git add . && git commit -m "Base"
git switch -c feature
echo f1 > feat.txt && git add . && git commit -m "Feature part 1"
echo f2 >> feat.txt && git commit -am "Feature part 2"
git switch main
echo hotfix >> app.txt && git commit -am "Hotfix on main"     # main moved
git log --oneline --graph --all                               # the fork
```

Now, instead of merging main *into* feature (bubble), rebase feature *onto* main:

```bash
git switch feature
git rebase main
git log --oneline --graph --all
```

Straight line: Base → Hotfix → Feature 1' → Feature 2'. Compare the commit IDs of
the feature commits with before (`git reflog` shows the old ones) — **they changed.**

### 2. Conflicts during rebase

Rebase replays commits one at a time; any of them can conflict:

```bash
git switch main && echo "main-line" >> feat.txt 2>/dev/null || echo "main-line" > feat.txt
git add . && git commit -m "Main touches feat.txt"
git switch feature && echo "feat-line" >> feat.txt && git commit -am "Feature touches feat.txt too"
git rebase main
# CONFLICT ... could not apply <id>
```

The rhythm (Day 6 skills, new wrapper):

```bash
git status                  # which file, and "rebase in progress"
# edit the file, remove markers, keep the right content
git add feat.txt
git rebase --continue       # replays the NEXT commit (repeat if it conflicts too)
# panic button, any time:
git rebase --abort          # everything back exactly as before the rebase
```

### 3. The pushed-feature-branch case (where force enters)

After rebasing a branch you'd already pushed, push is rejected — the remote has the
*old* commits. This — and **only** this — is force territory:

```bash
git push --force-with-lease
```

`--force-with-lease` = "overwrite the remote branch, but FAIL if someone else pushed
to it since I last fetched." It's the seatbelt version of `--force` — use it, never
the naked one. And never on main; that's the golden rule wearing its work clothes.

---

## 🛠️ Practice (40 min)

### Exercise A — Basic (10 min)
1. Rebuild the walkthrough part-1 setup from memory (fork with moved main).
2. This time **merge** main into feature. Sketch the graph.
3. Rebuild it again; **rebase** onto main. Sketch. Put the sketches side by side —
   this pair of pictures IS the merge-vs-rebase decision, internalized.

### Exercise B — Intermediate (15 min)
Conflict-during-rebase reps:
1. Engineer a rebase where **two** of your three feature commits conflict.
2. Resolve both through `--continue`; note how the conflict in commit 2 shows only
   *that commit's* changes — smaller, saner conflicts than one big merge. That's a
   real rebase advantage; say it in a sentence.
3. Engineer one more; this time `--abort` halfway. Verify with the graph and
   `git status` that it's as if nothing happened.

### Exercise C — Advanced (15 min)
The golden rule, violated in a sandbox (so you never do it live):
1. Bare-repo pair from Day 12 (`hub.git`, alice, bob). Alice pushes commits A, B on
   `shared`. Bob pulls — both have A, B.
2. Alice rebases `shared` onto an updated main (rewriting A→A', B→B') and pushes
   `--force-with-lease` (it succeeds — bob hasn't pushed).
3. Bob (with old A, B) makes a commit and pulls: **witness the wreckage** —
   duplicated commits / conflicts between A and A'. This mess, on a busy team
   branch, times ten teammates.
4. Clean bob up (`git reset --hard origin/shared`, sacrificing his commit for the
   drill) and write the rule out in your own words — you've now *seen* the reason.

---

## 🎬 Challenge (20 min)

**Scenario:** Your team merges PRs by rebase-and-merge (linear main, no bubbles).
Your feature branch `payments` is 3 commits deep, pushed, PR open — and main has
moved 2 commits since you branched, one of which conflicts with yours.

Build it (solo-sim; bare `hub.git` as the remote):

```bash
git clone hub.git you 2>/dev/null; cd you   # or reuse a pair from Ex C, fresh branch
git switch -c payments
# 3 commits: create pay.js, add validate(), add refund() — separate commits
git push -u origin payments
git switch main
# 2 commits as "the team": one touching an unrelated file, one editing pay.js's
# validate() area (engineer the future conflict), push
git switch payments
```

**Your task, the professional sequence:**
1. Fetch; read exactly what main gained (`log`, `diff` — know before you act).
2. Rebase `payments` onto `origin/main`; resolve the conflict mid-replay.
3. Verify your three commits (new IDs, same story) sit atop main; run/eyeball the
   merged result for sanity.
4. Update the pushed branch with the seatbelt force. Confirm the remote graph is
   linear (`git log --oneline --graph origin/payments`).
5. In two sentences, justify to an imaginary reviewer why force-with-lease was
   correct here and what would have made it *wrong*.

**Success:** linear history, conflict resolved inside the right commit, remote
updated safely, justification airtight.

---

## 🤔 Reflection (10 min) — answer in your tracker

1. What was the hardest concept today?
2. The golden rule + its *reason*, in your own words.
3. Merge or rebase for YOUR current team/projects — and why?
4. What edge case do you still want to explore? (e.g. `rebase --onto` for moving a branch between bases?)
5. What would raise your confidence one point?

---

## ⚠️ Common Mistakes

| Mistake | Fix |
|---|---|
| Rebased main onto feature (backwards) | You're standing on the branch being rewritten; `git rebase main` while ON feature. If reversed: `--abort` (mid-flight) or reflog rescue (Day 24). |
| Plain `--force` out of habit | `--force-with-lease`, always — it fails instead of erasing a teammate's surprise push. |
| Mid-rebase limbo ("where am I?") | `git status` names the state and the options. `--continue`, `--skip`, or `--abort` — never just close the terminal. |
| Same conflict re-appearing every replayed commit | Normal when commits touch the same lines. Consider `git config rerere.enabled true` — Git re-applies your recorded resolutions. |

---

## 📖 Resources

- Book: [Rebasing](https://git-scm.com/book/en/v2/Git-Branching-Rebasing) — including "The Perils"
- [learngitbranching.js.org](https://learngitbranching.js.org/) — rebase levels: watch commits become primes

**Next up — Day 22:** Interactive rebase — not just moving history, *editing* it: squash, reword, drop.
