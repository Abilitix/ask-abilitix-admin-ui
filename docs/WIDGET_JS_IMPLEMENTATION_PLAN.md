# Widget.js Implementation Plan

**Date:** 2025-11-21  
**Status:** ✅ Basic Implementation Complete | ⚠️ Needs Backend Integration

---

## 📋 **What Was in the Initial Widget Plan**

Based on the Admin UI implementation, the widget should:

### **Phase 1: Core Functionality**
- ✅ Embeddable script tag
- ✅ Floating chat button
- ✅ Chat interface window
- ✅ Send/receive messages
- ✅ Connect to Ask API
- ✅ Theme customization support

### **Phase 2: Enhanced Features**
- ✅ Welcome message
- ✅ Custom title
- ✅ Position control (bottom-right/left)
- ✅ Color customization
- ✅ Widget enabled/disabled state

---

## ✅ **What I've Created**

### **1. Basic widget.js** (`public/widget.js`)
A functional widget implementation that:
- ✅ Reads configuration from script tag attributes
- ✅ Creates floating chat button
- ✅ Opens/closes chat window
- ✅ Sends messages to Ask API
- ✅ Displays responses
- ✅ Supports theme customization
- ✅ Responsive design

### **2. Next.js Route** (`src/app/widget.js/route.ts`)
Serves widget.js from the Admin UI domain:
- Accessible at: `https://your-admin-ui-domain.com/widget.js`
- Alternative: Deploy to CDN or separate service

---

## 🔧 **How It Works**

### **Embed Snippet Format:**
```html
<script src="https://app.abilitix.com/widget.js" 
        data-tenant="abilitix-pilot" 
        data-widget-key="wid_..."></script>
```

### **With Theme Customization:**
```html
<script src="https://app.abilitix.com/widget.js" 
        data-tenant="abilitix-pilot" 
        data-widget-key="wid_..."
        data-theme-primary="#3b82f6"
        data-theme-accent="#8b5cf6"
        data-title="Chat with us"
        data-welcome-message="Hi! How can I help you today?"
        data-position="bottom-right"></script>
```

### **Widget Features:**
1. **Floating Button** - Appears in bottom-right or bottom-left
2. **Chat Window** - Opens when button clicked
3. **Message History** - Shows conversation
4. **API Integration** - Connects to Ask API
5. **Theme Support** - Uses configured colors, title, message

---

## ⚠️ **What Needs to Be Done**

### **1. Backend API Endpoint**
The widget currently calls:
```
POST https://ask-abilitix-api.onrender.com/ask
```

**This endpoint needs to:**
- Accept widget requests (with `widget_key` and `tenant`)
- Validate widget key
- Check if widget is enabled
- Process question and return answer
- Handle widget-specific authentication

**Or create a widget-specific endpoint:**
```
POST https://ask-abilitix-api.onrender.com/widget/ask
```

### **2. Widget Key Validation**
- Backend must validate `widget_key` on each request
- Check if widget is enabled for the tenant
- Verify domain is allowed (if domain restrictions are enabled)

### **3. Deployment Options**

#### **Option A: Serve from Admin UI** (Current)
- Widget.js served from Admin UI domain
- Update embed snippet to: `https://your-admin-ui-domain.com/widget.js`
- Simple, but couples widget to Admin UI

#### **Option B: Deploy to CDN** (Recommended)
- Deploy widget.js to CDN (Cloudflare, AWS CloudFront, etc.)
- Update embed snippet to CDN URL
- Better performance, separate from Admin UI

#### **Option C: Separate Widget Service**
- Create separate widget service/repository
- Deploy to `app.abilitix.com`
- Most scalable approach

---

## 🚀 **Next Steps**

### **Step 1: Test Widget.js Locally**
1. Start Admin UI dev server: `npm run dev`
2. Access widget.js: `http://localhost:3000/widget.js`
3. Update test HTML to use local URL
4. Test widget functionality

### **Step 2: Backend Integration**
1. Create/update Ask API endpoint to handle widget requests
2. Add widget key validation
3. Add widget enabled check
4. Test API integration

### **Step 3: Deploy Widget.js**
1. Choose deployment option (CDN recommended)
2. Deploy widget.js to chosen location
3. Update embed snippet URL in Admin UI
4. Test on production

### **Step 4: End-to-End Testing**
1. Get embed snippet from Admin UI
2. Add to test website
3. Verify widget appears and works
4. Test theme customization
5. Test on different devices/browsers

---

## 📝 **Widget.js Features Implemented**

### **✅ Core Features:**
- [x] Script tag attribute reading
- [x] Floating chat button
- [x] Chat window UI
- [x] Message sending
- [x] Message receiving
- [x] Welcome message
- [x] Loading indicators
- [x] Error handling

### **✅ Theme Support:**
- [x] Primary color
- [x] Accent color
- [x] Custom title
- [x] Welcome message
- [x] Position (bottom-right/left)

### **⏸️ Future Enhancements:**
- [ ] Typing indicators
- [ ] Message timestamps
- [ ] File uploads
- [ ] Rich message formatting
- [ ] Widget analytics
- [ ] Multiple language support
- [ ] Custom CSS injection

---

## 🔍 **API Integration Details**

### **Current Implementation:**
```javascript
POST https://ask-abilitix-api.onrender.com/ask
Body: {
  question: string,
  session_id: string,
  tenant: string,
  widget_key: string
}
```

### **Expected Response:**
```json
{
  "answer": "Response text",
  "source": "docs.rag" | "qa.model" | "db",
  "source_detail": "docs" | "qa_pair"
}
```

### **Backend Requirements:**
1. Validate `widget_key` exists and is active
2. Check widget is enabled for tenant
3. Verify domain is allowed (if restrictions enabled)
4. Process question using existing Ask API logic
5. Return formatted response

---

## 📦 **File Structure**

```
ask-abilitix-admin-ui/
├── public/
│   └── widget.js              # Widget JavaScript file
├── src/
│   └── app/
│       └── widget.js/
│           └── route.ts        # Next.js route to serve widget.js
└── docs/
    └── WIDGET_JS_IMPLEMENTATION_PLAN.md  # This file
```

---

## 🎯 **Summary**

**What's Done:**
- ✅ Basic widget.js implementation
- ✅ Theme customization support
- ✅ Chat interface UI
- ✅ API integration structure

**What's Needed:**
- ⏸️ Backend API endpoint for widget requests
- ⏸️ Widget key validation
- ⏸️ Deployment of widget.js to public URL
- ⏸️ End-to-end testing

**Next Action:**
1. Test widget.js locally
2. Integrate with backend API
3. Deploy widget.js
4. Update embed snippet URL in Admin UI

---

**Status:** ✅ **Widget.js Created** - Ready for backend integration and testing!




