# Welcome Page & Dashboard - Combined Proposal (Abilitix-Aligned)

**Date**: 2025-11-28  
**Last Updated**: 2025-12-29 (Production Mode - Living Document)  
**Goal**: Create distinct Welcome page (first-time users) and Dashboard (returning users)  
**Inspiration**: Guru, Linear, Notion, Vercel  
**Approach**: Genuine and unique, focused on Abilitix's real moat (citations, Inbox, FAQ Machine, context)  
**Status**: Production-ready implementation in progress

---

## Key Principles (Updated)

1. **Focus on Abilitix's Real Differentiation**:
   - Citations-only answers ("receipts, not vibes")
   - Inbox-gated trust (everything new passes through review)
   - FAQ Machine + Redis for very fast, governed answers
   - Tenant-aware context bundles (brand/profile/tone)

2. **Governance Metrics First**: Metrics should tell the governance story, not just usage
3. **Lean v1**: Keep Welcome page simple, no complex APIs initially
4. **PR-Sized Chunks**: Break into small, shippable PRs
5. **Reuse Existing Data**: Leverage existing metrics/events, don't create new systems

---

## Summary of Changes (Based on Feedback)

### ✅ What Stayed (Strong Direction)
- Two separate surfaces (Welcome + Dashboard)
- Core flows (Upload → Generate FAQs → Approve)
- Welcome hero with demo video
- 3-step Quick Start
- Dashboard quick actions bar
- Feature cards
- Recommendations section

### 🔄 What Changed (Aligned with Abilitix)
1. **Quick Start Steps Renamed**:
   - Old: "Upload / Ask / Review"
   - New: "Upload & Connect Sources / Generate & Review FAQs / Approve & Go Live"
   - Now emphasizes FAQ Machine and governance workflow

2. **Metrics Focus Shifted**:
   - Old: Generic usage metrics (Total FAQs, Messages, etc.)
   - New: Governance metrics first (Cited answers %, FAQ hit-rate, Inbox health, Runtime p95)
   - Usage metrics moved to secondary row

3. **API Surface Reduced**:
   - Old: Multiple endpoints (onboarding status, activity feed, recommendations)
   - New: Single `GET /admin/dashboard/summary` endpoint
   - Onboarding state inferred from usage (no new API needed in v1)

4. **Welcome Page Simplified**:
   - Old: Complex step-by-step tracking with APIs
   - New: Visual completion cues derived from dashboard summary
   - No "mark as complete" walls in v1

5. **Personalization via Context**:
   - Leverage existing tenant profile (TCMP) for copy
   - "Welcome back, {company_name}"
   - Tone-aware messaging
   - No extra backend needed

### 📋 Implementation Plan (PR-Sized)
- **Phase 1**: 4 PRs for dashboard quick wins (~7-10 hours)
- **Phase 2**: 1 PR for welcome page v1 (~6-8 hours)
- **Phase 3**: 2 PRs for activity feed + recommendations (~5-7 hours)

**Total**: ~18-25 hours, broken into 7 shippable PRs

---

## Executive Summary

### Two Distinct Pages

1. **Welcome Page** (`/welcome` or `/onboarding`)
   - **Target**: First-time users, new team members
   - **Purpose**: Onboarding, product introduction, demo video
   - **When shown**: First login, or via "Take Tour" button

2. **Dashboard** (`/`)
   - **Target**: Returning users
   - **Purpose**: Quick access, metrics, activity, productivity
   - **When shown**: Default landing page after login

### Key Differentiators from Guru
- **AI-First**: Emphasize AI capabilities and intelligent responses
- **Action-Oriented**: Focus on "what can I do now" vs. just information
- **Workflow-Centric**: Guide users through actual workflows (upload → ask → review)
- **Metrics-Driven**: Show value through data (FAQs generated, time saved, etc.)

---

## Part 1: Welcome Page Design

### Page Structure

