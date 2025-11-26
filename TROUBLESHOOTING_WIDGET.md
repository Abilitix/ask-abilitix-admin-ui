# Widget Troubleshooting Guide

**Issue:** Widget not appearing in test page

## 🔍 Common Issues & Fixes

### Issue 1: `document.currentScript` fails
**Problem:** When widget.js loads asynchronously or after DOM ready, `document.currentScript` may be `null`.

**Fix:** Widget.js already has a fallback: `document.querySelector('script[data-tenant]')`

**Check:**
- Open browser console (F12)
- Look for: `"Abilitix Widget: Script tag found"` or `"Abilitix Widget: Script tag not found"`

---

### Issue 2: Script not loading
**Problem:** widget.js fails to load from production URL.

**Check:**
1. Open browser DevTools (F12) → Network tab
2. Look for `widget.js` request
3. Check status:
   - **200 (green)**: Script loaded successfully
   - **404**: Script not found on server
   - **CORS error**: Cross-origin issue
   - **ERR_NAME_NOT_RESOLVED**: DNS issue

**Fix:**
- Verify URL: `https://app.abilitix.com.au/widget.js`
- Check if widget.js is deployed to production
- Check Vercel/public folder deployment

---

### Issue 3: Widget hidden or positioned off-screen
**Problem:** Widget container created but not visible.

**Check:**
1. Open browser console (F12)
2. Run: `document.getElementById('abilitix-widget-container')`
3. Check styles:
   ```javascript
   const widget = document.getElementById('abilitix-widget-container');
   if (widget) {
     console.log('Display:', window.getComputedStyle(widget).display);
     console.log('Visibility:', window.getComputedStyle(widget).visibility);
     console.log('Opacity:', window.getComputedStyle(widget).opacity);
     console.log('Position:', window.getComputedStyle(widget).position);
     console.log('Bottom:', window.getComputedStyle(widget).bottom);
     console.log('Right:', window.getComputedStyle(widget).right);
     console.log('Z-index:', window.getComputedStyle(widget).zIndex);
   }
   ```

**Fix:**
- Widget should be `position: fixed`, `bottom: 20px`, `right: 20px` (or left)
- Check for CSS conflicts in your page

---

### Issue 4: Missing required attributes
**Problem:** `data-tenant` or `data-widget-key` missing.

**Check:**
1. Inspect script tag in HTML
2. Verify attributes are present:
   ```html
   <script src="..." 
           data-tenant="abilitix-pilot" 
           data-widget-key="wid_..."></script>
   ```

**Fix:**
- Ensure script tag has both `data-tenant` and `data-widget-key`
- Get updated snippet from Admin UI: `/admin/settings`

---

### Issue 5: Widget runs before DOM ready
**Problem:** Widget script executes before `document.body` exists.

**Check:**
- Open browser console
- Look for: `"Abilitix Widget: Widget container added to page"`

**Fix:**
- Ensure script tag is placed **before** `</body>` tag
- Widget.js uses IIFE which runs immediately when script loads

---

### Issue 6: CORS / file:// protocol
**Problem:** Opening HTML file directly (`file://`) may cause CORS issues.

**Check:**
- Check URL in browser: `file:///...` vs `http://localhost:8000/...`

**Fix:**
- Use local server: `python -m http.server 8000`
- Or use `npx http-server` or `npx serve`

---

## 🧪 Step-by-Step Debugging

### Step 1: Check Script Loading
1. Open browser DevTools (F12) → Network tab
2. Reload page
3. Look for `widget.js` request
4. Check status code (should be 200)

### Step 2: Check Console Logs
1. Open browser DevTools (F12) → Console tab
2. Look for widget logs:
   - ✅ `"Abilitix Widget: Script loaded and executing..."`
   - ✅ `"Abilitix Widget: Script tag found"`
   - ✅ `"Abilitix Widget: Config loaded"`
   - ✅ `"Abilitix Widget: Widget container added to page"`
   - ✅ `"Abilitix Widget: Initialization complete"`
   - ✅ `"Abilitix Widget: Button should be visible now"`

3. Check for errors:
   - ❌ `"Abilitix Widget: Script tag not found"`
   - ❌ `"Abilitix Widget: Missing required attributes"`
   - ❌ Any red error messages

