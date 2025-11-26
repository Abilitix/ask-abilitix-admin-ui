# Backend "Assigned to Me" Filter - Debugging Communication

**Date:** 2025-01-26  
**Issue:** "Assigned to Me" filter not working - items assigned to user not appearing  
**Status:** Needs backend investigation

---

## Problem Summary

When a user (e.g., curator `jimmybablu1977@gmail.com`) has items assigned to them and clicks "Assigned to me" filter:
- **Expected:** Only items where the user is in `assigned_to` array should appear
- **Actual:** No items appear (empty inbox)

---

## UI Implementation Details

### Request Format
The UI sends requests with `assigned_to_me=true` query parameter:

```
GET /api/admin/inbox?status=pending&assigned_to_me=true
GET /api/admin/inbox?status=needs_review&assigned_to_me=true
```

### Current User ID Source
The UI fetches current user ID from `/api/auth/me` endpoint:
- Checks: `data.user.id`, `data.user_id`, `data.id`
- Stores in state: `currentUserId`

### Data Format Expected
The UI expects `assigned_to` field in response to be:
- Array of objects: `[{ id: "uuid", email: "...", name: "...", role: "..." }]`
- OR array of UUIDs: `["uuid1", "uuid2"]`

---

## Backend Questions to Verify

### 1. User ID Resolution
**Question:** How does the backend get the current user ID when filtering with `assigned_to_me=true`?

**Expected behavior:**
- Backend should get `user_id` from session/auth state
- Compare this `user_id` against UUIDs in `assigned_to` array column
- Use PostgreSQL array containment: `WHERE $user_id = ANY(assigned_to)`

**Check:**
- Is `request.state.auth.get("user_id")` correctly populated?
- Is the user ID format matching (lowercase UUID, string format)?
- Is the comparison case-sensitive?

### 2. Database Field Format
**Question:** What format is `assigned_to` stored in the database?

**Expected:**
- PostgreSQL array type: `UUID[]`
- Example: `['uuid1', 'uuid2']` (array of UUIDs)

**Check:**
- Verify column type: `assigned_to UUID[]`
- Verify GIN index exists: `idx_qa_inbox_assigned_to`
- Check actual data: `SELECT id, assigned_to FROM qa_inbox WHERE assigned_to IS NOT NULL LIMIT 5;`

### 3. Filter Implementation
**Question:** How is the `assigned_to_me` filter implemented in the backend?

**Expected SQL (V1):**
```sql
WHERE ... 
  AND ($assigned_to_me IS NULL OR $user_id = ANY(assigned_to))
```

**Expected SQL (V2):**
```sql
WHERE ... 
  AND ($assigned_to_me IS NULL OR $user_id = ANY(i.assigned_to))
```

**Check:**
- Verify query parameter is being read: `assigned_to_me: Optional[bool] = Query(None)`
- Verify user_id is correctly extracted from session
- Verify SQL query includes the filter condition
- Check if UUID normalization is applied (lowercase conversion)

### 4. Status Filtering
**Question:** Does the filter work with both `status=pending` and `status=needs_review`?

**Expected:**
- Filter should work regardless of status
- Items with `status='needs_review'` AND user in `assigned_to` should appear
- Items with `status='pending'` AND user in `assigned_to` should appear

**Check:**
- Test with `status=pending&assigned_to_me=true`
- Test with `status=needs_review&assigned_to_me=true`
- Verify both return correct results

### 5. UUID Format Matching
**Question:** Are UUIDs normalized for comparison?

**Potential issue:**
- Database stores UUIDs in one format (e.g., lowercase)
- Session user_id might be in different format (e.g., uppercase)
- PostgreSQL array comparison might be case-sensitive

**Check:**
- Normalize both sides: `LOWER($user_id) = ANY(SELECT LOWER(unnest(assigned_to)))`
- Or ensure consistent format on both sides

---

## Test Cases to Verify

### Test 1: Basic Filter
```bash
# As user with ID: abc123-def456-...
curl -X GET "https://api.example.com/admin/inbox?status=needs_review&assigned_to_me=true" \
  -H "Cookie: aa_sess=..."
```

**Expected:** Returns items where `assigned_to` contains the current user's UUID

### Test 2: Check User ID in Session
```python
# In backend endpoint handler
user_id = request.state.auth.get("user_id")
print(f"Current user_id from session: {user_id}")
print(f"Type: {type(user_id)}")
```

**Expected:** Should print the user's UUID as a string

### Test 3: Database Query
```sql
-- Check if items exist with assigned_to populated
SELECT 
  id, 
  status, 
  assigned_to,
  array_length(assigned_to, 1) as assignee_count
FROM qa_inbox 
WHERE assigned_to IS NOT NULL 
  AND array_length(assigned_to, 1) > 0
LIMIT 10;

-- Check if specific user ID is in any assigned_to array
SELECT 
  id, 
  status, 
  assigned_to
FROM qa_inbox 
WHERE 'abc123-def456-...' = ANY(assigned_to);
```

**Expected:** Should return items assigned to that user

### Test 4: UUID Format
```sql
-- Check UUID format in database
SELECT 
  id,
  assigned_to,
  assigned_to::text as assigned_to_text
FROM qa_inbox 
WHERE assigned_to IS NOT NULL 
LIMIT 5;
```

**Expected:** UUIDs should be in consistent format (likely lowercase)

---

## Debugging Steps

1. **Add logging to backend endpoint:**
   ```python
   user_id = request.state.auth.get("user_id")
   assigned_to_me = request.query_params.get("assigned_to_me")
   
   logger.info(f"assigned_to_me filter: {assigned_to_me}, user_id: {user_id}")
   ```

2. **Log SQL query:**
   ```python
   logger.info(f"SQL query: {sql_query}")
   logger.info(f"Query params: {query_params}")
   ```

3. **Log results:**
   ```python
   logger.info(f"Found {len(results)} items with assigned_to_me filter")
   ```

4. **Verify session auth:**
   - Check if `request.state.auth` is populated
   - Check if `user_id` field exists and is correct format

---

## Potential Root Causes

1. **User ID not in session:** `request.state.auth.get("user_id")` returns `None`
2. **UUID format mismatch:** Database UUIDs vs session user_id format differ
3. **Filter not applied:** SQL query doesn't include `assigned_to_me` condition
4. **Status filter conflict:** Status filter excludes items before `assigned_to_me` filter
5. **Array comparison issue:** PostgreSQL array containment not working as expected

---

## Next Steps

1. **Backend team:** Review filter implementation and add logging
2. **Verify:** Test with known user ID and assigned items
3. **Fix:** Apply UUID normalization if needed
4. **Confirm:** Test end-to-end with UI

---

## UI Side Status

✅ UI correctly sends `assigned_to_me=true` parameter  
✅ UI correctly forwards parameter through API proxy  
✅ UI correctly fetches both `pending` and `needs_review` statuses  
✅ UI correctly displays items when received  

**Conclusion:** Issue is likely on backend side (filter not working or user_id not matching)

