# Widget Deployment - End-to-End Plan

**Date:** 2025-11-21  
**Purpose:** Complete guide for deploying and testing the widget from Admin UI to website

---

## 🎯 **Overview**

The widget system has two main components:

1. **Admin UI** (✅ Complete) - Configuration interface
2. **Widget Service** (⏸️ Needs deployment) - Serves widget.js and handles widget functionality

---

## 📋 **End-to-End Architecture**

```
┌─────────────────┐
│   Admin UI      │  ← Configuration interface (✅ Done)
│  /admin/settings│  - Widget settings
│                 │  - Theme customization
│                 │  - Embed snippet generation
└────────┬────────┘
         │
         │ Generates embed snippet
         │
         ▼
┌─────────────────┐
│  Widget Service │  ← Serves widget.js (⏸️ Needs deployment)
│ app.abilitix.com│  - Hosts widget.js
│                 │  - Widget API endpoints
│                 │  - Chat interface
└────────┬────────┘
         │
         │ User embeds snippet
         │
         ▼
┌─────────────────┐
│  Your Website   │  ← Customer website (Hostinger)
│  (Hostinger)    │  - Embeds widget script tag
│                 │  - Widget appears on pages
└─────────────────┘
```

---

## 🚀 **Option 1: Widget Service Hosts widget.js (Recommended)**

### **How It Works:**
- Widget service builds and hosts `widget.js` at a public URL
- Your website just embeds the script tag (no hosting needed)
- Widget service handles all widget functionality

### **What You Need:**

#### **Step 1: Deploy Widget Service**
1. **Build widget service** (separate project/repository)
   - Creates `widget.js` bundle
   - Widget chat interface
   - Widget API endpoints

2. **Deploy to hosting** (e.g., Vercel, Netlify, Render, etc.)
   - Deploy widget service
   - Configure domain: `app.abilitix.com`
   - Ensure `widget.js` is accessible at: `https://app.abilitix.com/widget.js`

3. **Verify deployment:**
   ```bash
   # Test if widget.js is accessible
   curl https://app.abilitix.com/widget.js
   # Should return JavaScript code, not 404
   ```

#### **Step 2: Configure Admin UI**
1. Admin UI already generates embed snippet ✅
2. Embed snippet should point to: `https://app.abilitix.com/widget.js`
3. Verify snippet format:
   ```html
   <script src="https://app.abilitix.com/widget.js" 
           data-tenant="abilitix-pilot" 
           data-widget-key="wid_..."></script>
   ```

#### **Step 3: Embed on Your Website (Hostinger)**
1. **Get embed snippet from Admin UI:**
   - Go to `/admin/settings`
   - Scroll to "Website Widget" section
   - Click "Copy Snippet"

2. **Add to your Hostinger website:**
   - **Option A: Add to HTML pages directly**
     - Edit your HTML files
     - Paste snippet before `</body>` tag on each page
   
   - **Option B: Add via CMS/Website Builder**
     - If using WordPress, add to footer.php or use a plugin
     - If using website builder, add custom HTML block
     - Paste snippet in the custom HTML section
   
   - **Option C: Add via Header/Footer Code**
     - Most hosting panels have "Header/Footer Code" section
     - Add snippet to "Footer Code" section
     - This adds it to all pages automatically

3. **Save and publish** your website

4. **Test:**
   - Visit your website
   - Widget should appear (bottom-right or bottom-left)
   - Click widget to test chat functionality

### **Advantages:**
- ✅ No hosting needed on your website
- ✅ Widget updates automatically (when widget service updates)
- ✅ Centralized management
- ✅ Better performance (CDN, caching)

### **Requirements:**
- Widget service must be deployed and accessible
- Domain `app.abilitix.com` must be configured
- Widget service must handle widget API requests

---

## 🏠 **Option 2: Self-Host widget.js on Hostinger**

### **How It Works:**
- Build `widget.js` yourself
- Upload to Hostinger
- Update embed snippet to point to your Hostinger URL

### **What You Need:**

#### **Step 1: Build widget.js**
1. **Get widget source code** (if available)
   - Widget service repository
   - Build widget JavaScript bundle

2. **Build widget.js:**
   ```bash
   # Example build command (depends on widget service setup)
   npm run build:widget
   # or
   yarn build:widget
   ```

3. **Output:** `widget.js` file (or `dist/widget.js`)

#### **Step 2: Upload to Hostinger**
1. **Access Hostinger File Manager:**
   - Log in to Hostinger control panel
   - Go to File Manager
   - Navigate to your website's root directory (usually `public_html`)

2. **Create widget directory** (optional, for organization):
   - Create folder: `widget/` or `js/widget/`
   - Upload `widget.js` to this folder

3. **Verify file is accessible:**
   - URL should be: `https://yourdomain.com/widget/widget.js`
   - Or: `https://yourdomain.com/js/widget/widget.js`
   - Test in browser - should load JavaScript file

#### **Step 3: Update Embed Snippet**
1. **Modify embed snippet** to point to your Hostinger URL:
   ```html
   <!-- Original (widget service hosted): -->
   <script src="https://app.abilitix.com/widget.js" 
           data-tenant="abilitix-pilot" 
           data-widget-key="wid_..."></script>
   
   <!-- Updated (self-hosted on Hostinger): -->
   <script src="https://yourdomain.com/widget/widget.js" 
           data-tenant="abilitix-pilot" 
           data-widget-key="wid_..."></script>
   ```

