# Abilitix Roadmap - December 2025

**Status:** Approved - Active Plan  
**Last Updated:** December 8, 2025  
**Focus:** Sales Enablement & Product-Market Fit  
**Target:** B2B SaaS (50-200 employees), A$2,500/mo, Compliance-First

---

## 🎯 Strategic Context

**Current State:**
- ✅ Technical Foundation: 9/10 (Enterprise-grade, production-ready)
- 🟡 Market Fit: 4/10 (Pivoting to compliance-first strategy)
- 🎯 Target: B2B SaaS companies (50-200 employees)
- 💰 Pricing: A$2,500/mo (Risk reduction positioning)

**Strategic Priorities:**
1. **Time-to-Value** - Get users to "aha moment" faster
2. **Value Demonstration** - Show ROI before asking for payment
3. **Workflow Integration** - Make it invisible (fit existing tools)
4. **Sales Enablement** - Reduce friction, prove value

---

## 📅 December 2025 Roadmap

### **Week 1 (Dec 9-15): Complete Time-to-Value**

#### **Priority 1: Welcome Page + Demo Experience** ⚡ **IN PROGRESS**

- **Status:** In Progress (2-3 days remaining)
- **Owner:** Admin UI Team
- **Impact:** 🔥🔥🔥 **CRITICAL** - Highest sales impact
- **Effort:** 2-3 days
- **Dependencies:** None
- **Why First:**
  - Reduces time-to-value (get users to "aha moment" in < 5 minutes)
  - Enables self-serve trials (reduces sales friction)
  - Shows value immediately (before asking for payment)
  - **Blocks:** Nothing, but enables everything else

**Deliverables:**
- [ ] Onboarding flow (guided setup)
- [ ] Interactive demo (show value in 2-3 clicks)
- [ ] Quick start checklist
- [ ] Pre-populated examples (so users see value immediately)

---

### **Week 2 (Dec 16-22): Value Demonstration**

#### **Priority 2: Widget Analytics Dashboard** 📊 **NEW**

- **Status:** Not Started
- **Owner:** Admin API + Admin UI Teams
- **Impact:** 🔥🔥🔥 **CRITICAL** - Proves ROI, justifies pricing
- **Effort:** 6-8 days (can parallelize)
- **Dependencies:** Welcome Page complete (Week 1)
- **Why Second:**
  - Proves value to buyers (measurable ROI)
  - Shows usage metrics (questions answered, time saved)
  - Enables data-driven sales conversations
  - Supports A$2,500/mo pricing justification
  - **Strategic Fit:** "Prove value BEFORE asking for payment"

**Architecture:**
- Unified analytics system (widget + admin chat)
- Reusable components (build once, use twice)
- Same endpoints, different `source` parameter

**Deliverables:**
- [ ] Runtime API: Add `channel` field to `llm_telemetry` (1 day)
- [ ] Admin API: `GET /admin/analytics/chat?source=widget` (2-3 days)
- [ ] Admin UI: Unified analytics dashboard (2-3 days)
- [ ] **Key Metrics (Must-Have in One Simple Chart/Card):**
  - ✅ "Questions answered" (total count)
  - ✅ "% answered from FAQs vs RAG" (FAQ hit rate)
  - ✅ "Top questions" (most popular questions)
  - Additional: Response times, time-series data (nice-to-have)

**Critical Requirement:**
- **One simple chart/card** that shows the 3 key metrics above
- This alone sells - proves ROI immediately
- Can add more detailed views later, but v1 must have these 3 visible at a glance

**Files to Create/Modify:**
- `db/migrations/YYYYMMDD_add_channel_to_llm_telemetry.sql`
- `routes_admin.py` (new analytics endpoint)
- Admin UI: `ChatAnalyticsPage` component (reusable)

---

### **Week 3 (Dec 23-29): Workflow Integration**

#### **Priority 3: Slack Integration** 💬 **NEW**

