'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Citation,
  CitationFieldErrors,
  InboxDetail,
  PreparedCitation,
  PromoteConflict,
} from './ModernInboxClient';
import {
  CitationsEditor,
  CitationRowError,
  EditableCitation,
  DocOption,
} from './CitationsEditor';
import { AssignmentBadge } from './AssignmentBadge';
import { AssignableMember } from './types';
import { toast } from 'sonner';
import {
  AlertTriangle,
  CheckCircle2,
  Loader2,
  ListChecks,
  Paperclip,
  Sparkles,
  Copy,
} from 'lucide-react';

function formatRelativeTime(value: string | null) {
  if (!value) return { absolute: '—', relative: '—' };
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return { absolute: '—', relative: '—' };
  }

  const absolute = date.toLocaleString();
  const diff = Date.now() - date.getTime();
  const diffSeconds = Math.round(diff / 1000);
  const formatter = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

  if (Math.abs(diffSeconds) < 60) {
    return { absolute, relative: formatter.format(-diffSeconds, 'second') };
  }
  if (Math.abs(diffSeconds) < 3600) {
    return { absolute, relative: formatter.format(-Math.round(diffSeconds / 60), 'minute') };
  }
  if (Math.abs(diffSeconds) < 86400) {
    return { absolute, relative: formatter.format(-Math.round(diffSeconds / 3600), 'hour') };
  }
  if (Math.abs(diffSeconds) < 604800) {
    return { absolute, relative: formatter.format(-Math.round(diffSeconds / 86400), 'day') };
  }
  if (Math.abs(diffSeconds) < 2629800) {
    return { absolute, relative: formatter.format(-Math.round(diffSeconds / 604800), 'week') };
  }
  if (Math.abs(diffSeconds) < 31557600) {
    return { absolute, relative: formatter.format(-Math.round(diffSeconds / 2629800), 'month') };
  }
  return { absolute, relative: formatter.format(-Math.round(diffSeconds / 31557600), 'year') };
}

function renderTags(tags: string[]) {
  const safeTags = Array.isArray(tags) ? tags : [];
  if (!safeTags.length) return <span className="text-xs text-muted-foreground">—</span>;
  return (
    <div className="flex flex-wrap gap-1">
      {safeTags.map((tag) => (
        <Badge
          key={tag}
          className={tag === 'no_source' ? 'bg-amber-100 text-amber-900 text-[11px]' : 'text-[11px]'}
          variant={tag === 'no_source' ? 'default' : 'outline'}
        >
          {tag}
        </Badge>
      ))}
    </div>
  );
}

const EMPTY_CITATION: EditableCitation = {
  docId: '',
  page: '',
  spanStart: '',
  spanEnd: '',
  spanText: '',
};

type ParsedCitation = {
  docId: string;
  page?: number;
  spanStart?: number;
  spanEnd?: number;
  spanText?: string;
};

type ValidationResult = {
  apiCitations: PreparedCitation[];
  rowErrors: CitationRowError[];
  generalError?: string;
  isValid: boolean;
};

function toEditableCitation(citation: InboxDetail['suggestedCitations'][number]): EditableCitation {
  return {
    docId: citation.docId ?? '',
    page: citation.page != null ? String(citation.page) : '',
    spanStart: citation.span?.start != null ? String(citation.span.start) : '',
    spanEnd: citation.span?.end != null ? String(citation.span.end) : '',
    spanText: citation.span?.text ?? '',
  };
}

