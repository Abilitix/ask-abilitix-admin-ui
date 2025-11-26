# Widget Runtime API Verification Debug Plan

## Date
2025-11-22

## Current Status

### ✅ Database State: CORRECT
- Widget key: `wid_lOLMLeoo9rUrySS4AD2hp7qIOGjuVO90` (exists)
- Widget hash: Exists and matches key cryptographically
- Hash verification: ✅ PASS

### ❌ Runtime API: Still Returns 403
- Widget sends key → Runtime API → 403 Forbidden
- Database is correct, so issue is in Runtime API verification

## Root Cause Analysis

### Possible Causes (in order of likelihood)

#### 1. Widget Sending Different Key (60% likely)
**Problem:** Widget might be sending a different key than what's in the embed snippet.

**Check:**
- What key does the widget actually send in `X-Widget-Key` header?
- Does it match the embed snippet: `wid_lOLMLeoo9rUrySS4AD2hp7qIOGjuVO90`?

**Debug:**
- Add logging in widget.js to log the key being sent
- Check browser network tab to see actual header value
- Compare with embed snippet

#### 2. Runtime API Not Loading/Verifying Hash Correctly (30% likely)
**Problem:** Runtime API might not be loading the hash from database correctly.

**Check:**
- What hash does Runtime API load from database?
- Does it match the stored hash: `MrTvOaV99qwC0iTqbBFZD87daz0a3vwNQp9542Y8GkI=`?
- Is the verification function working correctly?

**Debug:**
- Add logging to show hash loaded from database
- Add logging to show computed hash from widget key
- Add logging to show comparison result

#### 3. Runtime API Using Different Tenant/Database (10% likely)
**Problem:** Runtime API might be querying wrong tenant or database.

**Check:**
- What tenant_id does Runtime API resolve?
- Is it querying the correct tenant: `392bdca5-3a5d-4f5f-9639-d861690645e7`?
- Is it using the correct database?

**Debug:**
- Add logging to show tenant_id resolution
- Add logging to show database query
- Verify tenant_id matches

## Required Runtime API Logging

### Add These Log Statements

```python
# 1. Log widget key received
logger.info(f"[WIDGET KEY DEBUG] Widget key received: {widget_key}")

# 2. Log tenant resolution
logger.info(f"[WIDGET KEY DEBUG] Tenant resolved: {tenant_id}")

# 3. Log hash loaded from database
logger.info(f"[WIDGET KEY DEBUG] Hash loaded from DB: {hash_data}")

# 4. Log hash extraction
logger.info(f"[WIDGET KEY DEBUG] Extracted hash: {extracted_hash}, salt: {salt}, iter: {iterations}")

# 5. Log computed hash
logger.info(f"[WIDGET KEY DEBUG] Computed hash from widget key: {computed_hash}")

# 6. Log comparison
logger.info(f"[WIDGET KEY DEBUG] Hash comparison: stored={stored_hash}, computed={computed_hash}, match={match}")

# 7. Log verification result
logger.info(f"[WIDGET KEY DEBUG] Verification result: {result}")
```

## Testing Steps

### Step 1: Test Widget with Current Key

1. **Use embed snippet:**
   ```html
   <script src="https://app.abilitix.com.au/widget.js" 
           data-tenant="abilitix-pilot" 
           data-widget-key="wid_lOLMLeoo9rUrySS4AD2hp7qIOGjuVO90"></script>
   ```

2. **Open widget and send message**

3. **Check browser console:**
   - What key is widget.js logging?
   - Does it match the embed snippet?

4. **Check browser network tab:**
   - What `X-Widget-Key` header value is sent?
   - Does it match: `wid_lOLMLeoo9rUrySS4AD2hp7qIOGjuVO90`?

### Step 2: Check Runtime API Logs

After Runtime API adds logging:

1. **Send widget request**

2. **Check Runtime API logs for:**
   - `[WIDGET KEY DEBUG] Widget key received: ...`
   - `[WIDGET KEY DEBUG] Hash loaded from DB: ...`
   - `[WIDGET KEY DEBUG] Computed hash: ...`
   - `[WIDGET KEY DEBUG] Verification result: ...`

3. **Compare values:**
   - Received key vs embed snippet key
   - Loaded hash vs database hash
   - Computed hash vs stored hash

### Step 3: Identify Mismatch

Based on logs, identify where the mismatch occurs:

- **If received key ≠ embed snippet:** Widget is sending wrong key
- **If loaded hash ≠ database hash:** Runtime API loading wrong hash
- **If computed hash ≠ stored hash:** Verification function issue
- **If all match but still fails:** Logic error in verification

## Expected Log Output (When Working)

```
[WIDGET KEY DEBUG] Widget key received: wid_lOLMLeoo9rUrySS4AD2hp7qIOGjuVO90
[WIDGET KEY DEBUG] Tenant resolved: 392bdca5-3a5d-4f5f-9639-d861690645e7
[WIDGET KEY DEBUG] Hash loaded from DB: {'alg': 'pbkdf2_sha256', 'hash': 'MrTvOaV99qwC0iTqbBFZD87daz0a3vwNQp9542Y8GkI=', ...}
[WIDGET KEY DEBUG] Extracted hash: MrTvOaV99qwC0iTqbBFZD87daz0a3vwNQp9542Y8GkI=
[WIDGET KEY DEBUG] Computed hash from widget key: MrTvOaV99qwC0iTqbBFZD87daz0a3vwNQp9542Y8GkI=
[WIDGET KEY DEBUG] Hash comparison: stored=MrTvOaV99qwC0iTqbBFZD87daz0a3vwNQp9542Y8GkI=, computed=MrTvOaV99qwC0iTqbBFZD87daz0a3vwNQp9542Y8GkI=, match=True
[WIDGET KEY DEBUG] Verification result: True
```

## Tell Runtime API Team

> "Database state is verified correct:
> - Key: `wid_lOLMLeoo9rUrySS4AD2hp7qIOGjuVO90`
> - Hash: `MrTvOaV99qwC0iTqbBFZD87daz0a3vwNQp9542Y8GkI=` (matches key)
> 
> But widget still gets 403. Please add detailed logging to show:
> 1. What widget key is received from header
> 2. What hash is loaded from database
> 3. What hash is computed from widget key
> 4. Why verification fails
> 
> The logs will show exactly where the mismatch occurs."

## Next Steps

1. ⏳ **Runtime API adds logging** (as specified above)
2. ⏳ **Test widget** with current key
3. ⏳ **Check Runtime API logs** for mismatch
4. ⏳ **Fix based on findings**

## Status

- ✅ **Database:** Verified correct
- ✅ **Hash:** Verified matches key
- ⏳ **Runtime API:** Needs debugging logs
- ⏳ **Widget:** Waiting for Runtime API fix

## Summary

**Database is correct.** The issue is in Runtime API's verification process. Detailed logging will show exactly where the mismatch occurs.