- **Status:** Planned (spec ready)
- **Owner:** Admin API + Runtime API Teams
- **Impact:** 🔥🔥 **HIGH** - Increases retention, workflow stickiness
- **Effort:** 18-26 hours (2-3 days)
- **Dependencies:** Analytics Dashboard (Week 2) - shows value first
- **Why Third:**
  - Fits existing workflows ("Make it invisible")
  - High stickiness (daily use = retention)
  - Perfect fit for B2B SaaS target (they live in Slack)
  - Differentiates from generic AI tools
  - **Strategic Fit:** "Make It Invisible (Fit Existing Workflows)"

**Architecture:**
- Additive, modular, non-breaking
- Follows existing `integrations/storage/*` patterns
- Feature-flagged OFF by default

**V1 Scope (Keep It Tight):**
- ✅ **One workspace** per tenant (enforced)
- ✅ **One channel** (can expand later)
- ✅ **Basic flow:** Ask → Cited answer → Link back to Abilitix
- ❌ **Defer:** Multiple channels, slash commands, advanced features

**Why Keep V1 Tight:**
- Faster to ship (2-3 days vs 1-2 weeks)
- Proves concept without over-engineering
- Can expand based on user feedback
- Focus on core value: "Ask in Slack, get cited answer"

**Deliverables:**
- [ ] PR-S1: Schema & RLS (2-3 hours)
- [ ] PR-S2: Admin API OAuth & Workspace Routes (4-6 hours)
- [ ] PR-S3: Runtime API Event Handler (3-4 hours)
- [ ] PR-S4: Slack Client & Ask Bridge (3-4 hours)
- [ ] PR-S5: Admin UI Integration Card (4-6 hours)
- [ ] PR-S6: Testing & Documentation (2-3 hours)

**Files to Create:**
- `db/migrations/YYYYMMDD_slack_integration_schema.sql`
- `integrations/slack/client.py`
- `integrations/slack/ask_bridge.py`
- `integrations/slack/event_processor.py`
- Admin UI: Settings → Integrations → Slack card

---

### **Week 4 (Dec 30 - Jan 5): Polish & Quick Wins**

#### **Priority 4a: Quota Warnings** ⚠️ **NEW**

- **Status:** Not Started
- **Owner:** Admin UI Team
- **Impact:** 🔥🔥 **MEDIUM** - Improves UX, prevents surprises, retention
- **Effort:** 1-2 days (UI-only, uses existing quota data)
- **Dependencies:** None
- **Why Now:**
  - Quick win, fits Week 4 "polish" theme
  - Can be done in parallel with email system
  - Doesn't block sales enablement
  - Improves retention without heavy lift
  - Proactive UX (80%, 90%, 100% warnings)
  - Shows we care about their usage

**Deliverables:**
- [ ] In-app warning banners at 80%, 90%, 100% quota usage
- [ ] Visual indicators on quota dashboard
- [ ] Auto-upgrade suggestions when approaching limits
- [ ] Email notifications (optional, can be added later)

**Implementation:**
- Uses existing `/admin/billing/me/quota` endpoint
- No backend changes needed (UI-only)
- Can calculate warning levels from current usage vs quota

---

#### **Priority 4b: Email System Overhaul** ✉️ **IN PROGRESS**

- **Status:** In Progress
- **Owner:** Admin API Team
- **Impact:** 🔥 **MEDIUM** - Better onboarding, reduces support
- **Effort:** 2-3 days (finish in-progress work)
- **Dependencies:** None
- **Why:**
  - Better transactional emails = better onboarding
  - Reduces support questions
  - Professional appearance (builds trust)

**Deliverables:**
- [ ] Complete email system migration (Mailtrap → Postmark)
- [ ] Improve email templates (onboarding, password reset, etc.)
- [ ] Add email analytics (open rates, click rates)

---

#### **Priority 4c: Quick Wins (Optional - If Time Permits)**

**4c-a. Usage Metrics in Dashboard** (1 day)
- Show "Questions answered this month" on dashboard
- Simple metric that proves value
- Low effort, high visibility

