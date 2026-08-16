# Day 1: Git Basics & Your First Commit

---

## 🎯 Learning Objective

**Master the core Git workflow:** Initialize a repository, create commits, and understand how Git tracks changes.

### Success Criteria
- ✅ Create a new Git repository locally
- ✅ Make at least 3 commits with meaningful messages
- ✅ View commit history and understand what each line means

---

## 📚 Why This Matters

Every great developer uses version control. Git is like a "save game" system for your code—but infinitely more powerful. Instead of overwriting files, Git tracks *every change* with a message explaining why. Today, you'll learn to:
- Never lose work (there's always a previous version)
- Collaborate fearlessly (others can work on the same project)
- Understand *who* changed *what* and *when*

**Real developer quote:** *"Git saved my career. Without it, that 'oops I deleted the wrong file' moment would've been a disaster."* — Sarah Chen, Senior Engineer at Stripe

---

## 🧠 Concept Explained (5 min)

### What is Git?
Think of Git as a **time machine for your code**. Every time you "commit" (save), Git creates a snapshot of your entire project at that moment. You can jump back to any previous snapshot.

### Key Concept: The Three Zones

Git has three "zones" where your code lives. Understanding this is the foundation:

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│  1. WORKING DIRECTORY                             │
│  (Your actual files on disk)                       │
│         ⬇ git add                                  │
│  2. STAGING AREA                                  │
│  (Changes ready to be committed)                   │
│         ⬇ git commit                               │
│  3. REPOSITORY                                    │
│  (Permanent history of commits)                    │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**What happens at each stage:**

1. **Working Directory:** You edit `hello.js`. It shows as "changed but not staged."
2. **Staging Area:** You run `git add hello.js`. Now Git is watching this file.
3. **Repository:** You run `git commit -m "Add greeting"`. Git creates a permanent snapshot.

### Why Three Zones?
Because sometimes you edit 10 files but only want to commit 3 of them. The staging area lets you be selective. 

**Example:** You fixed a bug AND refactored some code. You might commit the bug fix first, then the refactoring separately. This keeps history clean and logical.

---

## 🚶 Guided Walkthrough (15 min)

Let's create your first Git repo from scratch.

### Step 1: Create a Project Folder

```bash
mkdir my-first-repo
cd my-first-repo
```

**What happened:** You created a folder called `my-first-repo` and entered it.

---

### Step 2: Initialize Git

```bash
git init
```

**Output:**
```
Initialized empty Git repository in /Users/you/my-first-repo/.git/
```

**What happened:** Git created a hidden folder `.git` that stores all the history and configuration. This is what makes it a "Git repository."

**💡 Tip:** You now have a Git repo! The folder is ready to track changes.

---

### Step 3: Create Your First File

Create a file called `README.md`:

```bash
echo "# My First Project" > README.md
```

Or open your text editor and create `README.md` with this content:
```
# My First Project

Learning Git today!
```

**What happened:** You created a file. But Git hasn't tracked it yet.

---

### Step 4: Check Git Status

```bash
git status
```

**Expected Output:**
```
On branch master

No commits yet

Untracked files:
  (use "git add <file>..." to include in what will be committed)
        README.md

nothing added to commit but untracked files present (use "git add" to track)
```

**What this means:**
- `Untracked files`: Git sees `README.md` but isn't following it yet.
- Git is telling you the next step: use `git add`.

---

### Step 5: Stage the File

```bash
git add README.md
```

**What happened:** You moved `README.md` to the **staging area**. It's ready to be committed.

**Check status again:**
```bash
git status
```

**Expected Output:**
```
On branch master

No commits yet

Changes to be committed:
  (use "git rm --cached <file>..." to unstage)
        new file:   README.md
```

Notice the change? Now it says `new file` and is under "Changes to be committed."

---

### Step 6: Make Your First Commit

```bash
git commit -m "Initial commit: Add README"
```

**Output:**
```
[master (root-commit) a1b2c3d] Initial commit: Add README
 1 file changed, 2 insertions(+)
 create mode 100644 README.md
```

**What happened:**
- `a1b2c3d` is a unique ID for this commit (you'll see this later).
- Git saved a permanent snapshot of your project.
- The message explains *why* you made this commit.

---

### Step 7: View Commit History

```bash
git log
```

**Expected Output:**
```
commit a1b2c3d4567890abcdef1234567890abcdef1234
Author: Your Name <your@email.com>
Date:   Mon Jul 27 10:30:00 2026 +0000

    Initial commit: Add README
```

**What this shows:**
- The commit ID (that long string)
- Who made it
- When it was made
- The commit message

**💡 Prettier version:**
```bash
git log --oneline
```

Output:
```
a1b2c3d Initial commit: Add README
```

Much easier to read! Use `--oneline` when you want a quick overview.

---

## 🛠️ Sandbox Practice (40 min)

**Setup:** Create a new folder for practice. It takes 5 seconds:
```bash
mkdir git-practice
cd git-practice
git init
```

All three exercises happen in this folder.

---

### Exercise A: Basic (10 min)
**Goal:** Create 3 commits in a single file.

**Steps:**

1. Create a file called `grocery-list.txt`:
```bash
echo "Milk" > grocery-list.txt
```

2. Add and commit:
```bash
git add grocery-list.txt
git commit -m "Add milk to list"
```

3. Add another item:
```bash
echo "Bread" >> grocery-list.txt
```

4. Commit again:
```bash
git commit -am "Add bread to list"
```

**Note:** `-am` means "add all tracked files and commit" (shortcut).

5. Add one more item and commit:
```bash
echo "Eggs" >> grocery-list.txt
git commit -am "Add eggs to list"
```

6. View your history:
```bash
git log --oneline
```

**Success Check:**
You should see 3 commits. Screenshot it or paste the output.

**❓ Did you get stuck?**
- Error: "Nothing to commit"? → Make sure you edited the file before `git commit`.
- Error: "no changes added to commit"? → Use `git add` before committing.

---

### Exercise B: Intermediate (15 min)
**Goal:** Practice the 3-zone workflow (Working → Staging → Repo)

**Scenario:** You're building a simple HTML file. You'll make changes in stages.

**Steps:**

1. Create `index.html`:
```bash
cat > index.html << 'EOF'
<html>
<head>
  <title>My Site</title>
</head>
<body>
  <h1>Welcome</h1>
</body>
</html>
EOF
```

2. Commit this version:
```bash
git add index.html
git commit -m "Add basic HTML structure"
```

3. Now edit `index.html` and add a paragraph (use your text editor or echo):
```bash
# View current content first
cat index.html
```

Add this line before `</body>`:
```html
  <p>This is my first website!</p>
```

4. Check status:
```bash
git status
```

You should see `modified: index.html` but NOT staged yet.

5. Stage it:
```bash
git add index.html
```

6. Make one more edit—add a footer:
```bash
# Edit the file again, add before </body>:
# <footer>© 2026</footer>
```

7. Check status:
```bash
git status
```

**What do you see?** 
- The staged changes (paragraph)
- The unstaged changes (footer)

8. Commit only the staged part:
```bash
git commit -m "Add welcome paragraph"
```

9. Commit the footer:
```bash
git add index.html
git commit -m "Add copyright footer"
```

10. View history:
```bash
git log --oneline
```

**Success Check:**
You have 3 commits for index.html. You staged changes separately before committing. Great job understanding the workflow!

**Why this matters:** In real projects, you might edit 20 things but want to commit them as 5 logical changes. This skill is essential.

---

### Exercise C: Advanced (15 min)
**Goal:** Practice viewing what changed between commits.

**Steps:**

1. Using your previous repo (from Exercise A or B), view the detailed log:
```bash
git log -p
```

This shows the actual changes (additions/deletions) for each commit.

2. See changes in a specific commit:
```bash
git show a1b2c3d  # Replace with your commit ID
```

3. Compare your current file to the last commit:
```bash
git diff
```

This shows unstaged changes.

4. Compare staged changes to the last commit:
```bash
git diff --cached
```

5. **Challenge:** Make a new edit to one of your files but DON'T commit. Then:
   - Run `git diff` (see unstaged changes)
   - Run `git add [file]`
   - Run `git diff --cached` (see staged changes)
   - What's the difference between the two outputs?

**Success Check:**
Can you explain what `git diff` and `git diff --cached` show? Write it down or tell a friend.

**💡 Bonus insight:** These commands are how you *review* changes before committing. This prevents mistakes.

---

## 🎬 Challenge Scenario (20 min)

### Scenario: You're a Developer at a Startup

You're building a `config.py` file for your application. Your manager asked you to track each step so they can understand the development process.

**Requirements:**
1. Create a file called `config.py`
2. Add the database URL (Commit 1)
3. Add the API key (Commit 2)
4. Add debug mode setting (Commit 3)
5. Write clear commit messages explaining *why* you added each

**Starter template:**

```python
# Database configuration
DATABASE_URL = "postgresql://localhost:5432/myapp"

# API settings
API_KEY = "your-secret-key-here"

# Debug mode
DEBUG = True
```

**How to solve this:**

1. Create `config.py` with just the database URL:
```bash
cat > config.py << 'EOF'
# Database configuration
DATABASE_URL = "postgresql://localhost:5432/myapp"
EOF
```

2. Commit it:
```bash
git add config.py
git commit -m "Add database configuration"
```

3. Add the API key section and commit:
```bash
echo '
# API settings
API_KEY = "your-secret-key-here"' >> config.py
git commit -am "Add API key configuration"
```

4. Add debug mode and commit:
```bash
echo '
# Debug mode
DEBUG = True' >> config.py
git commit -am "Enable debug mode for development"
```

5. View your history:
```bash
git log --oneline
```

**Success Criteria:**
- ✅ 3 separate commits
- ✅ Each message explains *what* was added
- ✅ Can run `git log` and see clear progression

**Bonus Challenge:**
Use `git show <commit-id>` to view the exact changes made in commit 2. Paste the output—this proves you understand the history!

---

## 🤔 Reflection Checkpoint (10 min)

Take 10 minutes to answer these questions. Write your answers in a text file or journal.

### Q1: What was the hardest concept today?
(If nothing was hard, that's great! If something confused you, write it down. We'll revisit it.)

### Q2: Explain the Three Zones in your own words.
Use an analogy if it helps. Example: "It's like writing a letter: draft (working) → envelope (staging) → mailbox (repo)."

### Q3: When would you use `git diff` in real work?
Think of a scenario from your experience or imagine one. Example: *"Before committing, I'd use it to check I didn't accidentally change something else."*

### Q4: What's one edge case you want to explore?
Examples: "What if I commit the wrong file?" "Can I see who made each change?" "What if two people edit the same file?"

### Q5: Rate your confidence 1-5.
- 1 = I'm lost, need help
- 3 = I get most of it, some confusion
- 5 = I'm confident and could teach this to a friend

**If you rated <3:** That's totally normal on Day 1. Reach out to the next day's lesson and take your time. Git clicks after you practice a few more times.

---

## 📖 Resources

### Official Git Documentation
- [Git Basics](https://git-scm.com/book/en/v2/Getting-Started-About-Version-Control) — Start here for foundational concepts
- [git init](https://git-scm.com/docs/git-init) — Initialize a repository
- [git commit](https://git-scm.com/docs/git-commit) — Record changes

### Optional Video (5 min)
- [Git & GitHub Crash Course for Beginners](https://www.youtube.com/watch?v=RGOj5yH7evk) — Friendly intro, great visuals

### Readable Article (Non-technical)
- [Why Git is So Important](https://www.freecodecamp.org/news/learn-the-basics-of-git-in-under-10-minutes-873278210677/) — Explains the *why* in simple terms

### Next Day Preview
Tomorrow (Day 2): **Branches & Parallel Development** — You'll learn to work on multiple features simultaneously without interfering with your main code.

---

## ⚠️ Common Mistakes & Fixes

### Mistake 1: "fatal: not a git repository"
**What it means:** You ran a Git command in a folder that isn't a Git repo.

**How to fix:**
```bash
git init
```

---

### Mistake 2: "nothing added to commit but untracked files present"
**What it means:** You created files but didn't run `git add`.

**How to fix:**
```bash
git add .  # adds all files
# or
git add filename.txt  # add specific file
```

---

### Mistake 3: "Please tell me who you are" error
**What it means:** Git doesn't know your name for commit history.

**How to fix:**
```bash
git config --global user.name "Your Name"
git config --global user.email "your@email.com"
```

Then retry your commit.

---

## 🎉 You Did It!

You've completed Day 1. You now understand:
- ✅ How Git tracks changes
- ✅ The three zones (Working → Staging → Repo)
- ✅ How to create and view commits
- ✅ Why good commit messages matter

**Tomorrow:** We'll tackle branches—the feature that makes Git truly powerful.

---

## 💬 Reflection Prompt for Group Learning

**If you're sharing this with others:**
- Post your screenshot of `git log --oneline` from the challenge
- Share one thing that surprised you today
- Ask one question you still have

---

**Time Tracking:**
- Concept: 5 min
- Walkthrough: 15 min
- Exercise A: 10 min
- Exercise B: 15 min
- Exercise C: 15 min
- Challenge: 20 min
- Reflection: 10 min
- **Total: 90 minutes** ✅