```
┌─────────────────────────────────────────────────────────┐
│                    WELCOME PAGE                          │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Hero Section: Welcome Message + Demo Video       │  │
│  └──────────────────────────────────────────────────┘  │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Quick Start Guide (3 Steps)                      │  │
│  └──────────────────────────────────────────────────┘  │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Key Features Overview                            │  │
│  └──────────────────────────────────────────────────┘  │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Helpful Resources (Sidebar or Bottom)           │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

---

### Section 1: Hero Section with Demo Video

**Layout**: Split screen (50/50 or 60/40)

**Left Side (Content)**:
```
┌─────────────────────────────┐
│ Welcome to Abilitix! 👋      │
│                              │
│ Your AI-powered knowledge    │
│ management platform          │
│                              │
│ [▶ Watch Demo Video]         │
│ [Get Started →]              │
│                              │
│ Skip tour                    │
└─────────────────────────────┘
```

**Right Side (Video)**:
- Embedded video player
- Thumbnail with play button overlay
- Auto-play on hover (optional)
- Full-screen option
- Video chapters/timestamps

**Video Content** (2-3 minutes):
1. **Introduction** (0:00-0:30)
   - What is Abilitix?
   - Value proposition
   - Use cases

2. **Core Workflow** (0:30-1:30)
   - Upload documents
   - Ask questions
   - Review and approve answers
   - Generate FAQs

3. **Key Features** (1:30-2:30)
   - AI-powered responses
   - Citation support
   - Team collaboration
   - Widget integration

4. **Next Steps** (2:30-3:00)
   - Quick start guide
   - Resources

**Design Elements**:
- Large, friendly headline
- Clear value proposition
- Prominent CTA buttons
- "Skip tour" option (small, subtle)
- Video controls (play, pause, volume, fullscreen)
- Subtitles/captions available

---

### Section 2: Quick Start Guide

**Purpose**: Get users to first value quickly

**3-Step Process**:

```
┌─────────────────────────────────────────────────────┐
│  Get Started in 3 Simple Steps                       │
│                                                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐         │
│  │ Step 1   │  │ Step 2   │  │ Step 3   │         │
│  │ 📄       │  │ 💬       │  │ ✅       │         │
│  │ Upload   │→ │ Ask      │→ │ Review   │         │
│  │ Docs     │  │ Question │  │ Answers │         │
│  │          │  │          │  │          │         │
│  │ [Upload] │  │ [Try It] │  │ [View]   │         │
│  └──────────┘  └──────────┘  └──────────┘         │
└─────────────────────────────────────────────────────┘
```

**Interactive Elements**:
- Progress indicator (checkmarks as steps complete)
- Clickable cards that navigate to relevant pages
- Status tracking (which steps are done)
- "Mark as complete" checkboxes

**Step Details** (Abilitix-Aligned):

**Step 1: Upload & Connect Sources**
- Description: "Upload key PDFs or connect Drive/SharePoint (coming soon)"
- Button: "Go to Docs" → `/admin/docs`
- Completion: `docs_active > 0` (from dashboard summary)
- Success state: "✓ Sources connected"

**Step 2: Generate & Review FAQs** (FAQ Machine)
- Description: "Turn your docs into draft FAQs in 1 click"
- Button: "Go to FAQs" → `/admin/faqs?source=generated`
- Completion: `faq_count > 0` (from dashboard summary)
- Success state: "✓ FAQs generated"

**Step 3: Approve & Go Live**
- Description: "Approve answers in Inbox so users see cited, forwardable replies"
- Button: "Go to Inbox" → `/admin/inbox`
- Completion: `pending_reviews == 0 && faq_count > 0` (from dashboard summary)
- Success state: "✓ Answers approved"

---

### Section 3: Key Features Overview

**Purpose**: Showcase product capabilities

**Layout**: 3-column grid (stacks on mobile)

```
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ 🤖 AI-Powered│  │ 📚 Knowledge │  │ 👥 Team      │
│ Responses    │  │ Base         │  │ Collaboration│
│              │  │              │  │              │
│ Get instant  │  │ Upload and   │  │ Review and   │
│ answers with │  │ manage your  │  │ approve      │
│ citations    │  │ documents    │  │ together     │
│              │  │              │  │              │
│ [Learn More] │  │ [Learn More] │  │ [Learn More] │
└──────────────┘  └──────────────┘  └──────────────┘
```

**Features to Highlight**:
1. **AI-Powered Responses**
   - Intelligent answers with citations
   - Context-aware responses
   - Multi-document search

2. **Knowledge Base Management**
   - Document upload and organization
   - FAQ generation
   - Version control

3. **Team Collaboration**
   - Review workflow
   - Team approvals
   - Activity tracking

4. **Widget Integration** (if applicable)
   - Embed on website
   - Customizable appearance
   - Analytics

---

### Section 4: Helpful Resources

**Purpose**: Provide support and learning materials

**Layout**: Sidebar (desktop) or bottom section (mobile)

**Resources**:
1. **Documentation**
   - Link to help center
   - Getting started guide
   - API documentation

2. **Video Tutorials**
   - Link to video library
   - Feature walkthroughs
   - Best practices

3. **Community**
   - Community forum (if exists)
   - Support contact
   - Feature requests

4. **Quick Links**
   - Keyboard shortcuts
   - Tips & tricks
   - What's new

---

### Welcome Page Implementation

**Route**: `/welcome` or `/onboarding`

**When to Show (v1 - Locked)**:
- **Login routing v1**:
  - If `docs_active == 0 && faq_count == 0` → `/welcome`
  - Else → `/` (dashboard)
- User clicks "Take Tour" from dashboard → `/welcome`

**Future Enhancement (Phase 2+)**:
- `user.onboarding_completed` flag for explicit tracking (optional)
- Admin reset onboarding functionality (optional)

**Components Needed**:
1. `WelcomePageClient.tsx` - Main component
2. `DemoVideoPlayer.tsx` - Video player with controls
3. `QuickStartGuide.tsx` - 3-step guide
4. `FeatureCards.tsx` - Feature overview
5. `HelpfulResources.tsx` - Resources sidebar

**API Requirements (v1)**:
- **Uses only**: `GET /admin/dashboard/summary` (reuses same endpoint as dashboard)
- **Completion logic**: Inferred from `quick_start_flags` in summary response
  - Step 1 complete: `has_docs == true`
  - Step 2 complete: `has_faqs == true`
  - Step 3 complete: `has_approved_items == true`
- **No new onboarding APIs needed in v1**

**Future Enhancements (Phase 2+)**:
- `GET /api/user/onboarding-status` - Explicit onboarding state tracking (optional)
- `POST /api/user/complete-onboarding` - Mark onboarding as done (optional)
- `GET /api/user/quick-start-progress` - Detailed step-by-step progress (optional)

---

## Part 2: Dashboard Design

### Page Structure

```
┌─────────────────────────────────────────────────────────┐
│                    DASHBOARD                             │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Hero: Welcome Back + Key Metrics (6 cards)      │  │
│  └──────────────────────────────────────────────────┘  │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Quick Actions Bar                                │  │
│  └──────────────────────────────────────────────────┘  │
│                                                          │
│  ┌──────────────┐  ┌──────────────────────────────┐  │
│  │              │  │                              │  │
│  │  Activity    │  │  Feature Cards (Enhanced)     │  │
│  │  Feed        │  │                              │  │
│  │              │  │                              │  │
│  └──────────────┘  └──────────────────────────────┘  │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Recommendations / Insights                      │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

