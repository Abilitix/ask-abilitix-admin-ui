# Widget Script Loading Check

## Issue
Widget script not loading: `https://app.abilitix.com.au/widget.js`

## Possible Causes
1. **Script not deployed** - The fixed widget.js is only in local codebase, not in production
2. **Network error** - Script fails to load (404, CORS, etc.)
3. **Script fails silently** - Script loads but errors before first console.log

## Quick Check

### Step 1: Check if script is accessible
Open in browser: `https://app.abilitix.com.au/widget.js`

**Expected:**
- Should see JavaScript code starting with `/**`
- Should NOT see 404 error

**If 404:**
- Widget.js not deployed to production
- Need to deploy fixed widget.js

### Step 2: Check browser console
1. Open DevTools (F12) → Network tab
2. Reload page
3. Look for `widget.js` request

**Check status:**
- ✅ **200 (green)**: Script loaded successfully
- ❌ **404**: Script not found (not deployed)
- ❌ **CORS error**: Cross-origin issue
- ❌ **ERR_NAME_NOT_RESOLVED**: DNS issue

### Step 3: Check console logs
Open DevTools (F12) → Console tab

**Should see:**
```
Abilitix Widget: Script loaded and executing...
Abilitix Widget: Script tag found
Abilitix Widget: Config loaded
```

**If you DON'T see any widget logs:**
- Script didn't load at all
- Check Network tab for errors

---

## Fix Required

**Current Status:**
- ✅ Bug fixed in local codebase (`public/widget.js`)
- ❌ Fix NOT deployed to production yet
- ❌ Production still has buggy version

**Next Steps:**
1. Commit the fix
2. Deploy to preview first
3. Test on preview
4. Deploy to production

---

## Immediate Action

Since the fix is ready but not deployed, we need to:
1. Commit the widget.js fix
2. Push to preview branch
3. Test on preview URL
4. Then deploy to production