2. **Update Admin UI** (if needed):
   - May need to modify Admin UI to generate correct embed snippet
   - Or manually update snippet when copying

#### **Step 4: Embed on Your Website**
1. Add updated snippet to your website (same as Option 1, Step 3)
2. Test widget functionality

### **Advantages:**
- ✅ Full control over widget hosting
- ✅ No dependency on external widget service
- ✅ Can customize widget.js if needed

### **Disadvantages:**
- ❌ Must rebuild and re-upload when widget updates
- ❌ Uses your hosting bandwidth
- ❌ More maintenance required

---

## 🎯 **Recommended Approach: Option 1**

**Use Option 1 (Widget Service Hosts)** because:
- Less maintenance
- Automatic updates
- Better performance
- Standard approach

**Use Option 2 (Self-Host)** only if:
- Widget service is not available
- You need full control
- You want to customize widget.js

---

## 📝 **Current Status & Next Steps**

### **✅ What's Complete:**
- Admin UI widget settings interface
- Widget key management
- Theme customization
- Embed snippet generation
- Test HTML page

### **⏸️ What's Needed:**

#### **If Using Option 1 (Recommended):**
1. **Deploy Widget Service:**
   - Build widget service application
   - Deploy to hosting (Vercel, Netlify, Render, etc.)
   - Configure domain: `app.abilitix.com`
   - Verify `widget.js` is accessible

2. **Test Widget Service:**
   - Access `https://app.abilitix.com/widget.js` in browser
   - Should return JavaScript code
   - Test widget API endpoints

3. **Update DNS (if needed):**
   - Point `app.abilitix.com` to widget service hosting
   - Wait for DNS propagation

4. **Test End-to-End:**
   - Use test HTML page: `test-widget.html`
   - Verify widget loads and works
   - Embed on actual website

#### **If Using Option 2 (Self-Host):**
1. **Get Widget Source:**
   - Obtain widget service source code
   - Build `widget.js` file

2. **Upload to Hostinger:**
   - Upload `widget.js` to your website
   - Verify file is accessible via URL

3. **Update Embed Snippet:**
   - Modify snippet to point to your Hostinger URL
   - Test widget functionality

---

## 🔍 **Testing Checklist**

### **Widget Service Deployment:**
- [ ] Widget service is deployed
- [ ] `widget.js` is accessible at public URL
- [ ] Widget API endpoints are working
- [ ] Domain is configured correctly
- [ ] DNS is propagated

### **Admin UI:**
- [ ] Widget settings page loads
- [ ] Can enable/disable widget
- [ ] Can configure theme settings
- [ ] Embed snippet is generated correctly
- [ ] Can copy embed snippet

### **Website Integration:**
- [ ] Embed snippet is added to website
- [ ] Widget script loads (check Network tab)
- [ ] Widget button appears on page
- [ ] Widget chat interface opens
- [ ] Can send messages
- [ ] Widget responds correctly
- [ ] Theme settings are applied

---

## 🐛 **Troubleshooting**

### **Widget Not Loading:**
1. **Check widget.js URL:**
   - Verify URL is correct in embed snippet
   - Test URL directly in browser
   - Should return JavaScript, not 404

2. **Check DNS:**
   - Verify domain resolves correctly
   - Use `nslookup app.abilitix.com` or `ping app.abilitix.com`
   - Wait for DNS propagation (can take up to 48 hours)

3. **Check CORS:**
   - Widget service must allow requests from your website domain
   - Check browser console for CORS errors
   - Configure CORS headers on widget service

4. **Check Widget Key:**
   - Verify widget key is valid
   - Check widget is enabled in Admin UI
   - Verify widget key hasn't been rotated

### **Widget Not Appearing:**
1. **Check Script Tag:**
   - Verify script tag is in HTML
   - Check script tag is before `</body>`
   - Verify no JavaScript errors in console

2. **Check Widget Service:**
   - Verify widget service is running
   - Check widget service logs
   - Test widget API endpoints

3. **Check Browser Console:**
   - Look for JavaScript errors
   - Check Network tab for failed requests
   - Verify widget.js loaded successfully

---

## 📚 **Resources**

- **Admin UI Widget Settings:** `/admin/settings` → "Website Widget" section
- **Test HTML Page:** `test-widget.html` (in project root)
- **Widget Service:** Needs to be deployed separately
- **Hostinger Help:** https://www.hostinger.com/tutorials

---

## ✅ **Summary**

**For Hostinger Website:**
1. ✅ **No need to host widget.js** - Widget service handles it (Option 1)
2. ✅ **Just embed the snippet** - Copy from Admin UI, paste in your website
3. ✅ **Add to footer/header code** - Easiest way to add to all pages

**What You Need to Do:**
1. **Deploy widget service** (if not already done)
2. **Get embed snippet** from Admin UI
3. **Add snippet to Hostinger website** (footer code or HTML)
4. **Test widget** on your website

**Current Blocker:**
- Widget service at `app.abilitix.com` is not deployed/accessible
- Need to deploy widget service first before widget will work

---

**Status:** ⏸️ **Waiting for Widget Service Deployment** - Once widget service is deployed and `widget.js` is accessible, the widget will work on your Hostinger website.




