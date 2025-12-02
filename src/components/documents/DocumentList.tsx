/**
 * Document List Component
 * 
 * Well-organized component (400-600 lines) for displaying and managing document lists.
 * Provides filtering, searching, pagination, and document selection.
 * 
 * @module components/documents/DocumentList
 */

'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { useDocuments } from '@/hooks/useDocuments';
import { DocumentStatusBadge } from './DocumentStatusBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Document, DisplayStatus } from '@/lib/types/documents';
import { computeDisplayStatus } from '@/lib/types/documents';
import {
  Search,
  RefreshCw,
  FileText,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Eye,
  Trash2,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';

/**
 * Formats a date string as a relative time (e.g., "2h ago", "3d ago").
 */
function formatDistanceToNow(dateString: string | null | undefined): string {
  if (!dateString) return '-';
  
  const date = new Date(dateString);
  
  // Check if date is valid
  if (isNaN(date.getTime())) {
    console.warn('Invalid date string:', dateString);
    return '-';
  }
  
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

export interface DocumentListProps {
  /**
   * Callback when a document is selected/clicked.
   */
  onSelectDocument?: (docId: string) => void;
  
  /**
   * Whether to show document actions (open, delete).
   */
  showActions?: boolean;
  
  /**
   * Initial status filter.
   */
  initialStatus?: DisplayStatus;
  
  /**
   * Initial search term.
   */
  initialSearch?: string;
}

/**
 * Document List Component
 * 
 * Displays a paginated, filterable list of documents with search and status filtering.
 * Well-organized into logical sections for maintainability.
 */
export function DocumentList({
  onSelectDocument,
  showActions = true,
  initialStatus,
  initialSearch = '',
}: DocumentListProps) {
  // Local UI state
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [statusFilter, setStatusFilter] = useState<DisplayStatus | 'all'>(initialStatus || 'all');
  const [limit, setLimit] = useState(20);
  const [offset, setOffset] = useState(0);
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [docToDelete, setDocToDelete] = useState<Document | null>(null);

  // Document data hook
  const {
    documents,
    stats,
    total,
    loading,
    statsLoading,
    error,
    refetch,
    refetchStats,
    setFilters,
  } = useDocuments({
    status: statusFilter === 'all' ? undefined : statusFilter,
    search: searchTerm || undefined,
    limit,
    offset,
  });

  // Handle errors gracefully
  useEffect(() => {
    if (error) {
      console.error('DocumentList error:', error);
    }
  }, [error]);

  // Apply filters when they change
  const handleStatusFilterChange = useCallback((value: string) => {
    const newStatus = value as DisplayStatus | 'all';
    setStatusFilter(newStatus);
    setOffset(0); // Reset to first page
    setFilters({
      status: newStatus === 'all' ? undefined : newStatus,
      search: searchTerm || undefined,
      limit,
      offset: 0,
    });
  }, [searchTerm, limit, setFilters]);

  // Debounced search handler
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);
  
  const handleSearchInput = useCallback((value: string) => {
    setSearchTerm(value);
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    const timeout = setTimeout(() => {
      setOffset(0); // Reset to first page
      setFilters({
        status: statusFilter === 'all' ? undefined : statusFilter,
        search: value || undefined,
        limit,
        offset: 0,
      });
    }, 500);
    setSearchTimeout(timeout);
  }, [statusFilter, limit, setFilters, searchTimeout]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, [searchTimeout]);

  // Pagination handlers
  const handlePreviousPage = useCallback(() => {
    if (offset > 0) {
      const newOffset = Math.max(0, offset - limit);
      setOffset(newOffset);
      setFilters({
        status: statusFilter === 'all' ? undefined : statusFilter,
        search: searchTerm || undefined,
        limit,
        offset: newOffset,
      });
    }
  }, [offset, limit, statusFilter, searchTerm, setFilters]);

  const handleNextPage = useCallback(() => {
    if (offset + limit < total) {
      const newOffset = offset + limit;
      setOffset(newOffset);
      setFilters({
        status: statusFilter === 'all' ? undefined : statusFilter,
        search: searchTerm || undefined,
        limit,
        offset: newOffset,
      });
    }
  }, [offset, limit, total, statusFilter, searchTerm, setFilters]);

  // Refresh handler
  const handleRefresh = useCallback(async () => {
    await Promise.all([refetch(), refetchStats()]);
    toast.success('Documents refreshed');
  }, [refetch, refetchStats]);

  // Archive handler
  const handleArchive = useCallback(async (docId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const response = await fetch('/api/admin/docs/archive', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: docId }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.detail?.message || errorData.message || `Archive failed: ${response.status}`;
        throw new Error(errorMessage);
      }

      toast.success('Document archived');
      await refetch();
      await refetchStats();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Archive failed';
      toast.error(`Archive failed: ${errorMessage}`);
    }
  }, [refetch, refetchStats]);

  // Unarchive handler
  const handleUnarchive = useCallback(async (docId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const response = await fetch('/api/admin/docs/unarchive', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: docId }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.detail?.message || errorData.message || `Unarchive failed: ${response.status}`;
        throw new Error(errorMessage);
      }

      toast.success('Document unarchived');
      await refetch();
      await refetchStats();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unarchive failed';
      toast.error(`Unarchive failed: ${errorMessage}`);
    }
  }, [refetch, refetchStats]);

  // Delete handler
  const handleDeleteClick = useCallback((doc: Document, e: React.MouseEvent) => {
    e.stopPropagation();
    setDocToDelete(doc);
    setDeleteDialogOpen(true);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!docToDelete) return;

    try {
      const response = await fetch(`/api/admin/docs/${encodeURIComponent(docToDelete.doc_id)}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.detail?.message || errorData.message || `Delete failed: ${response.status}`;
        throw new Error(errorMessage);
      }

      toast.success('Document deleted');
      setDeleteDialogOpen(false);
      setDocToDelete(null);
      await refetch();
      await refetchStats();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Delete failed';
      toast.error(`Delete failed: ${errorMessage}`);
    }
  }, [docToDelete, refetch, refetchStats]);

  // Document selection handler
  const handleDocumentClick = useCallback((docId: string) => {
    setSelectedDocId(docId);
    onSelectDocument?.(docId);
  }, [onSelectDocument]);

  // Computed values
  const hasNextPage = useMemo(() => offset + limit < total, [offset, limit, total]);
  const hasPreviousPage = useMemo(() => offset > 0, [offset]);
  const currentPage = useMemo(() => Math.floor(offset / limit) + 1, [offset, limit]);
  const totalPages = useMemo(() => Math.ceil(total / limit), [total, limit]);
  const filteredDocuments = useMemo(() => Array.isArray(documents) ? documents : [], [documents]);

  // Render document row
  const renderDocumentRow = useCallback((doc: Document) => {
    const displayStatus = computeDisplayStatus(doc);
    const isSelected = selectedDocId === doc.doc_id;
    const isAccessible = displayStatus !== 'deleted' && displayStatus !== 'superseded';

    return (
      <TableRow
        key={doc.doc_id}
        className={`cursor-pointer ${isSelected ? 'bg-muted' : ''} ${!isAccessible ? 'opacity-60' : ''}`}
        onClick={() => handleDocumentClick(doc.doc_id)}
      >
        <TableCell className="font-medium">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <span className="truncate max-w-[300px]">{doc.title || doc.file_name || 'Untitled'}</span>
          </div>
        </TableCell>
        <TableCell>
          <DocumentStatusBadge status={displayStatus} />
        </TableCell>
        <TableCell className="text-sm text-muted-foreground">
          {doc.chunk_count !== undefined ? `${doc.chunk_count} chunks` : '-'}
        </TableCell>
        <TableCell className="text-sm text-muted-foreground">
          {doc.citation_count !== undefined ? `${doc.citation_count} citations` : '-'}
        </TableCell>
        <TableCell className="text-sm text-muted-foreground">
          {formatDistanceToNow(doc.updated_at)}
        </TableCell>
        {showActions && (
          <TableCell>
            <div className="flex items-center gap-2">
              {isAccessible && displayStatus === 'active' && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => handleArchive(doc.doc_id, e)}
                  className="h-8 px-2 text-xs"
                  title="Archive"
                >
                  Archive
                </Button>
              )}
              {displayStatus === 'superseded' && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => handleUnarchive(doc.doc_id, e)}
                  className="h-8 px-2 text-xs"
                  title="Unarchive"
                >
                  Unarchive
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => handleDeleteClick(doc, e)}
                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                title="Delete"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </TableCell>
        )}
      </TableRow>
    );
  }, [selectedDocId, showActions, handleDocumentClick]);

  // Render empty state
  const renderEmptyState = useCallback(() => {
    if (loading) {
      return (
        <TableRow>
          <TableCell colSpan={showActions ? 6 : 5} className="h-24 text-center">
            <div className="flex flex-col items-center justify-center gap-2">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Loading documents...</p>
            </div>
          </TableCell>
        </TableRow>
      );
    }

    if (error) {
      return (
        <TableRow>
          <TableCell colSpan={showActions ? 6 : 5} className="h-24 text-center">
            <div className="flex flex-col items-center justify-center gap-2">
              <AlertCircle className="h-6 w-6 text-destructive" />
              <p className="text-sm text-destructive">{error}</p>
              <Button variant="outline" size="sm" onClick={handleRefresh}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            </div>
          </TableCell>
        </TableRow>
      );
    }

    if (!filteredDocuments || filteredDocuments.length === 0) {
      return (
        <TableRow>
          <TableCell colSpan={showActions ? 6 : 5} className="h-24 text-center">
            <div className="flex flex-col items-center justify-center gap-2">
              <FileText className="h-6 w-6 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                {searchTerm || statusFilter !== 'all'
                  ? 'No documents match your filters'
                  : 'No documents found'}
              </p>
            </div>
          </TableCell>
        </TableRow>
      );
    }

    return null;
  }, [loading, error, filteredDocuments, searchTerm, statusFilter, showActions, handleRefresh]);

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <CardTitle>Documents</CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={loading || statsLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading || statsLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search documents..."
                value={searchTerm}
                onChange={(e) => handleSearchInput(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
          <div className="w-full sm:w-48">
            <Select
              value={statusFilter}
              onChange={(e) => handleStatusFilterChange(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="failed">Failed</option>
              <option value="superseded">Superseded</option>
              <option value="deleted">Deleted</option>
            </Select>
          </div>
        </div>

        {/* Stats Summary */}
        {stats && typeof stats.total === 'number' && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 mb-6">
            <div className="text-center p-2 bg-muted rounded">
              <div className="text-lg font-semibold">{stats.total ?? 0}</div>
              <div className="text-xs text-muted-foreground">Total</div>
            </div>
            <div className="text-center p-2 bg-green-50 rounded">
              <div className="text-lg font-semibold text-green-700">{stats.active ?? 0}</div>
              <div className="text-xs text-muted-foreground">Active</div>
            </div>
            <div className="text-center p-2 bg-yellow-50 rounded">
              <div className="text-lg font-semibold text-yellow-700">{stats.pending ?? 0}</div>
              <div className="text-xs text-muted-foreground">Pending</div>
            </div>
            <div className="text-center p-2 bg-blue-50 rounded">
              <div className="text-lg font-semibold text-blue-700">{stats.processing ?? 0}</div>
              <div className="text-xs text-muted-foreground">Processing</div>
            </div>
            <div className="text-center p-2 bg-red-50 rounded">
              <div className="text-lg font-semibold text-red-700">{stats.failed ?? 0}</div>
              <div className="text-xs text-muted-foreground">Failed</div>
            </div>
            <div className="text-center p-2 bg-gray-50 rounded">
              <div className="text-lg font-semibold text-gray-700">{stats.superseded ?? 0}</div>
              <div className="text-xs text-muted-foreground">Superseded</div>
            </div>
          </div>
        )}

        {/* Document Table */}
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Chunks</TableHead>
                <TableHead>Citations</TableHead>
                <TableHead>Updated</TableHead>
                {showActions && <TableHead className="w-24">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {renderEmptyState()}
              {!loading && !error && Array.isArray(filteredDocuments) && filteredDocuments.length > 0 && (
                <>
                  {filteredDocuments.map(renderDocumentRow)}
                </>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {total > 0 && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mt-4">
            <div className="text-sm text-muted-foreground">
              Showing {offset + 1} to {Math.min(offset + limit, total)} of {total} documents
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePreviousPage}
                disabled={!hasPreviousPage || loading}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>
              <div className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleNextPage}
                disabled={!hasNextPage || loading}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>

      {/* Delete confirmation dialog */}
      <ConfirmationDialog
        open={deleteDialogOpen}
        onClose={() => {
          setDeleteDialogOpen(false);
          setDocToDelete(null);
        }}
        title="Delete Document"
        message={`Are you sure you want to delete "${docToDelete?.title || docToDelete?.file_name || 'this document'}"? This action cannot be undone.`}
        confirmText="Delete"
        variant="destructive"
        onConfirm={handleDeleteConfirm}
      />
    </Card>
  );
}

