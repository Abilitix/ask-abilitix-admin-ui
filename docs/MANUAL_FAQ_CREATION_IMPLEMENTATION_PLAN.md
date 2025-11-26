# Manual FAQ Creation & SME Review - Implementation Plan

**Date:** 2025-01-20  
**Status:** Ready for Implementation  
**Approach:** Incremental, Additive PRs  
**Plan Ownership:** Admin API (orchestration and coordination)  
**Plan Location:** Admin API repository (single source of truth)

---

## 🎯 **Orchestration & Ownership**

**Admin API Responsibilities:**
- ✅ Own and maintain the implementation plan (single source of truth)
- ✅ Coordinate with Admin UI and Runtime API teams
- ✅ Track phase dependencies and blockers
- ✅ Ensure API contracts are defined before UI work
- ✅ Manage database migrations
- ✅ Define API endpoints and contracts

**Admin UI Responsibilities:**
- ✅ Build UI components per the plan
- ✅ Coordinate UI-specific details with Admin API
- ✅ Provide feedback on API contracts
- ✅ Follow API contracts defined by Admin API

**Runtime API Responsibilities:**
- ✅ Implement runtime endpoints per the plan
- ✅ Coordinate with Admin API on endpoint contracts
- ✅ Follow API contracts defined by Admin API

---

## 🎯 **Implementation Strategy**

**Principle:** Each phase is:
- ✅ Additive (no breaking changes)
- ✅ Appropriately sized (1-2 days per phase)
- ✅ Independently testable
- ✅ Can be deployed incrementally

---

## 📋 **Phase Breakdown**

### **Phase 1: Manual FAQ Creation (Foundation)**
**PR Size:** Medium (~1-2 days)  
**Dependencies:** None  
**Deployable:** ✅ Yes

**Permission:** Curator+ (Curator, Admin, Owner can create manual FAQs)

---

### **Phase 2: Admin Review - Inbox Item Assignment**
**PR Size:** Medium (~1-2 days)  
**Dependencies:** Phase 1 (uses source_type)  
**Deployable:** ✅ Yes

**Permission:** Curator+ (Curator, Admin, Owner can request review)  
**Email Notifications:** Implement in Phase 2 (not deferred)

---

### **Phase 3: Admin Review - Existing FAQ**
**PR Size:** Small (~1 day)  
**Dependencies:** Phase 2 (uses assignment fields)  
**Deployable:** ✅ Yes

---

### **Phase 4: Assignment Management (Unassign/Reassign)**
**PR Size:** Small (~0.5-1 day)  
**Dependencies:** Phase 2 (uses assignment fields)  
**Deployable:** ✅ Yes

**Permission:** Admin+ (Admin, Owner only - not Curator)

---

### **Phase 5: End-User Feedback Analytics**
**PR Size:** Small (~1 day)  
**Dependencies:** None (independent)  
**Deployable:** ✅ Yes

**Note:** Confirm endpoint location: `/api/runtime/feedback` vs `/runtime/feedback`

---

### **Phase 6: UI Polish (Badges, Filters, Email)**
**PR Size:** Medium (~1-2 days)  
**Dependencies:** Phases 1-4 (uses all features)  
**Deployable:** ✅ Yes

---

## 📦 **Phase 1: Manual FAQ Creation**

### **Goal:** Allow curators to manually create FAQ drafts in inbox

---

### **Admin API Responsibilities:**

**New Endpoint:**
```
POST /admin/inbox/manual
```

**Request Body:**
```json
{
  "question": "string (required, 10-500 chars)",
  "answer": "string (required, 20-5000 chars)",
  "citations": [
    {
      "doc_id": "uuid",
      "page": "number (optional)",
      "span": "string (optional, max 400 chars)"
    }
  ],
  "tags": ["string"] (optional),
  "as_faq": true,
  "request_sme_review": false (optional, default: false),
  "assignees": ["user_uuid"] (optional, required if request_sme_review=true)
}
```

**Response:**
```json
{
  "ok": true,
  "inbox_id": "uuid",
  "status": "pending" | "needs_review"
}
```

**Implementation Tasks:**
1. ✅ Create route handler in `routes_admin.py`
2. ✅ Request validation (question, answer, citations required)
3. ✅ Citation validation (max 3, unique doc_ids, page/span format)
4. ✅ Set `source_type='manual'` on inbox item
5. ✅ Set `status='pending'` (or `'needs_review'` if assignees provided)
6. ✅ Handle optional SME review assignment:
   - If `assignees` provided:
     - Validate assignees exist and have Admin/Curator role
     - Set `assigned_to`, `assigned_at`, `requested_by`
