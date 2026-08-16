# Day 28: Submodules, Worktrees & Big Repos

> Phase 3 · Advanced Workflows · 90 minutes
> **Goal:** Work across multiple checkouts and nested repositories.

---

## 🎯 Learning Objective

Handle the awkward-scale cases: a repo inside a repo, two branches checked out at
once, and repos too big to clone whole.

**Success criteria**
- ✅ Add, clone, and update a submodule without the classic empty-folder surprise
- ✅ Run two worktrees of one repo simultaneously and explain why it beats stash
- ✅ Know the big-repo toolkit by name and when to reach for each

---

## 🧠 Concept (5 min)

**Submodule = a pinned repo inside your repo.** The parent stores a URL + one exact
commit — not the files. Your history says "vendor/lib *at commit abc123*," forever
reproducible.

```
 parent repo
 ├── src/
 └── vendor/lib   ──▶  points at github.com/x/lib @ abc123   (pinned, not copied)
```

The honest reputation: submodules are precise and *fiddly* — they don't update
themselves, clones arrive with empty folders until initialized, and forgetting
`--recurse` is a rite of passage. Use them for vendored dependencies with exact-pin
needs; prefer package managers when one exists.

**Worktree = a second working directory for the SAME repo.** One `.git` database,
two (or ten) checked-out branches, side by side:

```
 project/        ← main checked out          same repo,
 project-hotfix/ ← hotfix/urgent checked out same history,
                                             zero stash gymnastics
```

Day 9's interrupt drill without touching your dirty tree: the hotfix happens in a
*different folder*. Also: run tests on one branch while coding on another; compare
two versions live. Rules: one branch per worktree at a time; `git worktree remove`
when done (never plain `rm -rf` — the repo tracks its worktrees).

