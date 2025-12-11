'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { toast } from 'sonner';
import {
  Loader2,
  Save,
  RefreshCw,
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  FileText,
  Eye,
  Pencil,
  Download,
  Copy,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { Breadcrumbs } from './Breadcrumbs';
import type {
  Draft,
  UpdateDraftRequest,
  KnowledgeErrorResponse,
} from '@/lib/types/knowledge';

type CitationsEditorProps = {
  citations: Draft['citations'];
  onChange: (citations: Draft['citations']) => void;
};

function CitationsEditor({ citations = [], onChange }: CitationsEditorProps) {
  const [docTitles, setDocTitles] = useState<Record<string, string>>({});
  const [loadingDocs, setLoadingDocs] = useState<Set<string>>(new Set());
  const fetchedRef = useRef<Set<string>>(new Set());

  // Fetch document title for a given doc_id
  const fetchDocTitle = useCallback(async (docId: string) => {
    if (!docId || docId.trim() === '') return;
    
    // Skip if already fetched (using ref to avoid stale closures)
    if (fetchedRef.current.has(docId)) {
      return;
    }

    // Mark as fetched and loading
    fetchedRef.current.add(docId);
    setLoadingDocs((prev) => new Set(prev).add(docId));

    try {
      const res = await fetch(`/api/admin/docs/${encodeURIComponent(docId)}`, {
        cache: 'no-store',
      });

      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        
        // Log the response to debug
        console.log('[CitationsEditor] Document fetch response:', {
          docId,
          status: res.status,
          dataKeys: Object.keys(data || {}),
          hasTitle: !!data.title,
          hasFileName: !!data.file_name,
          hasId: !!data.id,
          hasDocId: !!data.doc_id,
          dataSample: JSON.stringify(data).slice(0, 300),
        });
        
        // Try different possible field names and structures
        // Admin API might return: { id, title, ... } or { doc_id, title, ... }
        const title = 
          data.title || 
          data.file_name || 
          data.name ||
          (data.doc && (data.doc.title || data.doc.file_name)) ||
          null;
        
        if (!title) {
          console.warn('[CitationsEditor] Could not find title in response:', {
            docId,
            dataKeys: Object.keys(data || {}),
            data,
          });
          setDocTitles((prev) => {
            if (!prev[docId]) {
              return { ...prev, [docId]: 'Unknown Document' };
            }
            return prev;
          });
        } else {
          setDocTitles((prev) => {
            // Only update if we don't already have it (avoid overwriting)
            if (!prev[docId]) {
              return { ...prev, [docId]: title };
            }
            return prev;
          });
        }
      } else {
        // Document not found or error - log and set placeholder
        const errorText = await res.text().catch(() => '');
        console.error('[CitationsEditor] Document fetch failed:', {
          docId,
          status: res.status,
          statusText: res.statusText,
          error: errorText.slice(0, 200),
        });
        
        setDocTitles((prev) => {
          if (!prev[docId]) {
            const errorMsg = res.status === 404 
              ? 'Document not found' 
              : res.status === 403
              ? 'Access denied'
              : `Error (${res.status})`;
            return { ...prev, [docId]: errorMsg };
          }
          return prev;
        });
      }
    } catch (err) {
      console.error('[CitationsEditor] Failed to fetch document:', {
        docId,
        error: err,
      });
      setDocTitles((prev) => {
        if (!prev[docId]) {
          return { ...prev, [docId]: 'Error loading document' };
        }
        return prev;
      });
    } finally {
      setLoadingDocs((prev) => {
        const next = new Set(prev);
        next.delete(docId);
        return next;
      });
    }
  }, []); // No dependencies - uses ref and functional updates

  // Fetch titles for all citations when they change
  useEffect(() => {
    citations.forEach((citation) => {
      const docId = citation.doc_id?.trim();
      if (docId && !fetchedRef.current.has(docId)) {
        fetchDocTitle(docId);
      }
    });
  }, [citations, fetchDocTitle]);

  const updateCitation = (index: number, field: string, value: string | number) => {
    const updated = [...citations];
    if (!updated[index]) {
      updated[index] = { doc_id: '' };
    }
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
    
    // If doc_id changed, fetch the new document title
    if (field === 'doc_id' && typeof value === 'string' && value.trim() !== '') {
      fetchDocTitle(value);
    }
  };

  const removeCitation = (index: number) => {
    const updated = citations.filter((_, i) => i !== index);
    onChange(updated);
  };

  const addCitation = () => {
    onChange([...citations, { doc_id: '' }]);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label>Citations</Label>
        <Button variant="outline" size="sm" onClick={addCitation}>
          Add Citation
        </Button>
      </div>
      {citations.length === 0 ? (
        <p className="text-sm text-slate-500">No citations added yet.</p>
      ) : (
        <div className="space-y-2">
          {citations.map((citation, index) => {
            const docId = citation.doc_id || '';
            const docTitle = docId ? docTitles[docId] : null;
            const isLoading = docId ? loadingDocs.has(docId) : false;
            const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(docId);

            return (
              <div key={index} className="flex items-start gap-2 p-3 border rounded-lg bg-slate-50/50">
                <div className="flex-1 space-y-2">
                  {/* Document name display */}
                  {docId && (
                    <div className="space-y-1">
                      {isLoading ? (
                        <div className="flex items-center gap-2 text-sm text-slate-500">
                          <Loader2 className="h-3 w-3 animate-spin" />
                          <span>Loading document...</span>
                        </div>
                      ) : docTitle ? (
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-slate-400 flex-shrink-0" />
                          <span className="text-sm font-medium text-slate-700 truncate" title={docTitle}>
                            {docTitle}
                          </span>
                        </div>
                      ) : isUuid ? (
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-slate-400 flex-shrink-0" />
                          <span className="text-sm text-slate-500 font-mono">
                            {docId.substring(0, 8)}...
                          </span>
                        </div>
                      ) : null}
                    </div>
                  )}
                  
                  {/* Document ID input */}
                  <div className="space-y-1">
                    <Label htmlFor={`citation-doc-${index}`} className="text-xs text-slate-600">
                      Document ID
                    </Label>
                    <Input
                      id={`citation-doc-${index}`}
                      placeholder="Enter document UUID..."
                      value={docId}
                      onChange={(e) => updateCitation(index, 'doc_id', e.target.value)}
                      className="font-mono text-sm"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      type="number"
                      placeholder="Page (optional)"
                      value={citation.page || ''}
                      onChange={(e) =>
                        updateCitation(index, 'page', e.target.value ? parseInt(e.target.value) : 0)
                      }
                    />
                    <Input
                      placeholder="Span (optional)"
                      value={citation.span || ''}
                      onChange={(e) => updateCitation(index, 'span', e.target.value)}
                    />
                  </div>
                  {citation.text && (
                    <Textarea
                      placeholder="Citation text (optional)"
                      value={citation.text}
                      onChange={(e) => updateCitation(index, 'text', e.target.value)}
                      rows={2}
                    />
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeCitation(index)}
                  className="mt-1"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

type Props = {
  draftId: string;
};

export function DraftEditorClient({ draftId }: Props) {
  const router = useRouter();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<'preview' | 'edit'>('preview');
  const [copyState, setCopyState] = useState<'idle' | 'copied'>('idle');
  const [copyPlainState, setCopyPlainState] = useState<'idle' | 'copied'>('idle');
  const [editingAnswer, setEditingAnswer] = useState<string>('');
  const editContentRef = useRef<HTMLDivElement>(null);
  const [formData, setFormData] = useState<UpdateDraftRequest>({
    question: '',
    answer: '',
    status: 'draft',
    category: '',
    channel: '',
    citations: [],
  });
  const modeLabel = (() => {
    const m = (draft as any)?.metadata?.origin?.mode;
    return m === 'multi_candidate' ? 'Comparison' : 'Single';
  })();
  const candidatesMeta = ((draft as any)?.metadata?.candidates as any[]) || [];
  // Structured recruiter brief (optional)
  const recruiterBrief = (draft as any)?.metadata?.recruiter_brief;
  const templateDomain = (draft as any)?.template_domain;
  const isRecruiterBrief = templateDomain === 'recruiter' && recruiterBrief;
  const shortlist = recruiterBrief?.shortlist || [];
  const candidatesStructured = recruiterBrief?.candidates || [];
  const comparisonRows = recruiterBrief?.comparison_rows || [];
  const topFitLabel = recruiterBrief?.scores?.overall_top_fit_label;
  const topFitPercent = recruiterBrief?.scores?.overall_top_fit_percent;
  const candidateById = candidatesStructured.reduce((acc: Record<string, any>, c: any) => {
    if (c?.candidate_id) acc[c.candidate_id] = c;
    return acc;
  }, {});
  const [confirmationDialog, setConfirmationDialog] = useState<{
    open: boolean;
    title: string;
    message: string;
    confirmText: string;
    variant: 'default' | 'destructive' | 'warning';
    onConfirm: (() => void) | null;
  }>({
    open: false,
    title: '',
    message: '',
    confirmText: 'Confirm',
    variant: 'default',
    onConfirm: null,
  });

  // Fetch draft
  const fetchDraft = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/admin/knowledge/drafts/${draftId}`, { cache: 'no-store' });

      if (res.status === 401) {
        setError('Authentication required. Please sign in again.');
        return;
      }

      if (res.status === 403) {
        const errorData = (await res.json().catch(() => ({}))) as KnowledgeErrorResponse;
        if (errorData.detail === 'feature_not_enabled') {
          setError('This feature is not available for your plan. Contact support to upgrade.');
        } else {
          setError('Knowledge Studio is not enabled for this tenant.');
        }
        return;
      }

      if (res.status === 404) {
        setError('Draft not found. It may have been deleted.');
        return;
      }

      if (!res.ok) {
        const errorData = (await res.json().catch(() => ({}))) as KnowledgeErrorResponse;
        setError(errorData.detail || errorData.message || `Failed to load draft (${res.status})`);
        return;
      }

      const data: Draft = await res.json();
      setDraft(data);
      setFormData({
        question: data.question || '',
        answer: data.answer || '',
        status: data.status,
        category: data.category || '',
        channel: data.channel || '',
        citations: data.citations || [],
      });
      setEditingAnswer(data.answer || '');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load draft');
    } finally {
      setLoading(false);
    }
  }, [draftId]);

  useEffect(() => {
    fetchDraft();
  }, [fetchDraft]);

  // Save draft (with optional overrides, e.g., approve)
  const handleSave = async (override?: Partial<UpdateDraftRequest>) => {
    setSaving(true);
    try {
      // If in edit mode, sync editingAnswer to formData.answer
      const answerToSave = mode === 'edit' ? editingAnswer : formData.answer;
      
      const res = await fetch(`/api/admin/knowledge/drafts/${draftId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, answer: answerToSave, ...override }),
      });

      if (!res.ok) {
        const errorData = (await res.json().catch(() => ({}))) as KnowledgeErrorResponse;
        toast.error(errorData.detail || errorData.message || 'Failed to save draft');
        return;
      }

      const updated: Draft = await res.json();
      setDraft(updated);
      setFormData({
        ...formData,
        answer: updated.answer || '',
      });
      setEditingAnswer(updated.answer || '');
      
      // Exit edit mode after save
      if (mode === 'edit') {
        setMode('preview');
      }
      
      toast.success('Draft saved successfully');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save draft');
    } finally {
      setSaving(false);
    }
  };

  // Handle edit mode entry
  const handleStartEdit = () => {
    setEditingAnswer(formData.answer || '');
    setMode('edit');
    // Set content after a brief delay to ensure DOM is ready
    setTimeout(() => {
      if (editContentRef.current) {
        editContentRef.current.innerHTML = formData.answer || '';
      }
    }, 0);
  };

  // Handle cancel edit
  const handleCancelEdit = () => {
    setEditingAnswer(formData.answer || '');
    setMode('preview');
  };

  const handleApprove = async () => {
    await handleSave({ status: 'approved' });
    toast.success('Draft approved');
  };

  const handleDownloadPdf = async () => {
    try {
      const res = await fetch(`/api/admin/knowledge/drafts/${draftId}/pdf`, {
        method: 'GET',
      });
      if (!res.ok) {
        const errorText = await res.text().catch(() => '');
        toast.error(`Failed to download PDF (${res.status})`);
        console.error('PDF download failed', { status: res.status, errorText });
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `draft-${draftId}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      toast.success('PDF downloaded');
    } catch (err) {
      console.error('PDF download error', err);
      toast.error('Failed to download PDF');
    }
  };

  // Copy rich text (works in Gmail/email clients)
  const handleCopyRichText = async () => {
    try {
      if (!formData.answer) {
        toast.error('No content to copy');
        return;
      }

      // Create a temporary element to hold the HTML
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = formData.answer;
      tempDiv.style.position = 'fixed';
      tempDiv.style.left = '-9999px';
      document.body.appendChild(tempDiv);

      const htmlContent = formData.answer;
      const plainContent = tempDiv.textContent || tempDiv.innerText || '';

      // Try modern Clipboard API with ClipboardItem (supports HTML)
      try {
        if (navigator.clipboard && typeof (window as any).ClipboardItem !== 'undefined') {
          const ClipboardItem = (window as any).ClipboardItem;
          const clipboardItem = new ClipboardItem({
            'text/html': new Blob([htmlContent], { type: 'text/html' }),
            'text/plain': new Blob([plainContent], { type: 'text/plain' }),
          });
          await navigator.clipboard.write([clipboardItem]);
          document.body.removeChild(tempDiv);
          setCopyState('copied');
          toast.success('Content copied (formatted)');
          setTimeout(() => setCopyState('idle'), 2000);
          return;
        }
      } catch (clipboardItemErr) {
        // ClipboardItem failed, fall through to execCommand
        console.log('ClipboardItem not supported, using fallback');
      }

      // Fallback: Use execCommand (works in most browsers, preserves formatting in Gmail)
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(tempDiv);
      selection?.removeAllRanges();
      selection?.addRange(range);
      const success = document.execCommand('copy');
      selection?.removeAllRanges();
      document.body.removeChild(tempDiv);

      if (success) {
        setCopyState('copied');
        toast.success('Content copied (formatted)');
        setTimeout(() => setCopyState('idle'), 2000);
      } else {
        throw new Error('execCommand copy failed');
      }
    } catch (err) {
      console.error('Copy rich text failed', err);
      // Final fallback: plain text
      try {
        const text = (() => {
          if (!formData.answer) return '';
          const tmp = document.createElement('div');
          tmp.innerHTML = formData.answer;
          return tmp.textContent || tmp.innerText || '';
        })();
        await navigator.clipboard.writeText(text);
        setCopyState('copied');
        toast.success('Content copied (plain text)');
        setTimeout(() => setCopyState('idle'), 2000);
      } catch (fallbackErr) {
        toast.error('Failed to copy content');
      }
    }
  };

  // Copy as plain text (strips formatting)
  const handleCopyPlain = async () => {
    try {
      const text = (() => {
        if (!formData.answer) return '';
        const tmp = document.createElement('div');
        tmp.innerHTML = formData.answer;
        return tmp.textContent || tmp.innerText || '';
      })();
      await navigator.clipboard.writeText(text);
      setCopyPlainState('copied');
      toast.success('Plain text copied');
      setTimeout(() => setCopyPlainState('idle'), 2000);
    } catch (err) {
      console.error('Copy plain failed', err);
      toast.error('Failed to copy plain text');
    }
  };

  // Regenerate draft
  const handleRegenerate = async () => {
    setRegenerating(true);
    try {
      const res = await fetch(`/api/admin/knowledge/drafts/${draftId}/regenerate`, {
        method: 'POST',
      });

      if (!res.ok) {
        const errorData = (await res.json().catch(() => ({}))) as KnowledgeErrorResponse;
        toast.error(errorData.detail || errorData.message || 'Failed to regenerate draft');
        return;
      }

      const regenerated: Draft = await res.json();
      setDraft(regenerated);
      setFormData({
        question: regenerated.question || '',
        answer: regenerated.answer || '',
        status: regenerated.status,
        category: regenerated.category || '',
        channel: regenerated.channel || '',
        citations: regenerated.citations || [],
      });
      setEditingAnswer(regenerated.answer || '');
      toast.success('Draft regenerated successfully');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to regenerate draft');
    } finally {
      setRegenerating(false);
    }
  };

  // Delete draft
  const handleDelete = async () => {
    try {
      const res = await fetch(`/api/admin/knowledge/drafts/${draftId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const errorData = (await res.json().catch(() => ({}))) as KnowledgeErrorResponse;
        toast.error(errorData.detail || errorData.message || 'Failed to delete draft');
        return;
      }

      toast.success('Draft deleted successfully');
      router.push('/admin/knowledge/drafts');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete draft');
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
        </CardContent>
      </Card>
    );
  }

  if (error || !draft) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center space-y-4">
            <AlertCircle className="h-12 w-12 mx-auto text-red-400" />
            <div>
              <h3 className="font-semibold text-slate-900 mb-1">Error loading draft</h3>
              <p className="text-sm text-slate-600">{error || 'Draft not found'}</p>
            </div>
            <Button variant="outline" asChild>
              <Link href="/admin/knowledge/drafts">Back to Drafts</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      {/* Breadcrumbs */}
      <Breadcrumbs 
        items={[
          { label: 'Drafts', href: '/admin/knowledge/drafts' },
          { label: 'Edit Draft' }
        ]} 
        className="mb-4"
      />
      
      <div className="space-y-4 sm:space-y-6">
        {/* Top banner & actions */}
        <Card className="shadow-sm border border-slate-200">
          <CardContent className="py-4">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="space-y-1">
                  <div className="text-xs uppercase tracking-wide text-slate-500">Template</div>
                  <div className="text-lg font-semibold text-slate-900">
                    {draft.template_id ? `Template: ${draft.template_id.slice(0, 8)}…` : 'Custom Draft'}
                  </div>
                  <div className="text-xs text-slate-500">
                    Last updated {new Date(draft.updated_at).toLocaleString()}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge className={draft.status === 'approved' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-slate-100 text-slate-700 border-slate-200'}>
                    {draft.status === 'approved' ? (
                      <span className="flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" /> Approved
                      </span>
                    ) : (
                      'Draft'
                    )}
                  </Badge>
                  <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-200">
                    {modeLabel === 'Comparison' ? 'Comparison mode' : 'Single candidate'}
                  </Badge>
                </div>
              </div>

                <div className="flex flex-wrap items-center gap-2">
                <Button variant="outline" size="sm" onClick={handleDownloadPdf}>
                  <Download className="h-4 w-4 mr-2" />
                  Download PDF
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRegenerate}
                  disabled={regenerating || saving}
                >
                  {regenerating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Regenerating...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Regenerate
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleApprove}
                  disabled={saving || regenerating}
                  className="border-green-200 text-green-700 hover:bg-green-50"
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Approve
                </Button>
              </div>

              {candidatesMeta.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {candidatesMeta.map((c, idx) => (
                    <Badge key={`${c.id || c.name || idx}`} variant="outline" className="flex items-center gap-2">
                      <span className="font-medium">{c.name || c.id || `Candidate ${idx + 1}`}</span>
                      {c.label && (
                        <span className="text-xs text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                          {c.label}
                        </span>
                      )}
                      {typeof c.score === 'number' && (
                        <span className="text-xs text-slate-500">Score {(c.score * 100).toFixed(0)}%</span>
                      )}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Needs input warning */}
        {draft.needs_input && (
          <Card className="border-amber-200 bg-amber-50 shadow-sm">
            <CardContent className="py-3 sm:py-4">
              <div className="flex items-start gap-3 text-amber-700">
                <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                <p className="text-sm font-medium">
                  This draft needs manual input or refinement before it can be approved.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main editor */}
        <Card className="shadow-sm">
          <CardHeader className="border-b border-slate-100">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
              <div className="space-y-1">
                <CardTitle className="text-xl sm:text-2xl font-bold">Draft</CardTitle>
                <CardDescription className="text-sm sm:text-base">
                  View the formatted draft in preview mode, or click Edit to make changes with WYSIWYG editing.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Recruiter structured brief (optional) */}
            {isRecruiterBrief && (
              <div className="space-y-4 border rounded-lg p-4 bg-slate-50">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div className="space-y-1">
                    <div className="text-xs uppercase tracking-wide text-indigo-600 font-semibold">
                      Recruiter Summary (structured)
                    </div>
                    <div className="text-lg font-semibold text-slate-900">
                      {draft.template_id || 'Recruiter Brief'}
                    </div>
                    {(topFitLabel || topFitPercent) && (
                      <div className="text-sm text-slate-700">
                        Top fit: {topFitLabel ?? '—'}{topFitPercent !== undefined ? ` (${topFitPercent}%)` : ''}
                      </div>
                    )}
                    <div className="text-xs text-slate-500">
                      Candidates: {shortlist.length || candidatesStructured.length || 0}
                    </div>
                  </div>
                  {recruiterBrief?.warnings?.length ? (
                    <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                      ⚠️ Warnings
                    </Badge>
                  ) : null}
                </div>

                {/* Warnings */}
                {recruiterBrief?.warnings?.length ? (
                  <div className="flex items-start gap-3 p-3 border border-amber-200 rounded-lg bg-amber-50">
                    <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                    <div className="space-y-1">
                      <div className="font-semibold text-amber-800 text-sm">Warnings</div>
                      <ul className="list-disc list-inside text-sm text-amber-800 space-y-1">
                        {recruiterBrief.warnings.map((w: string, idx: number) => (
                          <li key={idx}>{w}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ) : null}

                {/* Shortlist */}
                {shortlist.length > 0 ? (
                  <div className="space-y-2">
                    <div className="font-semibold text-slate-900">Shortlist</div>
                    <ol className="list-decimal list-inside text-sm text-slate-700 space-y-1">
                      {([...shortlist] as any[]).sort((a, b) => (a.rank || 0) - (b.rank || 0)).map((s, idx) => (
                        <li key={s.candidate_id || idx}>
                          {s.display_name || s.candidate_id || 'Candidate'} — {s.fit_label || '—'}{s.fit_percent !== undefined ? ` (${s.fit_percent}%)` : ''}
                        </li>
                      ))}
                    </ol>
                  </div>
                ) : (
                  <div className="text-sm text-slate-500">No candidates were scored. Check if JD and CVs are correctly tagged.</div>
                )}

                {/* Candidate cards */}
                {candidatesStructured.length > 0 && (
                  <div className="space-y-3">
                    <div className="font-semibold text-slate-900">Candidate Cards</div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {candidatesStructured.map((c: any, idx: number) => (
                        <div key={c.candidate_id || idx} className="border rounded-lg bg-white p-3 space-y-2 shadow-sm">
                          <div className="flex items-start justify-between gap-2">
                            <div className="space-y-1">
                              <div className="font-semibold text-slate-900">{c.display_name || c.candidate_id || `Candidate ${idx + 1}`}</div>
                              <div className="text-sm text-slate-700">
                                Fit: <span className="font-semibold">{c.fit_label || '—'}</span>
                                {c.fit_percent !== undefined ? ` (${c.fit_percent}%)` : ''}
                              </div>
                              {typeof c.must_have_coverage === 'number' && (
                                <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                                  Must-haves: {(c.must_have_coverage * 100).toFixed(0)}%
                                </Badge>
                              )}
                            </div>
                          </div>
                          {/* Strengths */}
                          {Array.isArray(c.strengths) && c.strengths.length > 0 && (
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                                ✅ Strengths
                              </div>
                              <ul className="list-disc list-inside text-sm text-slate-700 space-y-1">
                                {c.strengths.map((s: any, sIdx: number) => (
                                  <li key={sIdx}>
                                    <span className="font-medium">{s.label || s.dimension}</span>
                                    {s.snippet ? <span className="text-slate-600"> — {s.snippet}</span> : null}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {/* Gaps */}
                          {Array.isArray(c.gaps) && c.gaps.length > 0 && (
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                                ⚠️ Gaps
                              </div>
                              <ul className="list-disc list-inside text-sm text-slate-700 space-y-1">
                                {c.gaps.map((g: any, gIdx: number) => (
                                  <li key={gIdx}>
                                    <span className="font-medium">{g.label || g.dimension}</span>
                                    {g.snippet ? <span className="text-slate-600"> — {g.snippet}</span> : null}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Skills comparison */}
                {comparisonRows.length > 0 && (
                  <div className="space-y-2">
                    <div className="font-semibold text-slate-900">Skills Comparison</div>
                    <div className="w-full overflow-x-auto">
                      <table className="min-w-full border border-slate-200 text-sm">
                        <thead className="bg-slate-100">
                          <tr>
                            <th className="border border-slate-200 px-3 py-2 text-left font-semibold text-slate-800">Requirement</th>
                            {candidatesStructured.map((c: any, idx: number) => (
                              <th key={c.candidate_id || idx} className="border border-slate-200 px-3 py-2 text-left font-semibold text-slate-800">
                                {c.display_name || c.candidate_id || `Candidate ${idx + 1}`}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {comparisonRows.map((row: any, rIdx: number) => (
                            <tr key={row.dimension || rIdx} className={rIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                              <td className="border border-slate-200 px-3 py-2 align-top">
                                <div className="font-semibold text-slate-800">{row.label || row.dimension || 'Requirement'}</div>
                                {row.importance === 'must_have' && (
                                  <Badge variant="outline" className="text-xs bg-red-50 text-red-700 border-red-200 mt-1">
                                    Must-have
                                  </Badge>
                                )}
                                {row.jd_note && (
                                  <div className="text-xs text-slate-600 mt-1">{row.jd_note}</div>
                                )}
                              </td>
                              {candidatesStructured.map((c: any, cIdx: number) => {
                                const cell = (row.candidates || []).find((rc: any) => rc.candidate_id === c.candidate_id) || {};
                                return (
                                  <td key={c.candidate_id || cIdx} className="border border-slate-200 px-3 py-2 align-top">
                                    <div className="font-medium text-slate-800">{cell.badge || '—'}</div>
                                    {cell.snippet ? (
                                      <div className="text-xs text-slate-600 mt-1 whitespace-pre-wrap">{cell.snippet}</div>
                                    ) : null}
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Question */}
            <div className="space-y-2">
              <Label htmlFor="question">Question</Label>
              <Textarea
                id="question"
                value={formData.question}
                onChange={(e) => setFormData((prev) => ({ ...prev, question: e.target.value }))}
                placeholder="Enter the question..."
                rows={3}
                className="font-medium"
              />
            </div>

            {/* Answer with Preview/Edit mode */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Answer</Label>
                {mode === 'preview' ? (
                  <div className="flex items-center gap-2 flex-wrap justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCopyRichText}
                      className="flex items-center gap-1"
                    >
                      {copyState === 'copied' ? (
                        <>
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4" />
                          <span>Copy</span>
                        </>
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleCopyPlain}
                      className="flex items-center gap-1 text-slate-600"
                    >
                      {copyPlainState === 'copied' ? (
                        <>
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4" />
                          <span>Copy as Plain Text</span>
                        </>
                      )}
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={handleStartEdit}
                    >
                      <Pencil className="h-4 w-4 mr-1.5" />
                      Edit
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 flex-wrap justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCancelEdit}
                      disabled={saving}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => handleSave()}
                      disabled={saving}
                    >
                      {saving ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-1.5" />
                          Save
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>

              {mode === 'preview' ? (
                <div className="prose prose-slate max-w-none border rounded-lg p-4 bg-white shadow-sm min-h-[200px] prose-headings:text-slate-900 prose-strong:text-slate-900 prose-p:text-slate-900 prose-li:text-slate-900 prose-a:text-blue-600 hover:prose-a:text-blue-700">
                  {formData.answer ? (
                    <div dangerouslySetInnerHTML={{ __html: formData.answer }} />
                  ) : (
                    <p className="text-sm text-slate-500">No content yet.</p>
                  )}
                </div>
              ) : (
                <div className="border rounded-lg p-4 bg-white shadow-sm">
                  <div
                    ref={editContentRef}
                    contentEditable
                    suppressContentEditableWarning
                    onInput={(e) => {
                      const target = e.currentTarget;
                      if (target) {
                        setEditingAnswer(target.innerHTML);
                      }
                    }}
                    className="min-h-[300px] p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-md prose prose-slate max-w-none prose-headings:text-slate-900 prose-strong:text-slate-900 prose-p:text-slate-900 prose-li:text-slate-900 prose-a:text-blue-600 hover:prose-a:text-blue-700"
                    style={{
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                    }}
                  />
                  <p className="mt-3 text-xs text-slate-500">
                    Tip: Edit directly in the formatted view. Use <strong>Ctrl+B</strong> for bold, <strong>Ctrl+I</strong> for italic, or right-click for formatting options.
                  </p>
                </div>
              )}
            </div>

            {/* Metadata */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  id="status"
                  value={formData.status}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, status: e.target.value as 'draft' | 'approved' }))
                  }
                >
                  <option value="draft">Draft</option>
                  <option value="approved">Approved</option>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData((prev) => ({ ...prev, category: e.target.value }))}
                  placeholder="e.g., recruiter, legal"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="channel">Channel</Label>
                <Input
                  id="channel"
                  value={formData.channel}
                  onChange={(e) => setFormData((prev) => ({ ...prev, channel: e.target.value }))}
                  placeholder="e.g., email, faq"
                />
              </div>
            </div>

            {/* Citations */}
            <div className="border-t pt-6 space-y-3">
              <div className="flex items-center justify-between">
                <Label>Citations</Label>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.citations && formData.citations.length > 0 ? (
                  formData.citations.map((cite, idx) => (
                    <Badge key={`${cite.doc_id}-${idx}`} variant="outline" className="cursor-pointer">
                      {cite.doc_id?.slice(0, 8) || 'Doc'}
                      {cite.page ? ` • p${cite.page}` : ''}
                    </Badge>
                  ))
                ) : (
                  <span className="text-sm text-slate-500">No citations yet.</span>
                )}
              </div>
              <CitationsEditor
                citations={formData.citations}
                onChange={(citations) => setFormData((prev) => ({ ...prev, citations }))}
              />
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-6 border-t border-slate-200">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
                <Button 
                  variant="outline" 
                  asChild
                  className="min-h-[44px] sm:min-h-0 w-full sm:w-auto order-3 sm:order-1"
                >
                  <Link href="/admin/knowledge/drafts" className="flex items-center justify-center gap-2">
                    <ArrowLeft className="h-4 w-4" />
                    <span>Back to Drafts</span>
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  onClick={handleRegenerate}
                  disabled={regenerating || saving}
                  className="min-h-[44px] sm:min-h-0 w-full sm:w-auto order-2 sm:order-2"
                >
                  {regenerating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      <span>Regenerating...</span>
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      <span>Regenerate</span>
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setConfirmationDialog({
                      open: true,
                      title: 'Delete Draft',
                      message: 'Are you sure you want to delete this draft? This action cannot be undone.',
                      confirmText: 'Delete',
                      variant: 'destructive',
                      onConfirm: handleDelete,
                    });
                  }}
                  disabled={saving || regenerating}
                  className="min-h-[44px] sm:min-h-0 w-full sm:w-auto order-1 sm:order-3 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  <span>Delete</span>
                </Button>
              </div>
              <Button 
                onClick={() => handleSave()} 
                disabled={saving || regenerating} 
                className="min-h-[44px] sm:min-h-0 w-full sm:w-auto sm:min-w-[140px] order-1 sm:order-4"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    <span>Save Draft</span>
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Insights placeholder */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Insights
            </CardTitle>
            <CardDescription>AI-powered insights and suggestions (coming soon)</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-500 text-center py-8">
              Insights feature will provide suggestions for improving your draft content.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        open={confirmationDialog.open}
        onClose={() => {
          setConfirmationDialog((prev) => ({ ...prev, open: false }));
        }}
        title={confirmationDialog.title}
        message={confirmationDialog.message}
        confirmText={confirmationDialog.confirmText}
        variant={confirmationDialog.variant}
        onConfirm={() => {
          if (confirmationDialog.onConfirm) {
            confirmationDialog.onConfirm();
          }
          setConfirmationDialog((prev) => ({ ...prev, open: false }));
        }}
      />
    </>
  );
}

