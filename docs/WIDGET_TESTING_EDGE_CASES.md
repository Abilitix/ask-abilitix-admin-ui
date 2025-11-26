# Widget Testing - Edge Cases

## Date
2025-11-22

## Overview
Comprehensive edge case testing plan for widget functionality including localStorage, formatting, session isolation, and UI/UX.

---

## 1. localStorage Persistence Edge Cases

### Test 1.1: Multiple Page Refreshes
**Steps:**
1. Send 5 messages
2. Refresh page (F5)
3. Refresh again (F5)
4. Refresh 3 more times

**Expected:** Messages persist across all refreshes

### Test 1.2: Browser Tab Isolation
**Steps:**
1. Open widget in Tab 1, send 3 messages
2. Open same page in Tab 2 (new tab)
3. Check messages in Tab 2

**Expected:** Tab 2 has separate session (different sessionId), no messages from Tab 1

### Test 1.3: Incognito/Private Mode
**Steps:**
1. Open widget in incognito/private window
2. Send messages
3. Refresh page

**Expected:** Messages persist (if localStorage allowed), or gracefully fails

### Test 1.4: localStorage Quota Exceeded
**Steps:**
1. Send very long messages (100+ messages with long text)
2. Try to save

**Expected:** Graceful error handling, widget still works

### Test 1.5: localStorage Disabled
**Steps:**
1. Disable localStorage in browser settings
2. Send messages
3. Refresh page

**Expected:** Widget works, messages don't persist (graceful degradation)

---

## 2. Session Isolation Edge Cases

### Test 2.1: Multiple Users Same Browser
**Steps:**
1. User A: Open widget, send messages
2. User B: Open widget in different tab (same tenant)
3. Check both conversations

**Expected:** Each has separate sessionId, isolated conversations

### Test 2.2: Same User Multiple Tabs
**Steps:**
1. Open widget in Tab 1, send messages
2. Open widget in Tab 2 (same page)
3. Send different messages in Tab 2

**Expected:** Each tab has separate session, independent conversations

### Test 2.3: SessionId Persistence
**Steps:**
1. Send messages
2. Note the sessionId in localStorage
3. Refresh page
4. Check sessionId

**Expected:** Same sessionId reused, messages restored

### Test 2.4: Clear localStorage
**Steps:**
1. Send messages
2. Clear browser localStorage
3. Refresh page

**Expected:** New sessionId generated, no old messages

---

## 3. Rich Text Formatting Edge Cases

### Test 3.1: Markdown Links
**Test Cases:**
- `[text](https://example.com)` → Clickable link
- `[text with spaces](http://test.com)` → Clickable link
- `[text](www.example.com)` → Auto-adds https://
- `[text](invalid-url)` → Still creates link (browser handles)

**Expected:** All create clickable links

### Test 3.2: Plain URL Detection
**Test Cases:**
- `Visit https://example.com` → URL clickable
- `Check www.example.com` → Auto-adds https://
- `http://example.com/path?query=1` → Full URL clickable
- `Email: user@example.com` → Should NOT be linked (not URL)

**Expected:** URLs detected and linked correctly

### Test 3.3: Code Blocks
**Test Cases:**
- Single line: ` ```console.log('test')``` `
- Multi-line:
  ```
  ```javascript
  function test() {
    return true;
  }
  ```
  ```
- Empty code block: ` ``` ``` `
- Code block with markdown: ` ```**bold**``` ` → Should preserve code

**Expected:** All render as code blocks

### Test 3.4: Inline Code
**Test Cases:**
- `` `code` `` → Inline code
- `` `code with spaces` `` → Inline code
- `` `code`in text`` → Only `code` is formatted
- `` `code` and `more code` `` → Both formatted

**Expected:** Inline code properly formatted

### Test 3.5: Headers
**Test Cases:**
- `# Header 1` → Large header
- `## Header 2` → Medium header
- `### Header 3` → Small header
- `#### Header 4` → Smallest header
- `### Header with **bold**` → Header with bold text

**Expected:** Headers properly styled

### Test 3.6: Mixed Formatting
**Test Cases:**
- `**Bold** and [link](url) and ``code```
- Bullet with link: `- Item with [link](url)`
- Header with code: `### Header with ``code```
- Code block with URLs: ` ```https://example.com``` ` → Should NOT link

**Expected:** All formatting works together

### Test 3.7: Special Characters
**Test Cases:**
- HTML: `<script>alert('xss')</script>` → Escaped (security)
- URLs with special chars: `https://example.com/path?q=test&id=1`
- Code with special chars: `` `code<script>` `` → Escaped
- Emoji: `😀 Test message` → Should display

**Expected:** Special characters handled safely

### Test 3.8: Very Long Messages
**Test Cases:**
- 10,000 character message
- Message with 100 bullet points
- Message with 50 links
- Message with mixed formatting

**Expected:** Renders correctly, scrollable, no performance issues

---

## 4. UI/UX Edge Cases

### Test 4.1: Long Text Without Spaces
**Steps:**
1. Send: `ThisIsAVeryLongWordWithoutAnySpacesThatShouldWrapProperlyInTheWidget`

**Expected:** Text wraps, doesn't break layout

### Test 4.2: Many Messages
**Steps:**
1. Send 50+ messages
2. Scroll to top
3. Scroll to bottom

**Expected:** Smooth scrolling, all messages visible

### Test 4.3: Rapid Message Sending
**Steps:**
1. Send 10 messages quickly (click send rapidly)
2. Wait for all responses

**Expected:** All messages processed, no duplicates, correct order

### Test 4.4: Widget on Small Screen
**Steps:**
1. Resize browser to mobile size (375px width)
2. Open widget
3. Send messages

