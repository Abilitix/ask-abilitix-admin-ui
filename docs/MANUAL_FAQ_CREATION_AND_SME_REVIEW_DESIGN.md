# Manual FAQ Creation & SME Review Request - Design Document

**Date:** 2025-01-20  
**Status:** Design Phase  
**Priority:** High  
**Reference:** GetGuru-style workflow with inbox integration

---

## 📊 **Research: GetGuru Approach**

### **GetGuru's Workflow:**
1. **Manual FAQ Creation:**
   - User creates FAQ directly in knowledge base
   - Can be saved as draft or published immediately
   - Supports rich text, images, links

2. **SME Review Request:**
   - User can flag any answer for "SME Review"
   - Creates a review queue item
   - Selected SMEs receive notification
   - SMEs can approve, edit, or reject
   - Once approved, answer goes live

3. **Key Features:**
   - Review queue (similar to our inbox)
   - Email notifications to SMEs
   - Collaborative editing
   - Version history

---

## 🎯 **Our Proposed Approach**

### **Design Philosophy:**
- **Unified Inbox Model:** All FAQs (auto-generated, manual, review requests) go through inbox
- **Consistent Workflow:** Same review/approval process for all FAQ sources
- **SME Collaboration:** Request review from specific tenant members
- **Email Notifications:** Alert selected SMEs when review is requested

---

## 📋 **Feature 1: Manual FAQ Creation in Inbox**

### **Workflow:**
```
1. User clicks "Create FAQ" button in Inbox page
   ↓
2. Modal/form opens with:
   - Question input (required)
   - Answer input (required)
   - Citations (optional - can attach documents/pages)
   - "Create as FAQ" checkbox (default: checked)
   ↓
3. User submits form
   ↓
4. Creates inbox item via POST /admin/inbox (or similar endpoint)
   - question: user input
   - answer: user input
   - citations: user input
   - source: "manual" (to distinguish from auto-generated)
   - status: "pending" (goes to inbox for review)
   ↓
5. Inbox item appears in inbox list (same as auto-generated)
   ↓
6. User can review/edit/approve like any other inbox item
```

### **UI Design:**

**Location:** Inbox page (`/admin/inbox`)

**Button Placement:**
- Add "Create FAQ" button in inbox page header/toolbar
- Or add to bulk actions area when no items selected

**Modal/Form Design:**
```
┌─────────────────────────────────────────┐
│ Create FAQ Manually              [X]    │
├─────────────────────────────────────────┤
│                                         │
│ Question *                              │
│ ┌─────────────────────────────────────┐ │
│ │ [Text input - multiline]            │ │
│ │                                       │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ Answer *                                │
│ ┌─────────────────────────────────────┐ │
│ │ [Textarea - multiline, rich text?]  │ │
│ │                                       │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ Citations (Optional)                   │
│ ┌─────────────────────────────────────┐ │
│ │ [Citations Editor - same as inbox]  │ │
│ │ - Document ID                        │ │
│ │ - Page (optional)                    │ │
│ │ - Span (optional)                    │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ ☑ Create as FAQ (default: checked)     │
│                                         │
│ [Cancel]  [Create & Send to Inbox]     │
└─────────────────────────────────────────┘
```

### **API Endpoint:**

**Option A: Use existing inbox creation endpoint**
- `POST /admin/inbox` (if exists)
- Body: `{ question, answer, citations?, source: "manual" }`
- Creates inbox item that appears in inbox list

**Option B: Create new endpoint**
- `POST /admin/inbox/create-manual`
- Body: `{ question, answer, citations?, is_faq: true }`
- Creates inbox item directly

**Recommendation:** Check if `POST /admin/inbox` exists, if not create it.

---

## 📋 **Feature 2: Request SME Review**

### **Workflow:**
```
1. User views an inbox item (auto-generated or manual)
   ↓
2. User clicks "Request SME Review" button
   ↓
3. Modal opens with:
   - Current question/answer (read-only preview)
   - Dropdown: Select SME(s) from tenant members
   - Optional: Review notes/context
   ↓
4. User selects SME(s) and submits
   ↓
5. System:
   - Marks inbox item with "review_requested: true"
   - Stores selected SME user IDs
   - Sends email notification to selected SMEs
   - Optionally: Creates review task/assignment
   ↓
6. Selected SMEs receive email:
   - Subject: "FAQ Review Request: [Question]"
   - Link to inbox item
   - Question/answer preview
   - Review button → opens inbox item
   ↓
7. SME reviews in inbox:
   - Can approve, edit, or reject
   - Can add comments/notes
   - Same workflow as regular inbox review
```

