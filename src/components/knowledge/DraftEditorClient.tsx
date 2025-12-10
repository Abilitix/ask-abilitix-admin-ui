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
  const [copyHtmlState, setCopyHtmlState] = useState<'idle' | 'copied'>('idle');
  const [copyTextState, setCopyTextState] = useState<'idle' | 'copied'>('idle');
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
      const res = await fetch(`/api/admin/knowledge/drafts/${draftId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, ...override }),
      });

      if (!res.ok) {
        const errorData = (await res.json().catch(() => ({}))) as KnowledgeErrorResponse;
        toast.error(errorData.detail || errorData.message || 'Failed to save draft');
        return;
      }

      const updated: Draft = await res.json();
      setDraft(updated);
      toast.success('Draft saved successfully');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save draft');
    } finally {
      setSaving(false);
    }
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

  const handleCopyHtml = async () => {
    try {
      await navigator.clipboard.writeText(formData.answer || '');
      setCopyHtmlState('copied');
      toast.success('Formatted content copied');
      setTimeout(() => setCopyHtmlState('idle'), 1500);
    } catch (err) {
      console.error('Copy formatted failed', err);
      toast.error('Failed to copy formatted content');
    }
  };

  const handleCopyPlain = async () => {
    try {
      const text = (() => {
        if (!formData.answer) return '';
        const tmp = document.createElement('div');
        tmp.innerHTML = formData.answer;
        return tmp.textContent || tmp.innerText || '';
      })();
      await navigator.clipboard.writeText(text);
      setCopyTextState('copied');
      toast.success('Plain text copied');
      setTimeout(() => setCopyTextState('idle'), 1500);
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
                  <Button
                    variant={mode === 'preview' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setMode('preview')}
                    className="min-w-[90px]"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Preview
                  </Button>
                  <Button
                    variant={mode === 'edit' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setMode('edit')}
                    className="min-w-[90px]"
                  >
                    <Pencil className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
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
                <Button variant="outline" size="sm" onClick={handleCopyHtml}>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy HTML
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
                  Preview is rich and formatted; Edit uses a lightweight rich-text surface (no raw HTML shown).
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
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

            {/* Answer with Preview/Edit toggle */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Answer</Label>
                <div className="flex items-center gap-2 flex-wrap justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopyHtml}
                    className="flex items-center gap-1"
                  >
                    {copyHtmlState === 'copied' ? (
                      <>
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <span>Copied (formatted)</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4" />
                        <span>Copy formatted</span>
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopyPlain}
                    className="flex items-center gap-1"
                  >
                    {copyTextState === 'copied' ? (
                      <>
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <span>Copied (plain)</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4" />
                        <span>Copy plain</span>
                      </>
                    )}
                  </Button>
                  <Button
                    variant={mode === 'preview' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setMode('preview')}
                  >
                    <Eye className="h-4 w-4 mr-1.5" />
                    Preview
                  </Button>
                  <Button
                    variant={mode === 'edit' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setMode('edit')}
                  >
                    <Pencil className="h-4 w-4 mr-1.5" />
                    Edit
                  </Button>
                </div>
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
                <div className="border rounded-lg p-3 bg-white shadow-sm">
                  <Textarea
                    value={formData.answer || ''}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        answer: e.target.value,
                      }))
                    }
                    rows={12}
                    className="font-mono text-sm"
                  />
                  <p className="mt-2 text-xs text-slate-500">
                    Tip: Edit in plain text here; Preview shows the rendered formatting. Use Copy formatted or Copy plain as needed.
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

