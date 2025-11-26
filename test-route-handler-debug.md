# Test Route Handler - Debug

## Issue
Admin UI preview shows key: `wid_0Ilmz6BtgFTx_A0OTlbA1Tr19OTAtsGw`
But user expected: `wid_Kl8rFQ8wJWceAtWBgiuLY2OQxn_QJc-4`

## Test Route Handler

### Step 1: Test in Browser Console

Open preview Admin UI and run in console:

```javascript
fetch('/api/admin/widget/config', { credentials: 'include' })
  .then(r => {
    console.log('Status:', r.status);
    return r.json();
  })
  .then(data => {
    console.log('Full Response:', data);
    console.log('Widget Key:', data.widget_key);
    console.log('Embed Snippet:', data.embed_snippet);
    
    // Extract key from embed snippet
    const snippetMatch = data.embed_snippet?.match(/data-widget-key="([^"]+)"/);
    if (snippetMatch) {
      console.log('Key from snippet:', snippetMatch[1]);
    }
    
    // Check if keys match
    if (data.widget_key && snippetMatch && data.widget_key === snippetMatch[1]) {
      console.log('✅ Keys match!');
    } else {
      console.log('❌ Keys do NOT match!');
    }
  })
  .catch(err => console.error('Error:', err));
```

### Step 2: Check What Admin API Returns

Test Admin API directly (if you have access):

```bash
curl -X GET "https://ask-abilitix-admin-api.onrender.com/admin/widget/config" \
  -H "Cookie: your-session-cookie"
```

### Step 3: Verify Route Handler

Check if route handler exists and is working:
- File: `src/app/api/admin/widget/config/route.ts`
- Should proxy to: `{ADMIN_API}/admin/widget/config`

## Possible Issues

### Issue 1: Route Handler Not Working
- Route handler might not be deployed yet
- Route handler might have errors
- Check browser console for 404 or 500 errors

### Issue 2: Admin API Returns Different Key
- Admin API might be returning a different key than expected
- Key might have been rotated multiple times
- Database might have a different key

### Issue 3: Caching Issue
- Browser might be caching old response
- Admin UI might be caching old config
- Hard refresh (Ctrl+Shift+R) might help

## Next Steps

1. Test route handler in browser console
2. Check what Admin API actually returns
3. Verify route handler is deployed correctly
4. Check for any errors in browser console