### **UI Design:**

**Location:** Inbox Detail Panel (when viewing an item)

**Button Placement:**
- Add "Request SME Review" button in inbox detail panel
- Show when item is pending (not yet approved/rejected)
- Positioned near "Approve" and "Reject" buttons

**Modal Design:**
```
┌─────────────────────────────────────────┐
│ Request SME Review              [X]     │
├─────────────────────────────────────────┤
│                                         │
│ Question:                               │
│ ┌─────────────────────────────────────┐ │
│ │ [Read-only preview of question]     │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ Answer:                                 │
│ ┌─────────────────────────────────────┐ │
│ │ [Read-only preview of answer]       │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ Select SME(s) to Review *               │
│ ┌─────────────────────────────────────┐ │
│ │ [Multi-select dropdown]             │ │
│ │ - John Doe (john@example.com)      │ │
│ │ - Jane Smith (jane@example.com)    │ │
│ │ - Bob Wilson (bob@example.com)     │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ Review Notes (Optional)                 │
│ ┌─────────────────────────────────────┐ │
│ │ [Textarea]                          │ │
│ │ e.g., "Please verify accuracy"      │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ [Cancel]  [Send Review Request]        │
└─────────────────────────────────────────┘
```

### **API Endpoints:**

**1. Get Tenant Members:**
- `GET /api/admin/members` (already exists ✅)
- Returns: `{ members: [{ id, email, name, role }] }`

**2. Request SME Review:**
- `POST /api/admin/inbox/{id}/request-review`
- Body: `{ sme_user_ids: ["uuid1", "uuid2"], notes?: string }`
- Backend:
  - Updates inbox item: `review_requested: true`, `sme_user_ids: [...]`
  - Sends email notifications to selected SMEs
  - Returns: `{ ok: true, notified_smes: [...] }`

**3. Email Notification (Backend):**
- Backend sends email to each selected SME
- Email includes:
  - Subject: "FAQ Review Request: [Question]"
  - Question/answer preview
  - Link to inbox item: `{admin_ui_url}/admin/inbox?ref={inbox_id}`
  - "Review Now" button

---

## 🔄 **Can We Use Same Endpoint?**

### **Manual FAQ Creation:**
- **Endpoint:** `POST /admin/inbox` (create inbox item)
- **Body:** `{ question, answer, citations?, source: "manual" }`
- **Result:** Creates inbox item that appears in inbox list

### **SME Review Request:**
- **Endpoint:** `POST /admin/inbox/{id}/request-review` (update existing inbox item)
- **Body:** `{ sme_user_ids: [...], notes?: string }`
- **Result:** Updates inbox item, sends emails

**Answer:** **No, different endpoints:**
- Manual creation: Creates new inbox item
- SME review: Updates existing inbox item

**But:** Both work with the same inbox item model and review workflow.

---

## 📐 **Detailed Design Specifications**

### **1. Manual FAQ Creation Form**

**Component:** `ManualFAQCreationModal.tsx`

**Props:**
```typescript
type ManualFAQCreationModalProps = {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void; // Refresh inbox list
};
```

**State:**
```typescript
const [question, setQuestion] = useState('');
const [answer, setAnswer] = useState('');
const [citations, setCitations] = useState<EditableCitation[]>([]);
const [createAsFaq, setCreateAsFaq] = useState(true);
const [loading, setLoading] = useState(false);
const [errors, setErrors] = useState<{ question?: string; answer?: string }>({});
```

**Validation:**
- Question: Required, min 10 chars, max 500 chars
- Answer: Required, min 20 chars, max 5000 chars
- Citations: Optional, but validate if provided

**API Call:**
```typescript
POST /api/admin/inbox/create-manual
Body: {
  question: string;
  answer: string;
  citations?: PreparedCitation[];
  is_faq: boolean;
}
```

**Success Flow:**
1. Show success toast: "FAQ created and sent to inbox"
2. Close modal
3. Refresh inbox list
4. Optionally: Navigate to inbox item

---

### **2. SME Review Request Modal**

**Component:** `SMEReviewRequestModal.tsx`

**Props:**
```typescript
type SMEReviewRequestModalProps = {
  open: boolean;
  onClose: () => void;
  inboxItem: {
    id: string;
    question: string;
    answer: string;
  };
  onSuccess?: () => void;
};
```

