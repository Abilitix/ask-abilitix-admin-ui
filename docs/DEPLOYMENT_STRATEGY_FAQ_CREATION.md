# Deployment Strategy: FAQ Creation Feature to Main

**Date:** November 20, 2025  
**Feature:** FAQ Creation (Create as FAQ checkbox + Enable FAQ Creation flag)  
**Status:** Ready for deployment

---

## 📊 Current State Analysis

### Last Deployed to Main:
- `e2d0407` - Use runtime is_faq field for accurate FAQ/QA Pair labeling
- `21e4d62` - Add tenant isolation to sticky chat storage
- `05c81c3` - Show Approved FAQ label in chat
- `7b3e6bc` - Sticky chat with localStorage persistence

### Pending in Preview (FAQ Creation Feature):
- `17aaf7f` - Fix: persist flags in localStorage (TODAY)
- `bc32490` - Fix: flag persistence, citation format with type field
- `c7a8162` - Fix: improve modal visibility with portal
- `7326789` - Feat: fix flag sync bug, add hybrid citations
- `110adb2` - Fix: request INBOX.ENABLE_REVIEW_PROMOTE correctly
- `93719be` - Fix: use updates array format for tenant settings
- `3991451` - Fix: pass enableFaqCreation prop
- `bfba293` - Feat: add Enable FAQ Creation tenant flag
- `3b06c54` - Fix: use /promote for FAQ, /approve for QA pairs
- `37faac4` - Fix: use /promote endpoint in legacy inbox
- `02113bf` - Feat: add Create as FAQ checkbox

---

## 🎯 Critical Files for Deployment

### Core FAQ Creation Files:
1. **`src/components/inbox/InboxPageClient.tsx`** ⭐ CRITICAL
   - Flag management (Enable FAQ Creation)
   - Flag persistence in localStorage
   - Passes `enableFaqCreation` to child components

2. **`src/components/inbox/InboxDetailPanel.tsx`** ⭐ CRITICAL
   - "Create as FAQ" checkbox UI
   - Modern inbox panel

3. **`src/components/inbox/LegacyInboxList.tsx`** ⭐ CRITICAL
   - "Create as FAQ" checkbox for legacy inbox
   - Citation attachment modal

4. **`src/components/inbox/LegacyInboxPageClient.tsx`** ⭐ CRITICAL
   - Handles approve/promote logic for legacy inbox
   - Routes to `/promote` or `/approve` based on `isFaq`

5. **`src/components/inbox/ModernInboxClient.tsx`** ⭐ CRITICAL
   - Handles promote logic for modern inbox
   - Routes to `/promote` or `/approve` based on `isFaq`

6. **`src/lib/server/adminSettings.ts`** ⭐ CRITICAL
   - Parses `INBOX.ENABLE_REVIEW_PROMOTE` flag
   - Maps to `enableFaqCreation` in UI

7. **`src/app/admin/inbox/page.tsx`** ⭐ CRITICAL
   - Fetches tenant settings including `INBOX.ENABLE_REVIEW_PROMOTE`
   - Passes flags to `InboxPageClient`

8. **`src/app/api/admin/tenant-settings/route.ts`** ⭐ CRITICAL
   - Handles flag updates with `updates` array format
   - Supports namespaced keys (`INBOX.ENABLE_REVIEW_PROMOTE`)

9. **`src/components/inbox/CitationsEditor.tsx`** ⚠️ IMPORTANT
   - Citation editor component (used in legacy inbox modal)

### Supporting Files (API Routes):
- `src/app/api/admin/inbox/[id]/promote/route.ts` - Promotion endpoint
- `src/app/api/admin/inbox/[id]/attach_source/route.ts` - Citation attachment
- `src/app/api/admin/inbox/approve/route.ts` - Regular approval

---

## 🚀 Deployment Strategy

### Option 1: Cherry-Pick Individual Commits (Recommended)

**Pros:**
- ✅ Selective deployment
- ✅ Can test each commit
- ✅ Easy rollback per commit
- ✅ Clear history

**Cons:**
- ⚠️ More manual work
- ⚠️ Need to handle dependencies

**Steps:**
```bash
# 1. Create deployment branch from main
git checkout main
git pull origin main
git checkout -b deploy/faq-creation-to-main

# 2. Cherry-pick commits in order (oldest to newest)
git cherry-pick 02113bf  # Create as FAQ checkbox
git cherry-pick 37faac4   # Use /promote in legacy inbox
git cherry-pick 3b06c54   # Use /promote for FAQ, /approve for QA
git cherry-pick bfba293   # Enable FAQ Creation flag
git cherry-pick 3991451   # Pass enableFaqCreation prop
git cherry-pick 93719be   # Updates array format
git cherry-pick 110adb2   # Request INBOX.ENABLE_REVIEW_PROMOTE
git cherry-pick 7326789   # Flag sync bug, hybrid citations
git cherry-pick c7a8162   # Modal visibility
git cherry-pick bc32490   # Flag persistence, citation format
git cherry-pick 17aaf7f   # Flag persistence in localStorage

# 3. Test on deployment branch
# 4. Merge to main
git checkout main
git merge deploy/faq-creation-to-main
git push origin main

# 5. Cleanup
git branch -d deploy/faq-creation-to-main
```

