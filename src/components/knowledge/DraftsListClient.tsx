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
  AlertCircle,
  CheckCircle2,
  FileText,
  Calendar,
  Send,
  Sparkles,
} from 'lucide-react';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { SendPublishModal } from './SendPublishModal';
import { Breadcrumbs } from './Breadcrumbs';
import type { Draft, DraftListResponse, KnowledgeErrorResponse } from '@/lib/types/knowledge';

type StatusFilter = 'draft' | 'approved' | 'all';

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
  const [selectedDraftIds, setSelectedDraftIds] = useState<Set<string>>(new Set());
  const [bulkDeleteLoading, setBulkDeleteLoading] = useState(false);
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

  // Bulk selection handlers
  const handleToggleSelect = useCallback((draftId: string) => {
    setSelectedDraftIds((prev) => {
      const next = new Set(prev);
      if (next.has(draftId)) {
        next.delete(draftId);
      } else {
        next.add(draftId);
      }
      return next;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    if (bulkDeleteLoading) return;
    setSelectedDraftIds((prev) => {
      const pageIds = filteredDrafts.map((d) => d.id);
      const allSelected = pageIds.length > 0 && pageIds.every((id) => prev.has(id));
      const next = new Set(prev);
      if (allSelected) {
        pageIds.forEach((id) => next.delete(id));
      } else {
        pageIds.forEach((id) => next.add(id));
      }
      return next;
    });
  }, [filteredDrafts, bulkDeleteLoading]);

  const clearSelection = useCallback(() => {
    setSelectedDraftIds(new Set());
  }, []);

  // Bulk delete handler
  const handleBulkDelete = useCallback(async () => {
    const ids = Array.from(selectedDraftIds);
    if (ids.length === 0) return;

    setConfirmationDialog({
      open: true,
      title: 'Bulk Delete Drafts',
      message: `Are you sure you want to delete ${ids.length} draft(s)? This action cannot be undone.`,
      confirmText: 'Delete',
      variant: 'destructive',
      onConfirm: async () => {
        setConfirmationDialog((prev) => ({ ...prev, open: false }));
        setBulkDeleteLoading(true);
        try {
          const response = await fetch('/api/admin/knowledge/drafts/bulk', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ draft_ids: ids }),
            cache: 'no-store',
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.details || errorData.detail || `Failed to bulk delete: ${response.status}`);
          }

          const result = await response.json();
          const deletedCount = result.deleted_count || 0;
          const requestedCount = result.requested_count || ids.length;

          if (deletedCount < requestedCount) {
            toast.warning(
              `Successfully deleted ${deletedCount} of ${requestedCount} draft(s). Some drafts may not exist or you may not have permission to delete them.`
            );
          } else {
            toast.success(`Successfully deleted ${deletedCount} draft(s).`);
          }

          clearSelection();
          await fetchDrafts();
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : 'Failed to bulk delete drafts';
          toast.error(errorMessage);
          console.error('Bulk delete error:', err);
        } finally {
          setBulkDeleteLoading(false);
        }
      },
    });
  }, [selectedDraftIds, clearSelection, fetchDrafts]);

  // Clear selection when filters change
  useEffect(() => {
    clearSelection();
  }, [statusFilter, templateFilter, categoryFilter, searchTerm, clearSelection]);


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
      {/* Breadcrumbs */}
      <Breadcrumbs items={[{ label: 'Drafts' }]} className="mb-4" />
      
      <Card className="shadow-sm">
        <CardHeader className="border-b border-slate-100">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="space-y-1">
              <CardTitle className="text-xl sm:text-2xl font-bold">Drafts</CardTitle>
              <CardDescription className="text-sm sm:text-base">
                {loading ? (
                  'Loading drafts...'
                ) : (
                  <>
                    {filteredDrafts.length} {filteredDrafts.length === 1 ? 'draft' : 'drafts'}
                    {searchTerm && ` matching "${searchTerm}"`}
                  </>
                )}
              </CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchDrafts()}
                disabled={loading}
                className="min-h-[44px] sm:min-h-0 w-full sm:w-auto"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''} sm:mr-2`} />
                <span>Refresh</span>
              </Button>
              {selectedDraftIds.size > 0 && (
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => setSendModalOpen(true)}
                  className="min-h-[44px] sm:min-h-0 w-full sm:w-auto"
                >
                  <Send className="h-4 w-4 mr-2" />
                  <span>Send ({selectedDraftIds.size})</span>
                </Button>
              )}
              <Button variant="outline" size="sm" asChild className="min-h-[44px] sm:min-h-0 w-full sm:w-auto">
                <Link href="/admin/knowledge" className="flex items-center justify-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  <span>Templates</span>
                </Link>
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

          {/* Bulk Actions Toolbar */}
          {selectedDraftIds.size > 0 && (
            <Card className="bg-blue-50 border-blue-200 shadow-sm">
              <CardContent className="py-3 sm:py-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex items-center gap-2 text-sm text-blue-800">
                    <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                    <span className="font-medium">{selectedDraftIds.size} draft(s) selected</span>
                    <Button
                      variant="link"
                      size="sm"
                      onClick={clearSelection}
                      disabled={bulkDeleteLoading}
                      className="text-blue-800 hover:text-blue-900 h-auto p-0 ml-2"
                    >
                      Clear selection
                    </Button>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={handleBulkDelete}
                      disabled={bulkDeleteLoading}
                      className="min-h-[44px] sm:min-h-0"
                    >
                      {bulkDeleteLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          <span>Deleting...</span>
                        </>
                      ) : (
                        <>
                          <Trash2 className="h-4 w-4 mr-2" />
                          <span>Delete Selected ({selectedDraftIds.size})</span>
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Drafts list */}
          {!loading && !error && filteredDrafts.length > 0 && (
            <div className="space-y-2">
              {/* Select All Header */}
              <div className="flex items-center gap-3 px-4 py-2 bg-slate-50 rounded-lg border border-slate-200">
                <input
                  type="checkbox"
                  checked={filteredDrafts.length > 0 && filteredDrafts.every((d) => selectedDraftIds.has(d.id))}
                  onChange={handleSelectAll}
                  disabled={bulkDeleteLoading || filteredDrafts.length === 0}
                  className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Select all drafts"
                />
                <span className="text-sm font-medium text-slate-700">
                  {filteredDrafts.length > 0 && filteredDrafts.every((d) => selectedDraftIds.has(d.id))
                    ? 'Deselect all'
                    : 'Select all'}
                </span>
              </div>
              {filteredDrafts.map((draft) => {
                const isLoading = actionLoading.get(draft.id);
                const isSelected = selectedDraftIds.has(draft.id);

                return (
                  <Card
                    key={draft.id}
                    className={`transition-all duration-200 ${
                      isSelected ? 'border-blue-300 bg-blue-50 shadow-blue-100' : 'border-slate-200 hover:border-slate-300 hover:shadow-md'
                    }`}
                  >
                    <CardContent className="p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                      {/* Selection checkbox */}
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleSelect(draft.id)}
                        disabled={bulkDeleteLoading}
                        className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        aria-label={`Select draft ${draft.id}`}
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
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-2 w-full sm:w-auto">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenEditor(draft.id)}
                          disabled={isLoading}
                          className="min-h-[44px] sm:min-h-0 w-full sm:w-auto flex-1 sm:flex-none"
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          <span>Edit</span>
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
                          className="min-h-[44px] sm:min-h-0 w-full sm:w-auto flex-1 sm:flex-none text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          <span>Delete</span>
                        </Button>
                      </div>
                    </div>
                    </CardContent>
                  </Card>
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

