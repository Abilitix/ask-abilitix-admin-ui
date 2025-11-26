# Widget Testing Guide - Production

**Date:** 2025-11-21  
**Purpose:** Step-by-step guide to test widget in production

---

## 🎯 **Quick Test (5 Steps)**

### **Step 1: Verify Widget.js is Accessible**

1. **Open browser:**
   - Go to: `https://app.abilitix.com.au/widget.js`
   - Should return JavaScript code starting with `/**`
   - No 404 errors

2. **Check browser console (F12):**
   - No errors
   - Should see widget code

---

### **Step 2: Get Embed Snippet from Admin UI**

1. **Go to Admin UI:**
   - URL: `https://app.abilitix.com.au/admin/settings`
   - Login if needed

2. **Scroll to "Website Widget" section:**
   - Should see widget settings
   - Widget status toggle (Enabled/Disabled)
   - Theme customization options

3. **Copy Embed Snippet:**
   - Click "Copy Snippet" button
   - Should see checkmark "Copied" for 2 seconds
   - Verify snippet looks like:
     ```html
     <script src="https://app.abilitix.com.au/widget.js" 
             data-tenant="abilitix-pilot" 
             data-widget-key="wid_..."></script>
     ```

---

### **Step 3: Test Widget in HTML Page**

1. **Update test HTML:**
   - Open `test-widget.html` in editor
   - Replace script tag with production embed snippet
   - Save file

2. **Open in browser:**
   - Open `test-widget.html` in browser
   - Or serve via local server: `py -m http.server 8000`
   - Then open: `http://localhost:8000/test-widget.html`

---

### **Step 4: Verify Widget Appears**

**Expected Behavior:**
- ✅ Widget button appears (bottom-right or bottom-left)
- ✅ Button has your primary color
- ✅ Button has chat icon

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

**If widget doesn't appear:**
- Check console for errors
- Check Network tab - is `widget.js` loading?
- Verify embed snippet is correct

---

### **Step 5: Test Widget Functionality**

1. **Click Widget Button:**
   - Chat window should open
   - Should see header with your title
   - Should see welcome message (if configured)
   - Should see message input field

2. **Send a Message:**
   - Type a message
   - Click "Send" or press Enter
   - Should see loading indicator (3 dots)
   - Should see your message in chat
   - Should see API response

3. **Test API Integration:**
   - Message should send to Runtime API
   - Response should display in chat
   - Check Network tab (F12) for API request
   - Should see request to: `https://ask-abilitix-runtime.onrender.com/ask`
   - Should include headers: `x-tenant-slug` and `X-Widget-Key`

---

## 🎨 **Test Theme Customization**

### **Step 1: Customize Theme in Admin UI**

1. **Go to Admin UI:**
   - URL: `https://app.abilitix.com.au/admin/settings`
   - Scroll to "Theme Customization" section

2. **Change Settings:**
   - **Primary Color:** Change to a different color (e.g., `#10b981` for green)
   - **Accent Color:** Change to a different color (e.g., `#f59e0b` for amber)
   - **Title:** Change to "Ask Us Anything"
   - **Welcome Message:** Change to "How can we help you today?"
   - **Position:** Change to "bottom-left"
   - Settings auto-save

3. **Wait for Save:**
   - Should see saving indicator
   - Should see success message

---

### **Step 2: Get Updated Embed Snippet**

1. **Copy Embed Snippet Again:**
   - Click "Copy Snippet" button
   - New snippet should include theme attributes:
     ```html
     <script src="https://app.abilitix.com.au/widget.js" 
             data-tenant="abilitix-pilot" 
             data-widget-key="wid_..."
             data-theme-primary="#10b981"
             data-theme-accent="#f59e0b"
             data-title="Ask Us Anything"
             data-welcome-message="How can we help you today?"
             data-position="bottom-left"></script>
     ```

---

### **Step 3: Test Updated Widget**

1. **Update HTML with New Snippet:**
   - Replace script tag with new snippet
   - Refresh page

