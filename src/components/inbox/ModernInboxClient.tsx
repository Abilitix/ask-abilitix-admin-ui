'use client';

import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { InboxList } from './InboxList';
import { InboxDetailPanel } from './InboxDetailPanel';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';

const DEFAULT_LIMIT = 25;

export type CitationSpan = {
  start?: number | null;
  end?: number | null;
  text?: string | null;
};

export type Citation = {
  docId: string;
  page?: number | null;
  span?: CitationSpan | null;
};

export type CitationFieldErrors = {
  docId?: string;
  page?: string;
  spanStart?: string;
  spanEnd?: string;
  spanText?: string;
  root?: string;
};

export type PromoteConflict = {
  qaPairId: string;
};

export type PreparedCitation = {
  doc_id: string;
  page?: number;
  span?: {
    start?: number;
    end?: number;
    text?: string;
  };
};

type Filters = {
  ref: string;
  tag: string;
  qHash: string;
  docId: string;
};

export type InboxListItem = {
  id: string;
  qHash: string | null;
  askedAt: string | null;
  channel: string | null;
  tags: string[];
  dupCount: number;
  docMatches: InboxTopScore[] | null;
};

export type InboxTopScore = {
  docId: string;
  score: number;
  title?: string | null;
};

export type InboxDetail = InboxListItem & {
  question?: string | null;
  topScores: InboxTopScore[] | null;
  suggestedCitations: Citation[];
  answerDraft?: string | null;
  answerFinal?: string | null;
  promotedPairId?: string | null;
  promotedAt?: string | null;
  status?: string | null;
};

function parseOptionalNumber(value: unknown): number | null {
  if (typeof value === 'number') {
    return Number.isNaN(value) ? null : value;
  }
  if (typeof value === 'string' && value.trim().length > 0) {
    const parsed = Number(value);
    if (!Number.isNaN(parsed)) {
      return parsed;
    }
  }
  return null;
}

function normaliseCitation(raw: any): Citation | null {
  if (!raw || typeof raw !== 'object') return null;

  const docId =
    typeof raw.doc_id === 'string'
      ? raw.doc_id
      : typeof raw.docId === 'string'
        ? raw.docId
        : null;

  if (!docId) return null;

  const page = parseOptionalNumber(raw.page ?? raw.page_number ?? raw.pageIndex);

  const spanSource =
    (raw.span && typeof raw.span === 'object' ? raw.span : null) ||
    (raw.span_range && typeof raw.span_range === 'object' ? raw.span_range : null);

  let span: CitationSpan | null = null;
  if (spanSource) {
    const start = parseOptionalNumber(spanSource.start ?? spanSource.start_offset ?? spanSource.begin);
    const end = parseOptionalNumber(spanSource.end ?? spanSource.end_offset ?? spanSource.finish);
    const text = typeof spanSource.text === 'string' ? spanSource.text : null;

    if (start !== null || end !== null || (text && text.length > 0)) {
      span = {
        start,
        end,
        text,
      };
    }
  }

  return {
    docId,
    page,
    span,
  };
}

function parseTopScores(raw: any): InboxTopScore[] | null {
  if (!Array.isArray(raw)) return null;
  const scores = raw
    .map((entry: any) => {
      if (!entry || typeof entry !== 'object') return null;
      const docId = entry.doc_id;
      const score = entry.score;
      if (!docId || typeof docId !== 'string') return null;
      if (typeof score !== 'number') return null;
      return {
        docId,
        score,
        title: typeof entry.title === 'string' ? entry.title : null,
      };
    })
    .filter(Boolean) as InboxTopScore[];
  return scores.length > 0 ? scores : null;
}

function normaliseListItem(raw: any): InboxListItem | null {
  if (!raw || typeof raw !== 'object') return null;
  const idValue = raw.id ?? raw.ref_id;
  if (!idValue) return null;

  const tags = Array.isArray(raw.tags) ? raw.tags.filter((tag: unknown) => typeof tag === 'string') : [];
  const qHash =
    typeof raw.q_hash === 'string'
      ? raw.q_hash
      : typeof raw.question_hash === 'string'
        ? raw.question_hash
        : null;

  const askedAt =
    typeof raw.asked_at === 'string'
      ? raw.asked_at
      : typeof raw.created_at === 'string'
        ? raw.created_at
        : null;

  const channel = typeof raw.channel === 'string' ? raw.channel : null;

  const dupCountRaw =
    typeof raw.dup_count === 'number'
      ? raw.dup_count
      : typeof raw.duplicate_count === 'number'
        ? raw.duplicate_count
        : null;

  return {
    id: String(idValue),
    qHash,
    askedAt,
    channel,
    tags,
    dupCount: dupCountRaw && dupCountRaw >= 1 ? dupCountRaw : 1,
    docMatches: parseTopScores(raw.top_scores),
  };
}

