# Widget Enhancement Plan - Tenant-Specific Settings

## Date
2025-11-22

## Overview
Plan to add tenant-specific widget settings that allow tenants to customize widget appearance and behavior through Admin UI, without requiring code changes or redeployment.

## Quick Status Summary

**✅ Widget is LIVE and WORKING (2025-11-22)**
- Production deployment: ✅ Complete
- Preview deployment: ✅ Complete
- CORS: ✅ Fixed
- Authentication: ✅ Working
- Runtime API: ✅ Integrated
- UI/UX: ✅ Enhanced
- **Theme Customization via Admin UI: ✅ COMPLETE (2025-11-22)**

**⏳ Enhancement Plan (RAG Parameters & Advanced Features)**
- Theme customization: ✅ Complete
- RAG parameters via Admin UI: ⏳ Planned
- This document outlines remaining enhancements

## Current State

### Widget Status (2025-11-22)
✅ **Widget is LIVE and WORKING**
- Deployed to both preview and production environments
- CORS issues resolved
- Widget key authentication working
- Runtime API integration complete
- UI/UX improvements deployed (typography, spacing, layout)
- TopK parameter set to 5 (matches tenant settings)

### Widget Configuration (Current)
- Widget uses HTML data attributes for configuration:
  - `data-tenant`: Tenant slug
  - `data-widget-key`: Widget authentication key
  - `data-theme-primary`: Primary color
  - `data-theme-accent`: Accent color
  - `data-title`: Widget title
  - `data-welcome-message`: Welcome message
  - `data-position`: Widget position (bottom-right/bottom-left)

### Current Status (2025-11-22)
- ✅ **Theme Customization:** Working via Admin UI
  - Settings saved to database
  - Auto-save with 500ms debounce
  - Embed snippet includes theme attributes automatically
  - Widget applies custom theme when embedded
- ⏳ **RAG Parameters:** Still hardcoded (topk: 5)
  - Not yet configurable via Admin UI
  - Future enhancement planned

## Proposed Solution

### Architecture

```
┌─────────────┐
│  Admin UI   │ → Configure widget settings
└──────┬──────┘
       │
       ↓
┌─────────────┐
│ Admin API   │ → Store settings in database
│ (Database)  │
└──────┬──────┘
       │
       ↓
┌─────────────┐
│   Widget    │ → Fetch settings on load
│  (Browser)  │ → Fallback to data attributes
└─────────────┘
```

### Database Schema

**Table: `widget_settings`**

```sql
CREATE TABLE widget_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    widget_key VARCHAR(255) NOT NULL UNIQUE,
    
    -- Appearance
    primary_color VARCHAR(7) DEFAULT '#3b82f6',
    accent_color VARCHAR(7) DEFAULT '#8b5cf6',
    title VARCHAR(255) DEFAULT 'Chat with us',
    welcome_message TEXT DEFAULT 'Hi! How can I help you today?',
    position VARCHAR(20) DEFAULT 'bottom-right', -- bottom-right, bottom-left
    
    -- RAG Parameters
    topk INTEGER DEFAULT 5,
    max_tokens INTEGER DEFAULT 500,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(tenant_id, widget_key)
);

CREATE INDEX idx_widget_settings_widget_key ON widget_settings(widget_key);
CREATE INDEX idx_widget_settings_tenant_id ON widget_settings(tenant_id);
```

### Admin API Endpoints

#### 1. Get Widget Settings
```
GET /admin/widget/settings?widget_key={widget_key}
```
- Returns widget settings for given widget key
- Public endpoint (no auth required - widget key is the auth)
- Response:
```json
{
  "primary_color": "#3b82f6",
  "accent_color": "#8b5cf6",
  "title": "Chat with us",
  "welcome_message": "Hi! How can I help you today?",
  "position": "bottom-right",
  "topk": 5,
  "max_tokens": 500
}
```

#### 2. Get Widget Settings (Admin)
```
GET /admin/widget/settings
```
- Returns widget settings for authenticated tenant
- Requires authentication
- Returns all widgets for tenant

#### 3. Update Widget Settings
```
PUT /admin/widget/settings/{widget_key}
```
- Updates widget settings
- Requires authentication (tenant must own widget)
- Request body:
```json
{
  "primary_color": "#3b82f6",
  "accent_color": "#8b5cf6",
  "title": "Chat with us",
  "welcome_message": "Hi! How can I help you today?",
  "position": "bottom-right",
  "topk": 5,
  "max_tokens": 500
}
```

