# Production Deployment Testing Checklist

**Date:** 2025-01-26  
**Status:** Admin API changes deployed to production  
**UI Status:** Ready and aligned

---

## ✅ Backend Changes Deployed

1. **`assigned_to_me` filter** - GET /admin/inbox (V1 and V2)
2. **Ownership checks** - Promote and update endpoints
3. **Status filtering** - `needs_review` support in V1 and V2
4. **Duplicate detection** - 409 Conflict for `duplicate_faq_exists`
5. **Chat SME review** - CitationPayload attribute access fix

---

## 🧪 Testing Checklist

### 1. "Assigned to Me" Filter

**Test Steps:**
- [ ] Login as curator/admin
- [ ] Assign items to yourself (via "Request Review")
- [ ] Click "Assigned to me" checkbox
- [ ] Verify only your assigned items appear
- [ ] Check browser console for debug logs
- [ ] Verify Network tab shows `?assigned_to_me=true` parameter

**Expected Results:**
- ✅ Only items where user is in `assigned_to` array appear
- ✅ Empty list if no items assigned to user
- ✅ Console shows: `[LegacyInbox] Fetching with assigned_to_me filter: {...}`
- ✅ Network requests include `credentials: 'include'`

**Error Cases:**
- [ ] If session missing: Should show "Session authentication required..." toast
- [ ] If 400 Bad Request: Should show user-friendly error message

---

### 2. Ownership Checks (Promote/Update)

**Test Steps:**
- [ ] As admin: Assign item to curator
- [ ] As curator (assignee): Verify you can approve/promote the item
- [ ] As curator (non-assignee): Verify you cannot approve/promote (403 error)
- [ ] As admin: Verify you can always approve/promote (admin override)

**Expected Results:**
- ✅ Assignees can promote their assigned items (if curator+ role)
- ✅ Admins can always promote (override)
- ✅ Non-assignees get 403 Forbidden with clear message
- ✅ Error toast: "Permission denied: Only assignees or admins can modify assigned items"

---

### 3. Status Filtering (`needs_review`)

**Test Steps:**
- [ ] Request review for an item (assigns it, sets status to `needs_review`)
- [ ] Verify item appears in inbox list
- [ ] Verify item shows "Needs Review" badge
- [ ] Verify item is included when fetching both `pending` and `needs_review` statuses

**Expected Results:**
- ✅ Items with `status='needs_review'` appear in inbox
- ✅ Status badge shows "Needs Review" (yellow badge)
- ✅ Both pending and needs_review items are fetched and merged

---

### 4. Duplicate Detection (409 Conflict)

**Test Steps:**
- [ ] Approve/promote an item (creates FAQ)
- [ ] Try to create manual FAQ with same question
- [ ] Verify 409 Conflict error is returned
- [ ] Verify error message is user-friendly

**Expected Results:**
- ✅ Backend returns 409 Conflict with `duplicate_faq_exists` error code
- ✅ UI shows clear error message (currently generic, may need enhancement)
- ✅ User understands the item already exists

**Note:** UI currently shows generic error. Consider enhancing to show specific message for `duplicate_faq_exists`.

---

### 5. Manual FAQ Creation

**Test Steps:**
- [ ] Create manual FAQ without SME review
- [ ] Create manual FAQ with SME review (assignees)
- [ ] Verify item appears in inbox with correct status
- [ ] Verify assigned items appear when using "Assigned to Me" filter

**Expected Results:**
- ✅ Manual FAQ created successfully
- ✅ Status is `pending` (no assignees) or `needs_review` (with assignees)
- ✅ Assigned items visible to assignees via "Assigned to Me" filter

---

### 6. Request Review Workflow

**Test Steps:**
- [ ] Click "Request Review" on pending item
- [ ] Select assignees and provide reason
- [ ] Submit request
- [ ] Verify item status changes to `needs_review`
- [ ] Verify assignees can see item via "Assigned to Me" filter
- [ ] Verify assignees can edit/promote the item

**Expected Results:**
- ✅ Item status changes to `needs_review`
- ✅ `assigned_to` array populated with assignee IDs
- ✅ Assignees receive email notification (if configured)
- ✅ Assignees can see and act on their assigned items

---

### 7. Error Handling

**Test Cases:**
- [ ] 400 Bad Request (validation errors)
- [ ] 401 Unauthorized (session expired)
- [ ] 403 Forbidden (ownership check failed)
- [ ] 409 Conflict (duplicate FAQ exists)
- [ ] 422 Unprocessable Entity (validation errors)

**Expected Results:**
- ✅ All errors show user-friendly messages
- ✅ 403 errors specifically mention ownership/permissions
- ✅ 409 errors mention duplicate FAQ (if enhanced)
- ✅ Errors don't expose internal details

---

## 🔍 Debugging Tools

### Browser Console Logs
- `[LegacyInbox] Fetching with assigned_to_me filter:` - Shows filter is active
- `[LegacyInbox] Current user ID fetched:` - Shows user ID from session
- `[LegacyInbox] Received items from backend:` - Shows item count and sample

### Network Tab
- Check request URLs include `?assigned_to_me=true` when filter is active
- Check request headers include `Cookie` header (session auth)
- Check response status codes (200, 400, 403, 409, etc.)

### Database Verification
```sql
-- Check assigned items
SELECT id, question, assigned_to, status 
FROM qa_inbox 
WHERE tenant_id = '...' 
  AND status = 'needs_review'
  AND 'user-uuid'::uuid = ANY(assigned_to);

-- Check duplicate FAQs
SELECT id, question 
FROM qa_pairs 
WHERE tenant_id = '...' 
  AND question = '...';
```

---

## 📋 UI Alignment Status

### ✅ Already Implemented
- [x] `assigned_to_me` filter with session auth (`credentials: 'include'`)
- [x] Ownership-aware button visibility (`canActOnItem` helper)
- [x] 403 error handling with user-friendly messages
- [x] Status filtering for both `pending` and `needs_review`
- [x] Debug logging for troubleshooting

### ⚠️ Potential Enhancements
- [ ] Enhanced 409 error handling for `duplicate_faq_exists` (currently generic)
- [ ] Better error messages for duplicate FAQ scenarios
- [ ] UI indication when item is already approved (duplicate detection)

---

## 🚀 Deployment Status

- **Backend:** ✅ Deployed to production
- **UI:** ✅ Ready (already deployed to preview)
- **Testing:** 🔄 In progress

---

## 📝 Notes

1. **Session Auth:** All inbox fetch calls use `credentials: 'include'` for session-based auth
2. **Error Messages:** Currently generic for 409 conflicts; consider enhancing for `duplicate_faq_exists`
3. **Debug Logging:** Console logs available for troubleshooting filter issues
4. **Backward Compatibility:** Bearer token support maintained for admin/system operations

---

## ✅ Sign-off

- [ ] All test cases passed
- [ ] No critical errors observed
- [ ] Error messages are user-friendly
- [ ] Performance is acceptable
- [ ] Ready for production use