---

### Section 1: Hero Section with Metrics

**Layout**: Welcome message + 6 metric cards

**Welcome Message**:
```
Good [morning/afternoon], [Name]! 👋
```

**Metric Cards** (Governance-Focused, 2 rows, 2 columns on desktop):

**First Row (Governance Metrics - Primary)**:
```
┌──────────────┐  ┌──────────────┐
│ 📋 Cited     │  │ ⚡ FAQ Fast   │
│ Answers      │  │ Path          │
│ 72%          │  │ 61%          │
│ last 24h     │  │ from FAQs     │
│ ✅ On target │  │ (Redis)       │
└──────────────┘  └──────────────┘

┌──────────────┐  ┌──────────────┐
│ 📝 Inbox     │  │ ⏱️ Runtime    │
│ to Review    │  │ Health        │
│ 12 items     │  │ p95: 2.3s     │
│ pending      │  │ ✅ Good       │
│ 🔴 Action    │  │               │
│ needed       │  │               │
└──────────────┘  └──────────────┘
```

**Second Row (Usage Metrics - Secondary)**:
```
┌──────────┐  ┌──────────┐
│ 📊 FAQs  │  │ 📄 Docs  │
│   127    │  │   45     │
│ total    │  │ active   │
└──────────┘  └──────────┘
```

**Metric Details** (Abilitix-Aligned):

**Primary Metrics (Governance Story)**:

1. **Cited Answers %**
   - Value: `72% in last 24h`
   - Status: Green if ≥ target (e.g., ≥70%), yellow if close, red if below
   - Link: Analytics page (if exists)
   - Icon: 📋
   - **Why**: Shows governance quality - answers with citations

2. **FAQ Fast-Path Hit Rate**
   - Value: `61% answered from FAQs` (Redis)
   - Status: Green if high (shows FAQ Machine working)
   - Link: `/admin/faqs`
   - Icon: ⚡
   - **Why**: Shows FAQ Machine effectiveness - fast Redis path

3. **Inbox to Review**
   - Count: `12 items pending`
   - Badge: Red if > threshold (e.g., >10), yellow if 1-10
   - Link: `/admin/inbox?status=pending`
   - Icon: 📝
   - **Why**: Shows inbox loop health - items needing attention

4. **Runtime Health (p95 Latency)**
   - Value: `p95: 2.3s` (or warning if > 2.5s)
   - Status: ✅ Good / ⚠️ Degraded / 🔴 Issues
   - Link: System status page (if exists)
   - Icon: ⏱️
   - **Why**: Shows system performance - CEO execution metric

**Secondary Metrics (Usage)**:

5. **Total FAQs**
   - Count: Total FAQs in system
   - Link: `/admin/faqs`
   - Icon: 📊

6. **Active Documents**
   - Count: Active documents
   - Link: `/admin/docs`
   - Icon: 📄

**Design**:
- Card-based layout
- Hover effects
- Clickable cards
- Color-coded by status
- Responsive grid (stacks on mobile)

---

### Section 2: Quick Actions Bar

**Purpose**: Most common actions in one place

**Layout**: Horizontal row (desktop), vertical stack (mobile)

**Actions**:
```
┌─────────────────────────────────────────────────────┐
│ [Generate FAQs] [Review Pending (12)] [Upload Doc]  │
│ [Create FAQ] [View Analytics] [Settings]            │
└─────────────────────────────────────────────────────┘
```

