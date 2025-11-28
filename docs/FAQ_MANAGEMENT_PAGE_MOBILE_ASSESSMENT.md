# FAQ Management Page Mobile Responsiveness Assessment

**Page**: `/admin/faqs`  
**Date**: 2025-11-28  
**Status**: ⚠️ Not Mobile Ready (Estimated 20%)

---

## Page Structure

### Components
1. **Main Page** (`src/app/admin/faqs/page.tsx`)
   - Container with padding
   - Page header with title

2. **FAQManagementClient** (`src/components/faq-lifecycle/FAQManagementClient.tsx`)
   - Filters card (Status, Search, Document filter, Refresh)
   - FAQ List card (Bulk selection bar, Table, Pagination)
   - Supersede Modal
   - Confirmation Dialog

---

## P0 Issues (Critical - Mobile Broken)

### 1. Page Container Padding
**File**: `src/app/admin/faqs/page.tsx`  
**Line**: 11

**Issue**: Padding is `p-6` which may be too large on mobile.

**Current Code**:
```tsx
<div className="container mx-auto p-6 space-y-6">
```

**Fix Required**:
- Responsive padding: `p-3 sm:p-4 md:p-6`
- Responsive spacing: `space-y-4 sm:space-y-6`

**Effort**: 15 minutes

---

### 2. Page Header - Title Layout
**File**: `src/app/admin/faqs/page.tsx`  
**Lines**: 12-14

**Issue**: Title has fixed size `text-3xl` which may be too large on mobile.

**Current Code**:
```tsx
<h1 className="text-3xl font-bold">FAQ Lifecycle Management</h1>
```

**Fix Required**:
- Responsive title sizing: `text-xl sm:text-2xl md:text-3xl`

**Effort**: 15 minutes

---

### 3. Filters Card - Layout
**File**: `src/components/faq-lifecycle/FAQManagementClient.tsx`  
**Lines**: 612-713

**Issue**: Filters have `flex flex-col sm:flex-row` which is good, but Select dropdowns and inputs need touch targets.

**Current Code**:
```tsx
<div className="flex flex-col sm:flex-row gap-4">
  <div className="flex-1">
    <Label htmlFor="status-filter">Status</Label>
    <Select id="status-filter" ...>
  </div>
  <div className="flex-1">
    <Label htmlFor="search-input">Search</Label>
    <div className="flex gap-2">
      <Input ... />
      <Button ...>
```

**Fix Required**:
- Add `min-h-[44px]` to Select dropdowns
- Add `min-h-[44px]` to Input fields
- Add `min-h-[44px]` to Search button
- Add `min-h-[44px]` to Refresh button
- Ensure document filter dropdown items have touch targets

**Effort**: 30 minutes

---

### 4. FAQ Table - No Mobile View
**File**: `src/components/faq-lifecycle/FAQManagementClient.tsx`  
**Lines**: 798-907

**Issue**: Table with 6 columns (Checkbox, Question, Answer, Status, Created, Actions) will overflow on mobile, causing horizontal scrolling.

**Current Code**:
```tsx
<div className="overflow-x-auto">
  <table className="w-full border-collapse">
    <thead>
      <tr className="border-b">
        <th className="p-3 w-10">...</th>
        <th>Question</th>
        <th>Answer</th>
        <th>Status</th>
        <th>Created</th>
        <th>Actions</th>
      </tr>
    </thead>
    <tbody>
      {faqs.map((faq) => (
        <tr>
          {/* Table cells */}
        </tr>
      ))}
    </tbody>
  </table>
</div>
```

**Fix Required**:
- Add responsive table/card toggle (similar to inbox and documents pages)
- Hide table on mobile: `hidden lg:table`
- Show cards on mobile: `lg:hidden`
- Create mobile card component displaying:
  - Checkbox
  - Question (truncated)
  - Answer preview (truncated)
  - Status badge
  - Created date
  - Actions button (opens bottom sheet)

**Effort**: 4-5 hours

---

### 5. Bulk Selection Bar
**File**: `src/components/faq-lifecycle/FAQManagementClient.tsx`  
**Lines**: 754-797

**Issue**: Bulk action buttons may need mobile optimization.

**Current Code**:
```tsx
<div className="rounded-md border border-slate-200 bg-slate-50 p-3 text-sm flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
  <div className="font-medium text-slate-700">
    {selectedIds.size} selected
  </div>
  <div className="flex flex-wrap gap-2">
    <Button size="sm" ...>Archive</Button>
    <Button size="sm" ...>Unarchive</Button>
    <Button size="sm" ...>Supersede</Button>
    <Button size="sm" ...>Clear selection</Button>
  </div>
</div>
```

**Fix Required**:
- Ensure buttons have `min-h-[44px]` touch targets
- Ensure buttons stack properly on mobile
- Make buttons full-width on mobile: `w-full sm:w-auto`

**Effort**: 30 minutes

---

### 6. Table Checkboxes - Touch Targets
**File**: `src/components/faq-lifecycle/FAQManagementClient.tsx`  
**Lines**: 803-810, 823-829

**Issue**: Checkboxes are `h-4 w-4` which is too small for mobile touch.

**Current Code**:
```tsx
<input
  ref={selectAllRef}
  type="checkbox"
  className="h-4 w-4"
  ...
/>
```

**Fix Required**:
- Wrap checkboxes in label with `min-h-[44px]` for touch target
- Similar pattern to inbox checkbox fix

**Effort**: 30 minutes

---

### 7. Action Buttons in Table
**File**: `src/components/faq-lifecycle/FAQManagementClient.tsx`  
**Lines**: 856-901

**Issue**: Action buttons (Archive, Supersede, Unarchive) are `size="sm"` which may be too small for mobile.

