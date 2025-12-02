# Testing Chat Review API Routes

**Date:** 2025-11-26  
**Routes to Test:**
- `POST /api/admin/inbox/{inboxId}/mark-reviewed`
- `POST /api/admin/inbox/{inboxId}/convert-to-faq`
- `POST /api/admin/inbox/{inboxId}/dismiss`

---

## Prerequisites

1. **Vercel build completed** - Wait for preview deployment to finish
2. **Valid session** - Must be logged in to preview environment
3. **Test inbox item** - Need a chat review inbox item ID (from Admin API)

---

## Test Method 1: Browser Console (Easiest)

1. **Open preview environment** and log in
2. **Open browser DevTools** (F12) → Console tab
3. **Get a chat review inbox item ID:**
   ```javascript
   // First, fetch inbox items to find a chat review item
   const response = await fetch('/api/admin/inbox?status=needs_review', {
     credentials: 'include'
   });
   const data = await response.json();
   console.log('Inbox items:', data.items);
   
   // Find a chat review item
   const chatReviewItem = data.items.find(item => 
     item.source_type === 'chat_review' || item.source_type === 'widget_review'
   );
   console.log('Chat review item:', chatReviewItem);
   const inboxId = chatReviewItem?.id;
   ```

4. **Test mark-reviewed:**
   ```javascript
   const result = await fetch(`/api/admin/inbox/${inboxId}/mark-reviewed`, {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     credentials: 'include',
     body: JSON.stringify({ note: 'Test review note' })
   });
   const data = await result.json();
   console.log('Mark reviewed result:', data);
   ```

5. **Test convert-to-faq:**
   ```javascript
   const result = await fetch(`/api/admin/inbox/${inboxId}/convert-to-faq`, {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     credentials: 'include',
     body: JSON.stringify({})
   });
   const data = await result.json();
   console.log('Convert to FAQ result:', data);
   ```

6. **Test dismiss:**
   ```javascript
   const result = await fetch(`/api/admin/inbox/${inboxId}/dismiss`, {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     credentials: 'include',
     body: JSON.stringify({ reason: 'Test dismiss reason' })
   });
   const data = await result.json();
   console.log('Dismiss result:', data);
   ```

---

## Test Method 2: Create Test Inbox Item First

If you don't have a chat review item yet:

1. **Request SME review from chat:**
   - Go to AI Assistant
   - Ask a question
   - Click "Request SME Review"
   - Fill in the form and submit
   - This creates a chat review inbox item

2. **Then test the routes** using Method 1 above

---

## Expected Results

### ✅ Success Response (200 OK):
```json
{
  "ok": true,
  "message": "Review marked as completed"
}
```

### ❌ Error Responses:

**400 Bad Request:**
```json
{
  "error": "invalid_request",
  "details": "Inbox id is required"
}
```

**401 Unauthorized:**
```json
{
  "error": "admin_proxy_error",
  "details": "Admin API returned 401"
}
```

**403 Forbidden:**
```json
{
  "error": "admin_proxy_error",
  "details": "Admin API returned 403"
}
```

**404 Not Found:**
```json
{
  "error": "admin_proxy_error",
  "details": "Admin API returned 404"
}
```

**409 Conflict:**
```json
{
  "error": "admin_proxy_error",
  "details": "Already reviewed"
}
```

---

## Test Checklist

- [ ] All 3 routes are accessible (no 404)
- [ ] Routes forward cookies correctly (no 401)
- [ ] Routes forward request body correctly
- [ ] Success responses return correct data
- [ ] Error responses return proper error format
- [ ] Empty body works for convert-to-faq
- [ ] Optional fields work (note, reason)

---

## Troubleshooting

**If you get 401 Unauthorized:**
- Make sure you're logged in
- Check that cookies are being sent (`credentials: 'include'`)

**If you get 404 Not Found:**
- Check that the inbox ID is correct
- Verify the inbox item exists in Admin API

**If you get 403 Forbidden:**
- Check that you have permission (assigned user or admin)
- Verify the inbox item is a chat review item

**If route doesn't exist:**
- Wait for Vercel build to complete
- Check that files are in correct location:
  - `src/app/api/admin/inbox/[inboxId]/mark-reviewed/route.ts`
  - `src/app/api/admin/inbox/[inboxId]/convert-to-faq/route.ts`
  - `src/app/api/admin/inbox/[inboxId]/dismiss/route.ts`











