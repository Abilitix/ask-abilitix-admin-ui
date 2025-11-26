# Widget Preview Testing & Deployment

**Date:** 2025-11-21  
**Status:** Ready for Preview Testing

---

## ✅ **What's Already Fixed**

1. ✅ **Widget.js API URL** - Updated to `https://ask-abilitix-runtime.onrender.com`
2. ✅ **Widget.js Headers** - Using `x-tenant-slug` and `X-Widget-Key`
3. ✅ **Widget.js Implementation** - Complete and ready
4. ✅ **Admin UI** - Serving widget.js at `/widget.js`

---

## 🧪 **Test in Preview - Step by Step**

### **Step 1: Set WIDGET_JS_URL in Render (Preview)**

1. **Go to Render Dashboard:**
   - Navigate to: https://dashboard.render.com
   - Find your **Admin API** service
   - Go to **Environment** tab

2. **Add/Update Environment Variable:**
   ```
   WIDGET_JS_URL=https://ask-abilitix-admin-ui-preview.vercel.app/widget.js
   ```
   
   **Or your preview URL:**
   - Check your Vercel preview deployment URL
   - Format: `https://your-preview-url.vercel.app/widget.js`

3. **Save:**
   - Click "Save Changes"
   - Render will auto-redeploy (or trigger manual deploy)

### **Step 2: Verify Preview Admin UI**

1. **Check Preview Deployment:**
   - Go to your preview Admin UI URL
   - Example: `https://ask-abilitix-admin-ui-preview.vercel.app`

2. **Test widget.js Access:**
   - Open: `https://your-preview-url.vercel.app/widget.js`
   - Should return JavaScript code
   - No 404 errors

3. **Test Widget Settings:**
   - Go to: `https://your-preview-url.vercel.app/admin/settings`
   - Scroll to "Website Widget" section
   - Verify embed snippet shows preview URL

### **Step 3: Get Embed Snippet from Preview**

1. **In Preview Admin UI:**
   - Go to `/admin/settings`
   - Scroll to "Website Widget"
   - Click "Copy Snippet"

2. **Verify Snippet:**
   - Should contain preview URL:
     ```html
     <script src="https://your-preview-url.vercel.app/widget.js" 
             data-tenant="your-tenant" 
             data-widget-key="wid_..."></script>
     ```

### **Step 4: Test Widget with Preview Snippet**

1. **Update Test HTML:**
   - Replace script tag with preview embed snippet
   - Or manually update URL to preview

2. **Test:**
   - Open test HTML page
   - Widget should load from preview URL
   - Test chat functionality
   - Verify API integration

---

## 🔍 **Verification Checklist**

### **Backend (Render Admin API):**
- [ ] `WIDGET_JS_URL` environment variable set
- [ ] Value points to preview Admin UI URL
- [ ] Admin API redeployed after setting variable
- [ ] Embed snippet generation uses `WIDGET_JS_URL`

### **Frontend (Preview Admin UI):**
- [ ] Preview Admin UI deployed
- [ ] `widget.js` accessible at `/widget.js`
- [ ] Widget settings page loads
- [ ] Embed snippet shows preview URL

### **Widget Functionality:**
- [ ] Widget.js loads from preview URL
- [ ] Widget button appears
- [ ] Chat window opens
- [ ] Messages send to Runtime API
- [ ] Responses display correctly
- [ ] Theme customization works

---

## 📝 **Environment Variables Reference**

### **Render Admin API - Preview:**
```
WIDGET_JS_URL=https://ask-abilitix-admin-ui-preview.vercel.app/widget.js
```

### **Render Admin API - Production:**
```
WIDGET_JS_URL=https://ask-abilitix-admin-ui.vercel.app/widget.js
```

**Or your custom domain:**
```
WIDGET_JS_URL=https://app.abilitix.com.au/widget.js
```

---

## 🚀 **Deployment Flow**

### **Current: Preview Testing**
1. Set `WIDGET_JS_URL` in Render (Preview)
2. Deploy Admin UI to preview
3. Test widget functionality
4. Verify end-to-end flow

### **Next: Production Deployment**
1. Deploy Admin UI to production
2. Update `WIDGET_JS_URL` in Render (Production)
3. Test in production
4. Tenants can use widget

---

## ✅ **Summary**

**To Test in Preview:**
1. ✅ Set `WIDGET_JS_URL` in Render to preview Admin UI URL
2. ✅ Verify widget.js accessible at preview URL
3. ✅ Get embed snippet from preview Admin UI
4. ✅ Test widget functionality

**Current Status:**
- ✅ Widget.js ready (API URL fixed to Runtime API)
- ✅ Admin UI ready
- ⏸️ Set `WIDGET_JS_URL` in Render
- ⏸️ Test in preview

**Next Steps:**
1. Set environment variable in Render
2. Test widget in preview
3. Deploy to production
4. Tenants can use widget

---

**Ready to test in preview!** Set `WIDGET_JS_URL` in Render and test the widget.




