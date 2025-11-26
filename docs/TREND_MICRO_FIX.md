# Fix Trend Micro Blocking Localhost

## Quick Fix Options:

### **Option 1: Add Exception in Trend Micro**
1. Open Trend Micro
2. Go to Settings → Web Protection → Exceptions
3. Add: `http://localhost:3001`
4. Or add: `http://localhost:*` (all localhost ports)
5. Save and restart browser

### **Option 2: Temporarily Disable Web Protection**
1. Open Trend Micro
2. Temporarily disable Web Protection
3. Test widget
4. Re-enable after testing

### **Option 3: Use Network IP Instead**
Instead of `localhost`, use your network IP:
- Your dev server shows: `http://192.168.1.235:3001`
- Update test HTML to use: `http://192.168.1.235:3001/widget.js`

---

## Quick Test with Network IP

Update test HTML script tag to:
```html
<script src="http://192.168.1.235:3001/widget.js" ...></script>
```

This might bypass Trend Micro's localhost blocking.




