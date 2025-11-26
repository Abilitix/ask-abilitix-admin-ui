# Widget Testing Options

**Date:** 2025-11-21  
**Snippet from Admin UI:** Production URL (`app.abilitix.com.au`)

---

## 📋 **Current Situation**

**Snippet from Preview Admin UI:**
```html
<script src="https://app.abilitix.com.au/widget.js" 
        data-tenant="abilitix-pilot" 
        data-widget-key="wid_Y-oFeJtCWQcnZMvxgifZy9DCzQji4qii"></script>
```

**Issue:**
- `WIDGET_JS_URL` in Render is set to production URL ✅
- But widget.js is **only deployed to preview** (not production yet)
- Production URL (`app.abilitix.com.au/widget.js`) will return 404 until deployed to production

---

## 🧪 **Testing Options**

### **Option 1: Test with Preview URL (Quick Test - Recommended Now)**

**Update snippet to use preview URL:**
```html
<script src="https://ask-abilitix-admin-ui-git-preview-abilitix-consultings-projects.vercel.app/widget.js" 
        data-tenant="abilitix-pilot" 
        data-widget-key="wid_Y-oFeJtCWQcnZMvxgifZy9DCzQji4qii"></script>
```

**Advantages:**
- ✅ Works immediately (widget.js is deployed to preview)
- ✅ Quick test before production
- ✅ Same functionality

**How to test:**
1. Update test HTML with preview URL snippet
2. Open in browser
3. Test widget functionality

---

### **Option 2: Deploy to Production First**

**Deploy widget.js to production:**
1. Merge preview to main (or add widget.js to production)
2. Deploy to production
3. Then use production snippet from Admin UI

**Advantages:**
- ✅ Uses production snippet as-is
- ✅ Tests production deployment

**How to deploy:**
```bash
# Add widget.js to production
git checkout main
git add public/widget.js
git commit -m "feat: add widget.js to production"
git push origin main
```

---

## 🎯 **Recommended Approach**

### **For Now: Test with Preview URL**

1. **Update test HTML:**
   - Change script tag to preview URL
   - Keep tenant and widget-key the same

2. **Test widget:**
   - Open test HTML in browser
   - Verify widget works
   - Check console for errors

3. **Verify functionality:**
   - Widget button appears
   - Chat window opens
   - Can send messages
   - API responses work

### **Then: Deploy to Production**

Once testing is successful:
1. Deploy widget.js to production
2. Use production snippet as-is
3. Test in production

---

## ✅ **Quick Test Now**

**Use this snippet for testing:**
```html
<script src="https://ask-abilitix-admin-ui-git-preview-abilitix-consultings-projects.vercel.app/widget.js" 
        data-tenant="abilitix-pilot" 
        data-widget-key="wid_Y-oFeJtCWQcnZMvxgifZy9DCzQji4qii"></script>
```

**Or with theme customization:**
```html
<script src="https://ask-abilitix-admin-ui-git-preview-abilitix-consultings-projects.vercel.app/widget.js" 
        data-tenant="abilitix-pilot" 
        data-widget-key="wid_Y-oFeJtCWQcnZMvxgifZy9DCzQji4qii"
        data-theme-primary="#3b82f6"
        data-theme-accent="#8b5cf6"
        data-title="Chat with us"
        data-welcome-message="Hi! How can I help you today?"
        data-position="bottom-right"></script>
```

**Test this snippet now - it will work!**

---

## 📝 **Summary**

**Current:**
- Snippet uses production URL (from Admin UI)
- Widget.js only deployed to preview
- Production URL will 404 until deployed

**For Testing:**
- Use preview URL in snippet (works now)
- Test widget functionality
- Then deploy to production

**After Production Deployment:**
- Use production snippet as-is
- Everything works

---

**Quick Action:** Use preview URL snippet for testing now, then deploy to production when ready!




