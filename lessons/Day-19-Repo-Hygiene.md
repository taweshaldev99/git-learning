# Day 19: README, LICENSE & Repo Hygiene

> Phase 2 · GitHub Collaboration · 90 minutes
> **Goal:** Make a repository that a stranger can understand and run.

---

## 🎯 Learning Objective

Turn a working-but-bare repo into one that answers every stranger question by itself.

**Success criteria**
- ✅ Write a README that gets a stranger from zero to running in minutes
- ✅ Choose a license deliberately (and know what "no license" actually means)
- ✅ Ship the hygiene set: .gitignore ✓, CONTRIBUTING, templates, description/topics

---

## 🧠 Concept (5 min)

Yesterday you were the stranger walking into repos. Today you build for that
stranger — who is, half the time, **you in eight months**.

**The README answers five questions in order** (the stranger's actual order):

```
 1. WHAT is this?          one honest sentence, top of file
 2. WHY would I care?      the problem it solves / screenshot if visual
 3. HOW do I run it?       prerequisites + copy-paste commands THAT WORK
 4. HOW do I use it?       one minimal example with expected output
 5. WHAT if I want more?   config, contributing link, license line
```

Most READMEs fail at #3 — instructions written from a machine where everything was
already installed. The cure is *testing them cold* (today's challenge).

**LICENSE is not decoration.** No license file = default copyright = legally nobody
may use, copy, or modify your code, even when it's public. The two mainstream picks:

- **MIT** — do anything, keep the notice. Maximum adoption, minimum rules.
- **GPL-3.0** — derivatives must stay open source under the same terms.
  A values choice; both are legitimate. (Apache-2.0 ≈ MIT + explicit patent grant —
  the corporate-comfort pick.)

**Hygiene set** (the difference between "code dump" and "project"): description +
topics on the GitHub page, `.gitignore` (Day 8), `CONTRIBUTING.md` (Day 17/18),
issue/PR templates, and no committed junk (secrets, builds, `node_modules/`).

---

## 🚶 Guided Walkthrough (15 min)

Pick your practice repo — currently a working code dump. Rehab it.

### 1. The README skeleton (adapt, don't copy blindly)

```bash
git switch main && git pull && git switch -c repo-hygiene
cat > README.md << 'EOF'
# Git Challenge Tracker

Track a 30-day Git/GitHub learning challenge — sessions, streaks, and a
reflection journal — from a single local server with zero dependencies.

## Requirements
- Node.js 18+

## Run it
    git clone git@github.com:YOU/REPO.git
    cd REPO/tracker-backend
    node server.js
Open http://localhost:5000 and create an account.

## Usage
Tick the seven session blocks as you work; a day completes when all seven are
done. Progress, streaks and stats update live.

## Contributing
See [CONTRIBUTING.md](CONTRIBUTING.md). Branch from main, one change per PR.

## License
MIT — see [LICENSE](LICENSE).
EOF
```

*(Writing a README for a different project? Same five questions, your answers.)*

### 2. The license, the proper way

On GitHub: **Add file → Create new file** → name it exactly `LICENSE` → the
**Choose a license template** button appears → pick MIT → it fills your name/year →
commit to your branch. *(Or paste the MIT text locally — the template button is just
GitHub being helpful with the boilerplate.)*

```bash
git pull   # if you used the web editor on the branch
```

### 3. Page-level hygiene

Repo page → ⚙️ next to *About*: one-line **description** (this is what search and
link-previews show), 3–5 **topics** (`git`, `learning`, `tracker`, `nodejs`).
Thirty seconds; permanent discoverability.

### 4. Templates (pre-answered questions)

```bash
mkdir -p .github/ISSUE_TEMPLATE
cat > .github/ISSUE_TEMPLATE/bug_report.md << 'EOF'
---
name: Bug report
about: Something broken?
---
**Steps:**
**Expected:**
**Actual:**
**Environment:**
EOF
cat > .github/pull_request_template.md << 'EOF'
**What:**
**Why:**
**How to verify:**
Closes #
EOF
git add . && git commit -m "Add README, license pointer, issue and PR templates"
git push -u origin repo-hygiene
```

PR it in through your Day 17 rules. Every future issue and PR in this repo now
starts half-written.

---

## 🛠️ Practice (40 min)

### Exercise A — Basic (10 min)
The junk audit on your practice repo, with Day 8 tools:
1. `git ls-files | sort` — read every tracked file. Anything generated? Secret?
   Editor litter?
2. Fix what you find (`git rm --cached` + ignore patterns), one cleanup commit.
3. Check the *repo page* junk too: default branch right? stale branches deleted?
   (`git branch -a`, prune ruthlessly — merged branches are history's job, not the
   branch list's.)

### Exercise B — Intermediate (15 min)
License literacy, applied:
1. Three repos you actually use: find each license. Any surprises?
2. Scenario answers (two sentences each): (a) you want to use a GPL library inside
   a closed-source product — issue? (b) an MIT project's code appears in a
   commercial app with no attribution anywhere — violation? (c) a public repo with
   NO license file — may you fork and build on it?
   *(Sketch: (a) yes, GPL obligations likely apply to the combined work; (b) yes,
   MIT requires the notice; (c) legally no — fork button ≠ license.)*
3. Confirm your own choice for the practice repo still fits after (a)–(c).

### Exercise C — Advanced (15 min)
The eight-months-later test on a REAL repo of yours (not the practice one — an
actual project, however scrappy):
1. Cold-read its README (or absence). Score the five questions 0–2 each.
2. Fix the worst two gaps right now — usually "how do I run it" and "what is this".
3. Add/verify: license, description, topics, .gitignore.
4. This is the repo future-you or an interviewer will open. One commit, real
   improvement, done today.

---

## 🎬 Challenge (20 min)

**Scenario:** The cold-start test — the only honest README review that exists.

1. Clone your practice repo into a temporary directory **as if you were a
   stranger**: `cd $(mktemp -d 2>/dev/null || echo /tmp) && git clone <url> cold-test && cd cold-test`
2. Follow YOUR README literally, line by line, like a robot with no context:
   every prerequisite named? every command copy-pasteable *from the repo root*?
   does the "verify it works" moment actually arrive?
3. Log every friction point, however small ("didn't say to cd", "port already in
   use note missing", "assumed git config exists").
4. Fix them all in one PR: `README: survive the cold-start test`. Re-run the test
   from a fresh clone until it passes clean.
5. Finish with the stranger's checklist on the repo page itself: sensible
   description? topics? license badge visible? templates firing?

**Success:** a fresh clone + README alone gets a stranger to the running app with
zero guesses — verified because you *were* the stranger, twice.

---

## 🤔 Reflection (10 min) — answer in your tracker

1. What was the hardest concept today?
2. The five README questions — from memory, in order.
3. Which of your real repos most needs the cold-start test, and when will you run it?
4. What edge case do you still want to explore? (e.g. dual licensing? README badges — which earn their pixels?)
5. What would raise your confidence one point?

---

## ⚠️ Common Mistakes

| Mistake | Fix |
|---|---|
| README written from the author's machine | Cold-start test in a temp clone. Every time it fails, a stranger was going to fail silently instead. |
| "I'll add a license later" | Later never comes and legally nobody can touch the code meanwhile. Two minutes, today. |
| Screenshot-free UI project | One image above the fold outsells three paragraphs. |
| Templates so long people delete them | Templates are prompts, not forms. Five lines beats fifty. |
| README promises ≠ current behavior | Stale docs are worse than none — they burn trust. README updates ride in the same PR as the behavior change (your Day 17 conventions can say so). |

---

## 📖 Resources

- [choosealicense.com](https://choosealicense.com/) — GitHub's license picker, plain-English terms
- [Make a README](https://www.makeareadme.com/) — structure + examples
- [Art of README](https://github.com/hackergrrl/art-of-readme) — the craft essay

**Next up — Day 20:** Phase 2 capstone — a full collaborative cycle, end to end, no notes. Then the quiz.