**Expected:** Widget responsive, readable, usable

### Test 4.5: Widget Position
**Steps:**
1. Test `data-position="bottom-right"`
2. Test `data-position="bottom-left"`

**Expected:** Widget appears in correct position

### Test 4.6: Multiple Widgets on Same Page
**Steps:**
1. Add widget script twice
2. Check behavior

**Expected:** Only one widget instance (or handles gracefully)

---

## 5. Error Handling Edge Cases

### Test 5.1: API Error (500)
**Steps:**
1. Mock API to return 500 error
2. Send message

**Expected:** Error message displayed, widget still functional

### Test 5.2: Network Timeout
**Steps:**
1. Disconnect network
2. Send message
3. Reconnect network

**Expected:** Error message, can retry

### Test 5.3: Invalid Widget Key
**Steps:**
1. Use invalid widget key
2. Send message

**Expected:** 401/403 error, clear error message

### Test 5.4: CORS Error
**Steps:**
1. Test from file:// protocol
2. Send message

**Expected:** Clear error message with instructions

### Test 5.5: Malformed API Response
**Steps:**
1. Mock API to return invalid JSON
2. Send message

**Expected:** Error handling, widget doesn't crash

---

## 6. Data Edge Cases

### Test 6.1: Empty Messages
**Steps:**
1. Try to send empty message
2. Try to send only spaces

**Expected:** Prevented or handled gracefully

### Test 6.2: Unicode/Emoji
**Steps:**
1. Send: `Hello 世界 🌍 Test`
2. Send: `Message with émojis 🎉🚀`

**Expected:** Displays correctly

### Test 6.3: SQL Injection Attempt
**Steps:**
1. Send: `'; DROP TABLE users; --`

**Expected:** Escaped, displayed as text (security)

### Test 6.4: XSS Attempt
**Steps:**
1. Send: `<img src=x onerror=alert(1)>`
2. Send: `javascript:alert('xss')`

**Expected:** Escaped, not executed (security)

---

## 7. Performance Edge Cases

### Test 7.1: Large Response
**Steps:**
1. Get response with 5000+ words
2. Check rendering time

**Expected:** Renders quickly (< 1 second)

### Test 7.2: Many Stored Messages
**Steps:**
1. Send 100 messages
2. Refresh page
3. Check load time

**Expected:** Loads quickly (< 500ms)

### Test 7.3: Rapid Opening/Closing
**Steps:**
1. Open widget
2. Close widget
3. Repeat 20 times quickly

**Expected:** No lag, smooth animations

---

## 8. Browser Compatibility

### Test 8.1: Chrome
**Steps:**
1. Test all features in Chrome

**Expected:** All features work

### Test 8.2: Firefox
**Steps:**
1. Test all features in Firefox

**Expected:** All features work

### Test 8.3: Safari
**Steps:**
1. Test all features in Safari

**Expected:** All features work

### Test 8.4: Edge
**Steps:**
1. Test all features in Edge

**Expected:** All features work

### Test 8.5: Mobile Browsers
**Steps:**
1. Test on iOS Safari
2. Test on Chrome Mobile

**Expected:** Responsive, touch-friendly

---

## 9. Integration Edge Cases

### Test 9.1: Widget on Different Websites
**Steps:**
1. Embed widget on different domain
2. Test functionality

**Expected:** Works correctly, CORS handled

### Test 9.2: Widget with Custom Colors
**Steps:**
1. Test with `data-theme-primary="#ff0000"`
2. Test with `data-theme-accent="#00ff00"`

**Expected:** Colors applied correctly

### Test 9.3: Widget with Custom Messages
**Steps:**
1. Test with custom `data-title`
2. Test with custom `data-welcome-message`

**Expected:** Custom text displayed

---

## 10. Regression Tests

### Test 10.1: Basic Functionality
**Steps:**
1. Open widget
2. Send message
3. Receive response
4. Close widget

**Expected:** All basic features work

### Test 10.2: Message Persistence
**Steps:**
1. Send messages
2. Refresh
3. Messages restored

**Expected:** Persistence works

### Test 10.3: Formatting
**Steps:**
1. Send message with links, code, headers
2. Check formatting

**Expected:** All formatting works

---

## Priority Testing Order

### High Priority (Test First)
1. ✅ localStorage persistence (Test 1.1, 1.2)
2. ✅ Session isolation (Test 2.1, 2.2)
3. ✅ Markdown links (Test 3.1)
4. ✅ Code blocks (Test 3.3)
5. ✅ Security (Test 6.3, 6.4)

### Medium Priority
6. Headers (Test 3.5)
7. Mixed formatting (Test 3.6)
8. Error handling (Test 5.1, 5.2)
9. Long messages (Test 3.8)

### Low Priority (Nice to Have)
10. Browser compatibility (Test 8.x)
11. Performance (Test 7.x)
12. Edge cases (Test 4.x, 6.x)

---

## Test Results Template

```
Test Case: [Name]
Status: ✅ Pass / ❌ Fail / ⚠️ Partial
Notes: [Any issues found]
Screenshot: [If applicable]
```

---

## Quick Test Checklist

- [ ] Messages persist after refresh
- [ ] Different tabs have separate sessions
- [ ] Markdown links are clickable
- [ ] Code blocks render correctly
- [ ] Headers are styled properly
- [ ] Bullet points formatted correctly
- [ ] Long messages wrap properly
- [ ] Error messages display correctly
- [ ] Widget responsive on mobile
- [ ] Special characters handled safely

---

## Notes

- Test on preview environment first
- Test on production after preview passes
- Document any issues found
- Test with real API responses (not just mock data)


