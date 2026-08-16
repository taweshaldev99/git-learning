# Day 16: Issues, Labels, Milestones, Projects

> Phase 2 · GitHub Collaboration · 90 minutes
> **Goal:** Track work on GitHub and link commits and PRs to issues automatically.

---

## 🎯 Learning Objective

Make the repo the single source of truth for *what needs doing*, not just what was done.

**Success criteria**
- ✅ Write an issue someone else could pick up cold
- ✅ Auto-close an issue from a PR with closing keywords
- ✅ Organize a mini-backlog with labels + a milestone and read its progress

---

## 🧠 Concept (5 min)

GitHub's tracking layer, smallest to largest:

```
 Issue      one unit of work: a bug, a task, an idea    #42
 Label      a colored tag on issues/PRs                 bug · priority:high
 Milestone  a bucket with a progress bar                "v1.0" — 7/10 closed
 Project    a board across issues/PRs                   To do → Doing → Done
```

**The magic is linking.** Write `#42` in a commit message, PR, or comment → GitHub
cross-links both directions. Write a **closing keyword** in a PR description —
`Fixes #42`, `Closes #42`, `Resolves #42` — and the issue closes *automatically the
moment the PR merges*. This is the sinew connecting conversation to code: an issue's
page ends up showing exactly which commits ended it.

**A good issue = a good handoff.** Bug: steps → expected → actual → environment.
Task: context → definition of done. If a stranger can't start from it, it's a note
to self, not an issue.

---

## 🚶 Guided Walkthrough (15 min)

In your practice repo on GitHub:

### 1. Write two real issues

**Issues → New issue.**

> **Title:** Average calculation crashes on empty list
> **Body:**
> **Steps:** call `avg([])`
> **Expected:** `0` (or a clear error)
> **Actual:** returns `NaN`, which spreads silently into totals
> **Environment:** all
> **Definition of done:** empty input handled + a test proving it

Second issue: `Title: Add usage section to README` with a two-line definition of
done. Note their numbers (say `#1`, `#2`).

### 2. Label them

Issues list → **Labels**. GitHub ships defaults (`bug`, `documentation`,
`enhancement`, `good first issue`). Create one of your own: `priority:high`,
pick a color. Apply: `#1` → `bug` + `priority:high`; `#2` → `documentation`.
Then filter the list by label — with 5 issues it's a demo; with 500 it's how anyone
finds anything.

### 3. Milestone

**Issues → Milestones → New:** `v0.1 — first usable`, due date next week. Add both
issues. The milestone page now shows `0%` and a bar — a lightweight release plan.

### 4. Close an issue with code (the core loop)

```bash
git switch main && git pull && git switch -c fix-empty-avg
# fix the bug however your stats file needs; or simulate:
echo "empty-input guard" >> stats.js
git add . && git commit -m "Guard avg() against empty input"
git push -u origin fix-empty-avg
```

Open the PR — description: `Fixes #1` plus your what/why/verify lines. Look at the
PR's sidebar: the issue appears under *"Successfully referencing"*. Merge → visit
`#1`: **closed automatically**, with the PR and commits threaded into its timeline.
Milestone: 50%.

### 5. Reference without closing

In any commit or comment, a bare `#2` links without closing — for partial progress:
`"Groundwork for #2"`. Keywords close; mentions link. Know the difference.

---

## 🛠️ Practice (40 min)

### Exercise A — Basic (10 min)
1. Close `#2` the proper way: branch → README improvement → PR with `Closes #2` →
   merge → verify auto-close and the 100% milestone bar.
2. Open a new issue and close it manually with a comment ("fixed by config change,
   no code") — not everything needs a PR; the *record* is what matters.

### Exercise B — Intermediate (15 min)
Build a real mini-backlog for your actual learning:
1. Create 5 issues on your practice repo for things you genuinely want to build or
   fix during Phase 3 of this challenge (be concrete — "Day 27: get CI green on
   this repo" is perfect).
2. Create labels that mean something to you (`phase-3`, `stretch`, `quick-win`) and
   apply them.
3. Milestone `Challenge complete`, due on your Day 30 date. Add all five.
4. Filter: all `quick-win` issues NOT in the milestone. (Filters bar:
   `label:quick-win no:milestone` — learn the search syntax, it's everywhere on GitHub.)

### Exercise C — Advanced (15 min)
Projects — the board layer:
1. **Projects → New project** → Board template. Link your repo's issues (Add item →
   type `#`).
2. Columns: To do / In progress / Done. Drag your five backlog issues in.
3. Find the automation: issue closed → card moves to Done (built into the default
   workflows — Project → ⋯ → Workflows). Close one issue via a quick PR and watch
   the card move itself.
4. One honest paragraph: for a solo project, which layer earns its keep — issues
   yes/no, milestone yes/no, board yes/no? (There's no right answer; there IS a
   thought-through answer.)

---

## 🎬 Challenge (20 min)

**Scenario:** You're on-boarding a collaborator (real friend or imagined) to your
tracker/repo next week. Prepare the repo so they can contribute *without asking you
anything*:

1. Three issues labeled `good first issue`, each with full handoff quality: context,
   steps or definition of done, pointers to the relevant files (`tracker-backend/...`),
   and an estimate label you create (`~30min`, `~1hr`).
2. One issue labeled `blocked` with a comment explaining what it waits on and a
   reference (`#N`) to the blocking issue.
3. A milestone `Cohort week 1` containing a sensible subset.
4. The test: read each issue as the stranger. Could you start cold, knowing which
   file to open and what "done" looks like? Fix the ones that fail the test.

**Success:** someone who has never seen your repo could pick a `good first issue`
and open a correct PR — closing keyword and all — guided only by what you wrote.

---

## 🤔 Reflection (10 min) — answer in your tracker

1. What was the hardest concept today?
2. Explain the closing-keyword loop (issue → PR → auto-close) in your own words.
3. Which of your real projects suffers most from work tracked in your head instead of issues?
4. What edge case do you still want to explore? (e.g. `Fixes org/other-repo#5` — cross-repo closing?)
5. What would raise your confidence one point?

---

## ⚠️ Common Mistakes

| Mistake | Fix |
|---|---|
| `Fixed #42` in a random commit on main closed the issue prematurely | Closing keywords in commits that reach the default branch DO close issues. Use bare `#42` mentions until the closing PR. |
| Issue titles like "it's broken" | Title = symptom + place: "avg() returns NaN on empty list". Searchable, triage-able. |
| 40 labels, all vague | Labels are filters. If you never filter by it, delete it. Start with type + priority, grow only on need. |
| Issues as a diary nobody reads | Issues earn value when linked — reference them in every related commit/PR or they rot. |

---

## 📖 Resources

- [GitHub Docs: Linking a PR to an issue](https://docs.github.com/en/issues/tracking-your-work-with-issues/linking-a-pull-request-to-an-issue) — full keyword list
- [GitHub Docs: About Projects](https://docs.github.com/en/issues/planning-and-tracking-with-projects/learning-about-projects/about-projects)

**Next up — Day 17:** Branch protection — rules that stop bad merges *before* they happen.
