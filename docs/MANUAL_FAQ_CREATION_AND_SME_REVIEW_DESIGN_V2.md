# Manual FAQ Creation & SME Review Request - Design Document V2

**Date:** 2025-01-20  
**Status:** Design Phase - Updated with ChatGPT & Gemini Insights  
**Priority:** High  
**Philosophy:** Inbox as Active Accountability Engine (not passive queue)

---

## 🎯 **Core Philosophy (From Gemini)**

### **The Golden Rule:**
> Every item in the Inbox that isn't immediately processable must have clear **ownership**.

### **Key Principles:**
1. **Inbox = Governance Gateway:** Manual FAQs **never bypass** Inbox (always enter as "Pending")
2. **Visual Provenance:** Clear badges showing source (AI Suggestion vs Manual Draft)
3. **Ownership Transfer:** Assignment = transfer from "Pool" to "Person"
4. **Mandatory Context:** Assignment requires explanation note
5. **Role-Based Assignment:** Only assignable to eligible roles (Admin/Curator)
6. **Return to Pool:** Can un-assign or re-assign (no dead-ends)
7. **Deep-Link Emails:** Emails take SME directly to specific task
8. **Auto-Clear Assignment:** Approve/Reject automatically clears assignment

---

## 📊 **Data Model Extensions (From ChatGPT)**

### **Inbox Schema Additions (Additive, Non-Breaking):**

```typescript
type InboxItem = {
  // Existing fields...
  id: string;
  question: string;
  answer: string;
  status: 'pending' | 'approved' | 'rejected';
  
  // NEW FIELDS (additive):
  source_type: 'auto' | 'manual' | 'runtime_feedback';  // Provenance
  qa_pair_id?: string;                                  // Link to existing FAQ if review request
  assigned_to?: string[];                              // SME user IDs (ownership)
  requested_by?: string;                               // Who requested review
  reason?: string;                                     // Context note (mandatory for assignment)
  assigned_at?: string;                                 // When assigned
};
```

### **Status Extensions:**

```typescript
type InboxStatus = 
  | 'pending'           // Unassigned, in pool
  | 'needs_review'      // Assigned to SME(s)
  | 'sme_in_progress'   // Optional: SME actively working
  | 'approved'          // Approved (existing)
  | 'rejected';         // Rejected (existing)
```

---

## 🔄 **Flow A: Manual FAQ Creation**

### **Business Logic:**
- **Rule:** Manual FAQs are **untrusted drafts** - must go through Inbox
- **Rule:** Visual differentiation via "Manual Draft" badge
- **Rule:** Citation debt - encourage linking to documents

### **UX Flow:**

```
1. User clicks "Create FAQ Manually" in Inbox page
   ↓
2. Modal opens with form:
   - Question (required)
   - Answer (required)
   - Citations picker (required - governance rule)
   - Tags (optional)
   - Toggle: "Send to SME for review?" (default: OFF)
   - If ON → Multi-select Assignees (filtered by role)
   ↓
3. User submits
   ↓
4. POST /admin/inbox/manual
   - Creates inbox item with source_type='manual'
   - Status: 'pending' (or 'needs_review' if SME review requested)
   - If assignees provided → sends email notifications
   ↓
5. Item appears in Inbox with "Manual Draft" badge
   ↓
6. Same review/approval workflow as auto-generated items
```

### **API Endpoint:**

```
POST /api/admin/inbox/manual
Body: {
  question: string;
  answer: string;
  citations: PreparedCitation[];  // Required
  tags?: string[];
  as_faq: boolean;
  request_sme_review?: boolean;   // Default: false
  assignees?: string[];            // SME user IDs (if review requested)
}
Response: {
  ok: true;
  inbox_id: string;
  status: 'pending' | 'needs_review';
  message: "FAQ draft created";
}
```

### **UI Components:**

**1. Manual FAQ Creation Modal:**
- Form with validation
- Citations editor (required)
- "Request SME Review" toggle
- Assignee dropdown (shown when toggle ON)
- Visual indicator: "This will be added to Inbox for review"

**2. Inbox List Badge:**
- "Manual Draft" badge (vs "AI Suggestion" for auto-generated)
- Color: Blue for manual, Green for AI

---