**4c-b. Social Proof on Landing Page** (1-2 days)
- Testimonials, case studies
- "Used by X companies"
- Builds trust, reduces friction

**4c-c. API Documentation** (2-3 days)
- Developer portal
- Enables enterprise integrations
- Shows technical maturity

---

## 📊 Roadmap Summary

| Week | Priority | Feature | Status | Effort | Impact | Dependencies |
|------|----------|---------|--------|--------|--------|--------------|
| **Week 1** | P1 | Welcome Page + Demo | In Progress | 2-3 days | 🔥🔥🔥 | None |
| **Week 2** | P2 | Widget Analytics Dashboard | Not Started | 6-8 days | 🔥🔥🔥 | Welcome Page |
| **Week 3** | P3 | Slack Integration | Planned | 2-3 days | 🔥🔥 | Analytics |
| **Week 4** | P4a | Quota Warnings | Not Started | 1-2 days | 🔥🔥 | None |
| **Week 4** | P4b | Email System Overhaul | In Progress | 2-3 days | 🔥 | None |
| **Week 4** | P4c | Quick Wins (Optional) | Not Started | 1-4 days | 🔥 | None |

**Total Estimated Effort:** 14-23 days (2.5-4 weeks)

**Note:** Week 4 items can be parallelized (quota warnings + email system), reducing total Week 4 effort to 3-4 days.

---

## 📅 January 2026 Roadmap: Billing Polish Sprint

### **Week 1 (Jan 6-12): Billing System Completion**

#### **Priority 1: Invoice/Billing History** 📄 **NEW**

- **Status:** Not Started
- **Owner:** Admin API + Admin UI Teams
- **Impact:** 🔥🔥🔥 **HIGH** - Needed for enterprise deals, renewals
- **Effort:** 3-5 days (backend + UI)
- **Dependencies:** None
- **Why January:**
  - Needed for enterprise renewals
  - Not blocking initial trials
  - Can wait until paying customers exist
  - Fits post-sale polish phase
  - Enterprise requirement (compliance/audit)

**Deliverables:**
- [ ] Backend: `GET /admin/billing/me/invoices` (tenant self-serve)
- [ ] Backend: `GET /admin/billing/me/invoices/{id}/download` (PDF)
- [ ] Backend: `GET /admin/billing/me/payment-history`
- [ ] UI: Invoice list page
- [ ] UI: Invoice download functionality
- [ ] UI: Payment history page

**Files to Create/Modify:**
- `routes_billing.py` (new invoice endpoints)
- `services/billing_service.py` (invoice generation logic)
- Admin UI: Invoice list, download, payment history pages

---

#### **Priority 2: Payment Methods Management** 💳 **NEW**

- **Status:** Not Started
- **Owner:** Admin API + Admin UI Teams
- **Impact:** 🔥🔥 **MEDIUM** - Nice-to-have polish, self-serve upgrades
- **Effort:** 2-3 days (backend + UI)
- **Dependencies:** None
- **Why January:**
  - Stripe Portal exists as workaround
  - Not blocking sales
  - Lowest priority billing feature
  - Nice-to-have for self-serve experience

**Deliverables:**
- [ ] Backend: `GET /admin/billing/me/payment-methods`
- [ ] Backend: `POST /admin/billing/me/payment-methods` (add)
- [ ] Backend: `PUT /admin/billing/me/payment-methods/{id}` (update)
- [ ] Backend: `PATCH /admin/billing/me/payment-methods/{id}/default` (set default)
- [ ] UI: Payment methods management page
- [ ] UI: Add/update/delete payment methods
- [ ] UI: Set default payment method

**Files to Create/Modify:**
- `routes_billing.py` (new payment method endpoints)
- `services/billing_service.py` (payment method logic, Stripe API integration)
- Admin UI: Payment methods management page

---

### **January Roadmap Summary**

