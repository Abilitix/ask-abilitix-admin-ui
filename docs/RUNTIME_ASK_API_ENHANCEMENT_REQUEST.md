# Runtime Ask API Enhancement Request

## Endpoint Being Called

**Admin UI calls:** `POST /ask` (Runtime Ask API)

**Flow:**
1. Admin UI → `POST /api/ask/stream` (Next.js API route)
2. Next.js route → `POST ${NEXT_PUBLIC_ASK_BASE}/ask` (Runtime)
3. Runtime returns response with answer, source, match data, etc.

## Current Issue

Admin UI cannot reliably distinguish between:
- **FAQ answers** (should show "Approved FAQ" label)
- **Regular QA pair answers** (should show "Approved QA Pair" label)

**Root cause:** Runtime sends stale `match` data for cached answers. When FAQ fast path misses but answer comes from cache, runtime still sends `match: { matched: true, source_detail: 'qa_pair' }` from the original FAQ hit, making it impossible to determine if the answer is actually from an FAQ.

**Example from logs:**
- Question: "Give partnership details of abilitix"
- Runtime logs: `faq.miss` (top_score: 0.753 < 0.92 threshold)
- Runtime response: `match: { matched: true, source_detail: 'qa_pair' }` ❌ (stale data)

## Requested Enhancement

### Add `is_faq` boolean field to `/ask` response

**Current response shape:**
```json
{
  "answer": "...",
  "source": "db",
  "source_detail": "qa_pair",
  "match": {
    "matched": true,
    "source_detail": "qa_pair",
    "id": "..."
  },
  "citations": []
}
```

**Requested response shape:**
```json
{
  "answer": "...",
  "source": "db",
  "source_detail": "qa_pair",
  "is_faq": true,  // ← NEW FIELD: Whether this answer is from an FAQ
  "match": {
    "matched": true,
    "source_detail": "qa_pair",
    "id": "..."
  },
  "citations": []
}
```

## Implementation Details

### Field Definition
- **Field name:** `is_faq`
- **Type:** `boolean | undefined`
- **Description:** Whether this answer is from an FAQ (either fresh FAQ hit or cached FAQ answer)

### Logic Requirements

1. **Fresh FAQ fast path hits:**
   - Check `qa_pairs.is_faq` column from matched FAQ record
   - Set `is_faq: true` if `qa_pairs.is_faq = true`
   - Set `is_faq: false` if `qa_pairs.is_faq = false`

2. **Cached answers:**
   - When storing answer in cache, also store `is_faq` value from original answer
   - When returning cached answer, include `is_faq` from cache metadata
   - This ensures cached FAQ answers return `is_faq: true` and cached QA pair answers return `is_faq: false`

3. **Regular QA pairs (non-FAQ):**
   - Set `is_faq: false`

4. **Document RAG answers:**
   - `is_faq` can be `undefined` or `false` (not applicable)

### Cache Metadata Update

When storing answers in answer cache, include:
```python
cache_data = {
    "answer": answer,
    "source": "db",
    "source_detail": "qa_pair",
    "is_faq": qa_pair.is_faq,  # ← Store is_faq in cache
    # ... other fields
}
```

When retrieving from cache, return:
```python
{
    "answer": cached_answer,
    "source": cached_data["source"],
    "source_detail": cached_data["source_detail"],
    "is_faq": cached_data.get("is_faq", False),  # ← Return is_faq from cache
    # ... other fields
}
```

## Admin UI Usage

After this enhancement, Admin UI will use:

```typescript
if (data?.is_faq === true) {
  // Show "Approved FAQ" label
} else if (source === 'db' || sourceDetail === 'qa_pair') {
  // Show "Approved QA Pair" label
}
```

## Priority

**HIGH** - Required for Phase 2 "Approve as FAQ" feature to work correctly in demos and production.

## Testing Scenarios

1. ✅ **Fresh FAQ hit** → Returns `is_faq: true` → Admin UI shows "Approved FAQ"
2. ✅ **Cached FAQ answer** → Returns `is_faq: true` → Admin UI shows "Approved FAQ"
3. ✅ **Cached QA pair answer** → Returns `is_faq: false` → Admin UI shows "Approved QA Pair"
4. ✅ **Regular QA pair** → Returns `is_faq: false` → Admin UI shows "Approved QA Pair"
5. ✅ **Document RAG** → Returns `is_faq: undefined` or `false` → Admin UI shows "Document Search"

## Backward Compatibility

- Field is optional (`is_faq?: boolean`)
- Admin UI will fallback to current logic if field is missing
- No breaking changes to existing API contract

## Questions?

If you need clarification on:
- Cache structure changes
- Database schema (`qa_pairs.is_faq` column)
- Response format
- Testing approach

Please reach out to the Admin UI team.





