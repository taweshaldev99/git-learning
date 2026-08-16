# Day 9: Stashing & Context Switching

> Phase 1 · Git Fundamentals · 90 minutes
> **Goal:** Park unfinished work safely and restore it on the right branch.

---

## 🎯 Learning Objective

Switch contexts in seconds without committing half-done work or losing anything.

**Success criteria**
- ✅ Stash, list, inspect, and restore work — including untracked files
- ✅ Explain `pop` vs `apply` and when each is right
- ✅ Recover cleanly when a stash pop hits a conflict

---

## 🧠 Concept (5 min)

The stash is a **stack of pocket dimensions**. `git stash` sweeps your uncommitted
changes (staged + unstaged) into a stash entry and leaves the working tree clean —
free to switch branches, pull, or hotfix. Later, take the changes back out.

```
 working tree (dirty)                    stash stack
 ┌──────────────────┐   git stash   ┌──────────────────┐
 │ half-done edits  │ ────────────▶ │ stash@{0} newest  │
 │                  │ ◀──────────── │ stash@{1}         │
 └──────────────────┘   pop/apply   │ stash@{2} oldest  │
        clean ✓                     └──────────────────┘
```

- `pop` = restore **and remove** from the stack (the usual move)
- `apply` = restore **and keep** the stash copy (when applying to several branches,
  or when you want a safety net until you're sure)

**Two gotchas built into the design:**
1. Plain `git stash` skips **untracked** files — your brand-new file stays behind.
   Use `git stash -u` (or `-A`/`--all` to include even ignored files).
2. A stash restores wherever you stand — including the *wrong* branch. It doesn't
   remember where it came from (the list shows where it was *made* — read it).

Stash vs commit: stash is for "interrupted, coming right back." If the work will
sleep overnight, a WIP commit on a branch is sturdier and visible.

---

## 🚶 Guided Walkthrough (15 min)

```bash
mkdir day9-stash && cd day9-stash && git init
echo base > app.txt && git add . && git commit -m "Base"
```

### 1. The basic cycle

```bash
echo "half-done" >> app.txt
git stash
git status                    # clean!
git stash list                # stash@{0}: WIP on main: <id> Base
git stash pop
cat app.txt                   # half-done is back; stash list now empty
```

### 2. The untracked-file gotcha, live

```bash
echo "new module" > brand-new.txt
echo "tweak" >> app.txt
git stash
git status                    # brand-new.txt STILL THERE — untracked, not stashed
git stash pop
git stash -u                  # now both are swept
git status                    # actually clean
git stash pop
```

### 3. Labels and inspection

```bash
echo wip1 >> app.txt && git stash push -m "navbar spacing fix"
echo wip2 > other.txt && git stash push -u -m "experiment: new logger"
git stash list
# stash@{0}: On main: experiment: new logger      ← newest is always {0}
# stash@{1}: On main: navbar spacing fix
git stash show stash@{1}      # files + line counts
git stash show -p stash@{1}   # full diff
```

Named stashes are the difference between a toolbox and a junk drawer.

### 4. Restore to a different branch (the real workflow)

```bash
git stash list                # confirm what you have
git switch -c feature-logger
git stash pop stash@{0}       # the logger experiment lands HERE, on its own branch
git add . && git commit -m "Logger experiment"
git switch main
git stash pop                 # navbar fix back on main
git restore app.txt           # discard for cleanliness
```

### 5. Dropping and emptying

```bash
git stash drop stash@{0}      # delete one
git stash clear               # delete ALL — no confirmation, no undo. Look first.
```

---

## 🛠️ Practice (40 min)

### Exercise A — Basic (10 min)
1. Dirty the tree (one tracked edit + one new file). Stash *everything* in one command.
2. Prove the tree is clean, then bring it all back.
3. Repeat, but use `apply` instead of `pop`. What's left in `git stash list`?
   Clean up with `drop`.

### Exercise B — Intermediate (15 min)
The interrupt drill (this is Day 4's challenge, now with the right tool):
1. On `feature-x`, make 2 uncommitted edits (don't commit).
2. "Urgent bug on main!" — stash with a message, switch to main, make the fix commit,
   switch back, pop.
3. Time yourself. Run the whole drill twice. Target: under 60 seconds the second time.
4. One sentence: what did stash give you that a `WIP` commit wouldn't, and vice versa?

### Exercise C — Advanced (15 min)
Stash conflicts (they happen; be unshockable):
1. Edit line 1 of `app.txt`, stash.
2. Now edit line 1 *differently* and **commit** it.
3. `git stash pop` → CONFLICT. Read the message: the stash was **not** dropped.
4. Resolve exactly like Day 6 (markers → edit → `add`) — note there's no
   commit-to-finish; the merge was into your working tree. Then `git stash drop`
   (pop-on-conflict keeps the entry as your safety net — you clean it up).
5. Also try: `git checkout stash@{0} -- app.txt` on a fresh conflict-free stash —
   grab a single file from a stash without applying the rest.

---

## 🎬 Challenge (20 min)

**Scenario:** Monday morning multitasking. You have three half-done things on `main`
that never should have been on main:

```bash
mkdir juggle && cd juggle && git init
printf "header\nbody\nfooter\n" > page.txt
echo "select 1" > query.sql
git add . && git commit -m "Site v1"
# half-done thing 1: page redesign
sed -i 's/header/header-v2-wip/' page.txt
# half-done thing 2: a new script, untracked
echo "cleanup script wip" > cleanup.sh
# half-done thing 3: sql tuning
sed -i 's/select 1/select 1 -- optimize wip/' query.sql
```

**Deliver:** three branches — `redesign`, `tooling`, `sql-tuning` — each containing
*only its own* half-done work as an uncommitted change (your teammates will finish
them), and `main` perfectly clean.

**Approach hint:** you can't stash one *file* at a time with plain `stash`, but you
can `git stash push -m "msg" <path>` — per-path stashing. Three targeted pushes
(one needs `-u`), then pop each on its new branch.

**Success:** `git status` clean on main; each branch shows exactly its own dirty
file; `git stash list` empty at the end.

---

## 🤔 Reflection (10 min) — answer in your tracker

1. What was the hardest concept today?
2. Explain stash vs WIP-commit trade-offs in your own words.
3. Which real interruption pattern in your week does the Exercise B drill match?
4. What edge case do you still want to explore? (e.g. `stash branch <name>`?)
5. What would raise your confidence one point?

---

## ⚠️ Common Mistakes

| Mistake | Fix |
|---|---|
| Stashed, but the new file didn't come along | Untracked files need `-u`. Make `git stash -u` your default reflex. |
| Popped on the wrong branch | The changes are just uncommitted edits — stash again, switch, pop. |
| Stash list is a junk drawer of `WIP on main` | Always `push -m "why"`. Future-you reads the list, not the diffs. |
| `stash clear` regret | Mostly unrecoverable. Read the list before clearing — or drop entries one by one. |
| Pop conflicted and now everything feels broken | Entry is still in the list; working tree has markers. Day 6 skills, then `drop`. |

---

## 📖 Resources

- Book: [Stashing and Cleaning](https://git-scm.com/book/en/v2/Git-Tools-Stashing-and-Cleaning)
- `git help stash` — see `push`, `-u`, and `branch` subcommands

**Next up — Day 10:** Phase 1 capstone — everything from Days 1–9, from scratch, no notes. Then the quiz.
