'use client';

import { useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Textarea } from '@/components/ui/textarea';
import {
  CitationsEditor,
  EditableCitation,
  DocOption,
} from '@/components/inbox/CitationsEditor';
import { LegacyInboxItem } from './LegacyInboxPageClient';
import {
  Check,
  X,
  RefreshCw,
  Loader2,
  AlertTriangle,
  Inbox,
  Edit2,
  Save,
  RotateCcw,
  Paperclip,
  Copy,
  CheckCircle2,
  XCircle,
  ListChecks,
} from 'lucide-react';

type LegacyInboxListProps = {
  items: LegacyInboxItem[];
  loading: boolean;
  error: string | null;
  enableFaqCreation: boolean;
  allowEmptyCitations: boolean;
  onApprove: (id: string, editedAnswer?: string, isFaq?: boolean, note?: string) => void;
  onReject: (id: string, note?: string) => void;
  onAttachCitations: (id: string, citations: Array<{ type: string; doc_id: string; page?: number; span?: { start?: number; end?: number; text?: string } }>) => Promise<void>;
  onRefresh: () => void;
  docTitles?: Record<string, string>;
  docLoading?: boolean;
  docOptions?: DocOption[];
  docOptionsLoading?: boolean;
  docOptionsError?: string | null;
  onReloadDocOptions?: () => void;
  onRequestReview?: (item: LegacyInboxItem) => void;
  // Bulk selection props
  selectedIds?: Set<string>;
  onToggleSelect?: (id: string) => void;
  onSelectAll?: () => void;
  bulkActionLoading?: boolean;
  onBulkApprove?: () => void;
  onBulkReject?: () => void;
  onClearSelection?: () => void;
  currentUserId?: string | null;
  userRole?: string;
  // Chat review action handlers
  onMarkReviewed?: (id: string, note?: string) => void;
  onConvertToFaq?: (id: string, editedAnswer?: string, citations?: Array<{ type: string; doc_id: string; page?: number; span?: { start?: number; end?: number; text?: string } }>) => void;
  onDismiss?: (id: string, reason?: string) => void;
};

function renderStatusBadge(status?: string | null) {
  if (!status || status === 'pending') {
    return <Badge variant="outline" className="text-[10px]">Pending</Badge>;
  }
  switch (status) {
    case 'needs_review':
      return (
        <Badge className="text-[10px] bg-amber-100 text-amber-900 border-amber-300" title="Assigned for SME review">
          Needs Review
        </Badge>
      );
    case 'approved':
      return (
        <Badge className="text-[10px] bg-green-100 text-green-900 border-green-300" title="Approved">
          Approved
        </Badge>
      );
    case 'rejected':
      return (
        <Badge className="text-[10px] bg-red-100 text-red-900 border-red-300" title="Rejected">
          Rejected
        </Badge>
      );
    default:
      return (
        <Badge variant="outline" className="text-[10px]">
          {status}
        </Badge>
      );
  }
}

function renderDocBadges(
  item: LegacyInboxItem,
  docTitles?: Record<string, string>,
  docLoading?: boolean
) {
  if (!item.suggested_citations || item.suggested_citations.length === 0) {
    return '—';
  }

  // If we're still loading and don't have any titles yet, show loading
  if (docLoading && (!docTitles || Object.keys(docTitles).length === 0)) {
    return <span className="text-xs text-muted-foreground">Loading…</span>;
  }

  return (
    <div className="flex flex-wrap gap-1">
      {item.suggested_citations.slice(0, 2).map((cite, idx) => {
        const docId = cite.doc_id;
        if (!docId) return null;
        
        // Try to get title from docTitles mapping first, then cite.title, then fallback to docId
        const title =
          (docTitles && docTitles[docId]) ||
          cite.title ||
          docId;
        
        // Only show "Loading…" if we're actively loading AND haven't found the title yet
        // Once loading is complete, show the title (even if it's a UUID)
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(title);
        const displayTitle = (isUuid && docLoading && (!docTitles || !docTitles[docId])) 
          ? 'Loading…' 
          : title;
        
        const label =
          displayTitle && displayTitle.length > 24 
            ? `${displayTitle.slice(0, 24).trim()}…` 
            : displayTitle;
        
        return (
          <Badge
            key={`${item.id}-${docId}-${idx}`}
            variant="outline"
            className="text-[11px]"
            title={title !== 'Loading…' ? title : undefined}
          >
            {label || 'Document'}
            {cite.page && <span className="ml-1 text-muted-foreground">p.{cite.page}</span>}
          </Badge>
        );
      })}
    </div>
  );
}

