# Manual FAQ Creation & SME Review Request - Final Design Document

**Date:** 2025-01-20  
**Status:** Design Finalized - Corrected Understanding  
**Priority:** High  
**Philosophy:** Inbox = High-signal governance | Feedback = Analytics signals

---

## 🎯 **Core Strategy: Two Separate Systems**

### **Critical Distinction:**

**1. Inbox System (High-Signal, Human-Governed Queue):**
- Manual FAQ creation → Inbox
- Admin-initiated review → Inbox
- AI suggestions → Inbox
- **Purpose:** Structured review/approval workflow
- **Rule:** Only high-signal, actionable items

**2. Feedback Analytics System (End-User Signals):**
- Runtime user feedback → Analytics table (NOT inbox)
- **Purpose:** Track content gaps, identify patterns
- **Rule:** Pure analytics signal, no inbox clutter
- **Future:** Insights dashboard, email alerts (optional)

---

## 📊 **Flow A: Manual FAQ Creation**

### **Workflow:**
```
1. Curator clicks "Create FAQ Manually" in Inbox page
   ↓
2. Modal opens with form:
   - Question (required)
   - Answer (required)
   - Citations (required - governance rule)
   - Tags (optional)
   - Toggle: "Request SME Review?" (default: OFF)
   - If ON → Multi-select Assignees
   ↓
3. POST /api/admin/inbox/manual
   Body: {
     question, answer, citations, as_faq: true,
     request_sme_review?: boolean,
     assignees?: string[]
   }
   ↓
4. Creates inbox item:
   - source_type='manual'
   - status='pending' (or 'needs_review' if SME review requested)
   - assigned_to=[...] (if provided)
   ↓
5. If assignees provided → Email notifications (async worker)
   ↓
6. Item appears in Inbox with "Manual Draft" badge
   ↓
7. Same review/approval workflow as auto-generated items
```

**Decision:** ✅ Creates inbox item (structured review workflow)

---

## 📊 **Flow B: Admin-Initiated SME Review**

### **Use Case:** Admin/Curator wants structured review of existing FAQ or inbox item

**Key Point:** This is an **internal admin action**, NOT end-user feedback

### **Variant B1: Review Existing Inbox Item**

**Workflow:**
```
1. Admin views inbox item
   ↓
2. Clicks "Request SME Review"
   ↓
3. Modal: Select SME(s) + context note (required)
   ↓
4. POST /api/admin/inbox/{id}/request-review
   Body: { reason: string, assignees: string[] }
   ↓
5. Updates inbox item:
   - status='needs_review'
   - assigned_to=[...]
   - reason='...'
   - assigned_at=now
   ↓
6. Email notifications to SME(s) (async worker)
   ↓
7. Item shows "Needs Review" badge
   ↓
8. SME reviews in inbox (structured workflow)
```

**Decision:** ✅ Updates inbox item (adds assignment)

---

### **Variant B2: Review Existing FAQ**

**Workflow:**
```
1. Admin views FAQ in FAQ Management page
   ↓
2. Clicks "Request Review"
   ↓
3. Modal: Select SME(s) + context note (required)
   ↓
4. POST /api/admin/inbox/create-review-request
   Body: { qa_pair_id: string, reason: string, assignees: string[] }
   ↓
5. Creates new inbox item:
   - qa_pair_id=existing FAQ ID
   - status='needs_review'
   - assigned_to=[...]
   - reason='...'
   ↓
6. Email notifications to SME(s) (async worker)
   ↓
7. Item appears in Inbox with "Needs Review" badge
   ↓
8. SME reviews in inbox (structured workflow)
```

**Decision:** ✅ Creates inbox item (linked to existing FAQ)

---

## 📊 **Flow C: End-User Feedback (Analytics Signal)**

### **Use Case:** End user in widget gets answer, doesn't like it, clicks thumbs-down

**Key Insight:** 
- **Does NOT create inbox item** (avoids inbox clutter)
- **Logs to analytics table** (feedback_events)
- **Future:** Powers insights dashboard

**Workflow:**
```
1. User interacts with widget, gets RAG answer
   ↓
2. User clicks "This answer wasn't helpful" or thumbs-down
   ↓
3. Optional: User provides feedback text
   ↓
4. POST /api/runtime/feedback
   Body: {
     question: string;
     provided_answer: string;
     qa_pair_id?: string;         // If answer came from FAQ
     doc_ids?: string[];          // Documents used in RAG response
     user_feedback?: string;      // Optional user comment
     conversation_id?: string;    // Chat session context
     message_id?: string;         // Specific message context
   }
   ↓
5. Backend:
   - Derives tenant_id from auth session (NOT in body)
   - Logs to feedback_events table (analytics, NOT inbox)
   - Does NOT create inbox item
   - Returns success immediately (fire-and-forget)
   ↓
6. Future Phase 2:
   - Insights dashboard shows "Top queries with negative feedback"
   - Admin identifies pattern (e.g., "50 users asked about X")
   - Admin manually creates FAQ (using Manual FAQ Creation)
   - FAQ goes through normal inbox workflow
```

