# Widget Preview Testing Guide

**Date:** 2025-11-21  
**Purpose:** Test widget.js in preview environment before production

---

## ✅ **Current Status**

### **What's Fixed:**
- ✅ Widget.js API URL updated to: `https://ask-abilitix-runtime.onrender.com`
- ✅ Headers updated: `x-tenant-slug` and `X-Widget-Key`
- ✅ Widget.js implementation complete
- ✅ Admin UI serving widget.js at `/widget.js`

### **What's Needed:**
- ⏸️ Set `WIDGET_JS_URL` in Render Admin API
- ⏸️ Test in preview environment
- ⏸️ Deploy to production

---

## 🧪 **Testing in Preview**

### **Step 1: Set WIDGET_JS_URL in Render (Preview Environment)**

1. **Go to Render Dashboard:**
   - Navigate to your Admin API service
   - Go to **Environment** tab
   - Find or add: `WIDGET_JS_URL`

2. **Set Preview URL:**
   ```
   WIDGET_JS_URL=https://ask-abilitix-admin-ui-preview.vercel.app/widget.js
   ```
   Or your preview Admin UI URL if different

3. **Save and Redeploy:**
   - Save environment variable
   - Trigger redeploy (or wait for auto-deploy)

### **Step 2: Verify Preview Admin UI**

1. **Check Preview Admin UI is deployed:**
   - Go to: `https://your-preview-admin-ui-url.com/admin/settings`
   - Verify widget settings page loads

2. **Verify widget.js is accessible:**
   - Go to: `https://your-preview-admin-ui-url.com/widget.js`
   - Should return JavaScript code
   - Check browser console for errors

### **Step 3: Get Embed Snippet from Preview**

1. **Log into Preview Admin UI:**
   - Go to `/admin/settings`
   - Scroll to "Website Widget" section

2. **Copy Embed Snippet:**
   - Click "Copy Snippet" button
   - Snippet should have preview URL:
     ```html
     <script src="https://your-preview-admin-ui-url.com/widget.js" 
             data-tenant="your-tenant" 
             data-widget-key="wid_..."></script>
     ```

### **Step 4: Test Widget in Preview**

1. **Update test HTML:**
   - Replace script tag with preview embed snippet
   - Or use preview URL directly

2. **Test widget:**
   - Open test HTML page
   - Widget should load from preview URL
   - Test chat functionality
   - Verify API calls work

---

## 🔧 **Environment Variables Setup**

### **Render Admin API - Preview Environment:**

```
WIDGET_JS_URL=https://ask-abilitix-admin-ui-preview.vercel.app/widget.js
```

**Or if using different preview URL:**
```
WIDGET_JS_URL=https://your-preview-admin-ui-url.com/widget.js
```

### **Render Admin API - Production Environment:**

```
WIDGET_JS_URL=https://ask-abilitix-admin-ui.vercel.app/widget.js
```

**Or your production Admin UI URL:**
```
WIDGET_JS_URL=https://app.abilitix.com.au/widget.js
```

---

## 📋 **Preview Testing Checklist**

### **Backend Configuration:**
- [ ] `WIDGET_JS_URL` set in Render (Preview)
- [ ] Preview Admin API redeployed
- [ ] Environment variable verified

### **Admin UI Preview:**
- [ ] Preview Admin UI deployed
- [ ] Widget settings page accessible
- [ ] `widget.js` accessible at preview URL
- [ ] Embed snippet generated correctly

### **Widget Functionality:**
- [ ] Widget.js loads from preview URL
- [ ] Widget button appears
- [ ] Chat window opens
- [ ] Messages send successfully
- [ ] API responses display
- [ ] Theme customization works

### **API Integration:**
- [ ] Widget key validation works
- [ ] Tenant routing works
- [ ] Error handling works
- [ ] Widget disabled state works

---

## 🚀 **Deployment Flow**

### **Preview → Production:**

1. **Test in Preview:**
   - Set `WIDGET_JS_URL` to preview URL
   - Test all functionality
   - Verify everything works

2. **Deploy to Production:**
   - Deploy Admin UI to production
   - Update `WIDGET_JS_URL` to production URL
   - Test in production
   - Verify embed snippets use production URL

3. **Tenant Usage:**
   - Tenants get embed snippet from Admin UI
   - Snippet points to production widget.js URL
   - Widget works on their websites

---

## 📝 **Quick Commands**

### **Check Preview Admin UI:**
```bash
# Verify widget.js is accessible
curl https://your-preview-admin-ui-url.com/widget.js
```

### **Check Environment Variable:**
- Render Dashboard → Admin API → Environment → `WIDGET_JS_URL`

---

## ✅ **Summary**

**To Test in Preview:**
1. Set `WIDGET_JS_URL` in Render to preview Admin UI URL
2. Redeploy Admin API (if needed)
3. Verify widget.js accessible at preview URL
4. Get embed snippet from preview Admin UI
5. Test widget functionality

**Current Status:**
- ✅ Widget.js ready (API URL fixed)
- ✅ Admin UI ready
- ⏸️ Need to set `WIDGET_JS_URL` in Render
- ⏸️ Need to test in preview

---

**Next Action:** Set `WIDGET_JS_URL` in Render preview environment and test!




