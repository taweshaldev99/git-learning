# Day 18: Contributing to Someone Else's Repo

> Phase 2 · GitHub Collaboration · 90 minutes
> **Goal:** Complete a fork → branch → PR contribution to an external project.

---

## 🎯 Learning Objective

Walk into a stranger's repository and contribute the way maintainers wish everyone
would.

**Success criteria**
- ✅ Case a project before touching it: CONTRIBUTING, issue etiquette, PR norms
- ✅ Submit (or fully rehearse) a real external PR through the fork triangle
- ✅ Know the maintainer's-eye view: what gets PRs merged vs ignored

---

## 🧠 Concept (5 min)

Contributing to open source is Days 13–17 pointed at a repo where **you are a
guest.** The Git mechanics are identical; what changes is *etiquette and burden of
proof* — you carry all of it.

**The guest protocol:**

```
 1. CASE IT      read README, CONTRIBUTING.md, CODE_OF_CONDUCT, recent merged PRs
                 (what do successful contributions look like HERE?)
 2. CLAIM IT     find/open an issue; comment "I'd like to take this" — wait for a nod
                 on anything bigger than a typo
 3. BUILD IT     fork → clone fork → upstream remote → sync → branch → small commits
 4. PROVE IT     follow their test/lint instructions BEFORE pushing
 5. OFFER IT     PR: what/why/verify + "Closes #N" — matching their template
 6. STAY WITH IT respond to review within days; maintainers drop silent PRs
```

**Why maintainers ignore PRs** (their inbox, their rules): unsolicited big rewrites,
style-only churn, no linked issue, failing checks, radio silence after review. The
inverse list is your checklist.

**Where to start, realistically:** docs fixes, error-message clarity, `good first
issue` labels, a bug *you actually hit* in a tool you actually use. Your first PR
being small is a feature — you're learning their pipeline, not proving brilliance.

---

## 🚶 Guided Walkthrough (15 min)

Today's walkthrough is a *casing exercise* on a real project — pick one you use
(a library, a CLI tool, this challenge's inspiration repos, anything alive).

### 1. Case the repo (10 min, honest reading)

Open the repo and find written answers to:

```
- Is it alive?         last commit date · open vs closed PR ratio · issue response times
- House rules?         CONTRIBUTING.md (setup steps? test command? commit style? DCO/CLA?)
- PR norms?            read 3 recently MERGED PRs: size, description style, review rounds
- Entry points?        labels: good first issue / help wanted / documentation
- Communication?       do maintainers want issues first, or direct PRs for small fixes?
```

Write the answers down — this sheet decides everything you do next.

### 2. Set up the triangle (Day 13, now with real stakes)

```bash
# after forking on GitHub:
git clone git@github.com:YOU/<project>.git && cd <project>
git remote add upstream https://github.com/<owner>/<project>.git
git fetch upstream
git merge upstream/main       # sync BEFORE branching — stale-base PRs annoy everyone
git switch -c docs/fix-typo-in-install
```

*(Branch name follows THEIR convention if CONTRIBUTING specifies one.)*

### 3. Their proof, not yours

Run **their** verification — whatever CONTRIBUTING says: `npm test`, `make lint`,
`cargo test`. If setup fails, that's today's contribution: an issue titled
"Setup instructions fail on Windows at step 3" with exact output. Broken
onboarding docs are the most under-reported bug class in open source.

### 4. The PR itself

Small commit(s), their message style, push to your fork, open PR against their main.
Their template if present; otherwise what/why/verify plus the issue link. Then the
hard part: **wait politely.** Days, sometimes weeks. That's normal, not rejection.

---

## 🛠️ Practice (40 min)

### Exercise A — Basic (10 min)
Case two more projects with the five-question sheet — one big framework
(battle-tested process) and one small tool (maybe no process at all). Compare
sheets: which is *easier* to contribute to? (Often the small one — less process —
but slower review. Trade-offs everywhere.)

### Exercise B — Intermediate (15 min)
Find your genuine target:
1. Search issues across your candidate repos: `label:"good first issue" is:open
   no:assignee` (add `language:python` etc. in global search).
2. Shortlist 3 issues you could actually do. For each: effort estimate, files
   you'd touch (case the code with Day 3 skills: `git log -- path`, blame), and
   whether it needs a claim-comment first.
3. Pick one. Post the claim comment if warranted ("I'd like to take this — planning
   to X. Sound right?"). This comment is a real contribution step, do it for real.

### Exercise C — Advanced (15 min)
The maintainer's chair (empathy training):
1. In YOUR practice repo, imagine receiving three PRs: (a) 900-line rewrite, no
   issue, no description; (b) one-line typo fix, clean; (c) good feature, failing
   checks, author silent 10 days.
2. Write the maintainer response to each — kind, firm, actionable. What would make
   (a) salvageable? When do you close (c)?
3. Now add the two files that pre-empt these situations to your repo:
   `.github/pull_request_template.md` (what/why/verify skeleton + "linked issue?"
   checkbox) and, if missing, `CONTRIBUTING.md` distilled from Day 17's conventions.
   PR them in through your own protected main, obviously.

---

## 🎬 Challenge (20 min)

**Scenario:** Ship it. The training wheels come off — one real contribution, end to
end, chosen from these tiers (pick the highest tier you can complete honestly today):

- **Tier 1 — the real thing:** your Exercise B issue: sync fork → branch → fix →
  their tests → PR with issue link → template followed. Post it.
- **Tier 2 — the docs PR:** a genuine docs/typo/error-message improvement to any
  project you use (no claim needed for typos — case their norms first though).
- **Tier 3 — full-fidelity rehearsal:** if nothing external is ready: a friend's
  repo, or your own second account, or `firstcontributions/first-contributions`
  (a repo that exists to receive practice PRs) — the complete triangle + PR + a
  review round, no steps skipped.

Whatever tier: **the deliverable includes the aftermath plan.** Write down: when
you'll check for review responses (calendar it), what you'll do on "changes
requested" (respond within 48h), and on 3 weeks of silence (one polite bump, then
let it rest — never rage-close).

**Success:** a PR exists somewhere outside your own repos (or a full-fidelity
rehearsal thereof), and it would make a tired maintainer's day *easier*, not harder.

---

## 🤔 Reflection (10 min) — answer in your tracker

1. What was the hardest concept today?
2. Explain the guest protocol in your own words — which step would you have skipped a month ago?
3. What in your daily toolchain deserves a contribution from you eventually?
4. What edge case do you still want to explore? (e.g. DCO sign-offs, CLAs — what did you agree to?)
5. What would raise your confidence one point?

---

## ⚠️ Common Mistakes

| Mistake | Fix |
|---|---|
| Giant surprise PR | Issue first, claim, agree on approach, THEN build. Rewrites arrive by invitation. |
| PR from your fork's `main` | Always a topic branch — you'll want main clean for the *next* sync and PR. |
| Ignoring their test/lint step | First thing the maintainer's CI checks; failing checks = unread PR. |
| Taking "changes requested" personally | It's the *good* outcome — they're investing in merging you. Respond fast and gracefully. |
| Bumping daily | One bump after 2–3 weeks. Maintainers are unpaid; patience is part of the gift. |

---

## 📖 Resources

- [How to Contribute to Open Source](https://opensource.guide/how-to-contribute/) — the canonical guide
- [firstcontributions/first-contributions](https://github.com/firstcontributions/first-contributions) — the practice-PR repo
- [goodfirstissue.dev](https://goodfirstissue.dev/) — curated entry-point issues

**Next up — Day 19:** README, LICENSE & repo hygiene — making YOUR repos the kind strangers can walk into.