**Action Details**:

1. **Generate FAQs**
   - Icon: ✨
   - Link: `/admin/docs/generate-faqs`
   - Show: If documents available
   - Badge: None

2. **Review Pending**
   - Icon: 📝
   - Link: `/admin/inbox?status=pending`
   - Show: Always
   - Badge: Count of pending items (red if > 0)

3. **Upload Document**
   - Icon: 📤
   - Link: `/admin/docs` (with upload modal)
   - Show: Always
   - Badge: None

4. **Create FAQ Manually**
   - Icon: ➕
   - Link: `/admin/inbox` (with create modal)
   - Show: Always
   - Badge: None

5. **View Analytics** (if available)
   - Icon: 📊
   - Link: Analytics page
   - Show: If analytics enabled
   - Badge: None

6. **Settings**
   - Icon: ⚙️
   - Link: `/admin/settings`
   - Show: Always
   - Badge: None

**Design**:
- Prominent buttons (primary style)
- Count badges where applicable
- Icons for visual clarity
- Full-width on mobile
- Touch-friendly (44px min height)

---

### Section 3: Activity Feed

**Purpose**: Show recent system activity

**Layout**: Left column (desktop), full-width (mobile)

**Content**:
```
┌─────────────────────────────────────┐
│ Recent Activity          [View All] │
├─────────────────────────────────────┤
│ 👤 John approved FAQ "How to..."    │
│    2 hours ago                       │
├─────────────────────────────────────┤
│ 📄 New document uploaded: "Guide"   │
│    5 hours ago                       │
├─────────────────────────────────────┤
│ ✨ FAQ generation completed (12)    │
│    Yesterday                         │
├─────────────────────────────────────┤
│ 👤 Sarah reviewed 3 items            │
│    2 days ago                        │
└─────────────────────────────────────┘
```

**Activity Types**:
- FAQ approvals/rejections
- Document uploads
- FAQ generations
- Reviews completed
- Team member actions
- System notifications

**Design**:
- Timeline-style layout
- Avatar icons
- Relative timestamps
- Clickable items
- "View All" link
- Pagination (load more)

---

### Section 4: Enhanced Feature Cards

**Purpose**: Navigate to main features with context

**Current Cards** (Enhanced):
1. **AI Assistant**
   - Icon: 🤖
   - Badge: "Last used: 2 hours ago"
   - Stats: "5 chats today"
   - Link: `/admin/ai`

2. **Review Answers (Inbox)**
   - Icon: 📝
   - Badge: "12 pending" (red badge)
   - Stats: "3 new since last visit"
   - Link: `/admin/inbox`

3. **Upload Documents**
   - Icon: 📄
   - Badge: "45 active"
   - Stats: "2 uploaded this week"
   - Link: `/admin/docs`

4. **FAQ Management**
   - Icon: 📊
   - Badge: "127 total"
   - Stats: "5 created this week"
   - Link: `/admin/faqs`

5. **Settings**
   - Icon: ⚙️
   - Badge: "Team: 5 members"
   - Stats: "Last updated: Today"
   - Link: `/admin/settings`

**Enhancements**:
- Add icons to each card
- Show count badges
- Add "last accessed" timestamp
- Show quick stats/preview
- Color-code by importance
- Hover effects with more details
- Clickable entire card

**Layout**: 3-column grid (stacks on mobile)

---

### Section 5: Recommendations / Insights

**Purpose**: Guide users to take action

**Content**:
```
┌─────────────────────────────────────────────────────┐
│ 💡 Recommendations                                   │
├─────────────────────────────────────────────────────┤
│ • You have 12 items pending review                  │
│   [Review Now →]                                     │
├─────────────────────────────────────────────────────┤
│ • 3 documents haven't been used in 30 days          │
│   [View Documents →]                                 │
├─────────────────────────────────────────────────────┤
│ • Consider generating FAQs from recent uploads       │
│   [Generate FAQs →]                                  │
└─────────────────────────────────────────────────────┘
```

**Recommendation Types**:
- Pending reviews
- Unused documents
- FAQ generation opportunities
- Missing citations
- Team collaboration suggestions

**Design**:
- Card with actionable recommendations
- Dismissible (X button)
- Priority-based ordering
- Links to relevant pages

---

## Part 3: Implementation Plan (Abilitix-Aligned, PR-Sized)

### Phase 1: Dashboard Quick Wins (This Week)
**Goal**: Make current dashboard feel like a real cockpit without breaking anything

**PR-DASH-01 — Metrics Strip + Greeting + Summary Endpoint (Low/Med Effort)**

**Scope**: Introduce `/admin/dashboard/summary` + governance metrics strip + greeting  
**Explicitly Out of Scope**: Quick actions, feature cards, welcome page, activity feed, recommendations

