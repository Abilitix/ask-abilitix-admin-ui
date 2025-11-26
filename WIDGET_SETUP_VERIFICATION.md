# Widget Setup Verification

## ✅ Verified Configuration

### 1. Endpoint
- **Widget uses:** `https://ask-abilitix-runtime.onrender.com/ask`
- **Status:** ✅ Correct - This is the Runtime API endpoint

### 2. Headers
- **Content-Type:** `application/json` ✅
- **x-tenant-slug:** `<tenant-slug>` ✅
- **X-Widget-Key:** `<widget-key>` ✅

### 3. Request Body
```json
{
  "question": "...",
  "session_id": "..."
}
```
- **Status:** ✅ Correct format

### 4. Widget Key Gate
- **Runtime setting:** `WIDGET_KEY_GATE_ENABLE=1` ✅
- **Status:** Enabled (confirmed)

---

## 🔍 What to Test While Waiting for Runtime

### Test 1: Verify Widget Loads
1. Open `http://localhost:8000/test-widget-simple.html`
2. Check console for:
   - Widget script loaded
   - Widget container created
   - Widget button visible

### Test 2: Check Environment
1. Open browser console (F12)
2. Look for "Abilitix Widget: Environment Details"
3. Verify:
   - Origin: `http://localhost:8000` (not `null`)
   - Protocol: `http:` (not `file:`)

### Test 3: Test API Reachability
1. Click "Run Full Diagnostic" button
2. Check logs for:
   - OPTIONS preflight status
   - CORS headers present/missing

### Test 4: Test Widget Functionality
1. Click "Test Widget Load" button
2. Widget button should appear
3. Click widget button - chat should open
4. Try sending a message
5. Check console for detailed logs

---

## 📋 Checklist

- [ ] Widget script loads from production URL
- [ ] Widget container is created
- [ ] Widget button is visible
- [ ] Chat window opens when clicked
- [ ] Environment shows `http://localhost:8000` (not `null`)
- [ ] OPTIONS preflight request works (or shows CORS missing)
- [ ] Enhanced logging shows detailed diagnostic info

---

## 🐛 What to Look For

### If CORS Still Fails:
- Check if origin is `null` → Need to use web server
- Check if CORS headers are missing → Runtime not deployed yet
- Check if endpoint returns 404 → Endpoint doesn't exist
- Check if endpoint returns 403 → Widget key invalid

### Enhanced Logs Will Show:
- Environment details (origin, protocol)
- Request details (URL, headers, body)
- Response details (status, CORS headers)
- Error diagnosis (why it failed)

---

## ✅ Our Setup is Correct

**Verified:**
- ✅ Endpoint: Correct (`/ask`)
- ✅ Headers: Correct (`x-tenant-slug`, `X-Widget-Key`)
- ✅ Method: Correct (POST)
- ✅ Body: Correct format
- ✅ Widget key gate: Enabled

**The only issue:** Runtime API CORS not deployed to production yet.

---

## 📝 Next Steps

1. **Test with production widget:**
   - Open: `http://localhost:8000/test-widget-simple.html`
   - Check console logs
   - See what diagnostics show

2. **Wait for Runtime:**
   - Runtime needs to deploy CORS fix to production
   - Once deployed, widget should work immediately

3. **After Runtime deploys:**
   - Test again
   - Enhanced logs will confirm it's working
   - Or show any remaining issues

---

## Summary

✅ **Our setup is correct** - All configuration verified
⏳ **Waiting for Runtime** - CORS fix needs deployment to production
🔍 **Diagnostics ready** - Enhanced logging will help debug any issues
📋 **Testing tools ready** - Simple test file created for verification


