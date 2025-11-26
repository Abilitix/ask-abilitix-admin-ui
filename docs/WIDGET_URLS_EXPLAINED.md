# Widget URLs Explained - Preview vs Production

**Date:** 2025-11-21  
**Purpose:** Clarify the difference between WIDGET_JS_URL and Runtime API URL

---

## 🎯 **Two Different URLs - Understand the Difference**

### **1. WIDGET_JS_URL (where widget.js file is hosted)**
**Purpose:** Where the JavaScript file (`widget.js`) is served from

**Options:**
- **Preview:** `https://ask-abilitix-admin-ui-git-preview-abilitix-consultings-projects.vercel.app/widget.js`
- **Production:** `https://ask-abilitix-admin-ui.vercel.app/widget.js` (or your production domain)

**Set in:** Render Admin API → Environment → `WIDGET_JS_URL`

**Backend uses this to:** Generate embed snippets with the correct widget.js URL

---

### **2. Runtime API URL (where widget makes requests)**
**Purpose:** Where the widget sends chat messages/API requests

**Already set in widget.js:**
- ✅ `https://ask-abilitix-runtime.onrender.com`
- ✅ Headers: `x-tenant-slug` and `X-Widget-Key`

**This is NOT** the same as WIDGET_JS_URL - it's the API endpoint.

---

## ✅ **Can We Use Same URL for Both Preview and Prod?**

### **Option 1: Use Production URL for Both (Recommended)**

**Set in Render (both Preview and Production environments):**
```
WIDGET_JS_URL=https://ask-abilitix-admin-ui.vercel.app/widget.js
```

**Advantages:**
- ✅ Simple - one URL for both
- ✅ Preview uses production widget.js (always latest)
- ✅ No need to maintain separate preview widget.js

**Disadvantages:**
- ⚠️ Preview testing uses production widget.js (but this is usually fine)

---

### **Option 2: Separate URLs (More Precise)**

**Render Preview Environment:**
```
WIDGET_JS_URL=https://ask-abilitix-admin-ui-git-preview-abilitix-consultings-projects.vercel.app/widget.js
```

**Render Production Environment:**
```
WIDGET_JS_URL=https://ask-abilitix-admin-ui.vercel.app/widget.js
```

**Advantages:**
- ✅ Preview can test widget.js changes before production
- ✅ More isolated testing

**Disadvantages:**
- ⚠️ Need to maintain two URLs
- ⚠️ Preview widget.js might differ from production

---

## 🎯 **Recommended Approach**

**Use Production URL for Both:**
```
WIDGET_JS_URL=https://ask-abilitix-admin-ui.vercel.app/widget.js
```

Set this in Render for **both Preview and Production environments**.

**Why?**
- Widget.js is a single file that works for all tenants
- Production URL is more stable
- Preview Admin UI can still be tested independently
- Simpler configuration

---

## 📝 **What Happens**

### **With Production URL for Both:**

1. **Preview Admin UI:**
   - Generates embed snippet with: `https://ask-abilitix-admin-ui.vercel.app/widget.js`
   - Users get production widget.js (which is fine)
   - Widget makes API calls to: `https://ask-abilitix-runtime.onrender.com`

2. **Production Admin UI:**
   - Generates embed snippet with: `https://ask-abilitix-admin-ui.vercel.app/widget.js`
   - Users get production widget.js
   - Widget makes API calls to: `https://ask-abilitix-runtime.onrender.com`

3. **Both work the same:**
   - Same widget.js URL
   - Same Runtime API
   - Tenants isolated by widget key

---

## ✅ **Summary**

**WIDGET_JS_URL:**
- Points to Admin UI domain (where widget.js is hosted)
- Can use production URL for both preview and prod
- Example: `https://ask-abilitix-admin-ui.vercel.app/widget.js`

**Runtime API:**
- Already set in widget.js: `https://ask-abilitix-runtime.onrender.com`
- This is where widget sends chat messages
- Same for all environments

**Recommendation:**
- Set `WIDGET_JS_URL=https://ask-abilitix-admin-ui.vercel.app/widget.js` in Render (both environments)
- Deploy Admin UI to production
- Test widget in preview (will use production widget.js, which is fine)

---

**Note:** `https://ask-abilitix-runtime.onrender.com` is the Runtime API (for chat requests), NOT where widget.js is hosted. Widget.js is hosted on your Admin UI domain.