7. ✅ Insert into `qa_inbox` table
8. ✅ Return inbox_id and status

**Error Handling:**
- 400: Validation errors (missing fields, invalid citations, etc.)
- 401: Unauthorized
- 403: User doesn't have permission
- 404: Assignee not found or invalid role

---

### **Database Migration (Admin API):**

**File:** `migrations/XXXX_add_source_type_to_inbox.sql`

**Changes:**
```sql
-- Add source_type column to qa_inbox table
ALTER TABLE qa_inbox 
ADD COLUMN source_type VARCHAR(20) DEFAULT 'auto' 
CHECK (source_type IN ('auto', 'manual', 'admin_review'));

-- Backfill existing rows as 'auto'
UPDATE qa_inbox SET source_type = 'auto' WHERE source_type IS NULL;

-- Make it NOT NULL after backfill
ALTER TABLE qa_inbox ALTER COLUMN source_type SET NOT NULL;

-- Add index for filtering
CREATE INDEX idx_qa_inbox_source_type ON qa_inbox(source_type);
```

**Rollback:**
```sql
DROP INDEX IF EXISTS idx_qa_inbox_source_type;
ALTER TABLE qa_inbox DROP COLUMN source_type;
```

**Admin API Responsibilities:**
- ✅ Create and run database migration
- ✅ Backfill existing rows as `'auto'`
- ✅ Add index for filtering
- ✅ Test migration and rollback

---

### **Runtime API Responsibilities:**

**None** - This phase is admin-only.

---

### **Admin UI Responsibilities:**

**New Component:**
- `src/components/inbox/ManualFAQCreationModal.tsx`

**Features:**
1. Form fields:
   - Question (textarea, required, 10-500 chars)
   - Answer (textarea, required, 20-5000 chars)
   - Citations Editor (reuse existing component, required, max 3)
   - Tags (optional, multi-select)
   - Toggle: "Request SME Review?" (default: OFF)
   - If ON → Assignee multi-select (filtered by Admin/Curator role)
2. Validation:
   - All required fields
   - Citations required (governance rule)
   - If SME review requested → At least one assignee required
3. API Integration:
   - Call `POST /api/admin/inbox/manual`
   - Handle loading state
   - Handle errors (toast notifications)
   - On success: Close modal, refresh inbox list, show success toast

**Integration Points:**
1. Add "Create FAQ" button to inbox page header
2. Open modal on button click
3. Refresh inbox list after successful creation

**Files to Create/Modify:**
- `src/components/inbox/ManualFAQCreationModal.tsx` (new)
- `src/app/api/admin/inbox/manual/route.ts` (new - proxy to Admin API)
- `src/components/inbox/ModernInboxClient.tsx` (add button + modal)
- `src/components/inbox/LegacyInboxPageClient.tsx` (add button + modal)

**Type Definitions:**
- Add `source_type` to `InboxListItem` type
- Add `source_type` to inbox detail types

---

### **Testing Checklist:**

**Admin API:**
- [ ] Create manual FAQ with all fields
- [ ] Create manual FAQ with SME review request
- [ ] Validate missing question → 400
- [ ] Validate missing answer → 400
- [ ] Validate missing citations → 400
- [ ] Validate invalid citations (duplicate doc_id) → 400
- [ ] Validate invalid assignee → 404
- [ ] Verify `source_type='manual'` in DB
- [ ] Verify `status='needs_review'` when assignees provided

**Admin UI:**
- [ ] Modal opens/closes correctly
- [ ] Form validation works
- [ ] Citations editor enforces max 3
- [ ] Assignee dropdown filters by role
- [ ] Success toast appears
- [ ] Inbox list refreshes after creation
- [ ] Item appears with correct source_type

---

## 📦 **Phase 2: Admin Review - Inbox Item Assignment**

### **Goal:** Allow admins to request SME review for existing inbox items

---

### **Admin API Responsibilities:**

**New Endpoint:**
```
POST /admin/inbox/{id}/request-review
```

**Request Body:**
```json
{
  "reason": "string (required, 20-500 chars)",
  "assignees": ["user_uuid"] (required, at least one)
}
```

**Response:**
```json
{
  "ok": true,
  "assigned_to": [
    {
      "id": "uuid",
      "email": "string",
      "name": "string (optional)"
    }
  ]
}
```

**Implementation Tasks:**
1. Create route handler in `routes_admin.py`
2. Validate inbox item exists
3. Validate user has permission (admin/curator) - see Permission Matrix below
4. **Conflict Handling (REQUIRED):**
   - Check if item already has `assigned_to` populated
   - If assigned: Return **409 Conflict** with error message: `"Item is already assigned. Use reassign endpoint to change assignment."`
   - If not assigned: Proceed with assignment
   - **Rationale:** Explicit reassignment via Phase 4 endpoint prevents accidental overwrites
