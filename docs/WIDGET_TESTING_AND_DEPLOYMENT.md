# Widget Testing & Deployment Guide

**Date:** 2025-11-21  
**Purpose:** Complete guide for testing and deploying widget.js to production

---

## 🎯 **How It Works for Multiple Tenants**

### **Multi-Tenant Architecture:**

```
┌─────────────────┐
│  Tenant A       │  → Gets embed snippet with:
│  Admin UI       │     - data-tenant="tenant-a"
│                 │     - data-widget-key="wid_abc123..."
└─────────────────┘

┌─────────────────┐
│  Tenant B       │  → Gets embed snippet with:
│  Admin UI       │     - data-tenant="tenant-b"
│                 │     - data-widget-key="wid_xyz789..."
└─────────────────┘

         │
         │ Both use same widget.js URL
         │
         ▼
┌─────────────────┐
│  widget.js      │  ← Single widget.js file
│  (Shared)      │     Reads tenant/key from script tag
└─────────────────┘
         │
         │ Sends to API with tenant/key
         │
         ▼
┌─────────────────┐
│  Backend API    │  ← Validates widget key
│                 │     Routes to correct tenant
│                 │     Returns tenant-specific answers
└─────────────────┘
```

**Key Points:**
- ✅ **Single widget.js file** - Served to all tenants
- ✅ **Tenant-specific snippets** - Each tenant gets unique `data-tenant` and `data-widget-key`
- ✅ **Backend routing** - API validates key and routes to correct tenant
- ✅ **Isolation** - Each tenant's widget only accesses their own data

---

## 🧪 **Testing Steps**

### **Phase 1: Local Testing**

#### **Step 1: Start Admin UI Dev Server**
```bash
npm run dev
```
- Admin UI runs on: `http://localhost:3000`
- Widget.js accessible at: `http://localhost:3000/widget.js`

#### **Step 2: Verify Widget.js is Accessible**
1. Open browser: `http://localhost:3000/widget.js`
2. Should see JavaScript code (not 404)
3. Check browser console for syntax errors

#### **Step 3: Test with Test HTML Page**
1. Start local server (if not already running):
   ```bash
   py -m http.server 8000
   ```

2. Open: `http://localhost:8000/test-widget.html`
3. Widget should appear (bottom-right or bottom-left)
4. Click widget button
5. Chat window should open
6. Try sending a message

#### **Step 4: Test Widget Functionality**
- [ ] Widget button appears
- [ ] Chat window opens/closes
- [ ] Welcome message displays
- [ ] Can type and send messages
- [ ] Loading indicator shows
- [ ] API response displays (if backend is ready)
- [ ] Theme colors apply correctly
- [ ] Position works (bottom-right/left)

#### **Step 5: Test with Real Embed Snippet**
1. Go to Admin UI: `http://localhost:3000/admin/settings`
2. Get embed snippet from "Website Widget" section
3. Update test HTML with actual snippet
4. Test again

---

### **Phase 2: Backend Integration Testing**

#### **Step 1: Verify Backend API Endpoint**
The widget calls:
```
POST https://ask-abilitix-api.onrender.com/ask
Body: {
  question: string,
  session_id: string,
  tenant: string,
  widget_key: string
}
```

**Backend must:**
1. Accept `widget_key` and `tenant` in request
2. Validate widget key exists and is active
3. Check widget is enabled for tenant
4. Verify domain is allowed (if restrictions enabled)
5. Process question using tenant's data
6. Return answer

#### **Step 2: Test API Integration**
1. Use test HTML page
2. Send a message through widget
3. Check browser console (Network tab)
4. Verify API request includes `widget_key` and `tenant`
5. Verify API response is correct
6. Verify answer displays in widget

#### **Step 3: Test Widget Key Validation**
1. Use invalid widget key
2. Verify backend rejects request
3. Verify widget shows error message
4. Use valid but disabled widget
5. Verify backend handles correctly

---

### **Phase 3: Multi-Tenant Testing**

