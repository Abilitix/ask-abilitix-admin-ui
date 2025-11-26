# Quick Widget Test Guide

**Date:** 2025-11-21  
**Quick steps to test widget in production**

---

## 🚀 **Quick Test (3 Steps)**

### **Step 1: Verify Widget.js is Accessible**

Open in browser: `https://app.abilitix.com.au/widget.js`
- Should see JavaScript code (not 404)
- Code starts with `/**`

---

### **Step 2: Get Embed Snippet from Admin UI**

1. **Go to:** `https://app.abilitix.com.au/admin/settings`
2. **Scroll to:** "Website Widget" section
3. **Click:** "Copy Snippet" button
4. **Snippet should look like:**
   ```html
   <script src="https://app.abilitix.com.au/widget.js" 
           data-tenant="abilitix-pilot" 
           data-widget-key="wid_..."></script>
   ```

---

### **Step 3: Test Widget in HTML Page**

1. **Open `test-widget.html` in browser:**
   - Double-click file, or
   - Serve via local server: `py -m http.server 8000`
   - Then open: `http://localhost:8000/test-widget.html`

2. **Check widget appears:**
   - Widget button should appear (bottom-right or bottom-left)
   - Button has chat icon
   - Button has your primary color

3. **Test widget functionality:**
   - Click button → Chat window opens
   - Should see title and welcome message
   - Type message → Click Send
   - Should see loading indicator
   - Should see API response

---

## ✅ **What You Should See**

**Widget Button:**
- ✅ Appears at bottom-right or bottom-left
- ✅ Has chat icon
- ✅ Has your primary color
- ✅ Hover effect works

**Chat Window (when opened):**
- ✅ Header with your title
- ✅ Welcome message (if configured)
- ✅ Message input field
- ✅ Send button

**When Sending Message:**
- ✅ Loading indicator (3 dots)
- ✅ Your message appears
- ✅ API response appears

---

## 🔍 **Check Browser Console (F12)**

**Should see widget logs:**
```
Abilitix Widget: Script loaded and executing...
Abilitix Widget: Script tag found
Abilitix Widget: Config loaded
Abilitix Widget: Widget container added to page
Abilitix Widget: Initialization complete
Abilitix Widget: Button should be visible now
```

**Should NOT see:**
- ❌ Red errors
- ❌ 404 errors for widget.js
- ❌ API errors

---

## 🎨 **Test Theme Customization**

1. **In Admin UI** (`https://app.abilitix.com.au/admin/settings`):
   - Change primary color (e.g., `#10b981` for green)
   - Change position (bottom-left)
   - Settings auto-save

2. **Get updated snippet:**
   - Click "Copy Snippet" again
   - Update HTML with new snippet

3. **Refresh page:**
   - Widget should reflect new theme
   - Button should be new color
   - Button should be in new position

---

## 🐛 **If Widget Doesn't Appear**

1. **Check Console (F12):**
   - Any red errors?
   - Check Network tab - is `widget.js` loading?

2. **Check Embed Snippet:**
   - Is `data-tenant` present?
   - Is `data-widget-key` present?
   - Is URL correct: `https://app.abilitix.com.au/widget.js`?

3. **Check Widget.js:**
   - Can you access `https://app.abilitix.com.au/widget.js` directly?
   - Should return JavaScript code

---

## 📝 **Summary**

**Quick Test:**
1. ✅ Verify widget.js accessible
2. ✅ Get embed snippet from Admin UI
3. ✅ Test widget in HTML page

**What to Check:**
- Widget button appears
- Chat window opens
- Messages send successfully
- API responses work
- Theme customization works

**Ready to Test!** Follow the 3 steps above to test the widget.