---

### Option 2: Merge Preview Branch (Faster, Riskier)

**Pros:**
- ✅ Single command
- ✅ Fast deployment
- ✅ Includes all changes

**Cons:**
- ⚠️ Includes unrelated changes
- ⚠️ Harder to rollback specific features
- ⚠️ May include untested code

**Steps:**
```bash
# 1. Create deployment branch
git checkout main
git pull origin main
git checkout -b deploy/faq-creation-to-main

# 2. Merge preview (selective)
git merge preview --no-ff -m "feat: deploy FAQ creation feature from preview"

# 3. Resolve conflicts if any
# 4. Test thoroughly
# 5. Merge to main
git checkout main
git merge deploy/faq-creation-to-main
git push origin main
```

---

### Option 3: File-by-File Promotion (Safest)

**Pros:**
- ✅ Maximum control
- ✅ Can review each file
- ✅ Easiest rollback

**Cons:**
- ⚠️ Most manual work
- ⚠️ Need to handle dependencies carefully

**Steps:**
```bash
# 1. Switch to main
git checkout main
git pull origin main

# 2. Copy files from preview one by one
git checkout preview -- src/components/inbox/InboxPageClient.tsx
git checkout preview -- src/components/inbox/InboxDetailPanel.tsx
git checkout preview -- src/components/inbox/LegacyInboxList.tsx
git checkout preview -- src/components/inbox/LegacyInboxPageClient.tsx
git checkout preview -- src/components/inbox/ModernInboxClient.tsx
git checkout preview -- src/lib/server/adminSettings.ts
git checkout preview -- src/app/admin/inbox/page.tsx
git checkout preview -- src/app/api/admin/tenant-settings/route.ts
git checkout preview -- src/components/inbox/CitationsEditor.tsx

# 3. Commit
git add src/components/inbox/ src/lib/server/adminSettings.ts src/app/admin/inbox/page.tsx src/app/api/admin/tenant-settings/route.ts
git commit -m "feat: deploy FAQ creation feature (Create as FAQ checkbox + Enable FAQ Creation flag)"

# 4. Test
# 5. Push
git push origin main
```

---

## ✅ Recommended Approach: Option 1 (Cherry-Pick)

**Why:**
- ✅ Selective deployment
- ✅ Clear commit history
- ✅ Easy to identify what was deployed
- ✅ Can skip unrelated commits

**Execution Plan:**

### Phase 1: Core FAQ Creation (Commits 1-5)
```bash
git cherry-pick 02113bf  # Create as FAQ checkbox
git cherry-pick 37faac4   # Use /promote in legacy inbox
git cherry-pick 3b06c54   # Use /promote for FAQ, /approve for QA
git cherry-pick bfba293   # Enable FAQ Creation flag
git cherry-pick 3991451   # Pass enableFaqCreation prop
```
**Test:** Verify checkbox appears, flag toggle works, promotion creates FAQs

### Phase 2: Flag Management Fixes (Commits 6-8)
```bash
git cherry-pick 93719be   # Updates array format
git cherry-pick 110adb2   # Request INBOX.ENABLE_REVIEW_PROMOTE
git cherry-pick 7326789   # Flag sync bug, hybrid citations
```
**Test:** Verify flag persistence, correct API calls, citation handling

### Phase 3: UI Improvements (Commits 9-11)
```bash
git cherry-pick c7a8162   # Modal visibility
git cherry-pick bc32490   # Flag persistence, citation format
git cherry-pick 17aaf7f   # Flag persistence in localStorage
```
**Test:** Verify modal visibility, flag persistence across navigation

---

## 🔄 Rollback Plan

### Quick Rollback (Last Commit)
```bash
# If issue detected immediately
git checkout main
git revert HEAD
git push origin main
```

### Selective Rollback (Specific Feature)
```bash
# Revert specific commit
git checkout main
git revert <commit-hash>
git push origin main
```

### Full Rollback (All Changes)
```bash
# Reset to last known good commit
git checkout main
git reset --hard <last-good-commit-hash>
git push origin main --force  # ⚠️ Use with caution
```

