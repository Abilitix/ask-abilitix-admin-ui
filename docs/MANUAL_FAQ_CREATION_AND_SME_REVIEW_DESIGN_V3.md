# Manual FAQ Creation & SME Review Request - Design Document V3

**Date:** 2025-01-20  
**Status:** Design Phase - Revised Strategy  
**Priority:** High  
**Key Insight:** Runtime feedback ≠ Inbox items (avoid inbox clutter)

---

## 🎯 **Revised Strategy: Two Distinct Flows**

### **Critical Distinction:**

**1. Admin-Initiated Review (Structured Workflow):**
- From Admin UI → FAQ Management or Inbox
- **Creates inbox item** (structured review workflow)
- Goes through normal inbox approval process

**2. Runtime User Feedback (Notification Only):**
- From Widget/Runtime → User unhappy with answer
- **Does NOT create inbox item** (avoids clutter)
- **Sends notification to SME** (email + optional dashboard)
- SME can choose to create inbox item if action needed

---

## 📊 **Flow A: Manual FAQ Creation (Unchanged)**

### **Workflow:**
```
1. User clicks "Create FAQ Manually" in Inbox page
   ↓
2. Modal opens with form
   ↓
3. POST /api/admin/inbox/manual
   ↓
4. Creates inbox item (source_type='manual')
   ↓
5. Appears in Inbox for review
```

**Status:** ✅ This flow is correct - creates inbox item

---

## 📊 **Flow B: Admin-Initiated SME Review (Inbox Workflow)**

### **Use Case:** Admin/Curator wants structured review of existing FAQ or inbox item

**Key Point:** This is an **internal admin action**, NOT end-user feedback

**Workflow:**
```
1. Admin views FAQ in FAQ Management OR inbox item
   ↓
2. Clicks "Request SME Review"
   ↓
3. Modal: Select SME(s) + context note (required)
   ↓
4. POST /api/admin/inbox/{id}/request-review
   OR
   POST /api/admin/inbox/create-review-request?qa_pair_id={id}
   ↓
5. Creates/updates inbox item (status='needs_review', assigned_to=[...], reason='...')
   ↓
6. Queues email notification to SME(s) (async worker)
   ↓
7. Item appears in Inbox with "Needs Review" badge
   ↓
8. SME reviews in inbox (structured workflow)
   ↓
9. On approve/reject → assignment auto-clears
```

**Decision:** ✅ Creates/updates inbox item (structured review workflow)

**Note:** This is different from end-user feedback - this is intentional, admin-initiated review.

**Decision:** ✅ Does NOT create inbox item (separate feedback system)

---

## 🔄 **Final Architecture**

### **Two Separate Systems:**

**1. Inbox System (High-Signal, Human-Governed Queue):**
- Manual FAQ creation → Inbox
- Admin-initiated review requests → Inbox
- Auto-generated FAQs → Inbox
- **Purpose:** Structured review/approval workflow
- **Principle:** High-signal only - drafts waiting for approval

**2. Feedback Analytics System (End-User Signals):**
- Runtime user feedback → Analytics table (feedback_events)
- **Purpose:** Track content gaps, identify patterns
- **Future:** Insights dashboard ("Top queries with negative feedback")
- **Optional:** Email notification to admin (notification only, not inbox item)
- **Principle:** Analytics signal, not immediate action item

---

## 🔌 **Revised API Endpoints**

### **1. Manual FAQ Creation (Unchanged)**
```
POST /api/admin/inbox/manual
Body: {
  question: string;
  answer: string;
  citations: PreparedCitation[];
  as_faq: boolean;
  request_sme_review?: boolean;
  assignees?: string[];
}
Response: {
  ok: true;
  inbox_id: string;
}
```
**Creates:** Inbox item ✅

---

### **2. Request SME Review - Admin UI (Existing Item)**
```
POST /api/admin/inbox/{id}/request-review
Body: {
  reason: string;        // Required - context note
  assignees: string[];    // Required - at least one
}
Response: {
  ok: true;
  assigned_to: Array<{ id: string; email: string }>;
}
```
**Creates:** Updates inbox item (adds assignment) ✅

---

### **3. Request SME Review - From Existing FAQ (Admin UI)**
```
POST /api/admin/inbox/create-review-request
Body: {
  qa_pair_id: string;    // Existing FAQ ID
  reason: string;         // Required - context note
  assignees: string[];    // Required - at least one
}
Response: {
  ok: true;
  inbox_id: string;        // New inbox item created
  assigned_to: Array<{ id: string; email: string }>;
}
```
**Creates:** New inbox item linked to existing FAQ ✅

---

