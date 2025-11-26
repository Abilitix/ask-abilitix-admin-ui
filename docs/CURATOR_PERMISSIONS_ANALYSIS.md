# Curator Permissions Analysis & Recommendations

## Current State

### Role Definition (`src/lib/roles.ts`)

**Curator Permissions:**
- ✅ `canAccessDashboard: true`
- ✅ `canAccessInbox: true`
- ✅ `canAccessDocs: true`
- ✅ `canAccessFAQs: true`
- ❌ `canAccessSettings: false` (CORRECT - curators shouldn't change system settings)
- ❌ `canAccessDebug: false` (ISSUE - prevents AI Assistant access)
- ✅ `canUploadDocs: true`
- ✅ `canManageDocs: true`
- ✅ `canApproveInbox: true`
- ❌ `canManageSettings: false` (CORRECT)
- ❌ `canInviteUsers: false` (CORRECT)
- ❌ `canViewLogs: false` (CORRECT)

### Issues Identified

#### 1. **AI Assistant Access** ❌
- **Current**: Curator has `canAccessDebug: false`
- **Problem**: AI Assistant (`/admin/ai`) uses `canAccessDebug` permission
- **Impact**: Curators cannot access AI Assistant to test chat functionality
- **Inconsistency**: Viewers have `canAccessDebug: true` and can access AI Assistant
- **Recommendation**: ✅ **Curator should have access to AI Assistant** for testing

#### 2. **Settings Access via PilotStepper** ⚠️
- **Current**: PilotStepper shows all steps for non-viewer roles
- **Problem**: Curator can navigate to Settings via PilotStepper even though `canAccessSettings: false`
- **Impact**: Security gap - curator can access settings page
- **Recommendation**: ✅ **Filter Settings step from PilotStepper for curator**

#### 3. **Settings Page Route Protection** ⚠️
- **Current**: No server-side route protection on `/admin/settings`
- **Problem**: Curator can directly access settings URL even if nav item is hidden
- **Impact**: Security gap - unauthorized access possible
- **Recommendation**: ✅ **Add route protection to settings page**

## Recommendations

### 1. Enable AI Assistant for Curator ✅

**Change in `src/lib/roles.ts`:**
```typescript
curator: {
  // ... existing permissions ...
  canAccessDebug: true,  // Change from false to true
  // ... rest unchanged ...
}
```

**Rationale:**
- Curators need to test chat functionality to verify answers before approving
- Viewers already have access, so it's not a security concern
- AI Assistant is read-only (testing), not configuration

### 2. Filter Settings from PilotStepper for Curator ✅

**Change in `src/components/PilotStepper.tsx`:**
```typescript
// Filter steps based on user role
const visibleSteps = userRole === 'viewer' 
  ? STEPS.filter(step => step.key === 'chat')
  : userRole === 'curator'
    ? STEPS.filter(step => step.key !== 'settings') // Hide settings for curator
    : STEPS; // Show all steps for owner/admin
```

**Rationale:**
- Prevents curator from navigating to settings via stepper
- Aligns with permission model (`canAccessSettings: false`)

### 3. Add Route Protection to Settings Page ✅

**Add to `src/app/admin/settings/page.tsx`:**
```typescript
import { requireAuth } from '@/lib/auth';
import { hasPermission } from '@/lib/roles';
import { redirect } from 'next/navigation';

export default async function SettingsPage() {
  const user = await requireAuth();
  
  // Check permission
  if (!hasPermission(user.role, 'canAccessSettings')) {
    redirect('/admin/inbox'); // Redirect to inbox (curator's main page)
  }
  
  // ... rest of component
}
```

**Rationale:**
- Server-side protection prevents unauthorized access
- Even if navigation is bypassed, settings remain protected

## Summary

### What Curator Should Have Access To:
1. ✅ Dashboard
2. ✅ Review Answers (Inbox)
3. ✅ Upload Docs
4. ✅ FAQ Management
5. ✅ **AI Assistant** (NEW - for testing chat)
6. ❌ Settings (configuration - admin/owner only)

### Implementation Priority:
1. **High**: Enable AI Assistant access for curator
2. **High**: Add route protection to settings page
3. **Medium**: Filter settings from PilotStepper for curator

## Testing Checklist

After implementation:
- [ ] Curator can see "AI Assistant" in navigation
- [ ] Curator can access `/admin/ai` and test chat
- [ ] Curator cannot see "Settings" in navigation
- [ ] Curator cannot see "Settings" step in PilotStepper
- [ ] Curator cannot access `/admin/settings` (redirects if attempted)
- [ ] Owner/Admin still have full access to all pages

