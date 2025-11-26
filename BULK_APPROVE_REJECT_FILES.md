# Bulk Approve & Reject - Files for Preview Deployment

**Feature:** Bulk Approve and Bulk Reject for Inbox/Review Folder  
**Branch:** preview  
**Status:** Ready to commit and deploy

---

## 📋 **Files to Commit**

### **1. New API Routes (Untracked - Need to Add)**

#### `src/app/api/admin/inbox/bulk-approve/route.ts`
- **Status:** ✅ New file (untracked)
- **Purpose:** API route proxy for bulk approve endpoint
- **Features:**
  - Validates request body (ids array required)
  - Forwards to Admin API `/admin/inbox/bulk-approve`
  - Supports optional `as_faq: true` parameter
  - Error handling and response forwarding

#### `src/app/api/admin/inbox/bulk-reject/route.ts`
- **Status:** ✅ New file (untracked)
- **Purpose:** API route proxy for bulk reject endpoint
- **Features:**
  - Validates request body (ids array required)
  - Forwards to Admin API `/admin/inbox/bulk-reject`
  - Error handling and response forwarding

---

### **2. Modified UI Components**

#### `src/components/inbox/ModernInboxClient.tsx`
- **Status:** ✅ Modified (not staged)
- **Changes:**
  - Added bulk selection state (`selectedIds`, `bulkActionLoading`)
  - Added `handleToggleSelect` - Toggle individual item selection
  - Added `handleSelectAll` - Select/deselect all items on current page
  - Added `clearSelection` - Clear all selections
  - Added `handleBulkApprove` - Bulk approve handler with confirmation
  - Added `handleBulkReject` - Bulk reject handler with confirmation
  - Added bulk actions toolbar UI (shows when items selected)
  - Added "Bulk Approve" and "Bulk Reject" buttons
  - Integrated selection clearing on filter changes and refresh
  - Added imports: `CheckCircle2`, `XCircle`, `Loader2` from lucide-react

#### `src/components/inbox/InboxList.tsx`
- **Status:** ✅ Modified (not staged)
- **Changes:**
  - Added bulk selection props to component interface:
    - `selectedIds?: Set<string>`
    - `onToggleSelect?: (id: string) => void`
    - `onSelectAll?: () => void`
    - `bulkActionLoading?: boolean`
  - Added checkbox column in table header (select all)
  - Added checkbox column in each table row (individual selection)
  - Conditional rendering (only shows checkboxes when props provided)
  - Disabled state during bulk operations

---

## 🎯 **Git Commands to Stage and Commit**

```bash
# Navigate to repo
cd "C:\Jasdip\Business Planning and Development\Development Folder\ask-abilitix-admin-ui"

# Stage new API route files
git add src/app/api/admin/inbox/bulk-approve/route.ts
git add src/app/api/admin/inbox/bulk-reject/route.ts

# Stage modified UI components
git add src/components/inbox/ModernInboxClient.tsx
git add src/components/inbox/InboxList.tsx

# Verify what will be committed
git status

# Commit with descriptive message
git commit -m "feat: Add bulk approve and bulk reject for inbox review folder

- Add bulk-approve API route with optional as_faq support
- Add bulk-reject API route
- Add checkbox selection UI to InboxList component
- Add bulk actions toolbar with approve/reject buttons
- Add selection management (toggle, select all, clear)
- Add confirmation dialogs and error handling
- Auto-refresh list after bulk operations
- Clear selection on filter changes and refresh"
```

---

## 📦 **Summary of Changes**

### **New Files (2):**
1. `src/app/api/admin/inbox/bulk-approve/route.ts`
2. `src/app/api/admin/inbox/bulk-reject/route.ts`

### **Modified Files (2):**
1. `src/components/inbox/ModernInboxClient.tsx`
2. `src/components/inbox/InboxList.tsx`

### **Total Files:** 4 files (2 new, 2 modified)

---

## ✅ **Feature Completeness**

- ✅ API routes implemented
- ✅ UI components updated
- ✅ Selection management working
- ✅ Bulk actions toolbar functional
- ✅ Confirmation dialogs added
- ✅ Error handling implemented
- ✅ Loading states added
- ✅ Auto-refresh after operations
- ✅ Selection clearing on filter/refresh

---

## 🚀 **Ready for Preview Deployment**

All files are ready to be committed and deployed to preview branch.







