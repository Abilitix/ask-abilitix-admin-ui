# FAQ Engine - UI Polish Items Remaining

**Date:** 2025-01-20  
**Status:** Phase 4 Core Complete | Phase 4 Polish Pending | Phase 5 Pending  
**Reference:** Admin API FAQ Engine Plan Status

---

## 📊 **Overall Status**

### **Backend (Admin API):**
- ✅ Phase 1-4: **100% Complete** (All 4 phases deployed)
- ⏳ Phase 5: **Pending** (Document-to-FAQ Cascade - HIGH priority)
- ⏳ Phase 6: **Deferred** (Q&A Lifecycle Management - Low priority)

### **Admin UI:**
- ✅ Phase 1-3 Core: **100% Complete** (List, Single Actions, Bulk Actions)
- ⏳ Phase 4 Polish: **~70% Complete** (Core features done, enhancements pending)
- ⏳ Phase 5 UI Support: **Pending** (Waiting for backend)

---

## ⏳ **Phase 4: Polish Items Remaining**

### **1. FAQ Detail View (Expandable/Modal)** ⏳
**Status:** Not implemented  
**Priority:** Medium  
**Effort:** 2-3 hours

**Current State:**
- Table shows truncated question/answer (60/80 chars)
- No way to view full FAQ details without editing

**Needed:**
- Expandable row or modal to view full FAQ
- Show complete question, answer, citations
- Show metadata (created date, archived date, superseded_by)
- Read-only view (no editing)

**Implementation:**
- Add expand/collapse button per row
- Or click row to open detail modal
- Display full content in formatted view

---

### **2. Enhanced Supersede Relationship Display** ⏳
**Status:** Partially done  
**Priority:** Medium  
**Effort:** 1-2 hours

**Current State:**
- Shows `superseded_by` ID as text
- No link or context about the superseding FAQ

**Needed:**
- Clickable link to the superseding FAQ
- Show question text of superseding FAQ (in tooltip or inline)
- Better visual indication of relationship
- Option to navigate to superseding FAQ

**Implementation:**
- Make `superseded_by` ID clickable
- Fetch superseding FAQ details on hover/click
- Show tooltip with question text
- Add "View Superseding FAQ" button

---

### **3. Navigation Links (Inbox ↔ FAQ Management)** ⏳
**Status:** Not implemented  
**Priority:** Low  
**Effort:** 1 hour

**Current State:**
- Separate pages with no cross-linking
- Users must manually navigate between pages

**Needed:**
- Link from Inbox item to FAQ Management (if promoted as FAQ)
- Link from FAQ Management to Inbox (if created from inbox)
- Contextual links showing relationship

**Implementation:**
- Add "View in FAQ Management" link in Inbox detail panel (if `is_faq=true`)
- Add "View in Inbox" link in FAQ detail view (if source is inbox)
- Track source relationship in FAQ metadata

---

### **4. Loading Skeletons** ⏳
**Status:** Basic loading exists  
**Priority:** Low  
**Effort:** 1 hour

**Current State:**
- Simple spinner during loading
- No skeleton loaders for table rows

**Needed:**
- Skeleton loaders matching table structure
- Better perceived performance
- More polished loading experience

**Implementation:**
- Create skeleton component matching table layout
- Show 5-10 skeleton rows during initial load
- Use shadcn/ui skeleton components

---

### **5. Enhanced Empty States** ⏳
**Status:** Basic empty states exist  
**Priority:** Low  
**Effort:** 30 minutes

**Current State:**
- Simple "No FAQs found" message
- Basic guidance

**Needed:**
- More helpful messages
- First-time user guidance
- Actionable CTAs (e.g., "Go to Inbox to create FAQs")

**Implementation:**
- Different messages for different filter states
- Add helpful icons and illustrations
- Include links to related actions

---

### **6. Error Retry Mechanisms** ⏳
**Status:** Basic error handling exists  
**Priority:** Low  
**Effort:** 1-2 hours

**Current State:**
- Error message with retry button
- Manual retry only

**Needed:**
- Automatic retry with exponential backoff
- Better error recovery
- Network error detection and handling

