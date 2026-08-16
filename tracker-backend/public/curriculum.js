window.CURRICULUM = [
  { day: 1,  phase: 1, title: "Git Basics & Your First Commit", goal: "Initialize a repo, stage changes, and create commits with meaningful messages." },
  { day: 2,  phase: 1, title: "The Three Zones & Staging Deep Dive", goal: "Move changes deliberately between working directory, staging area, and repository." },
  { day: 3,  phase: 1, title: "Reading History: log, diff, show", goal: "Investigate what changed, when, and why using Git's inspection commands." },
  { day: 4,  phase: 1, title: "Branches: Parallel Universes", goal: "Create, switch, and delete branches to isolate work in progress." },
  { day: 5,  phase: 1, title: "Merging: Fast-forward vs 3-way", goal: "Combine branches and explain which merge strategy Git chose and why." },
  { day: 6,  phase: 1, title: "Merge Conflicts Without Fear", goal: "Read conflict markers and resolve a multi-file conflict in under five minutes." },
  { day: 7,  phase: 1, title: "Undoing Changes: restore, reset, revert", goal: "Pick the correct undo tool for each situation and explain the trade-offs." },
  { day: 8,  phase: 1, title: ".gitignore & a Clean Working Tree", goal: "Keep secrets and build artifacts out of history, and untrack what slipped in." },
  { day: 9,  phase: 1, title: "Stashing & Context Switching", goal: "Park unfinished work safely and restore it on the right branch." },
  { day: 10, phase: 1, title: "Phase 1 Capstone + Quiz", goal: "Rebuild a full local workflow from scratch with no notes." },

  { day: 11, phase: 2, title: "GitHub Setup, SSH Keys & First Remote", goal: "Authenticate with GitHub and connect a local repo to a remote." },
  { day: 12, phase: 2, title: "push, pull, fetch — The Real Difference", goal: "Predict exactly what each command changes before you run it." },
  { day: 13, phase: 2, title: "Cloning & Forking", goal: "Choose between clone and fork based on write access and intent." },
  { day: 14, phase: 2, title: "Pull Requests End to End", goal: "Open, update, and merge a PR using a feature-branch workflow." },
  { day: 15, phase: 2, title: "Code Review: Giving and Receiving", goal: "Leave actionable review comments and respond to feedback with follow-up commits." },
  { day: 16, phase: 2, title: "Issues, Labels, Milestones, Projects", goal: "Track work on GitHub and link commits and PRs to issues automatically." },
  { day: 17, phase: 2, title: "Branch Protection & Team Conventions", goal: "Configure rules that stop bad merges before they happen." },
  { day: 18, phase: 2, title: "Contributing to Someone Else's Repo", goal: "Complete a fork → branch → PR contribution to an external project." },
  { day: 19, phase: 2, title: "README, LICENSE & Repo Hygiene", goal: "Make a repository that a stranger can understand and run." },
  { day: 20, phase: 2, title: "Phase 2 Capstone + Quiz", goal: "Run a full collaborative cycle including review and merge." },

  { day: 21, phase: 3, title: "Rebase: Rewriting History Safely", goal: "Rebase a feature branch and articulate the golden rule of rebasing." },
  { day: 22, phase: 3, title: "Interactive Rebase: squash, reword, drop", goal: "Clean a messy branch into a reviewable set of commits." },
  { day: 23, phase: 3, title: "Cherry-pick & Surgical Fixes", goal: "Move a single commit between branches without dragging along the rest." },
  { day: 24, phase: 3, title: "Reflog: The Undo of Last Resort", goal: "Recover a commit or branch you thought was permanently lost." },
  { day: 25, phase: 3, title: "Bisect: Find the Breaking Commit", goal: "Binary-search history to locate the commit that introduced a bug." },
  { day: 26, phase: 3, title: "Tags, Releases & Semantic Versioning", goal: "Cut an annotated tag and publish a GitHub release." },
  { day: 27, phase: 3, title: "GitHub Actions: Your First CI Pipeline", goal: "Run tests automatically on every push and block failing PRs." },
  { day: 28, phase: 3, title: "Submodules, Worktrees & Big Repos", goal: "Work across multiple checkouts and nested repositories." },
  { day: 29, phase: 3, title: "Disaster Recovery Drills", goal: "Work through ten broken-repo scenarios and fix each one." },
  { day: 30, phase: 3, title: "Final Capstone: Ship a Real Project", goal: "Take a project from git init to a tagged, CI-verified release." },
];

window.PHASES = {
  1: { name: "Git Fundamentals",       blurb: "Local mastery: commits, branches, merging, undo" },
  2: { name: "GitHub Collaboration",   blurb: "Remotes, pull requests, review, teamwork" },
  3: { name: "Advanced Workflows",     blurb: "History surgery, recovery, CI, shipping" },
};

window.TASKS = [
  { key: "concept",    label: "Concept explanation",      minutes: 5  },
  { key: "walkthrough",label: "Guided walkthrough",       minutes: 15 },
  { key: "exerciseA",  label: "Exercise A — basic",       minutes: 10 },
  { key: "exerciseB",  label: "Exercise B — intermediate",minutes: 15 },
  { key: "exerciseC",  label: "Exercise C — advanced",    minutes: 15 },
  { key: "challenge",  label: "Challenge scenario",       minutes: 20 },
  { key: "reflection", label: "Reflection checkpoint",    minutes: 10 },
];

window.REFLECTION_QUESTIONS = [
  { key: "q1", label: "What was the hardest concept today?" },
  { key: "q2", label: "Explain today's key concept in your own words." },
  { key: "q3", label: "When would you use this skill in real work?" },
  { key: "q4", label: "What edge case do you still want to explore?" },
  { key: "q5", label: "What would raise your confidence one point?" },
];
