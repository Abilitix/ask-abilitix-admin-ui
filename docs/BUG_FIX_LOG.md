## 2025-10-07 — TUS uploads failing for new tenant (400/404, cross-tenant)

Summary
- Fixed TUS uploads that failed for new tenants and occasionally returned 404 on finalise and 400 on TUS create.

Root causes
- Frontend proxy routes for TUS were using a hardcoded/default tenant ID instead of the authenticated session tenant, causing cross-tenant writes and missing visibility.
- Missing frontend route: `/api/admin/docs/finalise` → 404 at finalise.
- TUS create was switched during testing to a storage-direct path form which conflicted with the project’s short‑lived upload token policy, returning 400.

Fixes
- Added `/api/admin/docs/finalise/route.ts` and implemented all TUS proxy routes (`docs/init`, `uploads/token`, `uploads/[id]`) to resolve `X-Tenant-Id` from `/api/auth/me` (cookie pass‑through). No environment/default tenant used.
- Kept legacy uploader as default (guarded by `NEXT_PUBLIC_ENABLE_TUS_UI=0`).
- Updated `TusUploadForm.tsx` to use storage‑direct host with the generic resumable endpoint:
  - POST `…/storage/v1/upload/resumable` with `Upload-Metadata` (base64 `bucketName`, `objectName`, `contentType`).
  - Continue with `Location` for PATCHes.
- Added optional canary toggle `?uploadMode=tus&force=1` for safe TUS testing without exposing to users.

Verification
- Legacy upload: OK (200), unchanged.
- TUS canary on new tenant: init 200 → token 200 → storage create 201 (Location) → PATCH 204 → finalise 200 → polling `ready`; document visible under correct tenant with `source=tus_upload`.

Status: Successful

# Admin UI Bug Fix Log

## 📋 Overview
**Last Updated**: 2025-01-16
**Version**: 1.0
**Maintainer**: Admin UI Team

This document tracks all bug fixes, their root causes, solutions, and testing results for Admin UI.

---

## 🐛 Bug Fixes

### ✅ Settings Card Description - Technical Jargon Issue
**Date**: 2025-01-16
**Severity**: Low
**Status**: ✅ Resolved
**Component**: Dashboard UI

**Problem**: Settings card showed technical jargon "Tune DOC_MIN_SCORE and RAG_TOPK" which was confusing for non-technical users.

**Root Cause**: Description was written from developer perspective using internal technical terms instead of user-friendly language.

**Solution**: Updated description to "Manage team members and system preferences" to be more user-friendly and action-oriented.

**Files Modified**: 
- `src/components/DashboardClient.tsx` - Updated Settings card description

**Code Changes**:
```typescript
// Before (confusing)
{ href: "/admin/settings", title: "Settings", desc: "Tune DOC_MIN_SCORE and RAG_TOPK" }

// After (user-friendly)
{ href: "/admin/settings", title: "Settings", desc: "Manage team members and system preferences" }
```

**Testing Results**:
- ✅ Dashboard display - Settings card now shows clear, user-friendly description
- ✅ User experience - Non-technical users can understand what Settings does
- ✅ Functionality - No impact on actual Settings page functionality

**Impact**: Improved user experience by making the Settings card description accessible to all users, not just technical ones.

### ✅ Footer Duplication - Multiple Copyright Notices
**Date**: 2025-01-16
**Severity**: Low
**Status**: ✅ Resolved
**Component**: Layout/UI

**Problem**: Users were seeing duplicate "© 2025 Abilitix. All rights reserved." footer text on sign-in, sign-up, and demo pages, appearing twice on each page.

**Root Cause**: Both the global `SiteFooter` component (in root layout) and individual pages had their own footer text, causing duplication when pages rendered.

**Solution**: Removed individual footer text from all pages, keeping only the global `SiteFooter` component in the root layout.

**Files Modified**: 
- `src/app/signin/page.tsx` - Removed duplicate footer section
- `src/app/signup/page.tsx` - Removed duplicate footer section
- `src/app/demo/signup/page.tsx` - Removed duplicate footer section

**Code Changes**:
```typescript
// Before (duplicate footer in each page)
{/* Footer */}
<div className="text-center mt-8 text-sm text-gray-500">
  <p>© 2025 Abilitix. All rights reserved.</p>
</div>

// After (removed - global footer handles this)
// No individual footer text needed
```

**Testing Results**:
- ✅ Sign In page - No duplicate footer, clean layout
- ✅ Sign Up page - No duplicate footer, clean layout
- ✅ Demo Sign Up page - No duplicate footer, clean layout
- ✅ Global footer - Still appears consistently across all pages

**Impact**: Eliminated duplicate footer text, providing a cleaner, more professional user experience with consistent branding across all pages.

### ✅ Upload Format Support - Incorrect TXT Advertisement
**Date**: 2025-01-16
**Severity**: Medium
**Status**: ✅ Resolved
**Component**: UI/Upload Forms