#### **Step 1: Test with Different Tenants**
1. Create test snippets for different tenants
2. Test each tenant's widget independently
3. Verify tenant isolation (Tenant A can't see Tenant B's data)
4. Verify each tenant's theme settings work

#### **Step 2: Test Widget Key Rotation**
1. Rotate widget key in Admin UI
2. Old snippet should stop working
3. New snippet should work
4. Verify old key is rejected by backend

---

## 🚀 **Deployment to Production**

### **Option 1: Deploy widget.js with Admin UI (Simplest)**

#### **Step 1: Deploy Admin UI to Production**
```bash
# Already deployed to Vercel/Render/etc.
# Widget.js will be accessible at:
# https://your-admin-ui-domain.com/widget.js
```

#### **Step 2: Update Backend to Generate Correct Embed Snippet**
The backend API (`/api/admin/widget/config`) should generate embed snippet with:
```html
<script src="https://your-admin-ui-domain.com/widget.js" 
        data-tenant="TENANT_SLUG" 
        data-widget-key="WIDGET_KEY"></script>
```

**Backend needs to:**
- Use correct widget.js URL (from environment variable or config)
- Include tenant slug
- Include widget key
- Include theme attributes if configured

#### **Step 3: Verify Deployment**
1. Deploy Admin UI to production
2. Access: `https://your-admin-ui-domain.com/widget.js`
3. Should return JavaScript code
4. Test with production embed snippet

**Advantages:**
- ✅ Simple - No separate deployment needed
- ✅ Automatic updates when Admin UI deploys
- ✅ Same domain as Admin UI

**Disadvantages:**
- ❌ Couples widget to Admin UI
- ❌ Uses Admin UI bandwidth

---

### **Option 2: Deploy widget.js to CDN (Recommended)**

#### **Step 1: Build widget.js for Production**
```bash
# Widget.js is already in public/ folder
# No build needed - it's plain JavaScript
# Just needs to be served with correct headers
```

#### **Step 2: Deploy to CDN**
**Option A: Cloudflare Pages**
1. Create Cloudflare Pages project
2. Upload `public/widget.js`
3. Deploy
4. Get CDN URL: `https://widget.yourdomain.com/widget.js`

**Option B: AWS CloudFront**
1. Upload to S3 bucket
2. Create CloudFront distribution
3. Get CDN URL: `https://d1234.cloudfront.net/widget.js`

**Option C: Vercel/Netlify**
1. Create separate project for widget
2. Deploy `public/widget.js`
3. Get URL: `https://widget.vercel.app/widget.js`

#### **Step 3: Update Backend Embed Snippet Generation**
Backend should generate:
```html
<script src="https://widget.yourdomain.com/widget.js" 
        data-tenant="TENANT_SLUG" 
        data-widget-key="WIDGET_KEY"></script>
```

#### **Step 4: Configure CORS**
CDN must allow requests from:
- All customer websites (for widget embedding)
- Your Admin UI domain
- Your API domain

**Advantages:**
- ✅ Better performance (CDN caching)
- ✅ Separate from Admin UI
- ✅ Scalable
- ✅ Global distribution

---

### **Option 3: Deploy to Separate Widget Service**

#### **Step 1: Create Widget Service Repository**
- Separate repository for widget service
- Deploy to `app.abilitix.com` or similar

#### **Step 2: Deploy Widget Service**
- Deploy widget.js to widget service domain
- Configure domain and DNS
- Set up CDN/caching

#### **Step 3: Update Backend**
- Backend generates embed snippet with widget service URL
- Example: `https://app.abilitix.com/widget.js`

**Advantages:**
- ✅ Complete separation
- ✅ Can scale independently
- ✅ Professional setup

---

## 📝 **Backend Requirements**

### **1. Embed Snippet Generation**

Backend API (`GET /api/admin/widget/config`) must return:
```json
{
  "embed_snippet": "<script src=\"https://widget-url.com/widget.js\" data-tenant=\"tenant-slug\" data-widget-key=\"wid_...\"></script>"
}
```

