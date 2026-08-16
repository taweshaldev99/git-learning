# Day 22: Interactive Rebase — squash, reword, drop

> Phase 3 · Advanced Workflows · 90 minutes
> **Goal:** Clean a messy branch into a reviewable set of commits.

---

## 🎯 Learning Objective

Edit your branch's history like a document — combine, rename, delete, reorder
commits — before anyone else reads it.

**Success criteria**
- ✅ Squash a fix-typo chain into its parent commit
- ✅ Reword, drop, and reorder commits in one interactive session
- ✅ Use `--autosquash` with `fixup!` commits (the pro shortcut)

---

## 🧠 Concept (5 min)

Real branches accumulate sediment: `WIP`, `fix typo`, `actually fix it`, `oops`.
Interactive rebase (`git rebase -i`) opens your commits **as an editable to-do
list** — you mark what happens to each, Git replays accordingly:

```
 pick a1a1a1 Add login form          ← keep as-is
 reword b2b2b2 add validaton         ← keep, fix the message
 squash c3c3c3 fix typo              ← MELT into the commit above
 fixup  d4d4d4 oops forgot file      ← melt up, DISCARD its message
 drop   e5e5e5 debug console.log     ← delete entirely
 (and: reorder lines = reorder commits · edit = pause here to amend)
```

The list reads **top = oldest**. Same machinery as yesterday — commits are replayed,
IDs change — so the same golden rule: **your unpushed work, or your own pushed
feature branch (seatbelt force after); never shared history.**

Why bother? A reviewer reading 3 intentional commits reviews *your thinking*. One
reading 14 sediment commits reviews *your afternoon*. Craft the story before the PR.

**Editor note:** `rebase -i` opens your Git editor. In this course's non-interactive
spirit you can also drive it scriptably — `GIT_SEQUENCE_EDITOR` tricks below — but
learn the editor flow; it's the daily driver. (Vim survival: `Esc :wq` Enter.
Escape hatch everywhere: delete every line = abort safely, or `git rebase --abort`.)

---

## 🚶 Guided Walkthrough (15 min)

### 1. Manufacture sediment

```bash
mkdir day22 && cd day22 && git init
echo base > app.js && git add . && git commit -m "Base"
git switch -c feature-profile
echo "profile page" >> app.js   && git commit -am "Add profile page"
echo "avatr support" >> app.js  && git commit -am "add avatar suport"   # typos!
sed -i 's/avatr/avatar/' app.js && git commit -am "fix typo"
echo "console.log('dbg')" >> app.js && git commit -am "debug stuff"
echo "bio field" >> app.js      && git commit -am "WIP"
git log --oneline    # five commits of realistic mess
```

### 2. The interactive session

```bash
git rebase -i main       # everything since main, as a to-do list
```

