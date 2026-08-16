# Day 7: Undoing Changes — restore, reset, revert

> Phase 1 · Git Fundamentals · 90 minutes
> **Goal:** Pick the correct undo tool for each situation and explain the trade-offs.

---

## 🎯 Learning Objective

Given any "oh no," choose the right undo in ten seconds.

**Success criteria**
- ✅ Undo an uncommitted edit, an accidental stage, and a bad commit — three different tools
- ✅ Explain `reset --soft` vs `--mixed` vs `--hard` with the three-zones model
- ✅ Know the one rule about undoing *shared* history

---

## 🧠 Concept (5 min)

Three tools, three questions:

| Question | Tool | Danger |
|---|---|---|
| "This *edit* is bad" (uncommitted) | `git restore` | 🔴 destroys the edit — it exists nowhere else |
| "This *commit placement* is wrong" (local only) | `git reset` | 🟡 moves history; safe locally |
| "This commit is bad *and others may have it*" | `git revert` | 🟢 safest — adds a new commit that cancels it |

`reset` in the three-zones model — it moves the branch label back, then decides what
to do with the zones:

```
                        moves branch   staging        working files
 reset --soft  HEAD~1       ✓          keeps changes   keeps changes   (gentlest)
 reset --mixed HEAD~1       ✓          unstages        keeps changes   (default)
 reset --hard  HEAD~1       ✓          wipes           WIPES           (careful)
```

**The one rule:** never `reset` commits that others already have (i.e. pushed and
pulled). Rewriting shared history forces everyone else into conflict hell. For shared
mistakes, `revert` — it moves history *forward* with a canceling commit.

---

## 🚶 Guided Walkthrough (15 min)

```bash
mkdir day7-undo && cd day7-undo && git init
echo v1 > app.txt && git add . && git commit -m "v1"
echo v2 >> app.txt && git commit -am "v2"
echo v3 >> app.txt && git commit -am "v3"
```

### 1. Undo an uncommitted edit

```bash
echo "typo garbage" >> app.txt
git restore app.txt          # gone. Forever. It was never committed anywhere.
```

### 2. Unstage (yesterday's friend)

```bash
echo good >> app.txt && git add app.txt
git restore --staged app.txt   # out of staging, edit kept
git restore app.txt            # clean up for the next demo
```

### 3. Reset, all three flavors

```bash
git log --oneline              # note: v3 v2 v1
git reset --soft HEAD~1        # v3 gone from log…
git status                     # …but its changes sit STAGED, ready to re-commit
git commit -m "v3 rewritten"   # same content, new message — this is how you redo a commit

git reset --mixed HEAD~1       # default flavor
git status                     # changes present but unstaged
git commit -am "v3 again"

git reset --hard HEAD~1        # v3 gone from log AND from the file
cat app.txt                    # v1, v2 only
```

`--hard` is the one that deletes work. Before using it, ask: "is anything here
uncommitted that I'd miss?" (Day 24's reflog can often rescue even this — but don't
budget on it.)

### 4. Revert — the public-safe undo

```bash
echo bad-feature >> app.txt && git commit -am "Ship bad feature"
git revert HEAD                # editor opens: "Revert 'Ship bad feature'" — save
git log --oneline              # BOTH commits present: the mistake and its cancellation
cat app.txt                    # bad-feature line gone
```

History honest, work undone, nobody else disrupted.

### 5. Amend — the tiny special case

```bash
git commit --amend -m "Better message"        # fix the last message
echo forgot > extra.txt && git add extra.txt
git commit --amend --no-edit                  # sneak a forgotten file into the last commit
```

Amend *rewrites* the last commit — same rule as reset: local-only commits.

---

## 🛠️ Practice (40 min)

### Exercise A — Basic (10 min)
Speed round in a scratch repo. For each, say the command aloud before typing:
1. Edited a file, want it back to last commit. →
2. Staged a file by mistake, keep the edit. →
3. Last commit message has a typo. →
4. Last commit is fine but you forgot one file. →
5. Last two commits shouldn't exist; keep the work as uncommitted edits. →

