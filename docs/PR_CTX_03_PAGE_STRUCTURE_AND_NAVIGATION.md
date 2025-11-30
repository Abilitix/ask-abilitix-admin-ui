# PR-CTX-03: Context Management Page Structure & Navigation

**Date:** December 2025  
**Status:** Structure Confirmed  
**Goal:** Best-in-class SaaS UI with clear information architecture

---

## Executive Summary

This document defines the **exact structure, location, and navigation** for the Context Management feature, following best-in-class SaaS patterns (Vercel, Stripe, Notion, Linear) while maintaining compatibility with current architecture.

---

## 1. Current Settings Page Structure

### Current Layout (`/admin/settings`)

```
┌─────────────────────────────────────────────────────────┐
│  Settings Page (/admin/settings)                        │
│  ┌───────────────────────────────────────────────────┐  │
│  │ Header: "AI Assistant Settings"                  │  │
│  │ Tenant Badge                                      │  │
│  └───────────────────────────────────────────────────┘  │
│                                                           │
│  ┌───────────────────────────────────────────────────┐  │
│  │ Card 1: AI Assistant Configuration               │  │
│  │ - Answer Quality, Detail Level, etc.            │  │
│  │ - Save Settings button                            │  │
│  └───────────────────────────────────────────────────┘  │
│                                                           │
│  ┌───────────────────────────────────────────────────┐  │
│  │ Card 2: Website Widget Section                    │  │
│  │ - Widget status, API keys, embed snippet          │  │
│  └───────────────────────────────────────────────────┘  │
│                                                           │
│  ┌───────────────────────────────────────────────────┐  │
│  │ Card 3: Current Members                           │  │
│  │ - Team member list                                │  │
│  └───────────────────────────────────────────────────┘  │
│                                                           │
│  ┌───────────────────────────────────────────────────┐  │
│  │ Card 4: User Management                           │  │
│  │ - Invite new users                                │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

**Current Pattern:**
- Single long page with stacked Card sections
- No tabs or sidebar navigation
- All sections visible at once (scrollable)
- Each Card is self-contained with its own save actions

---

## 2. Recommended Structure (Best-in-Class SaaS)

### ✅ Dedicated Page with Navigation Link (Recommended)

**Pattern:** Similar to Vercel, Stripe, Notion - major features get dedicated pages

**Settings Page (`/admin/settings`):**
```
┌─────────────────────────────────────────────────────────┐
│  Settings Page (/admin/settings)                        │
│  ┌───────────────────────────────────────────────────┐  │
│  │ Header: "Settings"                                │  │
│  │ Tenant Badge                                      │  │
│  └───────────────────────────────────────────────────┘  │
│                                                           │
│  ┌───────────────────────────────────────────────────┐  │
│  │ Card 1: AI Assistant Configuration               │  │
│  └───────────────────────────────────────────────────┘  │
│                                                           │
│  ┌───────────────────────────────────────────────────┐  │
│  │ Card 2: Website Widget Section                    │  │
│  └───────────────────────────────────────────────────┘  │
│                                                           │
│  ┌───────────────────────────────────────────────────┐  │
│  │ Card 3: Context Management (Navigation Card)      │  │
│  │ ┌──────────────────────────────────────────────┐ │  │
│  │ │ 🎯 Context Management                        │ │  │
│  │ │                                               │ │  │
│  │ │ Control how Abilitix talks about your        │ │  │
│  │ │ business and interprets your terminology.     │ │  │
│  │ │                                               │ │  │
│  │ │ [Configure Context →]                         │ │  │
│  │ └──────────────────────────────────────────────┘ │  │
│  └───────────────────────────────────────────────────┘  │
│                                                           │
│  ┌───────────────────────────────────────────────────┐  │
│  │ Card 4: Current Members                           │  │
│  └───────────────────────────────────────────────────┘  │
│                                                           │
│  ┌───────────────────────────────────────────────────┐  │
│  │ Card 5: User Management                           │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

