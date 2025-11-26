# Runtime API CORS Fix Request

## Issue

The widget is blocked by CORS when calling the Runtime API `/ask` endpoint directly from the browser.

**Error:**
```
Access to fetch at 'https://ask-abilitix-runtime.onrender.com/ask' 
from origin 'null' (or customer website origin) has been blocked by CORS policy: 
Response to preflight request doesn't pass access control check: 
No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

## Status: ✅ FIXED

**Date Fixed:** Runtime team has fixed the CORS issue.

**Problem:** Widget key validation middleware was blocking OPTIONS preflight requests before CORS middleware could handle them.

**Solution Applied:**
1. Widget key validation middleware now skips OPTIONS requests (allows CORS preflight)
2. CORS middleware configured with explicit methods (`POST`, `OPTIONS`), headers, and `max_age=86400`

**Result:** Widget can now call Runtime API directly from any website. CORS headers are properly returned.

## What Needs to be Fixed

### 1. CORS Middleware Configuration

The Runtime API `/ask` endpoint needs to:

1. **Handle OPTIONS preflight requests**
   - Respond to `OPTIONS /ask` with appropriate CORS headers
   - Must respond before authentication middleware

2. **Include CORS headers in all responses**
   - `POST /ask` responses must include CORS headers

3. **CORS middleware placement**
   - CORS middleware must be **before** authentication middleware
   - Order matters: CORS → Auth → Handler

### 2. Required CORS Headers

**For OPTIONS (preflight):**
```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: POST, OPTIONS
Access-Control-Allow-Headers: Content-Type, x-tenant-slug, X-Widget-Key
Access-Control-Max-Age: 86400
```

**For POST requests:**
```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: POST, OPTIONS
Access-Control-Allow-Headers: Content-Type, x-tenant-slug, X-Widget-Key
```

### 3. Expected Request Format

**Endpoint:** `POST https://ask-abilitix-runtime.onrender.com/ask`

**Headers:**
- `Content-Type: application/json`
- `x-tenant-slug: <tenant-slug>` (e.g., "abilitix-pilot")
- `X-Widget-Key: <widget-key>` (e.g., "wid_...")

**Body:**
```json
{
  "question": "tell me about abilitix",
  "session_id": "widget-1234567890-abc123"
}
```

**Response:**
```json
{
  "answer": "...",
  "source": "docs.rag",
  "source_detail": "docs"
}
```

## Verification Steps

1. **Test preflight request:**
   ```bash
   curl -X OPTIONS https://ask-abilitix-runtime.onrender.com/ask \
     -H "Origin: https://app.abilitix.com.au" \
     -H "Access-Control-Request-Method: POST" \
     -H "Access-Control-Request-Headers: Content-Type,x-tenant-slug,X-Widget-Key" \
     -v
   ```
   Expected: `Access-Control-Allow-Origin` header in response

2. **Test actual request:**
   ```bash
   curl -X POST https://ask-abilitix-runtime.onrender.com/ask \
     -H "Origin: https://app.abilitix.com.au" \
     -H "Content-Type: application/json" \
     -H "x-tenant-slug: abilitix-pilot" \
     -H "X-Widget-Key: wid_<test-key>" \
     -d '{"question":"test","session_id":"test-123"}' \
     -v
   ```
   Expected: `Access-Control-Allow-Origin` header in response

## Reference

Per handover docs:
- CORS middleware should allow all origins: `allow_origins=["*"]`
- CORS middleware should be placed before auth middleware
- OPTIONS preflight requests should be handled

Reference: `handover/RUNTIME_API_WIDGET_KEY_VALIDATION.md` (lines 245-263)

## Impact

**Current:**
- Widget cannot call Runtime API directly
- Widget fails with CORS error
- Users see "Sorry, there was an error processing your message"

**After fix:**
- Widget can call Runtime API directly
- Widget works from any website (no CORS errors)
- Widget authentication via `X-Widget-Key` header works as designed

## Priority

**High** - Widget is deployed but non-functional due to CORS blocking API calls.

---

**Summary:** Runtime API `/ask` endpoint needs CORS headers configured. CORS middleware should allow all origins (`*`) and be placed before authentication middleware. Both OPTIONS (preflight) and POST requests must include CORS headers.

