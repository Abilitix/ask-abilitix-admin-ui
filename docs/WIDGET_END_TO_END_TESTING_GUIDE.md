# Widget End-to-End Testing Guide

**Date:** 2025-11-21  
**Purpose:** Step-by-step guide to test the widget from Admin UI to website embedding

---

## 🎯 **Quick Start**

1. **Get embed snippet** from Admin UI (`/admin/settings`)
2. **Paste into test HTML file** (`test-widget.html`)
3. **Open in browser** and verify widget works

---

## 📋 **Detailed Step-by-Step Instructions**

### **Step 1: Access Widget Settings in Admin UI**

1. Open your Admin UI in a browser
2. Navigate to: `/admin/settings`
3. Scroll down to the **"Website Widget"** section
4. You should see:
   - Widget Status (Enabled/Disabled button)
   - Widget Key (masked)
   - Embed Snippet (textarea with code)

### **Step 2: Enable Widget (If Not Already Enabled)**

1. Check the **Widget Status** section
2. If it shows "Disabled", click the **"Disabled"** button
3. Wait for the toast notification confirming it's enabled
4. Verify the button now shows **"Enabled"** in green

### **Step 3: Configure Theme Settings (Optional - Phase 2+)**

If you want to test theme customization:

1. Scroll to **"Theme Customization"** section
2. Test each setting:
   - **Primary Color:** Click color picker or enter hex (e.g., `#3b82f6`)
   - **Accent Color:** Click color picker or enter hex (e.g., `#8b5cf6`)
   - **Widget Title:** Enter text (e.g., "Chat with us")
   - **Welcome Message:** Enter text (e.g., "Hi! How can I help you today?")
   - **Widget Position:** Select "Bottom Right" or "Bottom Left"
3. Wait for auto-save (you'll see a spinner, then a success toast)
4. Verify the embed snippet updates automatically

### **Step 4: Copy Embed Snippet**

1. In the **"Embed Snippet"** section, you'll see a textarea with code
2. Click the **"Copy Snippet"** button
3. Verify the button shows **"Copied"** with a checkmark for 2 seconds
4. The embed snippet is now in your clipboard

**What the embed snippet looks like:**
```html
<script src="https://widget.example.com/embed.js?key=YOUR_WIDGET_KEY"></script>
```

Or with theme attributes (Phase 2+):
```html
<script src="https://widget.example.com/embed.js?key=YOUR_WIDGET_KEY" 
        data-theme-primary="#3b82f6" 
        data-theme-accent="#8b5cf6"
        data-title="Chat with us"
        data-welcome-message="Hi! How can I help you today?"
        data-position="bottom-right"></script>
```

### **Step 5: Prepare Test HTML File**

1. Open the file `test-widget.html` in your code editor (or any text editor)
2. Find the section that says:
   ```html
   <!-- PASTE YOUR EMBED SNIPPET HERE -->
   ```
3. Replace the placeholder script with your actual embed snippet
4. Save the file

**Example:**
```html
<!-- Before (placeholder): -->
<script>
    console.log('⚠️ Widget embed snippet not found!');
</script>

<!-- After (your actual snippet): -->
<script src="https://widget.example.com/embed.js?key=YOUR_WIDGET_KEY"></script>
```

### **Step 6: Open Test HTML in Browser**

**Option A: Double-click method**
1. Navigate to the `test-widget.html` file in your file explorer
2. Double-click the file
3. It should open in your default browser

**Option B: Right-click method**
1. Right-click `test-widget.html`
2. Select "Open with" → Choose your browser (Chrome, Firefox, Edge, etc.)

**Option C: Drag and drop**
1. Open your browser
2. Drag `test-widget.html` into the browser window

**Option D: Local server (recommended for production-like testing)**
```bash
# Using Python 3
python -m http.server 8000

# Using Node.js (if you have http-server installed)
npx http-server -p 8000

# Then open: http://localhost:8000/test-widget.html
```

### **Step 7: Verify Widget Appears**

After opening the test page:

1. **Look for the widget button:**
   - Should appear in bottom-right or bottom-left corner (based on your position setting)
   - Usually a circular button with a chat icon
   - May have your configured colors

2. **Check browser console (F12):**
   - Press `F12` to open developer tools
   - Go to "Console" tab
   - Look for any errors (red text)
   - Look for widget initialization messages

3. **If widget doesn't appear:**
   - Check console for errors
   - Verify embed snippet is correctly pasted
   - Verify widget is enabled in Admin UI
   - Check network tab for failed script loads

### **Step 8: Test Widget Functionality**

1. **Click the widget button:**
   - Widget chat interface should open
   - Should show your configured title (if set)
   - Should show your welcome message (if set)

2. **Verify theme colors:**
   - Check if primary color matches your setting
   - Check if accent color matches your setting
   - Colors should appear on buttons, highlights, etc.

3. **Test chat functionality:**
   - Type a question in the chat input
   - Press Enter or click Send
   - Wait for response
   - Verify widget responds correctly

4. **Test widget position:**
   - Scroll the page up and down
   - Widget should stay fixed in position
   - Should remain accessible while scrolling

### **Step 9: Test Widget Disabled State**

1. Go back to Admin UI (`/admin/settings`)
2. Click **"Enabled"** button to disable widget
3. Wait for confirmation toast
4. Refresh your test HTML page
5. Widget should **NOT appear** (or show disabled message)
6. Re-enable widget in Admin UI
7. Refresh test page again
8. Widget should appear again

### **Step 10: Test Theme Changes**

1. In Admin UI, change theme settings:
   - Change primary color
   - Change accent color
   - Change title
   - Change welcome message
   - Change position

2. Wait for auto-save to complete (spinner → success toast)

3. Refresh your test HTML page

4. Verify widget reflects new theme settings:
   - New colors applied
   - New title shown
   - New welcome message shown
   - New position (if changed)

**Note:** You may need to clear browser cache if widget script is cached:
- Chrome/Edge: `Ctrl+Shift+Delete` → Clear cached images and files
- Firefox: `Ctrl+Shift+Delete` → Clear cache
- Or use incognito/private mode

---

## 🐛 **Troubleshooting**

### **Widget Not Appearing**

**Checklist:**
- ✅ Widget is enabled in Admin UI
- ✅ Embed snippet is correctly pasted in HTML
- ✅ No JavaScript errors in browser console
- ✅ Widget script loads successfully (check Network tab)
- ✅ Widget key is valid (not rotated/deleted)

**Common Issues:**

1. **Script not loading:**
   - Check Network tab in browser console
   - Look for failed requests to widget script URL
   - Verify widget service URL is correct

2. **CORS errors:**
   - Widget service may need to allow your domain
   - Check if domain is in allowed domains list
   - Try opening from `localhost` or a proper domain

3. **Widget key invalid:**
   - Key may have been rotated
   - Get new embed snippet from Admin UI
   - Paste updated snippet into test HTML

### **Widget Appears But Doesn't Work**

**Checklist:**
- ✅ Widget chat interface opens
- ✅ Can type messages
- ✅ Messages send successfully
- ✅ Responses appear

**Common Issues:**

1. **No response from widget:**
   - Check browser console for API errors
   - Verify backend/widget service is running
   - Check network tab for failed API calls

2. **Widget stuck loading:**
   - Check browser console for errors
   - Verify widget service is accessible
   - Check network connectivity

### **Theme Changes Not Reflecting**

**Checklist:**
- ✅ Theme settings saved successfully (check toast)
- ✅ Embed snippet updated (check if includes theme attributes)
- ✅ Browser cache cleared
- ✅ Widget script supports theme attributes

**Common Issues:**

1. **Browser cache:**
   - Clear browser cache
   - Use incognito/private mode
   - Hard refresh: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)

