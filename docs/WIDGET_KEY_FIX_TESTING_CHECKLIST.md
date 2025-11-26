# Widget Key Fix - Testing Checklist

## Date
2025-11-22

## Deployment Status
✅ **Deployed to preview branch**
- Commit: `ef2c555`
- Files changed:
  - `src/app/api/admin/widget/config/route.ts` (new)
  - `src/app/api/admin/widget/rotate-key/route.ts` (new)
  - `docs/WIDGET_KEY_FIX_IMPLEMENTED.md` (new)

## Testing Steps

### 1. Wait for Preview Deployment
- [ ] Wait for Vercel/Render to deploy preview branch
- [ ] Verify deployment is successful (check deployment logs)

### 2. Verify Route Handlers Work

**Test 1: Widget Config Route**
```bash
# From browser console or Postman
GET https://ask-abilitix-admin-ui-git-preview-abilitix-consultings-projects.vercel.app/api/admin/widget/config
```

**Expected:**
- [ ] Returns 200 OK
- [ ] Response contains `widget_key`: `wid_nfJBn-ee3MwaO8DkzlNBVuz6DTxX2gf6`
- [ ] Response contains `embed_snippet` with correct key
- [ ] `embed_snippet` contains: `data-widget-key="wid_nfJBn-ee3MwaO8DkzlNBVuz6DTxX2gf6"`

**Test 2: Rotate Key Route**
```bash
POST https://ask-abilitix-admin-ui-git-preview-abilitix-consultings-projects.vercel.app/api/admin/widget/rotate-key
```

**Expected:**
- [ ] Returns 200 OK (when authenticated)
- [ ] Response contains new `widget_key`
- [ ] Response contains new `embed_snippet` with new key

### 3. Verify Admin UI Display

**Test 3: Widget Settings Page**
1. [ ] Open preview Admin UI: `https://ask-abilitix-admin-ui-git-preview-abilitix-consultings-projects.vercel.app`
2. [ ] Navigate to: Settings → Website Widget
3. [ ] Check embed snippet textarea

**Expected:**
- [ ] Embed snippet shows: `wid_nfJBn-ee3MwaO8DkzlNBVuz6DTxX2gf6` (correct key)
- [ ] Embed snippet does NOT show: `wid_nfJBn-ee3Mwa08Dkz1NBVuz6DTxX2gf6` (old wrong key)
- [ ] Copy snippet button works
- [ ] Copied snippet contains correct key

**Test 4: Key Comparison**
- [ ] Copy embed snippet from Admin UI
- [ ] Extract `data-widget-key` value from snippet
- [ ] Verify it matches database key: `wid_nfJBn-ee3MwaO8DkzlNBVuz6DTxX2gf6`

### 4. Test Widget End-to-End

**Test 5: Widget Functionality**
1. [ ] Create test HTML file with embed snippet from Admin UI
2. [ ] Open test file in browser
3. [ ] Click widget button
4. [ ] Send a test message

**Expected:**
- [ ] Widget loads without errors
- [ ] No 403 Forbidden error in console
- [ ] Widget sends message successfully
- [ ] Runtime API responds with answer
- [ ] Widget displays answer correctly

**Test 6: Console Check**
- [ ] Open browser DevTools → Console
- [ ] Check for errors
- [ ] Verify no CORS errors
- [ ] Verify no 403 errors
- [ ] Verify widget key is sent correctly

### 5. Test Key Rotation

**Test 7: Rotate Key Flow**
1. [ ] In Admin UI, click "Rotate Key"
2. [ ] Confirm rotation
3. [ ] Wait for success message

**Expected:**
- [ ] Embed snippet updates immediately
- [ ] New key is displayed
- [ ] New key is different from old key
- [ ] Copy snippet button shows new key

**Test 8: Widget with New Key**
1. [ ] Copy new embed snippet
2. [ ] Update test HTML file with new snippet
3. [ ] Test widget with new key

**Expected:**
- [ ] Widget works with new key
- [ ] Old key no longer works (403 error)
- [ ] New key works correctly

### 6. Verify Database Consistency

**Test 9: Database Check**
- [ ] Query database for `widget_api_key_hash` for tenant `abilitix-pilot`
- [ ] Verify hash matches the key shown in Admin UI
- [ ] Verify hash matches the key in embed snippet

## Success Criteria

✅ **All tests pass:**
- Route handlers work correctly
- Admin UI displays correct key
- Widget works end-to-end
- Key rotation works
- Database consistency maintained

## If Tests Fail

### Route Handler Issues
- Check deployment logs for errors
- Verify environment variables are set
- Check Admin API is accessible from preview

### Wrong Key Still Showing
- Clear browser cache
- Hard refresh (Ctrl+Shift+R)
- Check if Admin API is returning correct key
- Verify route handler is proxying correctly

### Widget Still Fails
- Check Runtime API logs for widget key verification
- Verify Runtime API has latest code deployed
- Check CORS headers are present
- Verify widget key hash in database matches

## Next Steps After Testing

1. ✅ All tests pass → Deploy to production
2. ❌ Tests fail → Debug and fix issues
3. ⏳ Partial success → Document findings and plan fixes

## Notes

- Preview URL: `https://ask-abilitix-admin-ui-git-preview-abilitix-consultings-projects.vercel.app`
- Expected correct key: `wid_nfJBn-ee3MwaO8DkzlNBVuz6DTxX2gf6`
- Wrong key (should NOT appear): `wid_nfJBn-ee3Mwa08Dkz1NBVuz6DTxX2gf6`


