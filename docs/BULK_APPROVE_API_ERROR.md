# Bulk Approve API Error - Backend Fix Required

**Date:** 2025-01-20  
**Status:** ✅ **RESOLVED** (2025-01-20)  
**Priority:** HIGH  
**Component:** Admin API Backend

---

## 🐛 **Error Details**

### **Error Message:**
```
psycopg.errors.CannotCoerce: cannot cast type uuid to jsonb

LINE 3: ... promoted_pair_id = $1::uuid, promoted_citations = $2::jsonb
```

### **Location:**
- **File:** `/opt/render/project/src/routes_admin.py`
- **Function:** `inbox_bulk_approve`
- **Line:** 3802
- **SQL Statement:** `await conn.execute(update_sql, *update_params)`

### **Error Type:**
PostgreSQL type coercion error - attempting to cast UUID to JSONB

---

## 🔍 **Root Cause Analysis**

The error occurs when executing the bulk approve SQL update statement. The issue appears to be:

1. **Parameter Order Mismatch:** The SQL expects `promoted_pair_id` (UUID) and `promoted_citations` (JSONB), but parameters may be in wrong order
2. **Type Mismatch:** A UUID value is being passed where JSONB is expected (or vice versa)
3. **SQL Casting Issue:** The explicit cast `$1::uuid` or `$2::jsonb` is failing because the parameter type doesn't match

### **Expected SQL Pattern:**
```sql
UPDATE inbox_items 
SET promoted_pair_id = $1::uuid, 
    promoted_citations = $2::jsonb
WHERE id = $3
```

### **Likely Issue:**
- Parameters are being passed in wrong order
- Or parameter values are swapped (UUID passed as JSONB param, JSONB passed as UUID param)

---

## 📋 **Impact**

### **User Impact:**
- ❌ Bulk approve operations fail completely
- ❌ Users cannot bulk approve inbox items
- ❌ Error shown in UI: "Failed to bulk approve: 500" (or similar)

### **Affected Endpoints:**
- `POST /admin/inbox/bulk-approve` - **BROKEN**

### **Workaround:**
- Users must approve items individually (single approve still works)

---

## 🔧 **Required Fix (Backend)**

### **File to Fix:**
`/opt/render/project/src/routes_admin.py` - Line ~3802

### **Fix Steps:**

1. **Check Parameter Order:**
   - Verify `update_params` array matches SQL parameter order
   - Ensure `promoted_pair_id` (UUID) is first parameter
   - Ensure `promoted_citations` (JSONB) is second parameter

2. **Check Parameter Types:**
   - Verify `promoted_pair_id` is actually a UUID (not None, not string, not JSONB)
   - Verify `promoted_citations` is actually JSONB-compatible (dict/list that can be serialized)

3. **Check SQL Statement:**
   - Review the `update_sql` string
   - Ensure parameter placeholders match parameter order
   - Remove explicit casts if causing issues, or ensure casts match parameter types

### **Example Fix Pattern:**

**Before (Broken):**
```python
update_sql = """
    UPDATE inbox_items 
    SET promoted_pair_id = $1::uuid, 
        promoted_citations = $2::jsonb
    WHERE id = $3
"""
update_params = [citations_json, pair_id, inbox_id]  # ❌ Wrong order
await conn.execute(update_sql, *update_params)
```

**After (Fixed):**
```python
update_sql = """
    UPDATE inbox_items 
    SET promoted_pair_id = $1::uuid, 
        promoted_citations = $2::jsonb
    WHERE id = $3
"""
update_params = [pair_id, citations_json, inbox_id]  # ✅ Correct order
await conn.execute(update_sql, *update_params)
```

Or ensure proper type conversion:
```python
import json

# Ensure citations is properly serialized to JSON
citations_json = json.dumps(citations) if isinstance(citations, (dict, list)) else citations

# Ensure pair_id is UUID type
from uuid import UUID
pair_id = UUID(pair_id) if isinstance(pair_id, str) else pair_id

update_params = [pair_id, citations_json, inbox_id]
```

---

## 🧪 **Testing Required**

After fix, test:
1. ✅ Bulk approve with single item
2. ✅ Bulk approve with multiple items
3. ✅ Bulk approve with `as_faq: true`
4. ✅ Bulk approve with `as_faq: false`
5. ✅ Verify `promoted_pair_id` is set correctly (UUID)
6. ✅ Verify `promoted_citations` is set correctly (JSONB)
7. ✅ Verify error handling for invalid IDs
8. ✅ Verify partial success handling (some succeed, some fail)

---

## 📝 **Notes**

- This is a **backend API issue**, not a UI issue
- UI is correctly calling the endpoint with proper request format
- The error occurs during SQL execution in the backend
- Single approve endpoint (`POST /admin/inbox/{id}/approve`) may work fine (different code path)
- Bulk reject endpoint (`POST /admin/inbox/bulk-reject`) may also be affected if it uses similar SQL pattern

---

## 🚨 **Priority**

**HIGH** - This breaks core functionality (bulk approve) that users depend on.

---

**Reported:** 2025-01-20  
**Resolved:** 2025-01-20  
**Status:** ✅ **FIXED** - Backend team resolved the SQL parameter type issue  
**UI Status:** ✅ **WORKING** - Bulk approve and bulk reject are now functional in both legacy and modern inbox modes