5. Validate request body (reason required, assignees required, at least one)
6. Validate assignees exist and have Admin/Curator role
7. Update inbox item:
   - Set `status='needs_review'`
   - Set `assigned_to=assignees`
   - Set `reason=reason`
   - Set `assigned_at=now()`
   - Set `requested_by=current_user_id`
8. **Queue email notifications to assignees (async worker)** - Implement in Phase 2 (not deferred)
9. Return assigned_to list

**Permission Matrix:**
- **Create manual FAQ:** Curator+ (Curator, Admin, Owner)
- **Request SME review:** Curator+ (Curator, Admin, Owner)
- **Unassign/Reassign:** Admin+ (Admin, Owner only)

**Existing Endpoint (Verify/Enhance):**
```
GET /admin/members?role=admin,curator
```

**Current Response Structure (from Admin API):**
```json
{
  "members": [
    {
      "user_id": "uuid",  // Note: field is "user_id", not "id"
      "email": "string",
      "name": "string",
      "role": "owner" | "admin" | "curator" | "viewer",
      "accepted_at": "string"
    }
  ]
}
```

**Implementation Tasks (Admin API):**
1. **✅ Endpoint exists** - Confirmed: `GET /admin/members` exists (Admin API Line 5578-5619)
2. **Add role filtering** - **REQUIRED:** Support `?role=admin,curator` query parameter
   - Filter members by role if provided
   - Accept comma-separated roles: `?role=admin,curator`
   - Keep existing behavior if no role filter provided
3. Filter by tenant (from auth) - Already implemented
4. Return member list

**Implementation Tasks (Admin UI):**
1. **✅ Proxy exists** - Confirmed: `/api/admin/members` exists in Admin UI
2. **Field mapping** - Map `user_id` → `id` for consistency in UI components
3. Pass `?role=admin,curator` query parameter when fetching assignees

**Error Handling:**
- 400: Validation errors (missing reason, no assignees, etc.)
- 401: Unauthorized
- 403: User doesn't have permission (not Curator+)
- 404: Inbox item not found or assignee not found
- 409: Conflict - Item is already assigned (use reassign endpoint)

---

### **Database Migration:**

**File:** `migrations/XXXX_add_assignment_fields_to_inbox.sql`

**Changes:**
```sql
-- Add assignment fields to qa_inbox table
ALTER TABLE qa_inbox 
ADD COLUMN assigned_to UUID[],
ADD COLUMN reason TEXT,
ADD COLUMN assigned_at TIMESTAMP,
ADD COLUMN requested_by UUID;

-- Add index for filtering by assignee
CREATE INDEX idx_qa_inbox_assigned_to ON qa_inbox USING GIN(assigned_to);

-- Add foreign key for requested_by
ALTER TABLE qa_inbox 
ADD CONSTRAINT fk_qa_inbox_requested_by 
FOREIGN KEY (requested_by) REFERENCES users(id);

-- Update status enum if needed (if using enum type)
-- Or ensure 'needs_review' is valid status value
```

**Rollback:**
```sql
DROP INDEX IF EXISTS idx_qa_inbox_assigned_to;
ALTER TABLE qa_inbox DROP CONSTRAINT IF EXISTS fk_qa_inbox_requested_by;
ALTER TABLE qa_inbox 
DROP COLUMN assigned_to,
DROP COLUMN reason,
DROP COLUMN assigned_at,
DROP COLUMN requested_by;
```

---

### **Runtime API Responsibilities:**

**None** - This phase is admin-only.

---

### **Admin UI Responsibilities:**

**New Component:**
- `src/components/inbox/SMEReviewRequestModal.tsx`

**Features:**
1. Form fields:
   - Question/Answer preview (read-only, scrollable)
   - "What's the concern?" textarea (required, 20-500 chars)
   - Assignee multi-select dropdown:
     - Fetch from `GET /api/admin/members?role=admin,curator`
     - Filtered by tenant
     - Shows: Name, Email, Role
     - Searchable
   - Current assignment display (if already assigned)
2. Validation:
   - Reason required (20-500 chars)
   - At least one assignee required
3. API Integration:
   - Call `POST /api/admin/inbox/{id}/request-review`
   - Handle loading state
   - Handle errors (toast notifications)
   - On success: Close modal, update inbox item UI, show success toast