| Week | Priority | Feature | Status | Effort | Impact | Dependencies |
|------|----------|---------|--------|--------|--------|--------------|
| **Jan W1** | P1 | Invoice/Billing History | Not Started | 3-5 days | 🔥🔥🔥 | None |
| **Jan W1** | P2 | Payment Methods | Not Started | 2-3 days | 🔥🔥 | None |

**Total Estimated Effort:** 5-8 days (1-1.5 weeks)

**Note:** January Week 1 items can be parallelized (invoice history + payment methods), reducing total effort to 3-5 days.

---

## 🎯 Success Metrics

### **Week 1 (Welcome Page):**
- [ ] Time-to-value < 5 minutes (from signup to first answer)
- [ ] Trial signup rate increases by 20%+
- [ ] Support questions during onboarding decrease by 30%+

### **Week 2 (Analytics Dashboard):**
- [ ] **Key metrics visible in one simple chart/card:**
  - Questions answered (total)
  - % answered from FAQs vs RAG
  - Top questions
- [ ] All customers can see usage metrics
- [ ] Sales team uses metrics in 80%+ of demos
- [ ] Conversion rate from trial to paid increases by 15%+

### **Week 3 (Slack Integration):**
- [ ] V1 scope: One workspace, one channel, basic flow (Ask → Cited answer → Link)
- [ ] 50%+ of B2B SaaS trials connect Slack
- [ ] Slack users show 2x higher retention
- [ ] Enterprise pipeline includes Slack integration in 80%+ of deals

### **Week 4 (Quota Warnings + Email + Quick Wins):**
- [ ] Quota warnings shown at 80%, 90%, 100% usage
- [ ] Zero quota-related support tickets (proactive warnings work)
- [ ] Email open rates > 40%
- [ ] Onboarding completion rate increases by 25%+
- [ ] Landing page conversion rate increases by 15%+

### **January Week 1 (Billing Polish):**
- [ ] All paying customers can download invoices
- [ ] Payment history visible to all customers
- [ ] Payment methods manageable in-app (or Stripe Portal)
- [ ] Enterprise deals include invoice requirements (100% coverage)

---

## 🔄 Revisit & Refine Schedule

**Review Points:**
- **Dec 15:** Review Week 1 completion, adjust Week 2 if needed
- **Dec 22:** Review Week 2 completion, adjust Week 3 if needed
- **Dec 29:** Review Week 3 completion, adjust Week 4 if needed
- **Jan 5:** Final review, plan January roadmap

