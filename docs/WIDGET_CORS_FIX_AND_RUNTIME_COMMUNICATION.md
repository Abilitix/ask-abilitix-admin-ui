# Widget CORS Fix & Runtime API Communication

## Problem
Widget is blocked by CORS when calling Runtime API directly:
```
Access to fetch at 'https://ask-abilitix-runtime.onrender.com/ask' 
from origin 'null' has been blocked by CORS policy: 
Response to preflight request doesn't pass access control check: 
No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

## Solution 1: Proxy Endpoint (Implemented - Immediate Fix)

**Status:** ✅ Implemented and ready to deploy

**What was done:**
- Created `/api/widget/ask` proxy endpoint in Admin UI
- Widget now calls Admin UI proxy instead of Runtime API directly
- Proxy forwards requests to Runtime API with widget key authentication
- Proxy includes proper CORS headers

**Benefits:**
- ✅ Solves CORS issue immediately
- ✅ Widget keys stay server-side (more secure)
- ✅ Centralized authentication and validation
- ✅ Can add rate limiting, analytics, logging later
- ✅ Works for all widget embedding scenarios

**How it works:**
1. Widget calls: `POST /api/widget/ask` (same origin, no CORS)
2. Admin UI proxy validates widget key
3. Proxy forwards to Runtime API: `POST https://ask-abilitix-runtime.onrender.com/ask`
4. Proxy returns response with CORS headers

**Files changed:**
- `src/app/api/widget/ask/route.ts` (new)
- `public/widget.js` (updated to use proxy endpoint)

---

## Solution 2: Fix CORS on Runtime API (Proper Long-term Fix)

**Status:** ⏳ Requires Runtime API team implementation

**What Runtime API needs to do:**
Add CORS headers to the `/ask` endpoint to allow widget requests from:
- `https://app.abilitix.com.au` (production)
- `https://ask-abilitix-admin-ui-git-preview-*.vercel.app` (preview)
- Any customer websites embedding the widget (or configure allowed origins)

### Required CORS Headers

**For OPTIONS (preflight):**
```
Access-Control-Allow-Origin: * (or specific origins)
Access-Control-Allow-Methods: POST, OPTIONS
Access-Control-Allow-Headers: Content-Type, x-tenant-slug, X-Widget-Key
Access-Control-Max-Age: 86400
```

**For POST requests:**
```
Access-Control-Allow-Origin: * (or specific origins)
Access-Control-Allow-Methods: POST, OPTIONS
Access-Control-Allow-Headers: Content-Type, x-tenant-slug, X-Widget-Key
```

### Runtime API Endpoint Details

**Endpoint:** `POST https://ask-abilitix-runtime.onrender.com/ask`

**Headers (widget requests):**
- `x-tenant-slug`: Tenant slug (e.g., "abilitix-pilot")
- `X-Widget-Key`: Widget key (e.g., "wid_...")
- `Content-Type`: application/json

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
  "answer": "Abilitix is...",
  "source": "docs.rag",
  "source_detail": "docs"
}
```

---

## Recommendation

### Immediate Action (Now)
1. ✅ **Deploy proxy endpoint** - Fixes CORS immediately
2. ✅ **Test widget** - Verify it works with proxy

### Long-term Action (Next Sprint)
3. ⏳ **Communicate with Runtime API team** - Request CORS support
4. ⏳ **Once Runtime CORS is fixed** - Option to switch widget back to direct Runtime calls

**Note:** We can keep both solutions - proxy for now, direct Runtime once CORS is fixed. Or keep proxy for additional features (rate limiting, analytics).

---

## Communication to Runtime API Team

### Request: Add CORS Support for Widget Endpoint

**Issue:**
The `/ask` endpoint needs CORS headers to allow cross-origin requests from widget embeds.

**Current behavior:**
- Browser blocks widget requests due to missing CORS headers
- Error: `No 'Access-Control-Allow-Origin' header is present`

**Required changes:**
1. Add CORS middleware to `/ask` endpoint
2. Support preflight OPTIONS requests
3. Include CORS headers in all responses

**Headers needed:**
- `Access-Control-Allow-Origin`: `*` or configured list of allowed origins
- `Access-Control-Allow-Methods`: `POST, OPTIONS`
- `Access-Control-Allow-Headers`: `Content-Type, x-tenant-slug, X-Widget-Key`
- `Access-Control-Max-Age`: `86400` (for preflight caching)

**Widget authentication:**
- Widget sends `X-Widget-Key` header (already supported)
- Widget sends `x-tenant-slug` header (already supported)
- Runtime validates widget key (already implemented)

**Alternative (if full CORS not possible):**
- Support wildcard subdomain: `*.abilitix.com.au`
- Or configure specific allowed origins list

---

## Testing After Runtime CORS Fix

Once Runtime API adds CORS support:

1. Update `widget.js` to call Runtime directly:
   ```javascript
   const API_BASE = 'https://ask-abilitix-runtime.onrender.com';
   // Change back from proxy endpoint
   const response = await fetch(`${API_BASE}/ask`, { ... });
   ```

2. Test widget on:
   - Local file (origin: `null`)
   - Customer website (origin: customer domain)
   - Admin UI (origin: `app.abilitix.com.au`)

3. Verify CORS headers in browser network tab

---

## Current Workaround Status

✅ **Proxy endpoint is ready to deploy** - Solves CORS immediately
✅ **Widget updated to use proxy** - No code changes needed after deployment
✅ **All CORS headers configured** - Works from any origin

**Next step:** Deploy proxy endpoint to preview and production.


