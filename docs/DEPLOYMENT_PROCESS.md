# Deployment Process: Preview to Main

This document outlines the process for deploying changes from the `preview` branch to the `main` branch, including how to identify unique files changed between deployments.

## Overview

When deploying from preview to main, we need to:
1. Identify the last deployment tag (either `deploy-main-*` or `deploy-preview-*`)
2. Find all commits and files changed after that tag
3. Get the unique list of source files (excluding docs, tests, etc.)
4. Deploy only those files to main
5. Create a new deployment tag

## Step-by-Step Process

### 1. Identify the Last Deployment Tag

First, determine which tag represents the last deployment:

```powershell
# List all deployment tags
git tag -l "deploy-*" | Sort-Object -Descending

# Check the last main deployment
git tag -l "deploy-main-*" | Sort-Object -Descending | Select-Object -First 1

# Check the last preview deployment
git tag -l "deploy-preview-*" | Sort-Object -Descending | Select-Object -First 1
```

**Note:** If you deployed from preview to main, use the `deploy-preview-*` tag that was created before the main deployment. This represents the state of preview at the time of the last main deployment.

### 2. Find Commits After the Last Deployment Tag

```powershell
# Replace TAG_NAME with the actual tag (e.g., deploy-preview-2025-11-26)
git log --oneline TAG_NAME..preview

# Get detailed commit list with dates
git log --format="%h|%ad|%s" --date=iso TAG_NAME..preview

# Count commits
git log --oneline TAG_NAME..preview | Measure-Object -Line
```

### 3. Get Unique Files Changed

#### Method 1: Using git diff (Recommended)

```powershell
# Get all files changed between tag and preview
git diff --name-only --diff-filter=ACMR TAG_NAME..preview

# Filter for source files only (excluding docs, tests, etc.)
git diff --name-only TAG_NAME..preview | Where-Object { 
    $_ -match '^src/' -or $_ -match '^public/' 
} | Where-Object { 
    $_ -notmatch '\.md$' -and 
    $_ -notmatch 'test' -and 
    $_ -notmatch '\.txt$' -and 
    $_ -notmatch '\.html$' -and 
    $_ -notmatch '\.sh$' -and 
    $_ -notmatch '\.ps1$' -and 
    $_ -notmatch 'docs/' 
} | Sort-Object -Unique
```

#### Method 2: Per-Commit Analysis (For Verification)

To verify the unique file list by checking each commit individually:

```powershell
$commits = git log --format="%H" TAG_NAME..preview
$allFiles = @()
foreach ($commit in $commits) {
    $files = git diff-tree --no-commit-id --name-only -r $commit
    $allFiles += $files
}
$allFiles | Where-Object { 
    $_ -match '^src/' -or $_ -match '^public/' 
} | Where-Object { 
    $_ -notmatch '\.md$' -and $_ -notmatch 'test' -and 
    $_ -notmatch '\.txt$' -and $_ -notmatch '\.html$' -and 
    $_ -notmatch '\.sh$' -and $_ -notmatch '\.ps1$' -and 
    $_ -notmatch 'docs/' 
} | Sort-Object -Unique
```

### 4. Deploy Files to Main

```powershell
# Switch to main branch
git checkout main

# Pull latest changes
git pull origin main

# Checkout files from preview branch
git checkout preview -- FILE1 FILE2 FILE3 ...

# Or use the list from step 3
$files = @(
    "src/app/api/admin/chat/request-sme-review/route.ts",
    "src/components/inbox/LegacyInboxList.tsx",
    # ... add all files from step 3
)
git checkout preview -- $files

# Verify staged files
git status

# Commit with descriptive message
git commit -m "feat: deploy preview changes to main - [brief description]

- Feature 1
- Feature 2
- Bug fix 1

Deployed from preview branch after TAG_NAME (X commits)"

# Push to main
git push origin main
```

### 5. Create Deployment Tag

