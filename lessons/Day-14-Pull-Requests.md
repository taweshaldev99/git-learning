# Day 14: Pull Requests End to End

> Phase 2 · GitHub Collaboration · 90 minutes
> **Goal:** Open, update, and merge a PR using a feature-branch workflow.

---

## 🎯 Learning Objective

Run the complete PR lifecycle: branch → push → open → revise → merge → clean up.

**Success criteria**
- ✅ Open a PR with a title/description a reviewer can act on
- ✅ Update an open PR by pushing more commits (no new PR!)
- ✅ Choose knowingly between merge / squash / rebase buttons, then clean up branches

---

## 🧠 Concept (5 min)

A **pull request** is not a Git feature — it's GitHub's conversation wrapped around a
branch comparison: *"here's my branch; please review it and merge it into main."*

```
   your branch: feature-x  ──┐
                             ├──▶  PR #12 ── discussion, review, CI ──▶ merged into main
   target branch: main    ───┘                                          branch deleted
```

The mechanics you must internalize:

1. **A PR tracks a branch, not a commit.** Push more commits to the branch → they
   appear in the open PR automatically. That's how you respond to review feedback.
2. **Same-repo vs fork PRs are identical** except where the branch lives (your repo's
   branch vs your fork's branch). Yesterday built the fork case; today uses your own
   repo so you control both sides.
3. **Three merge buttons:**
   - *Merge commit* — true history, adds a merge bubble (Day 5's `--no-ff`)
   - *Squash & merge* — all PR commits become **one** clean commit on main
     (messy 14-commit PR → tidy history; individual commits vanish from main)
   - *Rebase & merge* — commits replayed one-by-one onto main, no bubble
   Teams standardize on one. Squash is the most common default for feature work.

A good PR description answers three questions in three lines: What? Why? How to verify?

---

## 🚶 Guided Walkthrough (15 min)

Use a repo you own (e.g. `day11-remote`), playing both author and reviewer:

### 1. Author: branch, work, push

```bash
git switch main && git pull
git switch -c add-contributing
cat > CONTRIBUTING.md << 'EOF'
# Contributing
1. Fork and branch from main.
2. One logical change per PR.
EOF
git add . && git commit -m "Add contributing guide"
git push -u origin add-contributing
```

### 2. Open the PR

GitHub shows the yellow **"Compare & pull request"** banner (or: Pull requests →
New). Confirm the arrow reads `main ← add-contributing`. Write:

> **Title:** Add contributing guide
> **Body:** What: adds CONTRIBUTING.md with branch/PR rules. Why: onboarding asks
> keep repeating. Verify: render the file, check the two rules make sense.

Create. Tour the tabs: **Conversation** (discussion), **Commits**, **Files changed**
(the diff — where review happens).

### 3. Reviewer hat: request a change

In *Files changed*, hover a line → blue **+** → comment: *"Can we add a rule about
commit messages?"* → **Start a review** → **Finish review → Request changes**.
(Reviewing your own PR is limited on GitHub — a plain comment works fine for the drill.)

### 4. Author hat: respond by pushing

```bash
echo "3. Write imperative commit messages." >> CONTRIBUTING.md
git commit -am "Add commit message rule"
git push                        # NO new PR — watch #1 update itself
```

Refresh the PR: new commit in the timeline, diff updated. Reply to the comment
("done in a1b2c3d") → **Resolve conversation**.

### 5. Merge and clean up

Press **Squash and merge** (edit the final message — it becomes main's history) →
confirm → **Delete branch**. Then locally:

```bash
git switch main && git pull
git branch -d add-contributing        # local cleanup
git fetch --prune                     # drop the stale origin/ bookmark
git log --oneline -3                  # one squashed commit on main
```

Full cycle complete.

---

## 🛠️ Practice (40 min)

### Exercise A — Basic (10 min)
Run the entire walkthrough cycle again, solo, from memory: new branch
(`add-license` — add any LICENSE text), push, PR with a 3-line description, merge
with **Merge commit** this time, clean up both sides. Compare main's log shape vs
the squash from the walkthrough.

### Exercise B — Intermediate (15 min)
The multi-commit PR + squash decision:
1. Branch `improve-readme`. Make **four** tiny commits (add line, fix typo in it,
   add another line, reword it). This mess is realistic.
2. Open the PR. In *Commits*, acknowledge the mess. Squash-merge with a clean final
   message: `Improve README structure and wording`.
3. On main: `git log` — one commit. Then find the four originals anywhere
   (they're only in the PR's history now — GitHub keeps them; your local branch has
   them until deleted).
4. Two sentences: what did squash cost you, what did it buy the team?

### Exercise C — Advanced (15 min)
Draft PRs + the PR-vs-PR pileup:
1. Branch `feature-a` off main, one commit, push, open PR **as Draft** (dropdown on
   the create button). Note what reviewers can't do to a draft.
2. Branch `feature-b` off main, one commit, push, open a normal PR, merge it.
3. Your draft PR now targets a moved main. On `feature-a`:
   `git fetch && git merge origin/main` (update the branch), push. Watch the PR
   refresh. Mark **Ready for review**, merge it, clean up everything
   (`git branch -d` ×2, `git fetch --prune`).
4. One sentence: when would you open a PR as draft in real work?

---

## 🎬 Challenge (20 min)

**Scenario:** Ship a real feature through a review cycle with a plot twist —
review reveals a bug *and* main moves under you mid-PR.

1. In your repo: branch `feature-stats`. Commit a file `stats.js`:
   `function avg(a){ return a.reduce((s,x)=>s+x,0) / a.length }` plus a line
   `// TODO: handle empty array` — commit, push, open PR titled
   `Add average calculation`.
2. Reviewer-you comments in *Files changed* on the TODO line: *"Blocking: empty
   array returns NaN — handle it."*
3. Meanwhile main moves: on GitHub's web editor, edit README on **main** directly
   (one line, commit). Your PR is now against a stale base.
4. Author-you: fix the bug on the branch (`if (!a.length) return 0` — or throw;
   defend your choice in the PR reply), commit, push. Update the branch with main
   (fetch + merge origin/main, push). Resolve the conversation.
5. Squash-merge. Delete branch remotely and locally, prune, pull main.

**Success:** main has the README edit + one squashed stats commit; `git branch -a`
shows no feature branches anywhere; the PR conversation reads like two professionals
talked — because they did, even if both were you.

---

## 🤔 Reflection (10 min) — answer in your tracker

1. What was the hardest concept today?
2. Explain to a teammate why pushing to the branch updates the PR.
3. Which merge button should *your* team default to, and why?
4. What edge case do you still want to explore? (e.g. PR against a branch other than main?)
5. What would raise your confidence one point?

---

## ⚠️ Common Mistakes

| Mistake | Fix |
|---|---|
| Opened a second PR for review fixes | Push to the same branch — the open PR follows it. Close the duplicate. |
| PR shows commits/files you didn't intend | You branched from an outdated or wrong base. Update your branch with main; if junk remains, Day 21–22 surgery (or rebuild the branch cleanly and force-push it — your branch, your right). |
| Merged but branch still lingers everywhere | Three cleanups, always: delete on GitHub, `git branch -d` locally, `git fetch --prune`. |
| Wrote "fixed stuff" as the squash message | The squash message *is* main's permanent history. Write it like a commit that matters — because it is one. |

---

## 📖 Resources

- [GitHub Docs: About pull requests](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/proposing-changes-to-your-work-with-pull-requests/about-pull-requests)
- [How to write the perfect pull request](https://github.blog/2015-01-21-how-to-write-the-perfect-pull-request/) — short, evergreen

**Next up — Day 15:** Code review — the human half of the PR, from both chairs.
