# Day 15: Code Review — Giving and Receiving

> Phase 2 · GitHub Collaboration · 90 minutes
> **Goal:** Leave actionable review comments and respond to feedback with follow-up commits.

---

## 🎯 Learning Objective

Review code so the author thanks you, and receive review so the reviewer wants to
review for you again.

**Success criteria**
- ✅ Write comments that are specific, kind, and actionable (with severity labeled)
- ✅ Use GitHub's review machinery properly: batched reviews, suggestions, approve/request-changes
- ✅ Respond to feedback with commits + replies, never with silence or defensiveness

---

## 🧠 Concept (5 min)

Code review has two products: **better code today** and **a team that trusts each
other tomorrow**. Comments that win one and lose the other are failures.

**The comment formula:** *observation → reason → suggestion.*

> ❌ "This is wrong."
> ❌ "Maybe consider possibly using a map here or something?"
> ✅ "This loop is O(n²) because `includes` scans the list each pass. A `Set` lookup
> makes it O(n). Worth it — this runs per keystroke."

**Label severity** so the author knows what's negotiable:

- `blocking:` — must change before merge (bugs, security, data loss)
- `suggestion:` — better way, author's call
- `nit:` — style/naming trivia; never blocks a merge
- `question:` — you genuinely don't understand yet (asking is reviewing!)
- `praise:` — good patterns, named specifically. Not fluff — it teaches too.

**Receiving:** every comment gets a response — a fixing commit + "done", a reasoned
"keeping it because…", or a clarifying question. Review the code you *wish* you'd
written, not your ego. The reviewer is your ally against future bugs.

**Reviewing is reading with a checklist:** Does it do what the PR says? What breaks
on empty/null/huge input? Is anything untested? Would a stranger understand this in
six months?

---

## 🚶 Guided Walkthrough (15 min)

Set up a PR with planted flaws to review (your own repo):

```bash
git switch main && git pull && git switch -c user-validation
cat > validate.js << 'EOF'
function validateUser(u) {
  if (u.name.length > 0 && u.name.length < 20) {
    if (u.email.includes("@")) {
      var ok = true;
      return true;
    }
  }
  return false;
}
EOF
git add . && git commit -m "Add user validation"
git push -u origin user-validation
```

Open the PR. Now review it *properly*:

### 1. Batch, don't spray