```powershell
# Switch back to preview (or stay on main)
git checkout preview

# Create tag on main branch commit
git tag -a "deploy-main-YYYY-MM-DD" origin/main -m "Deployed [features] to main

- Feature 1
- Feature 2
- Bug fix 1

Deployed from preview branch (X commits after TAG_NAME)"

# Push tag to remote
git push origin deploy-main-YYYY-MM-DD
```

## Example: November 28, 2025 Deployment

### Context
- Last preview deployment tag: `deploy-preview-2025-11-26`
- Commits after tag: 34 commits
- Unique files: 8 files

### Commands Used

```powershell
# 1. Find commits
git log --oneline deploy-preview-2025-11-26..preview

# 2. Get unique files
git diff --name-only deploy-preview-2025-11-26..preview | 
    Where-Object { $_ -match '^src/' -or $_ -match '^public/' } | 
    Where-Object { $_ -notmatch '\.md$' -and $_ -notmatch 'test' -and 
                   $_ -notmatch '\.txt$' -and $_ -notmatch '\.html$' -and 
                   $_ -notmatch '\.sh$' -and $_ -notmatch '\.ps1$' -and 
                   $_ -notmatch 'docs/' } | 
    Sort-Object -Unique

# 3. Deploy to main
git checkout main
git pull origin main
git checkout preview -- src/app/api/admin/chat/request-sme-review/route.ts \
    src/app/api/admin/inbox/[id]/convert-to-faq/route.ts \
    src/app/api/admin/inbox/[id]/dismiss/route.ts \
    src/app/api/admin/inbox/[id]/mark-reviewed/route.ts \
    src/components/inbox/LegacyInboxList.tsx \
    src/components/inbox/LegacyInboxPageClient.tsx \
    src/components/rag/ChatInterface.tsx \
    src/components/rag/ChatSMEReviewModal.tsx
git commit -m "feat: deploy preview changes to main..."
git push origin main

# 4. Create tag
git tag -a "deploy-main-2025-11-28" origin/main -m "..."
git push origin deploy-main-2025-11-28
```

## Files Excluded from Deployment

The following file types are excluded from deployment:
- Documentation files (`.md`)
- Test files (containing `test` in path)
- Text files (`.txt`)
- HTML files (`.html`)
- Shell scripts (`.sh`, `.ps1`)
- Files in `docs/` directory
- JSON config files (`.json`, `.lock`) - if needed

## Verification Checklist

Before deploying, verify:
- [ ] Correct deployment tag identified
- [ ] All commits after tag are reviewed
- [ ] Unique file list is accurate (use per-commit analysis to verify)
- [ ] No unintended files included
- [ ] Main branch is up to date
- [ ] Commit message is descriptive
- [ ] Tag is created on correct commit (main branch)
- [ ] Tag is pushed to remote

## Troubleshooting

### Issue: Too many files in the list
- Check if the tag is correct
- Verify the date range
- Ensure filters are working correctly

### Issue: Missing files
- Check if files were moved/renamed
- Use `git log --follow` to track file history
- Verify files exist in preview branch

### Issue: Tag points to wrong commit
- Delete local tag: `git tag -d TAG_NAME`
- Recreate tag on correct commit: `git tag -a TAG_NAME COMMIT_HASH -m "..."`
- Force push if needed: `git push origin TAG_NAME --force`

## Best Practices

1. **Always verify the file list** using both methods (diff and per-commit)
2. **Test in preview first** before deploying to main
3. **Create descriptive commit messages** that explain what was deployed
4. **Document the deployment** in this file or a changelog
5. **Tag immediately after deployment** to mark the deployment point
6. **Keep tags consistent** with naming convention: `deploy-main-YYYY-MM-DD` or `deploy-preview-YYYY-MM-DD`

## Related Documents

- See commit history for detailed changes
- Check deployment tags: `git tag -l "deploy-*"`
- Review branch comparison: `git log main..preview`









