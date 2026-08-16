# Day 12: push, pull, fetch — The Real Difference

> Phase 2 · GitHub Collaboration · 90 minutes
> **Goal:** Predict exactly what each command changes before you run it.

---

## 🎯 Learning Objective

Never run pull-and-pray again — know what will move, where, before pressing Enter.

**Success criteria**
- ✅ Explain fetch vs pull precisely (pull = fetch + one more step — which step?)
- ✅ Resolve a rejected push the right way
- ✅ Handle the divergence warning (`pull.rebase`) deliberately, not by copy-paste

---

## 🧠 Concept (5 min)

Three commands, three arrows. The key: your repo holds **your branches** AND
**bookmarks of the remote's branches** (`origin/main` — Day 11 Ex C):

```
                      YOUR MACHINE                      GITHUB
              ┌─────────────────────────┐          ┌──────────────┐
              │  main      origin/main  │          │    main       │
              │   │            │        │          │     │         │
   fetch:     │   ·            ●◀───────┼──────────┼─────●         │  updates bookmark ONLY
   merge:     │   ●◀───────────●        │          │               │  bookmark → your branch
   push:      │   ●────────────●────────┼─────────▶│     ●         │  your branch → remote (+bookmark)
              └─────────────────────────┘          └──────────────┘
```

- **`git fetch`** — download the remote's new commits, move the `origin/*` bookmarks.
  **Touches none of your branches, none of your files.** Always 100% safe.
- **`git pull`** = `fetch` **+ merge** `origin/main` into your `main` (or + rebase,
  if configured). The merge half is where conflicts can appear.
- **`git push`** — upload your new commits, move the remote's branch. Refused if the
  remote has commits you haven't incorporated ("non-fast-forward") — Git protecting
  your teammate's work from being orphaned.

Professional habit: `fetch` first, *look* (`git log main..origin/main`), then decide
how to integrate. Pull is fine once you know what it's about to do.

---

## 🚶 Guided Walkthrough (15 min)

Build a two-machine world locally (no GitHub needed — a `--bare` repo is a remote):

```bash
mkdir day12 && cd day12
git init --bare hub.git                 # the "GitHub"
git clone hub.git alice && cd alice
echo v1 > app.txt && git add . && git commit -m "v1" && git push origin main
cd .. && git clone hub.git bob          # second machine
```

### 1. Fetch is safe, pull integrates

```bash
cd alice && echo v2 >> app.txt && git commit -am "v2" && git push && cd ../bob
git fetch
git status                    # "behind origin/main by 1" — fetch updated the BOOKMARK
cat app.txt                   # still v1! fetch touched nothing of yours
git log main..origin/main --oneline   #见 preview exactly what's incoming: v2
git pull                      # NOW your branch and files update (fast-forward merge)
cat app.txt                   # v2 ✓
```

### 2. The rejected push, manufactured

```bash
cd ../alice && echo a3 >> app.txt && git commit -am "alice-3" && git push
cd ../bob   && echo b3 > bob.txt && git add . && git commit -m "bob-3"
git push
# ! [rejected]  main -> main (fetch first)
```

Bob's push refused — the remote has alice-3, which Bob's history lacks. **Never force
here.** Integrate first:

```bash
git pull                      # may open a merge-commit editor, or show the divergence hint
```

If Git prints `Need to specify how to reconcile divergent branches` — that's a
config choice it wants once:

```bash
git config pull.rebase false   # merge-style pulls (beginner-friendly default)
git pull
```

Now history has a small merge commit joining both lines. Then:

```bash
git push                      # accepted
cd ../alice && git pull       # alice gets bob's work + the merge
```

### 3. Read before integrating (the pro loop)

```bash
git fetch
git log --oneline main..origin/main    # what's incoming
git log --oneline origin/main..main    # what's outgoing (unpushed)
git status                             # ahead/behind/diverged summary
```

Those two `..` ranges are the whole mystery of sync, dissolved.

---

## 🛠️ Practice (40 min)

*(Keep using alice/bob/hub — this sandbox is the lesson.)*

### Exercise A — Basic (10 min)
1. Alice commits & pushes twice. Bob: fetch only. Prove Bob's files unchanged but
   `git log origin/main` shows both commits.