function normaliseDetail(raw: any): InboxDetail | null {
  const base = normaliseListItem(raw);
  if (!base) return null;

  const topScores = parseTopScores(raw.top_scores) ?? base.docMatches;

  return {
    ...base,
    question: typeof raw.question === 'string' ? raw.question : null,
    topScores,
    suggestedCitations: Array.isArray(raw.suggested_citations)
      ? (raw.suggested_citations.map((citation: unknown) => normaliseCitation(citation)).filter(Boolean) as Citation[])
      : Array.isArray(raw.citations)
        ? (raw.citations.map((citation: unknown) => normaliseCitation(citation)).filter(Boolean) as Citation[])
        : [],
    answerDraft:
      typeof raw.answer_draft === 'string'
        ? raw.answer_draft
        : typeof raw.model_answer === 'string'
          ? raw.model_answer
          : null,
    answerFinal:
      typeof raw.answer_final === 'string'
        ? raw.answer_final
        : typeof raw.answer === 'string'
          ? raw.answer
          : null,
    promotedPairId:
      typeof raw.promoted_pair_id === 'string'
        ? raw.promoted_pair_id
        : typeof raw.qa_pair_id === 'string'
          ? raw.qa_pair_id
          : null,
    promotedAt:
      typeof raw.promoted_at === 'string'
        ? raw.promoted_at
        : typeof raw.published_at === 'string'
          ? raw.published_at
          : null,
    status: typeof raw.status === 'string' ? raw.status : null,
  };
}

function parseListResponse(json: any): { items: InboxListItem[]; nextCursor: string | null } | null {
  if (!json || typeof json !== 'object') return null;

  // Defensive: accept both {items:[...]} and [...] (legacy fallback)
  const maybeItems = Array.isArray(json.items)
    ? json.items
    : Array.isArray(json.data?.items)
      ? json.data.items
      : Array.isArray(json)
        ? json
        : null;
  
  // Always return a safe shape, never null items
  if (!maybeItems || !Array.isArray(maybeItems)) {
    return { items: [], nextCursor: null };
  }

  // Detect legacy payload by checking for answer/question fields without dup_count/q_hash
  const first = maybeItems[0];
  const looksLegacy =
    first &&
    typeof first === 'object' &&
    ('answer' in first || 'question' in first) &&
    !('dup_count' in first) &&
    !('q_hash' in first);

  if (looksLegacy) {
    return { items: [], nextCursor: null }; // Return empty instead of null
  }

  // Guard: ensure maybeItems is still an array before mapping
  if (!Array.isArray(maybeItems)) {
    return { items: [], nextCursor: null };
  }

  const items = maybeItems
    .map((item: unknown) => normaliseListItem(item))
    .filter((item: InboxListItem | null): item is InboxListItem => Boolean(item));

  // Always return an array, even if empty
  const nextCursor =
    typeof json.next_cursor === 'string' && json.next_cursor.length > 0
      ? json.next_cursor
      : null;

  return { items: Array.isArray(items) ? items : [], nextCursor };
}

const DEFAULT_FILTERS: Filters = {
  ref: '',
  tag: 'no_source',
  qHash: '',
  docId: '',
};

function createEmptyFieldErrors(count: number): CitationFieldErrors[] {
  return Array.from({ length: count }, () => ({}));
}

function normalizeFieldKey(field?: string): keyof CitationFieldErrors {
  switch (field) {
    case 'doc_id':
    case 'docId':
      return 'docId';
    case 'page':
      return 'page';
    case 'span.start':
    case 'span_start':
      return 'spanStart';
    case 'span.end':
    case 'span_end':
      return 'spanEnd';
    case 'span.text':
    case 'span_text':
      return 'spanText';
    default:
      return 'root';
  }
}

function parseValidationErrors(
  count: number,
  payload: any
): { rows: CitationFieldErrors[]; general?: string } {
  const rows = createEmptyFieldErrors(count);
  let general: string | undefined;

  if (payload && Array.isArray(payload.fields)) {
    for (const entry of payload.fields) {
      if (!entry || typeof entry !== 'object') continue;
      const message =
        typeof entry.message === 'string'
          ? entry.message
          : typeof entry.detail === 'string'
            ? entry.detail
            : typeof entry.error === 'string'
              ? entry.error
              : undefined;
      const index =
        typeof entry.index === 'number' && entry.index >= 0 && entry.index < count
          ? entry.index
          : null;

      if (index === null) {
        if (message) {
          general = general ? `${general}; ${message}` : message;
        }
        continue;
      }

      const key = normalizeFieldKey(entry.field);
      if (message) {
        rows[index] = {
          ...rows[index],
          [key]: message,
        };
      }
    }
  } else if (payload && typeof payload === 'object') {
    const message =
      typeof payload.details === 'string'
        ? payload.details
        : typeof payload.error === 'string'
          ? payload.error
          : typeof payload.message === 'string'
            ? payload.message
            : undefined;
    if (message) {
      general = message;
    }
  }

  return { rows, general };
}

