# Day 26: Tags, Releases & Semantic Versioning

> Phase 3 · Advanced Workflows · 90 minutes
> **Goal:** Cut an annotated tag and publish a GitHub release.

---

## 🎯 Learning Objective

Mark the commits that matter with names the whole world can rely on.

**Success criteria**
- ✅ Create annotated tags and push them (knowing why plain `git push` didn't)
- ✅ Apply semver correctly: given a change, name the next version
- ✅ Publish a GitHub Release with notes generated from history

---

## 🧠 Concept (5 min)

A **tag** is a permanent name for one commit. Branches move; tags don't. `v1.4.2`
means the same commit forever — that permanence is what you ship, roll back to, and
compare against.

Two kinds; one habit:
- **Lightweight** (`git tag v1`) — bare pointer, no metadata. For private bookmarks.
- **Annotated** (`git tag -a v1 -m "..."`) — a full object: tagger, date, message,
  signable. **Releases are always annotated.**

**Semantic versioning** (`MAJOR.MINOR.PATCH`) is a promise encoded in a number:

```
 v2.4.1
  │ │ └── PATCH  bug fix, nothing new              │ upgrade fearlessly
  │ └──── MINOR  new features, nothing broken      │ upgrade when useful
  └────── MAJOR  BREAKING changes                  │ read the notes first
```

The question is never "how big was the work?" — it's **"what breaks for users?"**
A one-line change that renames a public function is MAJOR. Three months of internal
refactoring that changes nothing visible is PATCH.

**Gotcha with teeth:** `git push` does **not** push tags. `git push origin v1.0.0`
(or `--tags` for all) — forgetting this is why "but I tagged it!" and "there's no
tag on GitHub" are both true.

A **GitHub Release** = tag + human packaging: title, notes, downloadable assets.
Tags are for Git; releases are for people.

---

## 🚶 Guided Walkthrough (15 min)

Use a repo with real history (your `til` or practice repo):

### 1. First release tag

```bash
git switch main && git pull
git tag -a v1.0.0 -m "First stable release: core tracking works"
git tag                       # list
git show v1.0.0               # tag metadata + the commit it names
```

### 2. Push it (the step everyone forgets)

```bash
git push origin v1.0.0
# or all local tags: git push --tags
```

Check GitHub → the repo's Tags page: it's there. *(Refresh memory: plain `git push`
just moved the branch. Tags travel separately, on request.)*

### 3. Tag an OLD commit (forgot to tag last week's release?)

```bash
git log --oneline             # find last week's "release" commit
git tag -a v0.9.0 <sha> -m "Retroactive: pre-cleanup beta"
git push origin v0.9.0
```

### 4. Semver drill on your own history

```bash
git log --oneline v0.9.0..v1.0.0
```

Read what actually changed between the tags and say aloud why 1.0.0 (not 0.10.0)
was right. Then plan the *next* number three ways: a typo fix lands → `v1.0.1`;
a new stats page → `v1.1.0`; you rename the API's `/api/activities` → `v2.0.0`.

### 5. The GitHub Release

Repo → **Releases → Draft a new release** → choose `v1.0.0` → title
`v1.0.0 — first stable` → press **Generate release notes** (it drafts from merged
PRs since the last tag — Day 14 discipline pays off here) → edit into two sections:
*Highlights* (3 bullets, human language) and the generated changelog → attach a zip
if you have one → **Publish**.

Compare links: `.../releases/tag/v1.0.0` is now the URL you hand to users; the raw
tag was the URL for machines.

---

## 🛠️ Practice (40 min)

### Exercise A — Basic (10 min)
1. Make two small commits (any content). Tag `v1.0.1` annotated, push it.
2. Create a *lightweight* tag `checkpoint` too. Run `git show` on both — articulate
   the difference you see.
3. Delete the lightweight one locally and remotely if pushed
   (`git tag -d checkpoint`; `git push origin --delete checkpoint`) — bookmarks
   don't belong in the public tag list.

### Exercise B — Intermediate (15 min)
Semver judgment reps — for each, name the next version after `v2.3.7` and defend it
in a phrase:
1. Fixed a crash on empty input.
2. Added an optional `--json` output flag.
3. The config file format changed; old files no longer parse.
4. Dependencies bumped, no behavior change.
5. Deprecated (still works, warns) the `--xml` flag.
6. Removed the deprecated `--xml` flag.
7. Rewrote the whole storage engine; identical behavior, 3× faster.

*(Sketch: 1→2.3.8 · 2→2.4.0 · 3→3.0.0 · 4→2.3.8 · 5→2.4.0 — deprecation is a
feature-level signal · 6→3.0.0 — removal breaks · 7→2.3.8 or 2.4.0, argue it —
"faster" as a feature is a fair claim. Wrestling with #7 IS the exercise.)*

### Exercise C — Advanced (15 min)
Tags as coordinates (they plug into everything you've learned):
1. `git diff v1.0.0..v1.0.1 --stat` — the shipped delta, exactly.
2. `git log v1.0.0..HEAD --oneline` — "what's unreleased right now?" — the
   release-manager's daily question.
3. Check out a tag (`git switch --detach v1.0.0`) — you're touring an old release
   (detached, Day 4 taught you why that's fine for looking). Come back.
4. `git describe` — read output like `v1.0.1-3-ga1b2c3d` = "3 commits past
   v1.0.1". This string in your build's `--version` output turns every bug report
   into an exact commit. One sentence: where in a real app would you inject it?

---

## 🎬 Challenge (20 min)

**Scenario:** Your Git Challenge Tracker (the actual app you're using right now!)
deserves a real release. You're the release manager.

1. In `D:\git_learning` — it's not a git repo yet. Make it one, honestly:
   `git init`, verify `.gitignore` excludes `data/` (it does — Day 8 eyes: check
   anyway), initial commit of the tracker code + lessons.
2. Decide the version. It's stable, real users (you + friends), first public cut:
   argue `v1.0.0` vs starting `v0.x` — decide, write one sentence why.
3. Annotated tag with a message that summarizes what this release IS.
4. Create the GitHub repo, push code **and tag** (both steps — you know why).
5. Publish the Release: generated notes will be thin (one commit) — write the
   Highlights yourself: what the tracker does, requirements, the quick-start line.
   This release page is now something friends can be sent to.
6. Bonus reality: an hour later you fix a typo in the README. Walk the full loop —
   commit, next version number (you know it), tag, push both, second release.

**Success:** GitHub shows two releases with correct semver ordering, each tag
`git show`s a meaningful message, and `git log v1.0.0..v1.0.1` shows exactly the
typo fix. Your tracker is now *shipped software with a version history* — because
it is.

---

## 🤔 Reflection (10 min) — answer in your tracker

1. What was the hardest concept today?
2. The semver promise, explained to a user (not a developer) in two sentences.
3. Which of your real projects should get a `v1.0.0` this month?
4. What edge case do you still want to explore? (e.g. signed tags — who verifies, how?)
5. What would raise your confidence one point?

---

## ⚠️ Common Mistakes

| Mistake | Fix |
|---|---|
| Tagged locally, GitHub shows nothing | Tags don't ride `git push`. `git push origin <tag>` — every time, or automate in your release script. |
| Moved a published tag to a different commit | Never. A published version name must be immutable — cut `v1.0.1` instead. (Unpublished local tag: `-f` is fine.) |
| Versioning by size of effort | Semver measures *user impact* only. Three months of refactor can be a PATCH; a one-liner can be MAJOR. |
| Lightweight tags for releases | No message, no author, no signature — annotated (`-a`) is the release standard. |
| v0.x forever out of fear | 0.x means "no promises yet." The day real users depend on it, 1.0.0 is honesty, not bravado. |

---

## 📖 Resources

- [semver.org](https://semver.org/) — the spec; shorter than you think
- Book: [Tagging](https://git-scm.com/book/en/v2/Git-Basics-Tagging)
- [GitHub Docs: About releases](https://docs.github.com/en/repositories/releasing-projects-on-github/about-releases)

**Next up — Day 27:** GitHub Actions — a robot that tests every push, and the "required status check" from Day 17 finally gets armed.
