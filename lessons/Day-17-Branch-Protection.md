# Day 17: Branch Protection & Team Conventions

> Phase 2 · GitHub Collaboration · 90 minutes
> **Goal:** Configure rules that stop bad merges before they happen.

---

## 🎯 Learning Objective

Turn team agreements ("we always review", "main always works") into machine-enforced
rules — and write down the conventions machines can't enforce.

**Success criteria**
- ✅ Protect `main`: PRs required, direct pushes blocked — and *feel* the block
- ✅ Explain each major protection toggle and its failure story
- ✅ Draft a CONVENTIONS doc a new teammate could follow on day one

---

## 🧠 Concept (5 min)

Every team rule exists because someone once didn't. Protection rules move the rule
from *memory* into the *platform*:

| The incident | The toggle |
|---|---|
| "I pushed straight to main at 6pm Friday" | Require a pull request before merging |
| "Nobody read that PR" | Require approvals (≥1) |
| "Tests were red but we merged anyway" | Require status checks to pass *(armed on Day 27)* |
| "The fix was approved, then quietly changed" | Dismiss stale approvals on new pushes |
| "Someone force-pushed and rewrote history" | Block force pushes (on by default with protection) |
| "The release branch got deleted" | Block deletions |

**The philosophy:** rules aren't distrust — they're *removing the option to be
sloppy under pressure*, which is exactly when sloppiness happens. Even solo, they're
valuable: they keep future-you honest at 11pm.

What rules can't hold: naming schemes, commit-message style, "small PRs", review
tone. Those live in a **conventions doc** — short, written, linked from the README.

---

## 🚶 Guided Walkthrough (15 min)

Use your practice repo (Settings requires admin — you own it, so yes).

### 1. Protect main

**Settings → Branches → Add branch protection rule** *(if your UI shows Rulesets:
New ruleset — same toggles, newer clothes)*:

- Branch name pattern: `main`
- ✅ Require a pull request before merging → Required approvals: **1**
- ✅ Dismiss stale pull request approvals when new commits are pushed
- (Note "Require status checks" — leave off until Day 27 gives you checks)
- Save.

### 2. Feel the wall

```bash
git switch main && git pull
echo "sneaky" >> README.md && git commit -am "Sneak onto main"
git push
```

```
remote: error: GH006: Protected branch update failed for refs/heads/main.
remote: - Changes must be made through a pull request.
```

The 6pm-Friday mistake is now *impossible*. Undo the local commit
(Day 7: `git reset --hard origin/main` — you know what --hard does; status first).

### 3. The legitimate path still works

```bash
git switch -c proper-change
echo "proper" >> README.md && git commit -am "Add note properly"
git push -u origin proper-change
```

Open the PR. **Solo-account reality:** GitHub won't let you approve your own PR —
you'll see "At least 1 approving review is required" blocking the merge. Two options:
admin-bypass ("Merge without waiting for requirements" — visible to admins,
logged), or drop required-approvals to 0 for solo work and keep the
PR-required rule (the honest solo setup; do this now if you'll practice alone
this week). Either way: **notice the system working**.

### 4. Write the human half

```bash
git switch -c add-conventions
cat > CONVENTIONS.md << 'EOF'
# Team Conventions
## Branches
- from main; named type/short-topic: feat/dark-mode, fix/empty-avg
## Commits
- imperative mood ("Add", "Fix"); subject ≤ 60 chars; reference issues (#12)
## Pull requests
- one logical change; description = what/why/verify; link the issue it closes
- squash-merge; the squash message follows commit rules
## Review
- first response within one working day; severity labels (blocking/suggestion/nit)
- nits never block; two disagreement rounds → call, outcome written in thread
EOF
git add . && git commit -m "Add team conventions"
git push -u origin add-conventions
```

PR it in through your own new rules. Meta and satisfying.

---

## 🛠️ Practice (40 min)