**Integration Points:**
1. Add "Request SME Review" button to inbox detail panel
2. Show button only when item is pending/unassigned
3. Open modal on button click
4. Update inbox item display after assignment (show badge, assignees)

**New Components:**
- `src/components/inbox/AssignmentBadge.tsx` (display assignees)

**Files to Create/Modify:**
- `src/components/inbox/SMEReviewRequestModal.tsx` (new)
- `src/components/inbox/AssignmentBadge.tsx` (new)
- `src/app/api/admin/inbox/[id]/request-review/route.ts` (new - proxy)
- `src/app/api/admin/members/route.ts` (verify exists - ✅ confirmed, may need role filter enhancement)
- `src/components/inbox/InboxDetailPanel.tsx` (add button + assignment display)
- `src/components/inbox/ModernInboxClient.tsx` (add assignment badge to list)
- `src/components/inbox/LegacyInboxList.tsx` (add assignment badge to list)

**Type Definitions:**
- Add assignment fields to `InboxListItem` type
- Add assignment fields to inbox detail types

**Note on Members Endpoint:**
- `GET /api/admin/members` already exists in Admin UI
- Response uses `user_id` field (not `id`) - Admin UI will map for consistency
- May need to verify/enhance Admin API to support `?role=admin,curator` filter

---

### **Email Notification (Admin API - Async Worker):**

**Task:** Queue email job when assignment happens

**Implementation:**
1. After updating inbox item, queue email job
2. Job type: `send_sme_review_email`
3. Payload:
   ```json
   {
     "inbox_id": "uuid",
     "assignee_id": "uuid",
     "assignee_email": "string",
     "assignee_name": "string",
     "question": "string",
     "answer": "string (truncated)",
     "reason": "string",
     "requester_name": "string",
     "tenant_name": "string"
   }
   ```
4. Email template: See Phase 6 (UI Polish)

**Note:** **Implement in Phase 2** (not deferred to Phase 6) for full functionality. If deferred, document that assignments work but emails are pending.

---

### **Testing Checklist:**

**Admin API:**
- [ ] Request review with valid data
- [ ] Validate missing reason → 400
- [ ] Validate no assignees → 400
- [ ] Validate invalid assignee → 404
- [ ] Validate non-existent inbox item → 404
- [ ] Validate already assigned item → 409 (or allow overwrite per decision)
- [ ] Validate permission (viewer cannot assign) → 403
- [ ] Verify inbox item updated (status, assigned_to, reason, etc.)
- [ ] Verify email job queued
- [ ] GET /admin/members returns correct list
- [ ] GET /admin/members?role=admin,curator filters correctly (verify/enhance)

**Admin UI:**
- [ ] Modal opens/closes correctly
- [ ] Form validation works
- [ ] Assignee dropdown loads and filters correctly
- [ ] Success toast appears
- [ ] Inbox item updates after assignment
- [ ] Assignment badge displays correctly
- [ ] "Request Review" button hidden when already assigned

---

## 📦 **Phase 3: Admin Review - Existing FAQ**

### **Goal:** Allow admins to request SME review for existing FAQs

---

### **Admin API Responsibilities:**

**New Endpoint:**
```
POST /admin/inbox/create-review-request
```

**Request Body:**
```json
{
  "qa_pair_id": "uuid (required)",
  "reason": "string (required, 20-500 chars)",
  "assignees": ["user_uuid"] (required, at least one)
}
```

**Response:**
```json
{
  "ok": true,
  "inbox_id": "uuid",
  "assigned_to": [
    {
      "id": "uuid",
      "email": "string",
      "name": "string (optional)"
    }
  ]
}
```

**Implementation Tasks:**
1. Create route handler in `routes_admin.py`
2. Validate FAQ exists (qa_pair_id)
3. Validate user has permission (admin/curator)
4. Validate request body (qa_pair_id, reason, assignees required)
5. Validate assignees exist and have Admin/Curator role
6. Create new inbox item:
   - Copy question/answer from FAQ
   - Copy citations from FAQ
   - Set `source_type='admin_review'`
   - Set `status='needs_review'`
   - Set `qa_pair_id=qa_pair_id` (link to existing FAQ)
   - Set `assigned_to=assignees`
   - Set `reason=reason`
   - Set `assigned_at=now()`
   - Set `requested_by=current_user_id`
7. Queue email notifications to assignees (async worker)
8. Return inbox_id and assigned_to list

**Error Handling:**
- 400: Validation errors (missing fields, etc.)
- 401: Unauthorized
- 403: User doesn't have permission
- 404: FAQ not found or assignee not found

---

### **Database Migration:**

