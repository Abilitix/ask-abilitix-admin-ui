# Widget Preview Testing - Ready to Test!

**Date:** 2025-11-21  
**Status:** widget.js successfully deployed to preview ✅

---

## ✅ **What's Verified**

1. ✅ **Widget.js accessible at preview URL:**
   - URL: `https://ask-abilitix-admin-ui-git-preview-abilitix-consultings-projects.vercel.app/widget.js`
   - Status: Returns JavaScript code ✅

2. ✅ **Theme customization already in preview:**
   - Widget settings page already has theme customization
   - Can customize colors, title, message, position

---

## 🧪 **Test Steps**

### **Step 1: Get Embed Snippet from Preview**

1. **Go to Preview Admin UI:**
   - URL: `https://ask-abilitix-admin-ui-git-preview-abilitix-consultings-projects.vercel.app/admin/settings`
   - Login if needed

2. **Scroll to "Website Widget" section:**
   - Should see widget settings
   - Theme customization options visible

3. **Get Embed Snippet:**
   - Click "Copy Snippet" button
   - Should include preview URL:
     ```html
     <script src="https://ask-abilitix-admin-ui-git-preview-abilitix-consultings-projects.vercel.app/widget.js" 
             data-tenant="your-tenant" 
             data-widget-key="wid_..."></script>
     ```

### **Step 2: Test Widget with Embed Snippet**

1. **Update test HTML:**
   - Open `test-widget.html`
   - Replace script tag with preview embed snippet
   - Or manually update to preview URL

2. **Test in browser:**
   - Open test HTML page
   - Widget should appear
   - Check browser console (F12) for widget logs

### **Step 3: Verify Widget Functionality**

**Expected Behavior:**
- ✅ Widget button appears (bottom-right or bottom-left)
- ✅ Click button opens chat window
- ✅ Welcome message displays
- ✅ Can type and send messages
- ✅ Loading indicator shows
- ✅ API responses display (if Runtime API is ready)

**Check Browser Console (F12):**
Should see widget logs:
```
Abilitix Widget: Script loaded and executing...
Abilitix Widget: Script tag found
Abilitix Widget: Config loaded
Abilitix Widget: Widget container added to page
Abilitix Widget: Initialization complete
Abilitix Widget: Button should be visible now
```

### **Step 4: Test Theme Customization**

1. **In Preview Admin UI:**
   - Go to `/admin/settings`
   - Scroll to "Theme Customization"
   - Change colors, title, message, position
   - Save changes

2. **Verify in embed snippet:**
   - Copy snippet again
   - Should include theme attributes:
     ```html
     <script src="..." 
             data-theme-primary="#3b82f6"
             data-theme-accent="#8b5cf6"
             data-title="Chat with us"
             data-welcome-message="Hi! How can I help you today?"
             data-position="bottom-right"></script>
     ```

3. **Test widget:**
   - Update HTML with new snippet
   - Widget should reflect theme changes

---

## 🔍 **What to Check**

### **Widget.js Loading:**
- [x] Widget.js accessible at preview URL ✅
- [ ] Widget loads in HTML page
- [ ] No console errors

### **Widget Functionality:**
- [ ] Widget button appears
- [ ] Chat window opens
- [ ] Welcome message displays
- [ ] Can send messages
- [ ] API responses work
- [ ] Theme customization works

### **API Integration:**
- [ ] Messages send to Runtime API
- [ ] Widget key validation works
- [ ] Tenant routing works
- [ ] Error handling works

---

## 📝 **Test Checklist**

**Before Testing:**
- [x] Widget.js accessible at preview URL ✅
- [ ] WIDGET_JS_URL set in Render (Preview) - Should point to preview URL
- [ ] Runtime API ready

**During Testing:**
- [ ] Get embed snippet from preview Admin UI
- [ ] Test widget in HTML page
- [ ] Verify widget functionality
- [ ] Test theme customization

**After Testing:**
- [ ] Document any issues
- [ ] Ready for production deployment

---

## 🚀 **Next Steps After Testing**

### **If Testing Successful:**

1. **Deploy to Production:**
   - Merge preview to main
   - Or add both widget.js and theme customization to production
   - Deploy to production

2. **Update WIDGET_JS_URL in Render:**
   - Set to production URL: `https://app.abilitix.com.au/widget.js`
   - Redeploy Admin API

3. **Test in Production:**
   - Verify widget.js accessible at production URL
   - Test end-to-end functionality
   - Ready for tenants to use!

---

## ✅ **Summary**

**Current Status:**
- ✅ Widget.js deployed to preview
- ✅ Widget.js accessible at preview URL
- ✅ Theme customization already in preview
- ⏸️ Ready for testing

**Next Actions:**
1. Get embed snippet from preview Admin UI
2. Test widget in HTML page
3. Verify widget functionality
4. Test theme customization

**Ready to Test!** Get embed snippet from preview Admin UI and test widget functionality.