**Decision:** ✅ Logs to analytics table only (NOT inbox)

**Note:** Email notifications and insights dashboard are Phase 2 (future)

---

## 🔌 **API Endpoints Summary**

### **1. Manual FAQ Creation**
```
POST /api/admin/inbox/manual
Body: {
  question: string;
  answer: string;
  citations: PreparedCitation[];  // Required
  tags?: string[];
  as_faq: boolean;
  request_sme_review?: boolean;   // Default: false
  assignees?: string[];            // If review requested
}
Response: {
  ok: true;
  inbox_id: string;
  status: 'pending' | 'needs_review';
}
```
**Creates:** Inbox item ✅

---

### **2. Admin Review - Existing Inbox Item**
```
POST /api/admin/inbox/{id}/request-review
Body: {
  reason: string;        // Required - context note
  assignees: string[];    // Required - at least one
}
Response: {
  ok: true;
  assigned_to: Array<{ id: string; email: string; name?: string }>;
}
```
**Creates:** Updates inbox item (adds assignment) ✅

---

### **3. Admin Review - Existing FAQ**
```
POST /api/admin/inbox/create-review-request
Body: {
  qa_pair_id: string;     // Existing FAQ ID
  reason: string;         // Required - context note
  assignees: string[];    // Required - at least one
}
Response: {
  ok: true;
  inbox_id: string;        // New inbox item created
  assigned_to: Array<{ id: string; email: string; name?: string }>;
}
```
**Creates:** New inbox item linked to existing FAQ ✅

---

### **4. End-User Feedback (Analytics Signal)**
```
POST /api/runtime/feedback
Body: {
  question: string;
  provided_answer: string;
  qa_pair_id?: string;         // If answer came from FAQ
  doc_ids?: string[];          // Documents used in RAG response
  user_feedback?: string;      // Optional user comment
  conversation_id?: string;    // Chat session context
  message_id?: string;         // Specific message context
}
Response: {
  ok: true;
  feedback_id: string;
  message: "Feedback recorded";
}
```
**Note:** 
- `tenant_id` derived from authenticated user session (NOT in request body)
- Logs to `feedback_events` analytics table (NOT inbox)
- Fire-and-forget (non-blocking)
- **Does NOT create inbox item** ✅

---

## 📊 **Data Models**

### **Inbox Item Extensions:**
```typescript
type InboxItem = {
  // Existing fields...
  id: string;
  question: string;
  answer: string;
  status: 'pending' | 'needs_review' | 'approved' | 'rejected';
  
  // NEW FIELDS (additive):
  source_type: 'auto' | 'manual' | 'admin_review';  // Provenance
  qa_pair_id?: string;                               // Link to existing FAQ if review request
  assigned_to?: string[];                           // SME user IDs (ownership)
  requested_by?: string;                            // Who requested review
  reason?: string;                                  // Context note (mandatory for assignment)
  assigned_at?: string;                             // When assigned
};
```

### **Feedback Event (Analytics):**
```typescript
type FeedbackEvent = {
  id: string;
  tenant_id: string;              // Derived from auth session
  question: string;                // User's question
  provided_answer: string;         // Answer that user didn't like
  qa_pair_id?: string;             // If answer came from FAQ
  doc_ids?: string[];              // Documents used in RAG response
  user_feedback?: string;          // Optional user comment
  conversation_id?: string;        // Chat session context
  message_id?: string;             // Specific message context
  feedback_type: 'thumbs_down' | 'not_helpful' | 'flag';
  created_at: string;
  // Note: No status, no assignment - pure analytics event
};
```

---

## 🎨 **UI Design Specifications**

### **1. Manual FAQ Creation Modal**

**Component:** `ManualFAQCreationModal.tsx`

**Form Fields:**
- Question (textarea, required, min 10 chars, max 500 chars)
- Answer (textarea, required, min 20 chars, max 5000 chars)
- Citations Editor (required, same component as inbox)
- Tags (optional, multi-select)
- Toggle: "Request SME Review?" (default: OFF)
- If ON → Assignee multi-select dropdown (filtered by role: Admin/Curator)

**Validation:**
- Question and Answer required
- Citations required (governance rule)
- If SME review requested → At least one assignee required

**Success Flow:**
- Show success toast: "FAQ draft created and sent to inbox"
- Close modal
- Refresh inbox list
- Item appears with "Manual Draft" badge

---

### **2. SME Review Request Modal**

**Component:** `SMEReviewRequestModal.tsx`