#### 4. Create Widget Settings
```
POST /admin/widget/settings
```
- Creates new widget settings
- Requires authentication
- Auto-generates widget_key if not provided

### Admin UI Implementation

#### New Page: `/admin/widget/settings`

**Features:**
1. **Widget List**
   - Display all widgets for tenant
   - Show widget key, status, last updated
   - Actions: Edit, Delete, Copy Embed Code

2. **Widget Editor**
   - Appearance Settings:
     - Color picker for primary color
     - Color picker for accent color
     - Text input for title
     - Textarea for welcome message
     - Radio buttons for position (bottom-right, bottom-left)
   - RAG Settings:
     - Number input for topk (1-20)
     - Number input for max_tokens (100-2000)
   - Preview:
     - Live preview of widget appearance
   - Embed Code:
     - Generated embed code with current settings
     - Copy to clipboard button

3. **Widget Creation**
   - Form to create new widget
   - Auto-generate widget key
   - Set initial settings

#### Components Needed

1. `WidgetSettingsPage.tsx` - Main settings page
2. `WidgetList.tsx` - List of widgets
3. `WidgetEditor.tsx` - Widget settings form
4. `WidgetPreview.tsx` - Live preview component
5. `EmbedCodeGenerator.tsx` - Generate embed code

### Widget Code Updates

#### Current Widget Load Flow
```javascript
1. Read data attributes from script tag
2. Initialize widget with config
3. Render widget
```

#### New Widget Load Flow
```javascript
1. Read data attributes from script tag (fallback)
2. Fetch settings from Admin API using widget_key
3. Merge API settings with data attributes (API takes precedence)
4. Cache settings in localStorage
5. Initialize widget with merged config
6. Render widget
```

#### Implementation Details

**Settings Fetch Function:**
```javascript
async function fetchWidgetSettings(widgetKey) {
  try {
    // Check cache first
    const cacheKey = `widget_settings_${widgetKey}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      const { data, timestamp } = JSON.parse(cached);
      // Cache for 1 hour
      if (Date.now() - timestamp < 3600000) {
        return data;
      }
    }
    
    // Fetch from API
    const response = await fetch(
      `${ADMIN_API_BASE}/admin/widget/settings?widget_key=${widgetKey}`
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch settings');
    }
    
    const settings = await response.json();
    
    // Cache settings
    localStorage.setItem(cacheKey, JSON.stringify({
      data: settings,
      timestamp: Date.now()
    }));
    
    return settings;
  } catch (error) {
    console.warn('Failed to fetch widget settings, using defaults:', error);
    return null; // Fallback to data attributes
  }
}
```

**Config Merging:**
```javascript
const dataAttributes = {
  primaryColor: scriptTag.getAttribute('data-theme-primary'),
  accentColor: scriptTag.getAttribute('data-theme-accent'),
  title: scriptTag.getAttribute('data-title'),
  welcomeMessage: scriptTag.getAttribute('data-welcome-message'),
  position: scriptTag.getAttribute('data-position'),
  topk: scriptTag.getAttribute('data-topk'),
  maxTokens: scriptTag.getAttribute('data-max-tokens')
};

const apiSettings = await fetchWidgetSettings(config.widgetKey);