2. Bob integrates with pull. Verify fast-forward (why was it ff? Bob had nothing new).
3. Say the fetch/pull difference out loud in one sentence without the word "download."

### Exercise B — Intermediate (15 min)
Rejected-push drill until boring:
1. Manufacture the both-sides-committed situation twice more.
2. First time: resolve with merge-style pull (as walkthrough). Read the graph.
3. Second time: resolve with `git pull --rebase` — Bob's commit is *replayed on top*
   of alice's; graph stays linear, no merge bubble. Compare both graphs side by side.
4. Two sentences: what did rebase-style buy, what did it cost?
   *(Preview of Day 21 — today just observe.)*

### Exercise C — Advanced (15 min)
1. Same-file conflict over the network: alice edits line 1 & pushes; bob edits line 1
   differently & pull → real merge conflict. Day 6 skills; finish and push.
2. Branch flow: bob creates `feature-y`, pushes with `-u`; alice fetches,
   `git switch feature-y`, adds a commit, pushes; bob pulls. Note: nothing about
   branches changes the model — same three arrows per branch.
3. Cleanup flow: alice `git push origin --delete feature-y`; bob runs `git fetch
   --prune` and checks `git branch -a`. What did prune do, and why does the stale
   bookmark otherwise linger forever?

---

## 🎬 Challenge (20 min)

**Scenario:** Monday standup chaos, you are Bob. Overnight: alice pushed 2 commits to
`main` and 1 to `feature-pay`. You have 1 unpushed commit on `main` and uncommitted
edits on `feature-pay`.

Set it up (from `day12/`):

```bash
cd alice
git switch main && echo a-m1 >> app.txt && git commit -am "alice main 1"
echo a-m2 >> app.txt && git commit -am "alice main 2" && git push
git switch -c feature-pay 2>/dev/null || git switch feature-pay
echo pay1 > pay.txt && git add . && git commit -m "alice pay 1" && git push -u origin feature-pay
cd ../bob
git switch main && echo b-m1 > bob-work.txt && git add . && git commit -m "bob main 1"
git fetch && git switch feature-pay
echo "bob wip" >> pay.txt          # uncommitted!
```

**Your task, in the professional order:**
1. Survey everything WITHOUT changing anything: what's incoming on each branch,
   what's outgoing, what's dirty. (fetch + the two `..` logs + status, per branch.)
2. Write a 3-line plan. Then execute:
   - `main`: integrate + push (your choice of merge/rebase — justify in one line)
   - `feature-pay`: bring in alice's commit **without losing your uncommitted wip**
     (stash → pull → pop, or commit-then-pull — justify your pick)
3. End state: both branches synced both directions, no stash entries, tree clean
   except intentional wip if you chose to keep it uncommitted.

**Success:** `git status` on each branch shows "up to date with origin/…", and your
plan's justifications would survive a code-review comment.

---

## 🤔 Reflection (10 min) — answer in your tracker

1. What was the hardest concept today?
2. Complete precisely: "git pull is fetch plus ______, and the dangerous half is ______."
3. Which sync disaster from your past would today's fetch-first habit have prevented?
4. What edge case do you still want to explore? (e.g. pushing to a branch someone is mid-rebase on?)
5. What would raise your confidence one point?

---

## ⚠️ Common Mistakes

| Mistake | Fix |
|---|---|
| Reaching for `push --force` after a rejection | The rejection is Git protecting teammates' commits. Pull, integrate, push. (Force has one legitimate home — Day 21.) |
| "Divergent branches" wall of text | One-time choice: `git config pull.rebase false` (merge) or `true` (rebase). Pick with your team. |
| fetch "did nothing" | It updated `origin/*` bookmarks. Look with `git log origin/main`, not `ls`. |
| Committed on main when the remote moved, now scared | You're just "diverged" — it's Tuesday, not a disaster. Pull (merge or rebase), resolve if needed, push. |

---

## 📖 Resources

- Book: [Remote Branches](https://git-scm.com/book/en/v2/Git-Branching-Remote-Branches) — the bookmark model, illustrated
- `git help pull` — the `--rebase` section

**Next up — Day 13:** Cloning & forking — getting other people's code, and the difference between borrowing and adopting.
