# FAQ Lifecycle Management - Admin UI Understanding & Confirmation

**Date:** 2025-11-22  
**Status:** ✅ Understanding Confirmed - Ready for Implementation  
**Reference:** Admin API communication document - FAQ Lifecycle Management Integration Guide

---

## ✅ **CONFIRMED UNDERSTANDING**

### **1. Scope & Page**

- ✅ **New Page Required:** `/admin/faqs` - "FAQ Lifecycle Management" or "FAQ Management"
- ✅ **Purpose:** Manage existing FAQs only (not create new ones - that's done via Inbox)
- ✅ **Focus:** Only FAQs where `is_faq = true` (not general Q&A)
- ✅ **Navigation:** Add to Admin UI navigation/sidebar

### **2. API Endpoints (9 Total - Deployed & Ready)**

Based on Admin API communication:

#### **List & Filter:**
1. ✅ `GET /admin/faqs` - List FAQs with filters:
   - Query params: `?status=active|archived|superseded|all`
   - Returns: `{ items: FAQ[], total: number, limit: number, offset: number }`
   - FAQ object includes: `id`, `question`, `answer`, `status`, `archived_at`, `superseded_by`, `created_at`, `citations`, `is_faq`

#### **Single Actions:**
2. ✅ `POST /admin/faqs/{id}/archive` - Archive single FAQ
   - Returns: `{ ok: true, faq_id: "uuid", status: "archived", archived_at: "..." }`
3. ✅ `POST /admin/faqs/{id}/unarchive` - Unarchive single FAQ
   - Returns: `{ ok: true, faq_id: "uuid" }`
4. ✅ `POST /admin/faqs/supersede` - Supersede FAQs
   - Body: `{ new_faq_id: "uuid", obsolete_faq_ids: ["uuid1", "uuid2"], reason?: "optional" }`
   - Can supersede multiple obsolete FAQs with one new FAQ
   - Returns: `{ ok: true, new_faq_id: "uuid", obsolete_faq_ids: ["uuid1", "uuid2"] }`

#### **Bulk Actions:**
5. ✅ `POST /admin/faqs/bulk-archive` - Bulk archive
   - Body: `{ ids: ["uuid1", "uuid2", ...] }`
   - Max batch size: 200 IDs
   - Returns: `{ ok: true, processed: [...], skipped: [...], errors: [...] }`
6. ✅ `POST /admin/faqs/bulk-unarchive` - Bulk unarchive
   - Body: `{ ids: ["uuid1", "uuid2", ...] }`
   - Max batch size: 200 IDs
   - Returns: `{ ok: true, processed: [...], skipped: [...], errors: [...] }`
7. ✅ `POST /admin/faqs/bulk-supersede` - Bulk supersede
   - Body: `{ new_faq_id: "uuid", obsolete_ids: ["uuid1", "uuid2", ...] }`
   - Max batch size: 200 IDs
   - Returns: `{ ok: true, processed: [...], skipped: [...], errors: [...] }`

#### **Bulk Inbox Operations (Note: These are for Inbox page, not FAQ page):**
8. ✅ `POST /admin/inbox/bulk-approve` - Bulk approve inbox items (with `as_faq: true` option)
9. ✅ `POST /admin/inbox/bulk-reject` - Bulk reject inbox items

### **3. Status Semantics**

- ✅ **`active`** = Live FAQ (used by runtime, visible to users)
- ✅ **`archived`** = Hidden from runtime, can be restored (unarchive)
- ✅ **`superseded`** = Replaced by another FAQ, read-only/history view

### **4. Required UI Components**

#### **Phase 1: Basic List View**
- ✅ FAQ List Table with columns:
  - Question (truncated with expand)
  - Answer preview (truncated)
  - Status badge (active/archived/superseded)
  - Created date / Last modified
  - Actions dropdown (Archive/Unarchive/Supersede)
- ✅ Status Filter (tabs or dropdown): All | Active | Archived | Superseded
- ✅ Search bar (question/answer text search)
- ✅ Pagination controls

#### **Phase 2: Single Actions**
- ✅ Action buttons per FAQ row:
  - Archive button (if active)
  - Unarchive button (if archived)
  - Supersede button (if active) - opens modal to select replacement FAQ
- ✅ Confirmation dialogs for destructive actions
- ✅ Toast notifications for success/error
- ✅ Loading states during actions

#### **Phase 3: Bulk Actions**
- ✅ Checkbox selection (select all / individual)
- ✅ Bulk Actions Toolbar (appears when items selected):
  - Bulk Archive
  - Bulk Unarchive
  - Bulk Supersede
- ✅ Selection count display
- ✅ Confirmation dialog for bulk actions

#### **Phase 4: Polish**
- ✅ Empty states (no FAQs, no search results)
- ✅ Loading skeletons
- ✅ Error handling & retry
- ✅ FAQ detail view (expandable or modal)
- ✅ Supersede relationship display (which FAQ replaced this one)

### **5. User Flows**

#### **Archive Flow:**
```
1. User views FAQ list (status: active)
2. Clicks "Archive" on FAQ row
3. Confirmation dialog appears
4. User confirms
5. API call: POST /admin/faqs/{id}/archive
6. FAQ status changes to "archived"
7. FAQ disappears from "Active" view
8. Success toast: "FAQ archived"
```

#### **Unarchive Flow:**
```
1. User views FAQ list (status: archived)
2. Clicks "Unarchive" on FAQ row
3. Confirmation dialog appears
4. User confirms
5. API call: POST /admin/faqs/{id}/unarchive
6. FAQ status changes to "active"
7. FAQ appears in "Active" view
8. Success toast: "FAQ unarchived"
```

#### **Supersede Flow:**
```
1. User selects one or more FAQs (checkboxes) - these become "Obsolete FAQs"
2. Clicks "Supersede" button (bulk action or per-row)
3. Modal opens with:
   - Selected "Obsolete FAQs" listed (from table selection)
   - "New FAQ" searchable dropdown (to select the replacement FAQ)
   - Optional "Reason" text field
4. User selects "New FAQ" from searchable dropdown
5. User confirms
6. API call: POST /admin/faqs/supersede
   Body: { new_faq_id: "...", obsolete_faq_ids: ["...", "..."], reason?: "..." }
7. Selected FAQs status changes to "superseded"
8. New FAQ remains "active"
9. Success toast: "X FAQs superseded by [New FAQ]"
```

#### **Bulk Archive Flow:**
```
1. User selects multiple FAQs (checkboxes)
2. Bulk actions toolbar appears
3. User clicks "Bulk Archive"
4. Confirmation dialog: "Archive 5 FAQs?"
5. User confirms
6. API call: POST /admin/faqs/bulk-archive
   Body: { faq_ids: ["...", "..."] }
7. All selected FAQs archived
8. Success toast: "5 FAQs archived"
9. Selection cleared
```

### **6. Out of Scope (Confirmed)**

- ❌ No lifecycle UI for non-FAQ Q&A (`is_faq=false`)
- ❌ No mixed FAQ/Q&A view (that's future "Q&A Management" page - Phase 5)
- ❌ No FAQ creation/editing (handled via Inbox "Promote as FAQ")
- ❌ No direct FAQ editing (use "Supersede" to create new version)

---

## ❓ **QUESTIONS FOR CLARIFICATION**

### **1. Supersede Workflow Details:** ✅ CONFIRMED
- ✅ Modal with searchable dropdown to select "New FAQ" (the one that supersedes)
- ✅ Can select multiple "Obsolete FAQs" (checkboxes) - one new FAQ can supersede multiple old FAQs
- ✅ Optional "Reason" text field
- ✅ Show `superseded_by` link/ID for superseded FAQs (read-only/history)
- ✅ Superseded FAQs are read-only (cannot be unarchived)

### **2. FAQ Display:** ✅ CONFIRMED
- ✅ Columns: Question, Answer (truncated), Status, Created Date, Actions
- ✅ Status badges: 🟢 Active (green), 🟡 Archived (yellow), 🔴 Superseded (red)
- ✅ Show `archived_at` timestamp for archived FAQs
- ✅ Show `superseded_by` link/ID for superseded FAQs (tooltip: "Superseded by: [FAQ ID/Question]")
- ✅ Archived/superseded FAQs are read-only (cannot be edited)

### **3. Bulk Actions:** ✅ CONFIRMED
- ✅ Maximum batch size: 200 IDs per request
- ✅ Response includes: `processed`, `skipped`, `errors` arrays
- ✅ Should display batch operation results (show which succeeded/failed)
- ✅ Show selected count: "Selected: 2"

### **4. Search & Filters:** ✅ CONFIRMED
- ✅ Status filter: Confirmed (active/archived/superseded/all)
- ✅ Search: Simple submit on Enter/button click (not debounced live search) - v1 approach
- ✅ Other filters: Not needed for v1 (can enhance later)

### **5. Navigation & Integration:** ✅ CONFIRMED
- ✅ Navigation placement: Group with Inbox/Docs under "Knowledge" or "Content" section
- ✅ This is a core knowledge-governance page, not secondary
- ✅ Links: Can add Inbox ↔ FAQ Management links later (not blocking Phase 1)

### **6. API Response Formats:** ✅ CONFIRMED
- ✅ `GET /admin/faqs` response:
  ```typescript
  {
    items: FAQ[],
    total: number,
    limit: number,
    offset: number
  }
  ```
- ✅ FAQ object:
  ```typescript
  {
    id: string,
    question: string,
    answer: string,
    status: 'active' | 'archived' | 'superseded',
    archived_at: string | null,
    superseded_by: string | null,
    created_at: string,
    citations: [...],
    is_faq: true
  }
  ```
- ✅ Error response (409 Conflict):
  ```typescript
  {
    detail: {
      error: {
        code: "already_archived",
        message: "FAQ is already archived"
      }
    }
  }
  ```
- ✅ Error codes to handle: `self_supersession`, `invalid_uuid`, `faq_not_found`, `no_obsolete_faqs_found`, `already_archived`, `invalid_status_transition`, `max_batch_size_exceeded`, `ids list cannot be empty`

### **7. Permissions:** ✅ CONFIRMED
- ✅ Treat all roles identically in UI (backend enforces permissions)
- ✅ Backend returns 403 for unauthorized attempts
- ✅ Simpler UI approach - no need to hide buttons or show "Admin Only" tooltips
- ✅ Backend handles permission enforcement

### **8. Timeline Confirmation:** ✅ CONFIRMED
- ✅ **Week 1:** Create page, implement list view with status filter
- ✅ **Week 2:** Implement single actions (archive, unarchive, supersede)
- ✅ **Week 3:** Implement bulk actions
- ✅ **Week 4:** Testing, polish, and release

---

## 📋 **IMPLEMENTATION PLAN (Pending Confirmation)**

### **Phase 1: Basic List View (Week 1)**
- [ ] Create `/admin/faqs` page route
- [ ] Create `FAQManagementClient` component
- [ ] Implement `GET /admin/faqs` API route proxy
- [ ] Build FAQ list table with columns
- [ ] Add status filter (tabs/dropdown)
- [ ] Add search functionality
- [ ] Add pagination
- [ ] Add empty states
- [ ] Add loading states

### **Phase 2: Single Actions (Week 2)**
- [ ] Implement Archive action (API route + UI)
- [ ] Implement Unarchive action (API route + UI)
- [ ] Implement Supersede action (API route + UI + modal)
- [ ] Add confirmation dialogs
- [ ] Add toast notifications
- [ ] Add error handling
- [ ] Update list after actions

### **Phase 3: Bulk Actions (Week 3)**
- [ ] Add checkbox selection to list
- [ ] Add "Select All" functionality
- [ ] Build bulk actions toolbar
- [ ] Implement bulk archive
- [ ] Implement bulk unarchive
- [ ] Implement bulk supersede
- [ ] Add bulk confirmation dialogs
- [ ] Add progress feedback

### **Phase 4: Polish (Week 4)**
- [ ] Add FAQ detail view (expandable/modal)
- [ ] Show supersede relationships
- [ ] Improve empty states
- [ ] Add loading skeletons
- [ ] Add error retry mechanisms
- [ ] Add navigation links
- [ ] Final testing
- [ ] Documentation

---

## 🎯 **NEXT STEPS**

1. ✅ **Review Admin API communication document** - Complete
2. ✅ **Get answers to clarification questions** - All answered
3. ✅ **Confirm API response formats** - Confirmed
4. ✅ **Start Phase 1 implementation** - **100% PROCEED - No blockers!**

---

## 📝 **NOTES**

- Following existing patterns from Inbox and Documents pages
- Using shadcn/ui components for consistency
- Server-side API routes for Admin API proxying
- Client components for interactive UI
- TypeScript types for all API responses

---

**Status:** ✅ **ALL CLARIFICATIONS RECEIVED - READY TO PROCEED**  
**Ready to start:** ✅ **YES - Phase 1 can begin immediately**

### **Confirmed Clarifications:**
- ✅ Search: Simple submit (Enter/button) - v1 approach
- ✅ Navigation: Group with Inbox/Docs under "Knowledge" or "Content" section
- ✅ Permissions: Treat all roles identically (backend enforces)
- ✅ Supersede: Use table selection for obsolete FAQs, searchable dropdown for new FAQ
- ✅ **100% proceed - None of these questions block Phase 1**