**Big-repo toolkit** (know the names before you need them):
`--depth 1` shallow clone (today's snapshot only) · `--filter=blob:none` partial
clone (history now, file contents on demand) · `sparse-checkout` (only these
folders materialize) · Git LFS (big binaries stored out-of-band, pointers in repo).

---

## 🚶 Guided Walkthrough (15 min)

### 1. Submodule lifecycle, including the trap

```bash
mkdir day28 && cd day28
git init --bare lib-remote.git                     # a "library" to vendor
git clone lib-remote.git lib-dev && cd lib-dev
echo "util v1" > util.txt && git add . && git commit -m "lib v1" && git push && cd ..

git init app && cd app
echo main > app.txt && git add . && git commit -m "App base"
git submodule add ../lib-remote.git vendor/lib
git status                    # two things staged: .gitmodules + the PIN
git commit -m "Vendor lib at v1"
cat .gitmodules               # the URL lives here; the pin lives in the tree
```

Now the famous trap — clone the app somewhere new:

```bash
cd .. && git clone app app-clone && cd app-clone
ls vendor/lib                 # EMPTY. The folder exists; the files don't.
git submodule update --init   # fetch + checkout the pinned commit
ls vendor/lib                 # util.txt ✓
```

*(One-step form for next time: `git clone --recurse-submodules <url>`.)*

### 2. Updating the pin — deliberately

```bash
cd ../lib-dev && echo "util v2" >> util.txt && git commit -am "lib v2" && git push
cd ../app
git submodule update --remote vendor/lib    # move submodule to lib's latest
git status                    # parent sees: modified: vendor/lib (new commits)
git diff                      # the diff is literally: -Subproject abc123 +Subproject def456
git commit -am "Bump vendored lib to v2"    # the bump is a normal, reviewable commit
```

Pins never move silently — that's the feature under the fiddliness.

### 3. Worktrees — the two-desks trick

```bash
git worktree add ../app-hotfix -b hotfix-urgent
git worktree list             # two desks, one repo
cd ../app-hotfix
echo fix >> app.txt && git commit -am "Urgent fix"
cd ../app                     # your original desk: untouched, uninterrupted
git merge hotfix-urgent
git worktree remove ../app-hotfix && git branch -d hotfix-urgent
```

No stash, no switch, no context lost. *(Try checking out a branch that another
worktree holds — Git refuses; one desk per branch.)*

### 4. Big-repo moves (fast tour on a real repo)

```bash
cd .. && git clone --depth 1 https://github.com/git/git.git git-shallow
cd git-shallow && git log --oneline | wc -l        # 1 — history truncated, tiny download
```

Sparse-checkout (only some folders materialize):

```bash
git sparse-checkout set Documentation
ls                            # mostly just Documentation/ — the rest waits invisibly
git sparse-checkout disable
```

---

## 🛠️ Practice (40 min)

### Exercise A — Basic (10 min)
1. From memory: vendor a second submodule into `app` (make another mini
   lib-remote), commit, clone the app fresh, initialize both submodules with the
   one-step clone flag.
2. `git submodule status` in the clone — read the output: sha, path, described
   position. What does a leading `-` (uninitialized) or `+` (pin mismatch) mean?
   (Engineer the `+`: cd into a submodule, check out an older commit, look again.)

### Exercise B — Intermediate (15 min)
Worktree workflows that earn their keep:
1. **Parallel review:** worktree at `../app-review` on a teammate's branch
   (make one), while your feature work continues in the main desk. Diff across
   desks: `git diff main..review-branch` works from either (one database!).
2. **The long test:** in one worktree start something slow
   (`sh -c 'sleep 30; echo done' &` as a stand-in for a test suite), and *keep
   coding* in the other. This is the daily-driver use.
3. Clean both up properly; `git worktree list` to verify. Then one sentence:
   worktree vs stash vs clone — the trade in ten words each.

### Exercise C — Advanced (15 min)
Big-repo toolkit, hands-on-each:
1. Compare downloads: time `git clone --depth 1` vs full clone of a mid-size public
   repo (or compare `du -sh .git` after each). Numbers make the case.
2. Partial clone: `git clone --filter=blob:none <same-repo> blobless` — full
   `git log` works instantly (history came), first `git checkout`/file-read
   fetches contents on demand. Watch the lazy fetch happen.
3. LFS reconnaissance (no install needed): find any repo using LFS
   (search GitHub for `.gitattributes` with `filter=lfs`) and read a pointer file
   in the web UI — a 100-byte stand-in for a 100MB binary. One sentence: why do
   plain-Git repos with committed videos hurt forever, even after deleting them?
   (Day 8's "history is forever" — now at scale.)

---

## 🎬 Challenge (20 min)

**Scenario:** Your Git challenge cohort wants ONE repo that contains the tracker
*and* pins the lessons as an independently-versioned component — plus you need to
keep serving the live tracker while developing v2, simultaneously.

1. **Structure:** create `cohort-hq` repo. Vendor your lessons as a submodule
   (make `lessons-remote` from your lessons folder — `git init` + commit + a bare
   clone as its remote), pinned at its current commit. Commit with a message
   explaining WHY pinned ("cohort follows lesson set v1; bumps are deliberate").
2. **Two desks:** worktree `../cohort-hq-live` on branch `live` (the "running"
   copy) and keep `main` as your dev desk. Make a dev-only change on main; verify
   `live` is untouched; then promote it (merge from the live desk) — the
   deploy-without-stopping pattern.
3. **The drill you'll actually face:** update one lesson in `lessons-remote`
   (fix a "typo"), then walk the full pin-bump: submodule update --remote →
   review the pin diff → commit the bump on main → promote to live.
4. **Write the runbook:** `OPERATING.md` in cohort-hq — four lines: how to clone
   correctly (recurse!), how to bump lessons, how live gets updated, how to add a
   worktree for experiments. A teammate should operate this from the file alone
   (Day 19's cold-start standard).

**Success:** fresh `--recurse-submodules` clone works first try; the pin-bump
history reads deliberately; both desks list in `git worktree list`; the runbook
passes the stranger test.

---

## 🤔 Reflection (10 min) — answer in your tracker

1. What was the hardest concept today?
2. Submodule pin vs package-manager dependency — the trade-off in two sentences.
3. Which worktree pattern (interrupt / parallel-review / long-test) fits your real week?
4. What edge case do you still want to explore? (e.g. submodules inside submodules — how deep does `--recursive` go?)
5. What would raise your confidence one point?

---

## ⚠️ Common Mistakes

| Mistake | Fix |
|---|---|
| Cloned; submodule folders empty; code won't run | `git submodule update --init --recursive` — or clone with `--recurse-submodules` and never meet this. |
| Committed inside the submodule, parent "lost" it | Submodule commits live in the SUB's repo — push there, then bump the pin in the parent. Two repos, two pushes. |
| `rm -rf` a worktree folder | The repo still lists it. `git worktree prune` cleans the record; next time `git worktree remove`. |
| Shallow clone, then need history | `git fetch --unshallow` upgrades in place — no re-clone. |
| Giant binaries committed "just once" | Forever in history, every clone pays. LFS from day one for assets, or keep them out entirely. |

---

## 📖 Resources

- Book: [Submodules](https://git-scm.com/book/en/v2/Git-Tools-Submodules) — read the caveats section especially
- `git help worktree` — short and complete
- [GitHub Docs: About Git LFS](https://docs.github.com/en/repositories/working-with-files/managing-large-files/about-git-large-file-storage)

**Next up — Day 29:** Disaster recovery drills — ten broken repos, ten calm fixes. Everything you've learned, under pressure.
