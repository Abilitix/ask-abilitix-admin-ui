# Abilitix Admin UI - UI Plan

## 📋 Overview
This document outlines the UI architecture strategy and migration plan for the Abilitix Admin UI project.

**Last Updated:** September 18, 2025  
**Current Strategy:** Admin V2 Shell Approach + Dashboard UX Improvements  
**Status:** Implementation Phase - Sign-in UX + Dashboard Welcome  
**Project Type:** Next.js 15.5.2 Admin UI with Magic Link Authentication  
**Deployment:** Vercel (https://app.abilitix.com.au)  

---

## 📅 Recent Activities (September 18, 2025)

### **✅ Sign-in Page UX Improvements**
- **Button text**: Changed from "Email me a sign-in link" to "Sign In"
- **Helper text**: Added "We'll email you a secure link to access your workspace"
- **Placeholder**: Updated to "Enter your registered email address"
- **Signup link**: Changed to "New to AbilitiX? Create your workspace"
- **Error handling**: Enhanced with contextual signup guidance for new users
- **Admin API integration**: Updated to handle structured responses (email_sent, user_not_found, error)

### **✅ Login Redirect Fix**
- **Issue identified**: Users redirected to docs page instead of dashboard after login
- **Root cause**: Default redirect in `/api/public/verify/route.ts` set to `/admin` instead of `/`
- **Fix needed**: Change default redirect from `/admin` to `/` (dashboard page)

### **✅ Dashboard Welcome Message Strategy**
- **Problem**: Pilot users don't know what to do on dashboard
- **Solution**: Comprehensive welcome banner and quick-start checklist
- **Status**: Ready for implementation

#### **Dashboard Welcome Microcopy Kit:**
```
Welcome to Abilitix 👋
This is your pilot workspace. Start by uploading a few docs, then ask a question and approve an answer.

Buttons: Upload documents · Ask your docs · View Inbox
```

#### **Quick-Start Checklist (Collapsible):**
- ✅ Upload a few docs (PDF, DOCX, Markdown)
- ✅ Ask your docs (Try sample questions)
- ✅ Review in Inbox (Approve, edit, or reject answers)
- ✅ Invite a teammate (optional)

#### **Empty States & Nudges:**
- Documents section: "No documents yet" with upload CTA
- Inbox section: "Nothing to review (yet)" with ask CTA
- Ask section: "We couldn't find enough to answer confidently" with rephrase/upload options

#### **Context Callouts:**
- Trust & privacy: "Answers include citations. Data stays in your tenant."
- Human-in-the-loop: "Nothing is 'final' until someone approves it in the Inbox."
- Good to know: "Short, specific questions work best. Use your own terms."

---

## 🎯 Current Problem Statement

### **Root Cause Issues:**
- **Flickering UI** - Shared root layout with global providers causes re-render races
- **Sign-in Loops** - Client-side auth races on public pages cause redirect loops
- **"Demo Mode" Flashes** - TenantContext fetching on public pages causes UI instability
- **Performance Issues** - Unnecessary client-side fetching and re-renders

### **Why Current Architecture is Suboptimal:**
- **TenantProvider at Root** - Global state management causes unnecessary re-renders
- **ConditionalTopNav at Root** - Global layout logic runs everywhere
- **Auth Logic in Root** - Root layout shouldn't handle authentication
- **Mixed Responsibilities** - Root layout handles both static and dynamic logic

---

## 🚀 Admin V2 Shell Strategy

### **Core Approach: "Small Greenfield Inside Same Repo"**

**Don't rewrite the whole app**—stand up a **clean Admin V2 shell** in parallel and migrate page-by-page. Think "small greenfield inside the same repo," not a scorched-earth rebuild.

### **Why This Wins:**
- ✅ **Isolation = Stability** - V2 lives under its own route group/layout, so root providers and marketing pages can't interfere
- ✅ **Low Risk** - V1 stays as fallback; flip a flag to roll back
- ✅ **Faster Iteration** - Polish one screen (Inbox) without unraveling legacy layout/auth
- ✅ **Fixes Root Cause** - Eliminates shared root layout contamination instantly

---

## 🏗️ Admin V2 Architecture

### **Route Structure:**
```
app/
├── admin-v2/                   # V2 Shell - /admin-v2/*
│   ├── layout.tsx              # SSR auth gate + props-only nav
│   ├── page.tsx                # V2 Dashboard
│   ├── inbox/page.tsx          # V2 Inbox
│   ├── docs/page.tsx           # V2 Docs
│   ├── settings/page.tsx       # V2 Settings
│   ├── select-tenant/page.tsx  # Tenant selection handler
│   ├── error.tsx               # Error boundary
│   └── not-found.tsx           # 404 handler
├── admin/                      # V1 (PRESERVED) - /admin/*
│   ├── layout.tsx              # Current layout
│   ├── page.tsx                # Current dashboard
│   └── ...
├── verify/                     # Auth v0.1 - /verify/*
│   ├── page.tsx                # Verify Screen
│   └── workspace-picker/       # Workspace Picker
│       └── page.tsx
├── signin/                     # Auth v0.1 - /signin
│   └── page.tsx                # Email-only
└── signup/                     # Auth v0.1 - /signup
    └── page.tsx                # Company + Email + Name
```

### **Must-Have Constraints:**

#### **1. Route Isolation**
- **Path**: `/admin-v2/*` with its own server layout
- **SSR Auth**: Layout does `auth/me` server-side, redirects on 401
- **No Client Fetch**: No client-side auth calls on first paint
- **Side-by-Side**: No collision with `/admin/*` (V1 preserved)

#### **2. TopNavV2 (Server Component)**
- **Server Component**: No `use client` - server component only
- **No API Calls**: No `/api/auth/me` calls, no context fetching
- **Props Only**: `{ userEmail, userRole, tenantSlug, membershipsCount }`
- **No Big Arrays**: Avoid shipping large `memberships` array to client
- **Interactive Menus**: Tiny client islands for dropdowns
- **Protected Links**: All `<Link>`s have `prefetch={false}`

#### **3. Middleware Scope (Corrected)**
- **Protect Only**: `/admin-v2/*` with cheap cookie check
- **Matcher**: `['/admin-v2/:path*']` (avoid `_next`, `api`, static, auth routes)
- **Headers**: Set `Cache-Control: no-store` and `Vary: Cookie` in middleware
- **Tenant Selection**: Handle `?tenant=` via middleware or `/admin-v2/select-tenant`
- **Verify/Workspace Picker**: Must be outside admin guard (accessible without auth)

#### **4. Multi-Tenant Ready (Deterministic)**
- **Resolution Order**: `?tenant=` (and user is member) → `lastTenant` cookie → single membership → Workspace Picker
- **LastTenant Cookie**: Store in httpOnly cookie, rotate on verify/workspace switch
- **Workspace Picker**: Redirect to `/verify/workspace-picker?returnTo=/admin-v2...` when unresolved
- **No Client Logic**: Don't put selection logic in layout's client code

#### **5. Feature Flag Control**
- **Flag**: `NEXT_PUBLIC_ADMIN_UI=v2` to show new shell
- **Kill-Switch**: `?useV1=1` returns to `/admin` instantly
- **Gradual Rollout**: Canary switch for safe deployment

---

## 🔧 Critical Implementation Details

### **1. Tenant Selection (Fixed)**
**Problem**: Layouts can't read `searchParams` in App Router.

**Solution**: Handle `?tenant=` via:
- **Middleware**: Read `req.nextUrl.searchParams`, validate membership, set `activeTenant` cookie, strip query, redirect
- **Route Handler**: `/admin-v2/select-tenant` sets cookie server-side and redirects back

**V2 Layout**: Just reads `cookies().get('activeTenant')` and passes to `TopNavV2`.

### **2. HTTP Headers (Fixed)**
**Problem**: Can't mutate response headers from page/layout.

**Solution**: 
- Set `Cache-Control: no-store` and `Vary: Cookie` in **middleware** (scoped to `/admin-v2/:path*`)
- Remove "set headers in layout" from implementation

### **3. TopNavV2 Props (Optimized)**
**Props**: `{ userEmail, userRole, tenantSlug, membershipsCount }`
- **Avoid**: Shipping large `memberships` array to client
- **Tenant Switcher**: Opens server action or `/select-tenant` URL
- **All Links**: `prefetch={false}`

### **4. Auth Helper (Hardened)**
- **Treat 401 as unauth**: Returns `null`, never throws
- **Cache Control**: `cache: 'no-store'` for all Admin API calls
- **Admin API Contract**: `/auth/me` must return 401 for unauth (never 200/null)
- **Error Handling**: Graceful degradation on auth failures

### **5. Cookies (Cross-Subdomain)**
- **Session Cookie**: `Domain=.abilitix.com.au`, `Path=/`, `HttpOnly`, `Secure`
- **SameSite**: `None` (because UI/API are different subdomains)
- **LastTenant Cookie**: Store in httpOnly cookie, rotate on verify/workspace switch
- **Cookie Rotation**: Rotate session on verify and workspace switch

### **6. Observability (End-to-End Tracing)**
- **Correlation ID**: Generate `x-corr-id` per request
- **Log Events**: `signin.requested/sent/verified`, `picker.opened/selected`, `session.minted`
- **Forward to Admin API**: Include `x-corr-id` in all Admin API calls
- **Request Tracing**: Track full auth flow from UI to Admin API

---

## ⚠️ Risk Mitigation

### **What to Watch Out For:**

#### **1. Double Maintenance (Temporary)**
- **Risk**: Two navs/headers until cutover
- **Mitigation**: Keep V2 minimal, focus on core functionality

#### **2. Leaking Shared State**
- **Risk**: Import V1 providers into V2
- **Mitigation**: Pass data via props only, no shared state

#### **3. Caching Gotchas**
- **Risk**: Vercel caching redirects or stale auth data
- **Mitigation**: Ensure `cache: 'no-store'` / `revalidate: 0` for SSR auth

#### **4. Cookie Domain Issues**
- **Risk**: Session cookie doesn't cover V2 hostname
- **Mitigation**: Verify same-site and domain settings

---

## 📅 7-Day Rollout Plan (Safe & Fast)

### **Day 1: Foundation**
- **Scaffold** `/admin-v2` layout (SSR auth)
- **Add middleware** (scoped to `/admin-v2/*` only)
- **TopNavV2** (server component, props-only)
- **Add link to V2** behind feature flag

### **Day 2: Tenant Resolution**
- **Implement tenant resolution** logic (deterministic order)
- **LastTenant cookie** handling (httpOnly)
- **Redirect to Workspace Picker** when unresolved
- **Test multi-tenant** scenarios

### **Day 3: Inbox Port**
- **Port Inbox** (read-only first)
- **Server data** with zero client auth fetches
- **Test core functionality**

### **Day 4: Docs/Settings Port**
- **Port Docs/Settings** list views
- **Server actions** for mutations
- **API routes** that forward cookies

### **Day 5: Smoke Tests + Canary**
- **Smoke tests** (internal users)
- **Success criteria**: No flicker, no client auth calls, no random sign-in
- **Performance monitoring**

### **Day 6-7: Gradual Rollout**
- **Gradual exposure** to more users
- **V1 remains at `/admin`** as instant rollback
- **Monitor stability** and performance

---

## ✅ Success Criteria (Green Light to Expand)

### **Performance Targets:**
- ✅ **No flicker** or sign-in flashes on `/admin-v2`
- ✅ **No client auth calls** from nav/providers on first paint
- ✅ **P95 TTFB < 250ms** for the shell
- ✅ **Multi-tenant selection** is deterministic (or explicit via picker)

### **Technical Requirements:**
- ✅ **Server-side rendering** for all initial data
- ✅ **Props-based data flow** - no client fetch races
- ✅ **Isolated state management** - no cross-contamination
- ✅ **Feature flag control** - easy rollback capability

### **User Experience:**
- ✅ **Smooth navigation** between admin pages
- ✅ **Fast page loads** with server-side rendering
- ✅ **Reliable authentication** without loops or flashes
- ✅ **Consistent UI** across all admin screens

---

## 🔄 Migration Strategy

### **Phase 1: Foundation (Days 1-2)**
- **Isolated V2 shell** with SSR auth
- **Multi-tenant support** with server-side resolution
- **Feature flag** for gradual rollout

### **Phase 2: Core Features (Days 3-5)**
- **Inbox functionality** with server actions
- **Docs management** with server-side rendering
- **Core admin workflows** working in V2

### **Phase 3: Rollout (Days 6-7)**
- **Canary testing** with internal users
- **Performance monitoring** and issue resolution
- **Full rollout** with V1 fallback

### **Phase 4: Cleanup (Future)**
- **Remove V1** after V2 is stable
- **Clean up** old code and dependencies
- **Optimize** V2 performance further

---

## 🛠️ Technical Implementation

### **Key Components:**

#### **1. Admin V2 Layout**
```typescript
// app/admin-v2/layout.tsx
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdminV2Layout({ children }) {
  const user = await getAuthUser(); // SSR with cache: 'no-store'
  if (!user) redirect("/signin");
  
  // Read active tenant from cookie (set by middleware or select-tenant)
  const activeTenant = cookies().get('activeTenant')?.value;
  
  return (
    <>
      <TopNavV2 
        userEmail={user.email}
        userRole={user.role}
        tenantSlug={activeTenant || user.tenant_slug}
        membershipsCount={user.memberships?.length || 1}
      />
      <main>{children}</main>
    </>
  );
}
```

#### **2. Middleware (Corrected)**
```typescript
// middleware.ts
export const config = {
  matcher: ['/admin-v2/:path*']  // Only guard V2, avoid _next, api, static
};

export function middleware(req: NextRequest) {
  // Handle ?tenant= selection
  const tenantParam = req.nextUrl.searchParams.get('tenant');
  if (tenantParam) {
    // Validate membership and set cookie
    // Redirect to strip query param
  }
  
  // Cheap cookie check only - NO remote API calls
  const hasSession = !!req.cookies.get('aa_sess')?.value;
  if (!hasSession) {
    return NextResponse.redirect(new URL('/signin', req.url));
  }
  
  // Set no-cache headers for V2
  const response = NextResponse.next();
  response.headers.set('Cache-Control', 'no-store');
  response.headers.set('Vary', 'Cookie');
  return response;
}
```

#### **3. TopNavV2 (Server Component)**
```typescript
// components/TopNavV2.tsx
// NO 'use client' - This is a server component
interface TopNavV2Props {
  userEmail: string;
  userRole: string;
  tenantSlug: string;
  membershipsCount: number;
}

export default function TopNavV2({ userEmail, userRole, tenantSlug, membershipsCount }: TopNavV2Props) {
  // Server component - NO useEffect, NO fetch, NO useTenant()
  // All protected links: prefetch={false}
  // Interactive menus = tiny client islands
  // Tenant switcher only if membershipsCount > 1
  // Opens /admin-v2/select-tenant for selection
}
```

#### **4. Auth Helper (Hardened)**
```typescript
// lib/auth.ts
export async function getAuthUser(reqHeaders?: Headers) {
  const adminApi = process.env.ADMIN_API!;
  const cookieHeader = reqHeaders?.get('cookie') ?? (await import('next/headers')).cookies().toString();

  const r = await fetch(`${adminApi}/auth/me`, {
    method: 'GET',
    headers: { cookie: cookieHeader },
    cache: 'no-store',  // Critical for V2
    redirect: 'manual',
  });

  if (r.status === 200) return r.json();
  if (r.status === 401) return null;  // Treat as unauth, never throw
  return null;  // Graceful degradation
}
```

#### **5. Server Actions**
```typescript
// Server actions for data mutations
export async function approveInboxItem(id: string) {
  // Server-side logic with cache: 'no-store'
}
```

---

## 📊 Monitoring & Metrics

### **Key Metrics to Track:**
- **Page Load Times** - P95 TTFB < 250ms
- **Error Rates** - 401s, 500s, client errors
- **User Experience** - Flicker reports, sign-in issues
- **Performance** - Core Web Vitals, render times

### **Rollback Triggers:**
- **Error rate > 5%** for V2 users
- **P95 TTFB > 500ms** consistently
- **User complaints** about functionality
- **Critical bugs** in core workflows

---

## 🧪 Smoke Checklist (What to Verify)

### **Fresh Incognito → `/admin-v2`**
- ☐ **No flicker** on first paint
- ☐ **No client auth calls** from nav/providers
- ☐ **TTFB < 250ms**

### **Navigation: Inbox/Docs/Settings**
- ☐ **All links** `prefetch={false}`
- ☐ **No 401/302** in Network tab

### **Multi-tenant**
- ☐ **`?tenant=` selects** & persists
- ☐ **Workspace Picker** appears when >1 tenant
- ☐ **"Remember"** functionality works

### **Expired Session**
- ☐ **Clean redirect** to `/signin` (no loops)

### **Kill-switch**
- ☐ **`?useV1=1`** returns to `/admin` instantly

### **Success Criteria**
- ☐ **No flicker** or sign-in flashes
- ☐ **No client `/api/auth/me`** on first paint
- ☐ **No random sign-in** redirects

---

## 🔐 Auth v0.1 UI Components Integration

### **Verify Screen (New)**
- **Primary**: "Open your email" message (mobile-friendly)
- **Secondary**: 6-digit code input (paste-friendly, auto-advance)
- **Resend**: 20s then 60s cooldown
- **Edit email** and **Troubleshooting** accordion
- **Route**: `/verify`

### **Workspace Picker (New)**
- **Card list**: Company Name, slug, role badge
- **"Remember this workspace"**: Checkbox to set `last_tenant_id`
- **Selection**: Clicking a card mints session for that tenant
- **Redirect**: Goes to `/admin-v2` after selection
- **Route**: `/verify/workspace-picker`

### **Updated Auth Flow**
- **Signup**: Company + Email → Verify Screen
- **Signin**: Email → Verify Screen (already email-only)
- **Verify Logic**: Check memberships count
- **Auto-enter**: Single membership
- **Show picker**: Multiple memberships

### **Feature Flags for Auth v0.1**
- `NEXT_PUBLIC_ENABLE_WORKSPACE_PICKER=0/1`
- `NEXT_PUBLIC_ENABLE_VERIFY_CODE=0/1`

---

## 🎯 Next Steps

### **Immediate Actions:**
1. **Create scaffold** for Admin V2 shell
2. **Set up feature flag** infrastructure
3. **Begin Day 1** implementation
4. **Prepare monitoring** for canary rollout

### **Success Metrics:**
- **Week 1**: V2 shell stable with core features + Auth v0.1 UI
- **Week 2**: Canary rollout successful
- **Week 3**: Full migration complete
- **Week 4**: V1 cleanup and optimization

### **Rollout Strategy (Safe & Fast):**
- **V1 remains at `/admin`** for 1-2 weeks during V2 rollout
- **Kill-switch**: `?useV1=1` returns to `/admin` instantly
- **Feature flag**: `NEXT_PUBLIC_ADMIN_UI=v2` controls V2 access
- **No breaking changes** to V1 during V2 development
- **Side-by-side deployment**: V2 at `/admin-v2`, V1 at `/admin`
- **Instant rollback**: Flip flag or use kill-switch

---

## 📞 Contact Information

**Developer:** AI Assistant  
**Project:** Abilitix Admin UI  
**Repository:** ask-abilitix-admin-ui  
**Last Updated:** September 18, 2025

---

*This document should be updated as the Admin V2 migration progresses and new insights are gained.*
