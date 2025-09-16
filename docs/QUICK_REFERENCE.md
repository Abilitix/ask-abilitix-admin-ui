# Abilitix Admin UI - Quick Reference Guide

## 📋 Project Overview
**Framework**: Next.js 15.5.2 with App Router  
**Authentication**: Magic Link with session-based cookies  
**Deployment**: Vercel (https://app.abilitix.com.au)  
**Architecture**: Multi-tenant with proper isolation  
**Current Phase**: Phase 2 - Client-Side Hardcoding Removal ✅ COMPLETED

## 🚀 Quick Start

### Update Implementation Log
```bash
# Edit the main documentation
code docs/IMPLEMENTATION_LOG.md

# Add new changes to the appropriate section
# Update the "Last Updated" date
# Add new files modified
# Update testing results
```

### Key Files to Monitor
- `src/middleware.ts` - Authentication middleware
- `src/lib/auth.ts` - Authentication utilities
- `src/components/TenantContext.tsx` - Tenant context management
- `src/app/api/ask/stream/route.ts` - Unified Ask API endpoint
- `src/lib/roles.ts` - Role-based access control

### Common Update Patterns

#### Adding New Features
1. **Update Implementation Log**: Add new section under appropriate phase
2. **Update Files Modified**: List all changed files
3. **Update Testing Results**: Add test cases and results
4. **Update Future Phases**: Move completed items to appropriate phase

#### Fixing Bugs
1. **Update Implementation Log**: Add bug fix section
2. **Update Troubleshooting**: Add new common issues
3. **Update Testing Results**: Add regression tests

#### UI Changes
1. **Update UI/UX Improvements**: Add new terminology changes
2. **Update Files Modified**: List UI component files
3. **Update Testing Results**: Add UI test cases

## 📁 File Structure

```
docs/
├── IMPLEMENTATION_LOG.md     # Main documentation (update this)
├── QUICK_REFERENCE.md        # This file
├── decisions/                # Technical Decision Records
├── implementation/           # Detailed implementation notes
├── api/                     # API documentation
└── ui/                      # UI/UX documentation
```

## 🔄 Update Workflow

### When Making Changes:
1. **Before**: Read current implementation log
2. **During**: Make code changes
3. **After**: Update implementation log with:
   - What was changed
   - Why it was changed
   - Files modified
   - Testing results
   - Any new issues discovered

### When Deploying:
1. **Update Deployment Status**: Mark as deployed
2. **Update Testing Results**: Add deployment test results
3. **Update Environment Variables**: Note any changes
4. **Update Troubleshooting**: Add any new issues

## 🎯 Current System Status

### ✅ Completed Features
- **Authentication**: Magic link login with session management
- **Tenant Isolation**: Proper multi-tenant data separation
- **Unified Ask API**: Single endpoint for all RAG queries
- **UI Consistency**: User-friendly terminology throughout
- **Role-Based Access**: Dynamic navigation based on user permissions
- **Document Management**: Full CRUD operations with tenant context

### 🔧 Technical Architecture
- **Session-Based Auth**: All endpoints use user session for tenant context
- **Unified Endpoints**: Single source of truth for all API calls
- **Error Handling**: Proper error responses and logging
- **Security**: No hardcoded values, proper tenant isolation
- **Performance**: Optimized with Next.js build process

### 🚨 Known Issues
- **None Currently**: All major issues resolved in Phase 2
- **Future Monitoring**: Watch for new hardcoded values
- **Performance**: Monitor API response times
- **Security**: Regular tenant isolation testing

## 📋 Template for New Changes

```markdown
### [Feature Name] ✅ COMPLETED
**Date:** [Current Date]
**Goal:** [What was the goal]

#### Changes Made:
- [List specific changes]

#### Files Modified:
- `path/to/file1.tsx`
- `path/to/file2.ts`

#### Technical Details:
- [Any important technical details]

#### Testing Results:
- [Test case 1]: ✅ Passed/Failed
- [Test case 2]: ✅ Passed/Failed
```

## 🎯 Key Sections to Always Update

1. **Last Updated** - At the top of the file
2. **Current Phase** - Current development phase
3. **Files Modified** - List of all changed files
4. **Testing Results** - Test cases and results
5. **Troubleshooting** - Any new issues or solutions

## 🆘 Troubleshooting Guide

### Common Issues & Solutions

#### Authentication Issues
**Problem**: User redirected back to sign-in page
**Solution**: Check if `aa_sess` cookie is present in browser
**Debug**: Check middleware logs and Admin API `/auth/me` response

#### Tenant Context Issues
**Problem**: Shows "Unknown Tenant" or wrong tenant data
**Solution**: Check TenantContext.tsx and tenant API endpoints
**Debug**: Verify user session has correct `tenant_id`

#### RAG Data Issues
**Problem**: RAG queries return Abilitix data instead of user's data
**Solution**: ✅ FIXED - Runtime API tenant isolation issue resolved
**Status**: Fixed in Runtime API, pending production deployment
**Debug**: Verify `X-Tenant-Id` header is sent to Ask API (Admin UI was correct)

#### Settings Page Issues
**Problem**: Settings page not loading or showing errors
**Solution**: Check if settings API uses session-based auth
**Debug**: Verify session cookies are forwarded to Admin API

#### UI Terminology Issues
**Problem**: Still showing technical terms like "Debug" or "RAG"
**Solution**: Check roles.ts and component files for old terminology
**Debug**: Search for old terms and update to new consistent labels

### Debug Steps
1. **Check Browser Console**: Look for JavaScript errors
2. **Check Network Tab**: Look for failed API calls
3. **Check Session Cookies**: Verify `aa_sess` cookie is present
4. **Check Tenant Context**: Verify tenant information is loaded
5. **Check API Responses**: Verify endpoints return correct data

### Environment Variables
**Production Required**:
- `ADMIN_API` - Admin API endpoint
- `NEXT_PUBLIC_ASK_BASE` - Ask API endpoint
- `COOKIE_DOMAIN` - Cookie domain for sessions

**Production Removed**:
- `NEXT_PUBLIC_TENANT_SLUG` - No longer needed
- `TENANT_ID` - No longer needed
- `ADMIN_TOKEN` - No longer needed

**Local Development**:
- All production variables plus hardcoded values for testing convenience

## 📞 Need Help?

- **Check Implementation Log**: Look for similar changes
- **Check Troubleshooting**: Look for common issues
- **Check Testing Results**: Look for test patterns
- **Update Documentation**: Always update after changes
- **Check Key Files**: Monitor the files listed in "Key Files to Monitor"

---

*Keep this documentation up-to-date for future reference and team collaboration.*
