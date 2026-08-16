# Day 13: Cloning & Forking

> Phase 2 · GitHub Collaboration · 90 minutes
> **Goal:** Choose between clone and fork based on write access and intent.

---

## 🎯 Learning Objective

Get any repository onto your machine the *right* way for what you intend to do with it.

**Success criteria**
- ✅ Clone a repo and explain everything that arrived
- ✅ Fork a repo, clone the fork, and wire up `upstream`
- ✅ Sync a stale fork with its source without touching the GitHub UI

---

## 🧠 Concept (5 min)

**Clone** = copy a repository to your machine. Full history, all branches, remotes
wired to where it came from. You clone when you can push there (your repo, your
team's repo) — or just to read/run code.

**Fork** = a GitHub-side copy **into your account**. You fork when you want to change
a repo you *can't* push to — the open-source workflow: fork it, clone *your fork*,
push to your fork, then propose changes back (Day 14's pull requests).

```
        can you push to it?
              │
      yes ────┴──── no, but I want to change it
       │                    │
     clone               fork on GitHub, then clone YOUR fork
       │                    │
   origin = the repo    origin   = your fork      (push here)
                        upstream = the original   (fetch news from here)
```

`upstream` is just a second remote nickname (Day 11 Ex B foreshadowed this). The fork
does **not** stay in sync automatically — it's your copy, and keeping it fresh is
your job. That's today's craft.

---

## 🚶 Guided Walkthrough (15 min)

### 1. Anatomy of a clone

```bash
mkdir day13 && cd day13
git clone https://github.com/octocat/Hello-World.git
cd Hello-World
git log --oneline -5          # their full history, now yours
git remote -v                 # origin → where it came from
git branch -a                 # local main + origin/* bookmarks for every branch
```

Everything Phase 1 taught works instantly on other people's repos: `git blame`,
`git log -S`, the works. Cloning to *read* well is a superpower by itself.

*(Useful variants: `git clone <url> myname` — choose the folder; `--depth 1` —
shallow clone, latest snapshot only, for huge repos you just want to run.)*

### 2. Fork + clone + upstream (the OSS triangle)

Pick any small public repo (GitHub's `octocat/Spoon-Knife` exists for exactly this):

1. On GitHub press **Fork** → it lands at `github.com/YOU/Spoon-Knife`.
2. Clone **your fork** (SSH URL from *your* page):

```bash
cd .. && git clone git@github.com:YOU/Spoon-Knife.git && cd Spoon-Knife
git remote -v                 # origin → YOUR fork
```

3. Wire the original as `upstream`:

```bash
git remote add upstream https://github.com/octocat/Spoon-Knife.git
git remote -v                 # two remotes, four lines — the triangle is complete
```

### 3. The sync ritual (memorize this trio)

```bash
git fetch upstream            # news from the original
git switch main
git merge upstream/main       # bring your main up to date (usually fast-forward)
git push origin main          # teach YOUR fork the news
```

Original → you → your fork. Run it before starting any new work in a fork, every time.

### 4. Work happens on branches, even here

```bash
git switch -c fix-readme
echo "improvement" >> README.md 2>/dev/null || echo "improvement" >> index.html
git commit -am "Improve docs"
git push -u origin fix-readme      # pushed to YOUR fork — no permission needed
```

That branch on your fork is what becomes a pull request tomorrow.

---

## 🛠️ Practice (40 min)

### Exercise A — Basic (10 min)
1. Clone any public repo that interests you (a tool you actually use).
2. Answer using Phase-1 skills only: How many commits does it have
   (`git rev-list --count HEAD`)? Who are the top 3 committers
   (`git shortlog -sn | head -3`)? What changed most recently and why?
3. `git branch -a` — how many remote branches exist? Pick one and look at what it's for.

### Exercise B — Intermediate (15 min)
Full triangle drill on `Spoon-Knife` (or any repo you forked):
1. Verify both remotes exist and point the right way (`git remote -v` — origin
   = yours, upstream = theirs).
2. Run the full sync ritual. (Nothing new upstream? The commands still succeed —
   "Already up to date" is a passing grade.)
3. Create a work branch, commit something small, push to your fork.
4. On GitHub, look at your fork's page: find the "This branch is N commits ahead of"
   banner. That banner is the triangle, rendered.

### Exercise C — Advanced (15 min)
Simulate a stale fork *locally* so you can watch the sync mechanics (bare-repo
sandbox, no GitHub):

```bash
mkdir triangle && cd triangle
git init --bare original.git
git clone original.git author && cd author
echo v1 > lib.txt && git add . && git commit -m "v1" && git push origin main && cd ..
git clone original.git your-fork.git --bare      # "the fork" (server-side copy)
git clone your-fork.git you && cd you
git remote add upstream ../original.git
```

1. As the author: add 2 commits, push. Your fork and clone now lag.
2. In `you`: prove the lag (`git fetch upstream` + `git log main..upstream/main`).
3. Run the sync ritual. Verify all three copies agree (`git log --oneline` in each).
4. One sentence: which of the three repos would GitHub's "Sync fork" button have
   updated, and which would STILL be stale? *(The button fixes the fork; your clone
   still needs a pull — a thing the button hides from beginners.)*

---

## 🎬 Challenge (20 min)

**Scenario:** You found a typo in an open-source project's README and you're going to
fix it *properly* — the complete pre-PR workflow, on a real repo.

Use `octocat/Spoon-Knife` (it exists to be practiced on) or any repo you like:

1. Fork it (skip if already forked — but then **sync the stale fork first**).
2. Clone your fork fresh into a new folder; wire `upstream`.
3. Sync ritual — prove main is current with upstream before you begin.
4. Branch `improve-docs`; make a genuine small improvement; commit with a message
   that would make sense to the maintainer (imperative, specific).
5. Push the branch to your fork.
6. Visit your fork on GitHub — the "Compare & pull request" button is lit.
   **Don't click it yet.** That's Day 14's opening move.

**Success:** `git log --oneline --all` shows your branch one commit ahead of a
current main; remotes correct; the yellow banner is waiting for tomorrow.

---

## 🤔 Reflection (10 min) — answer in your tracker

1. What was the hardest concept today?
2. Explain fork vs clone to a non-developer in two sentences.
3. Which real project would you actually want to contribute to? (Keep it in mind for Day 18.)
4. What edge case do you still want to explore? (e.g. what happens to a fork when the original is deleted?)
5. What would raise your confidence one point?

---

## ⚠️ Common Mistakes

| Mistake | Fix |
|---|---|
| Cloned the original instead of your fork; push denied | `git remote set-url origin git@github.com:YOU/repo.git` — repoint origin at your fork; add upstream for the original. |
| Fork drifted months behind | Same ritual, bigger merge: fetch upstream → merge → push. Do it *before* starting work and it never hurts. |
| Committed straight to `main` of the fork | Works, but PRs from main get messy the moment you need a second PR. `git branch feature && git reset --hard upstream/main` on main, work from the branch. |
| `upstream` vs `origin` confusion mid-command | `git remote -v` costs one second. Read it before every fetch/push until it's reflex. |

---

## 📖 Resources

- [GitHub Docs: Fork a repo](https://docs.github.com/en/get-started/quickstart/fork-a-repo)
- Book: [Contributing to a Project](https://git-scm.com/book/en/v2/Distributed-Git-Contributing-to-a-Project)

**Next up — Day 14:** Pull requests end to end — the button gets clicked.
