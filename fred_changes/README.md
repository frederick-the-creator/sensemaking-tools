Transitioning to a Fork-Based Workflow
1. Fork the Original Repository on GitHub:

Navigate to the original repository on GitHub.

Click the "Fork" button at the top-right corner of the page.

This creates a copy of the repository under your GitHub account.​

2. Update Your Local Repository Remotes:

Since you've already cloned the original repository and made changes, you can reconfigure your remotes to point to your fork.​

Rename the current origin remote to upstream:​
GitHub
+4
Gist
+4
ADMCPR
+4

bash
Copy
Edit
  git remote rename origin upstream
Add your fork as the new origin:​
Super User

bash
Copy
Edit
  git remote add origin https://github.com/your-username/repo-name.git
Verify the remotes:​
Gist
+8
GeeksforGeeks
+8
Super User
+8

bash
Copy
Edit
  git remote -v
You should see:​

pgsql
Copy
Edit
  origin    https://github.com/your-username/repo-name.git (fetch)
  origin    https://github.com/your-username/repo-name.git (push)
  upstream  https://github.com/original-owner/repo-name.git (fetch)
  upstream  https://github.com/original-owner/repo-name.git (push)
3. Push Your Local Changes to Your Fork:

If you've made changes directly on the main branch:​

bash
Copy
Edit
  git push -u origin main
If you've created a new branch for your changes:​

bash
Copy
Edit
  git push -u origin your-branch-name
4. Keep Your Fork Updated with the Original Repository:

Fetch updates from the original repository:​

bash
Copy
Edit
  git fetch upstream
Merge updates into your local main branch:​
Stack Overflow

bash
Copy
Edit
  git checkout main
  git merge upstream/main
Push the merged changes to your fork:​

bash
Copy
Edit
  git push origin main