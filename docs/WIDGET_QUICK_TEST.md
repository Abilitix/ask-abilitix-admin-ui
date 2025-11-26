# Widget Quick Test Guide

**Date:** 2025-11-21  
**Quick steps to test widget.js locally**

---

## 🚀 **Quick Test (3 Steps)**

### **Step 1: Start Admin UI Dev Server**
```bash
npm run dev
```
Wait for: `Ready - started server on 0.0.0.0:3000`

### **Step 2: Verify widget.js is Accessible**
Open in browser: `http://localhost:3000/widget.js`

**Expected:** You should see JavaScript code (the widget.js file content)

**If you see 404:**
- Check that `public/widget.js` exists
- Check that `src/app/widget.js/route.ts` exists
- Restart dev server

### **Step 3: Test with HTML Page**
1. Keep dev server running (port 3000)
2. In another terminal, start local server:
   ```bash
   py -m http.server 8000
   ```
3. Open: `http://localhost:8000/test-widget.html`
4. Widget should appear!

---

## 🔍 **Troubleshooting**

### **Widget script not loading:**
1. **Check dev server is running:**
   - Should see: `Ready - started server on 0.0.0.0:3000`
   - If not, run: `npm run dev`

2. **Check widget.js route:**
   - Open: `http://localhost:3000/widget.js`
   - Should return JavaScript code
   - If 404, check route file exists

3. **Check browser console:**
   - Press F12
   - Look for errors in Console tab
   - Check Network tab for failed requests

4. **Check test HTML:**
   - Verify script tag points to: `http://localhost:3000/widget.js`
   - Check script tag has `data-tenant` and `data-widget-key`

---

## ✅ **Success Indicators**

When working correctly:
- ✅ `http://localhost:3000/widget.js` returns JavaScript code
- ✅ Test HTML page loads without console errors
- ✅ Widget button appears on page
- ✅ Clicking button opens chat window
- ✅ Can type and send messages

---

## 📝 **Next: Deploy to Production**

Once local testing works:
1. Deploy Admin UI to production
2. Widget.js will be at: `https://your-admin-ui-domain.com/widget.js`
3. Backend generates embed snippet with production URL
4. Tenants copy snippet and embed on their websites

---

**Quick Command Summary:**
```bash
# Terminal 1: Start Admin UI
npm run dev

# Terminal 2: Start local server for test HTML
py -m http.server 8000

# Browser: Test widget.js
http://localhost:3000/widget.js

# Browser: Test HTML page
http://localhost:8000/test-widget.html
```