**State:**
```typescript
const [members, setMembers] = useState<Member[]>([]);
const [selectedSMEs, setSelectedSMEs] = useState<string[]>([]);
const [notes, setNotes] = useState('');
const [loading, setLoading] = useState(false);
const [loadingMembers, setLoadingMembers] = useState(true);
```

**Member Type:**
```typescript
type Member = {
  id: string;
  email: string;
  name?: string;
  role: string;
};
```

**API Calls:**
1. Load members: `GET /api/admin/members`
2. Request review: `POST /api/admin/inbox/{id}/request-review`

**Validation:**
- At least one SME must be selected
- Notes: Optional, max 500 chars

**Success Flow:**
1. Show success toast: "Review request sent to {count} SME(s)"
2. Close modal
3. Update inbox item UI (show "Review Requested" badge)
4. Refresh inbox list

---

### **3. Inbox Item Status Badge**

**New Status:** `review_requested`

**Display:**
- Badge: "🟡 Review Requested"
- Tooltip: "SME review requested for {count} reviewer(s)"
- Show in inbox list and detail panel

**Backend Field:**
- Add `review_requested: boolean` to inbox item
- Add `sme_user_ids: string[]` to inbox item
- Add `review_requested_at: timestamp` to inbox item

---

## 🔌 **API Endpoints Required**

### **1. Create Manual FAQ (New)**
```
POST /api/admin/inbox/create-manual
Body: {
  question: string;
  answer: string;
  citations?: PreparedCitation[];
  is_faq: boolean;
}
Response: {
  ok: true;
  inbox_id: string;
  message: "FAQ created and sent to inbox";
}
```

### **2. Request SME Review (New)**
```
POST /api/admin/inbox/{id}/request-review
Body: {
  sme_user_ids: string[];
  notes?: string;
}
Response: {
  ok: true;
  notified_smes: Array<{ id: string; email: string }>;
  message: "Review request sent";
}
```

### **3. Get Tenant Members (Exists ✅)**
```
GET /api/admin/members
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

## 📧 **Email Notification Design**

### **Email Template:**

**Subject:** `FAQ Review Request: [Question Preview]`

**Body:**
```
Hi [SME Name],

A FAQ review has been requested for you:

Question:
[Question text]

Answer:
[Answer text]

[If citations exist:]
Citations:
- [Document Title] (Page X)

[If notes provided:]
Review Notes:
[Notes text]

Please review this FAQ:
[Review Button] → Links to /admin/inbox?ref={inbox_id}

---
This is an automated notification from Abilitix Admin Portal.
```

**Backend Implementation:**
- Send email via Admin API email service
- Include unsubscribe link
- Track email delivery status

---

## 🎨 **UI/UX Considerations**

### **1. Manual FAQ Creation:**
- **Accessibility:** Form should be keyboard navigable
- **Validation:** Real-time validation feedback
- **Citations:** Reuse existing CitationsEditor component
- **Rich Text:** Consider markdown support for answer field
- **Preview:** Optional preview before submitting

### **2. SME Review Request:**
- **Member Selection:** Multi-select dropdown with search
- **Member Display:** Show name, email, role
- **Loading States:** Show loading while fetching members
- **Error Handling:** Handle cases where no members available
- **Confirmation:** Show confirmation before sending

### **3. Inbox Integration:**
- **Status Badge:** Visual indicator for review-requested items
- **Filter:** Optional filter for "Review Requested" items
- **Sorting:** Option to sort by review request date
- **Bulk Actions:** Can bulk approve even if review requested

---

## 📁 **File Structure**

### **New Files:**
```
src/
├── components/
│   └── inbox/
│       ├── ManualFAQCreationModal.tsx      # Manual FAQ creation form
│       └── SMEReviewRequestModal.tsx      # SME review request modal
├── app/
│   └── api/
│       └── admin/
│           └── inbox/
│               ├── create-manual/
│               │   └── route.ts            # POST /admin/inbox/create-manual
│               └── [id]/
│                   └── request-review/
│                       └── route.ts        # POST /admin/inbox/{id}/request-review
└── lib/
    └── types/
        └── inbox.ts                        # Add types for manual creation, review request