### **4. End-User Feedback (Runtime Analytics Signal)**
```
POST /runtime/feedback
Body: {
  question: string;
  provided_answer: string;
  qa_pair_id?: string;         // If answer came from FAQ
  doc_ids?: string[];           // Documents used in RAG response
  user_feedback?: string;       // Optional user comment
  conversation_id?: string;     // Chat session context
  message_id?: string;          // Specific message context
}
Response: {
  ok: true;
  feedback_id: string;
  message: "Feedback recorded";
}
```
**Note:** 
- `tenant_id` is derived from authenticated user session (not in request body)
- Logs to `feedback_events` analytics table (NOT inbox)
- Optional: Email notification to admin (async worker, fire-and-forget)
- Future: Powers insights dashboard
**Creates:** Analytics event (NOT inbox item) ✅

---

## 📊 **Feedback Analytics System Design**

### **New Concept: Feedback Events Table (Analytics, NOT Inbox)**

**Purpose:** Track end-user negative feedback as analytics signals for pattern analysis

**Data Model:**
```typescript
type FeedbackEvent = {
  id: string;
  tenant_id: string;           // Derived from auth session
  question: string;            // User's question
  provided_answer: string;     // Answer that user didn't like
  qa_pair_id?: string;         // Link to FAQ if answer came from FAQ
  doc_ids?: string[];          // Documents used in RAG response
  user_feedback?: string;      // Optional user comment
  conversation_id?: string;     // Chat session context
  message_id?: string;         // Specific message context
  created_at: string;
  // Note: No status, no assignment - pure analytics event
};
```

**Key Features:**
- Pure analytics - no workflow, no assignment
- Tracks patterns: "50 users asked about X and didn't like the answer"
- Future: Powers insights dashboard
- Future: "Top queries with negative feedback" reports
- Admin can manually create FAQ from insights (via manual FAQ creation)

---

## 🎨 **UI Design: Insights Dashboard (Future Phase)**

### **New Page: `/admin/insights` or `/admin/feedback-analytics`**

**Purpose:** Show analytics on end-user feedback (patterns, trends, content gaps)

**Features (Future Phase):**
- "Top Queries with Negative Feedback" report
- Trend analysis (feedback over time)
- Content gap identification
- Filter by date range, FAQ, document
- "Create FAQ" button (links to manual FAQ creation)
- Export data for analysis

**Note:** This is a future phase. For now, feedback is logged but dashboard is not built.

---

## 📧 **Email Notification - End-User Feedback (Optional Future Phase)**

### **Email Template for Feedback Summary (Optional):**

**Subject:** `Abilitix: Negative feedback received (Summary)`

**Body:**
```
Hi [Admin Name],

Summary of recent negative feedback:

[If threshold-based alert:]
- 10 negative feedback events in the last hour
- Top query: "[Question]" (5 negative feedbacks)

[If weekly digest:]
- 47 negative feedback events this week
- Top 5 queries with most negative feedback:
  1. "[Question 1]" (12 feedbacks)
  2. "[Question 2]" (8 feedbacks)
  ...

[View Insights Dashboard] → Opens insights dashboard (when built)
[Create FAQ Manually] → Opens manual FAQ creation

---
This is an automated notification from Abilitix.
You can manage notification preferences in your account settings.
```

**Note:** This is optional and future phase. For Phase 1, feedback is logged but no email notifications are sent.

---

## 🔄 **Admin Workflow - End-User Feedback (Future Phase)**

### **Insights Dashboard Workflow (Future):**
```
1. Admin views Insights Dashboard
   ↓
2. Sees "Top Queries with Negative Feedback" report
   ↓
3. Identifies pattern: "50 users asked about X and didn't like answer"
   ↓
4. Admin clicks "Create FAQ" button
   ↓
5. Opens Manual FAQ Creation modal
   ↓
6. Admin creates FAQ manually (goes to inbox)
   ↓
7. FAQ goes through normal inbox approval workflow
```

**Note:** This is a future phase. For Phase 1, feedback is logged but dashboard is not built.

---

## 📋 **Revised Implementation Checklist**

### **Phase 1: Manual FAQ Creation (2-3 hours)**
- [ ] Create `ManualFAQCreationModal.tsx`
- [ ] Add "Create FAQ" button to inbox page
- [ ] Create `POST /api/admin/inbox/manual` route
- [ ] Add `source_type` field to inbox items
- [ ] Add "Manual Draft" badge
- [ ] Test end-to-end flow

### **Phase 2: Admin-Initiated Review (3-4 hours)**
- [ ] Create `SMEReviewRequestModal.tsx`
- [ ] Add "Request SME Review" button to inbox detail panel
- [ ] Add "Request Review" button to FAQ detail page
- [ ] Create `POST /api/admin/inbox/{id}/request-review` route
- [ ] Create `POST /api/admin/inbox/create-review-request` route (for FAQs)
- [ ] Add assignment fields to inbox schema
- [ ] Add "Needs Review" badge
- [ ] Test assignment flow