**File:** `migrations/XXXX_add_qa_pair_id_to_inbox.sql`

**Changes:**
```sql
-- Add qa_pair_id column to qa_inbox table (if not exists)
ALTER TABLE qa_inbox 
ADD COLUMN qa_pair_id UUID;

-- Add foreign key constraint
ALTER TABLE qa_inbox 
ADD CONSTRAINT fk_qa_inbox_qa_pair 
FOREIGN KEY (qa_pair_id) REFERENCES qa_pairs(id);

-- Add index for filtering
CREATE INDEX idx_qa_inbox_qa_pair_id ON qa_inbox(qa_pair_id);
```

**Rollback:**
```sql
DROP INDEX IF EXISTS idx_qa_inbox_qa_pair_id;
ALTER TABLE qa_inbox DROP CONSTRAINT IF EXISTS fk_qa_inbox_qa_pair;
ALTER TABLE qa_inbox DROP COLUMN qa_pair_id;
```

**Note:** If `qa_pair_id` already exists, skip this migration.

---

### **Runtime API Responsibilities:**

**None** - This phase is admin-only.

---

### **Admin UI Responsibilities:**

**Integration Points:**
1. Add "Request Review" button to FAQ detail page
2. Reuse `SMEReviewRequestModal.tsx` (same component)
3. Pre-fill question/answer from FAQ (read-only)
4. On submit, call `POST /api/admin/inbox/create-review-request`
5. Show success toast and refresh FAQ detail (show "Under Review" badge if needed)

**Files to Modify:**
- `src/app/api/admin/inbox/create-review-request/route.ts` (new - proxy)
- `src/components/faq-lifecycle/FAQDetailPanel.tsx` (add button)
- `src/components/faq-lifecycle/FAQManagementClient.tsx` (add button if detail view exists)

**Type Definitions:**
- Add `qa_pair_id` to `InboxListItem` type (if not exists)

---

### **Testing Checklist:**

**Admin API:**
- [ ] Create review request with valid FAQ
- [ ] Validate missing qa_pair_id → 400
- [ ] Validate non-existent FAQ → 404
- [ ] Verify new inbox item created with correct fields
- [ ] Verify qa_pair_id linked correctly
- [ ] Verify email job queued

**Admin UI:**
- [ ] Button appears on FAQ detail page
- [ ] Modal opens with FAQ question/answer pre-filled
- [ ] Success toast appears
- [ ] New inbox item appears in inbox list

---

## 📦 **Phase 4: Assignment Management (Unassign/Reassign)**

### **Goal:** Allow admins to unassign or reassign inbox items

---

### **Admin API Responsibilities:**

**New Endpoint 1:**
```
POST /admin/inbox/{id}/unassign
```

**Request Body:** None (or optional `reason`)

**Response:**
```json
{
  "ok": true,
  "message": "Item unassigned"
}
```

**Implementation Tasks:**
1. Create route handler
2. Validate inbox item exists
3. Validate user has permission (admin only)
4. Validate item is assigned
5. Update inbox item:
   - Set `assigned_to=NULL`
   - Set `reason=NULL`
   - Set `assigned_at=NULL`
   - Set `status='pending'` (if was 'needs_review')
6. Return success

**New Endpoint 2:**
```
POST /admin/inbox/{id}/reassign
```

**Request Body:**
```json
{
  "reason": "string (required, 20-500 chars)",
  "assignees": ["user_uuid"] (required, at least one)
}
```

**Response:**
```json
{
  "ok": true,
  "assigned_to": [
    {
      "id": "uuid",
      "email": "string",
      "name": "string (optional)"
    }
  ]
}
```

**Implementation Tasks:**
1. Create route handler
2. Validate inbox item exists
3. Validate user has permission (admin only)
4. Validate request body (reason, assignees required)
5. Validate assignees exist and have Admin/Curator role
6. Update inbox item:
   - Set `assigned_to=assignees`
   - Set `reason=reason`
   - Set `assigned_at=now()`
   - Set `requested_by=current_user_id`
   - Keep `status='needs_review'`
7. Queue email notifications to new assignees (async worker)
8. Return assigned_to list

**Error Handling:**
- 400: Validation errors
- 401: Unauthorized
- 403: User doesn't have permission (admin only)
- 404: Inbox item not found or assignee not found

---

### **Database Migration:**

**None** - Uses existing assignment fields from Phase 2.

---

### **Runtime API Responsibilities:**

**None** - This phase is admin-only.

---

### **Admin UI Responsibilities:**