**Form Fields:**
- Question/Answer preview (read-only, scrollable)
- "What's the concern?" textarea (required, min 20 chars, max 500 chars)
- Assignee multi-select dropdown:
  - Filtered by tenant
  - Filtered by role (Admin/Curator only)
  - Shows: Name, Email, Role
  - Searchable
- Current assignment display (if already assigned)
- "Return to Pool" button (if already assigned, admin only)

**Success Flow:**
- Show success toast: "Review request sent to {count} SME(s)"
- Close modal
- Update inbox item UI (show "Needs Review" badge)
- Refresh inbox list

---

### **3. Inbox List Enhancements**

**New Badges:**
- **Source Badge:**
  - 🟢 "AI Suggestion" (auto-generated)
  - 🔵 "Manual Draft" (manually created)
  - 🟡 "Review Request" (from existing FAQ)
- **Status Badge:**
  - ⚪ "Pending" (unassigned)
  - 🟡 "Needs Review" (assigned)
- **Assignee Badge:**
  - "Assigned to: John Doe" (if single)
  - "Assigned to: John Doe +2" (if multiple)

**New Filters:**
- "All" (default)
- "Pending" (unassigned)
- "Needs Review" (assigned)
- "Assigned to Me" (for SMEs)
- "Manual Drafts" (source filter)
- "AI Suggestions" (source filter)

---

### **4. Inbox Detail Panel Enhancements**

**New Buttons:**
- "Request SME Review" (shown when pending/unassigned)
- "Unassign" (admin only, shown when assigned)
- "Re-assign" (admin only, shown when assigned)

**Assignment Display:**
- Shows current assignees
- Shows assignment reason
- Shows assigned date
- Shows requester name

---

## 📧 **Email Notification Design**

### **1. Admin-Initiated Review (Inbox Workflow)**

**Subject:** `New Abilitix review request: "[Question Preview]"`

**Body:**
```
Hi [SME Name],

A FAQ review has been requested for you:

Question:
[Question text - full]

Current Answer:
[Answer text - truncated to 500 chars]

[If citations exist:]
Citations:
- [Document Title] (Page X)

Review Request:
[Reason/context note from requester]

Requested by: [Requester Name]
Tenant: [Tenant Name]

[Review Button] → Deep-link: /admin/inbox?ref={inbox_id}&filter=assigned_to_me

---
This is an automated notification from Abilitix Admin Portal.
```

**Delivery:** Async worker (fire-and-forget, non-blocking)

---

### **2. End-User Feedback (Optional Phase 2)**

**Note:** This is optional and future phase. For Phase 1, feedback is logged but no email notifications.

**Option A: Weekly Digest**
```
Subject: Weekly Feedback Summary - [Tenant Name]

Hi [Admin Name],

Here's a summary of user feedback from the past week:

Top Queries with Negative Feedback:
1. "How do I reset my password?" - 15 negative feedback
2. "What is your refund policy?" - 12 negative feedback
...

[View Insights Dashboard] → Opens insights dashboard (when built)

---
This is an automated weekly summary from Abilitix.
```

**Option B: Threshold-Based Alert**
```
Subject: High Negative Feedback Alert - [Tenant Name]

Hi [Admin Name],

You've received 10+ negative feedback events in the last hour for:
- "VPN setup instructions"

[View in Insights Dashboard] → Opens insights dashboard (when built)

---
This is an automated alert from Abilitix.
```

**Decision:** Phase 1 = No email (just log events)  
**Phase 2:** Optional email digest/alerts (when insights dashboard is built)

---

## 📁 **File Structure**

### **New Files:**
```
src/
├── components/
│   └── inbox/
│       ├── ManualFAQCreationModal.tsx      # Manual FAQ creation form
│       ├── SMEReviewRequestModal.tsx      # SME review request modal
│       ├── AssignmentBadge.tsx             # Assignee display component
│       └── SourceBadge.tsx                 # Source type badge (AI/Manual)
├── app/
│   └── api/
│       └── admin/
│           └── inbox/
│               ├── manual/
│               │   └── route.ts            # POST /admin/inbox/manual
│               └── [id]/
│                   ├── request-review/
│                   │   └── route.ts        # POST /admin/inbox/{id}/request-review
│                   ├── unassign/
│                   │   └── route.ts        # POST /admin/inbox/{id}/unassign
│                   └── reassign/
│                       └── route.ts        # POST /admin/inbox/{id}/reassign
└── lib/
    └── types/
        └── inbox.ts                        # Extended inbox types
```

### **Runtime Feedback (Future - Backend):**
```
POST /api/runtime/feedback
→ Logs to feedback_events table (backend)
→ No UI component needed (widget calls directly)
```

---

## ✅ **Implementation Checklist**

