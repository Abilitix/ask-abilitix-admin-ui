# PR-CTX-03: Context Management UI - Implementation Reference

**Date:** December 2025  
**Status:** Ready for Implementation  
**Backend Status:** ✅ Complete (PR-CTX-01, PR-CTX-02)

---

## Executive Summary

This document serves as the **single source of truth** for implementing Context Management UI in the Admin UI. All decisions, API details, and implementation patterns are documented here based on Admin API review and current codebase patterns.

---

## 1. Backend Implementation Status

### ✅ Confirmed Backend Endpoints

| Endpoint | Method | Purpose | Status |
|----------|--------|---------|--------|
| `GET /admin/tenants/{tid}/settings` | GET | Returns all settings (including `ctx` if present) | ✅ Working |
| `PUT /admin/tenants/{tid}/settings` | PUT | Full replacement (existing, **doesn't support `ctx`**) | ⚠️ Don't use for ctx |
| `PATCH /admin/tenants/{tid}/settings` | PATCH | Partial update (PR-CTX-01, **supports `ctx` validation**) | ✅ Use this |

**Admin API Confirmation:**
- ✅ PATCH endpoint confirmed working (lines 5422-5514 in Admin API)
- ✅ Supports partial updates (can send only sections to update)
- ✅ Backend merges with existing settings
- ✅ Cross-tenant protection validated (tenant_id from session matches URL parameter)
- ✅ Audit logging: `tenant_settings.update` with flattened keys

### ✅ Context Data Model

**Storage:**
- Stored in `tenant_settings` table as JSONB
- Key: `'ctx'`
- Value: `{ enable, profile, glossary, policy, routing }`

**Validation:**
- Backend validates via `validate_ctx()` function
- Error format: `{"error": "invalid_ctx.profile.value_prop_too_long"}` (nested in `detail`)
- Nested error structure: `invalid_ctx.{section}.{field}_{reason}`

**Response Format:**
- Success: `{"ok": true, "updated": N, "settings": {...}}` (full settings object returned)
- Error: `{"error": "invalid_ctx.profile.value_prop_too_long"}` (in `detail` object)

**GET Response Structure:**
```json
{
  "effective": {...},
  "overrides": {
    "ctx": {...}  // If ctx exists
  },
  "environment_defaults": {...}
}
```
- `ctx` will be in `overrides.ctx` if it exists
- Not in `effective` (ctx is not in `SETTINGS_DEFAULTS`)

**Data Structure:**
```typescript
type ContextSettings = {
  enable: boolean;
  profile: {
    value_prop: string;        // ≤ 200 chars
    offerings: string[];        // ≤ 10 items, each ≤ 80 chars
    industry: string;           // ≤ 100 chars
    tone: string;              // ≤ 200 chars
  };
  glossary: Array<{             // ≤ 50 entries
    term: string;               // ≤ 40 chars
    meaning: string;            // ≤ 160 chars
  }>;
  policy: {
    must: string[];            // ≤ 10 items, ≤ 160 chars each
    never: string[];           // ≤ 10 items, ≤ 160 chars each
  };
  routing: {
    boost_profile_in_about_intent: boolean;
  };
};
```

---

## 2. UI Implementation Decisions

### 2.1 Route Structure

**Decision:** `/admin/settings/context`

**Reasoning:**
- Matches current pattern: `/admin/settings` (no tenant_id in URL)
- Tenant ID extracted from auth session (existing pattern)
- Spec suggestion `/admin/tenants/[tenantId]/settings/context` doesn't match current architecture
- **File location:** `src/app/admin/settings/context/page.tsx`

### 2.2 Settings Page Layout

**Decision:** Add as Card section (for now), design for tab migration

**Reasoning:**
- Current: Single page with Card sections (AI Assistant, Widget, Team)
- Simplest approach: Add Context as another Card section
- Future-proof: Design `ContextSettingsSection` as reusable component
- **Migration path:** Can easily move to tabs later without breaking changes

**Component Structure:**
```
src/components/context/
├── ContextSettingsSection.tsx    # Main component (reusable)
├── ProfileSection.tsx            # Profile form fields
├── GlossarySection.tsx            # Glossary table/editor
├── PolicySection.tsx              # Policy lists
├── RoutingSection.tsx             # Routing toggle
└── PreviewSection.tsx             # Preview panel
```

### 2.3 API Integration

**Settings API Pattern:**
- **Existing route:** `/api/admin/settings` (GET/PUT)
- **New route needed:** `/api/admin/settings` (PATCH) - extend existing route
- **Or:** Create `/api/admin/settings/context` (PATCH) - cleaner separation

**Recommendation:** Extend existing `/api/admin/settings` route to support PATCH

**Implementation:**
```typescript
// src/app/api/admin/settings/route.ts
export async function PATCH(request: NextRequest) {
  // Same auth pattern as GET/PUT
  // Call Admin API: PATCH /admin/tenants/{tenant_id}/settings
  // Body: { ctx: { ... } }
}
```

### 2.4 Preview Endpoint

**Decision:** Create new server-only route `/api/runtime/ctx-preview`

**Why server-only:**
- Prevents `X_DEBUG_KEY` exposure to client
- Handles CORS properly
- Matches Admin API pattern

**Implementation:**
```typescript
// src/app/api/runtime/ctx-preview/route.ts
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tenantSlug = searchParams.get('tenantSlug');
  const query = searchParams.get('q');
  
  const runtimeApiBase = process.env.NEXT_PUBLIC_ASK_BASE || process.env.RUNTIME_API_BASE;
  const debugKey = process.env.X_DEBUG_KEY; // Server-only
  
  const response = await fetch(`${runtimeApiBase}/debug/ctx?q=${query}`, {
    method: 'GET',
    headers: {
      'X-Tenant-Slug': tenantSlug,
      'X-Debug-Key': debugKey,
      'Content-Type': 'application/json',
    },
  });
  
  return NextResponse.json(await response.json());
}
```

---

## 3. Environment Variables

### Required Variables

| Variable | Type | Purpose | Current Status |
|----------|------|---------|----------------|
| `NEXT_PUBLIC_ASK_BASE` | Public | Runtime API base URL | ✅ Exists |
| `RUNTIME_API_BASE` | Server-only | Alternative runtime URL (if needed) | ❓ Optional |
| `X_DEBUG_KEY` | Server-only | Debug key for runtime preview | ✅ Exists (from env docs) |

**Notes:**
- `X_DEBUG_KEY` is **server-only** (never `NEXT_PUBLIC_*`)
- Use `NEXT_PUBLIC_ASK_BASE` if available, fallback to `RUNTIME_API_BASE`
- Debug key header: `X-Debug-Key` (matches Admin API pattern)

---

## 4. Tenant Context

### Getting Tenant Information

**Pattern:** Use `/api/auth/me` response

**Response structure:**
```typescript
type AuthMeResponse = {
  id: string;
  email: string;
  role: string;
  tenant_id: string;
  tenant_slug: string;  // ← Use this for preview
  tenant_name?: string;
};
```

**Usage:**
```typescript
// In component
const authResponse = await fetch('/api/auth/me');
const { tenant_slug } = await authResponse.json();

// For preview API
const previewUrl = `/api/runtime/ctx-preview?tenantSlug=${tenant_slug}&q=${query}`;
```

---

## 5. Error Handling

### Error Code Mapping

**Backend error format:**
```json
{
  "error": "invalid_ctx.profile.value_prop_too_long"
}
```

**Error structure pattern:**
- `invalid_ctx.{section}.{field}_{reason}`
- Examples:
  - `invalid_ctx.profile.value_prop_too_long`
  - `invalid_ctx.glossary.term_too_long`
  - `invalid_ctx.policy.must_too_many_items`

**Implementation:**
```typescript
function getContextErrorMessage(errorCode: string): string {
  const errorMap: Record<string, string> = {
    'invalid_ctx.profile.value_prop_too_long': 'Value proposition must be 200 characters or less',
    'invalid_ctx.profile.offerings_too_many': 'Maximum 10 offerings allowed',
    'invalid_ctx.profile.offerings_item_too_long': 'Each offering must be 80 characters or less',
    'invalid_ctx.profile.industry_too_long': 'Industry must be 100 characters or less',
    'invalid_ctx.profile.tone_too_long': 'Tone must be 200 characters or less',
    'invalid_ctx.glossary_too_many': 'Maximum 50 glossary entries allowed',
    'invalid_ctx.glossary.term_too_long': 'Term must be 40 characters or less',
    'invalid_ctx.glossary.meaning_too_long': 'Meaning must be 160 characters or less',
    'invalid_ctx.policy.must_too_many': 'Maximum 10 "must" rules allowed',
    'invalid_ctx.policy.must_item_too_long': 'Each "must" rule must be 160 characters or less',
    'invalid_ctx.policy.never_too_many': 'Maximum 10 "never" rules allowed',
    'invalid_ctx.policy.never_item_too_long': 'Each "never" rule must be 160 characters or less',
  };
  
  return errorMap[errorCode] || `Validation error: ${errorCode}`;
}
```

---

## 6. UI Component Design

### 6.1 Component Hierarchy

```
ContextSettingsPage (page.tsx)
└── ContextSettingsSection (reusable component)
    ├── EnableToggle
    ├── ProfileSection
    ├── GlossarySection
    ├── PolicySection
    ├── RoutingSection
    └── PreviewSection
```

### 6.2 Form State Management

**Default state:**
```typescript
const defaultCtx: ContextSettings = {
  enable: false,
  profile: {
    value_prop: '',
    offerings: [],
    industry: '',
    tone: 'Concise, cited, no hype',
  },
  glossary: [],
  policy: {
    must: [],
    never: [],
  },
  routing: {
    boost_profile_in_about_intent: false,
  },
};
```

**State management:**
- Use React state for form fields
- Track "dirty" state to enable/disable Save button
- Client-side validation (mirror backend constraints)
- Server-side validation (source of truth)

### 6.3 Character Limits & Validation

**Client-side validation (UX):**
- Show character counters
- Disable Save if over limits
- Show inline errors

**Server-side validation (source of truth):**
- Always handle 400 errors gracefully
- Map error codes to user-friendly messages
- Show error banner/toast

---

## 7. Preview Functionality

### 7.1 Preview API Flow

```
User clicks "Preview"
  ↓
Frontend: GET /api/runtime/ctx-preview?tenantSlug=...&q=...
  ↓
Server route: Validates auth, gets X_DEBUG_KEY
  ↓
Runtime API: GET /debug/ctx?q=...
  Headers: X-Tenant-Slug, X-Debug-Key
  ↓
Response: { bundle, flags, settings }
  ↓
Frontend: Display preview
```

### 7.2 Preview Response Structure

```typescript
type PreviewResponse = {
  bundle: {
    text: string;              // Formatted context bundle
    meta: {
      tokens: number;
      intents: string[];        // e.g., ["brand", "glossary"]
      applied: boolean;
      cache_hit: boolean;
    };
  };
  flags: {
    CTX_ENABLE: boolean;        // Runtime-level flag
    CTX_TOKEN_BUDGET: number;
  };
  settings: {
    ctx: ContextSettings;      // Current ctx settings
  };
};
```

### 7.3 Preview UI

**Sample queries:**
- "About us"
- "What is RAG?"
- "Privacy policy"
- Custom text input

**Display:**
- Token count: `142 tokens`
- Intents: `["brand", "glossary"]`
- Applied: `true/false`
- Bundle text: Monospaced, scrollable, read-only
- Banner if `CTX_ENABLE=false`: "Runtime context is disabled at the platform level..."

---

## 8. Implementation Checklist

### Phase 1: API Routes
- [ ] Extend `/api/admin/settings` to support PATCH
- [ ] Create `/api/runtime/ctx-preview` server route
- [ ] Add error handling for context-specific errors

### Phase 2: Core Components
- [ ] Create `ContextSettingsSection` component
- [ ] Implement `ProfileSection` with validation
- [ ] Implement `GlossarySection` (table editor)
- [ ] Implement `PolicySection` (list editor)
- [ ] Implement `RoutingSection` (toggle)
- [ ] Implement `PreviewSection` (preview panel)

### Phase 3: Integration
- [ ] Add Context card to Settings page
- [ ] Wire up form state management
- [ ] Implement save functionality (PATCH)
- [ ] Implement preview functionality
- [ ] Add error code mapping
- [ ] Add loading states

### Phase 4: UX Polish
- [ ] Character counters
- [ ] Inline validation
- [ ] Success/error toasts
- [ ] Dirty state tracking
- [ ] Mobile responsiveness
- [ ] Accessibility (ARIA labels, keyboard nav)

### Phase 5: Testing
- [ ] Test with empty ctx (defaults)
- [ ] Test with existing ctx (loads correctly)
- [ ] Test validation (client + server)
- [ ] Test preview functionality
- [ ] Test error handling
- [ ] Test mobile responsiveness

---

## 9. Security Considerations

### ✅ Confirmed Secure Patterns

1. **Debug Key Protection:**
   - `X_DEBUG_KEY` is server-only (never exposed to client)
   - Preview route is server-side only
   - Matches Admin API pattern

2. **Tenant Isolation:**
   - Tenant ID extracted from auth session
   - Users can only access their own tenant's context
   - No tenant_id in URL (prevents tampering)

3. **Authentication:**
   - All routes require auth (`requireAuth()`)
   - Settings routes check `canAccessSettings` permission
   - Matches existing Settings page pattern

---

## 10. Future Considerations

### Tab Migration Path

**Current:** Card section on Settings page  
**Future:** Tabs (General, Context, Widget, Team)

**Design for migration:**
- Make `ContextSettingsSection` layout-agnostic
- Component should work standalone (Card) and composable (Tab)
- Internal structure should not depend on parent layout

### Vercel-Style UI

**When migrating to Vercel-style:**
- Context settings component is already reusable
- Can be moved to tab layout without changes
- Follows best-in-class SaaS patterns

---

## 11. API Endpoints Summary

### Admin UI Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/admin/settings/context` | GET | Context settings page |
| `/api/admin/settings` | GET | Get all settings (includes ctx) |
| `/api/admin/settings` | PATCH | Update ctx block |
| `/api/runtime/ctx-preview` | GET | Preview context bundle |

### Admin API Endpoints (Backend)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/admin/tenants/{tid}/settings` | GET | Get settings |
| `/admin/tenants/{tid}/settings` | PATCH | Update ctx (partial) |

### Runtime API Endpoints (Backend)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/debug/ctx` | GET | Preview context bundle |

---

## 12. Error Codes Reference

### Complete Error Code List (All 12 Codes - Admin API Verified)

| Error Code | Message | Field |
|------------|---------|-------|
| `invalid_ctx.profile.value_prop_too_long` | Value proposition must be 200 characters or less | `profile.value_prop` |
| `invalid_ctx.profile.offerings_too_many` | Maximum 10 offerings allowed | `profile.offerings` |
| `invalid_ctx.profile.offerings_item_too_long` | Each offering must be 80 characters or less | `profile.offerings[]` |
| `invalid_ctx.profile.industry_too_long` | Industry must be 100 characters or less | `profile.industry` |
| `invalid_ctx.profile.tone_too_long` | Tone must be 200 characters or less | `profile.tone` |
| `invalid_ctx.glossary_too_many` | Maximum 50 glossary entries allowed | `glossary` |
| `invalid_ctx.glossary.term_too_long` | Term must be 40 characters or less | `glossary[].term` |
| `invalid_ctx.glossary.meaning_too_long` | Meaning must be 160 characters or less | `glossary[].meaning` |
| `invalid_ctx.policy.must_too_many` | Maximum 10 "must" rules allowed | `policy.must` |
| `invalid_ctx.policy.must_item_too_long` | Each "must" rule must be 160 characters or less | `policy.must[]` |
| `invalid_ctx.policy.never_too_many` | Maximum 10 "never" rules allowed | `policy.never` |
| `invalid_ctx.policy.never_item_too_long` | Each "never" rule must be 160 characters or less | `policy.never[]` |

**Admin API Confirmation:**
- ✅ All 12 error codes verified in backend implementation
- ✅ Profile: 5 errors (value_prop, offerings, offering, industry, tone)
- ✅ Glossary: 3 errors (too_many, term_too_long, meaning_too_long)
- ✅ Policy: 4 errors (must_too_many, never_too_many, must_item_too_long, never_item_too_long)

---

## 13. Acceptance Criteria

### ✅ Must Have

1. **Loading:**
   - If `ctx` exists in settings, form fields reflect it
   - If `ctx` absent, form shows safe defaults

2. **Saving:**
   - PATCH with `{ "ctx": { ... } }` only
   - Non-ctx settings untouched
   - Invalid data rejected with clear message

3. **Toggle:**
   - `Enable context` flips `ctx.enable` only
   - Runtime behavior depends on global `CTX_ENABLE` flag

4. **Preview:**
   - Shows bundle text for sample query
   - Token count and intents displayed
   - Banner if runtime `CTX_ENABLE=0`

5. **Security:**
   - No runtime debug key in client code
   - Preview route is server-only
   - Tenant isolation enforced

6. **No Regressions:**
   - Other Settings sections work as before
   - Build passes, type checks pass
   - No console errors

---

## 14. Notes & Clarifications

### Confirmed from Admin API Review

1. ✅ **PATCH is correct** (not PUT) - PR-CTX-01 added PATCH specifically for ctx
2. ✅ **Error format** - `{"error": "invalid_ctx.profile.value_prop_too_long"}`
3. ✅ **Debug key** - `X_DEBUG_KEY` (server-only, not `RUNTIME_DEBUG_KEY`)
4. ✅ **Runtime API** - Use `NEXT_PUBLIC_ASK_BASE` or `RUNTIME_API_BASE`
5. ✅ **Tenant slug** - From `/api/auth/me` → `tenant_slug` field
6. ✅ **Route pattern** - `/admin/settings/context` (matches current)

### Open Questions (Resolved)

- ❓ **Route structure** → ✅ `/admin/settings/context`
- ❓ **Layout approach** → ✅ Card section (designed for tab migration)
- ❓ **PATCH vs PUT** → ✅ PATCH (spec is correct)
- ❓ **Env vars** → ✅ `X_DEBUG_KEY` (server-only), `NEXT_PUBLIC_ASK_BASE`
- ❓ **Tenant slug** → ✅ From `/api/auth/me`

---

## 15. Implementation Order

### Recommended Sequence

1. **API Routes First** (Foundation)
   - Extend settings route (PATCH)
   - Create preview route
   - Test API integration

2. **Core Components** (Functionality)
   - Profile section
   - Glossary section
   - Policy section
   - Routing section

3. **Integration** (Connect everything)
   - Form state management
   - Save functionality
   - Preview functionality

4. **UX Polish** (Refinement)
   - Validation
   - Error handling
   - Loading states
   - Mobile responsiveness

---

## 16. Reference Links

- **Backend PR:** PR-CTX-01, PR-CTX-02
- **Spec Document:** PR-CTX-03 specification
- **Current Settings Page:** `src/app/admin/settings/page.tsx`
- **Settings API:** `src/app/api/admin/settings/route.ts`
- **Auth Pattern:** `src/app/api/auth/me/route.ts`

---

**Last Updated:** December 2025  
**Status:** ✅ Ready for Implementation  
**Next Step:** Begin Phase 1 (API Routes)

---

## 17. Admin API Final Confirmation

### ✅ Verified Alignment (December 2025)

**Backend Status:**
- ✅ PATCH endpoint confirmed working (lines 5422-5514 in Admin API)
- ✅ All 12 error codes verified in backend implementation
- ✅ Response format confirmed: `{"ok": true, "updated": N, "settings": {...}}`
- ✅ Error format confirmed: `{"error": "..."}` nested in `detail` object
- ✅ Cross-tenant protection validated (tenant_id from session matches URL parameter)
- ✅ Audit logging confirmed: `tenant_settings.update` with flattened keys

**PATCH Payload Structure:**
```json
{
  "ctx": {
    "profile": {...},    // Partial updates supported
    "glossary": [...],   // Only send sections to update
    "policy": {...},     // Backend merges with existing
    "routing": {...}
  }
}
```
- Can send partial `ctx` (only sections to update)
- Backend merges with existing settings

**GET Response Parsing:**
```json
{
  "effective": {...},
  "overrides": {
    "ctx": {...}  // If ctx exists
  },
  "environment_defaults": {...}
}
```
- `ctx` will be in `overrides.ctx` if it exists
- Not in `effective` (ctx is not in `SETTINGS_DEFAULTS`)

**Error Code Verification:**
- ✅ Profile: 5 errors (value_prop, offerings, offering, industry, tone)
- ✅ Glossary: 3 errors (too_many, term_too_long, meaning_too_long)
- ✅ Policy: 4 errors (must_too_many, never_too_many, must_item_too_long, never_item_too_long)
- ✅ Total: 12 error codes (all verified)

**Security:**
- ✅ Tenant validation: Backend checks `tenant_id` from session matches URL parameter (line 5434)
- ✅ Debug key: Server-only, never exposed to client
- ✅ Preview endpoint: Server-side proxy only

**Ready to Proceed:** ✅ All backend confirmations received, UI implementation can begin.

