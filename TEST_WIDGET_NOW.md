# Test Widget Right Now - Quick Steps

## ✅ **Current Setup:**
- Dev server: `http://localhost:3001` ✅
- Local server: `http://localhost:8000` ✅
- Test HTML: Updated to use port 3001 ✅

## 🧪 **Test Steps:**

### **Step 1: Verify widget.js is Accessible**
1. Open browser
2. Go to: `http://localhost:3001/widget.js`
3. **Expected:** You should see JavaScript code starting with `/**`
4. **If 404:** Check that `public/widget.js` file exists

### **Step 2: Check Browser Console**
1. Open: `http://localhost:8000/test-widget.html`
2. Press **F12** to open Developer Tools
3. Go to **Console** tab
4. Look for:
   - Any red errors?
   - Messages about widget loading?
   - Any warnings?

### **Step 3: Check Network Tab**
1. In Developer Tools, go to **Network** tab
2. Refresh the page (F5)
3. Look for `widget.js` in the list
4. Check:
   - **Status:** Should be 200 (green) or show error
   - **URL:** Should be `http://localhost:3001/widget.js`
   - **Type:** Should be "script" or "javascript"

### **Step 4: Verify Script Tag**
1. In Developer Tools, go to **Elements** tab
2. Press **Ctrl+F** (or Cmd+F on Mac)
3. Search for: `widget.js`
4. Verify script tag exists and has:
   - `src="http://localhost:3001/widget.js"`
   - `data-tenant="abilitix-pilot"`
   - `data-widget-key="wid_..."`

---

## 🔍 **Common Issues:**

### **Issue 1: widget.js returns 404**
**Check:**
- File exists at: `public/widget.js`
- Dev server is running on port 3001
- Try accessing: `http://localhost:3001/widget.js` directly

### **Issue 2: CORS Error**
**If you see CORS error:**
- This is normal for local testing
- Widget.js should still work
- Production won't have this issue

### **Issue 3: Script Tag Not Found**
**Check:**
- Script tag is before `</body>` tag
- Script tag has correct attributes
- No JavaScript errors preventing execution

---

## 📝 **What to Share:**

If widget still not working, please share:
1. **Console errors** (F12 → Console tab)
2. **Network tab** - Status of `widget.js` request
3. **What you see** when accessing `http://localhost:3001/widget.js` directly

---

**Try accessing `http://localhost:3001/widget.js` directly first - that will tell us if the file is being served correctly!**