Edit the list to (top = oldest — mark, don't retype IDs):

```
pick   <id> Add profile page
reword <id> add avatar suport        → message becomes: Add avatar support
fixup  <id> fix typo                 → melts into avatar commit, message discarded
drop   <id> debug stuff
reword <id> WIP                      → becomes: Add bio field
```

Save/close; Git pauses once per `reword` for the new message. Result:

```bash
git log --oneline
# Add bio field / Add avatar support / Add profile page / Base
cat app.js               # typo gone, debug line gone, all real work intact
```

Three clean commits from five muddy ones. Verify **content** survived:
`git diff main feature-profile` shows exactly the intended final change.

### 3. The pro shortcut: autosquash

Mark fixes *at commit time*, squash automatically later:

```bash
echo tweak >> app.js
git commit -am "fixup! Add profile page"     # magic prefix + target's subject
git rebase -i --autosquash main              # the todo arrives PRE-ARRANGED
```

The `fixup!` commit is already positioned under its target, marked `fixup`. Just
save. Set `git config --global rebase.autosquash true` and every `-i` does this.
(`git commit --fixup=<sha>` writes the magic message for you.)

---

## 🛠️ Practice (40 min)

### Exercise A — Basic (10 min)
1. Fresh branch, five commits: two good, one typo-fix-for-the-first, one debug
   junk, one WIP-named.
2. One `-i` session: fixup the typo, drop the junk, reword the WIP.
3. Verify: `log` clean, `diff main..` correct, working tree untouched.

### Exercise B — Intermediate (15 min)
Reordering + the conflict it can cause:
1. Commits in this order: `Add config`, `Add feature (uses config)`, `Improve config`.
2. Goal: both config commits adjacent — move `Improve config` up one line, mark it
   `squash` into `Add config`.
3. It may conflict (the improvement was written against a file the feature also
   touched) — resolve with the Day 21 rhythm (`--continue`). If it sailed through,
   engineer a conflicting reorder and do it again — hitting one on purpose is the rep.
4. One sentence: why does reordering risk conflicts when squashing neighbors rarely does?

### Exercise C — Advanced (15 min)
`edit` — the time machine stop:
1. Three commits; the middle one accidentally includes a `secrets.txt` (create this
   situation).
2. `rebase -i`, mark the middle commit `edit`. Git pauses *with that commit checked
   out*: `git rm --cached secrets.txt`, add it to `.gitignore`,
   `git commit --amend --no-edit`, then `git rebase --continue`.
3. Prove the file exists in NO commit: `git log --all --oneline -- secrets.txt`
   (empty). This is surgical history-cleaning — and exactly why Day 8 said a
   *pushed* secret is burned anyway (you can only clean what others never fetched).
4. Bonus rep: use `git commit --fixup=` + autosquash on a fresh mini-branch until
   the flow is muscle memory.

---

## 🎬 Challenge (20 min)

**Scenario:** Your PR got the dreaded review comment: *"Great feature — could you
clean up the history before we merge? Our main is linear and each commit should
stand alone."* The branch (pushed!) is 8 commits of honest chaos.

Build the chaos:

```bash
git switch main && git switch -c search-feature
echo "search box" > search.js       && git add . && git commit -m "start search"
echo "querry parsing" >> search.js  && git commit -am "parsing"
sed -i 's/querry/query/' search.js  && git commit -am "typo"
echo "results list" >> search.js    && git commit -am "WIP results"
echo "console.log(q)" >> search.js  && git commit -am "debugging"
echo "highlight matches" >> search.js && git commit -am "highlight"
sed -i '/console.log/d' search.js   && git commit -am "remove debug"
echo "empty state msg" >> search.js && git commit -am "oops forgot empty state"
git push -u origin search-feature 2>/dev/null || true   # pushed = seatbelt force later
```

**Deliver exactly three commits, each standing alone:**
1. `Add search box with query parsing`
2. `Add results list with match highlighting`
3. `Add empty-state message`

Notes: the debug commit and its removal should *both* vanish (net-zero pairs melt
away — squash the removal into where the debug entered, or drop-plan carefully);
the typo fixes fold into their parents; nothing of value lost
(`git diff main search-feature` before = after, minus the debug line).

Finish: `--force-with-lease` the branch (if you have a remote wired), and write the
one-line reply to the reviewer.

**Success:** three self-contained commits, clean diff, correct force, and you never
lost content — check with the before/after diff trick.

---

## 🤔 Reflection (10 min) — answer in your tracker

1. What was the hardest concept today?
2. squash vs fixup vs drop — one line each, from memory.
3. Where's your personal line between honest history and curated history?
4. What edge case do you still want to explore? (e.g. splitting ONE commit into two — the `edit` + `reset` dance?)
5. What would raise your confidence one point?

---

## ⚠️ Common Mistakes

| Mistake | Fix |
|---|---|
| Deleted a line in the todo (= dropped a commit) accidentally | Close without saving / delete ALL lines to abort; already ran? Reflog rescue — conveniently, that's Day 24. |
| Squashed in the wrong direction | squash/fixup melt **upward** into the commit above. Order the list first, then mark. |
| Interactive-rebased a shared branch | Same golden rule as Day 21. Feature branch only-yours: fine + seatbelt force. Team branch: never. |
| Editor opened and panic set in | `Esc :q!` Enter leaves without saving = abort. Breathe. Configure a friendlier editor (`code --wait`) if vim isn't home. |

---

## 📖 Resources

- Book: [Rewriting History](https://git-scm.com/book/en/v2/Git-Tools-Rewriting-History)
- `git help rebase` — the `--autosquash` and `--exec` sections (run tests per replayed commit!)

**Next up — Day 23:** Cherry-pick — lifting exactly one commit from anywhere to anywhere.