**Context Management Page (`/admin/settings/context`):**
```
┌─────────────────────────────────────────────────────────┐
│  Context Management (/admin/settings/context)            │
│  ┌───────────────────────────────────────────────────┐  │
│  │ ← Back to Settings                               │  │
│  │                                                   │  │
│  │ Header: "Context Management"                     │  │
│  │ Subtitle: "Control how Abilitix talks about..."  │  │
│  └───────────────────────────────────────────────────┘  │
│                                                           │
│  ┌───────────────────────────────────────────────────┐  │
│  │ Enable Context Toggle                             │  │
│  └───────────────────────────────────────────────────┘  │
│                                                           │
│  ┌───────────────────────────────────────────────────┐  │
│  │ Profile Section                                   │  │
│  │ - Value proposition                               │  │
│  │ - Offerings                                       │  │
│  │ - Industry                                        │  │
│  │ - Tone                                            │  │
│  └───────────────────────────────────────────────────┘  │
│                                                           │
│  ┌───────────────────────────────────────────────────┐  │
│  │ Glossary Section (up to 50 entries)                │  │
│  │ - Term | Meaning table                            │  │
│  └───────────────────────────────────────────────────┘  │
│                                                           │
│  ┌───────────────────────────────────────────────────┐  │
│  │ Policy Section                                    │  │
│  │ - Must include rules                              │  │
│  │ - Never do rules                                  │  │
│  └───────────────────────────────────────────────────┘  │
│                                                           │
│  ┌───────────────────────────────────────────────────┐  │
│  │ Routing Section                                   │  │
│  │ - Boost profile toggle                            │  │
│  └───────────────────────────────────────────────────┘  │
│                                                           │
│  ┌───────────────────────────────────────────────────┐  │
│  │ Preview Section                                   │  │
│  │ - Sample queries                                  │  │
│  │ - Bundle preview                                  │  │
│  └───────────────────────────────────────────────────┘  │
│                                                           │
│  ┌───────────────────────────────────────────────────┐  │
│  │ [Save Changes] [Discard Changes]                  │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

**Benefits:**
- ✅ **Best-in-class SaaS pattern** (Vercel, Stripe, Notion use dedicated pages for major features)
- ✅ **Settings page stays clean** (no clutter, better UX)
- ✅ **Focused experience** (Context Management gets full page attention)
- ✅ **Scalable** (easy to add more settings pages)
- ✅ **Better mobile UX** (dedicated page is easier to navigate)
- ✅ **Bookmarkable** (users can bookmark `/admin/settings/context`)
- ✅ **SEO-friendly** (separate URL for better organization)
- ✅ **Reusable for Vercel-style UI** (fits perfectly into sidebar navigation)

**Why This Approach:**
- Context Management is a **substantial feature** (Profile, Glossary up to 50 entries, Policy rules, Preview)
- Settings page is already getting long (4 cards + growing)
- Best-in-class SaaS products separate major features into dedicated pages
- Better information architecture and user experience

---

## 4. File Structure

### Recommended File Organization

```
src/
├── app/
│   └── admin/
│       └── settings/
│           ├── page.tsx                    # Main Settings page
│           ├── layout.tsx                  # Settings layout (auth check)
│           └── context/
│               ├── page.tsx                 # Context Management page (NEW)
│               └── layout.tsx              # Optional: Context-specific layout
│
├── components/
│   ├── context/                            # Context Management components
│   │   ├── ContextManagementPage.tsx      # Main page component
│   │   ├── ContextNavigationCard.tsx      # Navigation card for Settings page
│   │   ├── ProfileSection.tsx              # Profile form fields
│   │   ├── GlossarySection.tsx             # Glossary table/editor
│   │   ├── PolicySection.tsx                # Policy lists
│   │   ├── RoutingSection.tsx               # Routing toggle
│   │   ├── PreviewSection.tsx               # Preview panel
│   │   └── types.ts                         # TypeScript types
│   │
│   └── settings/                            # Settings page components
│       └── SettingsNavigationCard.tsx      # Reusable navigation card pattern
│
└── app/
    └── api/
        ├── admin/
        │   └── settings/
        │       └── route.ts                 # Extend with PATCH
        └── runtime/
            └── ctx-preview/
                └── route.ts                 # NEW: Preview endpoint
```

---

## 5. Navigation & Access

### Current Navigation

**Top Navigation:**
- Settings link: `/admin/settings` (visible to Admin/Owner roles)

**Settings Page Access:**
- Route: `/admin/settings`
- Auth: `requireAuth()` in layout
- Permission: `canAccessSettings` (Admin/Owner only)
- Layout: `src/app/admin/settings/layout.tsx`

### Context Management Access

**✅ Dedicated Page (Recommended - Best-in-Class)**
- **Route:** `/admin/settings/context`
- **Access:** Navigation card in Settings page → Click "Configure Context"
- **Auth:** Inherits from Settings layout (same permission check)
- **Benefits:**
  - ✅ Settings page stays clean and uncluttered
  - ✅ Focused experience for Context Management
  - ✅ Bookmarkable URL
  - ✅ Better mobile navigation
  - ✅ Follows Vercel/Stripe/Notion pattern
  - ✅ Scalable (easy to add more settings pages)

**Navigation Flow:**
1. User goes to `/admin/settings`
2. Sees "Context Management" navigation card
3. Clicks "Configure Context →"
4. Navigates to `/admin/settings/context`
5. Can use "← Back to Settings" to return

---

## 6. Component Integration

### How Context Management is Accessed

**Settings Page (`src/app/admin/settings/page.tsx`):**

```tsx
import { ContextNavigationCard } from '@/components/context/ContextNavigationCard';
import Link from 'next/link';

