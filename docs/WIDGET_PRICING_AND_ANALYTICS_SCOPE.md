# Widget Pricing & Analytics Dashboard Scope

**Date:** 2025-11-22

---

## 💰 **PRICING RECOMMENDATION**

### **Abilitix Widget Features (Unique Value Props)**

**Differentiators:**
1. ✅ **Governed AI** - Human verification, audit trails, compliance
2. ✅ **RAG-based** - Document search, accurate answers from your knowledge base
3. ✅ **Multi-tenant isolation** - Enterprise-grade security
4. ✅ **Session isolation** - Privacy protection
5. ✅ **Rich formatting** - Code blocks, markdown (technical content)
6. ✅ **SuperAdmin governance** - Centralized oversight, metrics, violations tracking
7. ✅ **Inbox review** - Human-in-the-loop for quality control
8. ✅ **Theme customization** - Brand matching via Admin UI

### **Competitive Pricing Analysis**

**Standard RAG Chatbot Pricing:**
- **Basic:** $50-100/month (limited messages, basic RAG)
- **Pro:** $100-300/month (higher limits, better RAG)
- **Enterprise:** $300-1000+/month (unlimited, custom RAG)

**Governed AI/Compliance Premium:**
- **+50-100%** premium for compliance/audit features
- Enterprise governance tools: **+$200-500/month**

**Examples:**
- Intercom: $29-99+/seat/month (basic chat)
- Drift: $0-2500+/month (AI + live chat)
- Custom RAG solutions: $200-800+/month
- Compliance/governance tools: +$300-1000+/month

### **Recommended Pricing for Abilitix Widget**

**Tier 1: Starter** - $99/month
- Up to 1,000 messages/month
- Basic RAG (5 documents)
- Standard theme customization
- Email support

**Tier 2: Professional** - $299/month
- Up to 10,000 messages/month
- Advanced RAG (unlimited documents)
- Full theme customization
- Inbox review (human verification)
- Priority support

**Tier 3: Enterprise** - $799/month
- Unlimited messages
- Full RAG + governance
- SuperAdmin dashboard
- Audit trails & compliance
- Session isolation
- Custom integrations
- Dedicated support

**Tier 4: Enterprise+** - Custom pricing
- Multi-tenant management
- Advanced governance
- Custom features
- SLA guarantees

### **Pricing Rationale**

**Why $99-799/month?**
1. **RAG + Governance** = Premium positioning ($200-500 value)
2. **Compliance features** = Enterprise premium (+$200-300)
3. **Multi-tenant** = Enterprise feature (+$100-200)
4. **Total value:** $500-1000+/month
5. **Competitive pricing:** $99-799/month (20-30% discount)

**Positioning:** Premium governed AI chatbot with compliance features

---

## 📊 **ANALYTICS DASHBOARD - WORK SCOPE**

### **What Needs to Be Built**

#### **1. Admin UI (My Work) - 2-3 days**

**New Page:** `/admin/widget/analytics`

**Components:**
- `WidgetAnalyticsPage.tsx` - Main analytics page
- `WidgetMetricsCard.tsx` - KPI cards (total messages, active users, etc.)
- `WidgetUsageChart.tsx` - Time series charts (messages over time)
- `PopularQuestionsTable.tsx` - Top questions asked
- `AnswerQualityMetrics.tsx` - Success rate, satisfaction
- `ExportButton.tsx` - CSV export functionality

**Features:**
- Date range picker (last 7/30/90 days, custom)
- Metrics:
  - Total messages
  - Unique users/sessions
  - Messages per day/hour
  - Popular questions (top 10)
  - Answer source breakdown (RAG vs FAQ)
  - Average response time
  - Error rate
- Charts:
  - Messages over time (line chart)
  - Source breakdown (pie chart)
  - Hourly distribution (bar chart)
- Tables:
  - Top questions
  - Recent activity
- Export: CSV download

**API Integration:**
- Fetch from `/api/admin/widget/analytics`
- Proxy to Admin API backend

---

#### **2. Admin API (Backend Team) - 2-3 days**

**New Endpoint:** `GET /admin/widget/analytics`

**Query Parameters:**
- `from` - Start date (ISO format)
- `to` - End date (ISO format)
- `tenant_id` - Filter by tenant (optional, for superadmin)

