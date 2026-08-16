# Day 24: Reflog — The Undo of Last Resort

> Phase 3 · Advanced Workflows · 90 minutes
> **Goal:** Recover a commit or branch you thought was permanently lost.

---

## 🎯 Learning Objective

Know, in your hands, that almost nothing committed is ever lost — and exactly how to
get it back.

**Success criteria**
- ✅ Read reflog output and translate each entry into "what I did"
- ✅ Recover from: hard reset, deleted branch, botched rebase
- ✅ State precisely what reflog canNOT save (and the two expiry clocks)

---

## 🧠 Concept (5 min)

Every time `HEAD` moves — commit, switch, merge, reset, rebase, pick — Git appends a
line to a private journal: the **reflog**. Commits you "destroyed" with reset,
branches you deleted, pre-rebase originals: their commits still sit in the object
store, and the reflog remembers their addresses.

```bash
git reflog
# e5f6a7b HEAD@{0}: reset: moving to HEAD~2      ← newest: the "disaster"
# a1b2c3d HEAD@{1}: commit: The work you want    ← there it is. Not gone.
# 9f8e7d6 HEAD@{2}: commit: Earlier work
```

`HEAD@{1}` = "where HEAD was one move ago." Every entry is a valid commit reference:
`git show HEAD@{1}`, `git branch rescue HEAD@{1}`, `git reset --hard HEAD@{1}`.

**The recovery recipe, always the same:**
1. Breathe — do nothing else in the repo.
2. `git reflog` — find the last-good line.
3. Point a name at it: `git branch rescue <sha>` (safest), or reset your branch there.

**Hard limits (memorize):**
- Reflog is **local and per-clone** — it never pushes; your teammate's reflog can't save you.
- It records **committed** states. `reset --hard` eating *uncommitted* edits, or a
  deleted untracked file — nothing to find. (Commit early, commit often is literally
  a safety technology.)
- Expiry: unreachable entries are pruned after ~30 days (reachable: ~90). The
  rescue window is generous, not infinite.

---

## 🚶 Guided Walkthrough (15 min)

### 1. Resurrect a hard reset

```bash
mkdir day24 && cd day24 && git init
for i in 1 2 3; do echo v$i >> work.txt; git add .; git commit -m "Work $i"; done
git reset --hard HEAD~2          # "disaster": Work 2 and 3 obliterated
git log --oneline                # only Work 1. Panic? No:
git reflog
# <sha> HEAD@{0}: reset: moving to HEAD~2
# <sha> HEAD@{1}: commit: Work 3          ← the address of everything
git reset --hard HEAD@{1}        # time-machine back
git log --oneline                # Work 1, 2, 3 — resurrection complete
```

### 2. Resurrect a deleted branch

```bash
git switch -c doomed
echo precious > precious.txt && git add . && git commit -m "Precious work"
git switch main
git branch -D doomed             # force-deleted, tip commit now unreachable
git reflog | head -5             # find: commit: Precious work → copy its sha
git branch rescued <sha>
git log --oneline rescued        # Precious work ✓
```

