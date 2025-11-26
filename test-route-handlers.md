# Test Route Handlers

## Step 1: Test Widget Config Route

Open browser console on preview Admin UI and run:

```javascript
fetch('/api/admin/widget/config', {
  credentials: 'include'
})
.then(r => r.json())
.then(data => {
  console.log('Widget Config:', data);
  console.log('Widget Key:', data.widget_key);
  console.log('Embed Snippet:', data.embed_snippet);
  
  // Check if key is correct
  const correctKey = 'wid_nfJBn-ee3MwaO8DkzlNBVuz6DTxX2gf6';
  const wrongKey = 'wid_nfJBn-ee3Mwa08Dkz1NBVuz6DTxX2gf6';
  
  if (data.widget_key === correctKey) {
    console.log('✅ CORRECT KEY!');
  } else if (data.widget_key === wrongKey) {
    console.log('❌ WRONG KEY (old key)');
  } else {
    console.log('❓ UNKNOWN KEY:', data.widget_key);
  }
  
  // Check embed snippet
  if (data.embed_snippet && data.embed_snippet.includes(correctKey)) {
    console.log('✅ Embed snippet contains correct key');
  } else {
    console.log('❌ Embed snippet does NOT contain correct key');
  }
})
.catch(err => console.error('Error:', err));
```

## Expected Result

- ✅ Returns 200 OK
- ✅ `widget_key` = `wid_nfJBn-ee3MwaO8DkzlNBVuz6DTxX2gf6`
- ✅ `embed_snippet` contains correct key

## Step 2: Check Admin UI Display

1. Go to: Settings → Website Widget
2. Check the embed snippet textarea
3. Verify it shows: `wid_nfJBn-ee3MwaO8DkzlNBVuz6DTxX2gf6`

## Step 3: Test Widget

1. Copy embed snippet from Admin UI
2. Open `test-widget-key-fix.html` in browser
3. Replace the script tag with the copied snippet
4. Click "Test Embed Snippet" button
5. Click "Test Widget API" button
6. Open widget and send a message


