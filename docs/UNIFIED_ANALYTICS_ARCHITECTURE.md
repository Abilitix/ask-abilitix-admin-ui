# Unified Analytics Architecture - Widget + UI Chat

**Date:** 2025-11-22  
**Goal:** Reusable analytics system for both widget and Admin UI chat

---

## 🎯 **Design: Unified Analytics System**

### **Concept**
Single analytics system that works for both:
- **Widget** (`source='widget'`)
- **Admin UI Chat** (`source='admin-ui'` or `source='ui-chat'`)

**Benefits:**
- ✅ Code reuse (same components, same functions)
- ✅ Consistent metrics across channels
- ✅ Easier maintenance
- ✅ Compare widget vs UI chat performance

---

## 📊 **Architecture**

### **1. Shared Components (Admin UI)**

**Reusable Components:**
```
src/components/analytics/
├── ChatAnalyticsPage.tsx          # Main page (accepts source prop)
├── ChatMetricsCard.tsx             # KPI cards (reusable)
├── ChatUsageChart.tsx              # Time series chart (reusable)
├── PopularQuestionsTable.tsx       # Top questions (reusable)
├── AnswerQualityMetrics.tsx       # Quality metrics (reusable)
└── useChatAnalytics.ts             # Shared hook (source parameter)
```

**Usage:**
```tsx
// Widget Analytics
<ChatAnalyticsPage source="widget" />

// UI Chat Analytics  
<ChatAnalyticsPage source="admin-ui" />

// Combined (both sources)
<ChatAnalyticsPage source="all" />
```

### **2. Shared API Functions**

**Single Function with Source Parameter:**
```typescript
// src/lib/api/analytics.ts
export async function fetchChatAnalytics(
  source: 'widget' | 'admin-ui' | 'all',
  from?: string,
  to?: string
): Promise<AnalyticsData> {
  const params = new URLSearchParams();
  if (source !== 'all') params.set('source', source);
  if (from) params.set('from', from);
  if (to) params.set('to', to);
  
  const response = await fetch(`/api/admin/analytics/chat?${params}`);
  return response.json();
}
```

### **3. Admin API Endpoint**

**Single Endpoint:**
```
GET /admin/analytics/chat?source=widget&from=2025-11-01&to=2025-11-22
GET /admin/analytics/chat?source=admin-ui&from=2025-11-01&to=2025-11-22
GET /admin/analytics/chat?source=all&from=2025-11-01&to=2025-11-22
```

**Response (same structure for both):**
```json
{
  "summary": {
    "total_messages": 1250,
    "unique_sessions": 342,
    "avg_response_time_ms": 1250,
    "rag_answers": 850,
    "faq_answers": 400
  },
  "time_series": [...],
  "popular_questions": [...],
  "source_breakdown": {
    "widget": 800,
    "admin-ui": 450
  }
}
```

### **4. Runtime API Tracking**

**Add Source/Channel to Logs:**
- Widget requests: `channel='widget'` or `source='widget'`
- Admin UI requests: `channel='admin-ui'` or `source='admin-ui'`
- Both use same `/ask` endpoint, just different metadata

---

## 🔧 **Implementation Plan**

### **Phase 1: Runtime API (1 day)**
- Add `channel` or `source` field to ask logs
- Widget: `channel='widget'`
- Admin UI: `channel='admin-ui'`
- Store in logs table

### **Phase 2: Admin API (2-3 days)**
- New endpoint: `GET /admin/analytics/chat`
- Accept `source` parameter (widget/admin-ui/all)
- Query logs filtered by `channel`
- Return unified analytics data

### **Phase 3: Admin UI (2-3 days)**
- Create shared components in `src/components/analytics/`
- Create `useChatAnalytics` hook
- Two pages:
  - `/admin/widget/analytics` → `<ChatAnalyticsPage source="widget" />`
  - `/admin/chat/analytics` → `<ChatAnalyticsPage source="admin-ui" />`
- Optional: Combined view with `source="all"`

---

## 📋 **Work Breakdown**

| Component | Who | Effort | Reusable? |
|-----------|-----|--------|-----------|
| **Shared Components** | Me | 2-3 days | ✅ Yes (both sources) |
| **Shared API Hook** | Me | 0.5 day | ✅ Yes (source param) |
| **Admin API Endpoint** | Admin API | 2-3 days | ✅ Yes (source filter) |
| **Runtime Tracking** | Runtime | 1 day | ✅ Yes (channel field) |
| **Two Pages** | Me | 0.5 day | ✅ Reuse components |

**Total:** 6-8 days (same as before, but reusable!)

---

## 💡 **Benefits**

1. **Code Reuse:** Same components for widget + UI chat
2. **Consistency:** Same metrics, same charts, same UX
3. **Maintainability:** Fix once, works for both
4. **Comparison:** Easy to compare widget vs UI chat
5. **Future-Proof:** Add new sources easily (mobile app, API, etc.)

---

## 🎯 **Example Usage**

```tsx
// Widget Analytics Page
export default function WidgetAnalyticsPage() {
  return <ChatAnalyticsPage source="widget" title="Widget Analytics" />;
}

// UI Chat Analytics Page
export default function ChatAnalyticsPage() {
  return <ChatAnalyticsPage source="admin-ui" title="Chat Analytics" />;
}

// Combined View (optional)
export default function AllAnalyticsPage() {
  return <ChatAnalyticsPage source="all" title="All Chat Analytics" />;
}
```

---

## ✅ **Answer: YES, Fully Reusable!**

**Same code, different source parameter:**
- ✅ Same components
- ✅ Same API functions
- ✅ Same backend endpoint
- ✅ Just filter by `source` parameter

**Effort:** Same 6-8 days, but get 2 analytics dashboards for the price of 1!

---

**Last Updated:** 2025-11-22


