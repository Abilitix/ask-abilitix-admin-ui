# Abilitix Solopreneur Roadmap — Strategic Priorities (2025)

**Last Updated:** November 27, 2025  

**Owner:** Product Strategy  

**Focus:** Value multipliers, time efficiency, sustainable pace

---

## 🎯 Executive Summary

**Current State:**

- ✅ FAQ Engine Phase 2: **Complete** (backend production-ready)

- ✅ Password Login: **~90% complete** (cookie fixes needed)

- ⏳ Welcome/Demo: **Not started** (high conversion impact)

- ⏳ Analytics/Feedback: **Not started** (data-driven decisions)

**Strategic Focus:**

1. **Finish blockers** (Password Login) — 1-2 hours

2. **Conversion multipliers** (Welcome/Demo) — 2-3 days

3. **Data foundation** (Analytics) — 3-4 days (parallel)

4. **Incremental polish** (UI improvements) — ongoing

**Deferred:**

- Phase 3/4 (Review Existing FAQ, Unassign) — nice-to-have

- Advanced UI polish — wait for user feedback

- OAuth/Passkeys — Phase 2+ (already documented)

---

## 📅 Phase Breakdown

### **Phase 1: Finish Password Login** (Priority: CRITICAL)

**Time:** 1-2 hours  

**Status:** 90% complete, cookie fixes needed  

**Blocking:** User onboarding, other features

#### Tasks

- [ ] Fix cookie handling inconsistencies

  - Use `_cookie_opts()` helper consistently across endpoints

  - Test in preview environment

  - Verify session persistence

- [ ] End-to-end testing

  - Test login → dashboard flow

  - Test password reset flow

  - Test session expiration

- [ ] Deploy to production

  - Monitor for cookie issues

  - Verify audit logs

#### Success Criteria

- ✅ Users can log in with email/password

- ✅ Sessions persist correctly

- ✅ Password reset works end-to-end

- ✅ No cookie-related errors in logs

#### Dependencies

- None (backend already implemented)

---

### **Phase 2: Welcome Page + Demo Experience** (Priority: HIGH)

**Time:** 2-3 days  

**Status:** Not started  

**Impact:** High conversion, reduces support load

#### Tasks

- [ ] Design welcome page layout

  - Hero section with value proposition

  - Demo video/CTA

  - Skip advanced animations (MVP only)

- [ ] Implement welcome page

  - Simple, clean design

  - Mobile responsive

  - Fast load time

- [ ] Create demo experience

  - Interactive walkthrough OR

  - Video demo OR

  - Sample data showcase

- [ ] Add onboarding flow

  - First-time user detection

  - Guided tour (optional, Phase 2)

- [ ] Test conversion flow

  - Signup → Welcome → Dashboard

  - Measure completion rate

#### Success Criteria

- ✅ New users see welcome page

- ✅ Demo experience is engaging

- ✅ Conversion rate improves

- ✅ Support tickets decrease

#### Dependencies

- Password login must be working (Phase 1)

---

### **Phase 3: Analytics + Feedback Foundation** (Priority: HIGH)

**Time:** 3-4 days (can run parallel with Phase 2)  

**Status:** Not started  

**Impact:** Data-driven decisions, aligns with roadmap Item 7

#### Tasks

- [ ] Design analytics schema

  - Event tracking table

  - User actions (FAQ views, searches, etc.)

  - Widget usage metrics

- [ ] Implement event tracking

  - Backend: Event logging endpoint

  - Frontend: Event tracking hooks

  - Database: Analytics tables

- [ ] Create basic dashboard

  - FAQ usage stats

  - Widget engagement

  - User activity

- [ ] Implement feedback collection

  - End-user feedback endpoint (Phase 5)

  - Admin feedback forms

  - Sentiment tracking

- [ ] Add reporting

  - Daily/weekly summaries

  - Export capabilities (optional)

#### Success Criteria

- ✅ Events are tracked correctly

- ✅ Dashboard shows key metrics

- ✅ Feedback is collected and stored

- ✅ Data guides prioritization decisions

#### Dependencies

- Can run parallel with Phase 2

- No blocking dependencies

---

### **Phase 4: Incremental UI Polish** (Priority: MEDIUM)

**Time:** Ongoing (1-2 hours/week)  

**Status:** In progress (as time allows)  

**Impact:** User experience, professional appearance

#### Tasks (Prioritized)

- [ ] Fix critical UI bugs

  - Citations validation (UI responsibility)

  - Form validation errors

  - Loading states

- [ ] Improve layout consistency

  - Spacing, typography

  - Color scheme

  - Component library

- [ ] Enhance mobile experience

  - Responsive tables

  - Touch-friendly buttons

  - Mobile navigation

- [ ] Add polish (as time allows)

  - Animations (subtle)

  - Transitions

  - Micro-interactions

#### Success Criteria

- ✅ No critical UI bugs

- ✅ Consistent design language

- ✅ Mobile-friendly

- ✅ Professional appearance

#### Dependencies

- None (can be done incrementally)

---

## 🚫 Deferred Items

### **Phase 3: Admin Review - Existing FAQ**

**Status:** Deferred  

**Reason:** Nice-to-have, not blocking core functionality  

**Future:** Can add when time allows

- `POST /admin/inbox/create-review-request` — missing

- `qa_pair_id` column migration — not urgent

### **Phase 4: Assignment Management**

**Status:** Deferred  

**Reason:** Current assignment flow works; enhancement can wait  

**Future:** Add when assignment workload increases

- `POST /admin/inbox/{id}/unassign` — missing