**Problem**: The upload forms were advertising support for TXT files and 100MB file size limits, but the TUS system only supports PDF, DOCX, JPG, PNG, MP4, WEBM files with a 20MB limit. This created user confusion and potential upload failures.

**Root Cause**: The UI text was not updated to match the actual TUS system capabilities. The TUS system's `allowed_mimes` configuration only includes the 6 supported formats, and the file size limit is 20MB, not 100MB.

**Solution**: Updated all upload form descriptions to accurately reflect the supported formats and file size limits.

**Files Modified**:
- `src/components/docs/TusUploadForm.tsx` - Updated supported formats text
- `src/components/docs/LegacyUploadForm.tsx` - Updated supported formats text

**Code Changes**:
```typescript
// Before (incorrect)
"Supported formats: PDF, TXT, DOCX, JPG, PNG, MP4, WEBM (max 100MB)"

// After (correct)
"Supported formats: PDF, DOCX, JPG, PNG, MP4, WEBM (max 20MB)"
```

**Testing Results**:
- ✅ TUS Upload Form - Now shows correct supported formats
- ✅ Legacy Upload Form - Now shows correct supported formats
- ✅ File Size Limit - Updated to reflect actual 20MB limit
- ✅ User Experience - No more confusion about unsupported formats

**Impact**: Eliminated user confusion and potential upload failures by accurately advertising the supported file formats and size limits.

### ❌ Mobile Scrolling Issue - Viewport Fix Attempt Failed
**Date**: 2025-01-16
**Severity**: Low
**Status**: ❌ Deployed but Ineffective
**Component**: Auth Pages (Sign-in/Sign-up)

**Problem**: Users reported scrolling required on mobile devices for sign-in and sign-up pages, creating poor mobile UX.

**Root Cause Analysis**: 
- **Initial Diagnosis**: Assumed viewport calculation issue (`100vh` vs `100dvh`)
- **Actual Root Cause**: Content height (~456px) exceeds available mobile viewport space (~468px on iPhone SE)
- **Real Issue**: Content density too high for small mobile screens, not viewport calculation

**Solution Attempted**: 
- Replaced `min-h-screen` with `min-h-screen min-h-[100dvh] overflow-y-auto`
- Added fallback strategy for browser compatibility
- Applied to both sign-in and sign-up pages

**Files Modified**:
- `src/app/signin/page.tsx` - Added `min-h-[100dvh] overflow-y-auto` to main container and Suspense fallback
- `src/app/signup/page.tsx` - Added `min-h-[100dvh] overflow-y-auto` to main container

**Code Changes**:
```typescript
// Applied change (ineffective)
<div className="min-h-screen min-h-[100dvh] overflow-y-auto bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
```

**Testing Results**:
- ❌ Mobile scrolling - Still present after deployment
- ✅ Desktop appearance - Unchanged (as expected)
- ✅ Browser compatibility - Fallback working correctly
- ❌ Root cause - Misdiagnosed the actual problem

**Impact**: 
- **Positive**: Improved viewport handling for modern browsers
- **Negative**: Did not resolve the scrolling issue as intended
- **Learning**: Content height analysis should precede viewport fixes

**Lessons Learned**:
- Always measure actual content height before proposing solutions
- Viewport fixes don't solve content density issues
- Mobile UX requires content height optimization, not just viewport calculation
- Should have analyzed available mobile viewport space first

**Current Status**: Issue remains unresolved. Content height reduction would be required for actual fix, but deemed low priority due to minor impact.

### ✅ User Management Form - Input Field Not Working
**Date**: 2025-01-16
**Severity**: High
**Status**: ✅ Resolved
**Component**: Settings Page / User Management

**Problem**: Users could not type in the email input field on both PC and mobile devices in the user management section. The input field appeared to be non-functional, preventing user invitations.

**Root Cause**: The custom `Select` component was interfering with the `Input` field's focus and input handling. The `Select` component's event handling or CSS was preventing the input from receiving focus or processing keystrokes properly.

**Solution**: 
- Replaced the custom `Select` component with a native HTML `<select>` element for the role dropdown
- Implemented proper form semantics with `<form>` wrapper and `type="submit"` button
- Added responsive layout: vertical stack on mobile, horizontal on desktop
- Enhanced accessibility with ARIA labels and screen reader support
- Added mobile-optimized input attributes (`inputMode`, `enterKeyHint`)

**Files Modified**:
- `src/app/admin/settings/page.tsx` - Replaced Select component with native select in user management section

**Code Changes**:
```typescript
// Before (problematic)
<div className="flex gap-2">
  <Input type="email" ... />
  <Select value={inviteRole} ... />
  <Button onClick={inviteUser} ... />
</div>

// After (fixed)
<form onSubmit={(e) => { e.preventDefault(); ... }}>
  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
    <Input type="email" ... />
    <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
      <select value={inviteRole} ... />
      <Button type="submit" ... />
    </div>
  </div>
</form>
```

