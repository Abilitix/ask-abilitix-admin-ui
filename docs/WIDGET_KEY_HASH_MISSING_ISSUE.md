# Widget Key Hash Missing - Root Cause Found

## Date
2025-11-22

## Issue Identified

### Database State
```json
{
  "widget_key": "wid_lOLMLeoo9rUrySS4AD2hp7qIOGjuVO90",
  "hash_data": null,  // ❌ MISSING!
  "key_updated": "2025-11-22 11:56:32.430214+00",
  "hash_updated": null
}
```

### Problem
- ✅ Widget key exists in database
- ❌ Hash data is `null` (missing)
- ❌ Runtime API can't verify key without hash
- ❌ Result: 403 Forbidden

## Root Cause

**Admin API is not saving the hash when rotating the widget key.**

When Admin API rotates the key, it should:
1. ✅ Generate new key → **Working**
2. ✅ Save key to database → **Working**
3. ❌ Compute hash for new key → **Not happening?**
4. ❌ Save hash to database → **Not happening**

## Why This Happens

### Possible Causes

1. **Admin API code issue:**
   - Hash computation code not running
   - Hash save code not running
   - Error during hash save (silently failing?)

2. **Database constraint issue:**
   - Hash column might have constraint preventing save
   - Transaction might be rolling back

3. **Code path issue:**
   - Key rotation endpoint might not be calling hash save function
   - Hash save might be in different code path

## The Fix

### Admin API Needs To:

1. **When rotating widget key:**
   ```python
   # 1. Generate new key
   new_key = generate_widget_key()
   
   # 2. Compute hash
   hash_data = compute_widget_key_hash(new_key)
   
   # 3. Save BOTH to database
   save_widget_key(tenant_id, new_key)
   save_widget_key_hash(tenant_id, hash_data)  # ← This is missing!
   ```

2. **Verify hash is saved:**
   - Check database after rotation
   - Ensure `WIDGET_API_KEY_HASH` is not null
   - Ensure hash matches the key

3. **Add error handling:**
   - If hash save fails, rollback key save
   - Log errors if hash save fails
   - Return error to Admin UI if hash save fails

## Immediate Action Required

### Tell Admin API Team:

> "When rotating widget key, Admin API is saving the key but NOT saving the hash. 
> The database shows `widget_key` exists but `widget_api_key_hash` is `null`.
> 
> Please fix the key rotation endpoint to:
> 1. Compute hash for the new key
> 2. Save hash to `WIDGET_API_KEY_HASH` in database
> 3. Ensure both key and hash are saved in same transaction
> 
> Current state:
> - Key: `wid_lOLMLeoo9rUrySS4AD2hp7qIOGjuVO90`
> - Hash: `null` (missing)
> 
> This is why Runtime API returns 403 - it can't verify the key without a hash."

## Temporary Workaround

### Option 1: Manual Hash Insert
If Admin API team can provide the hash for `wid_lOLMLeoo9rUrySS4AD2hp7qIOGjuVO90`, we can manually insert it:

```sql
UPDATE public.tenant_settings
SET value = '{"alg": "pbkdf2_sha256", "hash": "...", "iter": 200000, "salt": "...", "created_at": "..."}'
WHERE tenant_id = (SELECT id FROM public.tenants WHERE slug = 'abilitix-pilot')
AND key = 'WIDGET_API_KEY_HASH';
```

### Option 2: Re-rotate Key
Once Admin API fixes the code:
1. Rotate key again
2. Verify both key AND hash are saved
3. Test widget

## Testing After Fix

1. ✅ Rotate widget key in Admin UI
2. ✅ Check database - both key AND hash should exist
3. ✅ Verify hash matches the key
4. ✅ Test widget - should work now

## Status

- ✅ **Root cause identified:** Hash not being saved
- ⏳ **Fix needed:** Admin API code update
- ⏳ **Testing:** Waiting for Admin API fix

## Summary

**The problem is NOT with:**
- ❌ Admin UI (route handlers working)
- ❌ Runtime API (validation working correctly)
- ❌ Widget code (sending key correctly)

**The problem IS with:**
- ✅ Admin API (not saving hash during key rotation)

**Fix:** Admin API needs to save the hash when rotating the key.


