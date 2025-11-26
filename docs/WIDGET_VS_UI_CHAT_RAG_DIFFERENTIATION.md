# Widget vs UI Chat RAG Parameters - Industry Best Practices & Abilitix Differentiation

**Date:** 2025-11-22  
**Question:** Should widget and UI chat have different RAG parameters?

---

## 🔍 **Current State (No Demarcation)**

### **Widget:**
- Hardcoded: `topk: 5`
- Fixed, no user control
- Public-facing, customer experience

### **UI Chat:**
- Default: `topk: 8`
- User-adjustable: 1-20 range
- Respects tenant settings `RAG_TOPK`
- Internal/admin use, more flexibility

**Problem:** No differentiation based on use case or channel.

---

## 📊 **Industry Best Practices**

### **1. Channel-Based Optimization (Common Practice)**

**Widget/Public Chat:**
- **Lower `topk` (3-5):** Faster responses, lower latency
- **Tighter relevance:** Higher quality threshold
- **Cost optimization:** Fewer chunks = lower token costs
- **User experience:** Quick, concise answers

**Admin/Internal Chat:**
- **Higher `topk` (8-12):** More comprehensive answers
- **Exploratory:** Users can experiment with parameters
- **Quality over speed:** More context for complex queries
- **Governance:** Respects tenant policies

### **2. Use Case Differentiation**

**Public Widget:**
- Customer support queries
- FAQ-style answers
- Quick, accurate responses
- Cost-sensitive (high volume)

**Admin UI:**
- Knowledge exploration
- Document research
- Complex analytical queries
- Quality over speed

### **3. Governance & Compliance (Abilitix Differentiator)**

**Enterprise Requirement:**
- Different policies per channel
- Widget: Stricter compliance, no-store policies
- Admin UI: More flexibility, audit trails
- Per-channel budget controls

---

## 🎯 **How Abilitix Can Differentiate**

### **1. Channel-Aware RAG Configuration** ⭐ **UNIQUE**

**Feature:**
- Separate RAG settings for widget vs UI chat
- Tenant-configurable via Admin UI
- Runtime API applies channel-specific settings

**Implementation:**
```typescript
// Tenant Settings
WIDGET.RAG_TOPK = 5        // Public widget
UI_CHAT.RAG_TOPK = 8       // Admin interface
WIDGET.MAX_TOKENS = 500    // Widget: concise
UI_CHAT.MAX_TOKENS = 1000  // UI: comprehensive
```

**Benefits:**
- ✅ Optimize widget for speed/cost
- ✅ Optimize UI chat for quality/exploration
- ✅ Per-channel governance
- ✅ Better user experience per channel

### **2. Intelligent Auto-Tuning** ⭐ **ADVANCED**

**Feature:**
- Widget: Auto-adjust `topk` based on query complexity
- Simple queries → `topk: 3` (faster)
- Complex queries → `topk: 5` (more context)
- UI Chat: User-controlled, always comprehensive

**Differentiation:**
- Most SaaS: Fixed parameters
- Abilitix: Adaptive, context-aware

### **3. Compliance-First Design** ⭐ **ENTERPRISE**

**Feature:**
- Widget: Stricter no-store policies, lower token budgets
- UI Chat: More flexible, full audit trails
- Per-channel governance rules

**Differentiation:**
- Most SaaS: One-size-fits-all
- Abilitix: Channel-specific governance

### **4. Cost Optimization** ⭐ **VALUE**

**Feature:**
- Widget: Lower `topk` = lower costs (high volume)
- UI Chat: Higher `topk` = better quality (low volume)
- Per-channel budget tracking

**Differentiation:**
- Most SaaS: Same cost for all channels
- Abilitix: Optimize costs per channel

---

## 💡 **Recommended Approach**

### **Option 1: Tenant-Configurable (Recommended)** ⭐

**Settings:**
```
WIDGET.RAG_TOPK = 5
UI_CHAT.RAG_TOPK = 8
```

**Benefits:**
- ✅ Tenant control
- ✅ Different optimization per channel
- ✅ Governance-compliant
- ✅ Cost-optimized

**Implementation:**
- Runtime API checks `channel` field
- Applies channel-specific settings
- Falls back to tenant default if not set

### **Option 2: Smart Defaults + Override**

**Defaults:**
- Widget: `topk: 5` (fast, cost-effective)
- UI Chat: `topk: 8` (comprehensive, quality)

**Override:**
- Tenant can adjust via Admin UI
- Per-channel settings

### **Option 3: Adaptive (Future)**

**Auto-adjust based on:**
- Query complexity
- Historical performance
- User feedback
- Cost targets

---

## 🚀 **Abilitix Differentiation Strategy**

### **1. Governance-First** ⭐⭐⭐
- **Most SaaS:** Same settings for all channels
- **Abilitix:** Channel-specific governance, compliance, budgets

### **2. Cost Optimization** ⭐⭐
- **Most SaaS:** Fixed parameters, high costs
- **Abilitix:** Optimize widget (high volume) vs UI chat (low volume)

### **3. Enterprise Control** ⭐⭐
- **Most SaaS:** Limited configuration
- **Abilitix:** Full tenant control, per-channel settings

### **4. Quality vs Speed Balance** ⭐
- **Most SaaS:** One-size-fits-all
- **Abilitix:** Widget = speed, UI Chat = quality

---

## 📋 **Implementation Plan**

### **Phase 1: Tenant Settings (1-2 days)**
- Add `WIDGET.RAG_TOPK` and `UI_CHAT.RAG_TOPK` to tenant settings
- Admin UI: Channel-specific RAG configuration
- Defaults: Widget=5, UI Chat=8

### **Phase 2: Runtime API (1 day)**
- Check `channel` field in request
- Apply channel-specific `topk` from tenant settings
- Fallback to tenant default if not set

### **Phase 3: Widget Update (0.5 day)**
- Remove hardcoded `topk: 5`
- Read from tenant settings (or use default)

### **Phase 4: UI Chat (Already Flexible)**
- Already respects tenant settings
- Already user-adjustable
- No changes needed

**Total Effort:** 2.5-3.5 days

---

## ✅ **Recommendation**

**Implement Channel-Aware RAG Configuration:**
1. ✅ Tenant-configurable per channel
2. ✅ Widget optimized for speed/cost (`topk: 5`)
3. ✅ UI Chat optimized for quality (`topk: 8`)
4. ✅ Governance-compliant
5. ✅ Cost-optimized

**Differentiation:**
- ⭐ **Governance-First:** Channel-specific policies
- ⭐ **Cost Optimization:** Per-channel optimization
- ⭐ **Enterprise Control:** Full tenant configuration

**This is a competitive advantage** - most SaaS chatbots use the same parameters for all channels. Abilitix can offer channel-specific optimization with governance controls.

---

**Last Updated:** 2025-11-22