**Response:**
```json
{
  "summary": {
    "total_messages": 1250,
    "unique_sessions": 342,
    "unique_users": 298,
    "avg_response_time_ms": 1250,
    "error_rate": 0.02,
    "rag_answers": 850,
    "faq_answers": 400
  },
  "time_series": [
    { "date": "2025-11-22", "messages": 45, "sessions": 12 },
    { "date": "2025-11-21", "messages": 38, "sessions": 10 }
  ],
  "popular_questions": [
    { "question": "What is Abilitix?", "count": 45, "source": "rag" },
    { "question": "How do I get started?", "count": 32, "source": "faq" }
  ],
  "hourly_distribution": [
    { "hour": 9, "messages": 45 },
    { "hour": 10, "messages": 67 }
  ]
}
```

**Database Queries:**
- Aggregate widget usage from `widget_usage` or `ask_logs` table
- Filter by tenant_id, date range
- Group by date, hour, question
- Calculate metrics (totals, averages, rates)

**Tables Needed:**
- `widget_usage` or similar (if not exists)
- Or query existing `ask_logs` table with `source='widget'` filter

---

#### **3. Runtime API (Backend Team) - 1 day**

**What Runtime Needs to Do:**
- **Track widget requests** - Add `source='widget'` flag to ask logs
- **Store widget metadata** - session_id, widget_key, tenant_id
- **Ensure data is queryable** - Make sure logs are accessible for analytics

**Current State:**
- Runtime already logs ask requests
- Need to ensure widget requests are tagged/identifiable
- May need to add `source='widget'` or `channel='widget'` field

**Work Required:**
- Add widget tracking flag to ask endpoint
- Ensure logs include widget_key, session_id
- Make logs queryable by Admin API

---

### **Work Breakdown**

| Component | Who | Effort | Dependencies |
|-----------|-----|--------|--------------|
| **Admin UI Page** | Me | 2-3 days | Admin API endpoint ready |
| **Admin API Endpoint** | Admin API Team | 2-3 days | Runtime tracking ready |
| **Runtime Tracking** | Runtime Team | 1 day | None (add flag) |
| **Database Schema** | Admin API Team | 0.5 day | If new table needed |
| **Testing** | All | 0.5 day | All components ready |

**Total Effort:** 6-8 days (can be done in parallel)

---

### **Implementation Order**

1. **Runtime API** (1 day) - Add widget tracking flag
2. **Admin API** (2-3 days) - Build analytics endpoint
3. **Admin UI** (2-3 days) - Build dashboard page
4. **Testing** (0.5 day) - End-to-end verification

**Can be done in parallel:**
- Runtime tracking + Admin API endpoint (can work simultaneously)
- Admin UI can start once Admin API endpoint is ready

---

### **Does Runtime Need Changes?**

**Yes, minimal changes needed:**

1. **Add widget tracking flag:**
   - When widget makes request, add `source='widget'` or `channel='widget'`
   - Store `widget_key` in logs (if not already)
   - Store `session_id` in logs (if not already)

2. **Ensure logs are queryable:**
   - Admin API needs to query logs by:
     - `source='widget'`
     - `tenant_id`
     - `date range`
     - `widget_key` (optional)

**Current State Check:**
- Runtime already logs ask requests
- Need to verify if widget requests are identifiable
- May need to add metadata field

**Effort:** 1 day (add tracking flag, ensure queryability)

---

## 📋 **SUMMARY**

### **Pricing Recommendation**
- **Starter:** $99/month
- **Professional:** $299/month
- **Enterprise:** $799/month
- **Enterprise+:** Custom

**Rationale:** Premium governed AI with compliance features justifies higher pricing than basic chatbots.

### **Analytics Dashboard Scope**

**My Work (Admin UI):** 2-3 days
- New analytics page
- Charts, tables, metrics
- Export functionality

**Admin API Work:** 2-3 days
- Analytics endpoint
- Database queries
- Data aggregation

**Runtime API Work:** 1 day
- Add widget tracking flag
- Ensure logs are queryable

**Total:** 6-8 days (can parallelize)

**Ready to start when you give go-ahead!**

---

**Last Updated:** 2025-11-22


