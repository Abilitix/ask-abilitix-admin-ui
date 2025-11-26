# Deploy Widget to Production - Next Steps

**Date:** 2025-11-21  
**Status:** WIDGET_JS_URL configured in Render ✅

---

## 🚀 **Next: Deploy Admin UI to Production**

### **Step 1: Deploy Admin UI**

1. **Commit all changes:**
   ```bash
   git add .
   git commit -m "feat: add widget.js with Runtime API integration"
   ```

2. **Push to main (production):**
   ```bash
   git push origin main
   ```

3. **Wait for Vercel deployment:**
   - Vercel will auto-deploy
   - Wait for deployment to complete

---

## ✅ **After Deployment - Verification**

### **Step 1: Verify widget.js is Accessible**

1. **Open browser:**
   - Go to: `https://app.abilitix.com.au/widget.js`
   - **Expected:** JavaScript code starting with `/**`
   - **If 404:** Check deployment status

2. **Check browser console:**
   - Press F12
   - Should see no errors

### **Step 2: Test Widget Settings Page**

1. **Go to Admin UI:**
   - URL: `https://app.abilitix.com.au/admin/settings`
   - Scroll to "Website Widget" section

2. **Verify embed snippet:**
   - Should show: `https://app.abilitix.com.au/widget.js`
   - Should include your tenant and widget key

3. **Copy snippet:**
   - Click "Copy Snippet" button
   - Verify snippet is correct

### **Step 3: Test Widget Functionality**

1. **Get embed snippet from Admin UI**

2. **Update test HTML with production snippet**

3. **Test widget:**
   - Widget button appears
   - Chat window opens
   - Can send messages
   - API responses work

---

## ✅ **Quick Checklist**

**Before Deployment:**
- [x] WIDGET_JS_URL set in Render (Production)
- [x] Render Admin API deployed
- [ ] All changes committed
- [ ] Ready to push to main

**After Deployment:**
- [ ] widget.js accessible at production URL
- [ ] Widget settings page loads
- [ ] Embed snippet shows production URL
- [ ] Widget functionality works
- [ ] End-to-end testing complete

---

## 🎯 **Summary**

**What's Done:**
- ✅ WIDGET_JS_URL configured in Render (Production)
- ✅ Render Admin API deployed

**What's Next:**
1. Deploy Admin UI to production (push to main)
2. Verify widget.js is accessible
3. Test widget functionality
4. Ready for tenants to use!

**Ready to Deploy:** Once you push to main, widget.js will be live and ready!