*(Faster when fresh: `git branch rescued HEAD@{1}` — count the moves. And note
`-D`'s deletion message printed the sha — Git tries to help you even mid-mistake.)*

### 3. Undo an entire botched rebase

```bash
git switch -c messy && for i in a b c; do echo $i >> m.txt; git add .; git commit -m "Part $i"; done
git rebase -i main               # squash everything into one, save
git log --oneline                # one commit — "wait, I wanted them separate!"
git reflog
# rebase (finish): returning to refs/heads/messy
# ...
# <sha> HEAD@{N}: commit: Part c     ← pre-rebase tip, fully intact
git reset --hard <that-sha>
git log --oneline                # Part a, b, c — as if the rebase never happened
```

Every "history rewrite" from Days 21–22 was really a *copy* — reflog holds the
originals. This is why those lessons could say "abort/rescue always exists."

### 4. Branch-specific journals

```bash
git reflog show main             # just main's movements
git reflog show messy
```

`HEAD@{n}` counts HEAD's moves; `main@{n}` counts main's. For dating instead of
counting: `git show main@{"yesterday"}` or `main@{"2 hours ago"}` — yes, really.

---

## 🛠️ Practice (40 min)

### Exercise A — Basic (10 min)
Run disaster-drill #1 (hard reset, three commits, resurrect) **from memory**,
twice. Second time use `git branch rescue` instead of reset — compare: which
approach would you teach a panicking teammate, and why? (Branch: can't make things
worse.)

### Exercise B — Intermediate (15 min)
1. Create a branch with 2 commits; force-delete it; do *twenty* other things
   (commits on main, switches, a merge) to bury the entries.
2. Now rescue it — practice *finding* in a noisy reflog: `git reflog | grep` the
   commit message, or `git log --all --oneline` won't have it but
   `git fsck --lost-found` will list dangling commits. Two roads, same rescue.
3. Time both roads. Note which felt sturdier. (fsck finds even what reflog
   forgot — the deeper safety net.)

### Exercise C — Advanced (15 min)
Know the edges — prove the limits:
1. `echo uncommitted > gone.txt` (never add). `git clean -f` (removes untracked).
   Search reflog/fsck: is it anywhere? *(No. Untracked = outside Git's protection.)*
2. Edit a tracked file, `git add` it, then `reset --hard` before committing.
   Hunt with `git fsck --lost-found` — the **staged blob** may survive as a
   dangling blob (`git show <blob-sha>`)! Staging ≈ half a safety net; a commit is
   the full one.
3. Write the two-line personal rule this produces (something like: *"add = maybe
   recoverable, commit = recoverable, untracked = on my own"*).

---

## 🎬 Challenge (20 min)

**Scenario:** The Monday-morning triage. A teammate slides you a laptop: *"I was
'cleaning up my branches' before the demo. Now everything's wrong and the demo is in
an hour."* Their shell history shows a horror reel:

```bash
mkdir triage && cd triage && git init
echo base > app.txt && git add . && git commit -m "Base"
git switch -c demo-feature
for i in 1 2 3; do echo f$i >> app.txt; git add .; git commit -m "Demo part $i"; done
git switch -c experiment && echo x > x.txt && git add . && git commit -m "Experiment"
git switch main
# --- the horror reel ---
git branch -D experiment                    # "cleanup" #1
git switch demo-feature
git rebase -i main <<< ""  2>/dev/null; GIT_SEQUENCE_EDITOR="sed -i 's/pick/drop/g'" git rebase -i main   # dropped EVERYTHING
git switch main
git branch -D demo-feature                  # "cleanup" #2, now empty anyway
```

*(Run the reel — the `GIT_SEQUENCE_EDITOR` line makes the catastrophic rebase
scriptable. End state: main alone, everything else apparently vaporized.)*

**Your task — full restoration in under 20 minutes:**
1. Reconnaissance only: reflog + `fsck --lost-found`, map every lost tip to a sha
   on paper before touching anything.
2. Restore `demo-feature` with all three commits.
3. Restore `experiment` with its commit.
4. Verify: `git log --oneline --graph --all` matches the pre-horror world;
   `cat app.txt` on demo-feature shows f1–f3.
5. Write the two-sentence "what happened" you'd tell the teammate — blameless,
   precise, with the one habit that would have prevented the scare (push the demo
   branch = offsite backup).

**Success:** both branches back byte-for-byte, inside the hour, teammate calm — and
you never once said "it might be gone" about a committed thing.

---

## 🤔 Reflection (10 min) — answer in your tracker

1. What was the hardest concept today?
2. The recovery recipe, three steps, from memory.
3. Which past personal Git panic would reflog have ended in two minutes?
4. What edge case do you still want to explore? (e.g. does a fresh clone have a reflog? — check one)
5. What would raise your confidence one point?

---

## ⚠️ Common Mistakes

| Mistake | Fix |
|---|---|
| Panic-running more commands post-disaster | Every HEAD move adds noise atop the rescue address. Stop, read, then act. |
| Expecting reflog to cover uncommitted work | It can't. The real lesson: commit (even `WIP`) before any risky operation — Day 22 taught you to clean WIPs later anyway. |
| Rescuing by reset when unsure | `git branch rescue <sha>` first — inspect from safety, reset only once certain. |
| Treating reflog as a backup strategy | It's local, silent, and expires. Backups are called `git push`. |

---

## 📖 Resources

- Book: [Maintenance and Data Recovery](https://git-scm.com/book/en/v2/Git-Internals-Maintenance-and-Data-Recovery)
- `git help reflog` · `git help fsck`

**Next up — Day 25:** Bisect — binary-searching history to find exactly which commit broke everything.