**Integration Points:**
1. Add "Unassign" button to inbox detail panel (admin only, shown when assigned)
2. Add "Re-assign" button to inbox detail panel (admin only, shown when assigned)
3. "Unassign" opens confirmation dialog, then calls API
4. "Re-assign" opens `SMEReviewRequestModal.tsx` (reuse component)
5. Update UI after unassign/reassign

**Files to Create/Modify:**
- `src/app/api/admin/inbox/[id]/unassign/route.ts` (new - proxy)
- `src/app/api/admin/inbox/[id]/reassign/route.ts` (new - proxy)
- `src/components/inbox/InboxDetailPanel.tsx` (add buttons)

---

### **Testing Checklist:**

**Admin API:**
- [ ] Unassign valid item
- [ ] Validate non-admin user → 403
- [ ] Validate non-existent item → 404
- [ ] Verify inbox item updated (assigned_to cleared, status reset)
- [ ] Reassign valid item
- [ ] Verify inbox item updated (new assignees, reason, etc.)
- [ ] Verify email job queued for reassign

**Admin UI:**
- [ ] "Unassign" button appears for admins only
- [ ] "Re-assign" button appears for admins only
- [ ] Unassign confirmation works
- [ ] Reassign modal works
- [ ] UI updates after unassign/reassign

---

## 📦 **Phase 5: End-User Feedback Analytics**

### **Goal:** Log end-user negative feedback as analytics signals (NOT inbox items)

---

### **Admin API Responsibilities:**

**None** - This is a Runtime API endpoint.

---

### **Database Migration:**

**File:** `migrations/XXXX_create_feedback_events_table.sql`

**Changes:**
```sql
-- Create feedback_events table
CREATE TABLE feedback_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  question TEXT NOT NULL,
  provided_answer TEXT NOT NULL,
  qa_pair_id UUID,
  doc_ids UUID[],
  user_feedback TEXT,
  conversation_id UUID,
  message_id UUID,
  feedback_type VARCHAR(20) NOT NULL 
    CHECK (feedback_type IN ('thumbs_down', 'not_helpful', 'flag')),
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  
  CONSTRAINT fk_feedback_events_tenant 
    FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  CONSTRAINT fk_feedback_events_qa_pair 
    FOREIGN KEY (qa_pair_id) REFERENCES qa_pairs(id)
);

-- Add indexes
CREATE INDEX idx_feedback_events_tenant_id ON feedback_events(tenant_id);
CREATE INDEX idx_feedback_events_qa_pair_id ON feedback_events(qa_pair_id);
CREATE INDEX idx_feedback_events_created_at ON feedback_events(created_at);
CREATE INDEX idx_feedback_events_feedback_type ON feedback_events(feedback_type);
```

**Rollback:**
```sql
DROP TABLE IF EXISTS feedback_events;
```

---

### **Runtime API Responsibilities:**

**New Endpoint:**
```
POST /api/runtime/feedback
```

**Note:** Confirm endpoint location with Runtime API team - plan shows `/api/runtime/feedback` for consistency with other API routes.

**Request Body:**
```json
{
  "question": "string (required)",
  "provided_answer": "string (required)",
  "qa_pair_id": "uuid (optional)",
  "doc_ids": ["uuid"] (optional),
  "user_feedback": "string (optional, max 500 chars)",
  "conversation_id": "uuid (optional)",
  "message_id": "uuid (optional)"
}
```

**Response:**
```json
{
  "ok": true,
  "feedback_id": "uuid",
  "message": "Feedback recorded"
}
```

**Implementation Tasks:**
1. Create route handler in `routes_runtime.py` (or appropriate runtime routes file)
2. **Confirm endpoint location:** `/api/runtime/feedback` vs `/runtime/feedback` (recommend `/api/runtime/feedback` for consistency)
2. Derive `tenant_id` from authenticated user session (NOT from request body)
3. Validate request body (question, provided_answer required)
4. Determine `feedback_type` from request (default: 'not_helpful')
5. Insert into `feedback_events` table:
   - All provided fields
   - `tenant_id` from session
   - `created_at=now()`
6. Return success immediately (fire-and-forget, non-blocking)
7. **CRITICAL:** Do NOT create inbox item