2. **Verify Theme Changes:**
   - ✅ Widget button should be new primary color
   - ✅ Widget button should be in new position (bottom-left)
   - ✅ Chat window header should have new title
   - ✅ Welcome message should be updated
   - ✅ Colors should reflect your theme

---

## 🔍 **Testing Checklist**

### **Widget.js Loading:**
- [ ] Widget.js accessible at production URL
- [ ] No console errors
- [ ] Widget loads in HTML page

### **Widget Appearance:**
- [ ] Widget button appears
- [ ] Button is correct color
- [ ] Button is in correct position
- [ ] Button has chat icon

### **Widget Functionality:**
- [ ] Click button opens chat window
- [ ] Chat window shows title
- [ ] Welcome message displays
- [ ] Can type messages
- [ ] Can send messages
- [ ] Loading indicators show
- [ ] API responses display

### **API Integration:**
- [ ] Messages send to Runtime API
- [ ] Request includes `x-tenant-slug` header
- [ ] Request includes `X-Widget-Key` header
- [ ] Responses display correctly
- [ ] Error handling works

### **Theme Customization:**
- [ ] Primary color applies
- [ ] Accent color applies
- [ ] Title displays correctly
- [ ] Welcome message displays correctly
- [ ] Position works (bottom-right/left)

---

## 🐛 **Troubleshooting**

### **Widget Not Appearing:**

1. **Check Console (F12):**
   - Any red errors?
   - Check Network tab - is `widget.js` loading?

2. **Check Embed Snippet:**
   - Is script tag before `</body>`?
   - Are `data-tenant` and `data-widget-key` present?
   - Is URL correct: `https://app.abilitix.com.au/widget.js`?

3. **Check Widget.js:**
   - Can you access `https://app.abilitix.com.au/widget.js` directly?
   - Should return JavaScript code

---

### **API Not Working:**

1. **Check Network Tab (F12):**
   - Is request sent to Runtime API?
   - Status should be 200 (green)
   - If 401/403: Widget key validation failed
   - If 404: API endpoint not found

2. **Check Headers:**
   - Request should include `x-tenant-slug`
   - Request should include `X-Widget-Key`
   - Check if headers are correct

3. **Check Widget Key:**
   - Is widget key valid?
   - Is widget enabled in Admin UI?
   - Try rotating widget key

---

### **Theme Not Applying:**

1. **Check Embed Snippet:**
   - Does snippet include theme attributes?
   - Are attribute names correct (e.g., `data-theme-primary`)?

2. **Check Admin UI:**
   - Are theme settings saved?
   - Did you copy updated snippet?

3. **Refresh Page:**
   - Widget.js loads on page load
   - Theme applies when widget initializes
   - Refresh page after updating snippet

---

## 📝 **Test HTML Example**

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Widget Test</title>
</head>
<body>
    <h1>Widget Test Page</h1>
    <p>Scroll down to see the widget button at the bottom.</p>
    
    <!-- YOUR WIDGET EMBED SNIPPET (MUST BE BEFORE </body> TAG) -->
    <script src="https://app.abilitix.com.au/widget.js" 
            data-tenant="abilitix-pilot" 
            data-widget-key="wid_Y-oFeJtCWQcnZMvxgifZy9DCzQji4qii"
            data-theme-primary="#3b82f6"
            data-theme-accent="#8b5cf6"
            data-title="Chat with us"
            data-welcome-message="Hi! How can I help you today?"
            data-position="bottom-right"></script>
</body>
</html>
```

---

## ✅ **Summary**

**Quick Test Steps:**
1. ✅ Verify widget.js is accessible
2. ✅ Get embed snippet from Admin UI
3. ✅ Test widget in HTML page
4. ✅ Verify widget appears and works
5. ✅ Test theme customization

**What to Test:**
- Widget.js loading
- Widget appearance
- Widget functionality
- API integration
- Theme customization

**Ready to Test!** Follow the steps above to test the widget end-to-end.




