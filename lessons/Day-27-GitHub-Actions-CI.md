# Day 27: GitHub Actions — Your First CI Pipeline

> Phase 3 · Advanced Workflows · 90 minutes
> **Goal:** Run tests automatically on every push and block failing PRs.

---

## 🎯 Learning Objective

Put a robot between "I pushed" and "it merged" that refuses broken code.

**Success criteria**
- ✅ A workflow file that runs your checks on every push and PR
- ✅ Watch a red ✗ block a PR and a green ✓ release it (required status check armed)
- ✅ Read a failed run's logs and fix the break like it's routine — because it is

---

## 🧠 Concept (5 min)

**CI (continuous integration):** every push, a fresh machine clones your repo and
runs your checks. Not "works on my machine" — works on *a* machine, every time,
witnessed.

GitHub Actions is GitHub's built-in runner. You commit a YAML file; GitHub obeys it:

```
 .github/workflows/ci.yml
 ┌──────────────────────────────────────────────┐
 │ on:        when to run   (push, pull_request) │
 │ jobs:      what to run                        │
 │   test:                                       │
 │     runs-on: ubuntu-latest    ← fresh VM      │
 │     steps:                                    │
 │       - checkout the code                     │
 │       - set up the runtime                    │
 │       - run the checks       ← exit ≠ 0 = ✗  │
 └──────────────────────────────────────────────┘
```

The contract is exit codes, same as bisect yesterday: **step exits non-zero → job
fails → red ✗** on the commit and PR. Then Day 17's sleeping toggle wakes up:
**require status checks to pass** turns that ✗ into a locked merge button. The
protection trio completes: humans review (Day 15), rules enforce (Day 17), robots
verify (today).

Free tier is generous (public repos: free; private: 2,000 min/month) — a solo
learner will not hit the ceiling.

---

## 🚶 Guided Walkthrough (15 min)

Use your practice repo — it already has a testable thing if you built the tracker,
or make `test.sh` below.

### 1. Something to check

```bash
git switch main && git pull && git switch -c add-ci
cat > check.sh << 'EOF'
#!/bin/sh
set -e
echo "check 1: required files exist"
test -f README.md
echo "check 2: no TODO left on main-bound code"
! grep -rn "DO-NOT-SHIP" --include="*.md" --include="*.sh" . --exclude-dir=.git
echo "all checks passed"
EOF
chmod +x check.sh && sh check.sh      # green locally first
```

### 2. The workflow file (path is law: `.github/workflows/`)

```bash
mkdir -p .github/workflows
cat > .github/workflows/ci.yml << 'EOF'
name: CI
on:
  push:
    branches: [main]
  pull_request:

jobs:
  checks:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run repo checks
        run: sh check.sh
EOF
git add . && git commit -m "Add CI workflow with repo checks"
git push -u origin add-ci
```

### 3. Watch the robot work

Open the PR → the checks line appears → **Actions** tab → click the run → expand
steps → your script's output, line by line, from a machine you've never touched.
Green ✓. Merge it.

### 4. Arm the lock (Day 17's missing toggle)

Settings → Branches → edit the main rule → ✅ **Require status checks to pass
before merging** → search and select `checks` → save.
*(The check must have run at least once to appear in the list — it just did.)*

### 5. Prove the lock with a red build

```bash
git switch main && git pull && git switch -c break-ci
echo "DO-NOT-SHIP: temp hack" >> notes.md
git add . && git commit -m "Sneak a forbidden marker in"
git push -u origin break-ci
```

PR → watch it go red → **the merge button is locked**. Read the failing step's log —
it names the file and line. Fix (`git commit -am` after removing the line), push,
watch red → green → unlocked. That loop is CI's whole promise, felt.

---

## 🛠️ Practice (40 min)

### Exercise A — Basic (10 min)
1. Add a second job to `ci.yml` (sibling of `checks`): `lint-titles` — a step that
   fails on any `.md` file over 200 lines (`! find . -name "*.md" -not -path
   "./.git/*" | xargs -I{} sh -c 'test $(wc -l < {}) -gt 200 && echo {} && exit 1'
   ...` — or write your own simpler rule). PR it; watch **two** checks run in
   parallel on the run page.
