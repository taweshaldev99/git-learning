# Day 10: Phase 1 Capstone + Quiz

> Phase 1 · Git Fundamentals · 90 minutes
> **Goal:** Rebuild a full local workflow from scratch with no notes.

---

## 🎯 Learning Objective

Prove Days 1–9 are in your hands, not just your history. Today has no new material —
it's one continuous build, closed-book.

**Success criteria**
- ✅ Complete the capstone build without looking anything up (log what you *did* look up)
- ✅ Score 8/10+ on the quiz
- ✅ Resolve the planted conflict in under five minutes

**Format today:** Concept block = quiz prep re-read (5 min) · Walkthrough block =
capstone part 1 · Exercises = capstone parts 2–4 · Challenge = the conflict gauntlet ·
Reflection = quiz + phase retro.

---

## 🧠 Warm-up (5 min)

Close-book recall — say each answer aloud, then move on (answers live in Days 1–9):

1. The three zones, in order, and the two commands that move work between them.
2. What does a branch physically point to?
3. Fast-forward happens when ______.
4. The undo table: wrong edit / wrong stage / wrong local commit / wrong shared commit.
5. Why doesn't `.gitignore` affect tracked files?

---

## 🚶 Capstone Part 1 — Foundation (15 min)

You're building a tiny recipe site. **No peeking at previous days.**

1. New repo `recipe-box`. Configure your name/email if this machine doesn't have it.
2. Create `README.md` (project title + one line) and `recipes/pasta.md` (3-line
   recipe). Commit them as **two separate commits** with proper messages.
3. Create `notes.tmp`, `secrets.env`, and `drafts/wip.md`. Only `drafts/` should be
   trackable later — ignore the other two patterns properly, commit the ignore file.
4. Verify: `git status` clean except nothing; `git log --oneline` shows 3 commits;
   `git check-ignore -v secrets.env` explains itself.

## 🛠️ Capstone Part 2 — Branch & build (10 min)

5. Branch `feature-desserts`. Add `recipes/tiramisu.md` (2 commits: create, then
   improve).
6. Meanwhile a "teammate" works: switch to main, add a `LICENSE` file, commit.
7. Predict: will merging `feature-desserts` fast-forward? Write your answer down,
   then merge and check yourself. Delete the merged branch.

## 🛠️ Capstone Part 3 — Staging discipline (15 min)

8. In one editing pass: fix a typo in `README.md`, AND add a new line to
   `recipes/pasta.md`, AND create `recipes/salad.md`.
9. Produce three clean commits, each containing exactly one of those changes,
   without further editing between commits. (Day 2's tools.)
10. Realize the salad commit message is wrong — fix it without a new commit.
11. Realize the pasta line was a mistake entirely — remove that *commit's effect*
    with the history-honest tool. (It's shared-safe by habit.)

## 🛠️ Capstone Part 4 — Interruption (15 min)

12. Start editing `recipes/tiramisu.md` (don't commit). New file `recipes/pizza.md`
    too (untracked).
13. Interrupt! Hotfix needed on `README.md` (any one-word fix), committed on main,
    while your tiramisu+pizza work waits in a **named** stash.
14. Restore the stash onto a new branch `weekend-cooking`, commit it there, switch
    back to main.
15. Verify: main log is clean and linear where expected; `git stash list` empty;
    `weekend-cooking` holds the work.

---

## 🎬 Challenge — The Conflict Gauntlet (20 min, timed)

Set up (this part you may copy-paste):

```bash
cd .. && mkdir gauntlet && cd gauntlet && git init
printf "title: Recipes\ntheme: light\nlang: en\nitems: 12\n" > config.yml
git add . && git commit -m "Config"
git switch -c team-a
sed -i 's/theme: light/theme: dark/'  config.yml
sed -i 's/items: 12/items: 20/'       config.yml
git commit -am "Dark theme, more items"
git switch main && git switch -c team-b
sed -i 's/theme: light/theme: solar/' config.yml
sed -i 's/lang: en/lang: en-GB/'      config.yml
git commit -am "Solar theme, British English"
git switch main
```

**Start a timer.** Merge both branches into main. Business truth: theme must be
**dark** (team-a wins that argument), everything else keeps both sides' changes.
Stop the timer when `git status` is clean after the second merge.

- Under 5:00 — phase goal met 🎉
- Over — completely fine; run it once more after the quiz. Repetition is the point.

---

## 🤔 Quiz + Retro (10 min)

**Quiz — closed book, write answers, then check against Days 1–9.**

1. `git diff --staged` compares ______ with ______.
2. You edited a file after `git add`. What does the commit contain?
3. What two things does `git switch feature` change?
4. A merge commit has how many parents, and what are they?
5. `<<<<<<< HEAD` — what exactly is above vs below the `=======`?
6. `reset --mixed HEAD~1` vs `reset --hard HEAD~1`: what differs?
7. Why is `revert` the only safe undo for pushed commits?
8. A tracked file was just added to `.gitignore`. What changes?
9. Plain `git stash` misses which kind of file?
10. `git log -S "foo"` finds what?

**Scoring:** 8+ = ready for Phase 2. 6–7 = re-skim the days you missed tonight.
≤5 = repeat this capstone tomorrow before Day 11 — cheaper now than during PRs.

**Phase retro (in your tracker):**
1. Hardest concept of the whole phase?
2. Explain Git's data model (commits, branches, HEAD) in three sentences.
3. Which drill felt most like your real work?
4. What edge case are you carrying into Phase 2 unanswered?
5. What would raise your confidence one point?

---

## ⚠️ If you got stuck

That's data, not failure. The lookup log you kept **is the study list** — each lookup
maps to one day: zones→2, history→3, branches→4, merges→5–6, undo→7, ignore→8,
stash→9. Fifteen minutes with the right day beats redoing everything.

**Next up — Day 11:** Phase 2 begins — GitHub, SSH keys, and your first remote. The
solo game becomes multiplayer.