export function LegacyInboxList({
  items,
  loading,
  error,
  enableFaqCreation,
  allowEmptyCitations,
  onApprove,
  onReject,
  onAttachCitations,
  onRefresh,
  docTitles,
  docLoading,
  docOptions,
  docOptionsLoading,
  docOptionsError,
  onReloadDocOptions,
  onRequestReview,
  selectedIds,
  onToggleSelect,
  onSelectAll,
  bulkActionLoading = false,
  onBulkApprove,
  onBulkReject,
  onClearSelection,
  currentUserId,
  userRole,
  onMarkReviewed,
  onConvertToFaq,
  onDismiss,
}: LegacyInboxListProps) {
  // Helper: Check if user can act on item (assignee OR admin)
  const canActOnItem = useCallback((item: LegacyInboxItem): boolean => {
    // If item is not assigned, anyone with role can act (existing behavior)
    if (!item.assignedTo || item.assignedTo.length === 0) {
      return true;
    }
    
    // If item is assigned, check ownership
    const isAdmin = userRole && ['owner', 'admin'].includes(userRole);
    if (isAdmin) {
      return true; // Admin override
    }
    
    // Check if current user is assignee
    if (currentUserId) {
      const isAssignee = item.assignedTo.some((member) => member.id === currentUserId);
      return isAssignee;
    }
    
    return false;
  }, [currentUserId, userRole]);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editedAnswers, setEditedAnswers] = useState<Record<string, string>>({});
  const [faqSelections, setFaqSelections] = useState<Record<string, boolean>>({});
  const [approveNotes, setApproveNotes] = useState<Record<string, string>>({});
  const [rejectNotes, setRejectNotes] = useState<Record<string, string>>({});
  const [markReviewedNotes, setMarkReviewedNotes] = useState<Record<string, string>>({});
  const [dismissReasons, setDismissReasons] = useState<Record<string, string>>({});
  const [attachModalOpen, setAttachModalOpen] = useState<string | null>(null);
  const [attachCitations, setAttachCitations] = useState<EditableCitation[]>([{ docId: '', page: '', spanStart: '', spanEnd: '', spanText: '' }]);
  const [attachLoading, setAttachLoading] = useState(false);
  const [copiedQuestionId, setCopiedQuestionId] = useState<string | null>(null);
  const [actionStates, setActionStates] = useState<Record<string, 'approving' | 'approved' | 'rejecting' | 'rejected' | 'converting' | 'marking' | 'dismissing'>>({});

  const formatDate = (dateString: string) => new Date(dateString).toLocaleString();

  const truncateText = (text: string, maxLength: number = 100) => {
    if (text.length <= maxLength) return text;
    return `${text.substring(0, maxLength)}...`;
  };

  const startEditing = (id: string, currentAnswer: string) => {
    setEditingId(id);
    setEditedAnswers((prev) => ({ ...prev, [id]: currentAnswer }));
  };

  const cancelEditing = (id: string) => {
    setEditingId(null);
    setEditedAnswers((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const saveEditing = (id: string) => {
    setEditingId(null);
  };

  const handleApprove = (id: string) => {
    // Set visual feedback immediately
    setActionStates((prev) => ({ ...prev, [id]: 'approving' }));
    const editedAnswer = editedAnswers[id];
    const isFaq = faqSelections[id] ?? true;
    const note = approveNotes[id]?.trim() || undefined;
    onApprove(id, editedAnswer, isFaq, note);
    // Clear note after action
    setApproveNotes((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    // On success, parent removes item, so state clears naturally
    // On error, clear state after a delay (parent keeps item and shows error toast)
    setTimeout(() => {
      setActionStates((prev) => {
        const next = { ...prev };
        if (next[id] === 'approving') {
          delete next[id];
        }
        return next;
      });
    }, 3000);
  };

  const handleReject = (id: string) => {
    // Set visual feedback immediately
    setActionStates((prev) => ({ ...prev, [id]: 'rejecting' }));
    const note = rejectNotes[id]?.trim() || undefined;
    onReject(id, note);
    // Clear note after action
    setRejectNotes((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    // On success, parent removes item, so state clears naturally
    // On error, clear state after a delay (parent keeps item and shows error toast)
    setTimeout(() => {
      setActionStates((prev) => {
        const next = { ...prev };
        if (next[id] === 'rejecting') {
          delete next[id];
        }
        return next;
      });
    }, 3000);
  };

  const handleOpenAttachModal = (id: string) => {
    setAttachModalOpen(id);
    const item = items.find((i) => i.id === id);
    // Pre-populate with suggested_citations if available, otherwise start empty
    if (item?.suggested_citations && item.suggested_citations.length > 0) {
      setAttachCitations(
        item.suggested_citations.map((cite) => ({
          docId: cite.doc_id,
          page: cite.page?.toString() || '',
          spanStart: cite.span?.start?.toString() || '',
          spanEnd: cite.span?.end?.toString() || '',
          spanText: cite.span?.text || '',
        }))
      );
    } else {
      setAttachCitations([{ docId: '', page: '', spanStart: '', spanEnd: '', spanText: '' }]);
    }
  };

  const handleCloseAttachModal = () => {
    setAttachModalOpen(null);
    setAttachCitations([{ docId: '', page: '', spanStart: '', spanEnd: '', spanText: '' }]);
  };

  const handleAttachSubmit = async () => {
    if (!attachModalOpen) return;

    // Validate citations
    const citationsWithDocId = attachCitations.filter((c) => c.docId.trim().length > 0);
    
    if (citationsWithDocId.length === 0) {
      toast.error('Please provide at least one citation with a document ID');
      return;
    }

    // Check for duplicates (backend will validate UUID format)
    const docIdSet = new Set<string>();
    const duplicateCitations: number[] = [];

    citationsWithDocId.forEach((c, idx) => {
      const docId = c.docId.trim();
      if (docIdSet.has(docId)) {
        duplicateCitations.push(idx);
      } else {
        docIdSet.add(docId);
      }
    });

    if (duplicateCitations.length > 0) {
      toast.error('Duplicate document IDs found. Each citation must have a unique document ID.');
      return;
    }

    // Build valid citations with required format
    const validCitations = citationsWithDocId.map((c) => {
      const citation: { 
        type: string;
        doc_id: string; 
        page?: number; 
        span?: { start?: number; end?: number; text?: string } 
      } = {
        type: 'doc', // Required by backend
        doc_id: c.docId.trim(),
      };
      
      const pageNum = c.page.trim() ? parseInt(c.page.trim(), 10) : undefined;
      if (pageNum !== undefined && !isNaN(pageNum) && pageNum > 0) {
        citation.page = pageNum;
      }
      
      const spanStart = c.spanStart.trim() ? parseInt(c.spanStart.trim(), 10) : undefined;
      const spanEnd = c.spanEnd.trim() ? parseInt(c.spanEnd.trim(), 10) : undefined;
      
      if (spanStart !== undefined || spanEnd !== undefined || c.spanText.trim()) {
        citation.span = {};
        if (spanStart !== undefined && !isNaN(spanStart) && spanStart >= 0) {
          citation.span.start = spanStart;
        }
        if (spanEnd !== undefined && !isNaN(spanEnd) && spanEnd >= 0) {
          citation.span.end = spanEnd;
        }
        if (c.spanText.trim()) {
          const text = c.spanText.trim();
          // Enforce 400 char limit
          citation.span.text = text.length > 400 ? text.substring(0, 400) : text;
        }
        
        // Validate span.start <= span.end if both are present
        if (citation.span.start !== undefined && citation.span.end !== undefined) {
          if (citation.span.start > citation.span.end) {
            toast.error('Span start must be less than or equal to span end');
            return null;
          }
        }
      }
      
      return citation;
    }).filter((c): c is NonNullable<typeof c> => c !== null);

    if (validCitations.length === 0) {
      toast.error('Please provide at least one valid citation');
      return;
    }

    setAttachLoading(true);
    try {
      await onAttachCitations(attachModalOpen, validCitations);
      handleCloseAttachModal();
    } catch (err) {
      // Error already shown by onAttachCitations
    } finally {
      setAttachLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Inbox className="h-5 w-5" />
            <span>Inbox Items</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Loading inbox items...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Inbox className="h-5 w-5" />
            <span>Inbox Items</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="text-red-500 text-sm mb-2">Error: {error}</div>
            <Button onClick={onRefresh} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (items.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Inbox className="h-5 w-5" />
            <span>Inbox Items</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Inbox className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No pending items</p>
            <p className="text-sm text-muted-foreground mt-2">
              All items have been reviewed or there are no new submissions.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      {selectedIds && selectedIds.size > 0 && onBulkApprove && onBulkReject && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-blue-900">
                {selectedIds.size} item(s) selected
              </span>
              {onClearSelection && (
                <Button variant="link" size="sm" onClick={onClearSelection} className="text-blue-800">
                  Clear selection
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={onBulkApprove}
                disabled={bulkActionLoading}
                className="bg-green-50 border-green-300 text-green-800 hover:bg-green-100"
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
                onClick={onBulkReject}
                disabled={bulkActionLoading}
                className="bg-red-50 border-red-300 text-red-800 hover:bg-red-100"
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

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium flex items-center space-x-2">
            <Inbox className="h-4 w-4" />
            <span>Inbox Items ({items.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {items.length === 0 && !loading && !error && (
            <div className="py-12 text-center">
              <p className="text-sm text-muted-foreground">No inbox items found.</p>
            </div>
          )}
          {items.length > 0 && (
            <div className="overflow-x-auto">
              <Table>
              <TableHeader>
                <TableRow>
                  {selectedIds !== undefined && onToggleSelect && onSelectAll && (
                    <TableHead className="w-12">
                      <input
                        type="checkbox"
                        className="form-checkbox h-4 w-4 text-blue-600"
                        checked={items.length > 0 && items.every((item) => selectedIds.has(item.id))}
                        onChange={onSelectAll}
                        disabled={bulkActionLoading}
                      />
                    </TableHead>
                  )}
                  <TableHead className="w-[180px]">Question</TableHead>
                <TableHead className="w-[160px]">Document</TableHead>
                <TableHead className="w-[280px]">Answer</TableHead>
                <TableHead className="w-[110px]">Created</TableHead>
                <TableHead className="w-[110px]">Status & PII</TableHead>
                <TableHead className="w-[180px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => {
                const isBulkSelected = selectedIds?.has(item.id) ?? false;
                return (
                <TableRow 
                  key={item.id} 
                  data-item-id={item.id}
                  id={`inbox-item-${item.id}`}
                  className={(() => {
                    // Check if this is the ref item from URL
                    if (typeof window !== 'undefined') {
                      const searchParams = new URLSearchParams(window.location.search);
                      const refId = searchParams.get('ref');
                      if (refId === item.id) {
                        return 'bg-blue-100 border-4 border-blue-500 shadow-lg';
                      }
                    }
                    return '';
                  })()}
                >
                  {selectedIds !== undefined && onToggleSelect && (
                    <TableCell
                      className="w-12"
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleSelect(item.id);
                      }}
                    >
                      <input
                        type="checkbox"
                        className="form-checkbox h-4 w-4 text-blue-600"
                        checked={isBulkSelected}
                        onChange={() => onToggleSelect(item.id)}
                        disabled={bulkActionLoading}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </TableCell>
                  )}
                  <TableCell className="w-[180px]">
                    <div className="flex items-start gap-2 group">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {/* Debug: Always show source_type for debugging */}
                          {process.env.NODE_ENV === 'development' && item.source_type && (
                            <Badge className="text-[8px] bg-gray-100 text-gray-600 border-gray-300" title={`Debug: source_type=${item.source_type}`}>
                              {item.source_type}
                            </Badge>
                          )}
                          {item.source_type === 'chat_review' && (
                            <Badge className="text-[10px] bg-blue-100 text-blue-900 border-blue-300 font-semibold" title="Chat review request">
                              💬 Chat Review
                            </Badge>
                          )}
                          {item.source_type === 'widget_review' && (
                            <Badge className="text-[10px] bg-indigo-100 text-indigo-900 border-indigo-300 font-semibold" title="Widget review request">
                              📱 Widget Review
                            </Badge>
                          )}
                          {(item.source_type === 'auto' || item.source === 'faq_generation') && (
                            <Badge className="text-[10px] bg-purple-100 text-purple-900 border-purple-300 font-semibold" title="FAQ Generated">
                              📚 FAQ Generated
                            </Badge>
                          )}
                          {/* Show if source_type is null or undefined */}
                          {!item.source_type && (
                            <Badge className="text-[8px] bg-yellow-100 text-yellow-700 border-yellow-300" title="Warning: source_type is missing">
                              ⚠️ No source_type
                            </Badge>
                          )}
                        </div>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger className="text-left flex-1 min-w-0">
                              {truncateText(item.question, 80)}
                            </TooltipTrigger>
                            <TooltipContent className="max-w-md">
                              <p>{item.question}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                        onClick={async (e) => {
                          e.stopPropagation();
                          try {
                            await navigator.clipboard.writeText(item.question);
                            setCopiedQuestionId(item.id);
                            setTimeout(() => setCopiedQuestionId(null), 2000);
                          } catch (error) {
                            toast.error('Failed to copy question');
                          }
                        }}
                        title={copiedQuestionId === item.id ? 'Copied!' : 'Copy question'}
                      >
                        {copiedQuestionId === item.id ? (
                          <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell className="w-[160px] text-xs text-muted-foreground">
                    <div className="flex items-center min-h-[2.5rem]">
                      {renderDocBadges(item, docTitles, docLoading)}
                    </div>
                  </TableCell>
                  <TableCell className="w-[280px]">
                        {editingId === item.id ? (
                      <div className="space-y-2">
                        <Textarea
                          value={editedAnswers[item.id] ?? item.answer}
                          onChange={(event) =>
                            setEditedAnswers((prev) => ({ ...prev, [item.id]: event.target.value }))
                          }
                          className="min-h-[100px] resize-y"
                          placeholder="Edit the answer..."
                        />
                        <div className="flex space-x-2">
                          <Button
                            onClick={() => saveEditing(item.id)}
                            size="sm"
                            className="!bg-blue-600 !hover:bg-blue-700 !text-white"
                          >
                            <Save className="h-3 w-3 mr-1" />
                            Save
                          </Button>
                          <Button onClick={() => cancelEditing(item.id)} size="sm" variant="outline">
                            <RotateCcw className="h-3 w-3 mr-1" />
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        <div className="text-sm whitespace-pre-wrap max-h-32 overflow-y-auto text-slate-700 leading-relaxed">
                          {editedAnswers[item.id] || item.answer}
                        </div>
                        {/* Show Edit Answer button only if user can act on item (assignee OR admin) */}
                        {canActOnItem(item) && (
                          <Button
                            onClick={() => startEditing(item.id, editedAnswers[item.id] || item.answer)}
                            size="sm"
                            variant="ghost"
                            className="h-6 px-2 text-[11px] text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                          >
                            <Edit2 className="h-3 w-3 mr-1" />
                            Edit
                          </Button>
                        )}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground w-[110px]">
                    {formatDate(item.created_at)}
                  </TableCell>
                  <TableCell className="w-[110px]">
                    <div className="flex flex-col gap-1">
                      {renderStatusBadge(item.status)}
                      {/* Show "Requested by" for chat/widget review items */}
                      {(item.requestedBy || item.metadata?.user_email) && (item.source_type === 'chat_review' || item.source_type === 'widget_review') && (() => {
                        // For internal users: use requestedBy (name/email)
                        // For external users: use metadata.user_email
                        // Priority: name > email > id > metadata.user_email > fallback
                        const requesterName = item.requestedBy 
                          ? (item.requestedBy.name || item.requestedBy.email || item.requestedBy.id || 'Unknown')
                          : (item.metadata?.user_email || 'External User');
                        const displayName = requesterName.length > 12 ? `${requesterName.substring(0, 12)}...` : requesterName;
                        const fullName = item.requestedBy
                          ? (item.requestedBy.name || item.requestedBy.email || item.requestedBy.id || 'Unknown')
                          : (item.metadata?.user_email || 'External User');
                        return (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger>
                                <Badge variant="outline" className="text-[9px] px-1.5 py-0.5 text-slate-600 border-slate-300 bg-slate-50 w-fit">
                                  👤 {displayName}
                                </Badge>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Requested by: {fullName}</p>
                                {item.requestedBy && !item.requestedBy.email && !item.requestedBy.name && (
                                  <p className="text-xs text-muted-foreground mt-1">Email/name not available from backend</p>
                                )}
                                {item.source_type === 'widget_review' && !item.requestedBy && (
                                  <p className="text-xs text-muted-foreground mt-1">External user (no email on file)</p>
                                )}
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        );
                      })()}
                      {item.has_pii && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <Badge variant="destructive" className="text-[10px] px-1.5 py-0.5 flex items-center gap-0.5 w-fit">
                                <AlertTriangle className="h-2.5 w-2.5" />
                                PII
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>PII detected in fields: {item.pii_fields?.join(', ') || 'unknown'}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="w-[180px] align-top">
                    <div className="flex flex-col gap-2 justify-between min-h-[100px]">
                      {/* Top section: FAQ creation checkbox and Request Review */}
                      <div className="flex flex-col gap-1.5">
                        {enableFaqCreation && (
                          <label className="flex items-center gap-1.5 text-[11px] text-slate-600">
                            <input
                              type="checkbox"
                              className="h-3.5 w-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
                              checked={faqSelections[item.id] ?? true}
                              disabled={editingId === item.id}
                              onChange={(event) =>
                                setFaqSelections((prev) => ({
                                  ...prev,
                                  [item.id]: event.target.checked,
                                }))
                              }
                            />
                            <span>Create as FAQ</span>
                          </label>
                        )}
                        {/* Request SME Review button - compact, secondary style */}
                        {onRequestReview &&
                          item.status === 'pending' &&
                          (!item.assignedTo || item.assignedTo.length === 0) && (
                            <Button
                              onClick={() => onRequestReview(item)}
                              size="sm"
                              variant="outline"
                              disabled={editingId === item.id}
                              className="h-7 px-2.5 text-[11px] font-medium border-blue-200 text-blue-700 hover:bg-blue-50 hover:border-blue-300 w-fit"
                            >
                              <ListChecks className="h-3 w-3 mr-1" />
                              Request Review
                            </Button>
                          )}
                      </div>
                      
                      {/* Middle section: Citations */}
                      {item.suggested_citations && item.suggested_citations.length > 0 ? (
                        <div className="flex flex-col gap-1">
                          <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                            Citations
                          </div>
                          <div className="flex flex-wrap items-center gap-1">
                            {item.suggested_citations.slice(0, 2).map((cite, idx) => {
                              const docId = cite.doc_id;
                              if (!docId) return null;
                              
                              // Try to get title from docTitles mapping first, then cite.title, then fallback to truncated UUID
                              const title =
                                (docTitles && docTitles[docId]) ||
                                cite.title ||
                                docId;
                              
                              // Truncate if too long, but show full title in tooltip
                              const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(title);
                              const displayTitle = isUuid
                                ? `${title.substring(0, 12)}...`
                                : title.length > 18
                                  ? `${title.substring(0, 18).trim()}…`
                                  : title;
                              
                              return (
                                <Badge 
                                  key={idx} 
                                  variant="outline" 
                                  className="text-[10px] px-1.5 py-0.5 bg-slate-50 border-slate-200 text-slate-700"
                                  title={title !== displayTitle ? title : undefined}
                                >
                                  {displayTitle}
                                  {cite.page && <span className="ml-0.5 text-slate-500">p.{cite.page}</span>}
                                </Badge>
                              );
                            })}
                            {item.suggested_citations.length > 2 && (
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0.5 bg-slate-50 border-slate-200 text-slate-700">
                                +{item.suggested_citations.length - 2}
                              </Badge>
                            )}
                            {/* Show Edit button inline with citations */}
                            {canActOnItem(item) && (
                              <Button
                                onClick={() => handleOpenAttachModal(item.id)}
                                size="sm"
                                variant="ghost"
                                disabled={editingId === item.id}
                                className="h-6 px-2 text-[11px] text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                              >
                                <Edit2 className="h-3 w-3 mr-1" />
                                Edit
                              </Button>
                            )}
                          </div>
                        </div>
                      ) : (
                        /* Show Attach button only if user can act on item (assignee OR admin) */
                        canActOnItem(item) && (
                          <Button
                            onClick={() => handleOpenAttachModal(item.id)}
                            size="sm"
                            variant="ghost"
                            disabled={editingId === item.id}
                            className="h-7 px-2 text-[11px] text-slate-600 hover:text-slate-900 hover:bg-slate-100 w-fit"
                          >
                            <Paperclip className="h-3 w-3 mr-1" />
                            Attach
                          </Button>
                        )
                      )}
                      
                      {/* Bottom section: Action buttons - push to bottom, consistent spacing */}
                      <div className="flex flex-col gap-1.5 mt-auto pt-1">
                        {/* Chat/Widget Review Items: Show specialized actions */}
                        {canActOnItem(item) && (item.source_type === 'chat_review' || item.source_type === 'widget_review') && (
                          <div className="flex flex-col gap-2">
                            {/* Show note fields only when requester exists */}
                            {(() => {
                              const hasRequester = item.requestedBy || item.metadata?.user_email;
                              if (!hasRequester) return null;
                              
                              return (
                                <div className="flex flex-col gap-2">
                                  {/* Mark Reviewed note field */}
                                  <div className="flex flex-col gap-1">
                                    <label className="text-[10px] text-slate-600 font-medium">
                                      Message to requester when marking reviewed (optional)
                                    </label>
                                    <Textarea
                                      placeholder="Add a message to the requester (e.g., 'We'll get back to you soon')"
                                      value={markReviewedNotes[item.id] || ''}
                                      onChange={(e) => setMarkReviewedNotes((prev) => ({ ...prev, [item.id]: e.target.value }))}
                                      className="text-xs min-h-[60px] resize-none"
                                      maxLength={500}
                                    />
                                  </div>
                                  {/* Dismiss reason field */}
                                  <div className="flex flex-col gap-1">
                                    <label className="text-[10px] text-slate-600 font-medium">
                                      Message to requester when dismissing (optional)
                                    </label>
                                    <Textarea
                                      placeholder="Add a message to the requester (e.g., 'We'll get back to you soon')"
                                      value={dismissReasons[item.id] || ''}
                                      onChange={(e) => setDismissReasons((prev) => ({ ...prev, [item.id]: e.target.value }))}
                                      className="text-xs min-h-[60px] resize-none"
                                      maxLength={500}
                                    />
                                  </div>
                                </div>
                              );
                            })()}
                            <div className="flex flex-row gap-1.5 flex-nowrap">
                            {/* Convert to FAQ button */}
                            {onConvertToFaq && (() => {
                              const hasCitations = Array.isArray(item.suggested_citations) && item.suggested_citations.length > 0;
                              const citationsRequired = allowEmptyCitations === false;
                              const missingCitations = citationsRequired && !hasCitations;
                              const isConverting = actionStates[item.id] === 'converting';
                              const isAnyAction = actionStates[item.id] !== undefined;
                              
                              return (
                                <Button
                                  onClick={() => {
                                    setActionStates((prev) => ({ ...prev, [item.id]: 'converting' }));
                                    const editedAnswer = editedAnswers[item.id];
                                    onConvertToFaq(item.id, editedAnswer);
                                    setTimeout(() => {
                                      setActionStates((prev) => {
                                        const next = { ...prev };
                                        if (next[item.id] === 'converting') {
                                          delete next[item.id];
                                        }
                                        return next;
                                      });
                                    }, 3000);
                                  }}
                                  size="sm"
                                  className="!bg-green-600 !hover:bg-green-700 !text-white !border-green-600 !hover:border-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-[12px] px-3 py-1.5 h-7 flex-shrink-0 font-semibold shadow-sm"
                                  disabled={
                                    editingId === item.id ||
                                    missingCitations ||
                                    isConverting ||
                                    isAnyAction
                                  }
                                  title={
                                    missingCitations
                                      ? 'Attach citations first'
                                      : 'Convert to FAQ and generate embeddings'
                                  }
                                >
                                  {isConverting ? (
                                    <>
                                      <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                                      Converting...
                                    </>
                                  ) : (
                                    <>
                                      <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                                      Convert to FAQ
                                    </>
                                  )}
                                </Button>
                              );
                            })()}
                            
                            {/* Mark Reviewed button */}
                            {onMarkReviewed && (() => {
                              const isMarking = actionStates[item.id] === 'marking';
                              const isAnyAction = actionStates[item.id] !== undefined;
                              
                              return (
                                <Button
                                  onClick={() => {
                                    setActionStates((prev) => ({ ...prev, [item.id]: 'marking' }));
                                    const note = markReviewedNotes[item.id]?.trim() || undefined;
                                    onMarkReviewed(item.id, note);
                                    // Clear note after action
                                    setMarkReviewedNotes((prev) => {
                                      const next = { ...prev };
                                      delete next[item.id];
                                      return next;
                                    });
                                    setTimeout(() => {
                                      setActionStates((prev) => {
                                        const next = { ...prev };
                                        if (next[item.id] === 'marking') {
                                          delete next[item.id];
                                        }
                                        return next;
                                      });
                                    }, 3000);
                                  }}
                                  size="sm"
                                  variant="outline"
                                  className="text-[10px] border-blue-300 text-blue-700 hover:bg-blue-50 hover:border-blue-400 disabled:opacity-50 px-2 py-1 h-6 flex-shrink-0 font-normal"
                                  disabled={
                                    editingId === item.id ||
                                    isMarking ||
                                    isAnyAction
                                  }
                                  title="Mark as reviewed without converting to FAQ"
                                >
                                  {isMarking ? (
                                    <>
                                      <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                      Marking...
                                    </>
                                  ) : (
                                    <>
                                      <CheckCircle2 className="h-3 w-3 mr-1" />
                                      Mark Reviewed
                                    </>
                                  )}
                                </Button>
                              );
                            })()}
                            
                            {/* Dismiss button */}
                            {onDismiss && (() => {
                              const isDismissing = actionStates[item.id] === 'dismissing';
                              const isAnyAction = actionStates[item.id] !== undefined;
                              
                              return (
                                <Button
                                  onClick={() => {
                                    setActionStates((prev) => ({ ...prev, [item.id]: 'dismissing' }));
                                    const reason = dismissReasons[item.id]?.trim() || undefined;
                                    onDismiss(item.id, reason);
                                    // Clear reason after action
                                    setDismissReasons((prev) => {
                                      const next = { ...prev };
                                      delete next[item.id];
                                      return next;
                                    });
                                    setTimeout(() => {
                                      setActionStates((prev) => {
                                        const next = { ...prev };
                                        if (next[item.id] === 'dismissing') {
                                          delete next[item.id];
                                        }
                                        return next;
                                      });
                                    }, 3000);
                                  }}
                                  size="sm"
                                  variant="outline"
                                  className="text-[10px] border-red-300 text-red-700 hover:bg-red-50 hover:border-red-400 disabled:opacity-50 px-2 py-1 h-6 flex-shrink-0 font-normal"
                                  disabled={
                                    editingId === item.id ||
                                    isDismissing ||
                                    isAnyAction
                                  }
                                  title="Dismiss this review request"
                                >
                                  {isDismissing ? (
                                    <>
                                      <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                      Dismissing...
                                    </>
                                  ) : (
                                    <>
                                      <X className="h-3 w-3 mr-1" />
                                      Dismiss
                                    </>
                                  )}
                                </Button>
                              );
                            })()}
                            </div>
                          </div>
                        )}
                        
                        {/* Regular Items: Show standard Approve/Reject buttons */}
                        {canActOnItem(item) && item.source_type !== 'chat_review' && item.source_type !== 'widget_review' && (
                          <div className="flex flex-col gap-2">
                            {/* Show note fields only when requester exists */}
                            {(() => {
                              const hasRequester = item.requestedBy || item.metadata?.user_email;
                              if (!hasRequester) return null;
                              
                              return (
                                <div className="flex flex-col gap-2">
                                  {/* Approve note field */}
                                  <div className="flex flex-col gap-1">
                                    <label className="text-[10px] text-slate-600 font-medium">
                                      Message to requester when approving (optional)
                                    </label>
                                    <Textarea
                                      placeholder="Add a message to the requester (e.g., 'We'll get back to you soon')"
                                      value={approveNotes[item.id] || ''}
                                      onChange={(e) => setApproveNotes((prev) => ({ ...prev, [item.id]: e.target.value }))}
                                      className="text-xs min-h-[60px] resize-none"
                                      maxLength={500}
                                    />
                                  </div>
                                  {/* Reject note field */}
                                  <div className="flex flex-col gap-1">
                                    <label className="text-[10px] text-slate-600 font-medium">
                                      Message to requester when rejecting (optional)
                                    </label>
                                    <Textarea
                                      placeholder="Add a message to the requester (e.g., 'We'll get back to you soon')"
                                      value={rejectNotes[item.id] || ''}
                                      onChange={(e) => setRejectNotes((prev) => ({ ...prev, [item.id]: e.target.value }))}
                                      className="text-xs min-h-[60px] resize-none"
                                      maxLength={500}
                                    />
                                  </div>
                                </div>
                              );
                            })()}
                            <div className="flex flex-row gap-1.5 flex-nowrap">
                              {/* Show Approve button only if user can act on item (assignee OR admin) */}
                              {(() => {
                                // Check if citations are required and missing
                                // Handle undefined, null, empty array, or non-array values
                                const hasCitations = Array.isArray(item.suggested_citations) && item.suggested_citations.length > 0;
                                const citationsRequired = allowEmptyCitations === false; // Explicitly check for false
                                const missingCitations = citationsRequired && !hasCitations;
                                
                                return (
                                  <Button
                                    onClick={() => handleApprove(item.id)}
                                    size="sm"
                                    className="!bg-green-600 !hover:bg-green-700 !text-white !border-green-600 !hover:border-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-[12px] px-3 py-1.5 h-7 flex-shrink-0 font-semibold shadow-sm"
                                    disabled={
                                      editingId === item.id ||
                                      missingCitations ||
                                      actionStates[item.id] === 'approving' ||
                                      actionStates[item.id] === 'approved'
                                    }
                                    title={
                                      missingCitations
                                        ? 'Attach citations first'
                                        : 'Approve and automatically generate embeddings'
                                    }
                                  >
                                    {actionStates[item.id] === 'approving' ? (
                                      <>
                                        <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                                        Approving...
                                      </>
                                    ) : actionStates[item.id] === 'approved' ? (
                                      <>
                                        <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                                        Approved
                                      </>
                                    ) : (
                                      <>
                                        <Check className="h-3.5 w-3.5 mr-1.5" />
                                        Approve
                                      </>
                                    )}
                                  </Button>
                                );
                              })()}
                              {/* Show Reject button only if user can act on item (assignee OR admin) */}
                              <Button
                                onClick={() => handleReject(item.id)}
                                size="sm"
                                variant="outline"
                                className="text-[10px] border-red-300 text-red-700 hover:bg-red-50 hover:border-red-400 disabled:opacity-50 px-2 py-1 h-6 flex-shrink-0 font-normal"
                                disabled={
                                  editingId === item.id ||
                                  actionStates[item.id] === 'rejecting' ||
                                  actionStates[item.id] === 'rejected'
                                }
                              >
                              {actionStates[item.id] === 'rejecting' ? (
                                <>
                                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                  Rejecting...
                                </>
                              ) : actionStates[item.id] === 'rejected' ? (
                                <>
                                  <CheckCircle2 className="h-3 w-3 mr-1" />
                                  Rejected
                                </>
                              ) : (
                                <>
                                  <X className="h-3 w-3 mr-1" />
                                  Reject
                                </>
                              )}
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              );
              })}
            </TableBody>
          </Table>
        </div>
          )}
        </CardContent>
      {attachModalOpen && typeof window !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/30 backdrop-blur-[2px]"
          onClick={handleCloseAttachModal}
        >
          <Card
            className="w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col m-4 bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <CardHeader className="flex-shrink-0">
              <CardTitle>Attach Citations</CardTitle>
              <p className="text-sm text-muted-foreground">
                Add document citations for this inbox item. At least one citation with a document ID is required.
              </p>
            </CardHeader>
            <CardContent className="space-y-4 overflow-y-auto flex-1">
              <CitationsEditor
                value={attachCitations}
                onChange={setAttachCitations}
                errors={[]}
                readOnly={false}
                disabled={attachLoading}
                maxCount={3}
                docOptions={docOptions}
                docOptionsLoading={docOptionsLoading}
                docOptionsError={docOptionsError}
                onReloadDocOptions={onReloadDocOptions}
              />
            </CardContent>
            <div className="flex justify-end gap-2 p-4 border-t flex-shrink-0">
              <Button variant="outline" onClick={handleCloseAttachModal} disabled={attachLoading}>
                Cancel
              </Button>
              <Button onClick={handleAttachSubmit} disabled={attachLoading || attachCitations.every((c) => !c.docId.trim())}>
                {attachLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Attaching...
                  </>
                ) : (
                  <>
                    <Paperclip className="mr-2 h-4 w-4" />
                    Attach
                  </>
                )}
              </Button>
            </div>
          </Card>
        </div>,
        document.body
      )}
      </Card>
    </>
  );
}