export default function SettingsPage() {
  // ... existing code ...
  
  return (
    <div className="p-3 sm:p-4 md:p-6 max-w-4xl">
      {/* Header */}
      <div>...</div>
      
      {/* AI Assistant Configuration Card */}
      <Card className="mb-8">...</Card>
      
      {/* Website Widget Section */}
      <WidgetSettingsSection />
      
      {/* NEW: Context Management Navigation Card */}
      <ContextNavigationCard />
      
      {/* Current Members Card */}
      <Card>...</Card>
      
      {/* User Management Card */}
      <Card>...</Card>
    </div>
  );
}
```

**Navigation Card Component:**

```tsx
// src/components/context/ContextNavigationCard.tsx
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, Sparkles } from 'lucide-react';

export function ContextNavigationCard() {
  return (
    <Card className="mb-8 hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-100 rounded-lg">
            <Sparkles className="h-5 w-5 text-indigo-600" />
          </div>
          <div className="flex-1">
            <CardTitle>Context Management</CardTitle>
            <CardDescription className="mt-1">
              Control how Abilitix talks about your business and interprets your terminology.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Link
          href="/admin/settings/context"
          className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-medium"
        >
          Configure Context
          <ArrowRight className="h-4 w-4" />
        </Link>
      </CardContent>
    </Card>
  );
}
```

**Context Management Page (`src/app/admin/settings/context/page.tsx`):**

```tsx
import { ContextManagementPage } from '@/components/context/ContextManagementPage';
import { requireAuth } from '@/lib/auth';

export default async function ContextSettingsPage() {
  const user = await requireAuth();
  return <ContextManagementPage user={user} />;
}
```

**Main Page Component:**

```tsx
// src/components/context/ContextManagementPage.tsx
'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { ProfileSection } from './ProfileSection';
import { GlossarySection } from './GlossarySection';
import { PolicySection } from './PolicySection';
import { RoutingSection } from './RoutingSection';
import { PreviewSection } from './PreviewSection';

