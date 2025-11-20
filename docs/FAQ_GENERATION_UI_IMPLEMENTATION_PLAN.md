# FAQ Generation UI - Implementation Plan

**Date:** 2025-11-20  
**Last Updated:** 2025-11-21  
**Status:** ✅ Phase 1 Complete - Core Components Implemented  
**Priority:** High - Core Components ASAP

---

## 📊 **Current Status**

### ✅ **Phase 1: Core Components - COMPLETED**

**Implemented Files:**
- ✅ `src/lib/types/faq-generation.ts` - TypeScript types
- ✅ `src/app/admin/docs/generate-faqs/page.tsx` - Page route with permissions
- ✅ `src/components/faq-generation/FAQGenerationClient.tsx` - Main client component
- ✅ `src/components/faq-generation/JobStatusCard.tsx` - Job status display

**Features Working:**
- ✅ Document selection (active documents only)
- ✅ Generation settings (max_faqs, confidence_threshold)
- ✅ Start generation API call with async mode
- ✅ Job status polling (every 5 seconds)
- ✅ Job status card with progress, stage, and time elapsed
- ✅ Success notification with results
- ✅ Error handling for common error codes
- ✅ "Generate FAQs" button added to `/admin/docs` page

**Deployment Status:**
- ✅ Deployed to `preview` branch
- ✅ Tested and working in preview environment
- ✅ Ready for production deployment when needed

### ⏸️ **Phase 2: Enhancements - PAUSED**

**Pending Enhancements (to be implemented later):**
- ⏸️ Polling cleanup with AbortController
- ⏸️ Exponential backoff for polling intervals
- ⏸️ localStorage persistence for job monitoring
- ⏸️ Recent jobs list component
- ⏸️ Enhanced empty states
- ⏸️ Additional loading states

**Note:** Core functionality is complete and working. Phase 2 enhancements can be added incrementally as needed.

---

## 🎯 **Goal**

Build FAQ generation UI with core functionality working ASAP. Focus on getting the essential workflow working first, then add polish.

---

## 📁 **File Structure**

```
src/
├── app/
│   └── admin/
│       └── docs/
│           └── generate-faqs/
│               └── page.tsx                    # Server component (permissions)
│
├── components/
│   └── faq-generation/
│       ├── FAQGenerationClient.tsx            # Main client component
│       ├── DocumentSelector.tsx                # Document selection (reuse pattern)
│       ├── GenerationSettings.tsx              # Settings form
│       ├── JobStatusCard.tsx                   # Job status display
│       └── RecentJobsList.tsx                  # Recent jobs (Phase 2)
│
└── lib/
    └── types/
        └── faq-generation.ts                   # TypeScript types
```

---

## ⚡ **Phase 1: Core Components (ASAP - Day 1)**

### **Priority Order:**

1. **Types & Constants** (15 min)
   - Create TypeScript types for `FAQGenerationJob`
   - Define error codes and constants

2. **Page Route** (10 min)
   - Create `/admin/docs/generate-faqs/page.tsx`
   - Add permission check (`canManageDocs`)
   - Render `FAQGenerationClient`

3. **Main Client Component** (30 min)
   - Create `FAQGenerationClient.tsx`
   - Basic structure with state management
   - Document selection placeholder

4. **Document Selector** (45 min)
   - Create `DocumentSelector.tsx`
   - Reuse `DocumentManagementClient` pattern
   - Filter to `status=active` only
   - Display: Title, Status, Created date
   - Selection handler

5. **Generation Settings** (30 min)
   - Create `GenerationSettings.tsx`
   - Form with:
     - `max_faqs` input (1-50, default: 10)
     - `confidence_threshold` input (0.0-1.0, default: 0.75, step: 0.01)
   - Helper text for confidence threshold
   - Validation

6. **Start Generation API Call** (30 min)
   - Implement `handleStartGeneration` in `FAQGenerationClient`
   - POST to `/api/admin/docs/{docId}/generate-faqs?async_mode=true`
   - Handle response: `{ job_id, status, estimated_time }`
   - Error handling for 400/404/500

7. **Job Status Card** (45 min)
   - Create `JobStatusCard.tsx`
   - Display: Status badge, Progress bar, Stage indicator
   - Show time elapsed
   - Handle all states: queued, running, done, failed

8. **Basic Polling** (45 min)
   - Implement `useEffect` polling in `FAQGenerationClient`
   - Poll `/api/admin/jobs/{job_id}` every 5 seconds
   - Update job status in state
   - Stop polling when `done` or `failed`

9. **Success Notification** (20 min)
   - Show toast on completion
   - Display: total_generated, avg_confidence
   - Add "View in Inbox" button (navigate to `/admin/inbox?tag=doc_generated`)

10. **Error Handling** (30 min)
    - Handle all error codes:
      - `document_not_active`
      - `invalid_max_faqs`
      - `invalid_confidence_threshold`
      - `generation_failed`
    - Display user-friendly error messages

---

## 🔧 **Phase 2: Enhancements (Day 2)**

### **After Core Works:**

11. **Polling Cleanup** (20 min)
    - Add `AbortController` for fetch cancellation
    - Cleanup on component unmount
    - Handle navigation away

12. **Exponential Backoff** (30 min)
    - Implement smart polling intervals
    - 2s → 5s → 10s based on elapsed time
    - 15-minute timeout

13. **localStorage Persistence** (30 min)
    - Store job_id on creation
    - Resume monitoring on page load
    - Show "Resume monitoring" option

