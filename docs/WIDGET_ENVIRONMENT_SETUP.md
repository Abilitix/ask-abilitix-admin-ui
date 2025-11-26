# Widget Environment Variables Setup

**Date:** 2025-11-21  
**Purpose:** Configure WIDGET_JS_URL for both preview and production

---

## 🎯 **Understanding the URLs**

### **Two Different URLs:**

1. **WIDGET_JS_URL** (where widget.js file is hosted)
   - Points to Admin UI domain (preview or production)
   - This is where the JavaScript file is served
   - Example: `https://your-admin-ui-domain.com/widget.js`

2. **Runtime API** (where widget makes API requests)
   - Already set in widget.js: `https://ask-abilitix-runtime.onrender.com`
   - This is where chat messages are sent
   - Already configured ✅

---

## 📋 **Environment Variables Setup**

### **Render Admin API - Preview Environment:**

```
WIDGET_JS_URL=https://ask-abilitix-admin-ui-git-preview-abilitix-consultings-projects.vercel.app/widget.js
```

### **Render Admin API - Production Environment:**

```
WIDGET_JS_URL=https://ask-abilitix-admin-ui.vercel.app/widget.js
```

**Or if you have a custom production domain:**
```
WIDGET_JS_URL=https://app.abilitix.com.au/widget.js
```

---

## 🔧 **How It Works**

### **For Preview:**
1. Backend generates embed snippet with:
   ```html
   <script src="https://ask-abilitix-admin-ui-git-preview-abilitix-consultings-projects.vercel.app/widget.js" 
           data-tenant="..." 
           data-widget-key="..."></script>
   ```
2. Widget.js loads from preview Admin UI
3. Widget makes API calls to Runtime API: `https://ask-abilitix-runtime.onrender.com`

### **For Production:**
1. Backend generates embed snippet with:
   ```html
   <script src="https://your-production-admin-ui-domain.com/widget.js" 
           data-tenant="..." 
           data-widget-key="..."></script>
   ```
2. Widget.js loads from production Admin UI
3. Widget makes API calls to Runtime API: `https://ask-abilitix-runtime.onrender.com` (same)

---

## ✅ **Setup Steps**

### **Step 1: Set Preview WIDGET_JS_URL**

1. **Render Dashboard:**
   - Go to Admin API service
   - Environment tab
   - Add/Update: `WIDGET_JS_URL`
   - Value: `https://ask-abilitix-admin-ui-git-preview-abilitix-consultings-projects.vercel.app/widget.js`
   - Save

### **Step 2: Set Production WIDGET_JS_URL**

1. **Render Dashboard:**
   - Go to Admin API service (same service)
   - Environment tab
   - Add/Update: `WIDGET_JS_URL` (for production environment)
   - Value: Your production Admin UI URL + `/widget.js`
   - Example: `https://ask-abilitix-admin-ui.vercel.app/widget.js`
   - Save

### **Step 3: Verify**

1. **Preview:**
   - Admin UI generates snippet with preview URL
   - Widget.js loads from preview
   - API calls go to Runtime API

2. **Production:**
   - Admin UI generates snippet with production URL
   - Widget.js loads from production
   - API calls go to Runtime API (same)

---

## 🎯 **Summary**

**Two Different URLs:**
- **WIDGET_JS_URL:** Where widget.js is hosted (Admin UI - preview or production)
- **Runtime API:** Where widget makes requests (already set in widget.js)

**Both Preview and Production:**
- Preview: Use preview Admin UI URL for WIDGET_JS_URL
- Production: Use production Admin UI URL for WIDGET_JS_URL
- Both: Widget makes API calls to Runtime API (same)

**Current Widget.js Configuration:**
- ✅ API URL: `https://ask-abilitix-runtime.onrender.com` (correct)
- ✅ Headers: `x-tenant-slug` and `X-Widget-Key` (correct)

---

**What you need to do:**
1. Set `WIDGET_JS_URL` in Render (Preview) = preview Admin UI URL
2. Set `WIDGET_JS_URL` in Render (Production) = production Admin UI URL
3. Deploy Admin UI to preview and production
4. Test both environments

---

**Note:** `https://ask-abilitix-runtime.onrender.com` is the Runtime API (where widget sends requests), NOT where widget.js is hosted. Widget.js is hosted on your Admin UI domain.




