'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2, Search, Archive, ArchiveRestore, RefreshCw, X, RotateCcw, MoreVertical, Copy, CheckCircle2 } from 'lucide-react';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import type { FAQ, FAQStatus, FAQListResponse } from '@/lib/types/faq-lifecycle';

type StatusFilter = FAQStatus | 'all';

type Document = {
  id: string;
  title: string;
  status: string;
};

type SupersedeModalState = {
  open: boolean;
  obsoleteIds: string[];
  availableFaqs: FAQ[];
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
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  const selectAllRef = useRef<HTMLInputElement>(null);
  const [supersedeModal, setSupersedeModal] = useState<SupersedeModalState>({
    open: false,
    obsoleteIds: [],
    availableFaqs: [],
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
    variant: 'warning',
    onConfirm: null,
  });
  const [mobileActionSheet, setMobileActionSheet] = useState<{
    open: boolean;
    faq: FAQ | null;
  }>({
    open: false,
    faq: null,
  });
  const [copiedQuestionId, setCopiedQuestionId] = useState<string | null>(null);

  // Lock body scroll when supersede modal is open
  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (supersedeModal.open) {
      const original = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = original;
      };
    }
    return;
  }, [supersedeModal.open]);

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
      setSelectedIds((prev) => {
        if (prev.size === 0) return prev;
        const currentIds = new Set((data.items || []).map((faq) => faq.id));
        let changed = false;
        const next = new Set(prev);
        prev.forEach((id) => {
          if (!currentIds.has(id)) {
            next.delete(id);
            changed = true;
          }
        });
        return changed ? next : prev;
      });
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

  useEffect(() => {
    if (!selectAllRef.current) return;
    if (faqs.length === 0) {
      selectAllRef.current.indeterminate = false;
      return;
    }
    const selectedOnPage = faqs.filter((faq) => selectedIds.has(faq.id)).length;
    selectAllRef.current.indeterminate = selectedOnPage > 0 && selectedOnPage < faqs.length;
  }, [faqs, selectedIds]);

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

  const toggleSelect = (faqId: string) => {
    if (bulkActionLoading) return;
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(faqId)) {
        next.delete(faqId);
      } else {
        next.add(faqId);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (bulkActionLoading) return;
    setSelectedIds((prev) => {
      const pageIds = faqs.map((faq) => faq.id);
      const allSelected = pageIds.length > 0 && pageIds.every((id) => prev.has(id));
      const next = new Set(prev);
      if (allSelected) {
        pageIds.forEach((id) => next.delete(id));
      } else {
        pageIds.forEach((id) => next.add(id));
      }
      return next;
    });
  };

  const clearSelection = () => setSelectedIds(new Set());

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

  const selectedFaqs = faqs.filter((faq) => selectedIds.has(faq.id));
  const selectedActiveIds = selectedFaqs.filter((faq) => faq.status === 'active').map((faq) => faq.id);
  const selectedArchivedIds = selectedFaqs.filter((faq) => faq.status === 'archived').map((faq) => faq.id);
  const hasSelection = selectedIds.size > 0;
  const canBulkArchive = selectedActiveIds.length > 0;
  const canBulkUnarchive = selectedArchivedIds.length > 0;
  const canBulkSupersede = selectedActiveIds.length > 0;
  const modalIsBulk = supersedeModal.obsoleteIds.length > 1;
  const supersedeModalLoading = modalIsBulk
    ? bulkActionLoading
    : supersedeModal.obsoleteIds.length === 1
      ? isFaqLoading(supersedeModal.obsoleteIds[0])
      : false;

  const showConfirmationDialog = (config: {
    title: string;
    message: string;
    confirmText?: string;
    variant?: 'default' | 'destructive' | 'warning';
    onConfirm: () => void;
  }) => {
    setConfirmationDialog({
      open: true,
      title: config.title,
      message: config.message,
      confirmText: config.confirmText ?? 'Confirm',
      variant: config.variant ?? 'warning',
      onConfirm: config.onConfirm,
    });
  };

  // Archive FAQ
  const handleArchive = (faq: FAQ) => {
    const archiveWarning =
      'This only hides the curated answer. The underlying document may still answer via RAG.';

    const executeArchive = async () => {
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

    showConfirmationDialog({
      title: 'Archive FAQ?',
      message: `Are you sure you want to archive this FAQ?\n\n"${truncate(
        faq.question,
        60
      )}"\n\n${archiveWarning}`,
      confirmText: 'Archive',
      variant: 'warning',
      onConfirm: executeArchive,
    });
  };

  // Unarchive FAQ
  const handleUnarchive = (faq: FAQ) => {
    const executeUnarchive = async () => {
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

    showConfirmationDialog({
      title: 'Unarchive FAQ?',
      message: `Are you sure you want to unarchive this FAQ?\n\n"${truncate(faq.question, 60)}"`,
      confirmText: 'Unarchive',
      variant: 'default',
      onConfirm: executeUnarchive,
    });
  };

  // Fetch active FAQs and open supersede modal
  const openSupersedeModal = async (obsoleteIds: string[]) => {
    try {
      // Fetch active FAQs (excluding the one being superseded)
      const response = await fetch('/api/admin/faqs?status=active&limit=100');
      if (!response.ok) {
        throw new Error('Failed to fetch available FAQs');
      }
      const data: FAQListResponse = await response.json();
      const available = (data.items || []).filter((f) => !obsoleteIds.includes(f.id));

      if (available.length === 0) {
        toast.error('No active FAQs available to supersede with');
        return;
      }

      setSupersedeModal({
        open: true,
        obsoleteIds,
        availableFaqs: available,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load FAQs';
      toast.error(errorMessage);
      console.error('Supersede modal error:', err);
    }
  };

  const handleOpenSupersede = (obsoleteFaq: FAQ) => {
    openSupersedeModal([obsoleteFaq.id]);
  };

  const handleOpenBulkSupersede = () => {
    if (selectedActiveIds.length === 0) {
      toast.info('Select at least one active FAQ to supersede');
      return;
    }
    openSupersedeModal(selectedActiveIds);
  };

  // Close supersede modal
  const handleCloseSupersede = () => {
    setSupersedeModal({ open: false, obsoleteIds: [], availableFaqs: [] });
  };

  // Execute supersede action
  const handleSupersede = async (newFaqId: string) => {
    if (!supersedeModal.obsoleteIds.length) return;
    const isBulk = supersedeModal.obsoleteIds.length > 1;
    if (isBulk) {
      setBulkActionLoading(true);
    } else {
      setFaqLoading(supersedeModal.obsoleteIds[0], true);
    }
    try {
      const endpoint = isBulk ? '/api/admin/faqs/bulk-supersede' : '/api/admin/faqs/supersede';
      const body = isBulk
        ? { new_faq_id: newFaqId, obsolete_ids: supersedeModal.obsoleteIds }
        : { new_faq_id: newFaqId, obsolete_faq_ids: supersedeModal.obsoleteIds };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.details || `Failed to supersede FAQ: ${response.status}`);
      }

      toast.success(
        isBulk
          ? `Superseded ${supersedeModal.obsoleteIds.length} FAQ(s)`
          : 'FAQ superseded successfully'
      );
      handleCloseSupersede();
      if (isBulk) {
        clearSelection();
      }
      await fetchFAQs(); // Refresh list
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to supersede FAQ';
      toast.error(errorMessage);
      console.error('Supersede error:', err);
    } finally {
      if (isBulk) {
        setBulkActionLoading(false);
      } else {
        setFaqLoading(supersedeModal.obsoleteIds[0], false);
      }
    }
  };

  const handleBulkArchive = () => {
    if (selectedActiveIds.length === 0) {
      toast.info('Select active FAQs to archive');
      return;
    }

    const executeBulkArchive = async () => {
      setBulkActionLoading(true);
      try {
        const response = await fetch('/api/admin/faqs/bulk-archive', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ids: selectedActiveIds }),
        });
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.details || `Failed to archive FAQs: ${response.status}`);
        }
        toast.success(`Archived ${selectedActiveIds.length} FAQ(s)`);
        clearSelection();
        await fetchFAQs();
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to archive FAQs';
        toast.error(errorMessage);
        console.error('Bulk archive error:', err);
      } finally {
        setBulkActionLoading(false);
      }
    };

    showConfirmationDialog({
      title: `Archive ${selectedActiveIds.length} FAQ${selectedActiveIds.length > 1 ? 's' : ''}?`,
      message:
        'This only hides the curated answers. The underlying documents may still answer via RAG.',
      confirmText: 'Archive FAQs',
      variant: 'warning',
      onConfirm: executeBulkArchive,
    });
  };

  const handleBulkUnarchive = () => {
    if (selectedArchivedIds.length === 0) {
      toast.info('Select archived FAQs to unarchive');
      return;
    }

    const executeBulkUnarchive = async () => {
      setBulkActionLoading(true);
      try {
        const response = await fetch('/api/admin/faqs/bulk-unarchive', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ids: selectedArchivedIds }),
        });
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.details || `Failed to unarchive FAQs: ${response.status}`);
        }
        toast.success(`Unarchived ${selectedArchivedIds.length} FAQ(s)`);
        clearSelection();
        await fetchFAQs();
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to unarchive FAQs';
        toast.error(errorMessage);
        console.error('Bulk unarchive error:', err);
      } finally {
        setBulkActionLoading(false);
      }
    };

    showConfirmationDialog({
      title: `Unarchive ${selectedArchivedIds.length} FAQ${selectedArchivedIds.length > 1 ? 's' : ''}?`,
      message: 'The selected FAQs will be restored and can appear in responses again.',
      confirmText: 'Unarchive FAQs',
      variant: 'default',
      onConfirm: executeBulkUnarchive,
    });
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
                className="min-h-[44px] sm:h-9 sm:min-h-0"
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
                  className="min-h-[44px]"
                />
                <Button onClick={handleSearch} variant="outline" className="min-h-[44px] min-w-[44px]">
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
                    className="min-h-[44px] min-w-[44px] sm:h-9 sm:min-h-0"
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
                    className="min-h-[44px]"
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
                            className="w-full text-left px-3 py-2 hover:bg-slate-50 text-sm border-b last:border-b-0 min-h-[44px]"
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
              <Button onClick={fetchFAQs} variant="outline" disabled={loading} className="min-h-[44px] min-w-[44px]">
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
              {hasSelection && (
                <div className="rounded-md border border-slate-200 bg-slate-50 p-3 text-sm flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div className="font-medium text-slate-700">
                    {selectedIds.size} selected
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleBulkArchive}
                      disabled={!canBulkArchive || bulkActionLoading}
                      className="min-h-[44px] w-full sm:w-auto"
                    >
                      <Archive className="h-3 w-3 mr-1" />
                      Archive
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleBulkUnarchive}
                      disabled={!canBulkUnarchive || bulkActionLoading}
                      className="min-h-[44px] w-full sm:w-auto"
                    >
                      <ArchiveRestore className="h-3 w-3 mr-1" />
                      Unarchive
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleOpenBulkSupersede}
                      disabled={!canBulkSupersede || bulkActionLoading}
                      className="min-h-[44px] w-full sm:w-auto"
                    >
                      <RotateCcw className="h-3 w-3 mr-1" />
                      Supersede
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={clearSelection}
                      disabled={bulkActionLoading}
                      className="min-h-[44px] w-full sm:w-auto"
                    >
                      Clear selection
                    </Button>
                  </div>
                </div>
              )}
              {/* Desktop Table View */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="p-3 w-10">
                        <label className="flex items-center min-h-[44px] min-w-[44px] py-1 cursor-pointer">
                          <input
                            ref={selectAllRef}
                            type="checkbox"
                            className="h-4 w-4"
                            onChange={toggleSelectAll}
                            checked={faqs.length > 0 && faqs.every((faq) => selectedIds.has(faq.id))}
                            disabled={faqs.length === 0 || bulkActionLoading}
                          />
                        </label>
                      </th>
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
                            <label className="flex items-center min-h-[44px] min-w-[44px] py-1 cursor-pointer">
                              <input
                                type="checkbox"
                                className="h-4 w-4"
                                checked={selectedIds.has(faq.id)}
                                onChange={() => toggleSelect(faq.id)}
                                disabled={bulkActionLoading}
                              />
                            </label>
                          </td>
                        <td className="p-3">
                          <div className="flex items-start gap-2 group">
                            <div className="font-medium text-sm flex-1">{truncate(faq.question, 60)}</div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 opacity-60 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity flex-shrink-0"
                              onClick={async (e) => {
                                e.stopPropagation();
                                try {
                                  await navigator.clipboard.writeText(faq.question);
                                  setCopiedQuestionId(faq.id);
                                  setTimeout(() => setCopiedQuestionId(null), 2000);
                                } catch (error) {
                                  toast.error('Failed to copy question');
                                }
                              }}
                              title={copiedQuestionId === faq.id ? 'Copied!' : 'Copy question'}
                            >
                              {copiedQuestionId === faq.id ? (
                                <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                              ) : (
                                <Copy className="h-3.5 w-3.5" />
                              )}
                            </Button>
                          </div>
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
                                  disabled={isFaqLoading(faq.id) || bulkActionLoading}
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
                                  disabled={isFaqLoading(faq.id) || bulkActionLoading}
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
                                disabled={isFaqLoading(faq.id) || bulkActionLoading}
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

              {/* Mobile Card View */}
              <div className="lg:hidden space-y-3">
                {faqs.map((faq) => {
                  const isBulkSelected = selectedIds.has(faq.id);
                  return (
                    <Card key={faq.id} className="border">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-0">
                          <label className="flex items-start min-h-[44px] min-w-[44px] -mr-1 cursor-pointer pt-1">
                            <input
                              type="checkbox"
                              className="form-checkbox h-4 w-4 text-blue-600 mt-0.5"
                              checked={isBulkSelected}
                              onChange={() => toggleSelect(faq.id)}
                              disabled={bulkActionLoading}
                              onClick={(e) => e.stopPropagation()}
                            />
                          </label>
                          <div className="flex-1 min-w-0 -ml-1">
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <div className="flex-1 min-w-0 flex items-start gap-2 group">
                                <h3 className="font-medium text-sm truncate leading-tight flex-1" title={faq.question}>
                                  {faq.question}
                                </h3>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 opacity-60 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity flex-shrink-0"
                                  onClick={async (e) => {
                                    e.stopPropagation();
                                    try {
                                      await navigator.clipboard.writeText(faq.question);
                                      setCopiedQuestionId(faq.id);
                                      setTimeout(() => setCopiedQuestionId(null), 2000);
                                    } catch (error) {
                                      toast.error('Failed to copy question');
                                    }
                                  }}
                                  title={copiedQuestionId === faq.id ? 'Copied!' : 'Copy question'}
                                >
                                  {copiedQuestionId === faq.id ? (
                                    <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                                  ) : (
                                    <Copy className="h-3.5 w-3.5" />
                                  )}
                                </Button>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 flex-shrink-0"
                                onClick={() => setMobileActionSheet({ open: true, faq })}
                              >
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </div>
                            <p className="text-sm text-slate-600 line-clamp-2 mb-2" title={faq.answer}>
                              {faq.answer}
                            </p>
                            <div className="flex items-center gap-2 flex-wrap">
                              {getStatusBadge(faq.status)}
                              <span className="text-xs text-slate-500">
                                {formatDate(faq.created_at)}
                              </span>
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
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {/* Pagination (if needed) */}
              {total > limit && (
                <div className="flex flex-col sm:flex-row items-center justify-between pt-4 gap-3">
                  <div className="text-sm text-slate-600">
                    Showing {offset + 1} to {Math.min(offset + limit, total)} of {total}
                  </div>
                  <div className="flex gap-2 w-full sm:w-auto">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setOffset(Math.max(0, offset - limit))}
                      disabled={offset === 0 || loading}
                      className="min-h-[44px] flex-1 sm:flex-none"
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setOffset(offset + limit)}
                      disabled={offset + limit >= total || loading}
                      className="min-h-[44px] flex-1 sm:flex-none"
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
        <div
          className="fixed inset-0 z-50 overflow-y-auto bg-black/60 p-3 sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Supersede FAQ"
          onClick={handleCloseSupersede}
        >
          <div className="flex min-h-full items-center justify-center py-4">
            <Card
              className="w-full max-w-4xl rounded-2xl bg-white shadow-2xl max-h-[calc(100vh-2rem)] flex flex-col my-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <CardHeader className="flex flex-row items-center justify-between border-b pb-4 flex-shrink-0">
                <CardTitle>
                  {modalIsBulk
                    ? `Supersede ${supersedeModal.obsoleteIds.length} FAQs`
                    : 'Supersede FAQ'}
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCloseSupersede}
                  disabled={supersedeModalLoading}
                  aria-label="Close supersede dialog"
                  className="min-h-[44px] min-w-[44px]"
                >
                  <X className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent className="space-y-4 pb-6 pt-4 flex-1 overflow-y-auto">
                <div className="text-sm text-slate-600">
                  Select the new FAQ that will replace the obsolete one(s). Only active FAQs with citations are listed.
                </div>
                <div className="space-y-2 overflow-y-auto pr-2" style={{ maxHeight: '60vh' }}>
                  {supersedeModal.availableFaqs.map((faq) => (
                    <button
                      key={faq.id}
                      type="button"
                      className="w-full text-left border rounded-md p-3 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 min-h-[44px]"
                      onClick={() =>
                        showConfirmationDialog({
                          title: modalIsBulk
                            ? 'Confirm replacement FAQ'
                            : 'Use this FAQ to supersede?',
                          message: `Replace the obsolete FAQ(s) with:\n\n"${truncate(faq.question, 120)}"`,
                          confirmText: modalIsBulk ? 'Replace FAQs' : 'Use this FAQ',
                          variant: 'warning',
                          onConfirm: () => handleSupersede(faq.id),
                        })
                      }
                      disabled={supersedeModalLoading}
                    >
                      <div className="font-medium text-sm">{truncate(faq.question, 140)}</div>
                      <div className="text-xs text-slate-500 mt-1">{truncate(faq.answer, 170)}</div>
                    </button>
                  ))}
                  {supersedeModal.availableFaqs.length === 0 && (
                    <div className="rounded-md border border-dashed border-slate-200 p-4 text-sm text-slate-500">
                      No eligible FAQs found. Create or approve a new FAQ to supersede with.
                    </div>
                  )}
                </div>
                <div className="flex justify-end border-t pt-4 flex-shrink-0">
                  <Button
                    variant="outline"
                    onClick={handleCloseSupersede}
                    disabled={supersedeModalLoading}
                    className="min-h-[44px] w-full sm:w-auto"
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
      <ConfirmationDialog
        open={confirmationDialog.open}
        onClose={() => setConfirmationDialog((prev) => ({ ...prev, open: false }))}
        onConfirm={() => {
          const action = confirmationDialog.onConfirm;
          setConfirmationDialog((prev) => ({ ...prev, open: false }));
          action?.();
        }}
        title={confirmationDialog.title}
        message={confirmationDialog.message}
        confirmText={confirmationDialog.confirmText}
        variant={confirmationDialog.variant}
      />

      {/* Mobile Action Bottom Sheet */}
      <BottomSheet
        open={mobileActionSheet.open}
        onClose={() => setMobileActionSheet({ open: false, faq: null })}
        title={mobileActionSheet.faq ? 'FAQ Actions' : ''}
        className="max-h-[60vh]"
      >
        {mobileActionSheet.faq && (
          <div className="space-y-4 pb-2">
            <div className="pt-3 border-t">
              <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">
                Question
              </div>
              <p className="text-sm text-slate-900">{mobileActionSheet.faq.question}</p>
            </div>
            <div className="border-t pt-3">
              <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">
                Answer
              </div>
              <p className="text-sm text-slate-600 line-clamp-3">{mobileActionSheet.faq.answer}</p>
            </div>
            <div className="border-t pt-3">
              <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">
                Status
              </div>
              <div className="mb-2">{getStatusBadge(mobileActionSheet.faq.status)}</div>
              {mobileActionSheet.faq.archived_at && (
                <p className="text-xs text-slate-500">
                  Archived: {formatDate(mobileActionSheet.faq.archived_at)}
                </p>
              )}
              {mobileActionSheet.faq.superseded_by && (
                <p className="text-xs text-slate-500">
                  Superseded by: {mobileActionSheet.faq.superseded_by.substring(0, 8)}...
                </p>
              )}
            </div>
            <div className="border-t pt-3 space-y-2">
              {mobileActionSheet.faq.status === 'active' && (
                <>
                  <Button
                    variant="outline"
                    className="w-full min-h-[44px]"
                    onClick={() => {
                      setMobileActionSheet({ open: false, faq: null });
                      handleArchive(mobileActionSheet.faq!);
                    }}
                    disabled={isFaqLoading(mobileActionSheet.faq.id) || bulkActionLoading}
                  >
                    {isFaqLoading(mobileActionSheet.faq.id) ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Archive className="h-4 w-4 mr-2" />
                    )}
                    Archive
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full min-h-[44px]"
                    onClick={() => {
                      setMobileActionSheet({ open: false, faq: null });
                      handleOpenSupersede(mobileActionSheet.faq!);
                    }}
                    disabled={isFaqLoading(mobileActionSheet.faq.id) || bulkActionLoading}
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Supersede
                  </Button>
                </>
              )}
              {mobileActionSheet.faq.status === 'archived' && (
                <Button
                  variant="outline"
                  className="w-full min-h-[44px]"
                  onClick={() => {
                    setMobileActionSheet({ open: false, faq: null });
                    handleUnarchive(mobileActionSheet.faq!);
                  }}
                  disabled={isFaqLoading(mobileActionSheet.faq.id) || bulkActionLoading}
                >
                  {isFaqLoading(mobileActionSheet.faq.id) ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <ArchiveRestore className="h-4 w-4 mr-2" />
                  )}
                  Unarchive
                </Button>
              )}
              {mobileActionSheet.faq.status === 'superseded' && (
                <p className="text-sm text-slate-500 italic text-center py-2">Read-only</p>
              )}
            </div>
          </div>
        )}
      </BottomSheet>
    </div>
  );
}

