# Runtime Response Enhancement for FAQ/QA Pair Labeling

## Problem Statement

The Admin UI cannot reliably distinguish between:
1. **Fresh FAQ fast path hits** (should show "Approved FAQ")
2. **Cached answers from FAQ** (should show "Approved FAQ")
3. **Cached answers from regular QA pairs** (should show "Approved QA Pair")
4. **Regular QA pairs** (should show "Approved QA Pair")

**Root cause:** Runtime sends stale `match` data for cached answers, making it impossible to determine if the answer is from an FAQ or regular QA pair.

## Current Runtime Response Fields

```typescript
{
  answer: string;
  source: 'docs.rag' | 'qa.model' | 'model+inbox_pending' | 'db';
  source_detail?: string; // e.g., "qa_pair" or "docs"
  match?: {
    matched: boolean;        // ❌ Stale for cached answers
    source_detail?: string; // ❌ Stale for cached answers
    id: string | null;
    similarity?: number;
  };
  citations?: Array<{...}>;
  inbox_id?: string;
}
```

## Missing Data Fields (Required for Solid Solution)

### Option 1: Add `is_faq` boolean (RECOMMENDED)

**Runtime should add:**
```typescript
{
  // ... existing fields ...
  is_faq?: boolean;  // ✅ Whether this answer is from an FAQ (fresh or cached)
}
```

**Logic:**
- `is_faq: true` → Show "Approved FAQ"
- `is_faq: false` → Show "Approved QA Pair"
- `is_faq: undefined` → Fallback to current logic

**Runtime implementation:**
- For fresh FAQ hits: Set `is_faq: true` from `qa_pairs.is_faq`
- For cached answers: Set `is_faq: true` if cached answer was originally from FAQ
- For regular QA pairs: Set `is_faq: false`

### Option 2: Add `answer_type` enum (ALTERNATIVE)

**Runtime should add:**
```typescript
{
  // ... existing fields ...
  answer_type?: 'faq' | 'qa_pair' | 'docs' | 'model';
}
```

**Logic:**
- `answer_type: 'faq'` → Show "Approved FAQ"
- `answer_type: 'qa_pair'` → Show "Approved QA Pair"
- `answer_type: 'docs'` → Show "Document Search"
- `answer_type: 'model'` → No label

### Option 3: Add cache metadata (MOST DETAILED)

**Runtime should add:**
```typescript
{
  // ... existing fields ...
  from_cache?: boolean;      // Whether answer came from answer cache
  cached_as_faq?: boolean;    // If from cache, was it originally FAQ?
  is_faq?: boolean;           // Final determination: is this FAQ?
}
```

**Logic:**
- If `from_cache: true` and `cached_as_faq: true` → Show "Approved FAQ"
- If `from_cache: true` and `cached_as_faq: false` → Show "Approved QA Pair"
- If `from_cache: false` and `is_faq: true` → Show "Approved FAQ"
- If `from_cache: false` and `is_faq: false` → Show "Approved QA Pair"

## Recommended Solution: Option 1 (`is_faq` boolean)

**Why Option 1 is best:**
- ✅ Simple and clear
- ✅ Single source of truth
- ✅ Runtime determines FAQ status correctly (checks `qa_pairs.is_faq` table)
- ✅ Works for both fresh hits and cached answers
- ✅ Minimal API change

**Runtime implementation steps:**
1. When returning answer from `qa_pairs` table, check `qa_pairs.is_faq` column
2. Set `is_faq: true` if `qa_pairs.is_faq = true`
3. For cached answers, store `is_faq` in cache metadata and return it
4. For fresh FAQ hits, set `is_faq: true` from the matched FAQ record

**Admin UI changes (after runtime fix):**
```typescript
// Simple logic after runtime adds is_faq
if (data?.is_faq === true) {
  return { label: 'Approved FAQ', color: 'text-purple-700' };
}
if (source === 'db' || sourceDetail === 'qa_pair') {
  return { label: 'Approved QA Pair', color: 'text-blue-600' };
}
```

## Current Workaround

Until runtime adds `is_faq` field:
- Use `match.matched === true && match.source_detail === 'qa_pair'` to show "Approved FAQ"
- Accept occasional false positives from stale match data
- Document limitation in code comments

## Testing After Runtime Fix

1. **Fresh FAQ hit** → Should return `is_faq: true` → Shows "Approved FAQ" ✅
2. **Cached FAQ answer** → Should return `is_faq: true` → Shows "Approved FAQ" ✅
3. **Cached QA pair answer** → Should return `is_faq: false` → Shows "Approved QA Pair" ✅
4. **Regular QA pair** → Should return `is_faq: false` → Shows "Approved QA Pair" ✅

## Priority

**HIGH** - This is needed for Phase 2 "Approve as FAQ" feature to work correctly in demos and production.





