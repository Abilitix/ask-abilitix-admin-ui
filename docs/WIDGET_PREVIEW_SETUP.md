# Widget Preview Setup - Ready to Deploy

**Date:** 2025-11-21  
**Preview Domain:** https://ask-abilitix-admin-ui-git-preview-abilitix-consultings-projects.vercel.app/

---

## 🎯 **Quick Setup**

### **Step 1: Set WIDGET_JS_URL in Render (Preview Environment)**

1. **Go to Render Dashboard:**
   - Navigate to: https://dashboard.render.com
   - Find your **Admin API** service
   - Go to **Environment** tab

2. **Add/Update Environment Variable:**
   ```
   WIDGET_JS_URL=https://ask-abilitix-admin-ui-git-preview-abilitix-consultings-projects.vercel.app/widget.js
   ```

3. **Save:**
   - Click "Save Changes"
   - Render will auto-redeploy

### **Step 2: Deploy to Preview**

1. **Commit current changes:**
   ```bash
   git add .
   git commit -m "feat: add widget.js with Runtime API integration and debugging"
   git push origin preview
   ```

2. **Wait for Vercel deployment:**
   - Vercel will auto-deploy preview branch
   - Wait for deployment to complete

### **Step 3: Verify Preview**

1. **Check widget.js is accessible:**
   - URL: `https://ask-abilitix-admin-ui-git-preview-abilitix-consultings-projects.vercel.app/widget.js`
   - Should return JavaScript code
   - No 404 errors

2. **Check widget settings:**
   - URL: `https://ask-abilitix-admin-ui-git-preview-abilitix-consultings-projects.vercel.app/admin/settings`
   - Scroll to "Website Widget" section
   - Verify embed snippet shows preview URL

3. **Copy embed snippet:**
   - Click "Copy Snippet"
   - Should include: `src="https://ask-abilitix-admin-ui-git-preview-abilitix-consultings-projects.vercel.app/widget.js"`

---

## 🧪 **Test Widget in Preview**

### **Step 1: Get Embed Snippet from Preview**

1. Go to: `https://ask-abilitix-admin-ui-git-preview-abilitix-consultings-projects.vercel.app/admin/settings`
2. Scroll to "Website Widget" section
3. Click "Copy Snippet"
4. Snippet should look like:
   ```html
   <script src="https://ask-abilitix-admin-ui-git-preview-abilitix-consultings-projects.vercel.app/widget.js" 
           data-tenant="your-tenant" 
           data-widget-key="wid_..."></script>
   ```

### **Step 2: Test with HTML Page**

1. **Update test HTML:**
   - Open `test-widget.html`
   - Replace script tag with preview embed snippet
   - Or update URL to: `https://ask-abilitix-admin-ui-git-preview-abilitix-consultings-projects.vercel.app/widget.js`

2. **Test:**
   - Open test HTML page
   - Widget should load from preview URL
   - Check browser console (F12) for widget logs
   - Test chat functionality

---

## ✅ **Verification Checklist**

### **Before Testing:**
- [ ] `WIDGET_JS_URL` set in Render (Preview)
- [ ] Preview Admin UI deployed
- [ ] widget.js accessible at preview URL

### **Widget Functionality:**
- [ ] Widget button appears
- [ ] Chat window opens
- [ ] Welcome message displays
- [ ] Can send messages
- [ ] API responses work
- [ ] Theme customization works

---

## 📝 **Environment Variables**

### **Render Admin API - Preview:**
```
WIDGET_JS_URL=https://ask-abilitix-admin-ui-git-preview-abilitix-consultings-projects.vercel.app/widget.js
```

### **Render Admin API - Production (Later):**
```
WIDGET_JS_URL=https://ask-abilitix-admin-ui.vercel.app/widget.js
```
Or your production domain.

---

## 🚀 **Deployment Commands**

```bash
# 1. Add all changes
git add .

# 2. Commit widget.js and updates
git commit -m "feat: add widget.js with Runtime API integration"

# 3. Push to preview
git push origin preview

# 4. Wait for Vercel to deploy (auto)
# 5. Verify widget.js at preview URL
# 6. Test embed snippet from preview Admin UI
```

---

## ✅ **Summary**

**Preview Domain:** `https://ask-abilitix-admin-ui-git-preview-abilitix-consultings-projects.vercel.app/`

**Widget.js URL:** `https://ask-abilitix-admin-ui-git-preview-abilitix-consultings-projects.vercel.app/widget.js`

**Next Steps:**
1. Set `WIDGET_JS_URL` in Render (Preview) with above URL
2. Deploy to preview branch
3. Test widget.js at preview URL
4. Get embed snippet from preview Admin UI
5. Test end-to-end functionality

---

**Ready to deploy!** Once `WIDGET_JS_URL` is set in Render and preview is deployed, the widget will be ready for testing.