In **Files changed**, click **+** on a line and choose **Start a review** — NOT
"Add single comment." Single comments email the author one at a time; a batched
review arrives as one coherent package. Add these (they're all real):

- line 2 — `blocking: u.name throws if name is missing — crashes on {}. Guard u.name first.`
- line 4 — `question: should "a@" really pass? includes("@") accepts it.`
- line 5 — `nit: var ok is unused — leftover?`
- overall — `suggestion: early returns would flatten the nesting.`

### 2. The suggestion block — review's best feature

On the `var ok = true;` line, comment with the **± suggestion** button:

````
```suggestion
```
````

(An empty suggestion block = "delete this line.") The author can apply it with one
click, as a commit, attributed to you both.

### 3. Submit the review

**Finish your review** → summary: *"Solid start — one crash-level guard needed, rest
is polish. Nice clean function shape."* → **Request changes**.

### 4. Author hat: respond completely

```bash
cat > validate.js << 'EOF'
function validateUser(u) {
  if (!u || typeof u.name !== "string" || typeof u.email !== "string") return false;
  if (u.name.length === 0 || u.name.length >= 20) return false;
  return /^[^@\s]+@[^@\s]+$/.test(u.email);
}
EOF
git commit -am "Guard missing fields, tighten email check"
git push
```

On the PR: reply to each thread (`done in <sha>` / answer the question / apply the
suggestion) → **Resolve** each → re-request review (circular-arrows icon by the
reviewer's name). Reviewer-you: **Approve** with a sentence. Merge. Clean up.

---

## 🛠️ Practice (40 min)

### Exercise A — Basic (10 min)
Severity calibration. Label each (blocking / suggestion / nit / question) and write
the one you'd struggle with as a full formula comment:
1. Password logged to console in the login handler.
2. Function named `doStuff()`.
3. Four-space indent in a two-space codebase (no linter configured).
4. A cache added with no invalidation — you don't see how it ever refreshes.
5. `parseInt(x)` without a radix in money code.

*(Suggested: 1 blocking · 2 suggestion (nit if trivial scope) · 3 nit — and propose
adding a formatter so humans never review this again · 4 question, likely upgrades
to blocking · 5 blocking-ish — old environments and edge cases bite in money paths.)*

### Exercise B — Intermediate (15 min)
Plant-and-review, full cycle: branch with a deliberately flawed function (pick your
language; include one crash bug, one unused variable, one naming issue). Push, PR,
**batched** review with all five severity labels used at least once, one
`suggestion` block, request changes → fix → resolve → approve → squash-merge →
clean up. *(Yes, alone — the ritual builds the muscle; Day 20's capstone does it with
a partner if you have one.)*

### Exercise C — Advanced (15 min)
Review a real PR in the wild: open any active open-source repo → Pull requests →
pick a small open PR (docs PRs are perfect).
1. Read the diff cold. Write (in a private note, not on the PR) three formula-style
   comments including severities.
2. Now read the maintainers' actual comments. Compare: what did they catch that you
   missed? What tone habits do you see?
3. If — and only if — one of your comments is genuinely useful and kind, consider
   posting it. Otherwise the private rehearsal was the exercise.

---

## 🎬 Challenge (20 min)

**Scenario:** The tense review. You must exercise *both* halves of the hardest
review skill: pushing back and backing down.

1. Branch `quick-cache`; commit this with the message `Cache user lookups`:

```js
const cache = {};
function getUser(id) {
  if (cache[id]) return cache[id];
  cache[id] = db.lookup(id);      // pretend db exists
  return cache[id];
}
```

2. Open the PR. Reviewer-you leaves TWO comments:
   - `blocking: unbounded cache — memory grows forever in a long process. Needs a cap or TTL.`
   - `blocking: cache[id] is falsy for legitimately-missing users, so misses re-hit
     the db every call. Use a Map and has().`
3. Author-you **disagrees with the first** (this process restarts nightly; a cap is
   YAGNI) and **agrees with the second**. Respond accordingly:
   - Thread 1: a respectful, *reasoned* pushback — context, trade-off, proposal
     ("add a TODO + metric instead?"). No defensiveness, no capitulation.
   - Thread 2: fix properly (Map + has), commit, `done in <sha>`.
4. Reviewer-you accepts the pushback ("fair — TODO + metric works, not blocking"),
   approves. Merge, clean up.

**Success:** the two threads read like a healthy team: one turned into a fix, one
into a documented decision — and neither into a fight.

---

## 🤔 Reflection (10 min) — answer in your tracker

1. What was the hardest concept today?
2. Write your personal comment formula in your own words.
3. Recall a review you received (or gave) that went badly — which of today's rules was missing?
4. What edge case do you still want to explore? (e.g. reviewing a 2,000-line PR — what do you even do?)
5. What would raise your confidence one point?

---

## ⚠️ Common Mistakes

| Mistake | Fix |
|---|---|
| 30 single comments, 30 emails | **Start a review** → batch → one submit. |
| "LGTM" on code you skimmed | An approval is your name on it. Review smaller PRs properly instead of big ones vaguely. |
| Blocking on nits | Nits never block. Say `nit:` and approve; or better — automate style with a formatter and never speak of it again. |
| Silent fixes with no replies | The reviewer can't tell what changed. Every thread gets a reply; resolve after responding. |
| Arguing in 12-comment threads | Two rounds of disagreement → take it to a call, then write the outcome in the thread. |

---

## 📖 Resources

- [Google's Code Review Developer Guide](https://google.github.io/eng-practices/review/) — both the reviewer and author halves
- [Conventional Comments](https://conventionalcomments.org/) — the severity-label idea, formalized

**Next up — Day 16:** Issues, labels, milestones, projects — the work *around* the code, tracked where the code lives.