**Current Code**:
```tsx
<div className="flex gap-2">
  <Button size="sm" variant="outline" ...>
    <Archive className="h-3 w-3 mr-1" />
    Archive
  </Button>
  ...
</div>
```

**Fix Required**:
- Ensure buttons have `min-h-[44px]` touch targets
- On mobile, replace with "Actions" button that opens bottom sheet (similar to inbox)
- Desktop: keep inline buttons

**Effort**: 1 hour (part of table-to-card conversion)

---

### 8. Pagination Buttons
**File**: `src/components/faq-lifecycle/FAQManagementClient.tsx`  
**Lines**: 910-933

**Issue**: Pagination buttons are `size="sm"` which may be too small for mobile.

**Current Code**:
```tsx
<Button variant="outline" size="sm" ...>
  Previous
</Button>
<Button variant="outline" size="sm" ...>
  Next
</Button>
```

**Fix Required**:
- Add `min-h-[44px]` to pagination buttons
- Ensure buttons are full-width on mobile: `w-full sm:w-auto`
- Stack pagination info and buttons vertically on mobile if needed

**Effort**: 30 minutes

---

### 9. Supersede Modal - Mobile Optimization
**File**: `src/components/faq-lifecycle/FAQManagementClient.tsx`  
**Lines**: 940-1016

**Issue**: Modal may not be mobile-friendly (similar to other modals we fixed).

**Current Code**:
```tsx
<div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 p-4">
  <div className="flex min-h-full items-center justify-center">
    <Card className="w-full max-w-4xl ...">
```

**Fix Required**:
- Add responsive padding: `p-3 sm:p-4`
- Ensure modal content is scrollable on mobile
- Ensure buttons have 44px touch targets
- Ensure FAQ selection buttons have 44px touch targets
- Make modal full-height on mobile: `max-h-[calc(100vh-2rem)]`

**Effort**: 1 hour

---

### 10. Document Filter Dropdown - Touch Targets
**File**: `src/components/faq-lifecycle/FAQManagementClient.tsx`  
**Lines**: 649-704

**Issue**: Document filter dropdown items may not have proper touch targets.

**Current Code**:
```tsx
<button
  key={doc.id}
  onClick={() => handleDocSelect(doc)}
  className="w-full text-left px-3 py-2 hover:bg-slate-50 text-sm border-b last:border-b-0"
>
  {doc.title}
</button>
```

**Fix Required**:
- Add `min-h-[44px]` to dropdown items
- Ensure proper padding for touch targets

**Effort**: 15 minutes

---

## P1 Issues (High - Poor UX)

### 1. Search Input and Button Layout
**File**: `src/components/faq-lifecycle/FAQManagementClient.tsx`  
**Lines**: 634-645

**Issue**: Search input and button are in a flex row that may need mobile optimization.

**Fix Required**:
- Stack vertically on mobile if needed
- Ensure button is full-width on mobile

**Effort**: 15 minutes

---

### 2. Document Filter Clear Button
**File**: `src/components/faq-lifecycle/FAQManagementClient.tsx`  
**Lines**: 656-663

**Issue**: Clear button is `size="sm"` and `h-9` which may be too small.

**Fix Required**:
- Add `min-h-[44px]` touch target

**Effort**: 15 minutes

---

### 3. Refresh Button
**File**: `src/components/faq-lifecycle/FAQManagementClient.tsx`  
**Line**: 709

**Issue**: Refresh button may need touch target optimization.

**Fix Required**:
- Add `min-h-[44px]` touch target

**Effort**: 15 minutes

---

## P2 Issues (Medium - Nice to Have)

### 1. Pull-to-Refresh
**Issue**: Add pull-to-refresh gesture for FAQ list on mobile.

**Effort**: 2-3 hours

---

### 2. Swipe Actions
**Issue**: Add swipe-to-archive gesture on mobile cards.

**Effort**: 2-3 hours

---

## P3 Issues (Low - Polish)

### 1. Loading States
**Issue**: Add skeleton loaders for better perceived performance.

**Effort**: 1 hour

---

### 2. Empty States
**Issue**: Improve empty state messaging and visuals.

**Effort**: 30 minutes

---

## Summary

### P0 Issues (Critical)
1. ✅ Page container padding
2. ✅ Page header layout
3. ✅ Filters card layout and touch targets
4. ✅ FAQ table → mobile card view
5. ✅ Bulk selection bar
6. ✅ Table checkboxes touch targets
7. ✅ Action buttons in table (part of card conversion)
8. ✅ Pagination buttons
9. ✅ Supersede modal mobile optimization
10. ✅ Document filter dropdown touch targets

**Total P0 Effort**: ~8-9 hours

### P1 Issues (High)
1. Search input and button layout
2. Document filter clear button
3. Refresh button touch target

**Total P1 Effort**: ~45 minutes

### P2 Issues (Medium)
1. Pull-to-refresh
2. Swipe actions

**Total P2 Effort**: ~4-6 hours

### P3 Issues (Low)
1. Loading states
2. Empty states

**Total P3 Effort**: ~1.5 hours

---

## Implementation Priority

1. **P0**: All critical mobile issues (8-9 hours)
2. **P1**: High-priority UX improvements (45 minutes)
3. **P2**: Nice-to-have features (4-6 hours)
4. **P3**: Polish and refinement (1.5 hours)

---

## Notes

- Follow the same patterns established in Inbox, AI Assistant, Documents, and Settings pages
- Reuse `BottomSheet` component for mobile actions
- Ensure all touch targets are 44x44px minimum
- Test on real mobile devices (iOS Safari, Chrome Android)
- Maintain desktop functionality unchanged
- The table-to-card conversion is the most complex part (similar to inbox page)

