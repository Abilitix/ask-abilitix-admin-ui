'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { LegacyInboxList } from './LegacyInboxList';
import { LegacyInboxStatsCard } from './LegacyInboxStatsCard';
import { toast } from 'sonner';
import { CheckCircle2, XCircle, Loader2, Plus, RefreshCw } from 'lucide-react';
import { ManualFAQCreationModal } from './ManualFAQCreationModal';
import { SMEReviewRequestModal } from './SMEReviewRequestModal';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { AssignableMember } from './types';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';

export type LegacyInboxItem = {
  id: string;
  question: string;
  answer: string;
  created_at: string;
  has_pii?: boolean;
  pii_fields?: string[];
  status: 'pending' | 'approved' | 'rejected' | 'needs_review';
  source_type?: 'auto' | 'manual' | 'admin_review' | 'chat_review' | 'widget_review' | null;
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
  canManageFlags?: boolean;
  flags?: {
    enableFaqCreation?: boolean;
    allowEmptyCitations?: boolean;
  };
  onUpdateFlag?: (key: 'enableFaqCreation' | 'allowEmptyCitations', value: boolean) => void;
  updatingKey?: string | null;
  tenantId?: string;
  tenantSlug?: string;
  userRole?: string;
};

export function LegacyInboxPageClient({ 
  disabled, 
  enableFaqCreation = false, 
  allowEmptyCitations = false,
  canManageFlags = false,
  flags,
  onUpdateFlag,
  updatingKey,
  tenantId,
  tenantSlug,
  userRole,
}: LegacyInboxPageClientProps) {
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
  const [sourceFilter, setSourceFilter] = useState<'all' | 'widget_review' | 'chat_review' | 'auto' | 'manual' | 'admin_review'>('all');
  const [timeFilter, setTimeFilter] = useState<'all' | '24h' | '7d' | '30d' | '90d'>('all');
  // Confirmation dialog state
  const [confirmationDialog, setConfirmationDialog] = useState<{
    open: boolean;
    title: string;
    message: string;
    variant: 'default' | 'destructive' | 'warning';
    onConfirm: () => void;
  }>({
    open: false,
    title: '',
    message: '',
    variant: 'default',
    onConfirm: () => {},
  });

  const fetchItems = useCallback(async () => {
    if (disabled) return;
    try {
      setLoading(true);
      setError(null);

      // Check for ref parameter in URL (for email links)
      const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
      const refId = searchParams?.get('ref');
      
      if (refId) {
        console.log('[LegacyInbox] Ref parameter found in URL:', refId);
      }
      
      // Build query parameters - use backend filter when "Assigned to Me" is active
      const pendingParams = new URLSearchParams({ status: 'pending' });
      const needsReviewParams = new URLSearchParams({ status: 'needs_review' });
      
      if (assignedToMeOnly) {
        pendingParams.set('assigned_to_me', 'true');
        needsReviewParams.set('assigned_to_me', 'true');
      }

      // Fetch both pending and needs_review items (backend now supports both)
      const pendingUrl = `/api/admin/inbox?${pendingParams.toString()}`;
      const needsReviewUrl = `/api/admin/inbox?${needsReviewParams.toString()}`;
      
      // If ref is present, also fetch that specific item
      const refUrl = refId ? `/api/admin/inbox?ref=${encodeURIComponent(refId)}` : null;
      
      // Debug logging for assigned_to_me filter (ALWAYS log when filter is active)
      if (assignedToMeOnly) {
        console.log('[LegacyInbox] Fetching with assigned_to_me filter:', {
          currentUserId,
          hasCurrentUserId: !!currentUserId,
          assignedToMeOnly,
          pendingUrl,
          needsReviewUrl,
          refUrl,
          pendingParams: pendingParams.toString(),
          needsReviewParams: needsReviewParams.toString(),
        });
      }
      
      // CRITICAL: Use credentials: 'include' for session-based auth (required for assigned_to_me filter)
      const fetchPromises: Promise<Response>[] = [
        fetch(pendingUrl, {
          credentials: 'include',
          cache: 'no-store',
        }),
        fetch(needsReviewUrl, {
          credentials: 'include',
          cache: 'no-store',
        }),
      ];
      
      // Add ref fetch if present
      if (refUrl) {
        fetchPromises.push(
          fetch(refUrl, {
            credentials: 'include',
            cache: 'no-store',
          })
        );
      }
      
      const responses = await Promise.all(fetchPromises);
      const [pendingResponse, needsReviewResponse] = responses;
      const refResponse = refUrl ? responses[2] : undefined;

      // Enhanced error handling with response body logging
      if (!pendingResponse.ok) {
        const pendingErrorText = await pendingResponse.text().catch(() => '');
        const pendingErrorData = pendingErrorText ? (() => {
          try { return JSON.parse(pendingErrorText); } catch { return null; }
        })() : null;
        
        console.error('[LegacyInbox] Pending items fetch failed:', {
          status: pendingResponse.status,
          statusText: pendingResponse.statusText,
          url: pendingUrl,
          errorData: pendingErrorData,
          errorText: pendingErrorText.substring(0, 500),
        });
        
        const errorMsg = pendingErrorData?.details || pendingErrorData?.error || pendingErrorText || 
          `Failed to fetch pending items: ${pendingResponse.status}`;
        throw new Error(errorMsg);
      }
      
      if (!needsReviewResponse.ok) {
        const needsReviewErrorText = await needsReviewResponse.text().catch(() => '');
        const needsReviewErrorData = needsReviewErrorText ? (() => {
          try { return JSON.parse(needsReviewErrorText); } catch { return null; }
        })() : null;
        
        console.error('[LegacyInbox] Needs review items fetch failed:', {
          status: needsReviewResponse.status,
          statusText: needsReviewResponse.statusText,
          url: needsReviewUrl,
          errorData: needsReviewErrorData,
          errorText: needsReviewErrorText.substring(0, 500),
        });
        
        const errorMsg = needsReviewErrorData?.details || needsReviewErrorData?.error || needsReviewErrorText || 
          `Failed to fetch needs_review items: ${needsReviewResponse.status}`;
        throw new Error(errorMsg);
      }
      
      // Handle ref response errors gracefully (ref is optional)
      if (refResponse && !refResponse.ok) {
        console.warn('[LegacyInbox] Ref item fetch failed (non-critical):', {
          status: refResponse.status,
          statusText: refResponse.statusText,
          url: refUrl,
        });
        // Don't throw - ref is optional, continue with regular items
      }

      const pendingText = await pendingResponse.text();
      const needsReviewText = await needsReviewResponse.text();
      const refText = refResponse ? await refResponse.text() : null;

      let pendingData: any = null;
      let needsReviewData: any = null;
      let refData: any = null;

      if (pendingText) {
        try {
          pendingData = JSON.parse(pendingText);
        } catch (parseErr) {
          throw new Error('Failed to parse pending items response');
        }
      }

      if (needsReviewText) {
        try {
          needsReviewData = JSON.parse(needsReviewText);
        } catch (parseErr) {
          throw new Error('Failed to parse needs_review items response');
        }
      }

      if (refText && refText.trim()) {
        try {
          refData = JSON.parse(refText);
        } catch (parseErr) {
          console.warn('[LegacyInbox] Failed to parse ref items response:', parseErr);
          // Don't throw - ref is optional
        }
      }

      if (pendingData?.error) {
        throw new Error(pendingData.details || pendingData.error);
      }
      if (needsReviewData?.error) {
        throw new Error(needsReviewData.details || needsReviewData.error);
      }
      if (refData?.error) {
        console.warn('[LegacyInbox] Ref fetch returned error:', refData.details || refData.error);
        // Don't throw - ref is optional
      }

      // Merge items from both statuses
      const pendingItems = Array.isArray(pendingData?.items) ? pendingData.items : [];
      const needsReviewItems = Array.isArray(needsReviewData?.items) ? needsReviewData.items : [];
      const refItems = Array.isArray(refData?.items) ? refData.items : [];
      
      if (refId) {
        console.log('[LegacyInbox] Ref parameter processing:', {
          refId,
          refItemsCount: refItems.length,
          refItem: refItems[0] ? {
            id: refItems[0].id || refItems[0].ref_id,
            source_type: refItems[0].source_type,
            status: refItems[0].status,
            question: refItems[0].question?.substring(0, 50),
          } : null,
          pendingItemsCount: pendingItems.length,
          needsReviewItemsCount: needsReviewItems.length,
        });
      }
      
      // Merge all items (ref items will be deduplicated later)
      // IMPORTANT: Include ref items even if they're not in pending/needs_review status
      const rawItems = [...pendingItems, ...needsReviewItems, ...refItems];
      
      // Debug logging for assigned_to_me filter (ALWAYS log when filter is active)
      if (assignedToMeOnly) {
        console.log('[LegacyInbox] Received items from backend:', {
          currentUserId,
          pendingCount: pendingItems.length,
          needsReviewCount: needsReviewItems.length,
          totalRawCount: rawItems.length,
          pendingResponseStatus: pendingResponse.status,
          needsReviewResponseStatus: needsReviewResponse.status,
          pendingUrl,
          needsReviewUrl,
          pendingDataKeys: pendingData ? Object.keys(pendingData) : [],
          needsReviewDataKeys: needsReviewData ? Object.keys(needsReviewData) : [],
          pendingDataFull: pendingData, // Full response for debugging
          needsReviewDataFull: needsReviewData, // Full response for debugging
          sampleItem: rawItems[0] ? {
            id: rawItems[0].id || rawItems[0].ref_id,
            status: rawItems[0].status,
            assigned_to: rawItems[0].assigned_to,
            assigned_to_type: typeof rawItems[0].assigned_to,
            assigned_to_is_array: Array.isArray(rawItems[0].assigned_to),
            assigned_to_length: Array.isArray(rawItems[0].assigned_to) ? rawItems[0].assigned_to.length : 0,
          } : null,
          allItemsAssignedTo: rawItems.map((item: any) => ({
            id: item.id || item.ref_id,
            status: item.status,
            assigned_to: item.assigned_to,
            assigned_to_type: typeof item.assigned_to,
            assigned_to_is_array: Array.isArray(item.assigned_to),
            assigned_to_length: Array.isArray(item.assigned_to) ? item.assigned_to.length : 0,
          })),
        });
        
        // Additional check: Log if no items found
        if (rawItems.length === 0) {
          console.warn('[LegacyInbox] No items returned with assigned_to_me filter:', {
            currentUserId,
            pendingParams: pendingParams.toString(),
            needsReviewParams: needsReviewParams.toString(),
            pendingData,
            needsReviewData,
          });
        }
      }
      
      // Filter to only show pending and needs_review items (exclude approved/rejected)
      // BUT: Always include ref item if it exists, regardless of status
      const activeItems = rawItems.filter((item: any) => {
        const status = item.status || 'pending';
        const itemId = item.id || item.ref_id;
        // Always include the ref item, even if it's in a different status
        if (refId && itemId === refId) {
          return true;
        }
        return status === 'pending' || status === 'needs_review';
      });
      
      // Remove duplicates by id
      const uniqueItems = activeItems.filter((item: any, index: number, self: any[]) => {
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

      // Debug: Log items with chat_review source_type
      const chatReviewItems = normalizedItems.filter(item => item.source_type === 'chat_review' || item.source_type === 'widget_review');
      if (chatReviewItems.length > 0) {
        console.log('[LegacyInbox] Found chat/widget review items after normalization:', {
          count: chatReviewItems.length,
          items: chatReviewItems.map(item => ({
            id: item.id,
            source_type: item.source_type,
            question: item.question.substring(0, 50),
          })),
        });
      } else {
        console.log('[LegacyInbox] No chat/widget review items found. All items:', normalizedItems.map(item => ({
          id: item.id,
          source_type: item.source_type,
          status: item.status,
        })));
      }

      setItems(normalizedItems);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load inbox items';
      setError(errorMessage);
      
      // Enhanced error handling for assigned_to_me filter
      if (assignedToMeOnly && err instanceof Error) {
        if (errorMessage.includes('400') || errorMessage.includes('Bad Request')) {
          toast.error('Session authentication required for "Assigned to Me" filter. Please refresh the page.');
        }
      }
      
      toast.error(`Failed to load inbox: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  }, [disabled, assignedToMeOnly]);

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
        // Handle 403 Forbidden (ownership check failed)
        if (response.status === 403) {
          const forbiddenMessage = data.detail?.error?.message || data.error?.message || data.details || 
            'Only assignees or admins can modify assigned items';
          toast.error(`Permission denied: ${forbiddenMessage}`);
          throw new Error(forbiddenMessage);
        }
        
        // Handle 409 Conflict (duplicate FAQ exists)
        if (response.status === 409) {
          const errorCode = data.detail?.error?.code || data.error?.code;
          const qaPairId = data.detail?.error?.qa_pair_id || data.qa_pair_id;
          
          if (errorCode === 'duplicate_faq_exists' || errorCode === 'duplicate_inbox_item') {
            const duplicateMessage = data.detail?.error?.message || data.error?.message || data.details ||
              'This question already exists as an approved FAQ.';
            toast.error(duplicateMessage);
            throw new Error(duplicateMessage);
          }
          
          // Generic 409 conflict
          const conflictMessage = data.detail?.error?.message || data.error?.message || data.details ||
            'This item conflicts with an existing item.';
          toast.error(conflictMessage);
          throw new Error(conflictMessage);
        }
        
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
          // Handle 403 Forbidden (ownership check failed)
          if (response.status === 403) {
            const forbiddenMessage = data.detail?.error?.message || data.error?.message || data.details || 
              'Only assignees or admins can modify assigned items';
            toast.error(`Permission denied: ${forbiddenMessage}`);
            throw new Error(forbiddenMessage);
          }
          
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
      
      // Fetch only the updated item instead of refreshing entire list
      try {
        const detailResponse = await fetch(`/api/admin/inbox/${encodeURIComponent(id)}`, {
          method: 'GET',
          credentials: 'include',
          cache: 'no-store',
        });

        if (detailResponse.ok) {
          const detailData = await detailResponse.json();
          if (detailData && !detailData.error) {
            // Normalize the item using the same logic as fetchItems
            const item = detailData;
            const normalized: LegacyInboxItem = {
              id: item.id || item.ref_id || id,
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

            // Update only this item in state
            setItems((prev) =>
              prev.map((existingItem) =>
                existingItem.id === id ? normalized : existingItem
              )
            );
          }
        }
      } catch (detailErr) {
        // If single item fetch fails, fall back to full refresh
        console.warn('[attach-citations] Failed to fetch updated item, falling back to full refresh:', detailErr);
        await fetchItems();
      }
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
        // Handle 403 Forbidden (ownership check failed)
        if (response.status === 403) {
          const forbiddenMessage = data.detail?.error?.message || data.error?.message || data.details || 
            'Only assignees or admins can modify assigned items';
          toast.error(`Permission denied: ${forbiddenMessage}`);
          throw new Error(forbiddenMessage);
        }
        
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

    setConfirmationDialog({
      open: true,
      title: 'Bulk Approve Items',
      message: `Are you sure you want to bulk approve ${ids.length} inbox item(s)? This action will promote these items to FAQs.`,
      variant: 'default',
      onConfirm: async () => {
        setConfirmationDialog((prev) => ({ ...prev, open: false }));

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
            // Partial failure: remove only successful items, keep failed ones
            const failedIds = new Set(result.errors.map((e: any) => e.id || e.item_id).filter(Boolean));
            const successfulIds = ids.filter(id => !failedIds.has(id));
            
            // Optimistically remove successful items
            setItems((prev) => prev.filter((item) => !successfulIds.includes(item.id)));
            
            toast.error(
              `Bulk approve completed with errors for ${result.errors.length} of ${ids.length} item(s).`
            );
            console.error('Bulk approve errors:', result.errors);
          } else {
            // All successful: optimistically remove all items
            setItems((prev) => prev.filter((item) => !ids.includes(item.id)));
            toast.success(`Successfully bulk approved ${ids.length} item(s).`);
          }

          clearSelection();
          // No fetchItems() needed - optimistic update handles it
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : 'Failed to bulk approve items';
          toast.error(errorMessage);
          console.error('Bulk approve error:', err);
        } finally {
          setBulkActionLoading(false);
        }
      },
    });
  }, [selectedIds, clearSelection, fetchItems]);

  // Bulk reject handler
  const handleBulkReject = useCallback(async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;

    setConfirmationDialog({
      open: true,
      title: 'Bulk Reject Items',
      message: `Are you sure you want to bulk reject ${ids.length} inbox item(s)? This action cannot be undone.`,
      variant: 'destructive',
      onConfirm: async () => {
        setConfirmationDialog((prev) => ({ ...prev, open: false }));

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
            // Partial failure: remove only successful items, keep failed ones
            const failedIds = new Set(result.errors.map((e: any) => e.id || e.item_id).filter(Boolean));
            const successfulIds = ids.filter(id => !failedIds.has(id));
            
            // Optimistically remove successful items
            setItems((prev) => prev.filter((item) => !successfulIds.includes(item.id)));
            
            toast.error(
              `Bulk reject completed with errors for ${result.errors.length} of ${ids.length} item(s).`
            );
            console.error('Bulk reject errors:', result.errors);
          } else {
            // All successful: optimistically remove all items
            setItems((prev) => prev.filter((item) => !ids.includes(item.id)));
            toast.success(`Successfully bulk rejected ${ids.length} item(s).`);
          }

          clearSelection();
          // No fetchItems() needed - optimistic update handles it
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : 'Failed to bulk reject items';
          toast.error(errorMessage);
          console.error('Bulk reject error:', err);
        } finally {
          setBulkActionLoading(false);
        }
      },
    });
  }, [selectedIds, clearSelection, fetchItems]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  // Handle ref parameter from URL (for email links) - scroll to specific item
  useEffect(() => {
    if (typeof window === 'undefined' || items.length === 0) return;
    
    const searchParams = new URLSearchParams(window.location.search);
    const refId = searchParams.get('ref');
    
    if (!refId) {
      console.log('[LegacyInbox] No ref parameter in URL for scrolling');
      return;
    }
    
    console.log('[LegacyInbox] Attempting to scroll to ref item:', {
      refId,
      itemsCount: items.length,
      itemIds: items.map(item => item.id),
      refItemExists: items.some(item => item.id === refId),
      currentUrl: window.location.href,
    });
    
    // Retry logic: try multiple times with increasing delays
    let attempt = 0;
    const maxAttempts = 5;
    const attemptDelay = 300;
    
    const tryScroll = () => {
      attempt++;
      // Try multiple selectors
      const element = document.querySelector(`[data-item-id="${refId}"]`) 
        || document.querySelector(`#inbox-item-${refId}`)
        || document.getElementById(`inbox-item-${refId}`);
      
      if (element) {
        console.log('[LegacyInbox] Found ref item element, scrolling and highlighting...', {
          attempt,
          element,
          elementId: element.id,
          elementClasses: element.className,
        });
        
        // Scroll to element
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        // Add more prominent highlight
        const htmlElement = element as HTMLElement;
        htmlElement.style.backgroundColor = '#dbeafe';
        htmlElement.style.border = '4px solid #3b82f6';
        htmlElement.style.borderRadius = '8px';
        htmlElement.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)';
        htmlElement.style.transition = 'all 0.3s ease';
        
        // Pulse animation
        let pulseCount = 0;
        const pulseInterval = setInterval(() => {
          pulseCount++;
          if (pulseCount > 3) {
            clearInterval(pulseInterval);
            setTimeout(() => {
              htmlElement.style.backgroundColor = '';
              htmlElement.style.border = '';
              htmlElement.style.borderRadius = '';
              htmlElement.style.boxShadow = '';
            }, 2000);
          } else {
            htmlElement.style.transform = pulseCount % 2 === 0 ? 'scale(1.02)' : 'scale(1)';
          }
        }, 500);
      } else if (attempt < maxAttempts) {
        console.log(`[LegacyInbox] Ref item element not found, retrying (attempt ${attempt}/${maxAttempts})...`);
        setTimeout(tryScroll, attemptDelay);
      } else {
        console.error('[LegacyInbox] Ref item element not found after all attempts:', {
          refId,
          selectors: [
            `[data-item-id="${refId}"]`,
            `#inbox-item-${refId}`,
            `inbox-item-${refId}`,
          ],
          allDataItemIds: Array.from(document.querySelectorAll('[data-item-id]')).map(el => el.getAttribute('data-item-id')),
          allInboxItemIds: Array.from(document.querySelectorAll('[id^="inbox-item-"]')).map(el => el.id),
          itemsInState: items.map(item => item.id),
        });
      }
    };
    
    // Start trying after a short delay to allow DOM to render
    const initialTimer = setTimeout(tryScroll, 500);
    
    return () => {
      clearTimeout(initialTimer);
    };
  }, [items]);

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
          // Debug logging for user ID (always log when fetching)
          console.log('[LegacyInbox] Current user ID fetched:', {
            id,
            hasId: !!id,
            idType: typeof id,
            fullData: data,
          });
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

  // Client-side filtering: source and time filters
  // Note: "Assigned to Me" is handled by backend via assigned_to_me query parameter
  const filteredItems = useMemo(() => {
    let filtered = items;

    // Source filter
    if (sourceFilter !== 'all') {
      filtered = filtered.filter(item => item.source_type === sourceFilter);
    }

    // Time filter
    if (timeFilter !== 'all') {
      const now = new Date();
      let cutoffDate: Date;
      
      switch (timeFilter) {
        case '24h':
          cutoffDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          break;
        case '7d':
          cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case '90d':
          cutoffDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
        default:
          cutoffDate = new Date(0); // Beginning of time
      }
      
      filtered = filtered.filter(item => {
        const itemDate = new Date(item.created_at);
        return itemDate >= cutoffDate;
      });
    }

    return filtered;
  }, [items, sourceFilter, timeFilter]);

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
      // State already updated optimistically above - no need for full refresh
    },
    [selectedItemForReview, fetchItems]
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <LegacyInboxStatsCard itemCount={filteredItems.length} refreshSignal={refreshSignal} />
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

      {/* Filter Bar - Always Visible */}
      <div className="flex items-center justify-between gap-4 px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-lg">
        <div className="flex items-center gap-4 flex-wrap">
          {/* Source Filter */}
          <div className="flex items-center gap-2">
            <label htmlFor="source-filter" className="text-xs font-medium text-slate-600 whitespace-nowrap">
              Source:
            </label>
            <Select
              id="source-filter"
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value as typeof sourceFilter)}
              className="h-8 min-w-[140px] text-sm"
            >
              <option value="all">All</option>
              <option value="widget_review">Widget Reviews</option>
              <option value="chat_review">Internal Chat</option>
              <option value="auto">FAQ Generated</option>
              <option value="manual">Manual</option>
              <option value="admin_review">Admin Review</option>
            </Select>
          </div>

          {/* Time Filter */}
          <div className="flex items-center gap-2">
            <label htmlFor="time-filter" className="text-xs font-medium text-slate-600 whitespace-nowrap">
              Time:
            </label>
            <Select
              id="time-filter"
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value as typeof timeFilter)}
              className="h-8 min-w-[120px] text-sm"
            >
              <option value="all">All time</option>
              <option value="24h">Last 24 hours</option>
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
            </Select>
          </div>

          {/* Assigned to Me Filter */}
          <label className="flex items-center gap-2 text-sm font-medium text-slate-700 cursor-pointer hover:text-slate-900 transition-colors">
            <input
              type="checkbox"
              className={`h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all ${
                assignedToMeOnly ? 'ring-2 ring-blue-500 ring-offset-1' : ''
              }`}
              checked={assignedToMeOnly}
              onChange={() => setAssignedToMeOnly((prev) => !prev)}
            />
            <span className={assignedToMeOnly ? 'font-semibold text-blue-700' : 'text-slate-600'}>
              Assigned to me
            </span>
          </label>
          
          {/* Clear Filters Button */}
          {(sourceFilter !== 'all' || timeFilter !== 'all' || assignedToMeOnly) && (
            <Button
              onClick={() => {
                setSourceFilter('all');
                setTimeFilter('all');
                setAssignedToMeOnly(false);
              }}
              variant="outline"
              size="sm"
              className="h-7 px-3 text-xs font-medium border-slate-300 text-slate-700 hover:bg-slate-100 hover:border-slate-400"
            >
              Clear all filters
            </Button>
          )}
        </div>
        <Button
          onClick={fetchItems}
          variant="ghost"
          size="sm"
          className="h-7 px-3 text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          title="Refresh inbox"
        >
          <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
          Refresh
        </Button>
      </div>

      {/* Toggle Bar - Clean, Subtle Design */}
      {canManageFlags && onUpdateFlag && flags && (
        <div className="flex items-center gap-6 px-4 py-2.5 bg-white border border-slate-200 rounded-lg">
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Options</span>
          <div className="flex items-center gap-6">
            {/* Enable FAQ Creation Toggle */}
            <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer group">
              <div className="relative">
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={flags.enableFaqCreation === true}
                  onChange={(e) => {
                    if (onUpdateFlag) {
                      onUpdateFlag('enableFaqCreation' as any, e.target.checked);
                    }
                  }}
                  disabled={updatingKey === 'enableFaqCreation'}
                />
                <div
                  className={`w-10 h-5 rounded-full transition-colors duration-200 ${
                    flags.enableFaqCreation
                      ? 'bg-blue-600'
                      : 'bg-slate-300'
                  } ${updatingKey === 'enableFaqCreation' ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <div
                    className={`w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform duration-200 ${
                      flags.enableFaqCreation ? 'translate-x-5' : 'translate-x-0.5'
                    } mt-0.5`}
                  />
                </div>
              </div>
              <span className={`text-sm ${updatingKey === 'enableFaqCreation' ? 'text-slate-400' : 'text-slate-700'}`}>
                Enable FAQ creation
              </span>
            </label>

            {/* Allow Empty Citations Toggle - Only show if it can be enabled */}
            {flags.allowEmptyCitations !== undefined && (
              <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer group">
                <div className="relative">
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={flags.allowEmptyCitations === true}
                    onChange={(e) => {
                      if (onUpdateFlag) {
                        onUpdateFlag('allowEmptyCitations' as any, e.target.checked);
                      }
                    }}
                    disabled={updatingKey === 'allowEmptyCitations'}
                  />
                  <div
                    className={`w-10 h-5 rounded-full transition-colors duration-200 ${
                      flags.allowEmptyCitations
                        ? 'bg-blue-600'
                        : 'bg-slate-300'
                    } ${updatingKey === 'allowEmptyCitations' ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    <div
                      className={`w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform duration-200 ${
                        flags.allowEmptyCitations ? 'translate-x-5' : 'translate-x-0.5'
                      } mt-0.5`}
                    />
                  </div>
                </div>
                <span className={`text-sm ${updatingKey === 'allowEmptyCitations' ? 'text-slate-400' : 'text-slate-700'}`}>
                  Allow empty citations
                </span>
              </label>
            )}
          </div>
        </div>
      )}

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
        currentUserId={currentUserId}
        userRole={userRole}
      />

      {/* Manual FAQ Creation Modal */}
      <ManualFAQCreationModal
        open={manualFaqModalOpen}
        onClose={() => setManualFaqModalOpen(false)}
        onSuccess={async (inboxId) => {
          if (inboxId) {
            // Fetch only the newly created item instead of refreshing entire list
            try {
              const detailResponse = await fetch(`/api/admin/inbox/${encodeURIComponent(inboxId)}`, {
                method: 'GET',
                credentials: 'include',
                cache: 'no-store',
              });
              const detailData = await detailResponse.json().catch(() => null);

              if (detailResponse.ok && detailData) {
                // Normalize the item using the same logic as fetchItems
                const item = detailData;
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

                // Add the new item to the list (prepend to show at top)
                setItems((prev) => {
                  // Check if item already exists (avoid duplicates)
                  if (prev.some((existing) => existing.id === normalized.id)) {
                    return prev;
                  }
                  return [normalized, ...prev];
                });
              } else {
                // Fallback to full refresh if single item fetch fails
                await fetchItems();
              }
            } catch (detailErr) {
              // If single item fetch fails, fall back to full refresh
              console.warn('[manual-faq] Failed to fetch new item, falling back to full refresh:', detailErr);
              await fetchItems();
            }
          } else {
            // No inbox_id returned, fallback to full refresh
            await fetchItems();
          }
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

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        open={confirmationDialog.open}
        onClose={() => setConfirmationDialog((prev) => ({ ...prev, open: false }))}
        onConfirm={confirmationDialog.onConfirm}
        title={confirmationDialog.title}
        message={confirmationDialog.message}
        variant={confirmationDialog.variant}
        loading={bulkActionLoading}
        confirmText={confirmationDialog.variant === 'destructive' ? 'Reject' : 'Approve'}
      />
    </div>
  );
}