- `POST /admin/inbox/{id}/reassign` — missing

### **Advanced UI Polish**

**Status:** Deferred  

**Reason:** Focus on functionality first, polish incrementally  

**Future:** Based on user feedback and analytics

- Advanced animations

- Complex interactions

- Premium design elements

### **OAuth/Passkeys/MFA**

**Status:** Phase 2+ (documented)  

**Reason:** Password login is sufficient for MVP  

**Future:** Add when enterprise customers request

- OAuth (Google/Microsoft)

- Passkeys (WebAuthn)

- MFA (TOTP)

---

## 📊 Timeline & Work Streams

### **Week 1: Foundation** (5-7 hours)

```
Day 1-2: Password Login (finish) — 1-2 hours
Day 2-4: Welcome/Demo (start) — 2-3 hours
Day 3-5: Analytics (start, parallel) — 2-3 hours
```

### **Week 2: Core Features** (8-10 hours)

```
Day 1-3: Welcome/Demo (complete) — 3-4 hours
Day 2-5: Analytics (continue, parallel) — 3-4 hours
Day 4-5: UI polish (incremental) — 1-2 hours
```

### **Week 3: Completion** (5-7 hours)

```
Day 1-3: Analytics (finish) — 2-3 hours
Day 2-4: UI polish (incremental) — 2-3 hours
Day 5: Testing & deployment — 1 hour
```

**Total Estimated Time:** 18-24 hours over 3 weeks

---

## 🎯 Success Metrics

### **Password Login**

- ✅ 100% of users can log in with password

- ✅ <1% session errors

- ✅ Password reset success rate >95%

### **Welcome/Demo**

- ✅ New user conversion rate improves by 20%+

- ✅ Support tickets decrease by 30%+

- ✅ Time-to-value <5 minutes

### **Analytics**

- ✅ 100% of key events tracked

- ✅ Dashboard loads in <2 seconds

- ✅ Data guides 3+ prioritization decisions

### **UI Polish**

- ✅ Zero critical UI bugs

- ✅ Mobile usability score >80

- ✅ User satisfaction improves

---

## 🔄 Parallel Work Streams

### **Stream A: Conversion (Welcome/Demo)**

- **Owner:** Admin UI (primary), Admin API (support)

- **Time:** 2-3 days

- **Dependencies:** Password login (Phase 1)

### **Stream B: Analytics (Foundation)**

- **Owner:** Admin API (backend), Admin UI (dashboard)

- **Time:** 3-4 days

- **Dependencies:** None (can run parallel)

### **Stream C: UI Polish (Incremental)**

- **Owner:** Admin UI

- **Time:** Ongoing (1-2 hours/week)

- **Dependencies:** None

---

## 📋 Implementation Checklist

### **Immediate (This Week)**

- [ ] Fix password login cookie issues

- [ ] Test password login end-to-end

- [ ] Deploy password login to production

- [ ] Start welcome page design

- [ ] Begin analytics schema design

### **Short-term (Next 2 Weeks)**

- [ ] Complete welcome page + demo

- [ ] Finish analytics foundation

- [ ] Fix critical UI bugs

- [ ] Test all new features

- [ ] Deploy to production

### **Ongoing (As Time Allows)**

- [ ] Incremental UI improvements

- [ ] Monitor analytics for insights

- [ ] Iterate based on user feedback

- [ ] Plan Phase 3/4 (if needed)

---

## 🚨 Risk Mitigation

### **Time Overruns**

- **Risk:** Features take longer than estimated

- **Mitigation:** Focus on MVP, defer polish

- **Fallback:** Ship functional version, iterate

### **Technical Debt**

- **Risk:** Quick fixes create debt

- **Mitigation:** Document known issues, plan refactoring

- **Fallback:** Schedule debt reduction sprints

### **Scope Creep**

- **Risk:** Adding features beyond roadmap

- **Mitigation:** Stick to priorities, defer nice-to-haves

- **Fallback:** Add to backlog, prioritize later

---

## 📚 References

### **Related Documents**

- `docs/FAQ_ENGINE_PHASE2_IMPLEMENTATION_PLAN.md` — Phase 2 details

- `docs/AUTH_MODERNISATION_PLAN.md` — Password login implementation

- `docs/OPEN_DEFECTS_LOG.md` — Known issues

### **Roadmap Alignment**

- **Item 1:** FAQ Engine Completion — ✅ Phase 2 done

- **Item 2:** Password Login — ⏳ Phase 1 (finish)

- **Item 3:** Welcome Page + Demo — ⏳ Phase 2

- **Item 7:** Widget Dashboard (Analytics) — ⏳ Phase 3

- **Item 6:** UI Polish — ⏳ Phase 4 (incremental)

---

## 💡 Key Principles

1. **Value First:** Focus on features that drive conversion and insights

2. **Time Efficiency:** Parallel work streams, defer non-essentials

3. **Incremental Polish:** Ship functional, improve based on feedback

4. **Data-Driven:** Analytics guide future priorities

5. **Sustainable Pace:** Avoid burnout, maintain quality

---

## 🎬 Next Steps

1. **Review this roadmap** with stakeholders (if any)

2. **Prioritize tasks** based on current context

3. **Start Phase 1** (Password Login fixes)

4. **Begin Phase 2** (Welcome/Demo) in parallel

5. **Track progress** weekly, adjust as needed

---

**Remember:** As a solopreneur, perfection is the enemy of progress. Ship functional features, iterate based on data, and maintain a sustainable pace.

**Last Updated:** November 27, 2025