**Testing Results**:
- ✅ PC Input Field - Now accepts text input properly
- ✅ Mobile Input Field - Now accepts text input properly
- ✅ Form Submission - Enter key works for form submission
- ✅ Responsive Layout - Vertical on mobile, horizontal on desktop
- ✅ Accessibility - Screen reader friendly with ARIA labels
- ✅ Mobile UX - Optimized keyboard and touch interactions

**Impact**: 
- **Functionality**: Restored core user management functionality
- **User Experience**: Improved form usability on all devices
- **Accessibility**: Enhanced screen reader and keyboard navigation support
- **Mobile UX**: Better mobile form interaction with proper input attributes

**Lessons Learned**:
- Custom components can interfere with native form elements
- Native HTML elements often provide better compatibility
- Form semantics are crucial for proper user interaction
- Mobile UX requires specific input attributes and responsive design

---

## 🔍 Bug Patterns

### Pattern: Technical Jargon in User Interface
**Common Causes**:
- Developer-focused descriptions using internal technical terms
- Lack of user perspective in UI text
- Copy-paste from technical documentation

**Solutions**:
- Write descriptions from user perspective
- Use action-oriented language ("Manage", "Configure", "View")
- Test descriptions with non-technical users
- Avoid internal system terminology

---

## 🛠️ Debugging Tools

### UI Component Debugging
```bash
# Check for TypeScript errors
npm run build

# Run development server for UI testing
npm run dev

# Check for linting issues
npm run lint
```

### API Integration Debugging
```bash
# Check environment variables
echo $ADMIN_API
echo $NEXT_PUBLIC_ADMIN_API

# Test API endpoints
curl -X GET "https://api.abilitix.com.au/auth/me" \
  -H "Cookie: aa_sess=your-session-cookie"
```

---

## 📞 Escalation

### When to Escalate
- Critical bugs affecting user authentication
- Data loss or corruption issues
- Security vulnerabilities
- Performance issues affecting production

### How to Escalate
1. Document the bug in this log with full details
2. Test the issue in multiple environments
3. Contact Admin API team if backend issues
4. Create GitHub issue with reproduction steps
5. Notify team lead for critical issues

---

### ✅ Inbox Answer Text Reappearing on Delete
**Date**: 2025-01-16
**Severity**: Medium
**Status**: ✅ Resolved
**Component**: Inbox Page / Answer Editing

**Problem**: When editing answers in the inbox, deleting all text would cause the original text to reappear in the textarea field. Users could not properly clear the answer field, making it impossible to submit empty answers or start fresh.

**Root Cause**: JavaScript falsy value evaluation bug in the textarea value logic:
```typescript
// BROKEN CODE:
value={editedAnswers[item.id] || item.answer}
```
- When user deletes all text, `editedAnswers[item.id]` becomes `""` (empty string)
- Empty string is falsy in JavaScript, so `"" || item.answer` evaluates to `item.answer`
- Original text reappears instead of preserving the empty string

**Solution**: Replace logical OR (`||`) with nullish coalescing (`??`) operator:
```typescript
// FIXED CODE:
value={editedAnswers[item.id] ?? item.answer}
```
- `??` only falls back to `item.answer` if `editedAnswers[item.id]` is `undefined` or `null`
- Empty strings (`""`) are preserved, allowing users to clear text completely

**Files Modified**:
- `src/components/inbox/InboxList.tsx` - Line 172: Changed `||` to `??`

**Code Changes**:
```typescript
// Before (problematic)
<Textarea
  value={editedAnswers[item.id] || item.answer}
  onChange={(e) => setEditedAnswers(prev => ({ ...prev, [item.id]: e.target.value }))}
  className="min-h-[100px] resize-y"
  placeholder="Edit the answer..."
/>

// After (fixed)
<Textarea
  value={editedAnswers[item.id] ?? item.answer}
  onChange={(e) => setEditedAnswers(prev => ({ ...prev, [item.id]: e.target.value }))}
  className="min-h-[100px] resize-y"
  placeholder="Edit the answer..."
/>
```

**Testing Results**:
- ✅ Delete all text - Textarea stays empty (no reappearing text)
- ✅ Type new text - New text appears correctly
- ✅ Clear text again - Textarea stays empty
- ✅ Save empty answer - Works as expected
- ✅ Cancel editing - Original text restored correctly
- ✅ Approve with empty answer - Submission works correctly

**Impact**: 
- **User Experience**: Users can now properly clear answer text without confusion
- **Workflow**: Enables submission of empty answers when appropriate
- **Editing**: Intuitive text editing behavior matches user expectations
- **Functionality**: No impact on existing approve/reject workflow

**Lessons Learned**:
- JavaScript falsy values (`""`, `0`, `false`) can cause unexpected fallback behavior
- Use nullish coalescing (`??`) when you want to preserve falsy values like empty strings
- Logical OR (`||`) should only be used when you want to fallback on falsy values
- Test edge cases like empty strings, not just normal text input

**Current Status**: Issue resolved and deployed. Users can now edit answers without text reappearing when deleted.

---

**Last Updated**: 2025-01-16
**Next Review**: 2025-02-16