function validateCitations(
  citations: EditableCitation[],
  allowEmpty: boolean
): ValidationResult {
  const safeCitations = Array.isArray(citations) ? citations : [];
  const rowErrors: CitationRowError[] = safeCitations.map(() => ({}));
  const parsed: Array<ParsedCitation | null> = safeCitations.map(() => null);
  const seenDocIds = new Map<string, number[]>();

  safeCitations.forEach((citation, index) => {
    const docId = citation.docId.trim();
    const page = citation.page.trim();
    const spanStart = citation.spanStart.trim();
    const spanEnd = citation.spanEnd.trim();
    const spanText = citation.spanText.trim();

    const isCompletelyEmpty =
      !docId && !page && !spanStart && !spanEnd && spanText.length === 0;

    if (isCompletelyEmpty) {
      parsed[index] = null;
      return;
    }

    if (!docId) {
      rowErrors[index].docId = 'Document ID is required.';
    } else {
      const normalized = docId.toLowerCase();
      const existing = seenDocIds.get(normalized) ?? [];
      existing.push(index);
      seenDocIds.set(normalized, existing);
    }

    let parsedPage: number | undefined;
    if (page) {
      const value = Number(page);
      if (!Number.isFinite(value) || value < 0) {
        rowErrors[index].page = 'Page must be a non-negative number.';
      } else {
        parsedPage = Math.trunc(value);
        if (!Number.isInteger(value)) {
          rowErrors[index].page = 'Page must be a whole number.';
        }
      }
    }

    let parsedSpanStart: number | undefined;
    if (spanStart) {
      const value = Number(spanStart);
      if (!Number.isFinite(value) || value < 0) {
        rowErrors[index].spanStart = 'Start must be a non-negative number.';
      } else {
        parsedSpanStart = Math.trunc(value);
        if (!Number.isInteger(value)) {
          rowErrors[index].spanStart = 'Start must be a whole number.';
        }
      }
    }

    let parsedSpanEnd: number | undefined;
    if (spanEnd) {
      const value = Number(spanEnd);
      if (!Number.isFinite(value) || value < 0) {
        rowErrors[index].spanEnd = 'End must be a non-negative number.';
      } else {
        parsedSpanEnd = Math.trunc(value);
        if (!Number.isInteger(value)) {
          rowErrors[index].spanEnd = 'End must be a whole number.';
        }
      }
    }

    if (
      parsedSpanStart != null &&
      parsedSpanEnd != null &&
      parsedSpanStart > parsedSpanEnd
    ) {
      rowErrors[index].spanStart = 'Start cannot be after end.';
      rowErrors[index].spanEnd = 'End cannot be before start.';
    }

    if (spanText.length > 400) {
      rowErrors[index].spanText = 'Span text must be 400 characters or fewer.';
    }

    parsed[index] = {
      docId,
      page: parsedPage,
      spanStart: parsedSpanStart,
      spanEnd: parsedSpanEnd,
      spanText: spanText || undefined,
    };
  });

  for (const [, indices] of seenDocIds.entries()) {
    if (indices.length > 1) {
      indices.forEach((idx) => {
        rowErrors[idx].docId = 'Duplicate document ID.';
      });
    }
  }

  const apiCitations: PreparedCitation[] = [];

  parsed.forEach((entry, index) => {
    if (!entry) {
      return;
    }
    if (Object.keys(rowErrors[index]).length > 0) {
      return;
    }
    const payload: PreparedCitation = { doc_id: entry.docId };
    if (typeof entry.page === 'number') {
      payload.page = entry.page;
    }
    if (
      typeof entry.spanStart === 'number' ||
      typeof entry.spanEnd === 'number' ||
      (entry.spanText && entry.spanText.length > 0)
    ) {
      payload.span = {};
      if (typeof entry.spanStart === 'number') {
        payload.span.start = entry.spanStart;
      }
      if (typeof entry.spanEnd === 'number') {
        payload.span.end = entry.spanEnd;
      }
      if (entry.spanText && entry.spanText.length > 0) {
        payload.span.text = entry.spanText;
      }
    }
    apiCitations.push(payload);
  });

  let generalError: string | undefined;
  if (!allowEmpty && apiCitations.length === 0) {
    generalError = 'Attach at least one citation before continuing.';
  }

  const isValid =
    !generalError && rowErrors.every((row) => Object.keys(row).length === 0);

  return {
    apiCitations,
    rowErrors,
    generalError,
    isValid,
  };
}

type InboxDetailPanelProps = {
  loading: boolean;
  error: string | null;
  detail: InboxDetail | null;
  selectedId: string | null;
  allowActions: boolean;
  allowEmptyCitations: boolean;
  reviewFlagEnabled: boolean;
  hasReviewerAccess: boolean;
  enableFaqCreation: boolean;
  tenantId?: string;
  attachLoading: boolean;
  promoteLoading: boolean;
  actionError: string | null;
  permissionError: boolean;
  promoteConflict: PromoteConflict | null;
  fieldErrors: CitationFieldErrors[];
  createAsFaq: boolean;
  setCreateAsFaq: (value: boolean) => void;
  docOptions?: DocOption[];
  docOptionsLoading?: boolean;
  docOptionsError?: string | null;
  onReloadDocOptions?: () => void;
  canRequestReview?: boolean;
  onRequestReview?: () => void;
  onAttach: (payload: { citations: PreparedCitation[] }) => Promise<boolean>;
  onPromote: (payload: {
    citations?: PreparedCitation[];
    answer?: string | null;
    title?: string | null;
    isFaq?: boolean;
  }) => Promise<boolean>;
  onClearFieldErrors: () => void;
  onClearAlerts: () => void;
};