**Implementation:**
- Add automatic retry logic for network errors
- Exponential backoff (1s, 2s, 4s, 8s)
- Max 3 retries before showing error
- Better error categorization

---

## ⏳ **Phase 5: Document-to-FAQ Cascade - UI Support**

### **Status:** Waiting for Backend Implementation  
**Priority:** HIGH (when backend is ready)  
**Effort:** 2-3 hours

**Backend Requirements (Pending):**
- Add `suspended` status to database schema
- Create `CascadeDocumentArchive` worker job
- Update document archive endpoint

**UI Requirements (When Backend Ready):**

### **1. Suspended Status Display** ⏳
**Status:** Not implemented  
**Priority:** High (when backend ready)

**Needed:**
- Add `suspended` status badge (🟠 Suspended - orange/yellow)
- Show warning icon and tooltip
- Tooltip: "This FAQ was suspended because its source document was archived"
- Filter option for suspended FAQs
- Visual distinction from other statuses

**Implementation:**
- Add `suspended` to status filter dropdown
- Add suspended badge styling
- Add tooltip with explanation
- Update status badge component

### **2. Document Archive Warning** ⏳
**Status:** Not implemented  
**Priority:** High (when backend ready)

**Needed:**
- Warning in document archive flow
- Show count of FAQs that will be suspended
- Confirmation dialog with FAQ list
- Link to FAQ Management page

**Implementation:**
- Update document archive UI
- Fetch FAQs for document before archiving
- Show warning with FAQ count
- Add confirmation step

### **3. Suspended FAQ Actions** ⏳
**Status:** Not implemented  
**Priority:** Medium (when backend ready)

**Needed:**
- Allow reactivating suspended FAQs (if document restored)
- Show "Source document archived" message
- Link to document management

**Implementation:**
- Add "Reactivate" action for suspended FAQs
- Show source document link
- Handle document restoration cascade

---

## 📋 **Summary of Remaining Work**

### **Phase 4 Polish (UI Enhancements):**
| Item | Priority | Effort | Status |
|------|----------|--------|--------|
| FAQ Detail View | Medium | 2-3h | ⏳ Pending |
| Enhanced Supersede Display | Medium | 1-2h | ⏳ Pending |
| Navigation Links | Low | 1h | ⏳ Pending |
| Loading Skeletons | Low | 1h | ⏳ Pending |
| Enhanced Empty States | Low | 30m | ⏳ Pending |
| Error Retry Mechanisms | Low | 1-2h | ⏳ Pending |
| **Total Phase 4 Polish** | | **6-9 hours** | |

### **Phase 5 UI Support (When Backend Ready):**
| Item | Priority | Effort | Status |
|------|----------|--------|--------|
| Suspended Status Display | High | 1-2h | ⏳ Waiting for backend |
| Document Archive Warning | High | 1h | ⏳ Waiting for backend |
| Suspended FAQ Actions | Medium | 1h | ⏳ Waiting for backend |
| **Total Phase 5 UI** | | **3-4 hours** | |

---

## 🎯 **Recommended Priority Order**

### **Immediate (Can do now):**
1. **FAQ Detail View** (2-3h) - Most user value
2. **Enhanced Supersede Display** (1-2h) - Improves UX

### **Next (When time permits):**
3. **Navigation Links** (1h) - Quick win
4. **Loading Skeletons** (1h) - Polish
5. **Enhanced Empty States** (30m) - Quick polish

### **Later (Nice to have):**
6. **Error Retry Mechanisms** (1-2h) - Reliability improvement

### **When Backend Ready (Phase 5):**
7. **Suspended Status Support** (3-4h) - Critical governance feature

---

## 📝 **Notes**

1. **Phase 4 Core is 100% complete** - All essential features working
2. **Polish items are enhancements** - Not blockers, improve UX
3. **Phase 5 is critical** - Addresses governance gap (archived docs → active FAQs)
4. **Can implement incrementally** - Each item is independent
5. **Total remaining effort:** ~9-13 hours (Phase 4 polish + Phase 5 UI)

---

**Last Updated:** 2025-01-20  
**Next Review:** When Phase 5 backend is ready, or when prioritizing Phase 4 polish items







