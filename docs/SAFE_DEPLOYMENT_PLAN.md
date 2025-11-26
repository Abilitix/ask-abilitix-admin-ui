# Safe Deployment Plan: FAQ Creation Feature

**Date:** November 20, 2025  
**Feature:** FAQ Creation (Create as FAQ checkbox + Enable FAQ Creation flag)  
**Rollback Method:** Git Tag (Fast & Safe)

---

## 🛡️ Safety Measures

### Pre-Deployment Safety:
1. ✅ Create rollback tag BEFORE any changes
2. ✅ Deploy to branch first (not directly to main)
3. ✅ Test build before merging
4. ✅ Verify all files are correct
5. ✅ Keep main branch protected

### Rollback Safety:
- ✅ Git tag provides instant rollback point
- ✅ No data loss (git preserves history)
- ✅ Can rollback in < 1 minute
- ✅ Can redeploy after fixing issues

---

## 🚀 Deployment Steps

### Step 1: Create Rollback Tag (CRITICAL - DO THIS FIRST)

```bash
# Switch to main and ensure it's up to date
git checkout main
git pull origin main

# Create rollback tag
git tag -a v1.0.0-before-faq-creation -m "Rollback point before FAQ creation deployment - $(date +%Y-%m-%d)"

# Push tag to remote (important for team access)
git push origin v1.0.0-before-faq-creation

# Verify tag was created
git tag -l "v1.0.0-before-faq-creation"
```

**✅ Verification:** Tag should appear in output

---

### Step 2: Create Deployment Branch

```bash
# Create deployment branch from main
git checkout -b deploy/faq-creation-$(date +%Y%m%d)

# Verify branch created
git branch
```

**✅ Verification:** New branch should be active

---

### Step 3: Copy Files from Preview (11 files)

```bash
# Core FAQ Creation files (9 files)
git checkout preview -- src/components/inbox/InboxPageClient.tsx
git checkout preview -- src/components/inbox/InboxDetailPanel.tsx
git checkout preview -- src/components/inbox/LegacyInboxList.tsx
git checkout preview -- src/components/inbox/LegacyInboxPageClient.tsx
git checkout preview -- src/components/inbox/ModernInboxClient.tsx
git checkout preview -- src/components/inbox/CitationsEditor.tsx
git checkout preview -- src/lib/server/adminSettings.ts
git checkout preview -- src/app/admin/inbox/page.tsx
git checkout preview -- src/app/api/admin/tenant-settings/route.ts

# Supporting files (2 files)
git checkout preview -- src/components/inbox/InboxList.tsx
git checkout preview -- src/components/inbox/LegacyInboxStatsCard.tsx
```

**✅ Verification:** Check status
```bash
git status
# Should show 11 files as modified/new
```

---

### Step 4: Verify Files

```bash
# Check what files changed
git status --short

# Verify no unexpected files
git diff --name-only
```

**✅ Expected Output:**
```
M  src/app/admin/inbox/page.tsx
M  src/app/api/admin/tenant-settings/route.ts
A  src/components/inbox/CitationsEditor.tsx
A  src/components/inbox/InboxDetailPanel.tsx
M  src/components/inbox/InboxList.tsx
M  src/components/inbox/InboxPageClient.tsx
M  src/components/inbox/LegacyInboxList.tsx
M  src/components/inbox/LegacyInboxPageClient.tsx
A  src/components/inbox/LegacyInboxStatsCard.tsx
A  src/components/inbox/ModernInboxClient.tsx
M  src/lib/server/adminSettings.ts
```

---

### Step 5: Test Build (CRITICAL)

```bash
# Install dependencies (if needed)
npm install

# Run build to catch any TypeScript/import errors
npm run build
```

**✅ Success Criteria:**
- Build completes without errors
- No TypeScript errors
- No import errors
- No missing dependencies

**❌ If build fails:**
- DO NOT proceed to merge
- Fix errors in preview first
- Then retry deployment

---

### Step 6: Commit Changes

```bash
# Stage all changes
git add src/components/inbox/ src/lib/server/adminSettings.ts src/app/admin/inbox/page.tsx src/app/api/admin/tenant-settings/route.ts

# Commit with descriptive message
git commit -m "feat: deploy FAQ creation feature (Create as FAQ checkbox + Enable FAQ Creation flag)

- Add Create as FAQ checkbox to modern and legacy inbox
- Add Enable FAQ Creation tenant flag
- Implement flag persistence in localStorage
- Support /promote endpoint for FAQ creation
- Support /approve endpoint for regular QA pairs
- Add citation attachment modal for legacy inbox
- Improve error handling and validation"

# Verify commit
git log -1 --oneline
```

---

### Step 7: Merge to Main (CAREFUL)

```bash
# Switch to main
git checkout main

# Pull latest (safety check)
git pull origin main

# Merge deployment branch
git merge deploy/faq-creation-$(date +%Y%m%d) --no-ff -m "Merge FAQ creation feature deployment"

# Verify merge
git log -1 --oneline
```

**✅ Verification:** Should show merge commit

---

### Step 8: Push to Main

```bash
# Push to remote
git push origin main
```