**Backend (Admin API)**:
- New endpoint: `GET /admin/dashboard/summary`
- Tenant-scoped (uses existing auth + `tenant_id`)
- Returns only what's needed for metrics strip + greeting (see API Requirements section)
- Compose from existing sources (faq_count, pending_reviews, docs_active)
- Wire governance metrics (cited_pct, faq_hit_pct, runtime_p95) or stub with `null` for v1

**Frontend (Admin UI)**:
- Add personalized greeting at top:
  - `"Good morning, John! 👋"` (from `user.name` + local time)
  - Subline: `"Helping Acme Corp deliver cited answers for Technology"` (from `tenant`)
- Add metrics strip with 4-6 cards (governance-first order):
  - Cited answers % (primary)
  - FAQ fast-path % (primary)
  - Inbox to review (primary)
  - Runtime p95 (primary)
  - Total FAQs (secondary)
  - Active docs (secondary)
- Include loading state + graceful fallback (`—` when metric missing)
- Status indicators (good/warn/bad) based on thresholds

**Components to Create**:
- `useDashboardSummary.ts` - Data hook (useSWR)
- `DashboardGreeting.tsx` - Greeting component
- `DashboardMetricsStrip.tsx` - Metrics cards component

**API**: Admin API composes from existing metrics + counts  
**Effort**: 2-3 hours

**PR-DASH-02 — Quick Actions Bar (Low Effort)**
- Horizontal button row above feature cards
- Buttons:
  - "Ask AI" → `/admin/ai`
  - "Review Inbox (N)" → `/admin/inbox?status=pending`
  - "Upload Docs" → `/admin/docs`
  - "Manage FAQs" → `/admin/faqs`
  - "Settings" → `/admin/settings`
- Count badges where applicable (from summary)
- Mobile stacking
- **API**: None (navigation only)
- **Effort**: 1-2 hours

**PR-DASH-03 — Enhanced Feature Cards (Low/Med Effort)**
- Add icons to existing cards
- Add short description
- Add small stat from summary response:
  - AI: "5 chats today"
  - Inbox: "12 items pending"
  - Docs: "45 active docs"
  - FAQs: "127 FAQs live"
- Make full card clickable with hover states
- **API**: Uses dashboard summary
- **Effort**: 2-3 hours

**PR-DASH-04 — Mobile & Layout Polish (Low Effort)**
- Ensure metrics grid, quick actions, cards stack nicely on mobile
- Touch-friendly hit areas (≥44px height)
- Responsive grid layouts
- **API**: None
- **Effort**: 1-2 hours

**Total Phase 1**: ~7-10 hours

**After Phase 1**: Dashboard is demoable and feels like a proper product

---

### Phase 2: Welcome Page v1 (Separate Route, Small New Logic)
**Goal**: Friendly first-run experience that pushes users through high-value loop

**UI Pieces** (all in `WelcomePageClient.tsx`):

1. **Hero + Video**
   - Static CTA → `/admin/docs` ("Start by uploading key documents")
   - "Watch 2-minute overview" (Loom or similar)
   - **No complex video player needed initially**

2. **3-Step Quick Start** (Abilitix-Aligned)
   - Steps:
     1. Upload or connect sources → "Go to Docs"
     2. Generate/curate FAQs → "Go to FAQs"
     3. Approve answers → "Go to Inbox"
   - Completion logic (driven from `dashboard/summary`):
     - If `docs_active > 0` → Step 1 ticked
     - If `faq_count > 0` → Step 2 ticked
     - If `pending_reviews == 0 && faq_count > 0` → Step 3 ticked
   - **No per-step "mark as complete" walls in v1**
   - Visual cues (ticks) derived from summary API

3. **Key Features Overview**
   - 3-4 cards mapped to real Abilitix pillars:
     - Citations-only answers
     - Inbox-gated trust
     - FAQ Machine
     - Multi-tenant context

4. **Helpful Resources**
   - Simple links: "Getting started", "FAQ Machine overview", "Slack integration (coming soon)"
   - **Static initially, no complex resource API**

**Routing / When to Show (v1 - Locked)**:
- **On login**:
  - If `docs_active == 0 && faq_count == 0` → `/welcome`
  - Else → `/` (dashboard)
- "Take tour again" link in dashboard → `/welcome`

**API Needed**: 
- Reuses `GET /admin/dashboard/summary` (no new onboarding APIs in v1)
- Completion logic inferred from summary response

**Future Enhancement (Phase 2+)**:
- `first_login` flag or `user.onboarding_completed` flag for explicit tracking (optional)

**Effort**: 6-8 hours

---

### Phase 3: Smart Dashboard Extras (Activity + Recommendations)
**Goal**: Layer in more "world-class KM" ideas without over-committing

**Activity Feed**:
- Reuse existing `events`/audit logs (approvals, doc uploads, FAQ promotions, etc.)
- Slice last 20 items: `type`, `who`, `what`, `timestamp`, `link`
- "View all" deep-links into Inbox/Docs filtered views
- **API**: Reuse existing audit/events endpoints
- **Effort**: 3-4 hours

