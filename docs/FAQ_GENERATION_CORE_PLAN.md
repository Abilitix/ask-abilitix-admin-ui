# FAQ Generation - Core Demo Plan (ASAP)

**Date:** 2025-11-20  
**Goal:** Get upload → generate → view working ASAP for demo  
**Approach:** Systems thinking - build the critical path first

---

## 🎯 **Core Demo Flow (Critical Path)**

```
1. Upload Document (already exists ✅)
   ↓
2. Navigate to Generate FAQs page
   ↓
3. Select active document
   ↓
4. Configure settings (or use defaults)
   ↓
5. Click "Generate FAQs"
   ↓
6. See job status (real-time)
   ↓
7. Job completes → Success message
   ↓
8. Navigate to inbox → See generated FAQs
```

**Everything else is enhancement (can come later)**

---

## 📦 **Phase 1: Core Demo (2-3 hours) - MUST HAVE**

### **What's Needed:**

1. **Page Route** (10 min)
   - `/admin/docs/generate-faqs/page.tsx`
   - Permission check
   - Basic layout

2. **Types** (15 min)
   - `FAQGenerationJob` type
   - `GenerationSettings` type
   - Error types

3. **Document Selector** (30 min)
   - Fetch active documents only
   - Simple list/table (reuse existing pattern)
   - Selection handler
   - **Skip:** Search, filters (not needed for demo)

4. **Settings Form** (20 min)
   - Two inputs: `max_faqs`, `confidence_threshold`
   - Defaults: 10, 0.75
   - Basic validation
   - **Skip:** Helper text, preview estimates (can add later)

5. **Start Generation** (30 min)
   - API call to `/api/admin/docs/{docId}/generate-faqs?async_mode=true`
   - Store `job_id` in state
   - Basic error handling (toast on error)
   - **Skip:** Detailed error codes (basic error message is fine)

6. **Job Status Display** (30 min)
   - Simple card showing:
     - Status badge (queued/running/done/failed)
     - Progress: "X of Y FAQs" (if available)
     - Basic spinner for running
   - **Skip:** Progress bar, time elapsed, stage details (can add later)

7. **Basic Polling** (30 min)
   - Poll every 5 seconds
   - Update job status
   - Stop when done/failed
   - **Skip:** Cleanup, AbortController, exponential backoff (simple is fine for demo)

8. **Success Notification** (15 min)
   - Toast: "✅ Generated X FAQs with Y% confidence"
   - Button: "View in Inbox" → Navigate to `/admin/inbox?tag=doc_generated`
   - **Skip:** Recent jobs, resume monitoring

9. **Basic Error Handling** (15 min)
   - Try/catch around API calls
   - Show toast on error
   - **Skip:** Specific error codes (generic message is fine for demo)

---

## 📦 **Phase 2: Essential Enhancements (1-2 hours) - SHOULD HAVE**

**After core demo works, add these for production:**

10. **Error Code Handling** (20 min)
    - Handle specific errors: `document_not_active`, `invalid_max_faqs`, etc.
    - User-friendly messages

11. **Polling Cleanup** (20 min)
    - `AbortController` for fetch cancellation
    - Cleanup on unmount
    - Handle navigation away

12. **Empty States** (15 min)
    - "No active documents" message
    - Link to upload page

13. **Loading States** (15 min)
    - Document list loading
    - Form submission loading
    - Disable button while generating

14. **Better Job Status** (30 min)
    - Progress bar (if `progress.percent` available)
    - Time elapsed
    - Stage indicator

---

## 📦 **Phase 3: Nice-to-Have (1-2 hours) - COULD HAVE**

**Can be done in parallel or later:**

15. **Recent Jobs** (45 min)
    - localStorage persistence
    - Recent jobs list
    - Resume monitoring

16. **Exponential Backoff** (30 min)
    - Smart polling intervals
    - 15-minute timeout

17. **Helper Text** (15 min)
    - Confidence threshold explanation
    - Estimated FAQ count

18. **Advanced UI** (30 min)
    - Better styling
    - Animations
    - Mobile responsiveness improvements

---

## 🏗️ **File Structure (Minimal)**

```
src/
├── app/admin/docs/generate-faqs/
│   └── page.tsx                           # Server component
│
├── components/faq-generation/
│   ├── FAQGenerationClient.tsx           # Main component (all logic here for speed)
│   └── JobStatusCard.tsx                  # Simple status display
│
└── lib/types/
    └── faq-generation.ts                 # Types only
```