*(Answers: restore file · restore --staged file · commit --amend -m · add + commit
--amend --no-edit · reset --mixed HEAD~2.)*

### Exercise B — Intermediate (15 min)
1. Make three commits. `reset --soft HEAD~2`, then commit once — you've **squashed**
   two commits into one. Verify content survived: `git show --stat HEAD`.
2. Make a "broken" commit. Revert it. Then *revert the revert* (`git revert HEAD`
   again) — the feature is back. Read the log: the whole story is legible.
3. One sentence each: when squashing (reset+recommit) is fine, and when it's forbidden.

### Exercise C — Advanced (15 min)
1. Commit A adds `keep.txt`. Commit B adds `bad.txt`. Commit C edits `keep.txt`.
2. Task: remove commit B's effect **without** touching C. Try `git revert HEAD~1` —
   Git reverts just B (deletes `bad.txt`), C's edit intact. Verify all three
   states.
3. Now the harder question: could `reset` have done this? (No — reset can only cut
   from the tip backwards; revert targets any commit in the middle. Write that down.)
4. Bonus: `git revert --no-commit HEAD~1` — inspect what it staged, then
   `git revert --abort`.

---

## 🎬 Challenge (20 min)

**Scenario:** A junior teammate hands you a laptop and says, in order:
1. "I committed my `.env` password file two commits ago" *(local repo, never pushed)*
2. "then I committed a good bug fix,"
3. "then I ran some command and now my working directory ALSO has weird edits I don't want,"
4. "and my last commit message says `asdfasdf`."

Build the mess:

```bash
mkdir rescue && cd rescue && git init
echo code > app.txt && git add . && git commit -m "App"
echo "PASSWORD=hunter2" > .env && git add . && git commit -m "Add config"
sed -i 's/code/code+fix/' app.txt && git commit -am "Fix login bug"
echo junk >> app.txt
git commit -am "asdfasdf" --allow-empty 2>/dev/null || git commit -m "asdfasdf" --allow-empty
echo more-junk >> app.txt
```

Deliver a repo where: `.env` is gone from **every** commit that remains, the login fix
survives, the working tree is clean, and every commit message is honest. Multiple
correct paths exist (one: `restore` the junk → fix the message with amend or reset →
`reset --soft` back past the `.env` commit and rebuild history without it, using
`git rm --cached .env` and re-committing the good work).

**Success:** `git log --oneline` shows clean messages, `git show --stat` on each
commit shows no `.env` anywhere, `cat app.txt` shows the fix, `git status` clean.
Write two sentences on which tools you chose and why — the *reasoning* is today's
deliverable.

---

## 🤔 Reflection (10 min) — answer in your tracker

1. What was the hardest concept today?
2. Explain soft/mixed/hard using the three-zones drawing.
3. When in your real work would `revert` be the only acceptable option?
4. What edge case do you still want to explore? (e.g. reverting a merge commit?)
5. What would raise your confidence one point?

---

## ⚠️ Common Mistakes

| Mistake | Fix |
|---|---|
| `reset --hard` ate uncommitted work | Prevention: `git status` before every `--hard`. Cure: sometimes Day 24's reflog; uncommitted-never-staged work is genuinely gone. |
| Reset a pushed branch | The push will be rejected; do NOT force it on a shared branch — `revert` instead, then push. |
| Reverting a revert feels absurd | It's normal and legible — better than resurrecting by force. |
| `--amend` after pushing | Same class as reset-after-push. Amend is for the commit still on your desk. |

---

## 📖 Resources

- Book: [Undoing Things](https://git-scm.com/book/en/v2/Git-Basics-Undoing-Things)
- [Oh Sh*t, Git!?!](https://ohshitgit.com/) — bookmark it; everyone needs it eventually

**Next up — Day 8:** `.gitignore` — keeping secrets and junk out of history in the first place, so Day 7 rescue drills stay rare.