14. **Recent Jobs List** (45 min)
    - Create `RecentJobsList.tsx`
    - Display last 10 jobs from localStorage
    - Show status, document name, timestamp
    - Click to resume monitoring

15. **Empty States** (20 min)
    - No active documents message
    - "Upload a document first" with link

16. **Loading States** (20 min)
    - Document list loading
    - Form submission loading
    - Job status loading

---

## 📝 **Implementation Details**

### **1. TypeScript Types** (`src/lib/types/faq-generation.ts`)

```typescript
export type FAQGenerationJob = {
  job_id: string;
  type: 'faq_generate';
  status: 'queued' | 'running' | 'done' | 'failed';
  progress?: {
    current: number;
    total: number;
    stage: string;
    percent: number;
  };
  result?: {
    total_generated: number;
    sent_to_inbox: number;
    avg_confidence: number;
  };
  error_message: string | null;
  created_at: string;
  started_at: string | null;
  finished_at: string | null;
};

export type GenerationSettings = {
  max_faqs: number;
  confidence_threshold: number;
};

export type StoredJob = {
  jobId: string;
  docId: string;
  docTitle: string;
  createdAt: number;
};
```

### **2. Page Route** (`src/app/admin/docs/generate-faqs/page.tsx`)

```typescript
import { requireAuth, canManageDocs } from '@/lib/auth';
import { FAQGenerationClient } from '@/components/faq-generation/FAQGenerationClient';

export const dynamic = 'force-dynamic';

export default async function GenerateFAQsPage() {
  const user = await requireAuth();
  const canManage = canManageDocs(user.role);

  if (!canManage) {
    return (
      <div className="container mx-auto p-6">
        <div className="rounded-md bg-blue-50 p-4">
          <div className="text-sm text-blue-700">
            You need document management permissions to generate FAQs.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Generate FAQs</h1>
        <div className="text-sm text-slate-600">
          Signed in as {user.email} ({user.role})
        </div>
      </div>
      <FAQGenerationClient />
    </div>
  );
}
```

### **3. API Calls Pattern**

**Start Generation:**
```typescript
const response = await fetch(
  `/api/admin/docs/${docId}/generate-faqs?async_mode=true`,
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      max_faqs: settings.max_faqs,
      confidence_threshold: settings.confidence_threshold,
    }),
  }
);
```

**Poll Job Status:**
```typescript
const response = await fetch(`/api/admin/jobs/${jobId}`);
const job: FAQGenerationJob = await response.json();
```

### **4. Error Handling Pattern**

```typescript
if (!response.ok) {
  const error = await response.json();
  const errorCode = error.detail?.error || error.error;
  const errorMessage = error.detail?.message || error.message || 'Unknown error';
  
  switch (errorCode) {
    case 'document_not_active':
      toast.error('Document must be active to generate FAQs');
      break;
    case 'invalid_max_faqs':
      toast.error(`Invalid max FAQs: ${errorMessage}`);
      break;
    // ... other cases
    default:
      toast.error(`Error: ${errorMessage}`);
  }
}
```

---

## ✅ **Acceptance Criteria (Core) - ALL COMPLETE**

1. ✅ User can select an active document
2. ✅ User can configure settings (max_faqs, confidence_threshold)
3. ✅ User can start FAQ generation
4. ✅ Job status updates in real-time (polling)
5. ✅ Success notification shows results
6. ✅ User can navigate to inbox from success notification
7. ✅ Error messages display correctly

**All core acceptance criteria have been met. The FAQ generation feature is fully functional.**

---

## 🚀 **Implementation Checklist**

### ✅ **Phase 1: Core Components - COMPLETED**

- [x] Create types file (`src/lib/types/faq-generation.ts`)
- [x] Create page route (`src/app/admin/docs/generate-faqs/page.tsx`)
- [x] Create main client component (`src/components/faq-generation/FAQGenerationClient.tsx`)
- [x] Document selection (integrated in main component)
- [x] Settings form (integrated in main component)
- [x] Create job status card (`src/components/faq-generation/JobStatusCard.tsx`)
- [x] Implement start generation API call
- [x] Implement basic polling
- [x] Add success notification
- [x] Add error handling
- [x] Add "Generate FAQs" button to documents page

### ⏸️ **Phase 2: Enhancements - PAUSED**

- [ ] Polling cleanup with AbortController
- [ ] Exponential backoff for polling
- [ ] localStorage persistence
- [ ] Recent jobs list component
- [ ] Enhanced empty states
- [ ] Additional loading states

---

## 📊 **Estimated Time**

- **Phase 1 (Core):** 4-5 hours
- **Phase 2 (Enhancements):** 2-3 hours
- **Total:** 6-8 hours (1 day focused work)

---

## 🎯 **Next Steps**

1. Start with types and page route (foundation)
2. Build document selector (reuse existing patterns)
3. Add settings form (simple form)
4. Implement API calls (start generation)
5. Add job status card (display)
6. Implement polling (real-time updates)
7. Add notifications and error handling (UX)

---

## 📝 **Notes**

- **Phase 1 (Core) is complete and deployed to preview**
- **Phase 2 enhancements are paused and can be implemented incrementally as needed**
- **All core functionality is working and tested**
- **Documentation is up to date as of 2025-11-21**

---

**Status:** ✅ Phase 1 Complete - Core functionality working! Phase 2 paused for future enhancement.