### **Phase 3: End-User Feedback Analytics (2-3 hours)**
- [ ] Create `POST /runtime/feedback` route (or `/api/runtime/feedback`)
- [ ] Backend: Derive `tenant_id` from auth session (not request body)
- [ ] Backend: Create `feedback_events` table (analytics, NOT inbox)
- [ ] Backend: Store `conversation_id` and `message_id` for context
- [ ] Backend: Store `doc_ids` used in RAG response
- [ ] Backend: Log feedback event (no inbox item creation)
- [ ] Test feedback logging
- [ ] **Note:** Email notifications and dashboard are future phases

### **Phase 4: Insights Dashboard (Future Phase - Not in Scope)**
- [ ] Create `/admin/insights` page
- [ ] "Top Queries with Negative Feedback" report
- [ ] Trend analysis
- [ ] "Create FAQ" button (links to manual FAQ creation)
- [ ] Export functionality

**Total Effort (Phase 1):** ~7-10 hours  
**Future Phase (Insights Dashboard):** ~8-12 hours (when prioritized)

---

## 🎯 **Key Design Decisions - Revised**

### **1. End-User Feedback = Analytics Signal ✅**
- **Decision:** User feedback from widget does NOT create inbox items
- **Rationale:** Avoids inbox clutter (1,000 users × 5% = 50 items/day would flood inbox)
- **Implementation:** Logs to `feedback_events` analytics table only
- **Future:** Powers insights dashboard for pattern analysis

### **2. Admin Review = Inbox Items ✅**
- **Decision:** Admin-initiated reviews create/update inbox items
- **Rationale:** Structured workflow, intentional review requests
- **Implementation:** Updates or creates inbox items with assignment

### **3. Manual FAQ Creation = Inbox Items ✅**
- **Decision:** Manual FAQs create inbox items
- **Rationale:** High-signal, intentional drafts for review
- **Implementation:** Creates inbox item with `source_type='manual'`

### **4. Two Separate Systems ✅**
- **Decision:** Inbox (high-signal governance) vs Feedback Analytics (signals)
- **Rationale:** Clear separation - inbox for drafts, analytics for patterns
- **Implementation:** Different endpoints, different data models, different purposes

---

## 📊 **Final Strategy Summary**

| Scenario | Creates Inbox Item? | System |
|----------|---------------------|--------|
| Manual FAQ Creation | ✅ Yes | Inbox System |
| Admin requests review (inbox item) | ✅ Yes (updates) | Inbox System |
| Admin requests review (FAQ) | ✅ Yes (creates) | Inbox System |
| Auto-generated FAQs | ✅ Yes | Inbox System |
| End-user feedback (widget) | ❌ No | Analytics System (feedback_events) |

---

## 🚀 **Recommended Approach**

### **Phase 1: Core Features (Priority)**
1. Manual FAQ Creation → Inbox ✅
2. Admin-Initiated Review → Inbox ✅
3. End-User Feedback → Analytics Logging (NOT inbox) ✅

### **Phase 2: Insights & Analytics (Future)**
4. Insights Dashboard (`/admin/insights`)
5. "Top Queries with Negative Feedback" reports
6. Trend analysis
7. Optional: Email notifications (threshold-based or weekly digest)

---

## 📝 **Open Questions**

1. **Feedback Endpoint Location:** Should it be `/runtime/feedback` or `/api/runtime/feedback`?
   - Recommendation: `/api/runtime/feedback` (consistent with other API routes)

2. **Insights Dashboard Priority:** When should we build the insights dashboard?
   - Recommendation: After we have enough feedback data (Phase 2)

3. **Email Notifications:** Should we send email notifications for end-user feedback?
   - Recommendation: Optional, threshold-based (e.g., "10 feedbacks in last hour")
   - Or weekly digest summary

4. **Feedback Retention:** How long should we keep feedback events?
   - Recommendation: 90 days for analytics, then archive

5. **Manual FAQ from Insights:** Should insights dashboard have "Create FAQ" button?
   - Recommendation: Yes, links to manual FAQ creation modal

---

**Last Updated:** 2025-01-20  
**Status:** Design Finalized - Corrected Understanding  
**Key Decisions:**
- **Inbox = High-signal, human-governed queue** (manual drafts, AI suggestions, admin review requests) ✅
- **End-user feedback = Pure analytics signal** (logged to feedback_events, NOT inbox) ✅
- Admin-initiated SME review stays as inbox workflow ✅
- End-user "I don't like this" stays as analytics ✅
- `tenant_id` derived from auth session (not request body) ✅
- Include `conversation_id`/`message_id` for context ✅
- Email notifications optional (future phase) ✅

**Philosophy:** Clean separation - inbox for governance, analytics for signals

