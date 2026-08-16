# Day 6: Merge Conflicts Without Fear

> Phase 1 · Git Fundamentals · 90 minutes
> **Goal:** Read conflict markers and resolve a multi-file conflict in under five minutes.

---

## 🎯 Learning Objective

Treat a conflict as a routine two-minute chore, not an emergency.

**Success criteria**
- ✅ Explain exactly when conflicts happen (and when they don't)
- ✅ Resolve a conflict by hand: markers → decision → `add` → `commit`
- ✅ Escape any bad merge with `git merge --abort`

---

## 🧠 Concept (5 min)

A conflict is not an error. It's Git saying: **"Both sides changed the same lines
differently — I'm not going to guess. You decide."**

When conflicts DON'T happen: different files, or different parts of the same file —
Git combines those silently (that was all of Day 5).

When they DO: the same line (or adjacent lines) changed on both branches since the
common ancestor. Git stops mid-merge and writes both versions into the file:

```
<<<<<<< HEAD
price = 120          ← your side (the branch you're on)
=======
price = 99           ← their side (the branch being merged)
>>>>>>> feature-sale
```

Your job: **edit the file until it's what the code should be** — keep yours, keep
theirs, keep both, or write something new — and delete the three marker lines. Then
`git add` the file (which means "resolved"), and commit.

That's the whole skill. Everything else is calm bookkeeping.

---

## 🚶 Guided Walkthrough (15 min)

### 1. Manufacture a conflict

```bash
mkdir day6-conflict && cd day6-conflict && git init
echo "price = 100" > store.txt
git add . && git commit -m "Base price"
git switch -c sale
echo "price = 99" > store.txt && git commit -am "Sale price"
git switch main
echo "price = 120" > store.txt && git commit -am "Raise price"
git merge sale
```

```
CONFLICT (content): Merge conflict in store.txt
Automatic merge failed; fix conflicts and then commit the result.
```

Breathe. Nothing is broken.

### 2. Survey the damage

```bash
git status
```

Key section: `Unmerged paths: both modified: store.txt`. That's your to-do list.
`git diff` at this point shows the conflict with both sides annotated.

### 3. Resolve

Open `store.txt` — you'll see the marker block from the concept section. Decide the
business answer (say the sale wins), make the file exactly:

```
price = 99
```

No markers left. Then:

```bash
git add store.txt      # "this file is resolved"
git status             # All conflicts fixed but you are still merging
git commit             # default message "Merge branch 'sale'" is fine
```

Done. `git log --oneline --graph` shows a normal merge commit.

### 4. The escape hatch

Re-create any conflict and practice:

```bash
git merge --abort
```

Instantly back to pre-merge. Knowing this exists is 80% of losing the fear: **you
cannot get trapped in a merge.**

### 5. See three versions while resolving

Mid-conflict, these answer "what did each side actually have?":

```bash
git show :1:store.txt   # common ancestor's version
git show :2:store.txt   # yours (HEAD)
git show :3:store.txt   # theirs
```

---

## 🛠️ Practice (40 min)

### Exercise A — Basic (10 min)
1. Manufacture a fresh single-line conflict (pattern above).
2. Resolve it keeping **their** side. Commit.
3. Manufacture another. Resolve it keeping **both lines** (yours then theirs). Commit.
4. Manufacture a third. `git merge --abort`. Confirm `git status` is clean.

**Check:** three merges attempted, zero panic, working tree clean at the end.

### Exercise B — Intermediate (15 min)
Multi-file conflict:
1. Base commit with `a.txt`, `b.txt`, `c.txt` (one line each).
2. Branch `left`: change the line in **all three** files. Commit.
3. On main: change the line differently in **a and c only**. Commit.
4. Merge. Predict before looking: which files conflict? (a and c — b merges clean.)
5. Resolve: `a.txt` keep main's, `c.txt` keep left's. Commit.
6. Verify each file's final content with `cat`.

**Timing:** note how long resolution took. Goal by Day 10: under five minutes for this drill.

### Exercise C — Advanced (15 min)
1. Base file with 10 numbered lines. Branch A changes lines 2–3; branch B (from the
   same base) changes lines 8–9. Merge both into main. Conflict or not? Why?
   *(No — separated hunks merge cleanly. Adjacency matters.)*
2. Now both branches change line 5, plus each keeps its earlier edit. Merge — resolve
   the single conflicted hunk while the clean hunks auto-merge around it.
3. During the conflict, run the `:1:/:2:/:3:` inspection from the walkthrough and
   write one sentence on what stage 1 (the ancestor) told you that the markers didn't.

---

## 🎬 Challenge (20 min)

**Scenario:** Two teammates edited the team contact page all morning. Both branches
are "done." You're the integrator.

```bash
mkdir integrator && cd integrator && git init
cat > contact.txt << 'EOF'
Support: support@team.dev
Phone: 555-0100
Hours: 9-5 Mon-Fri
Address: 12 Old Road
EOF
git add . && git commit -m "Contact page"
git switch -c update-hours
sed -i 's/Hours: 9-5 Mon-Fri/Hours: 8-6 Mon-Sat/' contact.txt
sed -i 's/Phone: 555-0100/Phone: 555-0100 ext 2/' contact.txt
git commit -am "New hours and phone extension"
git switch main && git switch -c rebrand
sed -i 's/Support: support@team.dev/Support: help@newbrand.io/' contact.txt
sed -i 's/Phone: 555-0100/Phone: 555-0199/' contact.txt
sed -i 's/Address: 12 Old Road/Address: 500 New Plaza/' contact.txt
git commit -am "Rebrand contact details"
git switch main
```

Integrate **both** branches into main. The business truth you must end with:
new brand email, **new phone number 555-0199 with ext 2**, new hours, new address.

Note the phone line: each branch has half the truth — the correct resolution is a line
**neither side contains**: `Phone: 555-0199 ext 2`. Real conflicts are often like this.

**Success:** both merges committed, `cat contact.txt` shows all four correct lines,
graph shows two merge commits, and you finished in one sitting without `--abort`
(or you aborted once, regrouped, and did it — also a pass).

---

## 🤔 Reflection (10 min) — answer in your tracker

1. What was the hardest concept today?
2. Explain the three conflict markers to someone who has never seen them.
3. When would you *choose* `--abort` over pushing through in real work?
4. What edge case do you still want to explore? (e.g. what does a *deleted-vs-modified* conflict look like?)
5. What would raise your confidence one point?

---

## ⚠️ Common Mistakes

| Mistake | Fix |
|---|---|
| Committed with markers still in the file | Git doesn't stop you. Fix the file, `git add`, `git commit --amend` (before pushing anywhere). Searching `<<<<<<<` before committing becomes reflex. |
| `git add` before actually editing | You told Git "resolved" while both versions sit in the file. Edit properly, `add` again. |
| Merging into the wrong branch | `git branch` before `git merge`, every time. Standing in the wrong place is the #1 conflict multiplier. |
| Resolved the conflict "backwards" (kept the wrong side) | Before pushing: `git log -1` → `git show` the merge → if wrong, Day 7 tools undo it. Conflicts are decisions; review them like code. |

---

## 📖 Resources

- Book: [Basic Merge Conflicts](https://git-scm.com/book/en/v2/Git-Branching-Basic-Branching-and-Merging#_basic_merge_conflicts)
- Try once with a GUI (VS Code's merge editor) *after* you're fluent by hand — the
  buttons make sense only once you know what they press.

**Next up — Day 7:** Undoing changes — restore, reset, revert, and which one won't ruin your afternoon.