**Strategy:** Keep it simple - one main component with everything for speed. Split later if needed.

---

## ⚡ **Execution Order (Optimized for Demo)**

### **Step 1: Foundation (30 min)**
- [ ] Create types file
- [ ] Create page route
- [ ] Create main client component (empty shell)

### **Step 2: Document Selection (30 min)**
- [ ] Fetch active documents API call
- [ ] Display list (simple table/cards)
- [ ] Selection handler

### **Step 3: Settings & Start (45 min)**
- [ ] Settings form (2 inputs)
- [ ] Start generation API call
- [ ] Store job_id in state
- [ ] Basic error handling

### **Step 4: Job Monitoring (45 min)**
- [ ] Job status card component
- [ ] Basic polling (5s interval)
- [ ] Update status on poll
- [ ] Stop polling on done/failed

### **Step 5: Success Flow (15 min)**
- [ ] Success toast
- [ ] Navigate to inbox link

### **Step 6: Test & Fix (30 min)**
- [ ] Test full flow
- [ ] Fix any issues
- [ ] Basic styling

**Total: ~3 hours for core demo**

---

## 🎯 **Core Component Structure**

### **FAQGenerationClient.tsx (All-in-one for speed)**

```typescript
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import type { FAQGenerationJob, GenerationSettings } from '@/lib/types/faq-generation';

export function FAQGenerationClient() {
  const router = useRouter();
  
  // State
  const [documents, setDocuments] = useState([]);
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [settings, setSettings] = useState<GenerationSettings>({
    max_faqs: 10,
    confidence_threshold: 0.75,
  });
  const [job, setJob] = useState<FAQGenerationJob | null>(null);
  const [loading, setLoading] = useState(false);
  const [polling, setPolling] = useState(false);

  // Fetch active documents
  useEffect(() => {
    // Fetch logic here
  }, []);

  // Poll job status
  useEffect(() => {
    if (!job || job.status === 'done' || job.status === 'failed') return;
    
    const interval = setInterval(async () => {
      // Poll logic here
    }, 5000);
    
    return () => clearInterval(interval);
  }, [job]);

  // Start generation
  const handleStart = async () => {
    // API call here
  };

  return (
    <div className="space-y-6">
      {/* Document Selection */}
      {/* Settings Form */}
      {/* Generate Button */}
      {/* Job Status Card */}
    </div>
  );
}
```

**Keep it simple - everything in one component for speed. Refactor later if needed.**

---

## ✅ **Core Demo Acceptance Criteria**

1. ✅ User can see list of active documents
2. ✅ User can select a document
3. ✅ User can configure settings (or use defaults)
4. ✅ User can start generation
5. ✅ Job status updates in real-time
6. ✅ Success message shows on completion
7. ✅ User can navigate to inbox to see results

**That's it. Everything else is enhancement.**

---

## 🚀 **Quick Start Commands**

```bash
# 1. Create types
touch src/lib/types/faq-generation.ts

# 2. Create page
mkdir -p src/app/admin/docs/generate-faqs
touch src/app/admin/docs/generate-faqs/page.tsx

# 3. Create components
mkdir -p src/components/faq-generation
touch src/components/faq-generation/FAQGenerationClient.tsx
touch src/components/faq-generation/JobStatusCard.tsx
```

---

## 📊 **Time Estimates**

- **Phase 1 (Core Demo):** 2-3 hours
- **Phase 2 (Essential):** 1-2 hours  
- **Phase 3 (Nice-to-have):** 1-2 hours
- **Total:** 4-7 hours (1 day focused work)

---

## 🎯 **Systems Thinking Applied**

### **Critical Path:**
1. Document selection → Settings → Generate → Monitor → Success → Inbox

### **Dependencies:**
- Document upload (already exists ✅)
- Inbox page (already exists ✅)
- API endpoints (ready ✅)

### **Parallel Work:**
- Phase 2 & 3 can be done in parallel or after demo
- Non-core features don't block demo

### **Incremental Value:**
- Each step adds value independently
- Can demo after each phase
- No big-bang integration needed

---

## ✅ **Ready to Execute**

**Start with Step 1 (Foundation) and work through sequentially.**

**Each step is independently testable and adds value.**

**Focus on getting the critical path working first, then enhance.**

---

**Status:** 🚀 Ready to code - Core demo in 2-3 hours!

