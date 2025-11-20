'use client';

import { useState } from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Textarea } from '@/components/ui/textarea';
import { CitationsEditor, EditableCitation } from '@/components/inbox/CitationsEditor';
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
} from 'lucide-react';

type LegacyInboxListProps = {
  items: LegacyInboxItem[];
  loading: boolean;
  error: string | null;
  enableFaqCreation: boolean;
  allowEmptyCitations: boolean;
  onApprove: (id: string, editedAnswer?: string, isFaq?: boolean) => void;
  onReject: (id: string) => void;
  onAttachCitations: (id: string, citations: Array<{ type: string; doc_id: string; page?: number; span?: { start?: number; end?: number; text?: string } }>) => Promise<void>;
  onRefresh: () => void;
  docTitles?: Record<string, string>;
  docLoading?: boolean;
};

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
}: LegacyInboxListProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editedAnswers, setEditedAnswers] = useState<Record<string, string>>({});
  const [faqSelections, setFaqSelections] = useState<Record<string, boolean>>({});
  const [attachModalOpen, setAttachModalOpen] = useState<string | null>(null);
  const [attachCitations, setAttachCitations] = useState<EditableCitation[]>([{ docId: '', page: '', spanStart: '', spanEnd: '', spanText: '' }]);
  const [attachLoading, setAttachLoading] = useState(false);
  const [copiedQuestionId, setCopiedQuestionId] = useState<string | null>(null);

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
    const editedAnswer = editedAnswers[id];
    const isFaq = faqSelections[id] ?? true;
    onApprove(id, editedAnswer, isFaq);
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
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium flex items-center space-x-2">
          <Inbox className="h-4 w-4" />
          <span>Inbox Items ({items.length})</span>
        </CardTitle>
        <Button onClick={onRefresh} variant="ghost" size="icon" title="Refresh inbox">
          <RefreshCw className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px]">Question</TableHead>
                <TableHead className="w-[200px]">Document</TableHead>
                <TableHead className="w-[300px]">Answer</TableHead>
                <TableHead className="w-[120px]">Created</TableHead>
                <TableHead className="w-[100px]">PII</TableHead>
                <TableHead className="w-[150px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="w-[200px]">
                    <div className="flex items-start gap-2 group">
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
                  <TableCell className="w-[200px] text-xs text-muted-foreground align-top">
                    {renderDocBadges(item, docTitles, docLoading)}
                  </TableCell>
                  <TableCell className="w-[300px]">
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
                      <div className="space-y-2">
                        <div className="text-sm whitespace-pre-wrap max-h-32 overflow-y-auto">
                          {editedAnswers[item.id] || item.answer}
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            onClick={() => startEditing(item.id, editedAnswers[item.id] || item.answer)}
                            size="sm"
                            variant="outline"
                            className="text-xs"
                          >
                            <Edit2 className="h-3 w-3 mr-1" />
                            Edit Answer
                          </Button>
                          <Badge variant="outline" className="text-xs">
                            Click to edit
                          </Badge>
                        </div>
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground w-[120px]">
                    {formatDate(item.created_at)}
                  </TableCell>
                  <TableCell className="w-[100px]">
                    {item.has_pii ? (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <Badge variant="destructive" className="flex items-center space-x-1">
                              <AlertTriangle className="h-3 w-3" />
                              <span>PII</span>
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>PII detected in fields: {item.pii_fields?.join(', ') || 'unknown'}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    ) : (
                      <Badge variant="secondary">Clean</Badge>
                    )}
                  </TableCell>
                  <TableCell className="w-[150px]">
                    <div className="flex flex-col gap-1.5">
                      {enableFaqCreation && (
                        <label className="flex items-center gap-2 text-[11px] text-muted-foreground">
                          <input
                            type="checkbox"
                            className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
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
                      {/* Citations preview or attach button */}
                      {item.suggested_citations && item.suggested_citations.length > 0 ? (
                        <div className="space-y-1">
                          <div className="text-[10px] text-muted-foreground font-medium">Citations (auto-used):</div>
                          <div className="flex flex-wrap gap-1">
                            {item.suggested_citations.slice(0, 2).map((cite, idx) => (
                              <Badge key={idx} variant="outline" className="text-[10px] px-1.5 py-0.5 bg-muted/50">
                                {cite.doc_id.substring(0, 12)}...
                                {cite.page && <span className="ml-1 text-muted-foreground">p.{cite.page}</span>}
                              </Badge>
                            ))}
                            {item.suggested_citations.length > 2 && (
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0.5 bg-muted/50">
                                +{item.suggested_citations.length - 2}
                              </Badge>
                            )}
                          </div>
                          <Button
                            onClick={() => handleOpenAttachModal(item.id)}
                            size="sm"
                            variant="ghost"
                            disabled={editingId === item.id}
                            className="h-7 px-2 text-[11px] text-muted-foreground hover:text-foreground"
                          >
                            <Edit2 className="h-3 w-3 mr-1" />
                            Edit
                          </Button>
                        </div>
                      ) : (
                        <Button
                          onClick={() => handleOpenAttachModal(item.id)}
                          size="sm"
                          variant="ghost"
                          disabled={editingId === item.id}
                          className="h-7 px-2 text-[11px] text-muted-foreground hover:text-foreground"
                        >
                          <Paperclip className="h-3 w-3 mr-1" />
                          Attach
                        </Button>
                      )}
                      <div className="flex space-x-2">
                        <Button
                          onClick={() => handleApprove(item.id)}
                          size="sm"
                          className="!bg-green-600 !hover:bg-green-700 !text-white !border-green-600 !hover:border-green-700"
                          disabled={
                            editingId === item.id ||
                            (!allowEmptyCitations &&
                              (!item.suggested_citations || item.suggested_citations.length === 0))
                          }
                          title={
                            !allowEmptyCitations &&
                            (!item.suggested_citations || item.suggested_citations.length === 0)
                              ? 'Attach citations first'
                              : 'Approve and automatically generate embeddings'
                          }
                        >
                          <Check className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          onClick={() => onReject(item.id)}
                          size="sm"
                          variant="destructive"
                          disabled={editingId === item.id}
                        >
                          <X className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
      {attachModalOpen && typeof window !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={handleCloseAttachModal}>
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col m-4 bg-background shadow-lg" onClick={(e) => e.stopPropagation()}>
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
  );
}



