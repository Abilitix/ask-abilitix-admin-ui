# Widget Testing - Step by Step

## 🚀 **Quick Test (Right Now)**

### **Step 1: Start Admin UI Dev Server**
Open a terminal and run:
```bash
npm run dev
```

**Wait for:** `✓ Ready in X seconds` and `○ Local: http://localhost:3000`

### **Step 2: Test widget.js Directly**
1. Open browser
2. Go to: `http://localhost:3000/widget.js`
3. **You should see:** JavaScript code (the widget.js file)

**If you see 404:**
- Check that `public/widget.js` file exists
- Restart dev server
- Check terminal for errors

### **Step 3: Test with HTML Page**
1. **Keep dev server running** (port 3000)
2. **Open another terminal**
3. Run: `py -m http.server 8000`
4. Open browser: `http://localhost:8000/test-widget.html`
5. Widget should appear!

---

## ✅ **What Should Happen**

1. **Widget button appears** (bottom-right or bottom-left)
2. **Click button** → Chat window opens
3. **Type message** → Click Send
4. **See response** (or loading indicator if API not ready)

---

## 🔍 **If Widget Still Not Loading**

### **Check 1: Is dev server running?**
- Terminal should show: `Ready - started server on 0.0.0.0:3000`
- If not, run: `npm run dev`

### **Check 2: Can you access widget.js?**
- Open: `http://localhost:3000/widget.js`
- Should see JavaScript code
- If 404, check `public/widget.js` exists

### **Check 3: Check browser console (F12)**
- Console tab: Any red errors?
- Network tab: Does `widget.js` request show?
  - Status should be 200 (green)
  - If red, what's the error?

### **Check 4: Check test HTML script tag**
- Open `test-widget.html` in editor
- Verify script tag has:
  - `src="http://localhost:3000/widget.js"`
  - `data-tenant="abilitix-pilot"`
  - `data-widget-key="wid_..."`

---

## 📝 **Current Status**

**Files Created:**
- ✅ `public/widget.js` - Widget JavaScript
- ✅ `src/app/widget.js/route.ts` - Next.js route (serves widget.js)
- ✅ `test-widget.html` - Test page

**What You Need:**
1. Dev server running on port 3000
2. Local server running on port 8000 (for test HTML)
3. Both running at the same time

---

## 🎯 **Next: Deploy to Production**

Once local testing works:

1. **Deploy Admin UI** to production (Vercel/Render/etc.)
2. **Widget.js will be at:** `https://your-admin-ui-domain.com/widget.js`
3. **Backend generates embed snippet** with production URL
4. **Any tenant can:**
   - Go to `/admin/settings`
   - Copy their embed snippet
   - Paste on their website
   - Widget works with their tenant data

---

**Try these steps and let me know what you see!**




