# Widget Answer Quality Issue

## Date
2025-11-22

## Issue
Widget answers are of lower quality compared to Admin UI chat for the same question.

## Comparison

### Admin UI Chat (`/api/ask/stream`)
**Sends to Runtime API:**
```json
{
  "question": "...",
  "session_id": "...",
  "max_tokens": 500,  // Optional
  "topk": 8          // Optional (defaults to 8 in Admin UI)
}
```
**Headers:**
- `X-Tenant-Id`: From user session

### Widget (`widget.js`)
**Sends to Runtime API:**
```json
{
  "question": "...",
  "session_id": "..."
}
```
**Headers:**
- `X-Widget-Key`: Widget key
- `x-tenant-slug`: Tenant slug

**Missing:**
- ❌ `topk` parameter (controls how many document chunks retrieved)
- ❌ `max_tokens` parameter (controls answer length)

## Root Cause Analysis

### Possible Causes

#### 1. Missing `topk` Parameter (Most Likely)
**Impact:** Controls how many relevant document chunks are retrieved for RAG.

**Admin UI:** Sends `topk: 8` (or uses default)
**Widget:** Doesn't send `topk` → Runtime API uses default (might be different)

**Fix:** Add `topk` parameter to widget request

#### 2. Missing `max_tokens` Parameter
**Impact:** Controls maximum answer length.

**Admin UI:** Sends `max_tokens: 500` (or uses default)
**Widget:** Doesn't send `max_tokens` → Runtime API uses default (might be different)

**Fix:** Add `max_tokens` parameter to widget request

#### 3. Different Defaults in Runtime API
**Impact:** Runtime API might have different defaults for widget requests vs Admin UI requests.

**Check:** What are Runtime API's default values for `topk` and `max_tokens`?

## Recommended Fix

### Option 1: Add `topk` Parameter to Widget (Recommended)

Update `widget.js` to send `topk` parameter:

```javascript
const requestBody = {
  question: question,
  session_id: sessionId,
  topk: 8  // Match Admin UI default
};
```

### Option 2: Add Both `topk` and `max_tokens`

```javascript
const requestBody = {
  question: question,
  session_id: sessionId,
  topk: 8,        // Match Admin UI
  max_tokens: 500 // Match Admin UI
};
```

### Option 3: Make Parameters Configurable

Allow tenants to configure `topk` via widget settings:

```javascript
// Get from widget config or use default
const topk = scriptTag.getAttribute('data-topk') || '8';
const maxTokens = scriptTag.getAttribute('data-max-tokens') || '500';

const requestBody = {
  question: question,
  session_id: sessionId,
  topk: parseInt(topk),
  max_tokens: parseInt(maxTokens)
};
```

## Questions for Runtime API

1. **What is the default `topk` value?**
   - If widget doesn't send `topk`, what value does Runtime API use?
   - Is it the same as Admin UI default (8)?

2. **What is the default `max_tokens` value?**
   - If widget doesn't send `max_tokens`, what value does Runtime API use?
   - Is it the same as Admin UI default (500)?

3. **Are there other parameters that affect answer quality?**
   - Temperature?
   - Model selection?
   - Prompt/system instructions?

## Testing Plan

### Before Fix
1. Test same question in Admin UI → Note answer quality
2. Test same question in widget → Note answer quality
3. Compare answers

### After Fix
1. Add `topk: 8` to widget request
2. Test same question in widget
3. Compare with Admin UI answer
4. If still different, add `max_tokens: 500`
5. Test again

## Expected Result

After adding `topk` parameter:
- Widget should retrieve same number of document chunks as Admin UI
- Answer quality should match Admin UI
- Answers should be similar in depth and accuracy

## Next Steps

1. ⏳ **Check Runtime API defaults** for `topk` and `max_tokens`
2. ⏳ **Add `topk` parameter** to widget request
3. ⏳ **Test answer quality** improvement
4. ⏳ **Add `max_tokens` if needed**

## Log Analysis (2025-11-22)

From Runtime API logs, we can see:
- `"rag_topk_resolved": 5` - Runtime API is using **5 chunks** for all requests
- `"chunks_after_dedup": 3, "chunks_after_budget": 3` - Only **3 chunks** are actually used after deduplication

**Root Cause Analysis:**
- Tenant setting `RAG_TOPK: 5` (confirmed - this is the default)
- Admin UI sends `topk: 5` (uses tenant setting)
- Widget was **not sending `topk` parameter** → Runtime API uses tenant setting (5)
- **Both Admin UI and Widget are using 5 chunks** - so `topk` is NOT the cause of quality difference

**Conclusion:**
- ✅ Widget should send `topk: 5` explicitly to match Admin UI behavior
- ⚠️ **Answer quality difference is NOT due to `topk` parameter** (both use 5)
- 🔍 **Need to investigate other causes:**
  - Different prompts/system instructions?
  - Different model parameters?
  - Different context handling?
  - Session/conversation history differences?

## Status

- ✅ **Issue identified:** Widget missing `topk` parameter (though both use 5, so not the root cause)
- ✅ **Fix implemented:** Added `topk: 5` to widget request in `public/widget.js` to match Admin UI
- ⏳ **Fix deployed:** Waiting for deployment
- ⏳ **Root cause:** Still investigating - quality difference not due to `topk` since both use 5

