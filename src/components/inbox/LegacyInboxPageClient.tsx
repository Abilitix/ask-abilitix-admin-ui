'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { LegacyInboxList } from './LegacyInboxList';
import { LegacyInboxStatsCard } from './LegacyInboxStatsCard';
import { toast } from 'sonner';
import { CheckCircle2, XCircle, Loader2, Plus } from 'lucide-react';
import { ManualFAQCreationModal } from './ManualFAQCreationModal';
import { SMEReviewRequestModal } from './SMEReviewRequestModal';
import { Button } from '@/components/ui/button';
import { AssignableMember } from './types';

export type LegacyInboxItem = {
  id: string;
  question: string;
  answer: string;
  created_at: string;
  has_pii?: boolean;
  pii_fields?: string[];
  status: 'pending' | 'approved' | 'rejected' | 'needs_review';
  source_type?: 'auto' | 'manual' | 'admin_review' | null;
  assignedTo?: AssignableMember[] | null;
  reason?: string | null;
  assignedAt?: string | null;
  requestedBy?: AssignableMember | null;
  suggested_citations?: Array<{
    doc_id: string;
    title?: string;
    page?: number;
    span?: { start?: number; end?: number; text?: string };
  }>;
};

type LegacyInboxPageClientProps = {
  disabled?: boolean;
  enableFaqCreation?: boolean;
  allowEmptyCitations?: boolean;
};

