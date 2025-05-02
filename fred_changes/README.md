# Transitioning to a Fork-Based Workflow

## 1. Fork the Original Repository on GitHub
- Navigate to the original repository on GitHub.
- Click the **"Fork"** button at the top-right corner of the page.
- This creates a copy of the repository under your GitHub account.

---

## 2. Update Your Local Repository Remotes
Since you've already cloned the original repository and made changes, you can reconfigure your remotes to point to your fork.

### Rename the current origin remote to `upstream`:

```
git remote rename origin upstream
```

### Add your fork as the new origin:
```
git remote add origin https://github.com/your-username/repo-name.git
```


## Push your local changes to your fork

### If you've made changes directly on the main branch:
```
git push -u origin main
```

### If you've created a new branch for your changes:
```
git push -u origin your-branch-name
```

## 4. Keep Your Fork Updated with the Original Repository

### Fetch updates from the original repository:
```
git fetch upstream
```

### Merge updates into your local main branch:

```
git checkout main
git merge upstream/main
```

### Push the merged changes to your fork:

```
git push origin main
```