**✅ Verification:** Check GitHub/remote to confirm push succeeded

---

### Step 9: Cleanup

```bash
# Delete local deployment branch
git branch -d deploy/faq-creation-$(date +%Y%m%d)

# Optional: Delete remote branch if it was pushed
# git push origin --delete deploy/faq-creation-$(date +%Y%m%d)
```

---

## 🔄 Fast Rollback Procedure

### If Issue Detected Immediately (< 5 minutes):

**Option 1: Revert Last Commit (Recommended)**
```bash
# Switch to main
git checkout main

# Revert the merge commit (creates new commit that undoes changes)
git revert HEAD -m 1

# Push revert
git push origin main
```

**✅ Pros:**
- Preserves history
- Safe for shared branches
- Can see what was reverted

**⏱️ Time:** < 1 minute

---

### If Critical Issue (Need Full Rollback):

**Option 2: Reset to Tag (Fastest)**
```bash
# Switch to main
git checkout main

# Reset to rollback tag (hard reset - removes commits)
git reset --hard v1.0.0-before-faq-creation

# Force push (required for reset)
git push origin main --force
```

**⚠️ WARNING:** Force push rewrites history. Only use if:
- Issue is critical
- No one else has pulled the bad commit
- Team is aware

**✅ Pros:**
- Instant rollback
- Clean state
- No revert commits

**⏱️ Time:** < 30 seconds

---

### If Issue Detected Later (After Others Pulled):

**Option 3: Revert Merge Commit**
```bash
# Find the merge commit hash
git log --oneline --grep="Merge FAQ creation"

# Revert it
git revert <merge-commit-hash> -m 1

# Push
git push origin main
```

**✅ Pros:**
- Safe for shared branches
- Preserves history
- Others can pull safely

**⏱️ Time:** < 1 minute

---

## 📋 Quick Rollback Reference

### Emergency Rollback (Copy-Paste Ready):

```bash
# Fastest rollback (if no one else pulled)
git checkout main
git reset --hard v1.0.0-before-faq-creation
git push origin main --force
```

### Safe Rollback (if others may have pulled):

```bash
# Revert last commit
git checkout main
git revert HEAD -m 1
git push origin main
```

### Verify Rollback:

```bash
# Check current commit
git log -1 --oneline

# Should show tag commit or revert commit
```

---

## ✅ Post-Deployment Verification

### Immediate Checks (First 5 minutes):
1. ✅ Main branch builds successfully
2. ✅ No console errors in browser
3. ✅ Inbox page loads
4. ✅ Flag toggle works
5. ✅ Checkbox appears

### Functional Tests (First 30 minutes):
1. ✅ Toggle "Enable FAQ Creation" flag
2. ✅ Check "Create as FAQ" checkbox
3. ✅ Promote as FAQ (verify `is_faq: true` in database)
4. ✅ Promote as regular QA pair (verify `is_faq: false`)
5. ✅ Navigate away and back (flag persists)

---

## 🚨 Emergency Contacts

**If critical issue:**
1. Execute rollback immediately (use Option 2 if safe)
2. Document the issue
3. Fix in preview
4. Redeploy after testing

---

## 📝 Rollback Decision Tree

```
Issue Detected?
├─ Immediate (< 5 min)?
│  ├─ No one else pulled?
│  │  └─ Use: git reset --hard v1.0.0-before-faq-creation (FASTEST)
│  └─ Others may have pulled?
│     └─ Use: git revert HEAD -m 1 (SAFER)
│
└─ Later (> 5 min)?
   └─ Use: git revert <merge-commit-hash> -m 1 (SAFEST)
```

---

## ✅ Deployment Checklist

### Pre-Deployment:
- [ ] Created rollback tag: `v1.0.0-before-faq-creation`
- [ ] Pushed tag to remote
- [ ] Created deployment branch
- [ ] Copied all 11 files
- [ ] Verified file list
- [ ] Build succeeded (`npm run build`)
- [ ] No TypeScript errors
- [ ] No import errors

### Deployment:
- [ ] Committed changes
- [ ] Merged to main
- [ ] Pushed to remote
- [ ] Verified push succeeded

### Post-Deployment:
- [ ] Main branch builds
- [ ] Inbox page loads
- [ ] Flag toggle works
- [ ] Checkbox appears
- [ ] Functional tests pass

### Rollback Ready:
- [ ] Tag verified: `git tag -l "v1.0.0-before-faq-creation"`
- [ ] Rollback commands documented
- [ ] Team aware of rollback procedure

---

## 🎯 Success Criteria

**Deployment successful if:**
1. ✅ All 11 files deployed
2. ✅ Build succeeds
3. ✅ No errors in console
4. ✅ FAQ creation feature works
5. ✅ Flag persistence works
6. ✅ No breaking changes

**Rollback successful if:**
1. ✅ Main branch reset to tag
2. ✅ Build succeeds after rollback
3. ✅ Previous functionality restored
4. ✅ No data loss

---

**Status:** ✅ **Ready for safe deployment with fast rollback capability**

**Rollback Time:** < 1 minute (using git tag)

**Safety Level:** 🟢 High (tagged rollback point + tested build)