export function LegacyInboxPageClient({ disabled, enableFaqCreation = false, allowEmptyCitations = false }: LegacyInboxPageClientProps) {
  const [manualFaqModalOpen, setManualFaqModalOpen] = useState<boolean>(false);
  const [smeModalOpen, setSmeModalOpen] = useState<boolean>(false);
  const [selectedItemForReview, setSelectedItemForReview] = useState<LegacyInboxItem | null>(null);
  const [items, setItems] = useState<LegacyInboxItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshSignal, setRefreshSignal] = useState(0);
  const [docTitles, setDocTitles] = useState<Record<string, string>>({});
  const [docLoading, setDocLoading] = useState(false);
  const [docTitlesError, setDocTitlesError] = useState<string | null>(null);
  const docOptions = useMemo(
    () => Object.entries(docTitles).map(([id, title]) => ({ id, title })),
    [docTitles]
  );
  // Bulk selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [assignedToMeOnly, setAssignedToMeOnly] = useState(false);

  const fetchItems = useCallback(async () => {
    if (disabled) return;
    try {
      setLoading(true);
      setError(null);

      // Fetch both 'pending' and 'needs_review' items by making two API calls
      // The backend API filters by status, so we need to explicitly request both
      const [pendingResponse, needsReviewResponse] = await Promise.all([
        fetch('/api/admin/inbox?status=pending'),
        fetch('/api/admin/inbox?status=needs_review'),
      ]);

      if (!pendingResponse.ok) {
        throw new Error(`Failed to fetch pending items: ${pendingResponse.status}`);
      }
      if (!needsReviewResponse.ok) {
        throw new Error(`Failed to fetch needs_review items: ${needsReviewResponse.status}`);
      }

      const pendingData = await pendingResponse.json();
      const needsReviewData = await needsReviewResponse.json();

      if (pendingData.error) {
        throw new Error(pendingData.details || pendingData.error);
      }
      if (needsReviewData.error) {
        throw new Error(needsReviewData.details || needsReviewData.error);
      }

      // Merge items from both statuses
      const pendingItems = Array.isArray(pendingData.items) ? pendingData.items : [];
      const needsReviewItems = Array.isArray(needsReviewData.items) ? needsReviewData.items : [];
      const rawItems = [...pendingItems, ...needsReviewItems];
      
      // Remove duplicates by id (in case backend returns same item in both)
      const uniqueItems = rawItems.filter((item: any, index: number, self: any[]) => {
        const id = item.id || item.ref_id;
        return id && index === self.findIndex((i: any) => (i.id || i.ref_id) === id);
      });
      const normalizedItems: LegacyInboxItem[] = uniqueItems.map((item: any) => {
        const normalized: LegacyInboxItem = {
          id: item.id || item.ref_id || '',
          question: item.question || '',
          answer: item.answer || item.answer_draft || '',
          created_at: item.created_at || item.asked_at || '',
          has_pii: item.has_pii || false,
          pii_fields: Array.isArray(item.pii_fields) ? item.pii_fields : [],
          status: item.status || 'pending',
          source_type: item.source_type || null,
          suggested_citations: Array.isArray(item.suggested_citations) ? item.suggested_citations : [],
        };

        // Parse assigned_to
        if (item.assigned_to) {
          const assigned = Array.isArray(item.assigned_to) ? item.assigned_to : [];
          normalized.assignedTo = assigned
            .map((member: any) => {
              const id = member.id || member.user_id;
              if (!id) return null;
              return {
                id,
                email: member.email || '',
                name: member.name || null,
                role: member.role || null,
              };
            })
            .filter(Boolean);
        }

        normalized.reason = item.reason || null;
        normalized.assignedAt = item.assigned_at || null;
        if (item.requested_by) {
          const reqBy = item.requested_by;
          normalized.requestedBy = {
            id: reqBy.id || reqBy.user_id || '',
            email: reqBy.email || '',
            name: reqBy.name || null,
            role: reqBy.role || null,
          };
        }

        return normalized;
      });

      setItems(normalizedItems);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load inbox items';
      setError(errorMessage);
      toast.error(`Failed to load inbox: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  }, [disabled]);

  const handleApprove = useCallback(async (id: string, editedAnswer?: string, isFaq: boolean = true) => {
    try {
      // Find the item to check for suggested_citations
      const item = items.find((i) => i.id === id);
      
      // Use /promote endpoint for FAQ creation (requires ENABLE_REVIEW_PROMOTE=1)
      // For regular QA pairs without FAQ, use /approve endpoint (legacy)
      const endpoint = isFaq 
        ? `/api/admin/inbox/${encodeURIComponent(id)}/promote`
        : '/api/admin/inbox/approve';
      
      const body: Record<string, unknown> = {};
      
      if (isFaq) {
        // /promote endpoint: supports citations, answer, title, is_faq
        // If item has suggested_citations, omit citations (backend will use suggested_citations)
        // If no citations and allowEmptyCitations is true, send empty array
        // Otherwise, backend validation should catch missing citations
        if (item?.suggested_citations && item.suggested_citations.length > 0) {
          // Don't send citations - backend will use suggested_citations from inbox item
        } else if (allowEmptyCitations) {
          // Send empty array if empty citations are allowed
          body.citations = [];
        }
        // If no citations and not allowed, backend validation will catch this
        
        if (editedAnswer && editedAnswer.trim().length > 0) {
          body.answer = editedAnswer.trim();
        }
        body.is_faq = true;
      } else {
        // /approve endpoint: only supports id, reembed, answer (no citations, no title)
        body.id = id;
        body.reembed = true;
        if (editedAnswer && editedAnswer.trim().length > 0) {
          body.answer = editedAnswer.trim();
        }
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      let data: any = {};
      try {
        const text = await response.text();
        if (text) {
          data = JSON.parse(text);
        }
      } catch (parseErr) {
        // If response is not JSON, use status text
        console.error('[promote] Failed to parse response:', parseErr);
      }

      if (!response.ok || data.error) {
        // Parse detailed validation errors from backend
        let errorMessage = data.details || data.error || data.message || `Failed to ${isFaq ? 'promote' : 'approve'}: ${response.status} ${response.statusText}`;
        
        // Check for detailed field errors (Admin API format)
        if (data.detail?.error?.fields && Array.isArray(data.detail.error.fields)) {
          const fieldErrors = data.detail.error.fields
            .map((field: any) => {
              const fieldPath = field.field || '';
              const message = field.message || 'Invalid value';
              return `${fieldPath}: ${message}`;
            })
            .join(', ');
          
          if (fieldErrors) {
            errorMessage = `Validation errors: ${fieldErrors}`;
          }
        }
        
        console.error('[promote] API error:', {
          status: response.status,
          statusText: response.statusText,
          data,
          body,
          errorCode: data.detail?.error?.code,
          fieldErrors: data.detail?.error?.fields,
        });
        
        throw new Error(errorMessage);
      }

      toast.success(isFaq 
        ? 'Item promoted as FAQ ✓ (embeddings generated automatically)'
        : 'Item approved ✓ (embeddings generated automatically)'
      );
      setItems((prev) => prev.filter((item) => item.id !== id));
      setRefreshSignal((prev) => prev + 1);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : `Failed to ${isFaq ? 'promote' : 'approve'} item`;
      toast.error(`${isFaq ? 'Promotion' : 'Approval'} failed: ${errorMessage}`);
    }
  }, [items, allowEmptyCitations]);

  const handleAttachCitations = useCallback(async (id: string, citations: Array<{ type: string; doc_id: string; page?: number; span?: { start?: number; end?: number; text?: string } }>) => {
    try {
      const response = await fetch(`/api/admin/inbox/${encodeURIComponent(id)}/attach_source`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ citations }),
      });

      let data: any = {};
      try {
        const text = await response.text();
        if (text) {
          data = JSON.parse(text);
        }
      } catch (parseErr) {
        // If response is not JSON, use status text
        console.error('[attach-citations] Failed to parse response:', parseErr);
      }

      if (!response.ok) {
        // Parse detailed validation errors from backend
        let errorMessage = data.details || data.error || data.message || `Failed to attach citations: ${response.status} ${response.statusText}`;
        
        // Check for detailed field errors (Admin API format)
        if (data.detail?.error?.fields && Array.isArray(data.detail.error.fields)) {
          const fieldErrors = data.detail.error.fields
            .map((field: any) => {
              const fieldPath = field.field || '';
              const message = field.message || 'Invalid value';
              return `${fieldPath}: ${message}`;
            })
            .join(', ');
          
          if (fieldErrors) {
            errorMessage = `Validation errors: ${fieldErrors}`;
          }
        }
        
        console.error('[attach-citations] API error:', {
          status: response.status,
          statusText: response.statusText,
          data,
          citations,
          errorCode: data.detail?.error?.code,
          fieldErrors: data.detail?.error?.fields,
        });
        throw new Error(errorMessage);
      }

      toast.success('Citations attached ✓');
      await fetchItems(); // Refresh to get updated item
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to attach citations';
      toast.error(`Attachment failed: ${errorMessage}`);
      throw err; // Re-throw so caller can handle
    }
  }, [fetchItems]);

  const handleReject = useCallback(async (id: string) => {
    try {
      const response = await fetch('/api/admin/inbox/reject', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id }),
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        throw new Error(data.details || data.error || `Failed to reject: ${response.status}`);
      }

      toast.success('Item rejected ✓');
      setItems((prev) => prev.filter((item) => item.id !== id));
      setRefreshSignal((prev) => prev + 1);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to reject item';
      toast.error(`Rejection failed: ${errorMessage}`);
    }
  }, []);

  // Bulk selection handlers
  const handleToggleSelect = useCallback((id: string) => {
    if (bulkActionLoading) return;
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, [bulkActionLoading]);

  const handleSelectAll = useCallback(() => {
    if (bulkActionLoading) return;
    setSelectedIds((prev) => {
      const pageIds = items.map((item) => item.id);
      const allSelected = pageIds.length > 0 && pageIds.every((id) => prev.has(id));
      const next = new Set(prev);
      if (allSelected) {
        pageIds.forEach((id) => next.delete(id));
      } else {
        pageIds.forEach((id) => next.add(id));
      }
      return next;
    });
  }, [items, bulkActionLoading]);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  // Bulk approve handler
  const handleBulkApprove = useCallback(async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;

    const confirmMessage = `Are you sure you want to bulk approve ${ids.length} inbox item(s)?`;
    if (!confirm(confirmMessage)) {
      return;
    }

    setBulkActionLoading(true);
    try {
      // Default to true for bulk approve (consistent with single approve default)
      const response = await fetch('/api/admin/inbox/bulk-approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          ids,
          as_faq: true, // Default to true for bulk approve
        }),
        cache: 'no-store',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.details || `Failed to bulk approve: ${response.status}`);
      }

      const result = await response.json();

      if (result.errors && result.errors.length > 0) {
        toast.error(
          `Bulk approve completed with errors for ${result.errors.length} of ${ids.length} item(s).`
        );
        console.error('Bulk approve errors:', result.errors);
      } else {
        toast.success(`Successfully bulk approved ${ids.length} item(s).`);
      }

      clearSelection();
      await fetchItems(); // Refresh list
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to bulk approve items';
      toast.error(errorMessage);
      console.error('Bulk approve error:', err);
    } finally {
      setBulkActionLoading(false);
    }
  }, [selectedIds, clearSelection, fetchItems]);

  // Bulk reject handler
  const handleBulkReject = useCallback(async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;

    const confirmMessage = `Are you sure you want to bulk reject ${ids.length} inbox item(s)?`;
    if (!confirm(confirmMessage)) {
      return;
    }

    setBulkActionLoading(true);
    try {
      const response = await fetch('/api/admin/inbox/bulk-reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
        cache: 'no-store',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.details || `Failed to bulk reject: ${response.status}`);
      }

      const result = await response.json();

      if (result.errors && result.errors.length > 0) {
        toast.error(
          `Bulk reject completed with errors for ${result.errors.length} of ${ids.length} item(s).`
        );
        console.error('Bulk reject errors:', result.errors);
      } else {
        toast.success(`Successfully bulk rejected ${ids.length} item(s).`);
      }

      clearSelection();
      await fetchItems(); // Refresh list
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to bulk reject items';
      toast.error(errorMessage);
      console.error('Bulk reject error:', err);
    } finally {
      setBulkActionLoading(false);
    }
  }, [selectedIds, clearSelection, fetchItems]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const loadDocOptions = useCallback(async () => {
    try {
      setDocLoading(true);
      setDocTitlesError(null);
      const response = await fetch('/api/admin/docs?status=all&limit=100', {
        method: 'GET',
        cache: 'no-store',
        credentials: 'include',
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || data?.error) {
        throw new Error(
          (data && (data.details || data.error)) || 'Failed to load documents'
        );
      }
      const docsSource =
        (Array.isArray(data?.docs) && data.docs) ||
        (Array.isArray(data?.documents) && data.documents) ||
        [];

      const mapped = (Array.isArray(docsSource) ? docsSource : []).reduce(
        (acc: Record<string, string>, doc: any) => {
          if (!doc || typeof doc !== 'object') return acc;
          const id = doc.id;
          if (!id || typeof id !== 'string') return acc;
          const title =
            typeof doc.title === 'string' && doc.title.trim().length > 0
              ? doc.title.trim()
              : id;
          acc[id] = title;
          return acc;
        },
        {}
      );

      setDocTitles(mapped);
    } catch (err) {
      console.error('[LegacyInbox] Failed to load document titles:', err);
      setDocTitlesError(
        err instanceof Error ? err.message : 'Failed to load documents'
      );
    } finally {
      setDocLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDocOptions();
  }, [loadDocOptions]);

  // Fetch current user ID for "Assigned to me" filter
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const response = await fetch('/api/auth/me', {
          method: 'GET',
          cache: 'no-store',
          credentials: 'include',
        });
        const data = await response.json().catch(() => null);
        if (!active || !data) return;
        const id =
          typeof data?.user?.id === 'string'
            ? data.user.id
            : typeof data?.user_id === 'string'
              ? data.user_id
              : typeof data?.id === 'string'
                ? data.id
                : null;
        if (active) {
          setCurrentUserId(id ?? null);
        }
      } catch {
        if (active) {
          setCurrentUserId(null);
        }
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  // Filter items based on "Assigned to me" toggle
  const filteredItems = useMemo(() => {
    if (!assignedToMeOnly || !currentUserId) return items;
    return items.filter((item) => {
      if (!item.assignedTo || item.assignedTo.length === 0) return false;
      return item.assignedTo.some((member) => member.id === currentUserId);
    });
  }, [items, assignedToMeOnly, currentUserId]);

  const handleRequestReview = useCallback((item: LegacyInboxItem) => {
    setSelectedItemForReview(item);
    setSmeModalOpen(true);
  }, []);

  const handleReviewSuccess = useCallback(
    ({ assignedTo, status, reason }: { assignedTo: AssignableMember[]; status?: string; reason?: string }) => {
      if (!selectedItemForReview) return;
      // Update the item in state immediately for instant feedback
      setItems((prev) =>
        prev.map((item) =>
          item.id === selectedItemForReview.id
            ? {
                ...item,
                assignedTo,
                status: (status as any) || 'needs_review',
                reason: reason || null,
                source_type: 'admin_review' as const,
              }
            : item
        )
      );
      setSmeModalOpen(false);
      setSelectedItemForReview(null);
      // Refresh from API to ensure we have the latest data including needs_review items
      setTimeout(() => fetchItems(), 500);
    },
    [selectedItemForReview, fetchItems]
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <LegacyInboxStatsCard itemCount={items.length} refreshSignal={refreshSignal} />
        {enableFaqCreation && (
          <Button
            type="button"
            size="sm"
            onClick={() => setManualFaqModalOpen(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Create FAQ
          </Button>
        )}
      </div>

      <LegacyInboxList
        items={filteredItems}
        loading={loading}
        error={error}
        enableFaqCreation={enableFaqCreation}
        allowEmptyCitations={allowEmptyCitations}
        onApprove={handleApprove}
        onReject={handleReject}
        onAttachCitations={handleAttachCitations}
        onRefresh={fetchItems}
        docTitles={docTitles}
        docLoading={docLoading}
        docOptions={docOptions}
        docOptionsLoading={docLoading}
        docOptionsError={docTitlesError}
        onReloadDocOptions={loadDocOptions}
        onRequestReview={handleRequestReview}
        selectedIds={selectedIds}
        onToggleSelect={handleToggleSelect}
        onSelectAll={handleSelectAll}
        bulkActionLoading={bulkActionLoading}
        onBulkApprove={handleBulkApprove}
        onBulkReject={handleBulkReject}
        onClearSelection={clearSelection}
        assignedToMeOnly={assignedToMeOnly}
        onToggleAssignedToMe={() => setAssignedToMeOnly((prev) => !prev)}
      />

      {/* Manual FAQ Creation Modal */}
      <ManualFAQCreationModal
        open={manualFaqModalOpen}
        onClose={() => setManualFaqModalOpen(false)}
        onSuccess={() => {
          fetchItems();
        }}
      />

      {/* SME Review Request Modal */}
      <SMEReviewRequestModal
        open={smeModalOpen}
        inboxId={selectedItemForReview?.id || null}
        detail={
          selectedItemForReview
            ? {
                id: selectedItemForReview.id,
                question: selectedItemForReview.question,
                answerDraft: selectedItemForReview.answer,
                answerFinal: null,
                suggestedCitations: [],
                tags: [],
                topScores: null,
                docMatches: null,
                qHash: null,
                askedAt: selectedItemForReview.created_at,
                channel: null,
                dupCount: 1,
                promotedPairId: null,
                promotedAt: null,
                sourceType: selectedItemForReview.source_type || null,
                assignedTo: selectedItemForReview.assignedTo || null,
                reason: selectedItemForReview.reason || null,
                assignedAt: selectedItemForReview.assignedAt || null,
                requestedBy: selectedItemForReview.requestedBy || null,
                status: selectedItemForReview.status,
              }
            : null
        }
        onClose={() => {
          setSmeModalOpen(false);
          setSelectedItemForReview(null);
        }}
        onSuccess={handleReviewSuccess}
      />
    </div>
  );
}