### Step 3: Check Widget Elements
1. Open browser console (F12)
2. Run these commands:
   ```javascript
   // Check widget container
   const container = document.getElementById('abilitix-widget-container');
   console.log('Container:', container);
   
   // Check widget button
   const button = document.getElementById('abilitix-widget-button');
   console.log('Button:', button);
   
   // Check widget window
   const window = document.getElementById('abilitix-widget-window');
   console.log('Window:', window);
   ```

### Step 4: Check Widget Styles
1. Open browser console (F12)
2. Run:
   ```javascript
   const widget = document.getElementById('abilitix-widget-container');
   if (widget) {
     const styles = window.getComputedStyle(widget);
     console.log('Widget Styles:', {
       display: styles.display,
       visibility: styles.visibility,
       opacity: styles.opacity,
       position: styles.position,
       bottom: styles.bottom,
       right: styles.right,
       left: styles.left,
       zIndex: styles.zIndex,
       width: styles.width,
       height: styles.height
     });
   }
   ```

### Step 5: Force Widget Visibility
1. Open browser console (F12)
2. Run:
   ```javascript
   const widget = document.getElementById('abilitix-widget-container');
   if (widget) {
     widget.style.setProperty('display', 'block', 'important');
     widget.style.setProperty('visibility', 'visible', 'important');
     widget.style.setProperty('opacity', '1', 'important');
     widget.style.setProperty('z-index', '999999', 'important');
     console.log('Forced widget visibility');
   }
   ```

---

## 🐛 Quick Diagnostic Script

Copy this into browser console (F12):

```javascript
(function() {
  console.log('=== WIDGET DIAGNOSTIC ===');
  
  // Check 1: Script tag
  const scriptTag = document.querySelector('script[src*="widget.js"]');
  console.log('1. Script tag:', scriptTag ? '✅ Found' : '❌ Missing');
  if (scriptTag) {
    console.log('   - src:', scriptTag.src);
    console.log('   - data-tenant:', scriptTag.getAttribute('data-tenant'));
    console.log('   - data-widget-key:', scriptTag.getAttribute('data-widget-key') ? 'Present' : 'Missing');
  }
  
  // Check 2: Widget container
  const container = document.getElementById('abilitix-widget-container');
  console.log('2. Widget container:', container ? '✅ Found' : '❌ Missing');
  if (container) {
    const styles = window.getComputedStyle(container);
    console.log('   - display:', styles.display);
    console.log('   - visibility:', styles.visibility);
    console.log('   - opacity:', styles.opacity);
    console.log('   - position:', styles.position);
    console.log('   - bottom:', styles.bottom);
    console.log('   - right:', styles.right);
    console.log('   - left:', styles.left);
    console.log('   - z-index:', styles.zIndex);
  }
  
  // Check 3: Widget button
  const button = document.getElementById('abilitix-widget-button');
  console.log('3. Widget button:', button ? '✅ Found' : '❌ Missing');
  if (button) {
    const styles = window.getComputedStyle(button);
    console.log('   - display:', styles.display);
    console.log('   - visibility:', styles.visibility);
    console.log('   - opacity:', styles.opacity);
    console.log('   - width:', styles.width);
    console.log('   - height:', styles.height);
  }
  
  // Check 4: Widget window
  const windowEl = document.getElementById('abilitix-widget-window');
  console.log('4. Widget window:', windowEl ? '✅ Found' : '❌ Missing');
  
  // Check 5: All widget elements
  const allWidget = document.querySelectorAll('[id*="widget"]');
  console.log('5. All widget elements:', allWidget.length, 'found');
  
  console.log('=== END DIAGNOSTIC ===');
})();
```

---

## ✅ Expected Behavior

**On Page Load:**
1. Script loads from `https://app.abilitix.com.au/widget.js`
2. Console shows widget initialization logs
3. Widget container appears at bottom-right (or bottom-left)
4. Widget button (circular, colored) is visible
5. Chat window is hidden (appears when button clicked)

**On Button Click:**
1. Chat window appears above button
2. Welcome message displays (if configured)
3. Can type and send messages

---

## 🔧 Next Steps

1. **Use debug HTML:** Open `test-widget-debug.html` in browser
2. **Check console:** Open DevTools (F12) → Console tab
3. **Check network:** Open DevTools (F12) → Network tab
4. **Run diagnostic:** Copy diagnostic script above into console
5. **Report findings:** Share console logs and diagnostic results