**Error Handling:**
- 400: Validation errors (missing question/answer)
- 401: Unauthorized (no valid session)
- 500: Database error (log but don't fail user experience)

**Note:** This endpoint should be fast and non-blocking. Consider async logging if needed.

---

### **Admin UI Responsibilities:**

**None** - This is a runtime endpoint called by the widget, not Admin UI.

**Note:** Admin UI will consume this data in Phase 6 (Insights Dashboard - future phase).

---

### **Testing Checklist:**

**Runtime API:**
- [ ] Submit feedback with all fields
- [ ] Submit feedback with minimal fields (question, answer only)
- [ ] Validate missing question → 400
- [ ] Validate missing answer → 400
- [ ] Verify tenant_id derived from session (not body)
- [ ] Verify feedback event inserted into DB
- [ ] **CRITICAL:** Verify NO inbox item created
- [ ] Verify response is fast (< 100ms)

**Database:**
- [ ] Table created correctly
- [ ] Indexes created correctly
- [ ] Foreign keys work correctly

---

## 📦 **Phase 6: UI Polish (Badges, Filters, Email)**

### **Goal:** Enhance UI with badges, filters, and email notifications

---

### **Admin API Responsibilities:**

**Email Notification Worker (if not done in Phase 2):**

**Task:** Implement email sending for SME review requests

**Implementation:**
1. Create email worker job handler
2. Job type: `send_sme_review_email`
3. Fetch inbox item details
4. Fetch assignee details
5. Generate email content:
   - Subject: `New Abilitix review request: "[Question Preview]"`
   - Body: See template below
   - Deep-link: `/admin/inbox?ref={inbox_id}&filter=assigned_to_me`
6. Send email via email service (SendGrid/Postmark/etc.)
7. Log success/failure

**Email Template:**
```
Subject: New Abilitix review request: "[Question Preview - 50 chars]"

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

---

### **Database Migration:**

**None** - Uses existing tables.

---

### **Runtime API Responsibilities:**

**None** - This phase is admin-only.

---

### **Admin UI Responsibilities:**

**1. Source Badges:**
- Create `src/components/inbox/SourceBadge.tsx`
- Display:
  - 🟢 "AI Suggestion" (source_type='auto')
  - 🔵 "Manual Draft" (source_type='manual')
  - 🟡 "Review Request" (source_type='admin_review')
- Add to inbox list and detail panel

**2. Status Badges:**
- Update existing status badges
- Add "Needs Review" badge (status='needs_review')
- Add "Pending" badge (status='pending')

**3. Assignment Badge:**
- Enhance `AssignmentBadge.tsx` (if not done in Phase 2)
- Display:
  - "Assigned to: John Doe" (single)
  - "Assigned to: John Doe +2" (multiple)

**4. Inbox Filters:**
- Add filter dropdown to inbox page:
  - "All" (default)
  - "Pending" (unassigned)
  - "Needs Review" (assigned)
  - "Assigned to Me" (for SMEs)
  - "Manual Drafts" (source_type='manual')
  - "AI Suggestions" (source_type='auto')
- Update filter logic in `ModernInboxClient.tsx` and `LegacyInboxPageClient.tsx`

**5. Inbox List Enhancements:**
- Show source badge in list
- Show status badge in list
- Show assignment badge in list (if assigned)
- Sort by assigned_at (most recent first) when filtered by "Assigned to Me"

**6. Inbox Detail Panel Enhancements:**
- Show source badge
- Show assignment details (assignees, reason, assigned_at, requester)
- Show "Unassign" button (admin only, when assigned)
- Show "Re-assign" button (admin only, when assigned)
- Show "Request Review" button (when unassigned)

**Files to Create/Modify:**
- `src/components/inbox/SourceBadge.tsx` (new)
- `src/components/inbox/AssignmentBadge.tsx` (enhance if exists)
- `src/components/inbox/ModernInboxClient.tsx` (add filters, badges)
- `src/components/inbox/LegacyInboxPageClient.tsx` (add filters, badges)
- `src/components/inbox/InboxDetailPanel.tsx` (add badges, assignment display)
- `src/components/inbox/InboxList.tsx` (add badge columns)
- `src/components/inbox/LegacyInboxList.tsx` (add badge columns)

---

### **Testing Checklist:**

**Admin UI:**
- [ ] Source badges display correctly
- [ ] Status badges display correctly
- [ ] Assignment badges display correctly
- [ ] Filters work correctly
- [ ] "Assigned to Me" filter shows correct items
- [ ] Badges appear in list and detail panel
- [ ] Assignment details display correctly

**Email:**
- [ ] Email sent when assignment happens
- [ ] Email content is correct
- [ ] Deep-link works correctly
- [ ] Email sent asynchronously (non-blocking)

---

## 📊 **Implementation Summary**

| Phase | Admin API | DB Migration | Runtime API | Admin UI | PR Size |
|-------|-----------|--------------|-------------|----------|---------|
| **Phase 1** | POST /admin/inbox/manual | Add source_type | None | Manual FAQ Modal | Medium |
| **Phase 2** | POST /admin/inbox/{id}/request-review<br>GET /admin/members | Add assignment fields | None | Review Request Modal | Medium |
| **Phase 3** | POST /admin/inbox/create-review-request | Add qa_pair_id | None | FAQ Review Button | Small |
| **Phase 4** | POST /admin/inbox/{id}/unassign<br>POST /admin/inbox/{id}/reassign | None | None | Unassign/Reassign Buttons | Small |
| **Phase 5** | None | Create feedback_events | POST /api/runtime/feedback | None | Small |
| **Phase 6** | Email Worker | None | None | Badges, Filters, Polish | Medium |

**Total Estimated Effort:** ~6-10 days (across all components)

---

## 🚀 **Deployment Strategy**

### **Recommended Order:**
1. **Phase 1** → Deploy independently
2. **Phase 2** → Deploy after Phase 1
3. **Phase 3** → Deploy after Phase 2
4. **Phase 4** → Deploy after Phase 2 (can be parallel with Phase 3)
5. **Phase 5** → Deploy independently (no dependencies)
6. **Phase 6** → Deploy after Phases 1-4 (uses all features)

### **Rollback Plan:**
- Each phase is additive (no breaking changes)
- Database migrations are reversible
- Can disable features via feature flags if needed

---

## 📝 **Notes**

1. **Email Notifications:** Can be implemented in Phase 2 or deferred to Phase 6
2. **Insights Dashboard:** Future phase (not in scope for Phase 1-6)
3. **Feature Flags:** Consider adding feature flags for gradual rollout
4. **Testing:** Each phase should have comprehensive tests before merging
5. **Documentation:** Update API docs and user guides as each phase is deployed

---

**Last Updated:** 2025-01-20  
**Status:** Ready for Implementation - Admin API Review Complete ✅

---

## ✅ **Admin API Review - Full Agreement Confirmed**

### **1. Email Notifications ✅**
- **Decision:** Implement in Phase 2 (not deferred to Phase 6)
- **Status:** ✅ Aligned - Email worker should be in Phase 2 for full functionality
- **Action:** Email worker implementation included in Phase 2 tasks

### **2. GET /admin/members Endpoint ✅**
- **Status:** ✅ Endpoint exists at `GET /admin/members` (Admin API Line 5578-5619)
- **Current Response:** `{ "members": [...] }` with `user_id`, `email`, `name`, `role`
- **Action Required (Admin API):** Add `?role=admin,curator` query parameter filter
  - Filter members by role if provided
  - Accept comma-separated roles: `?role=admin,curator`
  - Keep existing behavior if no role filter provided
- **Field Mapping:** Admin UI will map `user_id` → `id` for consistency ✅

### **3. Runtime Feedback Endpoint Location ✅**
- **Decision:** Use `/api/runtime/feedback` (not `/runtime/feedback`)
- **Status:** ✅ Aligned - Consistent with other API routes
- **Action:** Confirm with Runtime API team before Phase 5 implementation

### **4. Permission Model ✅**
- **Status:** ✅ Documented correctly in each phase
  - **Phase 1:** Curator+ (Curator, Admin, Owner)
  - **Phase 2:** Curator+ (Curator, Admin, Owner)
  - **Phase 4:** Admin+ (Admin, Owner only)

### **5. Assignment Conflicts ✅**
- **Decision:** Return 409 Conflict if item already assigned
- **Status:** ✅ Aligned - Proper HTTP status code
- **Action (Admin API):** 
  - Check if item already has `assigned_to` populated
  - Return 409 Conflict with message: `"Item is already assigned. Use reassign endpoint to change assignment."`
  - Use Phase 4 reassign endpoint for reassignment (correct workflow)

---

## 📋 **Admin API Action Items for Phase 2**

1. **Enhance `GET /admin/members` endpoint:**
   - Add optional `?role=admin,curator` query parameter
   - Filter members by role if provided
   - Keep existing behavior if no role filter

2. **Add conflict handling to `POST /admin/inbox/{id}/request-review`:**
   - Check if item already has `assigned_to` populated
   - Return 409 Conflict if already assigned
   - Error message: `"Item is already assigned. Use reassign endpoint to change assignment."`

---

## ✅ **Final Confirmation**

- ✅ Email notifications: Phase 2
- ✅ Members endpoint: Exists, needs role filter enhancement (Admin API action item)
- ✅ Runtime endpoint: `/api/runtime/feedback`
- ✅ Permission model: Documented correctly
- ✅ Conflict handling: 409 Conflict for already-assigned items (Admin API action item)

**Status:** ✅ **Ready to proceed - Plan is aligned and implementation-ready!**