### **Phase 1: Manual FAQ Creation (2-3 hours)**
- [ ] Create `ManualFAQCreationModal.tsx` component
- [ ] Add "Create FAQ" button to inbox page
- [ ] Create `POST /api/admin/inbox/manual` route
- [ ] Add `source_type` field to inbox items
- [ ] Add "Manual Draft" badge to inbox list
- [ ] Integrate with existing inbox workflow
- [ ] Test end-to-end flow

### **Phase 2: Admin-Initiated Review (3-4 hours)**
- [ ] Create `SMEReviewRequestModal.tsx` component
- [ ] Add "Request SME Review" button to inbox detail panel
- [ ] Add "Request Review" button to FAQ detail page
- [ ] Create `POST /api/admin/inbox/{id}/request-review` route
- [ ] Create `POST /api/admin/inbox/create-review-request` route (for FAQs)
- [ ] Add assignment fields to inbox schema (assigned_to, reason, etc.)
- [ ] Implement role-based member filtering
- [ ] Add "Needs Review" status badge
- [ ] Add "Assigned to Me" filter
- [ ] Email notification worker (async, fire-and-forget)
- [ ] Test assignment flow

### **Phase 3: End-User Feedback Analytics (2-3 hours)**
- [ ] Create `POST /api/runtime/feedback` route (backend)
- [ ] Backend: Derive `tenant_id` from auth session (not request body)
- [ ] Backend: Create `feedback_events` table (analytics, NOT inbox)
- [ ] Backend: Store `conversation_id`, `message_id`, `doc_ids` for context
- [ ] Backend: Log feedback event (fire-and-forget, non-blocking)
- [ ] **Verify:** No inbox items created
- [ ] Test feedback logging

**Note:** Email notifications and insights dashboard are Phase 2 (future)

### **Phase 4: Assignment Management (1-2 hours)**
- [ ] Create unassign endpoint
- [ ] Create reassign endpoint
- [ ] Add "Unassign" button (admin only)
- [ ] Add "Re-assign" button (admin only)
- [ ] Add assignment history display
- [ ] Test assignment management

**Total Effort (Phase 1):** ~7-10 hours  
**Future Phase (Insights Dashboard):** ~8-12 hours (when prioritized)

---

## 🎯 **Key Design Decisions - Final**

### **1. End-User Feedback = Analytics Only ✅**
- **Decision:** Runtime user feedback logs to analytics table, NOT inbox
- **Rationale:** Prevents inbox clutter (1,000 users × 5% = 50 items/day would overwhelm)
- **Implementation:** `feedback_events` table, separate from inbox
- **Future:** Insights dashboard shows patterns, admin creates FAQs manually

### **2. Admin Review = Inbox Items ✅**
- **Decision:** Admin-initiated reviews create/update inbox items
- **Rationale:** Structured workflow, intentional review requests
- **Implementation:** Updates or creates inbox items with assignment

### **3. Manual FAQ Creation = Inbox Items ✅**
- **Decision:** Manual FAQs created by curators go to inbox
- **Rationale:** High-signal, actionable items need review
- **Implementation:** Creates inbox item with `source_type='manual'`

### **4. Two Separate Systems ✅**
- **Decision:** Inbox (high-signal governance) vs Feedback Analytics (signals)
- **Rationale:** Clear separation, different purposes, prevents clutter
- **Implementation:** Different endpoints, different data models, different workflows

---

## 📊 **Final Strategy Summary**

| Scenario | System | Creates Inbox? | Purpose |
|----------|--------|---------------|---------|
| Manual FAQ Creation | Inbox | ✅ Yes | Structured review workflow |
| Admin requests review (inbox item) | Inbox | ✅ Yes (updates) | Structured review workflow |
| Admin requests review (FAQ) | Inbox | ✅ Yes (creates) | Structured review workflow |
| AI-generated FAQs | Inbox | ✅ Yes | Structured review workflow |
| End-user feedback (widget) | Analytics | ❌ No | Analytics signal, content gap tracking |

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
**Status:** Design Finalized - Ready for Implementation  
**Key Decisions:**
- **Inbox = High-signal, human-governed queue** (manual drafts, AI suggestions, admin review) ✅
- **Runtime feedback = Pure analytics signal** (logged to `feedback_events`, NOT inbox) ✅
- **Admin-initiated review = Inbox workflow** (creates/updates inbox items) ✅
- **End-user feedback = Analytics only** (no inbox clutter, future insights dashboard) ✅
- `tenant_id` derived from auth session (not request body) ✅
- Include `conversation_id`/`message_id` for context ✅
- Email sending via async worker (fire-and-forget) ✅

**Philosophy:** 
- Inbox must remain high-signal for curators
- End-user feedback is analytics, not workflow
- Clean separation prevents inbox clutter
- Scalable and aligned with trust/governance story