export function ContextManagementPage({ user }: { user: any }) {
  // State management
  // Form handling
  // API calls
  
  return (
    <div className="p-3 sm:p-4 md:p-6 max-w-6xl">
      {/* Back Navigation */}
      <Link
        href="/admin/settings"
        className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Settings
      </Link>
      
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold">Context Management</h1>
        <p className="text-sm text-gray-600 mt-2">
          Control how Abilitix talks about your business and interprets your terminology.
        </p>
      </div>
      
      {/* Enable Toggle */}
      <Card className="mb-6">...</Card>
      
      {/* Profile Section */}
      <ProfileSection />
      
      {/* Glossary Section */}
      <GlossarySection />
      
      {/* Policy Section */}
      <PolicySection />
      
      {/* Routing Section */}
      <RoutingSection />
      
      {/* Preview Section */}
      <PreviewSection />
      
      {/* Save Actions */}
      <div className="flex gap-3 mt-8">
        <Button>Save Changes</Button>
        <Button variant="outline">Discard Changes</Button>
      </div>
    </div>
  );
}
```

---

## 7. Best-in-Class SaaS Patterns

### Pattern Comparison

| Feature | Vercel | Stripe | Notion | Our Approach |
|---------|--------|--------|--------|--------------|
| **Settings Layout** | Tabs | Tabs | Sidebar + Tabs | Tabs (Phase 2) |
| **Section Organization** | Grouped by category | Grouped by feature | Nested navigation | Card sections → Tabs |
| **Mobile Navigation** | Dropdown tabs | Bottom sheet | Drawer | Responsive tabs |
| **Save Actions** | Per-section | Per-section | Auto-save | Per-section (Phase 1) |
| **Preview** | Inline preview | Test mode | Live preview | Preview panel |

### Our Implementation

**Phase 1 (Now):**
- ✅ Card sections (matches current)
- ✅ Per-section save buttons
- ✅ Inline preview panel
- ✅ Mobile responsive

**Phase 2 (Future):**
- ✅ Tab navigation (Vercel/Stripe pattern)
- ✅ Grouped sections
- ✅ Better mobile UX
- ✅ Ready for Vercel-style UI

---

## 8. Mobile Responsiveness

### Mobile Layout

**Current Pattern (Card Sections):**
```
Mobile View:
┌─────────────────────┐
│ Settings            │
├─────────────────────┤
│ [Card 1]            │
│ (Full width)        │
├─────────────────────┤
│ [Card 2]            │
│ (Full width)        │
├─────────────────────┤
│ [Context Card]      │
│ (Full width)        │
└─────────────────────┘
```

**Future Pattern (Tabs):**
```
Mobile View:
┌─────────────────────┐
│ Settings            │
├─────────────────────┤
│ [Tabs Dropdown ▼]   │
├─────────────────────┤
│ [Selected Tab]      │
│ Content             │
└─────────────────────┘
```

**Context Section Mobile:**
- Full-width cards
- Stacked form fields
- Touch-friendly inputs (44px min height)
- Collapsible sections (optional)
- Preview panel below (or modal)

---

## 9. Implementation Phases

### Phase 1: Dedicated Page (Current - Best-in-Class)

**Files to Create:**
1. `src/app/admin/settings/context/page.tsx` - Context Management page
2. `src/components/context/ContextManagementPage.tsx` - Main page component
3. `src/components/context/ContextNavigationCard.tsx` - Navigation card for Settings
4. `src/components/context/ProfileSection.tsx` - Profile form fields
5. `src/components/context/GlossarySection.tsx` - Glossary table/editor
6. `src/components/context/PolicySection.tsx` - Policy lists
7. `src/components/context/RoutingSection.tsx` - Routing toggle
8. `src/components/context/PreviewSection.tsx` - Preview panel
9. `src/components/context/types.ts` - TypeScript types

**Files to Modify:**
1. `src/app/admin/settings/page.tsx` - Add `<ContextNavigationCard />`
2. `src/app/api/admin/settings/route.ts` - Add PATCH handler
3. `src/app/api/runtime/ctx-preview/route.ts` - NEW file

**Integration:**
- Add navigation card to Settings page (after Widget section)
- Create dedicated Context Management page
- Add "Back to Settings" navigation
- No breaking changes to existing Settings page

**Benefits:**
- ✅ Settings page stays clean
- ✅ Focused Context Management experience
- ✅ Best-in-class SaaS pattern
- ✅ Scalable and maintainable
- ✅ Mobile-friendly

---

## 10. Navigation Updates

### Current Implementation

**Top Navigation:**
- Settings link: `/admin/settings` (no changes)

**Settings Page:**
- Shows Context Management navigation card
- Card links to `/admin/settings/context`

**Context Management Page:**
- Route: `/admin/settings/context`
- "Back to Settings" link returns to `/admin/settings`
- Inherits auth from Settings layout

**Breadcrumbs (Optional - Future Enhancement):**
```
Settings > Context Management
```

### Future: Sidebar Navigation (Vercel-Style)

When migrating to Vercel-style UI with sidebar:
- Settings becomes sidebar section
- Context Management becomes sidebar item
- Same routes, better navigation structure

---

## 11. Summary

### Structure Confirmed

| Aspect | Decision | Location |
|--------|----------|----------|
| **Main Component** | `ContextManagementPage` | `src/components/context/ContextManagementPage.tsx` |
| **Navigation Card** | `ContextNavigationCard` | `src/components/context/ContextNavigationCard.tsx` |
| **Page Route** | Dedicated page | `src/app/admin/settings/context/page.tsx` |
| **Settings Integration** | Navigation card link | `src/app/admin/settings/page.tsx` |
| **Route** | `/admin/settings/context` | Separate page (best-in-class) |
| **Layout** | Dedicated page layout | Focused, uncluttered |
| **Mobile** | Responsive page | Full-width, touch-friendly |

### Best-in-Class Features

✅ **Component Design:**
- Dedicated page component
- Reusable sub-components (Profile, Glossary, Policy, etc.)
- Clean separation of concerns
- Internal structure is self-contained

✅ **User Experience:**
- Clear information architecture
- Settings page stays clean and uncluttered
- Focused Context Management experience
- Mobile-responsive
- Accessible (ARIA labels, keyboard nav)
- Bookmarkable URL

✅ **Scalability:**
- Easy to add more settings pages
- Each feature gets its own dedicated page
- Settings page becomes a navigation hub
- Ready for Vercel-style sidebar navigation

✅ **Maintainability:**
- Clean component separation
- TypeScript types
- Error handling
- Loading states
- Clear file structure

---

## 12. Next Steps

1. **Create page structure** (`/admin/settings/context`)
2. **Implement ContextManagementPage** (dedicated page)
3. **Create ContextNavigationCard** (for Settings page)
4. **Implement sub-components** (Profile, Glossary, Policy, Routing, Preview)
5. **Add navigation card to Settings page**
6. **Test and polish**
7. **Future: Add to sidebar navigation** (when migrating to Vercel-style UI)

---

**Last Updated:** December 2025  
**Status:** ✅ Structure Confirmed  
**Ready for Implementation:** Yes