**Recommendations / Insights**:
- Start with **simple rules coded in Admin API** (no ML, no agents yet):
  - If `pending_reviews > X` → "You have N items pending review — [Review now]"
  - If `faq_hit_pct < Y%` and `docs_active > 0` → "Consider generating FAQs from recent uploads — [Open FAQ Machine]"
  - If some docs unused for 30 days → "These docs haven't been used recently — [View docs]"
- Later: Powered by Insight Composer / Agent Hub (Phase 3+)
- **API**: Simple rules in dashboard summary response
- **Effort**: 2-3 hours

**Total Phase 3**: ~5-7 hours

---

## API Requirements (Simplified for v1)

### Single Shared Endpoint (v1)

**Dashboard Summary** (`GET /admin/dashboard/summary`)

**Purpose**: One endpoint that drives both dashboard metrics and welcome page quick start logic

**Response (v1 - PR-DASH-01)**:
```json
{
  "metrics": {
    // Governance metrics (primary)
    "cited_pct": 72.5,
    "faq_hit_pct": 61.2,
    "runtime_p95": 2.3,
    "pending_reviews": 12,
    
    // Usage metrics (secondary)
    "faq_count": 127,
    "docs_active": 45
  },
  "user": {
    "name": "John Doe"
  },
  "tenant": {
    "name": "Acme Corp",
    "industry": "Technology",
    "tone": "concise, no hype"
  }
}
```

**Note**: `total_messages`, `quick_start_flags`, and `recommendations` can be added in later PRs (PR-DASH-02/03). Keep v1 minimal.

**Implementation Notes**:
- Admin API composes from existing metrics + counts
- No new database tables needed
- Reuses existing events/audit logs for activity (Phase 3)
- Simple rule-based recommendations (no ML in v1)

### Onboarding State (v1 - Inferred, No New API)

**Approach**: Infer onboarding state from usage data

- **First-time user**: `docs_active == 0 && faq_count == 0`
- **Quick Start completion**: Derived from metrics in dashboard summary
  - Step 1 complete: `docs_active > 0`
  - Step 2 complete: `faq_count > 0`
  - Step 3 complete: `pending_reviews == 0 && faq_count > 0`
- **Routing v1 (Locked)**:
  - If `docs_active == 0 && faq_count == 0` → `/welcome`
  - Else → `/` (dashboard)

**Future Enhancement** (Phase 2+ - Optional):
- Add `user.onboarding_completed` flag if needed
- Add step-by-step progress API if needed
- Add `quick_start_flags` to summary response if needed
- For v1: Keep it simple and inferred

### Activity Feed (Phase 3 - Reuse Existing)

**Approach**: Reuse existing `events`/audit logs

- No new endpoint needed initially
- Slice from existing audit/events table
- Filter by tenant, limit to 20, order by timestamp DESC

**Later Enhancement**:
- Dedicated activity endpoint if performance becomes an issue
- Real-time updates via WebSocket (future)

---

## Design Principles

### Welcome Page
- **Warm & Inviting**: Friendly tone, welcoming visuals
- **Action-Oriented**: Clear CTAs, guided steps
- **Educational**: Teach users how to use the product
- **Non-Intrusive**: Easy to skip, don't force
- **Abilitix-Focused**: Emphasize citations, Inbox, FAQ Machine, context

### Dashboard
- **Governance-First**: Metrics tell the governance story (citations %, FAQ hits, inbox health, latency)
- **Action-Oriented**: Quick access to common tasks
- **Personalized**: Use tenant context (company name, industry, tone) for copy
- **Efficient**: Help users be productive
- **Trust-Building**: Show quality metrics (cited answers, fast FAQ path)

### Both
- **Mobile-First**: Responsive design
- **Accessible**: WCAG 2.1 AA compliance
- **Fast**: Load quickly (< 2 seconds)
- **Consistent**: Match existing design system
- **Context-Aware**: Leverage tenant profile for personalization (no extra backend needed)

---

## Success Metrics

### Welcome Page
- Onboarding completion rate
- Time to first value
- Video engagement (watch time)
- Step completion rates

### Dashboard
- Time spent on dashboard
- Quick action click-through rate
- Feature card usage
- Activity feed engagement
- Return user satisfaction

---

## Next Steps

1. **✅ Review & Approve** - Feedback incorporated, aligned with Abilitix product story
2. **API Planning** - Coordinate with backend team for `GET /admin/dashboard/summary`
3. **Start Phase 1** - Begin with PR-DASH-01 (Metrics Strip + Greeting)
4. **Design Mockups** - Create visual designs for governance metrics
5. **Iterate** - Ship Phase 1, gather feedback, then proceed to Phase 2

---

## PR Checklist (Ready for Implementation)

