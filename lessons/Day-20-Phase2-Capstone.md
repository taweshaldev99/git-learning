# Day 20: Phase 2 Capstone + Quiz

> Phase 2 · GitHub Collaboration · 90 minutes
> **Goal:** Run a full collaborative cycle including review and merge.

---

## 🎯 Learning Objective

Prove Days 11–19 compose into one fluent workflow: repo → rules → issue → branch →
PR → review → merge → clean state. Closed-book; log what you look up.

**Success criteria**
- ✅ The capstone repo passes the final audit checklist
- ✅ Score 8/10+ on the quiz
- ✅ The full cycle (issue → merged PR) takes you under 15 minutes by the second run

**Format today:** Warm-up quiz-prep (5) · Capstone build parts 1–4 (55) · The audit
gauntlet (20) · Quiz + phase retro (10).

---

## 🧠 Warm-up (5 min)

Say each aloud, closed-book:

1. `origin` vs `origin/main` — what is each?
2. `fetch` vs `pull` — the exact difference.
3. The fork triangle: which remote do you push to, which do you sync from?
4. What updates an open PR?
5. `Fixes #7` in a merged PR does what, when?

---

## 🚶 Capstone Part 1 — Foundations (15 min)

You're launching a tiny real project: a `til` repo ("Today I Learned" — one markdown
note per thing learned; perfect forever-repo, keep it after the challenge).

1. Local repo `til`, first commit: a README stub. Create the GitHub repo, connect,
   push. *(Day 11 — no peeking.)*
2. Full hygiene pass *before* any features: proper five-question README (what/why/
   run/use/more — "run" here is just "browse the folders"), MIT LICENSE,
   `.gitignore` (editor litter at minimum), description + topics on the repo page.
   *(Day 19.)* Commit conventionally.
3. Protect main: PR required; approvals 0 (solo) or 1 (if a friend joins today).
   *(Day 17.)* Prove the wall: try a direct push, watch GH006, reset cleanly.

## 🛠️ Capstone Part 2 — Work like a team of one (15 min)

4. Open three issues *(Day 16)*: `Add first TIL: git`, `Add first TIL: <your
   stack>`, `Add CONTRIBUTING.md`. Labels: create `til` + use `documentation`.
   Milestone `week-1`, all three in.
5. Issue #1 the full loop: branch `til/git-restore-staged` → write
   `git/restore-staged.md` (3 lines: the thing, the command, when you reached for
   it — you *know* this one from Day 2) → push → PR: what/why/verify +
   `Closes #1` → merge (squash; message matters) → verify auto-close → clean up
   all three branch locations *(Day 14)*.
6. Issue #3 same loop: CONTRIBUTING.md distilled from your Day 17 conventions.

## 🛠️ Capstone Part 3 — The fork side (15 min)

7. Simulate an outside contributor with the bare-repo triangle *(Day 13 Ex C)* —
   or a real friend/second account if available:

```bash
cd .. && git clone <your-til-github-url> contributor && cd contributor
git switch -c til/first-contribution
```

8. As "the contributor": add a TIL note for issue #2, push the branch, open the PR
   (from the branch; same repo stands in for the fork mechanics), description per
   the house template.
9. As the maintainer: **review it properly** *(Day 15)* — batched review, at least
   one `suggestion:` and one `nit:`, request changes. As contributor: respond with
   a commit + replies, resolve threads. Maintainer: approve, merge.

## 🛠️ Capstone Part 4 — Divergence drill (10 min)

10. In `contributor/`: commit to main WITHOUT pulling first (a new TIL file).
    Meanwhile in `til/`: merge any web-edit or trivial PR so origin/main moves.
11. `contributor` pushes → rejected → resolve the right way *(Day 12)*: fetch,
    read what's incoming (`log main..origin/main`), integrate (your choice,
    justified aloud), push clean.

---

## 🎬 The Audit Gauntlet (20 min)

Swap hats: you're a staff engineer auditing this repo cold. Run the checklist
honestly; fix every ❌ on the spot through proper PRs (small ones — speed is part
of the drill):

```
 REPO PAGE   □ description + topics   □ license detected by GitHub
             □ README answers the five questions from a cold read
 HISTORY     □ git log --oneline main: every message imperative & meaningful
             □ no junk files anywhere in history you'd be embarrassed by
 BRANCHES    □ only main survives (local + remote; --prune run)
 ISSUES      □ all week-1 milestone issues closed BY linked PRs (not manually)
 RULES       □ direct push to main still blocked (test it again)
 TEMPLATES   □ open a scratch issue + PR: both templates fire (close them after)
 STRANGER    □ mktemp cold-clone: README gets a stranger oriented in 60 seconds
```

**Timed lap:** one more full issue→branch→PR→merge→cleanup cycle for a third TIL
note, stopwatch running. Under 15 minutes = the workflow is yours. Log the time in
your tracker notes.

---

## 🤔 Quiz + Retro (10 min)

**Quiz — closed book, write answers, then self-mark against Days 11–19.**

1. What does `git push -u origin main` do beyond pushing?
2. Your push was rejected (non-fast-forward). What happened, and what's the fix?
3. Fork vs clone — when is each the right move?
4. The three sync-ritual commands for a stale fork, in order.
5. Squash-merge vs merge-commit: what does main's history look like after each?
6. A reviewer wrote `blocking:` on your PR. What are your two legitimate responses?
7. Which closing keyword lines actually auto-close issue 12 — `Fixes #12`,
   `fixed #12`, `see #12`, `Closes #12`?
8. What does "Dismiss stale approvals" prevent, in one sentence?
9. A public repo has no LICENSE file. What may you legally do with its code?
10. Name the five README questions in order.

*(7: the first, second and fourth close; bare mentions only link.)*

**Scoring:** 8+ = Phase 3 awaits. 6–7 = re-skim the weak days tonight. ≤5 = rerun
this capstone before Day 21 — Phase 3 rewrites history and assumes all of this.

**Phase retro (in your tracker):**
1. Hardest concept of the phase?
2. Explain the whole issue→PR→merge loop to an imaginary junior in four sentences.
3. Which part of the capstone felt most like a real job? Which least?
4. What collaboration edge case are you carrying into Phase 3?
5. What would raise your confidence one point?

---

## ⚠️ If you got stuck

Same rule as Day 10: the lookup log is the study list. remotes→11, sync→12,
forks→13, PRs→14, review→15, issues→16, protection→17, etiquette→18, hygiene→19.

**Keep the `til` repo.** It's real now — feed it a note every time this challenge
teaches you something. It becomes your proof-of-work in interviews.

**Next up — Day 21:** Phase 3 opens with rebase — rewriting history on purpose,
safely, and the golden rule that keeps it safe.