export function InboxDetailPanel({
  loading,
  error,
  detail,
  selectedId,
  allowActions,
  allowEmptyCitations,
  reviewFlagEnabled,
  hasReviewerAccess,
  enableFaqCreation,
  tenantId,
  attachLoading,
  promoteLoading,
  actionError,
  permissionError,
  promoteConflict,
  fieldErrors,
  createAsFaq,
  setCreateAsFaq,
  docOptions,
  docOptionsLoading,
  docOptionsError,
  onReloadDocOptions,
  canRequestReview,
  onRequestReview,
  onAttach,
  onPromote,
  onClearFieldErrors,
  onClearAlerts,
}: InboxDetailPanelProps) {
  const [citations, setCitations] = useState<EditableCitation[]>([EMPTY_CITATION]);
  const [clientErrors, setClientErrors] = useState<CitationRowError[]>([]);
  const [showErrors, setShowErrors] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [questionCopied, setQuestionCopied] = useState(false);
  const [promoteSuccess, setPromoteSuccess] = useState(false);

  useEffect(() => {
    if (!detail) return;
    const sourceCitations: Citation[] = Array.isArray(detail.suggestedCitations)
      ? detail.suggestedCitations
      : Array.isArray((detail as any).promotedCitations)
        ? ((detail as any).promotedCitations as Citation[])
        : [];
    const next =
      sourceCitations.length > 0
        ? sourceCitations.map((citation) => toEditableCitation(citation))
        : [EMPTY_CITATION];
    setCitations(next);
    setClientErrors(next.map(() => ({})));
    setShowErrors(false);
    setGeneralError(null);
    setCreateAsFaq(enableFaqCreation); // Respect the FAQ flag when detail changes
    onClearFieldErrors();
  }, [detail, onClearFieldErrors, setCreateAsFaq, enableFaqCreation]);

  useEffect(() => {
    setClientErrors((prev) => {
      const safePrev = Array.isArray(prev) ? prev : [];
      const safeCitations = Array.isArray(citations) ? citations : [EMPTY_CITATION];
      if (safePrev.length === safeCitations.length) return safePrev;
      return safeCitations.map(() => ({}));
    });
  }, [citations]);

  const validationPreview = useMemo(() => {
    const safeCitations = Array.isArray(citations) ? citations : [EMPTY_CITATION];
    return validateCitations(safeCitations, allowEmptyCitations);
  }, [citations, allowEmptyCitations]);

  const safeFieldErrors = Array.isArray(fieldErrors) ? fieldErrors : [];

  const combinedRowErrors = useMemo(() => {
    const safeCitations = Array.isArray(citations) ? citations : [EMPTY_CITATION];
    const safeClientErrors = Array.isArray(clientErrors) ? clientErrors : [];
    const length = Math.max(safeCitations.length, safeFieldErrors.length, safeClientErrors.length);
    return Array.from({ length }, (_, index) => ({
      ...(showErrors ? safeClientErrors[index] ?? {} : {}),
      ...(safeFieldErrors[index] ?? {}),
    }));
  }, [citations, safeFieldErrors, clientErrors, showErrors]);

  const handleCitationsChange = useCallback(
    (next: EditableCitation[]) => {
      const safeNext = Array.isArray(next) ? next : [EMPTY_CITATION];
      setCitations(safeNext);
      setClientErrors(safeNext.map(() => ({})));
      setShowErrors(false);
      setGeneralError(null);
      onClearFieldErrors();
    },
    [onClearFieldErrors]
  );

  const handleAttachClick = useCallback(async () => {
    if (!detail) return;
    const safeCitations = Array.isArray(citations) ? citations : [EMPTY_CITATION];
    const validation = validateCitations(safeCitations, allowEmptyCitations);
    if (!validation.isValid) {
      setClientErrors(validation.rowErrors);
      setGeneralError(validation.generalError ?? null);
      setShowErrors(true);
      return;
    }

    setClientErrors(validation.rowErrors);
    setGeneralError(null);
    setShowErrors(false);
    onClearFieldErrors();
    onClearAlerts();

    const success = await onAttach({ citations: validation.apiCitations });
    if (!success) {
      setShowErrors(true);
    }
  }, [
    allowEmptyCitations,
    citations,
    detail,
    onAttach,
    onClearAlerts,
    onClearFieldErrors,
  ]);

  const handlePromoteClick = useCallback(async () => {
    if (!detail) return;
    const safeCitations = Array.isArray(citations) ? citations : [EMPTY_CITATION];
    const validation = validateCitations(safeCitations, allowEmptyCitations);
    if (!validation.isValid) {
      setClientErrors(validation.rowErrors);
      setGeneralError(validation.generalError ?? null);
      setShowErrors(true);
      return;
    }

    setClientErrors(validation.rowErrors);
    setGeneralError(null);
    setShowErrors(false);
    onClearFieldErrors();
    onClearAlerts();

    const payload: {
      citations?: PreparedCitation[];
      answer?: string | null;
      isFaq?: boolean;
    } = {};

    if (validation.apiCitations.length > 0) {
      payload.citations = validation.apiCitations;
    } else if (!allowEmptyCitations) {
      payload.citations = [];
    }

    if (detail.answerDraft) {
      payload.answer = detail.answerDraft;
    }
    // Only set isFaq to true if both enableFaqCreation flag is enabled AND createAsFaq is true
    payload.isFaq = enableFaqCreation && createAsFaq;

    const success = await onPromote(payload);
    if (success) {
      // Show success feedback for 2 seconds
      setPromoteSuccess(true);
      setTimeout(() => {
        setPromoteSuccess(false);
      }, 2000);
    } else {
      setShowErrors(true);
    }
  }, [
    allowEmptyCitations,
    citations,
    detail,
    onPromote,
    onClearAlerts,
    onClearFieldErrors,
    createAsFaq,
    enableFaqCreation, // Required: callback must update when flag changes
  ]);

  if (!selectedId) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="text-base">Details</CardTitle>
        </CardHeader>
        <CardContent className="flex h-full flex-col items-center justify-center text-center text-sm text-muted-foreground">
          <ListChecks className="mb-3 h-8 w-8 text-muted-foreground/70" />
          Select an inbox row to view details.
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="text-base">Details</CardTitle>
        </CardHeader>
        <CardContent className="flex h-full flex-col items-center justify-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
          Loading detail…
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="text-base">Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-destructive/40 bg-destructive/5 px-4 py-6 text-sm text-destructive">
            {error}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!detail) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="text-base">Details</CardTitle>
        </CardHeader>
        <CardContent className="flex h-full flex-col items-center justify-center text-sm text-muted-foreground">
          Unable to load detail for the selected item.
        </CardContent>
      </Card>
    );
  }

  const when = formatRelativeTime(detail.askedAt);
  const tags = Array.isArray(detail.tags) ? detail.tags : [];
  const topScores = Array.isArray(detail.topScores) ? detail.topScores : [];
  const sourceCitations: Citation[] = Array.isArray(detail.suggestedCitations)
    ? detail.suggestedCitations
    : Array.isArray((detail as any).promotedCitations)
      ? ((detail as any).promotedCitations as Citation[])
      : [];

  const showNoSource = tags.includes('no_source');
  const isPromoted = Boolean(detail.promotedPairId);
  const assignedMembers: AssignableMember[] = Array.isArray((detail as any).assignedTo)
    ? ((detail as any).assignedTo as AssignableMember[])
    : [];
  const assignedAt = detail.assignedAt ?? (detail as any).assigned_at ?? null;
  const assignmentReason = detail.reason ?? (detail as any).reason ?? null;
  const requestedBy = (detail as any).requestedBy as AssignableMember | undefined;
  const showRequestButton = Boolean(
    canRequestReview &&
      typeof onRequestReview === 'function' &&
      detail.status === 'pending' &&
      assignedMembers.length === 0
  );

  let actionsDisabledReason: 'promoted' | 'flag' | 'permission' | null = null;
  if (isPromoted) {
    actionsDisabledReason = 'promoted';
  } else if (!allowActions) {
    if (!reviewFlagEnabled) {
      actionsDisabledReason = 'flag';
    } else if (!hasReviewerAccess) {
      actionsDisabledReason = 'permission';
    }
  }

  const baseActionsDisabled = actionsDisabledReason !== null;

  const disableAttach =
    baseActionsDisabled || attachLoading || !validationPreview.isValid;
  const disablePromote =
    baseActionsDisabled || promoteLoading || !validationPreview.isValid;

  const disabledTitle = actionsDisabledReason
    ? actionsDisabledReason === 'promoted'
      ? 'Already promoted'
      : actionsDisabledReason === 'flag'
        ? 'Disabled by tenant flag'
        : 'Insufficient permissions'
    : undefined;

  const handleViewQaPairClick = useCallback(() => {
    if (typeof window === 'undefined' || !detail.promotedPairId) return;
    const gtag = (window as any).gtag;
    if (typeof gtag === 'function') {
      gtag('event', 'ui.view_qapair.click', {
        tenant_id: tenantId ?? 'unknown',
        ref_id: detail.id,
        qa_pair_id: detail.promotedPairId,
      });
    }
  }, [detail.id, detail.promotedPairId, tenantId]);

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-base">Details</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Assignment
              </div>
              {showRequestButton && (
                <Button size="sm" onClick={onRequestReview}>
                  Request SME review
                </Button>
              )}
            </div>
            <div className="flex flex-col gap-1">
              <AssignmentBadge assignees={assignedMembers} size="sm" />
              {requestedBy && (
                <div className="text-[11px] text-slate-500">
                  Requested by {requestedBy.name || requestedBy.email || requestedBy.id}
                  {assignedAt ? ` · ${formatRelativeTime(assignedAt).relative}` : ''}
                </div>
              )}
              {assignmentReason && (
                <div className="rounded-md border border-amber-200 bg-white p-2 text-xs text-slate-700">
                  <div className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-amber-600">
                    Reason
                  </div>
                  <p className="text-slate-700">{assignmentReason}</p>
                </div>
              )}
            </div>
          </div>
        </div>
        {isPromoted ? (
          <div className="flex flex-col gap-2 rounded-md border border-emerald-300 bg-emerald-50 px-3 py-2 text-xs text-emerald-900">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              <span>
                Promoted to QA pair{' '}
                <span className="font-mono text-[11px]">{detail.promotedPairId}</span>
                {detail.promotedAt ? ` · ${formatRelativeTime(detail.promotedAt).relative}` : ''}
              </span>
            </div>
            <Link
              href={`/admin/answers/${detail.promotedPairId}`}
              prefetch={false}
              className="text-xs underline transition-colors hover:text-emerald-700"
              onClick={handleViewQaPairClick}
            >
              View QA Pair
            </Link>
          </div>
        ) : (
          showNoSource && (
            <div className="flex items-center gap-2 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-900">
              <AlertTriangle className="h-4 w-4" />
              <span>Blocked — awaiting source.</span>
            </div>
          )
        )}

        <dl className="space-y-2">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Ref</dt>
            <dd className="font-mono text-xs">{detail.id}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Hash</dt>
            <dd className="font-mono text-xs">{detail.qHash ?? '—'}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Dup Count</dt>
            <dd>
              <Badge variant="secondary" className="text-xs">
                ×{detail.dupCount}
              </Badge>
            </dd>
          </div>
          <div className="flex justify-between" title={when.absolute}>
            <dt className="text-muted-foreground">Asked</dt>
            <dd className="text-muted-foreground">{when.relative}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Channel</dt>
            <dd className="text-muted-foreground">{detail.channel ?? '—'}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Tags</dt>
            <dd className="mt-1 flex flex-wrap gap-1">{renderTags(tags)}</dd>
          </div>
        </dl>

        <div className="space-y-1">
          <div className="text-xs font-semibold uppercase text-muted-foreground">Question</div>
          <div className="rounded-md border border-slate-200 bg-white p-3 text-sm relative">
            {detail.question ?? '—'}
            <div className="absolute bottom-2 right-2">
              <Button
                variant="ghost"
                size="sm"
                className={`h-7 px-2 text-xs transition-colors ${
                  questionCopied 
                    ? 'text-green-600 hover:text-green-700' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(detail.question ?? '');
                    setQuestionCopied(true);
                    setTimeout(() => setQuestionCopied(false), 2000);
                  } catch (error) {
                    toast.error('Failed to copy question');
                  }
                }}
              >
                {questionCopied ? (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5 mr-1.5" />
                    Copy
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {detail.answerDraft && (
          <div className="space-y-1">
            <div className="text-xs font-semibold uppercase text-muted-foreground">
              Answer (draft)
            </div>
            <div className="rounded-md border border-slate-200 bg-white p-3 text-sm whitespace-pre-wrap">
              {detail.answerDraft}
            </div>
          </div>
        )}

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-xs font-semibold uppercase text-muted-foreground">
              Citations
            </div>
            <Badge variant={allowEmptyCitations ? 'outline' : 'secondary'} className="text-[11px]">
              {allowEmptyCitations ? 'Optional' : 'Required'}
            </Badge>
          </div>

          {actionsDisabledReason && (
            <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
              {actionsDisabledReason === 'promoted'
                ? 'This item has already been promoted. Actions are read-only.'
                : actionsDisabledReason === 'flag'
                  ? 'Attach source and Promote are disabled for this tenant.'
                  : 'You do not have permission to attach sources or promote.'}
            </div>
          )}

          <CitationsEditor
            value={citations}
            onChange={handleCitationsChange}
            errors={combinedRowErrors}
            readOnly={!allowActions}
            disabled={!allowActions}
            docOptions={docOptions}
            docOptionsLoading={docOptionsLoading}
            docOptionsError={docOptionsError}
            onReloadDocOptions={onReloadDocOptions}
          />

          {generalError && (
            <p className="text-xs text-destructive">{generalError}</p>
          )}

          {permissionError && (
            <div className="flex items-center gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
              <AlertTriangle className="h-3.5 w-3.5" />
              <span>You don’t have permission to update this inbox item.</span>
            </div>
          )}

          {actionError && !permissionError && (
            <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
              {actionError}
            </div>
          )}

          {promoteConflict && (
            <div className="flex items-center gap-2 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-900">
              <AlertTriangle className="h-4 w-4" />
              <span>
                Already promoted as QA pair{' '}
                <span className="font-mono text-[11px]">
                  {promoteConflict.qaPairId || 'unknown'}
                </span>
              </span>
            </div>
          )}

          {enableFaqCreation && (
            <label className="flex items-center gap-2 text-xs text-muted-foreground">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
                checked={createAsFaq}
                onChange={(event) => setCreateAsFaq(event.target.checked)}
                disabled={baseActionsDisabled}
              />
              <span>Create as FAQ (default)</span>
            </label>
          )}

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAttachClick}
              disabled={disableAttach}
              title={disabledTitle}
            >
              {attachLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Paperclip className="mr-2 h-4 w-4" />
              )}
              Attach source
            </Button>
            <Button
              type="button"
              size="sm"
              className="bg-amber-600 text-white hover:bg-amber-700"
              onClick={handlePromoteClick}
              disabled={disablePromote || promoteSuccess}
              title={disabledTitle}
            >
              {promoteLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Promoting...
                </>
              ) : promoteSuccess ? (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Promoted
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Promote to verified
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <div className="text-xs font-semibold uppercase text-muted-foreground">Top scores</div>
          {detail.topScores === null ? (
            <p className="text-xs text-muted-foreground">
              Evidence snapshot not yet available.
            </p>
          ) : topScores.length === 0 ? (
            <p className="text-xs text-muted-foreground">No scores recorded.</p>
          ) : (
            <ul className="space-y-2 text-xs">
              {topScores.map((score) => (
                <li
                  key={score.docId}
                  className="rounded-md border border-slate-200 bg-slate-50 p-2"
                >
                  <div className="flex justify-between">
                    <span className="font-medium">{score.title ?? 'Untitled doc'}</span>
                    <span className="font-mono">{score.score.toFixed(3)}</span>
                  </div>
                  <div className="font-mono text-[11px] text-muted-foreground">
                    {score.docId}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
