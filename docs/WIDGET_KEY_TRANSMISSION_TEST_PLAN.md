# Widget Key Transmission Test Plan

## Date
2025-11-22

## Runtime API Analysis Summary

### ✅ Findings
1. **Runtime API verification logic:** CORRECT
   - Test script confirms `_pbkdf2_verify()` works
   - Hash loading from database works
   - Verification matches database state

2. **Database state:** CORRECT
   - Hash exists and matches widget key
   - Hash format is correct

3. **Issue location:** Request transmission
   - Widget may send different key than embed snippet
   - Header transmission/corruption possible
   - Tenant resolution mismatch possible

### ✅ Changes Made by Runtime
1. **Enhanced logging added:**
   - `_pbkdf2_verify()`: logs algorithm validation, hash comparison, failure reasons
   - Middleware: logs widget key received, hash data loaded, verification result

2. **Test scripts created:**
   - Direct verification test (PASSED)
   - End-to-end request simulation

## Testing Plan

### Step 1: Wait for Runtime Deployment
- ⏳ Runtime deploys enhanced logging to production
- ⏳ Verify deployment is complete

### Step 2: Test Widget

**Test File:** `test-widget-key-fix.html`

1. **Open test file in browser:**
   - File has embed snippet: `wid_lOLMLeoo9rUrySS4AD2hp7qIOGjuVO90`
   - Widget should load automatically

2. **Check browser console:**
   - Look for widget.js logs
   - Verify what key widget.js reads from `data-widget-key`
   - Should show: `wid_lOLMLeoo9rUrySS4AD2hp7qIOGjuVO90`

3. **Open widget and send message:**
   - Click widget button
   - Send test message
   - Check for errors

4. **Check browser network tab:**
   - Find POST request to `/ask`
   - Check `X-Widget-Key` header value
   - Should be: `wid_lOLMLeoo9rUrySS4AD2hp7qIOGjuVO90`

### Step 3: Check Runtime API Logs

After sending widget message, check Runtime API logs for:

```
[WIDGET KEY DEBUG] Widget key received: ...
[WIDGET KEY DEBUG] Tenant resolved: ...
[WIDGET KEY DEBUG] Hash loaded from DB: ...
[WIDGET KEY DEBUG] Extracted hash: ...
[WIDGET KEY DEBUG] Computed hash from widget key: ...
[WIDGET KEY DEBUG] Hash comparison: ...
[WIDGET KEY DEBUG] Verification result: ...
```

### Step 4: Compare Values

**Compare these values:**

1. **Embed snippet key:**
   - Should be: `wid_lOLMLeoo9rUrySS4AD2hp7qIOGjuVO90`

2. **Widget.js reads:**
   - Check browser console logs
   - Should match embed snippet

3. **Header sent:**
   - Check network tab `X-Widget-Key` header
   - Should match embed snippet

4. **Runtime API receives:**
   - Check Runtime logs: `[WIDGET KEY DEBUG] Widget key received: ...`
   - Should match embed snippet

5. **Hash loaded:**
   - Check Runtime logs: `[WIDGET KEY DEBUG] Hash loaded from DB: ...`
   - Should contain: `MrTvOaV99qwC0iTqbBFZD87daz0a3vwNQp9542Y8GkI=`

6. **Computed hash:**
   - Check Runtime logs: `[WIDGET KEY DEBUG] Computed hash: ...`
   - Should match loaded hash

### Step 5: Identify Mismatch

**If mismatch found:**

- **Embed snippet ≠ Widget.js reads:**
  - Issue: Widget.js not reading `data-widget-key` correctly
  - Fix: Check widget.js code

- **Widget.js reads ≠ Header sent:**
  - Issue: Widget.js not sending key correctly
  - Fix: Check widget.js header setting

- **Header sent ≠ Runtime receives:**
  - Issue: Header transmission/corruption
  - Fix: Check proxy/CDN/load balancer

- **Runtime receives ≠ Hash matches:**
  - Issue: Runtime verification logic (but tests say it works)
  - Fix: Check Runtime logs for detailed failure reason

## Expected Log Output (When Working)

```
[WIDGET KEY DEBUG] Widget key received: wid_lOLMLeoo9rUrySS4AD2hp7qIOGjuVO90
[WIDGET KEY DEBUG] Tenant resolved: 392bdca5-3a5d-4f5f-9639-d861690645e7
[WIDGET KEY DEBUG] Hash loaded from DB: {'alg': 'pbkdf2_sha256', 'hash': 'MrTvOaV99qwC0iTqbBFZD87daz0a3vwNQp9542Y8GkI=', 'iter': 200000, 'salt': '...', 'created_at': '...'}
[WIDGET KEY DEBUG] Extracted hash: MrTvOaV99qwC0iTqbBFZD87daz0a3vwNQp9542Y8GkI=
[WIDGET KEY DEBUG] Computed hash from widget key: MrTvOaV99qwC0iTqbBFZD87daz0a3vwNQp9542Y8GkI=
[WIDGET KEY DEBUG] Hash comparison: stored=MrTvOaV99qwC0iTqbBFZD87daz0a3vwNQp9542Y8GkI=, computed=MrTvOaV99qwC0iTqbBFZD87daz0a3vwNQp9542Y8GkI=, match=True
[WIDGET KEY DEBUG] Verification result: True
```

## Widget.js Debugging

### Check widget.js Code

Verify widget.js:
1. Reads `data-widget-key` from script tag correctly
2. Sends key in `X-Widget-Key` header correctly
3. Doesn't transform/encode the key

### Add Widget.js Logging (if needed)

If widget.js doesn't have logging, add:

```javascript
console.log('[WIDGET DEBUG] Script tag key:', scriptTag.getAttribute('data-widget-key'));
console.log('[WIDGET DEBUG] Sending key in header:', widgetKey);
```

## Status

- ✅ **Database:** Verified correct
- ✅ **Runtime API logic:** Verified correct
- ✅ **Runtime logging:** Added (waiting for deployment)
- ⏳ **Widget testing:** Waiting for Runtime deployment
- ⏳ **Issue identification:** Waiting for logs

## Next Steps

1. ⏳ **Wait for Runtime deployment** of enhanced logging
2. ⏳ **Test widget** with current key
3. ⏳ **Check Runtime logs** for detailed debug info
4. ⏳ **Compare values** at each step
5. ⏳ **Identify mismatch** and fix

## Summary

**Runtime API verification is correct.** The issue is likely in how the widget sends the key. Enhanced logging will show exactly where the mismatch occurs in the transmission chain.


