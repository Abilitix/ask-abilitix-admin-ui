# Widget Key Tracking

## Date
2025-11-22

## All Keys We've Seen

### 1. Original Key (from earlier testing)
- **Key:** `wid_nfJBn-ee3MwaO8DkzlNBVuz6DTxX2gf6`
- **Status:** Old key (before rotation)
- **Hash:** Matched in database (verified earlier)
- **Issue:** Admin UI was showing wrong key variant: `wid_nfJBn-ee3Mwa08Dkz1NBVuz6DTxX2gf6`

### 2. Production Key (first rotation)
- **Key:** `wid_Kl8rFQ8wJWceAtWBgiuLY2OQxn_QJc-4`
- **Source:** Production Admin UI (before route handlers deployed)
- **Status:** Unknown if hash was saved

### 3. Preview Key
- **Key:** `wid_0Ilmz6BtgFTx_A0OTlbA1Tr19OTAtsGw`
- **Source:** Preview Admin UI (after route handlers deployed)
- **Status:** Unknown if hash was saved

### 4. Latest Production Key (current)
- **Key:** `wid_lOLMLeoo9rUrySS4AD2hp7qIOGjuVO90`
- **Source:** Production Admin UI (after route handlers deployed)
- **Status:** Need to verify hash is in database

## Current Situation

### Problem
Multiple key rotations may have caused desync between:
- Database hash
- Admin UI display
- Widget embed snippets

### What We Need to Verify

1. **Which key is in the database?**
   - Run SQL query to check current `WIDGET_KEY` value
   - Verify `widget_api_key_hash` matches that key

2. **Which key does Admin UI show?**
   - Production Admin UI: `wid_lOLMLeoo9rUrySS4AD2hp7qIOGjuVO90`
   - Preview Admin UI: `wid_0Ilmz6BtgFTx_A0OTlbA1Tr19OTAtsGw`

3. **Which key does Runtime API expect?**
   - Runtime API reads hash from database
   - Verifies widget key against that hash
   - If hash doesn't match key → 403 Forbidden

## SQL Query to Check Database

### Check Current Widget Key
```sql
SELECT 
    key,
    value->>'value' as widget_key_value,
    updated_at as key_updated
FROM public.tenant_settings
WHERE tenant_id = (
    SELECT id FROM public.tenants WHERE slug = 'abilitix-pilot'
)
AND key = 'WIDGET_KEY';
```

### Check Widget Key Hash
```sql
SELECT 
    key,
    value as hash_data,
    updated_at as hash_updated
FROM public.tenant_settings
WHERE tenant_id = (
    SELECT id FROM public.tenants WHERE slug = 'abilitix-pilot'
)
AND key = 'WIDGET_API_KEY_HASH';
```

### Check Both Together
```sql
SELECT 
    ts1.key as key_name,
    ts1.value->>'value' as widget_key,
    ts2.value as hash_data,
    ts1.updated_at as key_updated,
    ts2.updated_at as hash_updated
FROM public.tenant_settings ts1
LEFT JOIN public.tenant_settings ts2 
    ON ts1.tenant_id = ts2.tenant_id 
    AND ts2.key = 'WIDGET_API_KEY_HASH'
WHERE ts1.tenant_id = (
    SELECT id FROM public.tenants WHERE slug = 'abilitix-pilot'
)
AND ts1.key = 'WIDGET_KEY';
```

## Recommended Actions

### 1. Stop Rotating Keys
- Multiple rotations may have desynced the system
- We need to verify current state first

### 2. Verify Database State
- Run SQL queries above
- Check which key is stored
- Check which hash is stored
- Verify hash matches the key

### 3. Verify Admin UI
- Check what key Production Admin UI shows
- Check what key Preview Admin UI shows
- Verify route handlers are working

### 4. Test Widget
- Use the key that matches the database
- Test if widget works with that key
- If it works → problem solved
- If it doesn't → need to investigate further

## Next Steps

1. ⏳ **Run SQL queries** to check database state
2. ⏳ **Verify Admin UI** shows correct key (route handlers working)
3. ⏳ **Test widget** with the key that matches database
4. ⏳ **Fix any mismatches** if found

## Questions to Answer

1. **Which key is currently in the database?**
   - Run SQL query to find out

2. **Does the hash match that key?**
   - Verify hash verification works

3. **Which key does Admin UI show?**
   - Production: `wid_lOLMLeoo9rUrySS4AD2hp7qIOGjuVO90`
   - Preview: `wid_0Ilmz6BtgFTx_A0OTlbA1Tr19OTAtsGw`

4. **Which key should we use for testing?**
   - Use the key that matches the database

## Status

- ⏳ **Database State:** Unknown (need SQL query)
- ⏳ **Admin UI State:** Shows different keys in prod vs preview
- ⏳ **Widget Testing:** Waiting for database verification

## Notes

- Route handlers are deployed to both preview and production
- Admin UI should now fetch keys from Admin API correctly
- Need to verify database has correct key and hash
- Once verified, test widget with matching key