### Rollback to Specific Tag
```bash
# Create tag before deployment
git tag -a v1.0.0-faq-creation-before -m "Before FAQ creation deployment"
git push origin v1.0.0-faq-creation-before

# Rollback to tag
git checkout main
git reset --hard v1.0.0-faq-creation-before
git push origin main --force
```

---

## 🧪 Pre-Deployment Checklist

### Code Review:
- [ ] All critical files reviewed
- [ ] No TypeScript errors
- [ ] No linter errors
- [ ] Dependencies verified

### Testing:
- [ ] "Create as FAQ" checkbox appears in modern inbox
- [ ] "Create as FAQ" checkbox appears in legacy inbox
- [ ] Flag toggle works (Enable FAQ Creation)
- [ ] Flag persists across navigation
- [ ] Promotion with `is_faq: true` creates FAQ
- [ ] Promotion with `is_faq: false` creates QA pair
- [ ] Citations attach correctly
- [ ] Error handling works (400, 404, 422)

### Backend Verification:
- [ ] `/admin/inbox/{id}/promote` endpoint supports `is_faq`
- [ ] `/admin/inbox/approve` endpoint works for regular QA pairs
- [ ] `/admin/tenant-settings` accepts `INBOX.ENABLE_REVIEW_PROMOTE`
- [ ] Backend returns correct flag values

### Environment:
- [ ] Preview environment tested
- [ ] No breaking changes identified
- [ ] Backward compatibility maintained

---

## 📝 Post-Deployment Verification

### Immediate Checks (First 5 minutes):
1. ✅ Main branch builds successfully
2. ✅ No console errors in browser
3. ✅ Inbox page loads correctly
4. ✅ Flag toggle works
5. ✅ Checkbox appears in both inboxes

### Functional Tests (First 30 minutes):
1. ✅ Toggle "Enable FAQ Creation" flag
2. ✅ Check "Create as FAQ" checkbox
3. ✅ Promote inbox item as FAQ
4. ✅ Verify FAQ created in database
5. ✅ Promote inbox item as regular QA pair
6. ✅ Verify QA pair created (not FAQ)
7. ✅ Attach citations
8. ✅ Navigate away and back (flag persists)

### Monitoring (First 24 hours):
- [ ] Monitor error logs
- [ ] Check user feedback
- [ ] Verify no performance degradation
- [ ] Confirm no broken features

---

## 🚨 Emergency Rollback Procedure

### If Critical Issue Detected:

**Step 1: Identify Issue**
```bash
# Check recent commits
git log main --oneline -5

# Check what changed
git diff <last-good-commit> HEAD
```

**Step 2: Quick Rollback**
```bash
# Revert last commit
git checkout main
git revert HEAD
git push origin main
```

**Step 3: Notify Team**
- Document the issue
- Create issue ticket
- Communicate to stakeholders

**Step 4: Fix and Redeploy**
- Fix issue in preview
- Test thoroughly
- Redeploy using same strategy

---

## 📋 Deployment Commands (Quick Reference)

### Create Deployment Branch:
```bash
git checkout main
git pull origin main
git checkout -b deploy/faq-creation-$(date +%Y%m%d)
```

### Cherry-Pick Commits:
```bash
# Core FAQ Creation
git cherry-pick 02113bf 37faac4 3b06c54 bfba293 3991451

# Flag Management
git cherry-pick 93719be 110adb2 7326789

# UI Improvements
git cherry-pick c7a8162 bc32490 17aaf7f
```

### Test and Merge:
```bash
# Test locally
npm run build
npm run dev

# Merge to main
git checkout main
git merge deploy/faq-creation-$(date +%Y%m%d)
git push origin main
```

### Create Rollback Tag:
```bash
git tag -a v1.0.0-before-faq-creation -m "Before FAQ creation deployment"
git push origin v1.0.0-before-faq-creation
```

---

## ✅ Success Criteria

**Deployment is successful if:**
1. ✅ All files deployed without conflicts
2. ✅ Build succeeds
3. ✅ No TypeScript/linter errors
4. ✅ "Create as FAQ" checkbox visible in both inboxes
5. ✅ "Enable FAQ Creation" flag toggle works
6. ✅ Flag persists across navigation
7. ✅ FAQ promotion creates FAQs with `is_faq: true`
8. ✅ Regular approval creates QA pairs with `is_faq: false`
9. ✅ Citations attach correctly
10. ✅ No breaking changes to existing features

---

## 📞 Support Contacts

**If issues arise:**
- Check deployment logs
- Review error messages
- Test in preview environment first
- Rollback if critical issue detected

---

**Status:** ✅ Ready for deployment  
**Risk Level:** 🟡 Medium (new feature, but well-tested in preview)  
**Estimated Time:** 30-45 minutes (including testing)





