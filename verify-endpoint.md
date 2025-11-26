# Verify Runtime API Endpoint for Widget

## Current Widget Configuration

**Widget is calling:**
```
https://ask-abilitix-runtime.onrender.com/ask
```

**Method:** POST  
**Headers:**
- `Content-Type: application/json`
- `x-tenant-slug: <tenant-slug>`
- `X-Widget-Key: <widget-key>`

**Body:**
```json
{
  "question": "...",
  "session_id": "..."
}
```

---

## Admin UI Configuration

**Admin UI uses:**
- Environment variable: `NEXT_PUBLIC_ASK_BASE`
- Endpoint: `${NEXT_PUBLIC_ASK_BASE}/ask`
- Same endpoint: `/ask`

---

## Verification Needed

### 1. Confirm Endpoint Exists

**Runtime API should have:**
- `POST /ask` endpoint
- Accepts widget key authentication via headers
- Returns CORS headers

**Test with curl:**
```bash
curl -X POST https://ask-abilitix-runtime.onrender.com/ask \
  -H "Content-Type: application/json" \
  -H "x-tenant-slug: abilitix-pilot" \
  -H "X-Widget-Key: wid_..." \
  -d '{"question":"test","session_id":"test-123"}' \
  -v
```

**Expected:** Should return 200 (or 403 if key invalid), NOT 404

---

### 2. Check Widget Key Gate

**Admin API team mentioned:**
- `WIDGET_KEY_GATE_ENABLE=0` might be causing issues
- Endpoint may not be accessible when widget key gate is disabled

**Question for Runtime:**
- Is `WIDGET_KEY_GATE_ENABLE` set to `1` in production?
- Does `/ask` endpoint work when widget key gate is disabled?
- Should we be using a different endpoint for widget requests?

---

### 3. Alternative Endpoints to Check

**Possible Runtime API endpoints:**
1. `/ask` (current - what widget uses)
2. `/widget/ask` (if widget-specific endpoint exists)
3. `/api/ask` (if API is under /api path)
4. `/v1/ask` (if versioned API)

**Action:** Runtime team should confirm which endpoint widgets should use

---

## Current Status

- ✅ Widget code: Using `/ask` endpoint
- ❓ Runtime API: Need to verify endpoint exists and is accessible
- ❓ Widget Key Gate: Need to confirm it's enabled
- ❓ CORS: Need to confirm CORS is configured

---

## Next Steps

1. **Runtime team should verify:**
   - `/ask` endpoint exists and is accessible
   - `WIDGET_KEY_GATE_ENABLE=1` is set in production
   - CORS is configured for `/ask` endpoint

2. **Test reachability:**
   - Use the diagnostic tool Admin API team created
   - `.\test_runtime_api_reachable.ps1`
   - This will confirm if endpoint is reachable

3. **If endpoint is wrong:**
   - Update widget.js to use correct endpoint
   - Deploy updated widget.js

---

## Summary

**Widget is configured to use:** `https://ask-abilitix-runtime.onrender.com/ask`

**Need to confirm:**
- Does this endpoint exist?
- Is widget key gate enabled?
- Is CORS configured?
- Is the endpoint accessible?

Run the reachability test to diagnose the exact issue.