**Snippet should include:**
- Widget.js URL (from environment/config)
- `data-tenant` - Tenant slug
- `data-widget-key` - Widget key
- Optional theme attributes:
  - `data-theme-primary`
  - `data-theme-accent`
  - `data-title`
  - `data-welcome-message`
  - `data-position`

### **2. Widget API Endpoint**

Create or update Ask API endpoint to handle widget requests:

```
POST /ask (or /widget/ask)
Body: {
  question: string,
  session_id: string,
  tenant: string,
  widget_key: string
}
```

**Backend must:**
1. Validate `widget_key` exists in database
2. Check widget is enabled for tenant
3. Verify domain is allowed (if restrictions enabled)
4. Process question using tenant's documents/FAQs
5. Return answer

**Response:**
```json
{
  "answer": "Response text",
  "source": "docs.rag" | "qa.model" | "db",
  "source_detail": "docs" | "qa_pair"
}
```

### **3. Widget Key Validation**

Backend must:
- Store widget keys in database
- Associate keys with tenants
- Track key usage/statistics
- Support key rotation
- Validate keys on each request

---

## ✅ **Deployment Checklist**

### **Pre-Deployment:**
- [ ] Widget.js tested locally
- [ ] Widget.js accessible at test URL
- [ ] Test HTML page works
- [ ] Backend API endpoint ready
- [ ] Widget key validation implemented
- [ ] Multi-tenant isolation tested

### **Deployment:**
- [ ] Deploy widget.js to production URL
- [ ] Verify widget.js is accessible
- [ ] Update backend embed snippet generation
- [ ] Test embed snippet from Admin UI
- [ ] Verify snippet includes correct URL
- [ ] Test widget on production

### **Post-Deployment:**
- [ ] Test with multiple tenants
- [ ] Verify widget key validation
- [ ] Test widget key rotation
- [ ] Monitor widget usage
- [ ] Check error logs
- [ ] Test on different browsers/devices

---

## 🔍 **Testing Checklist**

### **Local Testing:**
- [ ] Widget.js loads without errors
- [ ] Widget button appears
- [ ] Chat window opens/closes
- [ ] Messages send successfully
- [ ] API responses display
- [ ] Theme customization works
- [ ] Position works correctly

### **Backend Integration:**
- [ ] API accepts widget requests
- [ ] Widget key validation works
- [ ] Tenant isolation works
- [ ] Error handling works
- [ ] Widget disabled state works

### **Production Testing:**
- [ ] Widget.js accessible at production URL
- [ ] Embed snippet generated correctly
- [ ] Widget works on test website
- [ ] Multiple tenants work independently
- [ ] Widget key rotation works
- [ ] Performance is acceptable

---

## 🎯 **How Tenants Use It**

### **For Each Tenant:**

1. **Tenant logs into Admin UI**
   - Goes to `/admin/settings`
   - Sees "Website Widget" section

2. **Tenant enables widget**
   - Clicks "Enabled" button
   - Widget becomes active

3. **Tenant configures theme (optional)**
   - Sets colors, title, message, position
   - Settings auto-save

4. **Tenant copies embed snippet**
   - Clicks "Copy Snippet" button
   - Gets snippet with their unique:
     - `data-tenant="their-tenant-slug"`
     - `data-widget-key="their-unique-key"`

5. **Tenant embeds on their website**
   - Pastes snippet into their website HTML
   - Widget appears on their website
   - Widget uses their tenant data

6. **Widget works independently**
   - Each tenant's widget only accesses their data
   - Widget keys ensure security
   - Backend routes requests to correct tenant

---

## 📊 **Summary**

**Testing:**
1. Test locally with dev server
2. Test backend integration
3. Test multi-tenant isolation
4. Test on production

**Deployment:**
1. Deploy widget.js to public URL
2. Update backend embed snippet generation
3. Verify deployment
4. Test end-to-end

**For Tenants:**
- Each tenant gets unique embed snippet
- Snippet includes their tenant slug and widget key
- Widget.js reads config from snippet
- Backend validates and routes to correct tenant
- Complete tenant isolation

---

**Status:** ✅ **Widget.js Ready** - Needs backend integration and deployment!