### Exercise A — Basic (10 min)
1. Try to delete main (`git push origin --delete main`) — read the refusal.
2. Try a force push (`git push --force origin main`) — refusal again. These two
   defaults-of-protection are what make "protected" mean something.
3. Merge any trivial PR through the rules — the full legitimate loop, timed.
   The overhead is ~90 seconds; that's the price of never having the incident table.

### Exercise B — Intermediate (15 min)
Dismiss-stale-approvals, demonstrated:
1. PR with one commit. Approve it (second account if you have one; otherwise
   observe the mechanism in the timeline as far as solo allows).
2. Push another commit to the branch. Watch the approval get dismissed —
   the timeline says so explicitly.
3. One paragraph: the exact bad story this toggle prevents, in your own words —
   *approved code and merged code must be the same code.*

### Exercise C — Advanced (15 min)
Protection patterns beyond main:
1. Add a rule for pattern `release/*` — stricter: 2 approvals (aspirational),
   block even admins ("Do not allow bypassing the above settings").
2. Create `release/1.0`, push it, verify the rule bites (try a direct push).
3. `CODEOWNERS` preview: create `.github/CODEOWNERS` containing
   `tracker-backend/ @your-username` — commit via PR. With "Require review from
   Code Owners" enabled, PRs touching those paths demand *that* reviewer.
   Even unenforced solo, the file documents who knows what.
4. Clean up the release rule if you don't want it lingering.

---

## 🎬 Challenge (20 min)

**Scenario:** Your Git challenge cohort (Day 30 vision: 3 friends + you) turns your
tracker repo into a shared project. Last week someone would have pushed a broken
`server.js` straight to main at midnight. Design the guardrails *before* it happens:

1. **Enforce:** protection on `main` — PR required, 1 approval, stale-dismiss ON.
   Document in the rule description (or a comment in CONVENTIONS) *which incident*
   each toggle prevents.
2. **Write:** extend CONVENTIONS.md with a cohort-specific section: who reviews whom
   (pair rotation?), max PR size you'll accept from each other, response-time
   promise that fits friends-with-jobs (48h?), and the escape hatch (when is
   admin-bypass acceptable? who gets told?).
3. **Prove:** run one full change through the system: issue (Day 16) → branch → PR
   with `Closes #N` → the approval dance → squash-merge → auto-closed issue →
   branch cleanup.
4. **Stress-test in writing:** three sentences — what does your setup do when a
   *genuine* production-down emergency needs a fix at 2am and the only reviewer is
   asleep? If the honest answer is "we'd bypass and feel bad", design the bypass:
   `hotfix/*` conventions, bypass logged, retro-review next morning.

**Success:** the repo blocks the sloppy path, documents the correct one, and has a
written answer for the emergency one — before any of the three was ever needed.

---

## 🤔 Reflection (10 min) — answer in your tracker

1. What was the hardest concept today?
2. Pick one toggle and tell its incident story in two sentences.
3. Which convention does your real team enforce only by memory today?
4. What edge case do you still want to explore? (e.g. what do rulesets do that classic rules don't?)
5. What would raise your confidence one point?

---

## ⚠️ Common Mistakes

| Mistake | Fix |
|---|---|
| Protection so strict solo work stalls | Rules serve the team you *have*. Solo: PR-required + 0 approvals beats abandoned rules. |
| Admin quietly bypassing weekly | Every bypass is a design signal: either the rule is wrong (change it) or the process is (fix it). Silent exceptions rot trust in all rules. |
| Conventions doc nobody reads | Link it in the PR template (`.github/pull_request_template.md`) so it appears in every PR body. |
| Protecting main but not release branches | Pattern rules (`release/*`) — anything you'd be sad to lose gets a rule. |

---

## 📖 Resources

- [GitHub Docs: About protected branches](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches)
- [GitHub Docs: About rulesets](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/about-rulesets) — the newer machinery

**Next up — Day 18:** Contributing to someone else's repo — everything so far, aimed outward at a stranger's project.
