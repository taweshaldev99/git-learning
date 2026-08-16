# Day 25: Bisect — Find the Breaking Commit

> Phase 3 · Advanced Workflows · 90 minutes
> **Goal:** Binary-search history to locate the commit that introduced a bug.

---

## 🎯 Learning Objective

Turn "it worked last week, something in 200 commits broke it" from an afternoon of
archaeology into seven yes/no questions.

**Success criteria**
- ✅ Run a manual bisect session to the exact culprit commit
- ✅ Automate it with `git bisect run` and an exit-code test
- ✅ Explain why 1,000 commits need only ~10 checks

---

## 🧠 Concept (5 min)

You know two facts: some old commit was **good** (the feature worked) and the
current commit is **bad** (it doesn't). The culprit is *somewhere* between. Checking
every commit is O(n). Binary search is O(log n):

```
 good ────────────────────────────── bad        1000 candidates
                  ▲
            test the middle
        works? culprit is right half
        broken? culprit is left half            → 500 → 250 → 125 → 63 →
                                                  32 → 16 → 8 → 4 → 2 → 1
```

`git bisect` drives this: you declare the endpoints, it checks out midpoints, you
answer good/bad, it halves. Ten answers pinpoint one commit in a thousand.
**This is the payoff for small, working commits** — bisect lands on a 5-line commit
and the bug is *obvious*; land on a 500-line "various fixes" commit and you're
back to archaeology.

Three commands, whole tool: `git bisect start` · `git bisect good <sha>` /
`git bisect bad` · `git bisect reset` (always, when done — it returns you from the
detached-HEAD time machine).

The power move: `git bisect run <cmd>` — any command that **exits 0 for good,
non-zero for bad** answers the questions for you. Write the test once, get coffee.

---

## 🚶 Guided Walkthrough (15 min)

### 1. Build a haystack with a needle

```bash
mkdir day25 && cd day25 && git init
cat > calc.sh << 'EOF'
#!/bin/sh
echo $(( $1 + $2 ))
EOF
git add . && git commit -m "Working calculator"
# 15 innocent commits...
for i in $(seq 1 7); do echo "# note $i" >> notes.md; git add .; git commit -m "Docs $i"; done
# ...the sabotage, buried mid-history:
sed -i 's/+/-/' calc.sh && git commit -am "Refactor calculation internals"
for i in $(seq 8 14); do echo "# note $i" >> notes.md; git add .; git commit -m "Docs $i"; done
sh calc.sh 5 3        # 2. Should be 8. When did this break?!
```

### 2. Manual bisect

```bash
git bisect start
git bisect bad                          # current commit is broken
git bisect good $(git rev-list --max-parents=0 HEAD)   # first commit was good
# Bisecting: N revisions left... — Git checked out the midpoint (detached HEAD; expected!)
sh calc.sh 5 3                          # 8? → git bisect good   2? → git bisect bad
```

Repeat test-and-declare ~4 times. Then:

```
<sha> is the first bad commit
    Refactor calculation internals
```

Caught. Examine the crime: `git show <sha>` — a one-character `+`→`-`. Now leave
the time machine:

```bash
git bisect reset        # back to where you started. NEVER forget this.
```

### 3. Automated bisect

```bash
cat > test.sh << 'EOF'
#!/bin/sh
[ "$(sh calc.sh 5 3)" = "8" ]
EOF
chmod +x test.sh

git bisect start HEAD $(git rev-list --max-parents=0 HEAD)   # bad good, one line
git bisect run ./test.sh
# ...watch it drive itself to the same verdict...
git bisect reset
```

*(Keep `test.sh` untracked/ignored — a tracked test file wouldn't exist in old
commits being checked out.)*

### 4. Fix, then log the win

Fix the sign, commit `"Fix subtraction typo in calc (found by bisect)"` — messages
that credit bisect teach teammates the tool exists.

---

## 🛠️ Practice (40 min)

### Exercise A — Basic (10 min)
Sabotage drill from memory: fresh repo, 20 commits, break something at a random
midpoint (have a script pick, or bury it without looking). Manual-bisect it down.
Count your questions — was it ~⌈log₂ 20⌉ ≈ 5?

### Exercise B — Intermediate (15 min)
`bisect run` with a real predicate:
1. Repo where `config.json` grows over 15 commits; midway, a commit drops the
   required `"port"` key.
2. Write the one-line test (`grep -q '"port"' config.json`), run the automated
   bisect.
3. Rerun with `git bisect run grep -q '"port"' config.json` directly — no script
   file at all. Note in one line when the inline form suffices.

### Exercise C — Advanced (15 min)
The complications you'll meet in the wild:
1. **Untestable commit:** engineer one mid-history commit where the test *can't
   run* (e.g. `calc.sh` temporarily renamed). During bisect, answer
   `git bisect skip` — watch Git route around it. What does the final report say
   if the skip neighbors the culprit?
2. **Wrong endpoint:** start a bisect declaring a *bad* commit as good. Follow the
   confusion for two steps, then `git bisect log` (audit trail) → spot the lie →
   `git bisect reset` and restart honestly. Lesson: endpoints are evidence, verify
   them first.
3. **Terminology comfort:** rerun any bisect with `--term-old works --term-new
   broken` — for hunting when a *behavior change* (not a bug) appeared.

---

## 🎬 Challenge (20 min)

**Scenario:** A performance regression. Nobody *saw* it break — the report is
"deploys got slow sometime this month." The script `build.sh` should finish
instantly; somewhere in 25 commits, someone added a `sleep 3`.

Build the mystery (run exactly this, don't peek at where the needle lands):

```bash
mkdir slowdown && cd slowdown && git init
echo 'echo building...' > build.sh && git add . && git commit -m "Build script"
NEEDLE=$((RANDOM % 20 + 3))
for i in $(seq 1 25); do
  echo "# step $i" >> steps.md
  [ $i -eq $NEEDLE ] && echo 'sleep 3' >> build.sh
  git add .; git commit -m "Pipeline step $i" -q
done
echo "needle planted at step $NEEDLE — NO PEEKING" > /dev/null
```

**Your task:**
1. Write a test that *times* the build and fails when it's slow. Sketch:
   `start=$(date +%s); sh build.sh; [ $(( $(date +%s) - start )) -lt 2 ]` — as
   `perf-test.sh` (untracked).
2. Automated bisect, endpoints justified (verify the first commit is actually
   fast — Ex C's lesson).
3. Convict the commit; `git show` the evidence.
4. Fix it on a branch with a proper message; then — capstone flourish — write the
   three-line incident note: symptom, culprit sha + cause, fix + prevention
   (*"CI perf budget would have caught this on day one"* — Day 27 foreshadowing).

**Success:** the convicted sha's diff contains `sleep 3`; total wall-clock for the
hunt under 10 minutes; incident note reads like an engineer wrote it, because one did.

---

## 🤔 Reflection (10 min) — answer in your tracker

1. What was the hardest concept today?
2. Explain to a teammate why 1,000 commits cost ~10 tests, using the halving picture.
3. What bug in your past would bisect have found in minutes?
4. What edge case do you still want to explore? (e.g. bisecting when the bug is intermittent — flaky tests vs bisect?)
5. What would raise your confidence one point?

---

## ⚠️ Common Mistakes

| Mistake | Fix |
|---|---|
| Forgot `bisect reset`; later commands act haunted | You're still detached mid-bisect. `git bisect reset` any time — even days later. |
| good/bad answered backwards once | The verdict will be nonsense. `git bisect log` to audit, restart with care. |
| Test script was tracked, vanishes in old commits | Keep the test OUTSIDE the bisected history: untracked file, or absolute path elsewhere. |
| Bisecting with a flaky test | Binary search assumes truthful answers; flakiness poisons it. Run the test 3× per step (wrap in a loop) or fix the flake first. |
| Culprit is a giant commit, bug still hidden | Bisect did its job; the commit failed *its* job. Day 22's craft — small commits — is the other half of this tool. |

---

## 📖 Resources

- Book: [Binary Search debugging with bisect](https://git-scm.com/book/en/v2/Git-Tools-Debugging-with-Git)
- `git help bisect` — `skip`, `log`/`replay`, custom terms

**Next up — Day 26:** Tags, releases & semantic versioning — naming the commits that matter.
