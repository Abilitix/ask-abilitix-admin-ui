# Widget Key Verification Still Failing

## Date
2025-11-22

## Issue
After rotating widget key to `wid_Kl8rFQ8wJWceAtWBgiuLY2OQxn_QJc-4`, Runtime API still returns 403 Forbidden.

## Logs Analysis

### What's Working
- ✅ CORS: OPTIONS preflight returns 200 OK
- ✅ Hash data loaded: Dict format with correct keys
- ✅ Request reaches Runtime API

### What's Failing
- ❌ Widget key verification: `result=False`
- ❌ Error: "widget key verification FAILED - key doesn't match hash"
- ❌ Response: 403 Forbidden

## Root Cause Analysis

### Scenario 1: Database Not Updated
**Problem:** Admin API rotated the key but didn't update the hash in the database.

**Check:**
```sql
SELECT widget_api_key_hash 
FROM tenant_settings 
WHERE tenant_id = '392bdca5-3a5d-4f5f-9639-d861690645e7';
```

**Expected:** Hash should match the new key `wid_Kl8rFQ8wJWceAtWBgiuLY2OQxn_QJc-4`

**Fix:** Admin API needs to ensure hash is saved after key rotation.

### Scenario 2: Runtime API Caching
**Problem:** Runtime API is caching the old widget key hash.

**Check:** Runtime API logs should show what hash it's reading.

**Fix:** Restart Runtime API or clear cache.

### Scenario 3: Database Sync Issue
**Problem:** Admin API and Runtime API are using different databases, or hash hasn't synced.

**Check:** Verify both APIs use the same database.

**Fix:** Ensure database sync or use same database.

## What Runtime Needs to Check

### 1. What Hash is in Database?
```sql
SELECT widget_api_key_hash 
FROM tenant_settings 
WHERE tenant_id = '392bdca5-3a5d-4f5f-9639-d861690645e7';
```

### 2. What Hash is Runtime Reading?
Check Runtime API logs for:
- `[WIDGET KEY DEBUG] extracted hash=...`
- What hash value is Runtime extracting from database?

### 3. What Hash Should Match?
The new key `wid_Kl8rFQ8wJWceAtWBgiuLY2OQxn_QJc-4` should hash to match the database hash.

### 4. Verification Function
Runtime's verification function should:
1. Extract hash from `hash_data['hash']`
2. Extract salt from `hash_data['salt']`
3. Extract iterations from `hash_data['iter']`
4. Compute hash from widget key using same salt/iterations
5. Compare computed hash with stored hash

## Debugging Steps

### Step 1: Verify Database Hash
Ask Admin API team to verify:
- Is the new hash stored in database?
- Does the hash match the new key `wid_Kl8rFQ8wJWceAtWBgiuLY2OQxn_QJc-4`?

### Step 2: Check Runtime Logs
Runtime should add debug logging to show:
- Extracted hash value from database
- Computed hash from widget key
- Why they don't match

### Step 3: Test Hash Verification
Runtime should test:
- Does the new key hash match the database hash?
- Is the verification function working correctly?

## Expected Fix

Once Runtime adds detailed logging, we'll see:
- What hash Runtime is reading from database
- What hash Runtime computes from widget key
- Why they don't match

Then we can fix the root cause.

## Next Steps

1. ⏳ Runtime adds detailed hash logging
2. ⏳ Check what hash is in database
3. ⏳ Verify hash matches new key
4. ⏳ Fix based on findings


