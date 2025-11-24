'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2, Search, Archive, ArchiveRestore, RefreshCw, X, RotateCcw } from 'lucide-react';
import type { FAQ, FAQStatus, FAQListResponse } from '@/lib/types/faq-lifecycle';

type StatusFilter = FAQStatus | 'all';

type Document = {
  id: string;
  title: string;
  status: string;
};

export function FAQManagementClient() {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('active');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [docSearchTerm, setDocSearchTerm] = useState('');
  const [docSearchInput, setDocSearchInput] = useState('');
  const [showDocDropdown, setShowDocDropdown] = useState(false);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [selectedDocTitle, setSelectedDocTitle] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [limit] = useState(50);
  const [offset, setOffset] = useState(0);
  const [actionLoading, setActionLoading] = useState<Map<string, boolean>>(new Map());
  const [supersedeModal, setSupersedeModal] = useState<{ open: boolean; obsoleteId: string | null; availableFaqs: FAQ[] }>({
    open: false,
    obsoleteId: null,
    availableFaqs: [],
  });

  // Fetch FAQs
  const fetchFAQs = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') {
        params.set('status', statusFilter);
      }
      if (searchTerm) {
        params.set('search', searchTerm);
      }
      if (selectedDocId) {
        params.set('doc_id', selectedDocId);
      }
      params.set('limit', limit.toString());
      params.set('offset', offset.toString());

      const response = await fetch(`/api/admin/faqs?${params.toString()}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.details || `Failed to fetch FAQs: ${response.status}`);
      }

      const data: FAQListResponse = await response.json();
      setFaqs(data.items || []);
      setTotal(data.total || 0);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch FAQs';
      setError(errorMessage);
      toast.error(errorMessage);
      console.error('FAQ fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, searchTerm, selectedDocId, limit, offset]);

  // Fetch documents for searchable dropdown
  const fetchDocuments = useCallback(async (search: string) => {
    if (!search.trim()) {
      setDocuments([]);
      return;
    }

    try {
      setLoadingDocs(true);
      const response = await fetch(`/api/admin/docs?q=${encodeURIComponent(search)}&status=active&limit=20`);
      
      if (!response.ok) {
        return;
      }

      const data = await response.json();
      const docs = data.docs || data.documents || [];
      setDocuments(docs);
    } catch (err) {
      console.error('Document search error:', err);
      setDocuments([]);
    } finally {
      setLoadingDocs(false);
    }
  }, []);

  // Debounced document search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (docSearchInput.trim()) {
        fetchDocuments(docSearchInput.trim());
        setShowDocDropdown(true);
      } else {
        setDocuments([]);
        setShowDocDropdown(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [docSearchInput, fetchDocuments]);

  // Handle document selection
  const handleDocSelect = (doc: Document) => {
    setSelectedDocId(doc.id);
    setSelectedDocTitle(doc.title);
    setDocSearchInput('');
    setDocSearchTerm('');
    setShowDocDropdown(false);
    setDocuments([]);
    setOffset(0); // Reset pagination
  };

  // Clear document filter
  const handleClearDoc = () => {
    setSelectedDocId(null);
    setSelectedDocTitle(null);
    setDocSearchInput('');
    setDocSearchTerm('');
    setShowDocDropdown(false);
    setDocuments([]);
    setOffset(0); // Reset pagination
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.doc-filter-container')) {
        setShowDocDropdown(false);
      }
    };

    if (showDocDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showDocDropdown]);

  // Initial load and when filters change
  useEffect(() => {
    fetchFAQs();
  }, [fetchFAQs]);

  // Handle search submit
  const handleSearch = useCallback(() => {
    setSearchTerm(searchInput.trim());
    setOffset(0); // Reset to first page
  }, [searchInput]);

  // Handle Enter key in search
  const handleSearchKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // Get status badge variant
  const getStatusBadge = (status: FAQStatus) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500 hover:bg-green-600">Active</Badge>;
      case 'archived':
        return <Badge className="bg-yellow-500 hover:bg-yellow-600">Archived</Badge>;
      case 'superseded':
        return <Badge className="bg-red-500 hover:bg-red-600">Superseded</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  // Format date
  const formatDate = (dateString: string | null) => {
    if (!dateString) return '—';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  // Truncate text
  const truncate = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  // Set loading state for a specific FAQ action
  const setFaqLoading = (faqId: string, isLoading: boolean) => {
    setActionLoading((prev) => {
      const next = new Map(prev);
      if (isLoading) {
        next.set(faqId, true);
      } else {
        next.delete(faqId);
      }
      return next;
    });
  };

  // Check if a FAQ action is loading
  const isFaqLoading = (faqId: string) => actionLoading.get(faqId) || false;

  // Archive FAQ
  const handleArchive = async (faq: FAQ) => {
    if (!confirm(`Are you sure you want to archive this FAQ?\n\n"${truncate(faq.question, 60)}"`)) {
      return;
    }

    setFaqLoading(faq.id, true);
    try {
      const response = await fetch(`/api/admin/faqs/${faq.id}/archive`, {
        method: 'POST',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.details || `Failed to archive FAQ: ${response.status}`);
      }

      toast.success('FAQ archived successfully');
      await fetchFAQs(); // Refresh list
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to archive FAQ';
      toast.error(errorMessage);
      console.error('Archive error:', err);
    } finally {
      setFaqLoading(faq.id, false);
    }
  };

  // Unarchive FAQ
  const handleUnarchive = async (faq: FAQ) => {
    if (!confirm(`Are you sure you want to unarchive this FAQ?\n\n"${truncate(faq.question, 60)}"`)) {
      return;
    }

    setFaqLoading(faq.id, true);
    try {
      const response = await fetch(`/api/admin/faqs/${faq.id}/unarchive`, {
        method: 'POST',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.details || `Failed to unarchive FAQ: ${response.status}`);
      }

      toast.success('FAQ unarchived successfully');
      await fetchFAQs(); // Refresh list
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to unarchive FAQ';
      toast.error(errorMessage);
      console.error('Unarchive error:', err);
    } finally {
      setFaqLoading(faq.id, false);
    }
  };

  // Open supersede modal and fetch available FAQs
  const handleOpenSupersede = async (obsoleteFaq: FAQ) => {
    try {
      // Fetch active FAQs (excluding the one being superseded)
      const response = await fetch('/api/admin/faqs?status=active&limit=100');
      if (!response.ok) {
        throw new Error('Failed to fetch available FAQs');
      }
      const data: FAQListResponse = await response.json();
      const available = (data.items || []).filter((f) => f.id !== obsoleteFaq.id);

      if (available.length === 0) {
        toast.error('No active FAQs available to supersede with');
        return;
      }

      setSupersedeModal({
        open: true,
        obsoleteId: obsoleteFaq.id,
        availableFaqs: available,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load FAQs';
      toast.error(errorMessage);
      console.error('Supersede modal error:', err);
    }
  };

  // Close supersede modal
  const handleCloseSupersede = () => {
    setSupersedeModal({ open: false, obsoleteId: null, availableFaqs: [] });
  };

  // Execute supersede action
  const handleSupersede = async (newFaqId: string) => {
    if (!supersedeModal.obsoleteId) return;

    setFaqLoading(supersedeModal.obsoleteId, true);
    try {
      const response = await fetch('/api/admin/faqs/supersede', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          new_faq_id: newFaqId,
          obsolete_faq_ids: [supersedeModal.obsoleteId],
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.details || `Failed to supersede FAQ: ${response.status}`);
      }

      toast.success('FAQ superseded successfully');
      handleCloseSupersede();
      await fetchFAQs(); // Refresh list
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to supersede FAQ';
      toast.error(errorMessage);
      console.error('Supersede error:', err);
    } finally {
      setFaqLoading(supersedeModal.obsoleteId, false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Status Filter */}
            <div className="flex-1">
              <Label htmlFor="status-filter">Status</Label>
              <Select
                id="status-filter"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value as StatusFilter);
                  setOffset(0);
                }}
              >
                <option value="all">All</option>
                <option value="active">Active</option>
                <option value="archived">Archived</option>
                <option value="superseded">Superseded</option>
              </Select>
            </div>

            {/* Search */}
            <div className="flex-1">
              <Label htmlFor="search-input">Search</Label>
              <div className="flex gap-2">
                <Input
                  id="search-input"
                  placeholder="Search questions or answers..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyPress={handleSearchKeyPress}
                />
                <Button onClick={handleSearch} variant="outline">
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Source Document Filter */}
            <div className="flex-1 relative doc-filter-container">
              <Label htmlFor="doc-filter">Source Document</Label>
              {selectedDocId ? (
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex-1 px-3 py-2 border rounded-md bg-slate-50 text-sm">
                    {selectedDocTitle || 'Selected document'}
                  </div>
                  <Button
                    onClick={handleClearDoc}
                    variant="outline"
                    size="sm"
                    className="h-9"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="relative">
                  <Input
                    id="doc-filter"
                    placeholder="Search document name..."
                    value={docSearchInput}
                    onChange={(e) => setDocSearchInput(e.target.value)}
                    onFocus={() => {
                      if (docSearchInput.trim() && documents.length > 0) {
                        setShowDocDropdown(true);
                      }
                    }}
                  />
                  {showDocDropdown && documents.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
                      {loadingDocs ? (
                        <div className="p-3 text-center text-sm text-slate-500">
                          <Loader2 className="h-4 w-4 animate-spin inline mr-2" />
                          Searching...
                        </div>
                      ) : (
                        documents.map((doc) => (
                          <button
                            key={doc.id}
                            onClick={() => handleDocSelect(doc)}
                            className="w-full text-left px-3 py-2 hover:bg-slate-50 text-sm border-b last:border-b-0"
                          >
                            {doc.title}
                          </button>
                        ))
                      )}
                    </div>
                  )}
                  {showDocDropdown && !loadingDocs && documents.length === 0 && docSearchInput.trim() && (
                    <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg p-3 text-sm text-slate-500">
                      No documents found
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Refresh */}
            <div className="flex items-end">
              <Button onClick={fetchFAQs} variant="outline" disabled={loading}>
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* FAQ List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>FAQs</CardTitle>
            <div className="text-sm text-slate-600">
              {loading ? 'Loading...' : `${total} total`}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading && faqs.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
            </div>
          ) : error ? (
            <div className="rounded-md bg-red-50 p-4">
              <div className="text-sm text-red-700">{error}</div>
              <Button
                onClick={fetchFAQs}
                variant="outline"
                size="sm"
                className="mt-2"
              >
                Retry
              </Button>
            </div>
          ) : faqs.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-600">
                {searchTerm || statusFilter !== 'all' || selectedDocId
                  ? 'No FAQs found matching your filters.'
                  : 'No FAQs found. Create FAQs by promoting items from the Inbox.'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3 font-medium text-sm text-slate-700">Question</th>
                      <th className="text-left p-3 font-medium text-sm text-slate-700">Answer</th>
                      <th className="text-left p-3 font-medium text-sm text-slate-700">Status</th>
                      <th className="text-left p-3 font-medium text-sm text-slate-700">Created</th>
                      <th className="text-left p-3 font-medium text-sm text-slate-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {faqs.map((faq) => (
                      <tr key={faq.id} className="border-b hover:bg-slate-50">
                        <td className="p-3">
                          <div className="font-medium text-sm">{truncate(faq.question, 60)}</div>
                        </td>
                        <td className="p-3">
                          <div className="text-sm text-slate-600">{truncate(faq.answer, 80)}</div>
                        </td>
                        <td className="p-3">
                          <div className="flex flex-col gap-1">
                            {getStatusBadge(faq.status)}
                            {faq.archived_at && (
                              <span className="text-xs text-slate-500">
                                Archived: {formatDate(faq.archived_at)}
                              </span>
                            )}
                            {faq.superseded_by && (
                              <span className="text-xs text-slate-500">
                                Superseded by: {faq.superseded_by.substring(0, 8)}...
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="text-sm text-slate-600">{formatDate(faq.created_at)}</div>
                        </td>
                        <td className="p-3">
                          <div className="flex gap-2">
                            {faq.status === 'active' && (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleArchive(faq)}
                                  disabled={isFaqLoading(faq.id)}
                                >
                                  {isFaqLoading(faq.id) ? (
                                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                  ) : (
                                    <Archive className="h-3 w-3 mr-1" />
                                  )}
                                  Archive
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleOpenSupersede(faq)}
                                  disabled={isFaqLoading(faq.id)}
                                >
                                  <RotateCcw className="h-3 w-3 mr-1" />
                                  Supersede
                                </Button>
                              </>
                            )}
                            {faq.status === 'archived' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleUnarchive(faq)}
                                disabled={isFaqLoading(faq.id)}
                              >
                                {isFaqLoading(faq.id) ? (
                                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                ) : (
                                  <ArchiveRestore className="h-3 w-3 mr-1" />
                                )}
                                Unarchive
                              </Button>
                            )}
                            {faq.status === 'superseded' && (
                              <span className="text-xs text-slate-500 italic">Read-only</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination (if needed) */}
              {total > limit && (
                <div className="flex items-center justify-between pt-4">
                  <div className="text-sm text-slate-600">
                    Showing {offset + 1} to {Math.min(offset + limit, total)} of {total}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setOffset(Math.max(0, offset - limit))}
                      disabled={offset === 0 || loading}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setOffset(offset + limit)}
                      disabled={offset + limit >= total || loading}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Supersede Modal */}
      {supersedeModal.open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl max-h-[80vh] overflow-y-auto m-4">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Supersede FAQ</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCloseSupersede}
                  disabled={isFaqLoading(supersedeModal.obsoleteId || '')}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm text-slate-600">
                Select the new FAQ that will replace the obsolete one:
              </div>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {supersedeModal.availableFaqs.map((faq) => (
                  <div
                    key={faq.id}
                    className="border rounded-md p-3 hover:bg-slate-50 cursor-pointer"
                    onClick={() => {
                      if (confirm(`Replace the obsolete FAQ with:\n\n"${truncate(faq.question, 60)}"?`)) {
                        handleSupersede(faq.id);
                      }
                    }}
                  >
                    <div className="font-medium text-sm">{truncate(faq.question, 80)}</div>
                    <div className="text-xs text-slate-500 mt-1">{truncate(faq.answer, 100)}</div>
                  </div>
                ))}
              </div>
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={handleCloseSupersede}
                  disabled={isFaqLoading(supersedeModal.obsoleteId || '')}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