## 🔄 **Flow B: Request SME Review**

### **Business Logic:**
- **Rule:** Assignment = ownership transfer (Pool → Person)
- **Rule:** Mandatory context note (explain "why")
- **Rule:** Role-based filtering (only Admin/Curator assignable)
- **Rule:** Can return to pool or re-assign

### **Entry Points:**

**1. From Inbox Item (New/Existing):**
- Button: "Request SME Review"
- Opens assignment modal

**2. From FAQ Management Page (Existing FAQ):**
- Button: "Request Review"
- Creates inbox item linked to existing FAQ

**3. From Runtime/Widget (Future):**
- Thumbs-down → Request review
- Same endpoint, different source_type

### **UX Flow:**

```
1. User clicks "Request SME Review" on inbox item or FAQ
   ↓
2. Modal opens:
   - Question/Answer preview (read-only)
   - "What's the concern?" (required text field)
   - Multi-select Assignees (filtered: Admin/Curator roles only)
   - Show current assignees (if any)
   ↓
3. User selects SME(s) and adds context note
   ↓
4. POST /api/admin/inbox/{id}/request-review
   - Updates inbox item: status='needs_review', assigned_to=[...], reason='...'
   - If qa_pair_id exists → links to existing FAQ
   - Queues email notifications (async worker)
   ↓
5. Item shows "Assigned to [SME names]" badge
   ↓
6. SMEs receive email with deep-link
   ↓
7. SME opens Inbox → filtered to "Assigned to Me"
   ↓
8. SME reviews, edits, approves/rejects
   ↓
9. On approve/reject → assignment auto-clears
```

### **API Endpoint:**

```
POST /api/admin/inbox/{id}/request-review
Body: {
  reason: string;                    // Required - context note
  assignees: string[];               // Required - at least one
  qa_pair_id?: string;               // If reviewing existing FAQ
}
Response: {
  ok: true;
  assigned_to: Array<{ id: string; email: string; name?: string }>;
  message: "Review request sent to {count} SME(s)";
}
```

### **UI Components:**

**1. SME Review Request Modal:**
- Question/Answer preview (read-only, scrollable)
- "What's the concern?" textarea (required, min 20 chars)
- Assignee multi-select dropdown:
  - Filtered by tenant
  - Filtered by role (Admin/Curator only)
  - Shows: Name, Email, Role
  - Searchable
- Current assignment display (if already assigned)
- "Return to Pool" button (if already assigned)

**2. Inbox List Display:**
- Status badge: "🟡 Needs Review" (if assigned)
- Assignee badge: "Assigned to: John Doe, Jane Smith"
- Filter: "Assigned to Me" (for SMEs)
- Filter: "Needs Review" (for admins)

**3. Assignment Actions:**
- "Unassign" button (admin only)
- "Re-assign" button (admin only)
- Shows assignment history

---

## 📧 **Email Notification Design**

