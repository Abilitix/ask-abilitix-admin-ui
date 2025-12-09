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
import { Badge } from '@/components/ui/badge';
import { Select } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import {
  Loader2,
  Search,
  RefreshCw,
  X,
  Edit,
  Trash2,
  Merge,
  AlertCircle,
  CheckCircle2,
  FileText,
  Calendar,
  Send,
} from 'lucide-react';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { SendPublishModal } from './SendPublishModal';
import type { Draft, DraftListResponse, KnowledgeErrorResponse } from '@/lib/types/knowledge';

type StatusFilter = 'draft' | 'approved' | 'all';
type MergeState = {
  sourceId: string | null;
  targetId: string | null;
};

export function DraftsListClient() {
  const router = useRouter();
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [templateFilter, setTemplateFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [actionLoading, setActionLoading] = useState<Map<string, boolean>>(new Map());
  const [mergeState, setMergeState] = useState<MergeState>({ sourceId: null, targetId: null });
  const [selectedDraftIds, setSelectedDraftIds] = useState<Set<string>>(new Set());
  const [sendModalOpen, setSendModalOpen] = useState(false);
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

  // Fetch drafts
  const fetchDrafts = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }
      if (templateFilter !== 'all') {
        params.append('template_id', templateFilter);
      }
      if (categoryFilter !== 'all') {
        params.append('category', categoryFilter);
      }

      const queryString = params.toString();
      const url = `/api/admin/knowledge/drafts${queryString ? `?${queryString}` : ''}`;

      const res = await fetch(url, { cache: 'no-store' });

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

      if (!res.ok) {
        const errorData = (await res.json().catch(() => ({}))) as KnowledgeErrorResponse;
        setError(errorData.detail || errorData.message || `Failed to load drafts (${res.status})`);
        return;
      }

      const data: DraftListResponse = await res.json();
      setDrafts(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load drafts');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, templateFilter, categoryFilter]);

  // Initial load and when filters change
  useEffect(() => {
    fetchDrafts();
  }, [fetchDrafts]);

  // Apply search filter
  const filteredDrafts = drafts.filter((draft) => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      draft.question?.toLowerCase().includes(searchLower) ||
      draft.answer?.toLowerCase().includes(searchLower) ||
      draft.category?.toLowerCase().includes(searchLower) ||
      draft.channel?.toLowerCase().includes(searchLower)
    );
  });

  // Get unique templates and categories for filters
  const uniqueTemplates = Array.from(
    new Set(drafts.map((d) => d.template_id).filter((id): id is string => Boolean(id)))
  );
  const uniqueCategories = Array.from(
    new Set(drafts.map((d) => d.category).filter((cat): cat is string => Boolean(cat)))
  );

  // Delete draft
  const handleDelete = async (draftId: string) => {
    setActionLoading((prev) => new Map(prev).set(draftId, true));
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
      fetchDrafts();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete draft');
    } finally {
      setActionLoading((prev) => {
        const next = new Map(prev);
        next.delete(draftId);
        return next;
      });
    }
  };

  // Merge drafts
  const handleMerge = async (sourceId: string, targetId: string) => {
    setActionLoading((prev) => new Map(prev).set(`${sourceId}-merge`, true));
    try {
      const res = await fetch(`/api/admin/knowledge/drafts/${targetId}/merge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source_draft_id: sourceId }),
      });

      if (!res.ok) {
        const errorData = (await res.json().catch(() => ({}))) as KnowledgeErrorResponse;
        toast.error(errorData.detail || errorData.message || 'Failed to merge drafts');
        return;
      }

      toast.success('Drafts merged successfully');
      setMergeState({ sourceId: null, targetId: null });
      fetchDrafts();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to merge drafts');
    } finally {
      setActionLoading((prev) => {
        const next = new Map(prev);
        next.delete(`${sourceId}-merge`);
        return next;
      });
    }
  };

  // Open editor (navigate to draft editor page)
  const handleOpenEditor = (draftId: string) => {
    router.push(`/admin/knowledge/drafts/${draftId}`);
  };

  // Truncate text helper
  const truncate = (text: string | undefined, maxLength: number) => {
    if (!text) return '—';
    if (text.length <= maxLength) return text;
    return `${text.slice(0, maxLength)}...`;
  };

  // Format date helper
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(date);
    } catch {
      return dateString;
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <CardTitle>Drafts</CardTitle>
              <CardDescription>
                {filteredDrafts.length} {filteredDrafts.length === 1 ? 'draft' : 'drafts'}
                {searchTerm && ` matching "${searchTerm}"`}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchDrafts()}
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline ml-2">Refresh</span>
              </Button>
              {selectedDraftIds.size > 0 && (
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => setSendModalOpen(true)}
                >
                  <Send className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Send ({selectedDraftIds.size})</span>
                </Button>
              )}
              <Button variant="outline" size="sm" asChild>
                <Link href="/admin/knowledge">Templates</Link>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search drafts..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      setSearchTerm(searchInput);
                    }
                  }}
                  className="pl-9"
                />
                {searchInput && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0"
                    onClick={() => {
                      setSearchInput('');
                      setSearchTerm('');
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              className="w-full sm:w-[140px]"
            >
              <option value="all">All Status</option>
              <option value="draft">Draft</option>
              <option value="approved">Approved</option>
            </Select>
            {uniqueTemplates.length > 0 && (
              <Select
                value={templateFilter}
                onChange={(e) => setTemplateFilter(e.target.value)}
                className="w-full sm:w-[160px]"
              >
                <option value="all">All Templates</option>
                {uniqueTemplates.map((tplId) => (
                  <option key={tplId} value={tplId}>
                    {tplId.slice(0, 8)}...
                  </option>
                ))}
              </Select>
            )}
            {uniqueCategories.length > 0 && (
              <Select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full sm:w-[140px]"
              >
                <option value="all">All Categories</option>
                {uniqueCategories.map((cat) => (
                  <option key={cat} value={cat || ''}>
                    {cat}
                  </option>
                ))}
              </Select>
            )}
          </div>

          {/* Error state */}
          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            </div>
          )}

          {/* Loading state */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
            </div>
          )}

          {/* Empty state */}
          {!loading && !error && filteredDrafts.length === 0 && (
            <div className="text-center py-12 text-slate-500">
              <FileText className="h-12 w-12 mx-auto mb-3 text-slate-300" />
              <p className="text-sm">
                {searchTerm || statusFilter !== 'all' || templateFilter !== 'all' || categoryFilter !== 'all'
                  ? 'No drafts match your filters'
                  : 'No drafts yet. Generate drafts from templates to get started.'}
              </p>
              {!searchTerm && statusFilter === 'all' && templateFilter === 'all' && categoryFilter === 'all' && (
                <Button variant="outline" className="mt-4" asChild>
                  <Link href="/admin/knowledge">Go to Templates</Link>
                </Button>
              )}
            </div>
          )}

          {/* Drafts list */}
          {!loading && !error && filteredDrafts.length > 0 && (
            <div className="space-y-2">
              {filteredDrafts.map((draft) => {
                const isLoading = actionLoading.get(draft.id) || actionLoading.get(`${draft.id}-merge`);
                const isSource = mergeState.sourceId === draft.id;
                const isTarget = mergeState.targetId === draft.id;
                const canMerge = mergeState.sourceId && mergeState.sourceId !== draft.id;
                const isSelected = selectedDraftIds.has(draft.id);

                return (
                  <div
                    key={draft.id}
                    className={`border rounded-lg p-4 hover:bg-slate-50 transition-colors ${
                      isSource ? 'border-indigo-300 bg-indigo-50' : ''
                    } ${isTarget ? 'border-green-300 bg-green-50' : ''} ${
                      isSelected ? 'border-blue-300 bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                      {/* Selection checkbox */}
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedDraftIds((prev) => new Set(prev).add(draft.id));
                          } else {
                            setSelectedDraftIds((prev) => {
                              const next = new Set(prev);
                              next.delete(draft.id);
                              return next;
                            });
                          }
                        }}
                        className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      {/* Main content */}
                      <div className="flex-1 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              {draft.status === 'approved' ? (
                                <Badge className="bg-green-100 text-green-700 border-green-200">
                                  <CheckCircle2 className="h-3 w-3 mr-1" />
                                  Approved
                                </Badge>
                              ) : (
                                <Badge variant="outline">Draft</Badge>
                              )}
                              {draft.needs_input && (
                                <Badge variant="outline" className="border-amber-300 text-amber-700 bg-amber-50">
                                  <AlertCircle className="h-3 w-3 mr-1" />
                                  Needs Input
                                </Badge>
                              )}
                              {draft.category && (
                                <Badge variant="secondary">{draft.category}</Badge>
                              )}
                              {draft.channel && (
                                <Badge variant="secondary">{draft.channel}</Badge>
                              )}
                            </div>
                            <h3 className="font-semibold text-slate-900 mb-1">
                              {draft.question ? truncate(draft.question, 100) : '—'}
                            </h3>
                            {draft.answer && (
                              <p className="text-sm text-slate-600 line-clamp-2">
                                {truncate(draft.answer, 150)}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-slate-500">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(draft.updated_at)}
                          </div>
                          {draft.citations && draft.citations.length > 0 && (
                            <div className="flex items-center gap-1">
                              <FileText className="h-3 w-3" />
                              {draft.citations.length} {draft.citations.length === 1 ? 'citation' : 'citations'}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 sm:flex-col sm:items-end">
                        {mergeState.sourceId ? (
                          <>
                            {isSource && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setMergeState({ sourceId: null, targetId: null })}
                              >
                                Cancel
                              </Button>
                            )}
                            {canMerge && (
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() => {
                                  setConfirmationDialog({
                                    open: true,
                                    title: 'Merge Drafts',
                                    message: `Merge draft "${truncate(draft.question, 50)}" into the selected draft? This will combine the content and delete the source draft.`,
                                    confirmText: 'Merge',
                                    variant: 'warning',
                                    onConfirm: () => {
                                      if (mergeState.sourceId) {
                                        handleMerge(mergeState.sourceId, draft.id);
                                      }
                                      setConfirmationDialog((prev) => ({ ...prev, open: false }));
                                    },
                                  });
                                }}
                                disabled={isLoading}
                              >
                                <Merge className="h-4 w-4 mr-1" />
                                Merge Here
                              </Button>
                            )}
                          </>
                        ) : (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenEditor(draft.id)}
                              disabled={isLoading}
                            >
                              <Edit className="h-4 w-4 sm:mr-1" />
                              <span className="hidden sm:inline">Edit</span>
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setMergeState({ sourceId: draft.id, targetId: null })}
                              disabled={isLoading}
                            >
                              <Merge className="h-4 w-4 sm:mr-1" />
                              <span className="hidden sm:inline">Merge</span>
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setConfirmationDialog({
                                  open: true,
                                  title: 'Delete Draft',
                                  message: `Are you sure you want to delete this draft? This action cannot be undone.`,
                                  confirmText: 'Delete',
                                  variant: 'destructive',
                                  onConfirm: () => {
                                    handleDelete(draft.id);
                                    setConfirmationDialog((prev) => ({ ...prev, open: false }));
                                  },
                                });
                              }}
                              disabled={isLoading}
                            >
                              <Trash2 className="h-4 w-4 sm:mr-1" />
                              <span className="hidden sm:inline">Delete</span>
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

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
        }}
      />

      {/* Send/Publish Modal */}
      <SendPublishModal
        open={sendModalOpen}
        onClose={() => {
          setSendModalOpen(false);
          setSelectedDraftIds(new Set());
        }}
        onSuccess={() => {
          fetchDrafts();
          setSelectedDraftIds(new Set());
        }}
        draftIds={Array.from(selectedDraftIds)}
      />
    </>
  );
}

