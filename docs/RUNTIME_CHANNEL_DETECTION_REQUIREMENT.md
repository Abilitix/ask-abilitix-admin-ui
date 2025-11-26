# Runtime API Channel Detection Requirement

**Date:** 2025-11-22  
**Purpose:** What Runtime API needs to differentiate widget vs UI chat channels

---

## 🔍 **Current Detection Method**

### **Widget Requests:**
- **Header:** `X-Widget-Key: wid_...`
- **Auth:** Widget key validation
- **No cookies:** Public-facing, no user session

### **UI Chat Requests:**
- **Header:** `X-Tenant-Id: <uuid>`
- **Auth:** Cookie-based (user session)
- **No widget key:** Internal admin interface

---

## ✅ **What Runtime API Needs**

### **1. Detect Channel from Request**

**Simple Logic:**
```python
# In Runtime API /ask endpoint

# Check if request has widget key header
widget_key = request.headers.get("X-Widget-Key")

if widget_key:
    channel = "widget"
else:
    channel = "admin-ui"  # or "ui-chat"
```

### **2. Apply Channel-Specific Settings**

**Read tenant settings:**
```python
# Get channel-specific RAG settings
widget_topk = tenant_settings.get("WIDGET.RAG_TOPK", 5)  # Default: 5
ui_chat_topk = tenant_settings.get("UI_CHAT.RAG_TOPK", 8)  # Default: 8

# Apply based on channel
if channel == "widget":
    effective_topk = widget_topk
else:
    effective_topk = ui_chat_topk

# Use effective_topk in RAG query
```

### **3. Store Channel in Telemetry**

**Add to logs:**
```python
# Insert into llm_telemetry
await db.execute("""
    INSERT INTO llm_telemetry (
        tenant_id,
        route,
        channel,  -- NEW FIELD
        rag_topk,
        ...
    )
    VALUES ($1, '/ask', $2, $3, ...)
""", tenant_id, channel, effective_topk)
```

---

## 📋 **Implementation Checklist**

### **Runtime API Changes:**

1. ✅ **Detect Channel** (1 hour)
   - Check `X-Widget-Key` header
   - Set `channel = "widget"` if present
   - Set `channel = "admin-ui"` otherwise

2. ✅ **Read Channel Settings** (2 hours)
   - Read `WIDGET.RAG_TOPK` from tenant settings
   - Read `UI_CHAT.RAG_TOPK` from tenant settings
   - Apply channel-specific `topk` value

3. ✅ **Store in Telemetry** (1 hour)
   - Add `channel` field to `llm_telemetry` table (nullable for backward compatibility)
   - Insert channel value in logs

4. ✅ **Backward Compatibility** (1 hour)
   - If `channel` is NULL, default to "admin-ui" (legacy behavior)
   - If channel settings not found, use tenant default `RAG_TOPK`

**Total Effort:** ~1 day

---

## 🔧 **Database Schema Change**

### **Add Channel Column:**

```sql
-- Add channel column (nullable for backward compatibility)
ALTER TABLE llm_telemetry 
ADD COLUMN channel TEXT;

-- Create index for analytics queries
CREATE INDEX llm_tel_channel_ts ON llm_telemetry (channel, ts DESC);

-- Optional: Backfill existing records
UPDATE llm_telemetry 
SET channel = 'admin-ui' 
WHERE channel IS NULL;
```

---

## 📊 **Request Flow**

### **Widget Request:**
```
Widget → Admin UI Proxy → Runtime API
Headers:
  X-Widget-Key: wid_xxx
  X-Tenant-Slug: tenant-slug

Runtime detects:
  channel = "widget"
  topk = WIDGET.RAG_TOPK (default: 5)
```

### **UI Chat Request:**
```
Admin UI → Admin UI Proxy → Runtime API
Headers:
  X-Tenant-Id: <uuid>
  Cookie: session=xxx

Runtime detects:
  channel = "admin-ui"
  topk = UI_CHAT.RAG_TOPK (default: 8)
```

---

## ✅ **Summary**

**Runtime API needs:**
1. ✅ Detect channel from `X-Widget-Key` header
2. ✅ Read channel-specific settings (`WIDGET.RAG_TOPK` vs `UI_CHAT.RAG_TOPK`)
3. ✅ Apply channel-specific `topk` value
4. ✅ Store `channel` in telemetry for analytics

**Detection is simple:** Widget has `X-Widget-Key` header, UI chat doesn't.

**Effort:** ~1 day (detection + settings + telemetry)

---

**Last Updated:** 2025-11-22