const config = {
  tenant: scriptTag.getAttribute('data-tenant'),
  widgetKey: scriptTag.getAttribute('data-widget-key'),
  // Merge: API settings override data attributes
  primaryColor: apiSettings?.primary_color || dataAttributes.primaryColor || '#3b82f6',
  accentColor: apiSettings?.accent_color || dataAttributes.accentColor || '#8b5cf6',
  title: apiSettings?.title || dataAttributes.title || 'Chat with us',
  welcomeMessage: apiSettings?.welcome_message || dataAttributes.welcomeMessage || 'Hi! How can I help you today?',
  position: apiSettings?.position || dataAttributes.position || 'bottom-right',
  topk: apiSettings?.topk || parseInt(dataAttributes.topk) || 5,
  maxTokens: apiSettings?.max_tokens || parseInt(dataAttributes.maxTokens) || 500
};
```

**Update sendMessage to use config.topk and config.maxTokens:**
```javascript
const requestBody = {
  question: question,
  session_id: sessionId,
  topk: config.topk,
  max_tokens: config.maxTokens
};
```

## Implementation Phases

### Phase 1: Database & Admin API (Day 1)
- [ ] Create `widget_settings` table
- [ ] Add migration script
- [ ] Implement GET `/admin/widget/settings?widget_key={key}` endpoint
- [ ] Implement GET `/admin/widget/settings` endpoint (admin)
- [ ] Implement PUT `/admin/widget/settings/{widget_key}` endpoint
- [ ] Implement POST `/admin/widget/settings` endpoint
- [ ] Add widget key validation
- [ ] Add tenant ownership validation

### Phase 2: Admin UI (Day 2)
- [ ] Create `/admin/widget/settings` page
- [ ] Implement `WidgetList` component
- [ ] Implement `WidgetEditor` component
- [ ] Implement `WidgetPreview` component
- [ ] Implement `EmbedCodeGenerator` component
- [ ] Add color picker components
- [ ] Add form validation
- [ ] Add error handling
- [ ] Add success notifications

### Phase 3: Widget Updates (Day 3)
- [ ] Add `fetchWidgetSettings` function
- [ ] Add settings caching (localStorage)
- [ ] Update config merging logic
- [ ] Update `sendMessage` to use config.topk and config.maxTokens
- [ ] Add error handling for API failures
- [ ] Test fallback to data attributes
- [ ] Test caching behavior
- [ ] Test settings updates (clear cache on update)

### Phase 4: Testing & Documentation (Day 3)
- [ ] Test widget settings API endpoints
- [ ] Test Admin UI widget editor
- [ ] Test widget with API settings
- [ ] Test widget fallback to data attributes
- [ ] Test settings caching
- [ ] Test settings updates
- [ ] Update widget documentation
- [ ] Create migration guide for existing widgets

## Benefits

### For Tenants
- ✅ Customize widget without code changes
- ✅ Update settings instantly (no redeployment needed)
- ✅ Centralized management in Admin UI
- ✅ Preview changes before saving
- ✅ Configure RAG parameters per widget

### For Developers
- ✅ Centralized configuration management
- ✅ Easy to add new settings
- ✅ Consistent settings across widget instances
- ✅ Better debugging (settings in database)
- ✅ Analytics on widget usage

## Migration Strategy

### Existing Widgets
1. **Automatic Migration:**
   - On first widget load, create settings record from data attributes
   - Store widget_key → settings mapping
   - Future loads use API settings

2. **Manual Migration:**
   - Admin UI tool to import existing widgets
   - Bulk create settings from widget keys

### Backward Compatibility
- Widget continues to work with data attributes only
- API settings are optional enhancement
- Fallback gracefully if API fails

## Security Considerations

1. **Widget Key Validation:**
   - Validate widget key format
   - Verify widget key belongs to tenant
   - Rate limit settings API calls

2. **CORS:**
   - Admin API must allow widget origin
   - Use widget key for authentication (not session)

3. **Data Privacy:**
   - Settings are tenant-specific
   - No sensitive data in settings
   - Settings are public (widget key is public)

## Performance Considerations

1. **Caching:**
   - Cache settings in localStorage (1 hour TTL)
   - Reduce API calls
   - Faster widget initialization

2. **API Optimization:**
   - Use CDN for settings endpoint
   - Add response caching headers
   - Consider edge caching

3. **Widget Size:**
   - Settings fetch is async (non-blocking)
   - Widget renders with defaults first
   - Settings update after fetch

## Future Enhancements

1. **Advanced Settings:**
   - Custom CSS
   - Custom fonts
   - Custom animations
   - Custom icons

2. **A/B Testing:**
   - Multiple widget variants
   - Test different settings
   - Analytics on performance

3. **Widget Templates:**
   - Pre-built widget themes
   - Industry-specific templates
   - Quick setup for common use cases

4. **Widget Analytics:**
   - Track widget usage
   - Settings performance metrics
   - User engagement stats

## Open Questions

1. **Widget Key Generation:**
   - Auto-generate on widget creation?
   - Allow custom widget keys?
   - Format: `wid_` prefix?

2. **Settings Versioning:**
   - Track settings history?
   - Rollback to previous settings?
   - Settings audit log?

3. **Multi-Widget Support:**
   - Multiple widgets per tenant?
   - Different widgets for different pages?
   - Widget groups/organization?

## Estimated Effort

- **Database & Admin API:** 1 day
- **Admin UI:** 1 day
- **Widget Updates:** 0.5 day
- **Testing & Documentation:** 0.5 day
- **Total:** 3 days

## Status

### Current Widget Status (2025-11-22)
- ✅ **Basic Widget:** Deployed and working in production
- ✅ **CORS:** Fixed and working
- ✅ **Authentication:** Widget key validation working
- ✅ **Runtime API:** Integration complete
- ✅ **UI/UX:** Enhanced typography, spacing, and layout deployed
- ✅ **RAG Parameters:** TopK set to 5 (matches tenant settings)
- ✅ **Theme Customization:** Working via Admin UI (database-driven)

### Enhancement Plan Status

**✅ Theme Customization (COMPLETE - 2025-11-22)**
- ✅ Auto-save theme settings
- ✅ Backend includes theme in embed snippet
- ✅ Widget applies custom theme
- ✅ End-to-end flow verified

**⏳ Unified Analytics Dashboard (PLANNED - Agreed with Admin API)**
- ✅ **Architecture:** Agreed on unified approach
- ⏳ **Runtime API:** Add `channel` field to telemetry (1 day)
- ⏳ **Admin API:** Unified endpoint with source filter (2-3 days)
- ⏳ **Admin UI:** Shared components for widget + UI chat (2-3 days)
- **Total Effort:** 6-8 days (get 2 dashboards for price of 1)
- **Documentation:** `docs/UNIFIED_ANALYTICS_ARCHITECTURE.md`

**Next Steps:**
- Implement unified analytics dashboard
- Add RAG parameters via Admin UI (future)
- Add advanced features (A/B testing, templates, etc.)

## Notes

- This enhancement is additive (non-breaking)
- Existing widgets continue to work
- Settings API is optional enhancement
- Can be implemented incrementally

---

## 📊 **Unified Analytics Dashboard - Detailed Plan**

### **Status:** ⏳ **PLANNED - AGREED WITH ADMIN API (2025-11-22)**

### **Architecture Overview:**
Unified analytics system that works for both widget and Admin UI chat using the same codebase, components, and API endpoints. The only difference is a `source` parameter that filters data by channel.

### **Why Unified?**
1. **Same Data Source:** Both widget and Admin UI chat use Runtime API `/ask` endpoint
2. **Same Metrics:** Questions, FAQ hits, RAG fallback, response times
3. **Code Reuse:** Same components, same API hooks, same backend queries
4. **Business Value:** Compare widget vs UI chat usage and performance

### **Technical Implementation:**

#### **1. Runtime API Changes (1 day)**
- Add `channel` field to `llm_telemetry` table
- Widget requests: `channel='widget'`
- Admin UI requests: `channel='admin-ui'`
- Backward compatible (nullable field)

#### **2. Admin API Endpoint (2-3 days)**
- Single endpoint: `GET /admin/analytics/chat?source=widget`
- Accepts `source` parameter: `'widget'`, `'admin-ui'`, or `null` (all)
- Filters telemetry by `channel` field
- Returns unified analytics data structure

#### **3. Admin UI Components (2-3 days)**
- **Shared Components:**
  - `ChatAnalyticsPage` (accepts `source` prop)
  - `ChatMetricsCard` (reusable)
  - `ChatUsageChart` (reusable)
  - `PopularQuestionsTable` (reusable)
  - `useChatAnalytics` hook (source parameter)
- **Two Pages:**
  - `/admin/widget/analytics` → `<ChatAnalyticsPage source="widget" />`
  - `/admin/chat/analytics` → `<ChatAnalyticsPage source="admin-ui" />`
- **Optional:** Combined view with `source="all"`

### **Work Breakdown:**

| Component | Effort | Reusable? | Notes |
|-----------|--------|-----------|-------|
| Runtime Tracking | 1 day | ✅ Both sources | Add `channel` field |
| Admin API Endpoint | 2-3 days | ✅ Source filter | Single endpoint, `source` param |
| Shared Components | 2-3 days | ✅ Both sources | Build once, reuse |
| Shared API Hook | 0.5 day | ✅ Source param | Simple wrapper |
| Two Pages | 0.5 day | ✅ Reuse components | Just route config |

**Total: 6-8 days → Get 2 analytics dashboards**

### **Benefits:**
- ✅ Code reuse (same components for both)
- ✅ Consistent metrics across channels
- ✅ Comparison view (widget vs UI chat side-by-side)
- ✅ Future-proof (easy to add new sources like Slack, Email, API)
- ✅ Maintainability (fix once, works for both)

### **Documentation:**
- Full architecture: `docs/UNIFIED_ANALYTICS_ARCHITECTURE.md`
- Admin API agreement: Confirmed 2025-11-22

**Ready to implement when you give the go-ahead.**