### PR-DASH-01: Metrics Strip + Greeting
- [ ] Add personalized greeting component (user + tenant context)
- [ ] Create metrics card component
- [ ] Implement 4 primary governance metrics (cited_pct, faq_hit_pct, pending_reviews, runtime_p95)
- [ ] Add 2 secondary usage metrics (faq_count, docs_active)
- [ ] Wire to `GET /admin/dashboard/summary` endpoint
- [ ] Responsive grid layout
- [ ] Mobile optimization

### PR-DASH-02: Quick Actions Bar
- [ ] Create quick actions component
- [ ] Add 5 action buttons with icons
- [ ] Add count badges (from summary)
- [ ] Mobile stacking
- [ ] Touch-friendly targets

### PR-DASH-03: Enhanced Feature Cards
- [ ] Add icons to existing cards
- [ ] Add short descriptions
- [ ] Add stats from summary
- [ ] Improve hover states
- [ ] Make full card clickable

### PR-DASH-04: Mobile & Layout Polish
- [ ] Stack metrics vertically on mobile
- [ ] Full-width quick actions on mobile
- [ ] Responsive feature cards grid
- [ ] Touch targets (≥44px)
- [ ] Test on real devices

### PR-WELCOME-01: Welcome Page v1
- [ ] Create welcome page route (`/welcome`)
- [ ] Hero section with demo video link
- [ ] 3-step Quick Start (Abilitix-aligned)
- [ ] Feature overview cards
- [ ] Helpful resources section
- [ ] Routing logic (when to show)
- [ ] Reuse dashboard summary for completion logic

---

## Notes

- **Welcome page** should be skippable but encouraged
- **Dashboard** should be the default landing page
- Both pages should work seamlessly on mobile
- Consider A/B testing different layouts
- Gather user feedback early and often
- Iterate based on usage data

---

# Implementation Status & Progress Tracking

**Last Updated**: 2025-12-29

## ✅ Completed Features

### Dashboard (PR-DASH-01) - ✅ COMPLETE
- ✅ Personalized greeting (time-of-day + user name + tenant context)
- ✅ Governance metrics strip (4 primary + 2 secondary metrics)
- ✅ Role-based filtering (Viewers see nothing, Curators see 3, Admins/Owners see 4)
- ✅ Visual enhancements (gradient backgrounds, accent bars, hover effects)
- ✅ Mobile responsiveness
- ✅ API proxy route + SWR hook
- ✅ "Coming soon" note for future features
- **Status**: ✅ **Deployed to preview & main**

### Welcome Page (PR-WELCOME-01) - ✅ COMPLETE
- ✅ Welcome page route (`/welcome`)
- ✅ Hero section with logo and personalized greeting
- ✅ 3-step Quick Start Guide (Upload → Generate FAQs → Approve)
- ✅ Step completion tracking (visual checkmarks based on dashboard summary)
- ✅ Competitive differentiators section (Cited Answers, Inbox-Gated Trust, FAQ Machine, Context-Aware)
- ✅ Announcements section (static content, ready for API integration)
- ✅ Quick Actions section (always visible with counts)
- ✅ Helpful Resources section
- ✅ Production-ready left sidebar navigation (Guru/Vercel/Notion style)
- ✅ Mobile-responsive drawer with hamburger menu
- ✅ Top navigation bar with Dashboard link
- ✅ Smooth scroll to anchor sections
- ✅ Prefetch optimization for reduced latency
- **Status**: ✅ **Deployed to preview**

### Left Sidebar Navigation - ✅ COMPLETE
- ✅ Fixed 240px sidebar on desktop (always visible)
- ✅ Mobile drawer with overlay and animations
- ✅ Navigation sections: Dashboard, Welcome, Announcements, Getting Started, Resources
- ✅ Quick Actions: Upload Docs, Generate FAQs, Review Inbox (with badges), AI Assistant
- ✅ Support: Help Center (coming soon), Video Tutorials (coming soon)
- ✅ Settings link at bottom
- ✅ Active state indicators
- ✅ Badge counts for pending items
- ✅ Smooth scroll to anchor sections
- **Status**: ✅ **Deployed to preview**

---

## 🚧 In Progress / Pending

### Announcements System - 🔄 PENDING BACKEND API
**Status**: UI ready, waiting for Admin API endpoints

**What's Needed from Admin API**:
1. **GET /admin/announcements**
   - Purpose: Fetch tenant-scoped announcements
   - Query params: `?limit=20&offset=0`
   - Response:
     ```json
     {
       "announcements": [
         {
           "id": "uuid",
           "title": "string",
           "description": "string",
           "created_at": "ISO8601",
           "created_by": "user_email",
           "unread": true,
           "priority": "high|normal|low"
         }
       ],
       "total": 10,
       "unread_count": 3
     }
     ```
   - Auth: Tenant-scoped (user must be member of tenant)
   - Permissions: All users can read, only admins/owners can create

