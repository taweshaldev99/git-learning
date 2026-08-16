# Day 4: Branches — Parallel Universes

> Phase 1 · Git Fundamentals · 90 minutes
> **Goal:** Create, switch, and delete branches to isolate work in progress.

---

## 🎯 Learning Objective

Use branches as cheap, disposable workspaces — one per idea.

**Success criteria**
- ✅ Create and switch branches with `git switch`
- ✅ Explain what HEAD is and what actually happens on switch
- ✅ Delete a merged branch and force-delete an abandoned one — knowing the difference

---

## 🧠 Concept (5 min)

A branch is **not a copy of your code**. It's a sticky note with a name, pointing at
one commit. That's why creating a branch is instant even on huge repositories.

```
              main
                │
                ▼
  A ─── B ─── C
                ▲
                │
             feature        ← both names point at C. No copying happened.
```

Commit on `feature`, and only the sticky note moves:

```
              main
                │
                ▼
  A ─── B ─── C ─── D
                      ▲
                      │
                   feature
```

**HEAD** is the sticky note on the sticky note — it marks *which branch you're on*.
`git switch feature` does two things: moves HEAD, and updates your working files to
match that branch's latest commit.

Mindset shift: branches are disposable. Professionals make one for every experiment,
bug fix, and half-baked idea — merge the good ones, delete the rest, `main` stays clean.

---

## 🚶 Guided Walkthrough (15 min)

```bash
mkdir day4-branches && cd day4-branches && git init
echo "home page" > site.txt
git add . && git commit -m "Initial site"
```

### 1. Where am I?

```bash
git branch          # * marks the current branch
git status          # first line: On branch main (or master)
```

*(If your default is `master`, either is fine — or run `git branch -m main` to rename.)*

### 2. Create and switch

```bash
git switch -c dark-mode     # -c = create and switch, one step
git branch                  # * dark-mode
```

*(Older tutorials say `git checkout -b` — same effect. `switch` is the modern,
purpose-built command; use it.)*

### 3. Diverge

```bash
echo "dark css" >> site.txt
git commit -am "Add dark mode styles"
git switch main
cat site.txt                # "dark css" is GONE — you're in the other universe
git switch dark-mode
cat site.txt                # and it's back
```

Watch the file change content as you switch. That moment is branches clicking.

### 4. The picture

```bash
git switch main
echo "footer" >> site.txt
git commit -am "Add footer"
git log --oneline --graph --all
```

```
* f00te4  (HEAD -> main) Add footer
| * da4kc0  (dark-mode) Add dark mode styles
|/
* 1n1t1a  Initial site
```

Two universes, one shared past. Tomorrow you'll merge them.

### 5. Housekeeping

```bash
git branch experiment          # create without switching
git branch -d experiment       # delete — fine, it pointed at a commit main has
git switch -c doomed
echo x >> site.txt && git commit -am "Doomed work"
git switch main
git branch -d doomed           # REFUSES — commits would be orphaned
git branch -D doomed           # capital D = "yes, throw it away"
```

`-d` is the safety catch; `-D` is the override. Reach for `-D` only when you mean it.

---

## 🛠️ Practice (40 min)

### Exercise A — Basic (10 min)
1. Fresh repo, one commit on `main`.
2. Create `feature-login`, commit twice on it.
3. Create `feature-search` **from main** (switch to main first!), commit once.
4. `git log --oneline --graph --all` — you should see a fork. Sketch it on paper.

**Check:** you can point at the sketch and say which commit each branch name points to.

### Exercise B — Intermediate (15 min)
The uncommitted-changes trap:
1. On `main`, edit a file but **don't commit**.
2. `git switch feature-login`. Two outcomes are possible: Git carries the edit over,
   or refuses (`error: Your local changes... would be overwritten`). Which happened, and why?
   (Git carries changes when they don't collide with the target branch; refuses when they would.)
3. Force the *other* outcome: get back to main, commit or restore, then engineer a
   collision — edit a line that differs between the branches and try switching again.
4. Rule of thumb, written in your own words: *when is it safe to switch with dirty files?*
   (Preview: Day 9's stash makes this problem vanish.)

### Exercise C — Advanced (15 min)
1. Create `detached` experiment: `git log --oneline`, copy the FIRST commit's ID, then
   `git switch --detach <id>`. Read the warning. You're on a commit with no branch —
   "detached HEAD."
2. Make a commit here. Run `git log --oneline --all` — where is it? Now `git switch main`.
   Your commit is unreachable (Git even prints its ID and how to keep it).
3. Recover it: `git branch rescued <that-id>`. Confirm with the graph.
4. One sentence: what is detached HEAD *for*? (Answer: looking around the past —
   and you now know branches are how you keep anything you build there.)

---

## 🎬 Challenge (20 min)

**Scenario:** Friday, 4:50 pm. You're halfway through redesigning the navbar on branch
`navbar-v2` (2 commits in, working tree has *uncommitted* work too). Your lead pings:
**"Prod bug — the contact page shows the wrong email. Fix on main, now."**

Rules:
- The navbar work — committed *and* uncommitted — must survive untouched.
- The fix must be a single clean commit on `main`.
- The redesign must not leak into the fix.

Set it up:

```bash
mkdir hotfix-drill && cd hotfix-drill && git init
printf "nav v1\ncontact: hello@old-domain.com\n" > site.txt
git add . && git commit -m "Launch site"
git switch -c navbar-v2
sed -i 's/nav v1/nav v2-wip/' site.txt && git commit -am "Navbar skeleton"
echo "nav styles wip" >> site.txt        # uncommitted!
```

Do the drill. (Legitimate paths exist: commit the WIP as `WIP` and clean it later, or
use `git stash` early if you look it up. Both are real-world answers.)

**Success:** `git log --oneline main` shows launch + one fix commit; `navbar-v2` still
has its work; nothing lost.

---

## 🤔 Reflection (10 min) — answer in your tracker

1. What was the hardest concept today?
2. Explain what a branch physically is, in one sentence, to a non-programmer.
3. When would you branch in real work where you currently wouldn't?
4. What edge case do you still want to explore? (e.g. can two branches point at the same commit?)
5. What would raise your confidence one point?

---

## ⚠️ Common Mistakes

| Mistake | Fix |
|---|---|
| Committed to `main` by accident | `git branch feature` (label where you are), then `git switch main` won't help — you need Day 7's `reset`. For now: the work is safe, it's just the labels that are wrong. |
| "error: would be overwritten by checkout" | Commit, restore, or (Day 9) stash the dirty files first. |
| Created a branch but commits land on main | You created without switching. `git switch <name>` — or always use `switch -c`. |

---

## 📖 Resources

- Book: [Branches in a Nutshell](https://git-scm.com/book/en/v2/Git-Branching-Branches-in-a-Nutshell) — the diagrams are excellent
- [learngitbranching.js.org](https://learngitbranching.js.org/) — interactive visual practice, do the "Introduction Sequence"

**Next up — Day 5:** Merging — bringing universes back together, and why some merges are trivial and others aren't.