2. Note: each job = separate fresh VM. What does that imply about sharing files
   between jobs? (You can't, without artifacts — parking that as an edge to explore.)

### Exercise B — Intermediate (15 min)
Real project, real runtime — CI for the tracker (or any Node/Python project):
1. If you did Day 26's challenge, `D:\git_learning` is a repo with
   `tracker-backend/test/render-test.js` in it. Workflow:

```yaml
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - name: Run render tests
        run: node tracker-backend/test/render-test.js
```

2. Push, watch the *actual test suite you've been benefiting from all week* run in
   the cloud. Then break a test on a branch (edit something render-test asserts),
   push, enjoy the red, revert, green.
3. Arm required-checks on this repo too. Your tracker now has the full trio.

### Exercise C — Advanced (15 min)
Matrix + event triggers (read the machine's dials):
1. Change `setup-node` to a matrix:

```yaml
    strategy:
      matrix:
        node: [18, 20, 22]
    steps:
      - uses: actions/setup-node@v4
        with: { node-version: ${{ matrix.node }} }
```

   Push → **three** parallel runs. This is "works on every version we support,"
   automated. (Your manual's "Node 18+" claim — now *verified* instead of asserted.)
2. Add `workflow_dispatch:` under `on:` → a **Run workflow** button appears in the
   Actions tab — manual trigger for on-demand runs.
3. Read one run's timing breakdown: where do the seconds go? (Checkout? Setup?
   Your script?) CI speed intuition starts here.

---

## 🎬 Challenge (20 min)

**Scenario:** Your cohort repo goes live next week (Day 17's challenge world). The
promise: *nothing broken can reach main, and releases are checked twice*. Build the
pipeline that keeps it:

1. **The gate:** `ci.yml` with two jobs — `tests` (the render-test run from Ex B)
   and `hygiene` (your check.sh style rules: required files present, no forbidden
   markers, `data/` never committed — `! git ls-files | grep -q "^data/"`).
2. **Arm both** as required checks on main.
3. **The proof-of-lock:** one PR that fails `hygiene` (commit a fake `data/db.json`),
   locked; fix by removing + confirming `.gitignore`; green; merge. Screenshot-or-
   describe the locked state in the PR conversation (evidence culture).
4. **The release check:** second workflow `release.yml` — `on: push: tags: ['v*']` —
   runs the same tests, then (echo-only is fine today) `echo "would draft release
   for ${{ github.ref_name }}"`. Tag `v1.0.2` (Day 26 loop: commit, tag, push tag)
   and watch the tag-triggered run fire.
5. **The paper trail:** update CONVENTIONS.md — "merges require green CI; releases
   are cut only from tags that passed release.yml" — through a PR, checked by the
   very pipeline it documents.

**Success:** two workflows, two required checks, one demonstrated lock, one
tag-triggered run — and a repo where your friends *cannot* accidentally break main.
That's not process for its own sake; that's kindness in YAML.

---

## 🤔 Reflection (10 min) — answer in your tracker

1. What was the hardest concept today?
2. The exit-code contract: connect it to bisect's test scripts in one sentence.
3. What check would save YOUR real project the most pain — and what's stopping you adding it this week?
4. What edge case do you still want to explore? (e.g. caching dependencies for speed? secrets in CI — how do they stay secret?)
5. What would raise your confidence one point?

---

## ⚠️ Common Mistakes

| Mistake | Fix |
|---|---|
| Workflow never triggers | Path must be exactly `.github/workflows/*.yml` on the branch you pushed. Typo'd `workflow/` haunts everyone once. |
| YAML indentation rage | Two spaces, no tabs. Copy a working file and mutate it; the Actions tab shows parse errors under the workflow name. |
| Works locally, red in CI | The VM is bare Linux: case-sensitive paths, no global installs, different line endings. The log names the missing piece — read it before re-pushing blind. |
| Required check "not found" in settings | It must have completed once on any branch first. Run it, then arm it. |
| `on: push` with no branch filter → CI storm on every branch | Fine actually — but know it's happening; filter to `[main]` + `pull_request` for the classic quiet setup. |

---

## 📖 Resources

- [GitHub Actions: Quickstart](https://docs.github.com/en/actions/quickstart)
- [Workflow syntax reference](https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions) — the one page to bookmark
- The marketplace: actions/checkout, setup-node, setup-python — the lego bricks

**Next up — Day 28:** Submodules, worktrees & big repos — Git at awkward scale.