2. **Snippet not updated:**
   - Check if embed snippet includes `data-theme-*` attributes
   - If not, widget service may not support theme attributes yet
   - Verify Phase 2+ is deployed to backend

---

## ✅ **Testing Checklist**

Use this checklist to verify everything works:

### **Admin UI Testing**
- [ ] Can access `/admin/settings`
- [ ] Can see Widget Settings section
- [ ] Can enable/disable widget
- [ ] Can view widget key (masked)
- [ ] Can copy widget key
- [ ] Can rotate widget key
- [ ] Can view embed snippet
- [ ] Can copy embed snippet
- [ ] Can configure theme settings (Phase 2+)
- [ ] Theme settings auto-save
- [ ] Embed snippet updates after theme changes

### **Widget Embedding Testing**
- [ ] Can paste embed snippet into HTML
- [ ] Widget script loads without errors
- [ ] Widget button appears on page
- [ ] Widget appears in correct position
- [ ] Widget button is clickable
- [ ] Widget chat interface opens
- [ ] Widget shows configured title (if set)
- [ ] Widget shows welcome message (if set)
- [ ] Widget colors match theme settings
- [ ] Can type and send messages
- [ ] Widget responds to questions
- [ ] Widget stays fixed when scrolling
- [ ] Widget works on different screen sizes

### **Widget State Testing**
- [ ] Widget appears when enabled
- [ ] Widget disappears when disabled
- [ ] Widget reappears when re-enabled
- [ ] Theme changes reflect on widget
- [ ] Key rotation updates embed snippet

---

## 🚀 **Next Steps After Testing**

1. **If everything works:**
   - Deploy Phase 2+ (theme settings) to production
   - Document widget URL and configuration
   - Share embed snippet with website team

2. **If issues found:**
   - Document the issue
   - Check browser console for errors
   - Check backend/widget service logs
   - Report to development team

3. **For production deployment:**
   - Test on actual website domain
   - Verify domain is in allowed domains list
   - Test with real user traffic
   - Monitor widget usage statistics

---

## 📝 **Test HTML File Location**

The test HTML file is located at:
```
test-widget.html
```

You can:
- Open it directly in a browser
- Serve it via local server
- Deploy it to a test website
- Share it with team members for testing

---

## 💡 **Tips for Better Testing**

1. **Use browser developer tools:**
   - F12 to open console
   - Check Network tab for script loads
   - Check Console tab for errors
   - Use Elements tab to inspect widget DOM

2. **Test on multiple browsers:**
   - Chrome
   - Firefox
   - Safari
   - Edge

3. **Test on different devices:**
   - Desktop
   - Tablet
   - Mobile

4. **Test different scenarios:**
   - Widget enabled/disabled
   - Different theme configurations
   - Different widget positions
   - Long conversations
   - Multiple page navigations

---

**Status:** ✅ **Ready for Testing** - Follow the steps above to test end-to-end!




