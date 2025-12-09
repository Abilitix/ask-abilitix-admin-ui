'use client';

import { useState, useEffect, useCallback } from 'react';
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
  Sparkles,
  Trash2,
} from 'lucide-react';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
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
  const updateCitation = (index: number, field: string, value: string | number) => {
    const updated = [...citations];
    if (!updated[index]) {
      updated[index] = { doc_id: '' };
    }
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
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
          {citations.map((citation, index) => (
            <div key={index} className="flex items-start gap-2 p-3 border rounded-lg">
              <div className="flex-1 space-y-2">
                <Input
                  placeholder="Document ID"
                  value={citation.doc_id || ''}
                  onChange={(e) => updateCitation(index, 'doc_id', e.target.value)}
                />
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
          ))}
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
  const [formData, setFormData] = useState<UpdateDraftRequest>({
    question: '',
    answer: '',
    status: 'draft',
    category: '',
    channel: '',
    citations: [],
  });
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

  // Save draft
  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/knowledge/drafts/${draftId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
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
      <div className="space-y-4">
        {/* Needs input warning */}
        {draft.needs_input && (
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="py-3">
              <div className="flex items-center gap-2 text-amber-700">
                <AlertCircle className="h-5 w-5" />
                <p className="text-sm font-medium">
                  This draft needs manual input or refinement before it can be approved.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main editor */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Edit Draft</CardTitle>
                <CardDescription>
                  {draft.template_id && (
                    <span className="text-xs">Template: {draft.template_id.slice(0, 8)}...</span>
                  )}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                {draft.status === 'approved' ? (
                  <Badge className="bg-green-100 text-green-700 border-green-200">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Approved
                  </Badge>
                ) : (
                  <Badge variant="outline">Draft</Badge>
                )}
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

            {/* Answer */}
            <div className="space-y-2">
              <Label htmlFor="answer">Answer</Label>
              <Textarea
                id="answer"
                value={formData.answer}
                onChange={(e) => setFormData((prev) => ({ ...prev, answer: e.target.value }))}
                placeholder="Enter the answer..."
                rows={10}
              />
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
            <div className="border-t pt-6">
              <CitationsEditor
                citations={formData.citations}
                onChange={(citations) => setFormData((prev) => ({ ...prev, citations }))}
              />
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-4 border-t">
              <div className="flex items-center gap-2">
                <Button variant="outline" asChild>
                  <Link href="/admin/knowledge/drafts">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Drafts
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  onClick={handleRegenerate}
                  disabled={regenerating}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${regenerating ? 'animate-spin' : ''}`} />
                  Regenerate
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
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </div>
              <Button onClick={handleSave} disabled={saving} className="sm:min-w-[120px]">
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Draft
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

