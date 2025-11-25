'use client';

import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  CitationsEditor,
  EditableCitation,
  CitationRowError,
  DocOption,
} from './CitationsEditor';
import { PreparedCitation } from './ModernInboxClient';
import { toast } from 'sonner';
import { Loader2, X } from 'lucide-react';

const EMPTY_CITATION: EditableCitation = {
  docId: '',
  page: '',
  spanStart: '',
  spanEnd: '',
  spanText: '',
};

const DRAFT_STORAGE_KEY = 'manualFaqCreationDraft';

type ManualFAQCreationModalProps = {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

export function ManualFAQCreationModal({
  open,
  onClose,
  onSuccess,
}: ManualFAQCreationModalProps) {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [citations, setCitations] = useState<EditableCitation[]>([{ ...EMPTY_CITATION }]);
  const [tags, setTags] = useState<string[]>([]);
  const [requestSmeReview, setRequestSmeReview] = useState(false);
  const [assignees, setAssignees] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<CitationRowError[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [docOptions, setDocOptions] = useState<DocOption[]>([]);
  const [docOptionsLoading, setDocOptionsLoading] = useState(false);
  const [docOptionsError, setDocOptionsError] = useState<string | null>(null);

  const draftLoadedRef = useRef(false);

  const resetForm = useCallback(() => {
    setQuestion('');
    setAnswer('');
    setCitations([{ ...EMPTY_CITATION }]);
    setTags([]);
    setRequestSmeReview(false);
    setAssignees([]);
    setErrors([]);
    setTagInput('');
    setDocOptionsError(null);
    draftLoadedRef.current = false;
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem(DRAFT_STORAGE_KEY);
    }
  }, []);

  const handleClose = useCallback(() => {
    if (loading) return;
    onClose();
  }, [loading, onClose]);

  const handleReset = useCallback(() => {
    if (loading) return;
    resetForm();
  }, [loading, resetForm]);

  const loadDocOptions = useCallback(async () => {
    if (!open) return;
    try {
      setDocOptionsLoading(true);
      setDocOptionsError(null);
      const response = await fetch('/api/admin/docs?status=all&limit=200', {
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
      const mapped = docsSource
        .map((doc: any) => {
          if (!doc || typeof doc !== 'object') return null;
          const id =
            typeof doc.id === 'string'
              ? doc.id
              : typeof doc.doc_id === 'string'
                ? doc.doc_id
                : null;
          if (!id) return null;
          const title =
            typeof doc.title === 'string' && doc.title.trim().length > 0
              ? doc.title.trim()
              : typeof doc.name === 'string' && doc.name.trim().length > 0
                ? doc.name.trim()
                : id;
          const status =
            typeof doc.status === 'string'
              ? doc.status.toLowerCase()
              : typeof doc.state === 'string'
                ? doc.state.toLowerCase()
                : 'active';
          return { id, title, status };
        })
        .filter(Boolean) as Array<{ id: string; title: string; status?: string }>;

      const activeDocs = mapped.filter((doc) => !doc.status || doc.status === 'active');
      const finalDocs = (activeDocs.length > 0 ? activeDocs : mapped).map((doc) => ({
        id: doc.id,
        title: doc.title,
      }));
      setDocOptions(finalDocs);
    } catch (error) {
      console.error('Manual FAQ doc options error:', error);
      setDocOptionsError(
        error instanceof Error ? error.message : 'Failed to load documents'
      );
    } finally {
      setDocOptionsLoading(false);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    loadDocOptions();
  }, [open, loadDocOptions]);

  useEffect(() => {
    if (!open || draftLoadedRef.current) return;
    try {
      if (typeof window === 'undefined') {
        draftLoadedRef.current = true;
        return;
      }
      const raw = sessionStorage.getItem(DRAFT_STORAGE_KEY);
      if (!raw) {
        draftLoadedRef.current = true;
        return;
      }
      const draft = JSON.parse(raw);
      if (draft.question) setQuestion(draft.question);
      if (draft.answer) setAnswer(draft.answer);
      if (Array.isArray(draft.citations) && draft.citations.length > 0) {
        setCitations(draft.citations);
      }
      if (Array.isArray(draft.tags)) setTags(draft.tags);
    } catch (error) {
      console.error('Failed to load manual FAQ draft:', error);
    } finally {
      draftLoadedRef.current = true;
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    try {
      if (typeof window === 'undefined') return;
      const payload = {
        question,
        answer,
        citations,
        tags,
      };
      sessionStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(payload));
    } catch (error) {
      console.error('Failed to save manual FAQ draft:', error);
    }
  }, [open, question, answer, citations, tags]);

  // Validate citations and convert to API format
  const validateAndPrepareCitations = useCallback((): {
    citations: PreparedCitation[];
    errors: CitationRowError[];
    isValid: boolean;
  } => {
    const rowErrors: CitationRowError[] = citations.map(() => ({}));
    const seenDocIds = new Map<string, number[]>();
    let isValid = true;

    // Parse and validate citations
    const parsed = citations.map((entry, index) => {
      const docId = entry.docId.trim();
      if (!docId) {
        rowErrors[index].docId = 'Document ID is required.';
        isValid = false;
        return null;
      }

      // Check for duplicate doc_ids
      if (!seenDocIds.has(docId)) {
        seenDocIds.set(docId, []);
      }
      seenDocIds.get(docId)!.push(index);

      const page = entry.page.trim() ? parseInt(entry.page.trim(), 10) : null;
      if (entry.page.trim() && (isNaN(page!) || page! < 0)) {
        rowErrors[index].page = 'Page must be a non-negative number.';
        isValid = false;
      }

      const spanStart = entry.spanStart.trim() ? parseInt(entry.spanStart.trim(), 10) : null;
      const spanEnd = entry.spanEnd.trim() ? parseInt(entry.spanEnd.trim(), 10) : null;
      const spanText = entry.spanText.trim() || undefined;

      if (spanStart !== null && (isNaN(spanStart) || spanStart < 0)) {
        rowErrors[index].spanStart = 'Start must be a non-negative number.';
        isValid = false;
      }
      if (spanEnd !== null && (isNaN(spanEnd) || spanEnd < 0)) {
        rowErrors[index].spanEnd = 'End must be a non-negative number.';
        isValid = false;
      }
      if (spanStart !== null && spanEnd !== null && spanStart > spanEnd) {
        rowErrors[index].spanEnd = 'End must be greater than or equal to start.';
        isValid = false;
      }
      if (spanText && spanText.length > 400) {
        rowErrors[index].spanText = 'Span text must be 400 characters or less.';
        isValid = false;
      }

      return {
        docId,
        page: page !== null && !isNaN(page) ? page : undefined,
        spanStart,
        spanEnd,
        spanText,
      };
    });

    // Check for duplicate doc_ids
    for (const [, indices] of seenDocIds.entries()) {
      if (indices.length > 1) {
        indices.forEach((idx) => {
          rowErrors[idx].docId = 'Duplicate document ID.';
          isValid = false;
        });
      }
    }

    // Convert to API format
    const apiCitations: PreparedCitation[] = [];
    parsed.forEach((entry, index) => {
      if (!entry || Object.keys(rowErrors[index]).length > 0) {
        return;
      }
      const payload: PreparedCitation = { doc_id: entry.docId };
      if (entry.page !== undefined) {
        payload.page = entry.page;
      }
      if (entry.spanStart !== null || entry.spanEnd !== null || entry.spanText) {
        payload.span = {};
        if (entry.spanStart !== null) {
          payload.span.start = entry.spanStart;
        }
        if (entry.spanEnd !== null) {
          payload.span.end = entry.spanEnd;
        }
        if (entry.spanText) {
          payload.span.text = entry.spanText;
        }
      }
      apiCitations.push(payload);
    });

    return { citations: apiCitations, errors: rowErrors, isValid };
  }, [citations]);

  // Validate form
  const isFormValid = useMemo(() => {
    if (!question.trim() || question.trim().length < 10 || question.trim().length > 500) {
      return false;
    }
    if (!answer.trim() || answer.trim().length < 20 || answer.trim().length > 5000) {
      return false;
    }
    const { isValid } = validateAndPrepareCitations();
    if (!isValid || validateAndPrepareCitations().citations.length === 0) {
      return false;
    }
    // Phase 2: SME review validation will be added when UI is implemented
    // if (requestSmeReview && assignees.length === 0) {
    //   return false;
    // }
    return true;
  }, [question, answer, validateAndPrepareCitations]);

  // Handle tag input
  const handleAddTag = useCallback(() => {
    const trimmed = tagInput.trim();
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
      setTagInput('');
    }
  }, [tagInput, tags]);

  const handleRemoveTag = useCallback((tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  }, [tags]);

  // Handle submit
  const handleSubmit = useCallback(async () => {
    if (!isFormValid || loading) return;

    // Validate citations
    const { citations: apiCitations, errors: citationErrors, isValid } = validateAndPrepareCitations();
    setErrors(citationErrors);

    if (!isValid || apiCitations.length === 0) {
      toast.error('Please fix citation errors before submitting.');
      return;
    }

    // Validate question and answer
    if (question.trim().length < 10 || question.trim().length > 500) {
      toast.error('Question must be between 10 and 500 characters.');
      return;
    }
    if (answer.trim().length < 20 || answer.trim().length > 5000) {
      toast.error('Answer must be between 20 and 5000 characters.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/admin/inbox/manual', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: question.trim(),
          answer: answer.trim(),
          citations: apiCitations,
          tags: tags,
          as_faq: true,
          request_sme_review: requestSmeReview,
          assignees: requestSmeReview ? assignees : [],
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.details || errorData.error || 'Failed to create FAQ';
        toast.error(errorMessage);
        return;
      }

      const data = await response.json();
      toast.success('FAQ draft created and sent to inbox');
      resetForm();
      handleClose();
      onSuccess();
    } catch (err) {
      console.error('Manual FAQ creation error:', err);
      toast.error('Failed to create FAQ. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [isFormValid, loading, question, answer, tags, requestSmeReview, assignees, validateAndPrepareCitations, handleClose, onSuccess, resetForm]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/30 backdrop-blur-[2px]"
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-label="Create FAQ Manually"
    >
      <Card
        className="w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col m-4 bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <CardHeader className="flex-shrink-0 flex flex-row items-center justify-between border-b">
          <CardTitle>Create FAQ Manually</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            disabled={loading}
            aria-label="Close dialog"
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-6 overflow-y-auto flex-1 pt-6">
          {/* Question */}
          <div className="space-y-2">
            <Label htmlFor="manual-question">
              Question <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="manual-question"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Enter the question (10-500 characters)"
              rows={3}
              disabled={loading}
              className={question.trim().length > 0 && (question.trim().length < 10 || question.trim().length > 500) ? 'border-destructive' : ''}
            />
            <div className="text-xs text-muted-foreground">
              {question.trim().length}/500 characters
              {question.trim().length > 0 && question.trim().length < 10 && (
                <span className="text-destructive ml-2">(Minimum 10 characters required)</span>
              )}
            </div>
          </div>

          {/* Answer */}
          <div className="space-y-2">
            <Label htmlFor="manual-answer">
              Answer <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="manual-answer"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Enter the answer (20-5000 characters)"
              rows={6}
              disabled={loading}
              className={answer.trim().length > 0 && (answer.trim().length < 20 || answer.trim().length > 5000) ? 'border-destructive' : ''}
            />
            <div className="text-xs text-muted-foreground">
              {answer.trim().length}/5000 characters
              {answer.trim().length > 0 && answer.trim().length < 20 && (
                <span className="text-destructive ml-2">(Minimum 20 characters required)</span>
              )}
            </div>
          </div>

          {/* Citations */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>
                Citations <span className="text-destructive">*</span>
              </Label>
              <Badge variant="secondary" className="text-[11px]">Required</Badge>
            </div>
            <CitationsEditor
              value={citations}
              onChange={setCitations}
              errors={errors}
              readOnly={false}
              disabled={loading}
              maxCount={3}
              docOptions={docOptions}
              docOptionsLoading={docOptionsLoading}
              docOptionsError={docOptionsError}
              onReloadDocOptions={loadDocOptions}
            />
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label htmlFor="manual-tags">Tags (Optional)</Label>
            <div className="flex gap-2">
              <input
                id="manual-tags"
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                placeholder="Enter tag and press Enter"
                disabled={loading}
                className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleAddTag}
                disabled={loading || !tagInput.trim()}
              >
                Add
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="outline"
                    className="text-[11px]"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      disabled={loading}
                      className="ml-2 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* SME Review Toggle - Phase 2 feature, will be implemented in Phase 2 */}
        </CardContent>
        <div className="flex justify-end gap-2 p-4 border-t flex-shrink-0">
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant="ghost" onClick={handleReset} disabled={loading}>
            Reset
          </Button>
          <Button onClick={handleSubmit} disabled={!isFormValid || loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              'Create FAQ'
            )}
          </Button>
        </div>
      </Card>
    </div>
  );
}