### **Business Logic:**
- **Rule:** Asynchronous delivery (worker process, don't block UI)
- **Rule:** Deep-link to specific task (not just "you have tasks")
- **Rule:** Actionable - opens Inbox filtered to assigned items

### **Email Template:**

**Subject:** `New Abilitix review request: "[Question Preview]"`

**Body:**
```
Hi [SME Name],

A FAQ review has been requested for you:

Question:
[Question text - full]

Current Answer:
[Answer text - truncated to 500 chars, with "View full answer" link]

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
You can manage notification preferences in your account settings.
```

### **Deep-Link Behavior:**
- Opens Inbox page
- Filters to "Assigned to Me"
- Expands/highlights the specific inbox item
- Ready for immediate review

---

## 🎨 **UI/UX Specifications**

### **1. Inbox List Enhancements:**

**New Columns/Badges:**
- **Source Badge:**
  - 🟢 "AI Suggestion" (auto-generated)
  - 🔵 "Manual Draft" (manually created)
  - 🟡 "Review Request" (from existing FAQ)
- **Status Badge:**
  - ⚪ "Pending" (unassigned)
  - 🟡 "Needs Review" (assigned)
  - 🟢 "In Progress" (optional - SME actively working)
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

**Sorting:**
- Default: Created date (newest first)
- Option: Assigned date (oldest first - for review queue)
- Option: Priority (if implemented)

### **2. Inbox Detail Panel Enhancements:**

**New Buttons:**
- "Request SME Review" (shown when pending/unassigned)
- "Unassign" (admin only, shown when assigned)
- "Re-assign" (admin only, shown when assigned)

**Assignment Display:**
- Shows current assignees
- Shows assignment reason
- Shows assigned date
- Shows requester name

**Action States:**
- If assigned to current user: Highlight "Assigned to You" banner
- If assigned to others: Show "Assigned to [Names]" banner
- If unassigned: Show "Unassigned - In Pool" badge

### **3. FAQ Management Page Integration:**

**New Button on FAQ Detail:**
- "Request Review" (for existing FAQs)
- Opens same SME review modal
- Pre-fills with current FAQ question/answer
- Links via `qa_pair_id`

**Visual Indicator:**
- Badge on FAQ: "🟡 Under Review" (if linked inbox item exists with status='needs_review')
- Click badge → Navigate to inbox item

---

## 🔌 **API Endpoints Summary**

### **1. Create Manual FAQ**
```
POST /api/admin/inbox/manual
Body: {
  question: string;
  answer: string;
  citations: PreparedCitation[];  // Required
  tags?: string[];
  as_faq: boolean;
  request_sme_review?: boolean;
  assignees?: string[];
}
```

### **2. Request SME Review**
```
POST /api/admin/inbox/{id}/request-review
Body: {
  reason: string;        // Required - context note
  assignees: string[];    // Required - at least one
  qa_pair_id?: string;    // If reviewing existing FAQ
}
```

### **3. Unassign/Return to Pool**
```
POST /api/admin/inbox/{id}/unassign
Body: {}  // No body needed
Response: {
  ok: true;
  message: "Item returned to pool";
}
```

### **4. Re-assign**
```
POST /api/admin/inbox/{id}/reassign
Body: {
  reason?: string;        // Optional - new context
  assignees: string[];    // Required - new assignees
}
```

### **5. Get Tenant Members (Filtered by Role)**
```
GET /api/admin/members?role=admin,curator
Response: {
  members: Array<{
    id: string;
    email: string;
    name?: string;
    role: string;
  }>;
}
```

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

### **Modified Files:**
```
src/
├── components/
│   └── inbox/
│       ├── InboxPageClient.tsx             # Add "Create FAQ" button
│       ├── InboxDetailPanel.tsx            # Add "Request SME Review" button
│       ├── InboxList.tsx                   # Add badges, filters
│       └── ModernInboxClient.tsx          # Handle new statuses
└── lib/
    └── types/
        └── inbox.ts                        # Add new fields
```

---

## ✅ **Implementation Checklist**

### **Phase 1: Manual FAQ Creation (2-3 hours)**
- [ ] Create `ManualFAQCreationModal.tsx`
- [ ] Add "Create FAQ" button to inbox page
- [ ] Create `POST /api/admin/inbox/manual` route
- [ ] Add `source_type` field to inbox items
- [ ] Add "Manual Draft" badge to inbox list
- [ ] Integrate with existing inbox workflow
- [ ] Test end-to-end flow

### **Phase 2: SME Review Request - Core (3-4 hours)**
- [ ] Create `SMEReviewRequestModal.tsx`
- [ ] Add "Request SME Review" button to inbox detail panel
- [ ] Create `POST /api/admin/inbox/{id}/request-review` route
- [ ] Add assignment fields to inbox schema (assigned_to, reason, etc.)
- [ ] Implement role-based member filtering
- [ ] Add "Needs Review" status badge
- [ ] Add "Assigned to Me" filter
- [ ] Test assignment flow

### **Phase 3: Email Notifications (2-3 hours)**
- [ ] Backend: Email notification worker
- [ ] Email template design
- [ ] Deep-link implementation
- [ ] Test email delivery
- [ ] Test deep-link behavior

### **Phase 4: Assignment Management (1-2 hours)**
- [ ] Create unassign endpoint
- [ ] Create reassign endpoint
- [ ] Add "Unassign" button (admin only)
- [ ] Add "Re-assign" button (admin only)
- [ ] Add assignment history display
- [ ] Test assignment management

### **Phase 5: FAQ Management Integration (1 hour)**
- [ ] Add "Request Review" button to FAQ detail page
- [ ] Link existing FAQs to inbox items (qa_pair_id)
- [ ] Add "Under Review" badge to FAQs
- [ ] Navigate from FAQ to inbox item
- [ ] Test integration

### **Phase 6: Polish & Enhancements (1-2 hours)**
- [ ] Add "Source" filter (AI/Manual)
- [ ] Add sorting options
- [ ] Enhanced empty states
- [ ] Loading states
- [ ] Error handling
- [ ] Accessibility improvements

**Total Effort:** ~10-15 hours

---

## 🎯 **Key Design Decisions**

### **1. Never Bypass Inbox ✅**
- **Decision:** Manual FAQs always enter as "Pending" in Inbox
- **Rationale:** Maintains governance gateway, consistent workflow

### **2. Visual Provenance ✅**
- **Decision:** Clear badges for source type (AI vs Manual)
- **Rationale:** Helps reviewers understand context and verification needs

### **3. Ownership Transfer ✅**
- **Decision:** Assignment = transfer from Pool to Person
- **Rationale:** Clear accountability, prevents items from getting lost

### **4. Mandatory Context ✅**
- **Decision:** Assignment requires explanation note
- **Rationale:** Reduces back-and-forth, provides context for SME

### **5. Role-Based Assignment ✅**
- **Decision:** Only Admin/Curator roles assignable
- **Rationale:** Ensures qualified reviewers, prevents spam

### **6. Return to Pool ✅**
- **Decision:** Can unassign or reassign
- **Rationale:** Prevents dead-ends, allows workflow flexibility

### **7. Deep-Link Emails ✅**
- **Decision:** Emails link directly to specific task
- **Rationale:** Reduces friction, increases action rate

### **8. Auto-Clear Assignment ✅**
- **Decision:** Approve/Reject automatically clears assignment
- **Rationale:** Closes the loop, prevents stale assignments

---

## 🔄 **Workflow Diagrams**

### **Manual FAQ Creation:**
```
User clicks "Create FAQ"
  ↓
Modal: Question, Answer, Citations (required)
  ↓
Optional: Toggle "Request SME Review" → Select assignees
  ↓
POST /admin/inbox/manual
  ↓
Inbox item created (source_type='manual', status='pending' or 'needs_review')
  ↓
If assigned → Email notifications sent (async)
  ↓
Item appears in Inbox with "Manual Draft" badge
  ↓
Same review/approval workflow as auto-generated
```

### **SME Review Request:**
```
User views inbox item or FAQ
  ↓
Clicks "Request SME Review"
  ↓
Modal: Context note (required) + Assignee selection (filtered by role)
  ↓
POST /admin/inbox/{id}/request-review
  ↓
Inbox item updated (status='needs_review', assigned_to=[...], reason='...')
  ↓
Email notifications queued (async worker)
  ↓
SMEs receive email with deep-link
  ↓
SME clicks link → Opens Inbox filtered to "Assigned to Me"
  ↓
SME reviews, edits, approves/rejects
  ↓
On approve/reject → Assignment auto-clears
```

---

## 📝 **Open Questions**

1. **Status Granularity:** Do we need `sme_in_progress` status, or is `needs_review` sufficient?
2. **Assignment Limits:** Can one item be assigned to multiple SMEs simultaneously?
3. **Review Deadline:** Should we add optional deadline/reminder system?
4. **Review Comments:** Should SMEs be able to add comments during review?
5. **Review History:** Should we track assignment history (who assigned, when, why)?
6. **Bulk Assignment:** Can users assign multiple items to same SME at once?
7. **Auto-Assignment:** Should we support auto-assignment rules (e.g., by tag/category)?

---

## 🚀 **Next Steps**

1. **Review this design** with stakeholders
2. **Confirm API endpoints** with backend team
3. **Prioritize phases** (suggest: Phase 1 → Phase 2 → Phase 3)
4. **Start implementation** with Phase 1 (Manual FAQ Creation)
5. **Test with users** before Phase 2

---

**Last Updated:** 2025-01-20  
**Status:** Design Complete - Ready for Implementation  
**Philosophy:** Inbox as Active Accountability Engine