**Refinement Criteria:**
- Market feedback (what are customers asking for?)
- Sales feedback (what's blocking deals?)
- Usage data (what features are actually used?)
- Competitive landscape (what are competitors doing?)

---

## 🚫 What We're NOT Doing (This Month)

**Explicitly Deferred:**
- ❌ Admin Jobs & Workers Consolidation (defer to January)
- ❌ Advanced widget features (voice, templates)
- ❌ New document sources (beyond Google Drive)
- ❌ Enterprise SSO (not needed for current target)
- ❌ Invoice/Billing History (defer to January - not blocking trials)
- ❌ Payment Methods Management (defer to January - workaround exists)

**Why:**
- Focus on sales enablement first
- These don't directly impact time-to-value or conversion
- Can be added after product-market fit is proven

---

## 💡 Strategic Rationale

**Why This Order:**

1. **Welcome Page (Week 1)** → More trials
   - Reduces friction, enables self-serve
   - Shows value immediately

2. **Analytics Dashboard (Week 2)** → Higher conversion
   - Proves value, justifies pricing
   - Enables data-driven sales

3. **Slack Integration (Week 3)** → Higher retention
   - Workflow integration = stickiness
   - Perfect fit for B2B SaaS target

4. **Quota Warnings + Email + Quick Wins (Week 4)** → Polish & scale
   - Proactive UX (quota warnings)
   - Professional appearance (email system)
   - Reduces support burden

**The Funnel:**
```
More Trials (Welcome Page)
    ↓
Higher Conversion (Analytics)
    ↓
Higher Retention (Slack)
    ↓
Product-Market Fit
```

---

## 📝 Notes for Refinement

**Questions to Answer:**
- [ ] Are there customer requests that should change priorities?
- [ ] Are there sales blockers that need immediate attention?
- [ ] Are there competitive threats that require response?
- [ ] Are there technical debt items that are blocking progress?

**Market Signals to Watch:**
- Trial signup rates (are they increasing?)
- Conversion rates (are trials converting?)
- Churn rates (are customers staying?)
- Feature requests (what are customers asking for?)

**Adjustment Triggers:**
- If Welcome Page doesn't improve signups → Pivot messaging
- If Analytics doesn't improve conversion → Revisit pricing/value prop
- If Slack doesn't improve retention → Revisit target market
- If sales pipeline dries up → Revisit GTM strategy

---

## 🎯 End-of-Month Goals

**By December 31, 2025:**
- ✅ Welcome Page + Demo complete (100% of trials see value in < 5 min)
- ✅ Analytics Dashboard live (all customers can see ROI)
- ✅ Slack Integration ready (or 80% complete)
- ✅ Quota warnings implemented (proactive UX)
- ✅ Email system improved (professional, reliable)
- ✅ 2+ pilot customers signed (product-market fit validation)

**By January 12, 2026:**
- ✅ Invoice/Billing history complete (enterprise-ready)
- ✅ Payment methods management (or Stripe Portal integration)
- ✅ Billing system 100% complete (world-class SaaS)

**Success Criteria:**
- Time-to-value < 5 minutes
- Trial-to-paid conversion > 20%
- Customer retention > 80% (after 30 days)
- Sales pipeline: 5+ qualified opportunities

---

## 💭 Future Considerations (To Explore)

### **Recruiter-Based Solution** 🤔 **UNDER CONSIDERATION**

- **Status:** Under Discussion
- **Owner:** Product Team
- **Impact:** TBD - Needs market validation
- **Effort:** TBD - Needs scope definition
- **Why Consider:**
  - Potential new market opportunity
  - Different use case (recruitment/HR)
  - May require different positioning
  - Needs validation before committing

**Questions to Answer:**
- [ ] What's the specific pain point for recruiters?
- [ ] How does this differ from current B2B SaaS target?
- [ ] What's the pricing model (per-recruiter vs per-company)?
- [ ] Is this a pivot or additional market?
- [ ] What features would be required?
- [ ] What's the competitive landscape?

**Recommendation:**
- Validate market need first (talk to 5-10 recruiters)
- Understand pain points and willingness to pay
- Assess if this is a pivot or additional market
- Don't commit development resources until validated
- Can be explored in parallel with current roadmap

**Next Steps:**
- [ ] Market research (recruiter interviews)
- [ ] Competitive analysis (existing solutions)
- [ ] Define MVP scope (if validated)
- [ ] Assess effort vs current roadmap priorities

---

---

## ✅ Feedback Incorporated

**From Admin UI Team Review (Dec 8, 2025):**

1. **Week 2 Analytics - Key Metrics Requirement:**
   - ✅ Added requirement: One simple chart/card with 3 key metrics
   - ✅ "Questions answered", "% FAQs vs RAG", "Top questions" must be visible at a glance
   - ✅ This alone sells - proves ROI immediately

2. **Week 3 Slack - V1 Scope Constraints:**
   - ✅ Added V1 scope: One workspace, one channel, basic flow
   - ✅ Keep it tight - Ask → Cited answer → Link back to Abilitix
   - ✅ Defer advanced features (multiple channels, slash commands) to later

**Rationale:**
- Analytics: Focus on metrics that sell (prove ROI)
- Slack: Ship fast, prove concept, expand based on feedback

---

**Next Review:** December 15, 2025  
**Owner:** Product Team  
**Status:** Approved - Ready for Execution  
**Last Updated:** December 8, 2025