```

### **Modified Files:**
```
src/
├── components/
│   └── inbox/
│       ├── InboxPageClient.tsx             # Add "Create FAQ" button
│       ├── InboxDetailPanel.tsx            # Add "Request SME Review" button
│       └── InboxList.tsx                   # Show review-requested badge
└── lib/
    └── types/
        └── inbox.ts                        # Add review_requested, sme_user_ids fields
```

---

## 🔄 **Workflow Diagrams**

### **Manual FAQ Creation Flow:**
```
User clicks "Create FAQ"
  ↓
Modal opens
  ↓
User fills form (question, answer, citations)
  ↓
User clicks "Create & Send to Inbox"
  ↓
POST /admin/inbox/create-manual
  ↓
Inbox item created
  ↓
Modal closes, inbox list refreshes
  ↓
New item appears in inbox (same as auto-generated)
  ↓
User can review/edit/approve like any other item
```

### **SME Review Request Flow:**
```
User views inbox item
  ↓
User clicks "Request SME Review"
  ↓
Modal opens, loads tenant members
  ↓
User selects SME(s) and adds notes
  ↓
User clicks "Send Review Request"
  ↓
POST /admin/inbox/{id}/request-review
  ↓
Backend:
  - Updates inbox item (review_requested: true)
  - Sends email to selected SMEs
  ↓
Modal closes, shows success toast
  ↓
Inbox item shows "Review Requested" badge
  ↓
SMEs receive email, click link
  ↓
SMEs review in inbox (approve/edit/reject)
```

---

## ✅ **Implementation Checklist**

### **Phase 1: Manual FAQ Creation (2-3 hours)**
- [ ] Create `ManualFAQCreationModal.tsx` component
- [ ] Add "Create FAQ" button to inbox page
- [ ] Create `POST /api/admin/inbox/create-manual` route
- [ ] Integrate with inbox list (show manual FAQs)
- [ ] Add validation and error handling
- [ ] Test end-to-end flow

### **Phase 2: SME Review Request (3-4 hours)**
- [ ] Create `SMEReviewRequestModal.tsx` component
- [ ] Add "Request SME Review" button to inbox detail panel
- [ ] Create `POST /api/admin/inbox/{id}/request-review` route
- [ ] Integrate member selection (use existing members API)
- [ ] Add "Review Requested" badge to inbox items
- [ ] Backend: Email notification service
- [ ] Test email delivery
- [ ] Test end-to-end flow

### **Phase 3: Polish (1-2 hours)**
- [ ] Add filter for "Review Requested" items
- [ ] Add sorting by review request date
- [ ] Add review request history/audit log
- [ ] Add "Cancel Review Request" functionality
- [ ] Enhanced email templates
- [ ] Loading states and error handling

**Total Effort:** ~6-9 hours

---

## 🎯 **Key Design Decisions**

### **1. Unified Inbox Model ✅**
- **Decision:** All FAQs go through inbox (auto-generated, manual, review requests)
- **Rationale:** Consistent workflow, single source of truth, easier to manage

### **2. Manual Creation → Inbox ✅**
- **Decision:** Manual FAQs create inbox items, not direct FAQ creation
- **Rationale:** Maintains review/approval workflow, quality control

### **3. SME Selection via Dropdown ✅**
- **Decision:** Multi-select dropdown of tenant members
- **Rationale:** Simple, familiar UI pattern, uses existing members API

### **4. Email Notifications ✅**
- **Decision:** Send email to selected SMEs with inbox link
- **Rationale:** Standard notification pattern, ensures SMEs are alerted

### **5. Review Requested Status ✅**
- **Decision:** Add `review_requested` status to inbox items
- **Rationale:** Visual indicator, can filter/sort, tracks review state

---

## 📝 **Open Questions**

1. **Rich Text Editor:** Should answer field support markdown/rich text?
2. **Review Assignment:** Should review requests be assignable to specific roles (e.g., "All Curators")?
3. **Review Deadline:** Should we add optional deadline for review requests?
4. **Review Comments:** Should SMEs be able to add comments/notes during review?
5. **Review History:** Should we track who reviewed what and when?
6. **Bulk Review Requests:** Can users request review for multiple items at once?

---

## 🚀 **Next Steps**

1. **Review this design** with stakeholders
2. **Confirm API endpoints** with backend team
3. **Prioritize features** (manual creation vs SME review)
4. **Start implementation** with Phase 1 (Manual FAQ Creation)
5. **Test with users** before Phase 2

---

**Last Updated:** 2025-01-20  
**Status:** Design Complete - Ready for Review







