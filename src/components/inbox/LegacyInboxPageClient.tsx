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
  source?: string | null;
  assignedTo?: AssignableMember[] | null;
  reason?: string | null;
  assignedAt?: string | null;
  requestedBy?: AssignableMember | null;
  metadata?: {
    user_email?: string;
    [key: string]: any;
  } | null;
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
  const isDevEnv = process.env.NODE_ENV !== 'production';
  const PAGE_LIMIT = 50;
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
  const [sourceFilter, setSourceFilter] = useState<'all' | 'widget_review' | 'chat_review' | 'faq_generated' | 'manual' | 'admin_review'>('all');
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
  const [pendingCursor, setPendingCursor] = useState<string | null>(null);
  const [needsReviewCursor, setNeedsReviewCursor] = useState<string | null>(null);
  const [loadingMoreStatus, setLoadingMoreStatus] = useState<'pending' | 'needs_review' | null>(null);
  const normalizeRawItems = useCallback(
    (rawItems: any[]): LegacyInboxItem[] => {
      return rawItems
        .map((item: any) => {
          const id = item.id || item.ref_id;
          if (!id) return null;
          if (isDevEnv) {
            console.log('[LegacyInbox] Raw item from backend:', {
              id,
              source_type: item.source_type,
              qa_pair_id: item.qa_pair_id,
              promoted_pair_id: item.promoted_pair_id,
              source: item.source,
              metadata: item.metadata,
              status: item.status,
              question: item.question?.substring(0, 40),
              allKeys: Object.keys(item || {}),
            });
          }
          const normalized: LegacyInboxItem = {
            id,
            question: item.question || '',
            answer: item.answer || item.answer_draft || '',
            created_at: item.created_at || item.asked_at || '',
            has_pii: item.has_pii || false,
            pii_fields: Array.isArray(item.pii_fields) ? item.pii_fields : [],
            status: item.status || 'pending',
            source_type: item.source_type || null,
            source: item.source || null,
            suggested_citations: Array.isArray(item.suggested_citations) ? item.suggested_citations : [],
          };

          if (item.assigned_to) {
            const assigned = Array.isArray(item.assigned_to) ? item.assigned_to : [];
            normalized.assignedTo = assigned
              .map((member: any) => {
                const memberId = member.id || member.user_id;
                if (!memberId) return null;
                return {
                  id: memberId,
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
            // Handle both object and string formats
            const reqById = typeof reqBy === 'string' 
              ? reqBy 
              : (reqBy.id || reqBy.user_id || '');
            const reqByEmail = typeof reqBy === 'object' 
              ? (reqBy.email || '') 
              : '';
            const reqByName = typeof reqBy === 'object' 
              ? (reqBy.name || null) 
              : null;
            const reqByRole = typeof reqBy === 'object' 
              ? (reqBy.role || null) 
              : null;
            
            // Debug logging in dev mode
            if (isDevEnv) {
              console.log('[LegacyInbox] requested_by normalization:', {
                raw: item.requested_by,
                normalized: {
                  id: reqById,
                  email: reqByEmail,
                  name: reqByName,
                  role: reqByRole,
                },
                metadata: item.metadata,
              });
            }
            
            normalized.requestedBy = {
              id: reqById,
              email: reqByEmail || item.metadata?.user_email || '', // Fallback to metadata.user_email
              name: reqByName,
              role: reqByRole,
            };
          } else if (item.metadata?.user_email) {
            // If no requested_by but we have metadata.user_email (widget review case)
            normalized.requestedBy = {
              id: '',
              email: item.metadata.user_email,
              name: null,
              role: null,
            };
          }
          
          // Store metadata for widget review email fallback
          if (item.metadata) {
            normalized.metadata = item.metadata;
          }

          return normalized;
        })
        .filter((item): item is LegacyInboxItem => Boolean(item));
    },
    [isDevEnv]
  );

  const fetchItems = useCallback(async () => {
    if (disabled) return;
    try {
      setLoading(true);
      setError(null);
      setPendingCursor(null);
      setNeedsReviewCursor(null);

      // Check for ref parameter in URL (for email links)
      const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
      const refId = searchParams?.get('ref');
      
      if (refId && isDevEnv) {
        console.log('[LegacyInbox] Ref parameter found in URL:', refId);
      }
      
      // Build query parameters - use backend filter when "Assigned to Me" is active
      const pendingParams = new URLSearchParams({ status: 'pending', limit: String(PAGE_LIMIT) });
      const needsReviewParams = new URLSearchParams({ status: 'needs_review', limit: String(PAGE_LIMIT) });
      
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
      if (assignedToMeOnly && isDevEnv) {
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
      setPendingCursor(
        typeof pendingData?.next_cursor === 'string'
          ? pendingData.next_cursor
          : typeof pendingData?.nextCursor === 'string'
            ? pendingData.nextCursor
            : null
      );
      setNeedsReviewCursor(
        typeof needsReviewData?.next_cursor === 'string'
          ? needsReviewData.next_cursor
          : typeof needsReviewData?.nextCursor === 'string'
            ? needsReviewData.nextCursor
            : null
      );
      
      if (refId && isDevEnv) {
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
        if (isDevEnv) {
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
        }
        
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
      const normalizedItems: LegacyInboxItem[] = normalizeRawItems(uniqueItems);

      // Debug: Log all source_type values to understand what's coming from backend
      const sourceTypeCounts = normalizedItems.reduce((acc, item) => {
        const sourceType = item.source_type || 'null';
        acc[sourceType] = (acc[sourceType] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      if (isDevEnv) {
        console.log('[LegacyInbox] Source type distribution:', {
          counts: sourceTypeCounts,
          totalItems: normalizedItems.length,
          sampleItems: normalizedItems.slice(0, 5).map(item => ({
            id: item.id,
            source_type: item.source_type,
            status: item.status,
            question: item.question.substring(0, 40),
          })),
        });
      }
      
      // Debug: Log items with chat_review source_type
      const chatReviewItems = normalizedItems.filter(item => item.source_type === 'chat_review' || item.source_type === 'widget_review');
      if (chatReviewItems.length > 0 && isDevEnv) {
        console.log('[LegacyInbox] Found chat/widget review items after normalization:', {
          count: chatReviewItems.length,
          items: chatReviewItems.map(item => ({
            id: item.id,
            source_type: item.source_type,
            question: item.question.substring(0, 50),
          })),
        });
      }
      
      // Debug: Log admin_review items specifically
      const adminReviewItems = normalizedItems.filter(item => item.source_type === 'admin_review');
      if (adminReviewItems.length > 0 && isDevEnv) {
        console.log('[LegacyInbox] Found admin_review items:', {
          count: adminReviewItems.length,
          items: adminReviewItems.map(item => ({
            id: item.id,
            source_type: item.source_type,
            status: item.status,
            question: item.question.substring(0, 50),
          })),
        });
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
  }, [disabled, assignedToMeOnly, currentUserId, normalizeRawItems]);

  const handleLoadMore = useCallback(
    async (status: 'pending' | 'needs_review') => {
      const cursor = status === 'pending' ? pendingCursor : needsReviewCursor;
      if (!cursor || loadingMoreStatus) {
        return;
      }
      setLoadingMoreStatus(status);
      try {
        const params = new URLSearchParams({
          status,
          limit: String(PAGE_LIMIT),
          cursor,
        });
        if (assignedToMeOnly) {
          params.set('assigned_to_me', 'true');
        }
        const response = await fetch(`/api/admin/inbox?${params.toString()}`, {
          method: 'GET',
          credentials: 'include',
          cache: 'no-store',
        });
        if (!response.ok) {
          const errorText = await response.text().catch(() => '');
          let details = errorText;
          try {
            const parsed = errorText ? JSON.parse(errorText) : null;
            if (parsed?.details) details = parsed.details;
            else if (parsed?.error) details = parsed.error;
          } catch {
            // ignore parse error
          }
          throw new Error(details || `Failed to load more ${status.replace('_', ' ')} items`);
        }

        const text = await response.text();
        const data = text ? (() => {
          try { return JSON.parse(text); } catch { return {}; }
        })() : {};
        if (data?.error) {
          throw new Error(data.details || data.error);
        }
        const newRawItems = Array.isArray(data?.items) ? data.items : [];
        const normalized = normalizeRawItems(newRawItems);
        setItems((prev) => {
          const existingIds = new Set(prev.map((item) => item.id));
          const deduped = normalized.filter((item) => !existingIds.has(item.id));
          return [...prev, ...deduped];
        });

        const nextCursor =
          typeof data?.next_cursor === 'string'
            ? data.next_cursor
            : typeof data?.nextCursor === 'string'
              ? data.nextCursor
              : null;

        if (status === 'pending') {
          setPendingCursor(nextCursor);
        } else {
          setNeedsReviewCursor(nextCursor);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load more items';
        toast.error(message);
      } finally {
        setLoadingMoreStatus(null);
      }
    },
    [assignedToMeOnly, pendingCursor, needsReviewCursor, loadingMoreStatus, normalizeRawItems]
  );

  const handleApprove = useCallback(async (id: string, editedAnswer?: string, isFaq: boolean = true, note?: string) => {
    try {
      // Find the item to check for suggested_citations
      const item = items.find((i) => i.id === id);
      
      // Use /promote endpoint for FAQ creation (requires ENABLE_REVIEW_PROMOTE=1)
      // For regular QA pairs without FAQ, use /approve endpoint (legacy)
      // Only use /promote if enableFaqCreation flag is enabled AND isFaq is true
      const useFaqEndpoint = enableFaqCreation && isFaq;
      const endpoint = useFaqEndpoint
        ? `/api/admin/inbox/${encodeURIComponent(id)}/promote`
        : '/api/admin/inbox/approve';
      
      const body: Record<string, unknown> = {};
      
      if (useFaqEndpoint) {
        // /promote endpoint: supports citations, answer, title, is_faq, note
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
        
        // Add note if provided
        if (note && note.trim().length > 0) {
          body.note = note.trim();
        }
      } else {
        // /approve endpoint: only supports id, reembed, answer (no citations, no title, no note)
        // Note: legacy endpoint may not support note field
        body.id = id;
        body.reembed = true;
        if (editedAnswer && editedAnswer.trim().length > 0) {
          body.answer = editedAnswer.trim();
        }
        // Note: legacy /approve endpoint may not support note, but we'll send it anyway
        // Backend will ignore if not supported
        if (note && note.trim().length > 0) {
          body.note = note.trim();
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
        let errorMessage = data.details || data.error || data.message || `Failed to ${useFaqEndpoint ? 'promote' : 'approve'}: ${response.status} ${response.statusText}`;
        
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

      // Check if this item has a requester (requested_by field exists in database)
      // Only show notification message if requested_by exists (someone explicitly requested review)
      const hasRequester = item?.requestedBy; // requestedBy comes from requested_by field in database

      // Show notification message only if requested_by exists
      if (hasRequester) {
        toast.success(useFaqEndpoint 
          ? 'Item promoted as FAQ ✓ (embeddings generated automatically). Requester will be notified via email.'
          : 'Item approved ✓ (embeddings generated automatically). Requester will be notified via email.'
        );
      } else {
        toast.success(useFaqEndpoint 
          ? 'Item promoted as FAQ ✓ (embeddings generated automatically)'
          : 'Item approved ✓ (embeddings generated automatically)'
        );
      }
      setItems((prev) => prev.filter((item) => item.id !== id));
      setRefreshSignal((prev) => prev + 1);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : `Failed to ${useFaqEndpoint ? 'promote' : 'approve'} item`;
      toast.error(`${useFaqEndpoint ? 'Promotion' : 'Approval'} failed: ${errorMessage}`);
    }
  }, [items, allowEmptyCitations, enableFaqCreation]);

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
              source: item.source || null,
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
              // Handle both object and string formats
              const reqById = typeof reqBy === 'string' 
                ? reqBy 
                : (reqBy.id || reqBy.user_id || '');
              const reqByEmail = typeof reqBy === 'object' 
                ? (reqBy.email || '') 
                : '';
              const reqByName = typeof reqBy === 'object' 
                ? (reqBy.name || null) 
                : null;
              const reqByRole = typeof reqBy === 'object' 
                ? (reqBy.role || null) 
                : null;
              
              normalized.requestedBy = {
                id: reqById,
                email: reqByEmail || item.metadata?.user_email || '', // Fallback to metadata.user_email
                name: reqByName,
                role: reqByRole,
              };
            } else if (item.metadata?.user_email) {
              // If no requested_by but we have metadata.user_email (widget review case)
              normalized.requestedBy = {
                id: '',
                email: item.metadata.user_email,
                name: null,
                role: null,
              };
            }
            
            // Store metadata for widget review email fallback
            if (item.metadata) {
              normalized.metadata = item.metadata;
            }

            // Update only this item in state
            setItems((prev) =>
              prev.map((existingItem) =>
                existingItem.id === id ? normalized : existingItem
              )
            );
            
            // Reload document titles to show names for newly attached citations
            // This ensures the citation badges show document names instead of UUIDs
            if (normalized.suggested_citations && normalized.suggested_citations.length > 0) {
              // Reload document titles to fetch names for newly attached citations
              try {
                setDocLoading(true);
                const docResponse = await fetch('/api/admin/docs?status=all&limit=100', {
                  method: 'GET',
                  cache: 'no-store',
                  credentials: 'include',
                });
                const docData = await docResponse.json().catch(() => ({}));
                if (docResponse.ok && !docData?.error) {
                  const docsSource =
                    (Array.isArray(docData?.docs) && docData.docs) ||
                    (Array.isArray(docData?.documents) && docData.documents) ||
                    [];
                  
                  const mapped = (Array.isArray(docsSource) ? docsSource : []).reduce(
                    (acc: Record<string, string>, doc: any) => {
                      if (!doc || typeof doc !== 'object') return acc;
                      const docId = doc.id;
                      if (!docId || typeof docId !== 'string') return acc;
                      const title =
                        typeof doc.title === 'string' && doc.title.trim().length > 0
                          ? doc.title.trim()
                          : docId;
                      acc[docId] = title;
                      return acc;
                    },
                    {}
                  );
                  
                  setDocTitles((prev) => ({ ...prev, ...mapped }));
                }
              } catch (docErr) {
                console.warn('[attach-citations] Failed to reload document titles:', docErr);
              } finally {
                setDocLoading(false);
              }
            }
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

  const handleReject = useCallback(async (id: string, note?: string) => {
    try {
      // Get item to check if it has a requester (admin_review, chat_review, widget_review)
      const item = items.find((i) => i.id === id);
      
      const body: Record<string, unknown> = { id };
      
      // Add note if provided
      if (note && note.trim().length > 0) {
        body.note = note.trim();
      }
      
      const response = await fetch('/api/admin/inbox/reject', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
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

      // Check if this item has a requester (requested_by field exists in database)
      // Only show notification message if requested_by exists (someone explicitly requested review)
      const hasRequester = item?.requestedBy; // requestedBy comes from requested_by field in database

      // Show notification message only if requested_by exists
      if (hasRequester) {
        toast.success('Item rejected ✓. Requester will be notified via email.');
      } else {
        toast.success('Item rejected ✓');
      }
      setItems((prev) => prev.filter((item) => item.id !== id));
      setRefreshSignal((prev) => prev + 1);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to reject item';
      toast.error(`Rejection failed: ${errorMessage}`);
    }
  }, []);

  // Chat review action: Mark as reviewed (without converting to FAQ)
  const handleMarkReviewed = useCallback(async (id: string, note?: string) => {
    try {
      // Get item to check if it's a chat review with requester
      const item = items.find((i) => i.id === id);
      const isChatReview = item?.source_type === 'chat_review';
      const isWidgetReview = item?.source_type === 'widget_review';
      
      // Check for requester email availability
      // Internal users: requestedBy has UUID → backend looks up email
      // External users: metadata.user_email (if provided)
      const hasRequesterEmail = item?.requestedBy || item?.metadata?.user_email;

      const response = await fetch(`/api/admin/inbox/${encodeURIComponent(id)}/mark-reviewed`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(note ? { note } : {}),
        credentials: 'include',
      });

      let data: any = {};
      try {
        const text = await response.text();
        if (text) {
          data = JSON.parse(text);
        }
      } catch (parseErr) {
        console.error('[mark-reviewed] Failed to parse response:', parseErr);
      }

      if (!response.ok || data.error) {
        const errorMessage = data.details || data.error?.message || data.error || `Failed to mark as reviewed: ${response.status}`;
        if (response.status === 403) {
          toast.error(`Permission denied: ${errorMessage}`);
        } else {
          toast.error(`Failed to mark as reviewed: ${errorMessage}`);
        }
        throw new Error(errorMessage);
      }

      // Show conditional notification message based on email availability
      if (isChatReview && hasRequesterEmail) {
        // Internal user - always has email (UUID lookup)
        toast.success('Item marked as reviewed ✓. Requester will be notified via email.');
      } else if (isWidgetReview && item?.metadata?.user_email) {
        // External user with email provided
        toast.success('Item marked as reviewed ✓. Requester will be notified via email.');
      } else if (isWidgetReview && !item?.metadata?.user_email) {
        // External user without email
        toast.success('Item marked as reviewed ✓. No email on file — please contact requester directly.');
      } else {
        // Fallback for other cases
        toast.success('Item marked as reviewed ✓');
      }
      setItems((prev) => prev.filter((item) => item.id !== id));
      setRefreshSignal((prev) => prev + 1);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to mark as reviewed';
      console.error('[mark-reviewed] Error:', err);
    }
  }, [items]);

  // Chat review action: Convert to FAQ
  const handleConvertToFaq = useCallback(async (id: string, editedAnswer?: string, citations?: Array<{ type: string; doc_id: string; page?: number; span?: { start?: number; end?: number; text?: string } }>) => {
    try {
      const item = items.find((i) => i.id === id);
      
      const requestBody: Record<string, unknown> = {};
      
      if (editedAnswer && editedAnswer.trim().length > 0) {
        requestBody.answer = editedAnswer.trim();
      }
      
      // If citations provided, use them; otherwise use suggested_citations if available
      if (citations && citations.length > 0) {
        requestBody.citations = citations;
      } else if (item?.suggested_citations && item.suggested_citations.length > 0) {
        // Backend will use suggested_citations from inbox item
      } else if (allowEmptyCitations === false) {
        toast.error('Citations are required to convert to FAQ');
        throw new Error('Citations are required');
      }

      const response = await fetch(`/api/admin/inbox/${encodeURIComponent(id)}/convert-to-faq`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
        credentials: 'include',
      });

      let data: any = {};
      try {
        const text = await response.text();
        if (text) {
          data = JSON.parse(text);
        }
      } catch (parseErr) {
        console.error('[convert-to-faq] Failed to parse response:', parseErr);
      }

      if (!response.ok || data.error) {
        const errorMessage = data.details || data.error?.message || data.error || `Failed to convert to FAQ: ${response.status}`;
        if (response.status === 403) {
          toast.error(`Permission denied: ${errorMessage}`);
        } else if (response.status === 409) {
          toast.error(`Conflict: ${errorMessage}`);
        } else {
          toast.error(`Failed to convert to FAQ: ${errorMessage}`);
        }
        throw new Error(errorMessage);
      }

      // Check if this is a chat review or widget review with requester email
      const isChatReview = item?.source_type === 'chat_review';
      const isWidgetReview = item?.source_type === 'widget_review';
      const hasRequesterEmail = item?.requestedBy || item?.metadata?.user_email;

      // Show conditional notification message based on email availability
      if (isChatReview && hasRequesterEmail) {
        // Internal user - always has email (UUID lookup)
        toast.success('Item converted to FAQ ✓ (embeddings generated automatically). Requester will be notified via email.');
      } else if (isWidgetReview && item?.metadata?.user_email) {
        // External user with email provided
        toast.success('Item converted to FAQ ✓ (embeddings generated automatically). Requester will be notified via email.');
      } else if (isWidgetReview && !item?.metadata?.user_email) {
        // External user without email
        toast.success('Item converted to FAQ ✓ (embeddings generated automatically). No email on file — please contact requester directly.');
      } else {
        // Fallback for other cases
        toast.success('Item converted to FAQ ✓ (embeddings generated automatically)');
      }
      setItems((prev) => prev.filter((item) => item.id !== id));
      setRefreshSignal((prev) => prev + 1);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to convert to FAQ';
      console.error('[convert-to-faq] Error:', err);
    }
  }, [items, allowEmptyCitations]);

  // Chat review action: Dismiss
  const handleDismiss = useCallback(async (id: string, reason?: string) => {
    try {
      // Get item to check if it's a chat review or widget review with requester
      const item = items.find((i) => i.id === id);
      const isChatReview = item?.source_type === 'chat_review';
      const isWidgetReview = item?.source_type === 'widget_review';
      
      // Check for requester email availability
      // Internal users: requestedBy has UUID → backend looks up email
      // External users: metadata.user_email (if provided)
      const hasRequesterEmail = item?.requestedBy || item?.metadata?.user_email;

      const response = await fetch(`/api/admin/inbox/${encodeURIComponent(id)}/dismiss`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reason ? { reason } : {}),
        credentials: 'include',
      });

      let data: any = {};
      try {
        const text = await response.text();
        if (text) {
          data = JSON.parse(text);
        }
      } catch (parseErr) {
        console.error('[dismiss] Failed to parse response:', parseErr);
      }

      if (!response.ok || data.error) {
        const errorMessage = data.details || data.error?.message || data.error || `Failed to dismiss: ${response.status}`;
        if (response.status === 403) {
          toast.error(`Permission denied: ${errorMessage}`);
        } else {
          toast.error(`Failed to dismiss: ${errorMessage}`);
        }
        throw new Error(errorMessage);
      }

      // Show conditional notification message based on email availability
      if (isChatReview && hasRequesterEmail) {
        // Internal user - always has email (UUID lookup)
        toast.success('Item dismissed ✓. Requester will be notified via email.');
      } else if (isWidgetReview && item?.metadata?.user_email) {
        // External user with email provided
        toast.success('Item dismissed ✓. Requester will be notified via email.');
      } else if (isWidgetReview && !item?.metadata?.user_email) {
        // External user without email
        toast.success('Item dismissed ✓. No email on file — please contact requester directly.');
      } else {
        // Fallback for other cases
        toast.success('Item dismissed ✓');
      }
      setItems((prev) => prev.filter((item) => item.id !== id));
      setRefreshSignal((prev) => prev + 1);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to dismiss';
      console.error('[dismiss] Error:', err);
    }
  }, [items]);

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
      if (isDevEnv) {
        console.log('[LegacyInbox] No ref parameter in URL for scrolling');
      }
      return;
    }
    
    if (isDevEnv) {
      console.log('[LegacyInbox] Attempting to scroll to ref item:', {
        refId,
        itemsCount: items.length,
        itemIds: items.map(item => item.id),
        refItemExists: items.some(item => item.id === refId),
        currentUrl: window.location.href,
      });
    }
    
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
        if (isDevEnv) {
          console.log('[LegacyInbox] Found ref item element, scrolling and highlighting...', {
            attempt,
            element,
            elementId: element.id,
            elementClasses: element.className,
          });
        }
        
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
        if (isDevEnv) {
          console.log(`[LegacyInbox] Ref item element not found, retrying (attempt ${attempt}/${maxAttempts})...`);
        }
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
          if (isDevEnv) {
            console.log('[LegacyInbox] Current user ID fetched:', {
              id,
              hasId: !!id,
              idType: typeof id,
              fullData: data,
            });
          }
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
      if (sourceFilter === 'faq_generated') {
        // FAQ Generated: source_type='auto' OR source='faq_generation'
        filtered = filtered.filter(item => 
          item.source_type === 'auto' || item.source === 'faq_generation'
        );
      } else {
        filtered = filtered.filter(item => item.source_type === sourceFilter);
      }
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
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <LegacyInboxStatsCard itemCount={filteredItems.length} refreshSignal={refreshSignal} />
        {enableFaqCreation && (
          <Button
            type="button"
            size="sm"
            onClick={() => setManualFaqModalOpen(true)}
            className="w-full sm:w-auto min-h-[44px]"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create FAQ
          </Button>
        )}
      </div>

      {/* Filter Bar - Always Visible */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-lg">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-wrap">
          {/* Source Filter */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 flex-1 sm:flex-initial">
            <label htmlFor="source-filter" className="text-xs font-medium text-slate-600 whitespace-nowrap">
              Source:
            </label>
            <Select
              id="source-filter"
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value as typeof sourceFilter)}
              className="h-10 sm:h-8 w-full sm:min-w-[140px] text-sm min-h-[44px]"
            >
              <option value="all">All</option>
              <option value="widget_review">Widget Reviews</option>
              <option value="chat_review">Internal Chat</option>
              <option value="faq_generated">FAQ Generated</option>
              <option value="manual">Manual</option>
              <option value="admin_review">Admin Review</option>
            </Select>
          </div>

          {/* Time Filter */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 flex-1 sm:flex-initial">
            <label htmlFor="time-filter" className="text-xs font-medium text-slate-600 whitespace-nowrap">
              Time:
            </label>
            <Select
              id="time-filter"
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value as typeof timeFilter)}
              className="h-10 sm:h-8 w-full sm:min-w-[120px] text-sm min-h-[44px]"
            >
              <option value="all">All time</option>
              <option value="24h">Last 24 hours</option>
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
            </Select>
          </div>

          {/* Assigned to Me Filter */}
          <label className="flex items-center gap-2 text-sm font-medium text-slate-700 cursor-pointer hover:text-slate-900 transition-colors min-h-[44px] py-1">
            <input
              type="checkbox"
              className={`h-5 w-5 rounded border-slate-300 text-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all ${
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
              className="h-10 sm:h-7 px-3 text-xs font-medium border-slate-300 text-slate-700 hover:bg-slate-100 hover:border-slate-400 w-full sm:w-auto min-h-[44px]"
            >
              Clear all filters
            </Button>
          )}
        </div>
        <Button
          onClick={fetchItems}
          variant="ghost"
          size="sm"
          className="h-10 sm:h-7 px-3 text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-100 w-full sm:w-auto min-h-[44px]"
          title="Refresh inbox"
        >
          <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
          Refresh
        </Button>
      </div>

      {/* Toggle Bar - Clean, Subtle Design */}
      {canManageFlags && onUpdateFlag && flags && (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 sm:gap-6 px-4 py-2.5 bg-white border border-slate-200 rounded-lg">
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Options</span>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 sm:gap-6">
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
        allowEmptyCitations={flags?.allowEmptyCitations ?? allowEmptyCitations}
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
        onMarkReviewed={handleMarkReviewed}
        onConvertToFaq={handleConvertToFaq}
        onDismiss={handleDismiss}
      />
      {(pendingCursor || needsReviewCursor) && (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 mt-4">
          {pendingCursor && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleLoadMore('pending')}
              disabled={loadingMoreStatus === 'pending'}
              className="w-full sm:w-auto min-h-[44px]"
            >
              {loadingMoreStatus === 'pending' ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading pending…
                </span>
              ) : (
                'Load more pending'
              )}
            </Button>
          )}
          {needsReviewCursor && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleLoadMore('needs_review')}
              disabled={loadingMoreStatus === 'needs_review'}
              className="w-full sm:w-auto min-h-[44px]"
            >
              {loadingMoreStatus === 'needs_review' ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading needs review…
                </span>
              ) : (
                'Load more needs review'
              )}
            </Button>
          )}
        </div>
      )}

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
                  // Handle both object and string formats
                  const reqById = typeof reqBy === 'string' 
                    ? reqBy 
                    : (reqBy.id || reqBy.user_id || '');
                  const reqByEmail = typeof reqBy === 'object' 
                    ? (reqBy.email || '') 
                    : '';
                  const reqByName = typeof reqBy === 'object' 
                    ? (reqBy.name || null) 
                    : null;
                  const reqByRole = typeof reqBy === 'object' 
                    ? (reqBy.role || null) 
                    : null;
                  
                  normalized.requestedBy = {
                    id: reqById,
                    email: reqByEmail || item.metadata?.user_email || '', // Fallback to metadata.user_email
                    name: reqByName,
                    role: reqByRole,
                  };
                } else if (item.metadata?.user_email) {
                  // If no requested_by but we have metadata.user_email (widget review case)
                  normalized.requestedBy = {
                    id: '',
                    email: item.metadata.user_email,
                    name: null,
                    role: null,
                  };
                }
                
                // Store metadata for widget review email fallback
                if (item.metadata) {
                  normalized.metadata = item.metadata;
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



