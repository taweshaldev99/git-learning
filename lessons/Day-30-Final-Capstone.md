# Day 30: Final Capstone — Ship a Real Project

> Phase 3 · Advanced Workflows · 90 minutes
> **Goal:** Take a project from `git init` to a tagged, CI-verified release.

---

## 🎯 The Final Objective

One session. One real project. Every skill from 30 days, composed into the thing
they were always for: **shipping**. Closed-book by default; every lookup logged
(the log is data, not shame).

**You pass when:** the release URL exists, the checklist audits green, and you can
narrate the whole history from memory.

**Pick your project** (real > toy; smallest scope that's genuinely yours):
- The `til` repo graduating to v1.0.0 with structure, CI, and a real README
- A tiny utility you actually want (a script, a config toolkit, a checklist app)
- Your tracker's cohort edition (Day 26/28 challenges started this — finish it)
- Anything else you'll still touch next month — that's the test

---

## 🚀 The Build (75 min, four acts)

*(Time boxes are guardrails. Overrun act I or II? Cut scope in III — a smaller
shipped thing beats a bigger unshipped one. That, too, is the lesson.)*

### Act I — Foundation, done right from commit one (15 min)

```
□ git init · sensible first commit (skeleton, not emptiness)
□ .gitignore BEFORE the first junk exists (Day 8's ounce of prevention)
□ README that passes the five questions — write "run it" honestly NOW,
  update as reality changes (Day 19)
□ LICENSE — decide, don't default (Day 19)
□ GitHub repo · connect · push · description + topics (Day 11/19)
□ Protect main: PR-required (+ CI check once it exists) (Day 17)
```

### Act II — The work, as a professional stream (25 min)

```
□ 2-3 issues describing the real work ahead — handoff quality (Day 16)
□ Each through the full loop: branch → small commits (imperative messages)
  → push → PR (what/why/verify + Closes #N) → self-review with fresh eyes
  (severity labels — catch your own blocking: issue!) → merge → clean up
  (Days 14-15)
□ At least ONE branch history cleaned before merge: fixups squashed, WIP
  reworded — rebase -i is now routine, not ritual (Day 22)
□ At least ONE divergence handled: let main move under a branch (web-edit a
  doc), then rebase the branch onto it — seatbelt force if pushed (Days 12, 21)
```

### Act III — The robot and the gate (20 min)

```
□ CI workflow: whatever "verify" honestly means for this project — tests if
  you have them, else lint/structure checks that would really catch a break
  (Day 27)
□ Arm it as a required check · prove the lock with one red PR → fix → green
  (Day 27's loop — evidence in the PR timeline)
□ From here: nothing reaches main unreviewed or unverified. Feel that.
```

### Act IV — Ship it (15 min)

```
□ Version decision, defended in one sentence (v1.0.0 or honest 0.x — Day 26)
□ Annotated tag · push the tag (you know why it's a separate push)
□ GitHub Release: generated notes + three human Highlight bullets (Day 26)
□ The cold-start test on the release: fresh clone, README-only, does it run?
  (Day 19 — the stranger's verdict is the only verdict)
```

---

## 🎬 The Audit (10 min)

Staff-engineer hat (Day 20 taught you this posture). Cold, honest, on the record:

```
 HISTORY   □ git log --oneline main — every message earns its place; no WIP,
             no "asdf", the story reads top to bottom
 GRAPH     □ log --graph: deliberate shape — linear or bubbled BY POLICY,
             not by accident
 ISSUES    □ all closed BY pull requests (timeline shows the automation)
 RULES     □ direct push to main: try it, watch GH006 refuse (the wall holds)
 CI        □ Actions history shows at least one red→green arc (the robot works)
 RELEASE   □ the /releases/tag/vX URL — the deliverable, live
 STRANGER  □ cold-clone verdict recorded honestly, frictions filed as issues
             (unfixed frictions become the project's first post-1.0 backlog —
             that's not failure, that's a roadmap)
```

Fix what's cheap now; file what isn't. Shipped-with-known-issues-on-record is the
professional state of every real project on earth.

---

## 🤔 The Retro That Matters (5 min + honesty)

In your tracker, the final five:

1. Hardest moment of the whole 30 days — and is it still hard?
2. The full loop (issue → branch → PR → review → CI → merge → release) in
   *your* words, four sentences, no jargon you can't unpack.
3. Day 1 you vs today: what would Day-1-you not even have understood about
   what you just built?
4. The edge-case list you've been accumulating in reflections — pick the three
   you'll actually chase next month.
5. Confidence, 1–5, across the board — and the honest gaps that keep any
   number below 5 (those are your curriculum now).

**The lookup log verdict:** count today's lookups. Zero is suspicious (too-safe
scope?); a handful is mastery (knowing *where* beats memorizing *what*); dozens
means specific days want a revisit — you know exactly which ones.

---

## 🏁 After Day 30

**The habit that keeps the skill:** the loop you ran today, on everything you
build, until it's not a checklist but just *how you work*. Plus:

- **Feed the `til` repo** — one note per thing learned, forever. It compounds.
- **The contribution** — Day 18's claimed issue or the next one; open source is
  the gym where these muscles stay strong.
- **Teach it** — the Day-1 lesson (three zones, first commit) to a colleague or
  your cohort. Teaching is the final exam that never ends; you'll learn what you
  actually know within ten minutes of explaining it.
- **The tracker** — export your journal (sidebar button — 30 days of your own
  words about your own learning). Read it once, start to finish. That document
  is the real certificate.

---

## ⚠️ One Last Table — The Habits (the mistakes that no longer have power over you)

| Then | Now |
|---|---|
| "I'm afraid to touch it, I might break something" | Committed work is unloseable; reflog is real; rescue-branch first. Fear was just missing information. |
| Giant "various fixes" commits | Small commits — for review, for bisect, for cherry-pick, for future-you. Every advanced tool paid you back for this. |
| Push and pray | Fetch, read, integrate, push. Prediction replaced prayer around Day 12. |
| History as a diary of accidents | History as a written artifact — curated before sharing, honest after. |
| "It works on my machine" | A robot proves it works on a machine nobody owns, on every push, forever. |

---

## 📖 Where to Go Deeper

- **Pro Git** (git-scm.com/book) — you've now touched most of it; the Internals
  chapter is the satisfying "how it really works" dessert
- **git-scm.com/docs** — the reference, now that every page speaks your language
- Your own `MY-GIT-RUNBOOK.md` and `til/` — the resources you wrote

---

**Thirty days. Ninety minutes at a time. From `git init` to a tagged, CI-verified
release — and more importantly, from fear to fluency.**

**Go press the release button. You've earned the green checkmark. 🏆**
