# Widget URL Setup - Final Configuration

**Date:** 2025-11-21  
**Production Domain:** `app.abilitix.com.au`  
**Preview Domain:** `ask-abilitix-admin-ui-git-preview-abilitix-consultings-projects.vercel.app`

---

## 🎯 **Two Options**

### **Option 1: Use Production URL for Both (Recommended - Simpler)**

**Set in Render (both Preview and Production environments):**
```
WIDGET_JS_URL=https://app.abilitix.com.au/widget.js
```

**How it works:**
- ✅ Preview Admin UI generates snippets with: `https://app.abilitix.com.au/widget.js`
- ✅ Production Admin UI generates snippets with: `https://app.abilitix.com.au/widget.js`
- ✅ Both use production widget.js (which is fine - widget.js is environment-agnostic)
- ✅ Widget.js makes API calls to Runtime API (same for all)

**Advantages:**
- ✅ Simple - one URL for both environments
- ✅ Always uses production widget.js (stable)
- ✅ No need to deploy widget.js to preview separately

**When to use:**
- When widget.js is stable and doesn't need preview testing
- When you want simplicity

---

### **Option 2: Separate URLs (More Precise Testing)**

**Render Preview Environment:**
```
WIDGET_JS_URL=https://ask-abilitix-admin-ui-git-preview-abilitix-consultings-projects.vercel.app/widget.js
```

**Render Production Environment:**
```
WIDGET_JS_URL=https://app.abilitix.com.au/widget.js
```

**How it works:**
- ✅ Preview Admin UI generates snippets with preview URL
- ✅ Production Admin UI generates snippets with production URL
- ✅ Can test widget.js changes in preview before production
- ✅ More isolated testing

**Advantages:**
- ✅ Can test widget.js changes in preview first
- ✅ Preview uses preview widget.js, production uses production widget.js
- ✅ More control over testing

**When to use:**
- When you want to test widget.js changes in preview first
- When preview and production widget.js might differ

---

## ✅ **Recommendation: Option 1 (Use Production URL)**

**Why:**
- Widget.js is a single file that works for all tenants
- Widget.js doesn't depend on environment (it just calls Runtime API)
- Simpler configuration
- Production URL is more stable

**Set in Render (both environments):**
```
WIDGET_JS_URL=https://app.abilitix.com.au/widget.js
```

---

## 📋 **Setup Steps**

### **Step 1: Set WIDGET_JS_URL in Render**

1. **Go to Render Dashboard:**
   - Admin API service → Environment tab

2. **Add/Update (for both Preview and Production):**
   ```
   WIDGET_JS_URL=https://app.abilitix.com.au/widget.js
   ```

3. **Save:**
   - Render will redeploy

### **Step 2: Deploy Admin UI to Production**

1. **Deploy to production:**
   ```bash
   git add .
   git commit -m "feat: add widget.js with Runtime API integration"
   git push origin main
   ```

2. **Verify widget.js is accessible:**
   - URL: `https://app.abilitix.com.au/widget.js`
   - Should return JavaScript code

### **Step 3: Test**

1. **Preview Admin UI:**
   - Get embed snippet (will use production widget.js URL)
   - Test widget functionality

2. **Production Admin UI:**
   - Get embed snippet (will use production widget.js URL)
   - Test widget functionality

---

## 🔍 **How It Works**

### **With Production URL for Both:**

1. **Preview Admin UI:**
   - User goes to: `https://ask-abilitix-admin-ui-git-preview-abilitix-consultings-projects.vercel.app/admin/settings`
   - Gets embed snippet: `<script src="https://app.abilitix.com.au/widget.js" ...>`
   - Widget loads from production URL
   - Widget makes API calls to Runtime API

2. **Production Admin UI:**
   - User goes to: `https://app.abilitix.com.au/admin/settings`
   - Gets embed snippet: `<script src="https://app.abilitix.com.au/widget.js" ...>`
   - Widget loads from production URL
   - Widget makes API calls to Runtime API

3. **Both work identically:**
   - Same widget.js URL
   - Same Runtime API
   - Tenant isolation by widget key

---

## ✅ **Summary**

**Recommended Setup:**
- **WIDGET_JS_URL (both environments):** `https://app.abilitix.com.au/widget.js`
- **Runtime API (in widget.js):** `https://ask-abilitix-runtime.onrender.com` ✅ (already set)

**Domains:**
- **Production Admin UI:** `app.abilitix.com.au`
- **Preview Admin UI:** `ask-abilitix-admin-ui-git-preview-abilitix-consultings-projects.vercel.app`
- **Widget.js (both):** `https://app.abilitix.com.au/widget.js` (production)

**This works because:**
- Widget.js is environment-agnostic
- It just needs to load and make API calls
- Production URL is stable and accessible from both environments

---

**Action:** Set `WIDGET_JS_URL=https://app.abilitix.com.au/widget.js` in Render (both Preview and Production environments).