export type ModernInboxClientProps = {
  allowActions: boolean;
  allowEmptyCitations: boolean;
  tenantId?: string;
  reviewFlagEnabled: boolean;
  hasReviewerAccess: boolean;
  enableFaqCreation: boolean;
  modeKey: string;
  onPromoteSuccess?: () => void;
  onPromoteConflict?: (qaPairId?: string) => void;
  onRefetchFlags?: () => Promise<void> | void;
  onTestAsk?: (payload: { question: string; refId?: string }) => void;
  onRegisterActions?: (actions: ModernInboxActions) => void;
};

export type ModernInboxActions = {
  applyNoSourceFilter: () => void;
  refreshList: () => void;
  getCurrentDetail: () => { id: string | null; detail: InboxDetail | null };
  refreshDetail: () => void;
};

export function ModernInboxClient({
  allowActions,
  allowEmptyCitations,
  tenantId,
  reviewFlagEnabled,
  hasReviewerAccess,
  enableFaqCreation,
  modeKey,
  onPromoteSuccess,
  onPromoteConflict,
  onRefetchFlags,
  onTestAsk,
  onRegisterActions,
}: ModernInboxClientProps) {
  const sendTelemetry = useCallback(
    (event: string, payload: Record<string, unknown>) => {
      if (typeof window === 'undefined') return;
      const gtag = (window as any).gtag;
      if (typeof gtag === 'function') {
        gtag('event', event, {
          tenant_id: tenantId ?? 'unknown',
          ...payload,
        });
      }
    },
    [tenantId]
  );
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [draftFilters, setDraftFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [items, setItems] = useState<InboxListItem[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [, setIsAvailable] = useState<boolean | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<InboxDetail | null>(null);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [detailLoading, setDetailLoading] = useState<boolean>(false);
  const [isInitialised, setIsInitialised] = useState<boolean>(false);
  const refreshTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [attachLoading, setAttachLoading] = useState<boolean>(false);
  const [promoteLoading, setPromoteLoading] = useState<boolean>(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [citationFieldErrors, setCitationFieldErrors] = useState<CitationFieldErrors[]>([]);
  const [permissionError, setPermissionError] = useState<boolean>(false);
  const [promoteConflict, setPromoteConflict] = useState<PromoteConflict | null>(null);
  const [docOptions, setDocOptions] = useState<{ id: string; title: string }[]>([]);
  const [docOptionsLoading, setDocOptionsLoading] = useState<boolean>(false);
  // Bulk selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkActionLoading, setBulkActionLoading] = useState<boolean>(false);
  const docHydrationRef = useRef<Set<string>>(new Set());
  // Create as FAQ state (shared between single and bulk approve)
  const [createAsFaq, setCreateAsFaq] = useState<boolean>(true);

  const filtersRef = useRef<Filters>(DEFAULT_FILTERS);

  useEffect(() => {
    let active = true;
    const loadDocs = async () => {
      try {
        setDocOptionsLoading(true);
        const response = await fetch('/api/admin/docs?status=active&limit=200', {
          method: 'GET',
          cache: 'no-store',
          credentials: 'include',
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(
            (data && (data.details || data.error)) || 'Failed to load documents'
          );
        }
        if (!active) return;
        const docsSource =
          (Array.isArray(data?.docs) && data.docs) ||
          (Array.isArray(data?.documents) && data.documents) ||
          [];
        const mapped = (Array.isArray(docsSource) ? docsSource : [])
          .map((doc: any) => {
            if (!doc || typeof doc !== 'object') return null;
            const id = doc.id;
            if (!id || typeof id !== 'string') return null;
            const title =
              typeof doc.title === 'string' && doc.title.trim().length > 0
                ? doc.title.trim()
                : id;
            return { id, title };
          })
          .filter(Boolean) as { id: string; title: string }[];
        setDocOptions(mapped);
      } catch (err) {
        console.error('Failed to load documents for inbox filter:', err);
      } finally {
        if (active) {
          setDocOptionsLoading(false);
        }
      }
    };

    loadDocs();
    return () => {
      active = false;
    };
  }, []);

  const resetRefreshTimer = useCallback(() => {
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
      refreshTimeoutRef.current = null;
    }
  }, []);

  const loadList = useCallback(
    async (opts: { cursor?: string | null; append?: boolean } = {}, overrideFilters?: Filters) => {
      try {
        setLoading(true);
        setError(null);

        const activeFilters = overrideFilters ?? filtersRef.current;
        const params = new URLSearchParams();
        params.set('limit', String(DEFAULT_LIMIT));

        if (opts.cursor) {
          params.set('cursor', opts.cursor);
        }

        if (activeFilters.tag) {
          params.set('tag', activeFilters.tag);
        }

        params.set('status', 'pending');

        if (activeFilters.ref) {
          params.set('ref', activeFilters.ref);
        }

        if (activeFilters.qHash) {
          params.set('q_hash', activeFilters.qHash);
        }

        const query = params.toString();
        const response = await fetch(`/api/admin/inbox${query ? `?${query}` : ''}`, {
          method: 'GET',
          credentials: 'include',
          cache: 'no-store',
        });

        const text = await response.text();
        let json: any = null;
        
        // Defensive JSON parsing - don't throw on parse error, just use empty object
        if (text && text.trim().length > 0) {
          try {
            json = JSON.parse(text);
          } catch {
            // If JSON parse fails, treat as empty response
            json = {};
          }
        }

        if (response.status === 404) {
          setIsAvailable(false);
          setItems([]);
          setNextCursor(null);
          setError(null);
          return;
        }

        if (!response.ok) {
          // Ensure items is always an array even on error
          setItems([]);
          setNextCursor(null);
          const message =
            (json && typeof json === 'object' && (json.details || json.error)) ||
            `Admin inbox request failed (${response.status})`;
          throw new Error(message);
        }

        if (json && typeof json === 'object' && json.error) {
          // Ensure items is always an array even on error
          setItems([]);
          setNextCursor(null);
          throw new Error(json.details || json.error);
        }

        // Defensive: accept both {items:[...]} and [...] (legacy fallback)
        const safeJson = json || {};
        const parsed = parseListResponse(safeJson);

        if (!parsed) {
          setIsAvailable(false);
          setItems([]);
          setNextCursor(null);
          setError(null);
          return;
        }

        // Double-check parsed.items exists and is an array
        if (!parsed || !Array.isArray(parsed.items)) {
          setIsAvailable(false);
          setItems([]);
          setNextCursor(null);
          setError(null);
          return;
        }

        setIsAvailable(true);
        setNextCursor(parsed.nextCursor || null);

        let updatedItems: InboxListItem[] = [];
        setItems((prev) => {
          const safePrev = Array.isArray(prev) ? prev : [];
          const safeItems = Array.isArray(parsed.items) ? parsed.items : [];
          if (opts.append) {
            const existingIds = new Set(safePrev.map((item) => item.id));
            const merged = [...safePrev];
            for (const item of safeItems) {
              if (!existingIds.has(item.id)) {
                merged.push(item);
                existingIds.add(item.id);
              }
            }
            updatedItems = merged;
            return merged;
          }
          updatedItems = safeItems;
          return safeItems;
        });

        setSelectedId((prev) => {
          if (!prev) return prev;
          const safeUpdatedItems = Array.isArray(updatedItems) ? updatedItems : [];
          return safeUpdatedItems.some((item) => item && item.id === prev) ? prev : null;
        });
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Failed to load inbox items';
        setError(message);
        toast.error(message);
      } finally {
        setLoading(false);
        setIsInitialised(true);
      }
    },
    []
  );

  const loadDetail = useCallback(async (id: string) => {
    try {
      setDetailLoading(true);
      setDetailError(null);
      setDetail(null);

      const response = await fetch(`/api/admin/inbox/${encodeURIComponent(id)}`, {
        method: 'GET',
        credentials: 'include',
        cache: 'no-store',
      });

      if (response.status === 404) {
        setDetailError('Not found or disabled');
        return null;
      }

      const json = await response.json().catch(() => null);

      if (!response.ok) {
        const message =
          (json && typeof json === 'object' && (json.details || json.error)) ||
          `Failed to load inbox detail (${response.status})`;
        throw new Error(message);
      }

      const normalised = normaliseDetail(json);
      if (!normalised) {
        setDetailError('Unable to parse inbox detail payload.');
        return null;
      }

      setDetail(normalised);
      const citationCount = Array.isArray(normalised.suggestedCitations)
        ? normalised.suggestedCitations.length
        : 0;
      setCitationFieldErrors(createEmptyFieldErrors(citationCount));
      setActionError(null);
      setPermissionError(false);
      setPromoteConflict(null);
      return normalised;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to load inbox detail';
      setDetailError(message);
      toast.error(message);
      return null;
    } finally {
      setDetailLoading(false);
    }
  }, []);

  const handleAttach = useCallback(
    async ({ citations }: { citations: PreparedCitation[] }) => {
      if (!selectedId) {
        return false;
      }

      const count = citations.length;
      setAttachLoading(true);
      setActionError(null);
      setPermissionError(false);
      setPromoteConflict(null);
      setCitationFieldErrors(createEmptyFieldErrors(count));

      sendTelemetry('ui.attach_source.click', {
        ref_id: selectedId,
        count,
      });

      try {
        const response = await fetch(
          `/api/admin/inbox/${encodeURIComponent(selectedId)}/attach_source`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ citations }),
            cache: 'no-store',
          }
        );

        const text = await response.text();
        let json: any = null;
        if (text) {
          try {
            json = JSON.parse(text);
          } catch {
            // ignore JSON parse error
          }
        }

        if (response.ok) {
          sendTelemetry('ui.attach_source.success', {
            ref_id: selectedId,
            count,
          });
          toast.success('Suggestions saved.');
          await loadDetail(selectedId);
          return true;
        }

        if (response.status === 401 || response.status === 403) {
          setPermissionError(true);
          const message =
            typeof json?.details === 'string'
              ? json.details
              : 'You do not have permission to update this inbox item.';
          setActionError(message);
          sendTelemetry('ui.attach_source.fail', {
            ref_id: selectedId,
            reason: 'forbidden',
            status: response.status,
          });
          return false;
        }

        if (response.status === 400) {
          const { rows, general } = parseValidationErrors(count, json);
          setCitationFieldErrors(rows);
          setActionError(
            general || 'One or more citations need attention before saving.'
          );
          sendTelemetry('ui.attach_source.fail', {
            ref_id: selectedId,
            reason: 'validation',
          });
          return false;
        }

        const message =
          (json && (json.details || json.error || json.message)) ||
          `Failed to attach citations (${response.status})`;
        setActionError(message);
        sendTelemetry('ui.attach_source.fail', {
          ref_id: selectedId,
          reason: 'server',
          status: response.status,
        });
        return false;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Failed to attach citations.';
        setActionError(message);
        sendTelemetry('ui.attach_source.fail', {
          ref_id: selectedId,
          reason: 'network',
        });
        return false;
      } finally {
        setAttachLoading(false);
      }
    },
    [selectedId, loadDetail, sendTelemetry]
  );

  const handlePromote = useCallback(
    async ({
      citations,
      answer,
      title,
      isFaq,
    }: {
      citations?: PreparedCitation[];
      answer?: string | null;
      title?: string | null;
      isFaq?: boolean;
    }) => {
      if (!selectedId) {
        return false;
      }

      // Determine endpoint and payload based on isFaq flag
      const useFaqEndpoint = isFaq === true;
      const endpoint = useFaqEndpoint
        ? `/api/admin/inbox/${encodeURIComponent(selectedId)}/promote`
        : `/api/admin/inbox/approve`;

      const count = citations?.length ?? 0;
      setPromoteLoading(true);
      setActionError(null);
      setPermissionError(false);
      setPromoteConflict(null);
      if (count > 0) {
        setCitationFieldErrors(createEmptyFieldErrors(count));
      } else {
        setCitationFieldErrors([]);
      }

      // Build payload based on endpoint
      const body: Record<string, unknown> = {};
      if (useFaqEndpoint) {
        // /promote endpoint: supports citations, answer, title, is_faq
        // If citations provided, use them. Otherwise, if detail has suggested_citations,
        // omit citations (backend will use suggested_citations). If no citations and
        // allowEmptyCitations is true, send empty array.
        if (citations && citations.length > 0) {
          body.citations = citations;
        } else if (detail?.suggestedCitations && detail.suggestedCitations.length > 0) {
          // Don't send citations - backend will use suggested_citations from inbox item
        } else if (allowEmptyCitations) {
          // Send empty array if empty citations are allowed
          body.citations = [];
        }
        // If no citations and not allowed, validation should have caught this earlier
        if (typeof answer === 'string' && answer.trim().length > 0) {
          body.answer = answer.trim();
        }
        if (typeof title === 'string' && title.trim().length > 0) {
          body.title = title.trim();
        }
        body.is_faq = true;
      } else {
        // /approve endpoint: only supports id, reembed, answer (no citations, no title)
        body.id = selectedId;
        body.reembed = true;
        if (typeof answer === 'string' && answer.trim().length > 0) {
          body.answer = answer.trim();
        }
      }

      sendTelemetry(useFaqEndpoint ? 'ui.promote.click' : 'ui.approve.click', {
        ref_id: selectedId,
        count: useFaqEndpoint ? count : 0,
      });

      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
          cache: 'no-store',
        });

        const text = await response.text();
        let json: any = null;
        if (text) {
          try {
            json = JSON.parse(text);
          } catch {
            // ignore JSON parse error
          }
        }

        if (response.ok) {
          const qaPairId =
            typeof json?.qa_pair_id === 'string' ? json.qa_pair_id : undefined;
          const publishedAt =
            typeof json?.published_at === 'string'
              ? json.published_at
              : undefined;

          sendTelemetry(useFaqEndpoint ? 'ui.promote.success' : 'ui.approve.success', {
            ref_id: selectedId,
            qa_pair_id: qaPairId ?? null,
          });

          toast.success(useFaqEndpoint 
            ? 'Published as a verified FAQ.' 
            : 'Item approved ✓ (embeddings generated automatically)'
          );
          setDetail((prev) =>
            prev
              ? {
                  ...prev,
                  promotedPairId: qaPairId ?? prev.promotedPairId ?? null,
                  promotedAt: publishedAt ?? prev.promotedAt ?? null,
                }
              : prev
          );
          setItems((prev) => (Array.isArray(prev) ? prev : []).filter((item) => item.id !== selectedId));
          await loadList({ append: false });
          if (qaPairId && onPromoteSuccess) {
            onPromoteSuccess();
          }
          return true;
        }

        if (response.status === 409) {
          const qaPairId =
            typeof json?.qa_pair_id === 'string' ? json.qa_pair_id : undefined;
          setPromoteConflict(
            qaPairId ? { qaPairId } : { qaPairId: qaPairId ?? '' }
          );
          const conflictMessage =
            typeof json?.details === 'string'
              ? json.details
              : useFaqEndpoint
                ? 'This question was already promoted.'
                : 'This question was already approved.';
          setActionError(conflictMessage);
          sendTelemetry(useFaqEndpoint ? 'ui.promote.fail' : 'ui.approve.fail', {
            ref_id: selectedId,
            reason: 'conflict',
            qa_pair_id: qaPairId ?? null,
          });
          if (qaPairId && onPromoteConflict) {
            onPromoteConflict(qaPairId);
          }
          return false;
        }

        if (response.status === 401 || response.status === 403) {
          setPermissionError(true);
          const message =
            typeof json?.details === 'string'
              ? json.details
              : useFaqEndpoint
                ? 'You do not have permission to promote this item.'
                : 'You do not have permission to approve this item.';
          setActionError(message);
          sendTelemetry(useFaqEndpoint ? 'ui.promote.fail' : 'ui.approve.fail', {
            ref_id: selectedId,
            reason: 'forbidden',
            status: response.status,
          });
          return false;
        }

        if (response.status === 400) {
          console.error('[promote/approve] 400 error:', {
            endpoint: useFaqEndpoint ? 'promote' : 'approve',
            selectedId,
            payload: body,
            response: json,
            text: text,
          });
          const { rows, general } = parseValidationErrors(count, json);
          setCitationFieldErrors(rows);
          const errorMessage =
            general ||
            (json?.error === 'citations_required'
              ? useFaqEndpoint
                ? 'Attach at least one citation before promoting.'
                : 'Attach at least one citation before approving.'
              : json?.details || json?.error || json?.message ||
                (useFaqEndpoint
                  ? 'Resolve the highlighted fields before promoting.'
                  : 'Resolve the highlighted fields before approving.'));
          setActionError(errorMessage);
          sendTelemetry(useFaqEndpoint ? 'ui.promote.fail' : 'ui.approve.fail', {
            ref_id: selectedId,
            reason: 'validation',
          });
          return false;
        }

        const action = useFaqEndpoint ? 'promote' : 'approve';
        const message =
          (json && (json.details || json.error || json.message)) ||
          `Failed to ${action} inbox item (${response.status})`;
        setActionError(message);
        sendTelemetry(useFaqEndpoint ? 'ui.promote.fail' : 'ui.approve.fail', {
          ref_id: selectedId,
          reason: 'server',
          status: response.status,
        });
        return false;
      } catch (err) {
        const action = useFaqEndpoint ? 'promote' : 'approve';
        const message =
          err instanceof Error ? err.message : `Failed to ${action} inbox item.`;
        setActionError(message);
        sendTelemetry(useFaqEndpoint ? 'ui.promote.fail' : 'ui.approve.fail', {
          ref_id: selectedId,
          reason: 'network',
        });
        return false;
      } finally {
        setPromoteLoading(false);
      }
    },
    [
      selectedId,
      loadList,
      sendTelemetry,
      onPromoteSuccess,
      onPromoteConflict,
    ]
  );

  const clearFieldErrors = useCallback(() => {
    setCitationFieldErrors((prev) =>
      prev.length ? createEmptyFieldErrors(prev.length) : []
    );
  }, []);

  const clearActionAlerts = useCallback(() => {
    setActionError(null);
    setPermissionError(false);
    setPromoteConflict(null);
  }, []);

  useEffect(() => {
    loadList();
    return () => resetRefreshTimer();
  }, [loadList, resetRefreshTimer]);

  // Reset createAsFaq to true when selectedId changes
  useEffect(() => {
    setCreateAsFaq(true);
  }, [selectedId]);

  const hydrateDocMatches = useCallback(
    async (ids: string[]) => {
      for (const id of ids) {
        try {
          const response = await fetch(`/api/admin/inbox/${encodeURIComponent(id)}`, {
            method: 'GET',
            cache: 'no-store',
            credentials: 'include',
          });
          if (!response.ok) continue;
          const json = await response.json().catch(() => null);
          const detail = json ? normaliseDetail(json) : null;
          const matches = detail?.topScores ?? null;
          setItems((prev) =>
            prev.map((item) =>
              item.id === id ? { ...item, docMatches: matches } : item
            )
          );
        } catch (err) {
          console.warn('Failed to hydrate doc matches for inbox item', id, err);
        } finally {
          docHydrationRef.current.delete(id);
        }
      }
    },
    []
  );

  useEffect(() => {
    const missing = items
      .filter(
        (item) =>
          !item.docMatches && !docHydrationRef.current.has(item.id)
      )
      .slice(0, 5)
      .map((item) => item.id);
    if (!missing.length) return;
    missing.forEach((id) => docHydrationRef.current.add(id));
    hydrateDocMatches(missing);
  }, [items, hydrateDocMatches]);

  // Bulk selection clear handler (declared early for use in other callbacks)
  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const handleApplyFilters = useCallback(() => {
    const next: Filters = {
      ref: draftFilters.ref.trim(),
      tag: draftFilters.tag,
      qHash: draftFilters.qHash.trim(),
      docId: draftFilters.docId,
    };

    const changed =
      filtersRef.current.ref !== next.ref ||
      filtersRef.current.tag !== next.tag ||
      filtersRef.current.qHash !== next.qHash ||
      filtersRef.current.docId !== next.docId;

    filtersRef.current = next;
    setFilters(next);
    setSelectedId(null);
    setDetail(null);
    setDetailError(null);
    clearSelection(); // Clear bulk selection on filter change

    loadList({ append: false }, next);

    if (!changed) {
      loadList({ append: false }, next);
    }
  }, [draftFilters, loadList, clearSelection]);

  const handleResetFilters = useCallback(() => {
    const alreadyDefault =
      filtersRef.current.ref === DEFAULT_FILTERS.ref &&
      filtersRef.current.tag === DEFAULT_FILTERS.tag &&
      filtersRef.current.qHash === DEFAULT_FILTERS.qHash &&
      filtersRef.current.docId === DEFAULT_FILTERS.docId;

    setDraftFilters(DEFAULT_FILTERS);
    filtersRef.current = DEFAULT_FILTERS;
    setFilters(DEFAULT_FILTERS);
    setSelectedId(null);
    setDetail(null);
    setDetailError(null);

    if (alreadyDefault) {
      loadList({ append: false }, DEFAULT_FILTERS);
      return;
    }

    loadList({ append: false }, DEFAULT_FILTERS);
  }, [loadList]);

  const handleRefresh = useCallback(() => {
    if (refreshTimeoutRef.current) return;

    refreshTimeoutRef.current = setTimeout(() => {
      clearSelection(); // Clear bulk selection on refresh
      loadList({ append: false });
      resetRefreshTimer();
    }, 350);
  }, [loadList, resetRefreshTimer, clearSelection]);

  const handleLoadMore = useCallback(() => {
    if (!nextCursor) return;
    loadList({ cursor: nextCursor, append: true });
  }, [loadList, nextCursor]);

  const handleSelect = useCallback(
    (id: string) => {
      setSelectedId(id);
    },
    []
  );

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
      const response = await fetch('/api/admin/inbox/bulk-approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          ids,
          as_faq: createAsFaq,
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
      await loadList({ append: false }); // Refresh list
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to bulk approve items';
      toast.error(errorMessage);
      console.error('Bulk approve error:', err);
    } finally {
      setBulkActionLoading(false);
    }
  }, [selectedIds, clearSelection, loadList, createAsFaq]);

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
      await loadList({ append: false }); // Refresh list
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to bulk reject items';
      toast.error(errorMessage);
      console.error('Bulk reject error:', err);
    } finally {
      setBulkActionLoading(false);
    }
  }, [selectedIds, clearSelection, loadList]);

  useEffect(() => {
    if (!selectedId) {
      setDetail(null);
      setDetailError(null);
      setCitationFieldErrors([]);
      setActionError(null);
      setPermissionError(false);
      setPromoteConflict(null);
      setAttachLoading(false);
      setPromoteLoading(false);
      return;
    }
    loadDetail(selectedId);
  }, [selectedId, loadDetail]);

  const filtersApplied = useMemo(() => {
    return {
      ref: filtersRef.current.ref,
      tag: filtersRef.current.tag,
      qHash: filtersRef.current.qHash,
      docId: filtersRef.current.docId,
    };
  }, [filters]);

  useEffect(() => {
    filtersRef.current = filters;
  }, [filters]);

  useEffect(() => {
    if (!onRegisterActions) return;

    const actions: ModernInboxActions = {
      applyNoSourceFilter: () => {
        const next: Filters = { ref: '', tag: 'no_source', qHash: '', docId: '' };
        setDraftFilters(next);
        filtersRef.current = next;
        setFilters(next);
        setSelectedId(null);
        setDetail(null);
        setDetailError(null);
        loadList({ append: false }, next);
      },
      refreshList: () => {
        loadList({ append: false });
      },
      getCurrentDetail: () => ({
        id: selectedId,
        detail,
      }),
      refreshDetail: () => {
        if (selectedId) {
          loadDetail(selectedId);
        }
      },
    };

    onRegisterActions(actions);
  }, [detail, loadDetail, loadList, onRegisterActions, selectedId]);

  const displayItems = useMemo(() => {
    if (!filters.docId) {
      return items;
    }
    return items.filter((item) =>
      Array.isArray(item.docMatches)
        ? item.docMatches.some((match) => match.docId === filters.docId)
        : false
    );
  }, [items, filters.docId]);

  const handleSelectAll = useCallback(() => {
    if (bulkActionLoading) return;
    setSelectedIds((prev) => {
      const pageIds = displayItems.map((item) => item.id);
      const allSelected = pageIds.length > 0 && pageIds.every((id) => prev.has(id));
      const next = new Set(prev);
      if (allSelected) {
        pageIds.forEach((id) => next.delete(id));
      } else {
        pageIds.forEach((id) => next.add(id));
      }
      return next;
    });
  }, [displayItems, bulkActionLoading]);

  useEffect(() => {
    if (!filters.docId || !selectedId) {
      return;
    }
    const stillVisible = displayItems.some((item) => item.id === selectedId);
    if (!stillVisible) {
      setSelectedId(null);
    }
  }, [displayItems, filters.docId, selectedId]);

  return (
    <div className="space-y-6" key={`${modeKey}:${selectedId ?? 'none'}`}>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="grid gap-4 md:grid-cols-5"
            onSubmit={(event) => {
              event.preventDefault();
              handleApplyFilters();
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="inbox-ref-filter">Ref</Label>
              <Input
                id="inbox-ref-filter"
                placeholder="UUID..."
                value={draftFilters.ref}
                onChange={(event) =>
                  setDraftFilters((prev) => ({
                    ...prev,
                    ref: event.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="inbox-tag-filter">Tag</Label>
              <select
                id="inbox-tag-filter"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={draftFilters.tag}
                onChange={(event) =>
                  setDraftFilters((prev) => ({
                    ...prev,
                    tag: event.target.value,
                  }))
                }
              >
                <option value="">All</option>
                <option value="no_source">no_source</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="inbox-doc-filter">Document</Label>
              <select
                id="inbox-doc-filter"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={draftFilters.docId}
                onChange={(event) =>
                  setDraftFilters((prev) => ({
                    ...prev,
                    docId: event.target.value,
                  }))
                }
              >
                <option value="">All documents</option>
                {docOptions.map((doc) => (
                  <option key={doc.id} value={doc.id}>
                    {doc.title}
                  </option>
                ))}
              </select>
              {docOptionsLoading && (
                <p className="text-[11px] text-muted-foreground">Loading…</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="inbox-qhash-filter">Hash</Label>
              <Input
                id="inbox-qhash-filter"
                placeholder="q_hash..."
                value={draftFilters.qHash}
                onChange={(event) =>
                  setDraftFilters((prev) => ({
                    ...prev,
                    qHash: event.target.value,
                  }))
                }
              />
            </div>
            <div className="flex items-end gap-2">
              <Button type="submit" size="sm" className="w-24">
                Apply
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={handleResetFilters}
              >
                Reset
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Bulk Actions Toolbar */}
      {selectedIds.size > 0 && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="py-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-blue-800">
              <CheckCircle2 className="h-4 w-4" />
              <span>{selectedIds.size} item(s) selected</span>
              <Button variant="link" size="sm" onClick={clearSelection} className="text-blue-800">
                Clear selection
              </Button>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handleBulkApprove}
                disabled={bulkActionLoading}
              >
                {bulkActionLoading ? (
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                )}
                Bulk Approve ({selectedIds.size})
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleBulkReject}
                disabled={bulkActionLoading}
              >
                {bulkActionLoading ? (
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                ) : (
                  <XCircle className="h-3 w-3 mr-1" />
                )}
                Bulk Reject ({selectedIds.size})
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <InboxList
          items={Array.isArray(displayItems) ? displayItems : []}
          loading={loading && !isInitialised}
          refreshing={loading && isInitialised}
          error={error}
          filters={filtersApplied}
          selectedId={selectedId}
          onSelect={handleSelect}
          onRefresh={handleRefresh}
          onLoadMore={handleLoadMore}
          nextCursor={nextCursor}
          selectedIds={selectedIds}
          onToggleSelect={handleToggleSelect}
          onSelectAll={handleSelectAll}
          bulkActionLoading={bulkActionLoading}
        />

        <InboxDetailPanel
          loading={detailLoading}
          error={detailError}
          detail={detail}
          selectedId={selectedId}
          allowActions={allowActions}
          allowEmptyCitations={allowEmptyCitations}
          reviewFlagEnabled={reviewFlagEnabled}
          hasReviewerAccess={hasReviewerAccess}
          enableFaqCreation={enableFaqCreation}
          tenantId={tenantId}
          attachLoading={attachLoading}
          promoteLoading={promoteLoading}
          actionError={actionError}
          permissionError={permissionError}
          promoteConflict={promoteConflict}
          fieldErrors={citationFieldErrors}
          createAsFaq={createAsFaq}
          setCreateAsFaq={setCreateAsFaq}
          onAttach={handleAttach}
          onPromote={handlePromote}
          onClearFieldErrors={clearFieldErrors}
          onClearAlerts={clearActionAlerts}
        />
      </div>
    </div>
  );
}