2. **POST /admin/announcements**
   - Purpose: Create new announcement (admin/owner only)
   - Body:
     ```json
     {
       "title": "string (required, max 200 chars)",
       "description": "string (required, max 2000 chars)",
       "priority": "high|normal|low (default: normal)"
     }
     ```
   - Response: `{ "ok": true, "announcement": {...} }`
   - Auth: Admin/Owner only

3. **PUT /admin/announcements/:id**
   - Purpose: Update announcement (admin/owner only)
   - Body: Same as POST
   - Response: `{ "ok": true, "announcement": {...} }`

4. **DELETE /admin/announcements/:id**
   - Purpose: Delete announcement (admin/owner only)
   - Response: `{ "ok": true }`

5. **POST /admin/announcements/:id/mark-read**
   - Purpose: Mark announcement as read for current user
   - Response: `{ "ok": true }`

**UI Implementation Status**:
- ✅ Announcements section UI complete
- ✅ AnnouncementCard component ready
- ✅ "Coming soon" note added
- ⏳ Waiting for API endpoints to load real data
- ⏳ Settings page UI for creating announcements (future)

**Database Schema Needed** (Admin API):
```sql
CREATE TABLE tenant_announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  priority VARCHAR(20) DEFAULT 'normal',
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE announcement_reads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  announcement_id UUID NOT NULL REFERENCES tenant_announcements(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  read_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(announcement_id, user_id)
);
```

---

## 📋 Future Enhancements (Not Started)

### Phase 3: Smart Dashboard Extras
- ⏳ Activity Feed (3-4 hours)
  - Reuse existing audit logs
  - Last 20 events
  - Timeline-style layout
  - **API**: Reuse existing audit/events endpoints

- ⏳ Recommendations (2-3 hours)
  - Simple rule-based insights
  - "You have N items pending review"
  - "Consider generating FAQs from recent uploads"
  - **API**: Add to dashboard summary response

### Welcome Page Enhancements
- ⏳ Demo video integration
  - Embedded video player
  - 2-3 minute overview
  - Auto-play on hover (optional)

- ⏳ Interactive product tour
  - Step-by-step walkthrough
  - Highlight key features
  - Skip/resume functionality

---

## 🔌 Required Admin API Endpoints

### Currently Used (✅ Available)
1. **GET /admin/dashboard/summary** ✅
   - Status: ✅ Implemented
   - Used by: Dashboard, Welcome Page
   - Returns: Metrics, user info, tenant info

### Needed for Announcements (⏳ Pending)
1. **GET /admin/announcements** ⏳
   - Status: ⏳ Not implemented
   - Priority: High
   - Used by: Welcome Page announcements section
   - See details above

2. **POST /admin/announcements** ⏳
   - Status: ⏳ Not implemented
   - Priority: High
   - Used by: Settings page (future)
   - See details above

3. **PUT /admin/announcements/:id** ⏳
   - Status: ⏳ Not implemented
   - Priority: Medium
   - Used by: Settings page (future)

4. **DELETE /admin/announcements/:id** ⏳
   - Status: ⏳ Not implemented
   - Priority: Medium
   - Used by: Settings page (future)

5. **POST /admin/announcements/:id/mark-read** ⏳
   - Status: ⏳ Not implemented
   - Priority: Medium
   - Used by: Welcome Page (mark as read on click)

### Future Endpoints (📅 Planned)
1. **GET /admin/activity** (Phase 3)
   - Purpose: Activity feed
   - Can reuse existing audit logs initially

2. **GET /admin/recommendations** (Phase 3)
   - Purpose: Smart recommendations
   - Can be simple rules in dashboard summary initially

---

## 🐛 Known Issues & Fixes

### Fixed Issues
1. ✅ Step card alignment - Fixed with flexbox (`flex flex-col` with `mt-auto`)
2. ✅ Help Center links - Changed to "coming soon" (no longer go to documents page)
3. ✅ Getting Started anchor link - Fixed click handler in sidebar
4. ✅ Dashboard link - Added to welcome page top nav and sidebar
5. ✅ Loading latency - Added prefetch optimization
6. ✅ Missing closing div tag - Fixed syntax error in WelcomePageClient

### Current Issues
- None known

---

## 📝 Implementation Notes

### Production Mode Standards
- All features must be production-ready, not MVP
- Best-in-class quality from day one
- Scalable, maintainable architecture
- Complete features, not minimal versions
- Iterative additions, each production-quality

### Code Quality
- ✅ Mobile-responsive by default
- ✅ Proper error handling
- ✅ Loading states
- ✅ Accessibility considered
- ✅ Clean, maintainable code
- ✅ Performance optimized

---

## 🎯 Next Steps

1. **Immediate**: Request Admin API team to implement announcements endpoints
2. **Short-term**: Integrate announcements API when available
3. **Medium-term**: Add Settings page UI for creating announcements (admin/owner only)
4. **Long-term**: Phase 3 features (Activity Feed, Recommendations)

---

**Document Status**: Living document - updated as features are implemented

