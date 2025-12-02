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
import type { Document, DisplayStatus, DocumentStats } from '@/lib/types/documents';
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
  ExternalLink,
  MoreVertical,
  Archive,
  ArchiveRestore,
  Info,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { openDocument, DocumentOpenError } from '@/lib/api/documents';

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
  const [hardDeleteDialogOpen, setHardDeleteDialogOpen] = useState(false);
  const [docToDelete, setDocToDelete] = useState<Document | null>(null);
  const [actionLoading, setActionLoading] = useState<Set<string>>(new Set()); // Track which documents are being acted upon
  const [showHelp, setShowHelp] = useState(false); // Help section visibility

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

  // Compute stats from actual documents if backend stats are missing/incorrect
  const computedStats = useMemo(() => {
    if (!documents || documents.length === 0) {
      return stats;
    }

    // If stats exist and look valid, use them
    if (stats && typeof stats.total === 'number' && stats.total > 0) {
      return stats;
    }

    // Otherwise, compute from documents
    const computed = {
      total: documents.length,
      active: documents.filter(d => {
        const status = computeDisplayStatus(d);
        return status === 'active';
      }).length,
      pending: documents.filter(d => {
        const status = computeDisplayStatus(d);
        return status === 'pending';
      }).length,
      processing: documents.filter(d => {
        const status = computeDisplayStatus(d);
        return status === 'processing';
      }).length,
      failed: documents.filter(d => {
        const status = computeDisplayStatus(d);
        return status === 'failed';
      }).length,
      superseded: documents.filter(d => {
        const status = computeDisplayStatus(d);
        return status === 'superseded';
      }).length,
      deleted: documents.filter(d => {
        const status = computeDisplayStatus(d);
        return status === 'deleted';
      }).length,
    };

    console.log('[DocumentList] Computed stats from documents:', computed);
    return computed;
  }, [documents, stats]);

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
    
    // Backend only accepts: active, archived, superseded, all
    // Map DisplayStatus to backend status
    let backendStatus: 'active' | 'archived' | 'superseded' | undefined = undefined;
    if (newStatus === 'all') {
      backendStatus = undefined; // 'all' means no filter
    } else if (newStatus === 'active' || newStatus === 'archived' || newStatus === 'superseded') {
      backendStatus = newStatus;
    } else if (newStatus === 'deleted') {
      // Deleted is a computed status, filter client-side
      backendStatus = undefined; // Fetch all and filter client-side
    }
    // Ignore: pending, processing, failed (these are computed from upload_status, not backend statuses)
    
    setFilters({
      status: backendStatus,
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
  const handleArchive = useCallback(async (docId: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    
    if (!docId || docId === 'undefined' || docId === 'null') {
      console.error('[Archive] Invalid document ID:', docId);
      toast.error('Archive failed: Document ID is missing or invalid');
      return;
    }
    
    // Set loading state for this specific document
    setActionLoading(prev => new Set(prev).add(docId));
    
    try {
      // Backend expects: { id: "uuid" } - ensure it's a string UUID
      const requestBody = { id: String(docId).trim() };
      
      // Validate UUID format (basic check)
      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(requestBody.id)) {
        console.error('[Archive] Invalid UUID format:', requestBody.id);
        toast.error('Archive failed: Invalid document ID format');
        setActionLoading(prev => {
          const next = new Set(prev);
          next.delete(docId);
          return next;
        });
        return;
      }
      
      console.log('[Archive] Sending request:', { docId, requestBody, bodyString: JSON.stringify(requestBody) });
      
      const response = await fetch('/api/admin/docs/archive', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });
      
      console.log('[Archive] Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        console.error('[Archive] Error response text:', errorText);
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { message: errorText || `Archive failed: ${response.status}` };
        }
        console.error('[Archive] Error response:', errorData);
        const errorMessage = errorData.detail?.message || errorData.detail?.error?.message || errorData.message || `Archive failed: ${response.status}`;
        throw new Error(errorMessage);
      }

      toast.success('Document archived');
      
      // Silently refresh data in background without showing loading state
      Promise.all([refetch(), refetchStats()]).catch(err => {
        console.error('Failed to refresh after archive:', err);
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Archive failed';
      toast.error(`Archive failed: ${errorMessage}`);
    } finally {
      // Remove loading state
      setActionLoading(prev => {
        const next = new Set(prev);
        next.delete(docId);
        return next;
      });
    }
  }, [refetch, refetchStats]);

  // Unarchive handler
  const handleUnarchive = useCallback(async (docId: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    
    // Set loading state for this specific document
    setActionLoading(prev => new Set(prev).add(docId));
    
    try {
      // Backend expects: { id: "uuid" }
      const requestBody = { id: docId };
      console.log('[Unarchive] Sending request:', { docId, requestBody });
      
      const response = await fetch('/api/admin/docs/unarchive', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });
      
      console.log('[Unarchive] Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.detail?.message || errorData.message || `Unarchive failed: ${response.status}`;
        throw new Error(errorMessage);
      }

      toast.success('Document unarchived');
      
      // Silently refresh data in background without showing loading state
      Promise.all([refetch(), refetchStats()]).catch(err => {
        console.error('Failed to refresh after unarchive:', err);
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unarchive failed';
      toast.error(`Unarchive failed: ${errorMessage}`);
    } finally {
      // Remove loading state
      setActionLoading(prev => {
        const next = new Set(prev);
        next.delete(docId);
        return next;
      });
    }
  }, [refetch, refetchStats]);

  // Helper to get document ID (handles both 'id' and 'doc_id' fields)
  const getDocumentId = useCallback((doc: Document | any): string | null => {
    return doc?.id || doc?.doc_id || null;
  }, []);

  // Open file handler - opens original PDF/DOCX file
  const handleOpenFile = useCallback(async (docId: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    
    // Set loading state
    setActionLoading(prev => new Set(prev).add(docId));
    
    try {
      const result = await openDocument(docId);
      
      if (result.url) {
        window.open(result.url, '_blank');
        toast.success('Opening file...');
      } else {
        throw new Error('No file URL returned from server');
      }
    } catch (err) {
      // Handle structured error from openDocument
      if (err instanceof Error) {
        // Check if it's a DocumentOpenError with a code
        const errorCode = (err as any).code;
        const errorMessage = err.message;
        
        // Show user-friendly error message (already formatted by openDocument)
        toast.error(errorMessage, {
          duration: errorCode === 'no_original_file' ? 6000 : 4000, // Longer duration for important messages
        });
      } else {
        toast.error('Failed to open file. Please try again.');
      }
    } finally {
      // Remove loading state
      setActionLoading(prev => {
        const next = new Set(prev);
        next.delete(docId);
        return next;
      });
    }
  }, []);

  // Delete handler - soft delete (default)
  const handleDeleteClick = useCallback((doc: Document, e: React.MouseEvent) => {
    e.stopPropagation();
    setDocToDelete(doc);
    setDeleteDialogOpen(true);
  }, []);

  // Hard delete handler
  const handleHardDeleteClick = useCallback((doc: Document, e: React.MouseEvent) => {
    e.stopPropagation();
    setDocToDelete(doc);
    setHardDeleteDialogOpen(true);
  }, []);

  const handleDeleteConfirm = useCallback(async (hardDelete: boolean = false) => {
    if (!docToDelete) {
      toast.error('Delete failed: Document is missing');
      setDeleteDialogOpen(false);
      setHardDeleteDialogOpen(false);
      setDocToDelete(null);
      return;
    }

    // Handle both 'id' and 'doc_id' fields from API
    const docId = getDocumentId(docToDelete);
    
    if (!docId) {
      console.error('[Delete] Document missing ID:', docToDelete);
      toast.error('Delete failed: Document ID is missing');
      setDeleteDialogOpen(false);
      setHardDeleteDialogOpen(false);
      setDocToDelete(null);
      return;
    }

    // Set loading state
    setActionLoading(prev => new Set(prev).add(docId));

    try {
      const url = hardDelete 
        ? `/api/admin/docs/${encodeURIComponent(docId)}?hard=true`
        : `/api/admin/docs/${encodeURIComponent(docId)}`;
      
      console.log('[Delete] Sending request:', { docId, hardDelete, url });
      
      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      console.log('[Delete] Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.detail?.message || errorData.message || `Delete failed: ${response.status}`;
        throw new Error(errorMessage);
      }

      toast.success(hardDelete ? 'Document permanently deleted' : 'Document deleted (can be restored)');
      setDeleteDialogOpen(false);
      setHardDeleteDialogOpen(false);
      setDocToDelete(null);
      
      // Silently refresh data in background without showing loading state
      Promise.all([refetch(), refetchStats()]).catch(err => {
        console.error('Failed to refresh after delete:', err);
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Delete failed';
      toast.error(`Delete failed: ${errorMessage}`);
    } finally {
      // Remove loading state
      setActionLoading(prev => {
        const next = new Set(prev);
        next.delete(docId);
        return next;
      });
    }
  }, [docToDelete, refetch, refetchStats, getDocumentId]);

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
  // Filter documents based on status filter (client-side for computed statuses like deleted)
  const filteredDocuments = useMemo(() => {
    const docs = Array.isArray(documents) ? documents : [];
    
    // If status filter is 'all', return all documents
    if (statusFilter === 'all') {
      return docs;
    }
    
    // If status filter is a backend status (active, archived, superseded), 
    // backend already filtered, so return as-is
    if (statusFilter === 'active' || statusFilter === 'archived' || statusFilter === 'superseded') {
      return docs;
    }
    
    // For computed statuses (deleted, pending, processing, failed), filter client-side
    return docs.filter(doc => {
      const displayStatus = computeDisplayStatus(doc);
      return displayStatus === statusFilter;
    });
  }, [documents, statusFilter]);

  // Render document row
  const renderDocumentRow = useCallback((doc: Document) => {
    // Handle both 'id' and 'doc_id' fields from API
    const docId = getDocumentId(doc);
    
    if (!docId) {
      console.error('[DocumentList] Document missing ID:', doc);
      return null;
    }
    
    // Debug: Log document status fields
    console.log('[DocumentList] Document status fields:', {
      doc_id: docId,
      doc_status: (doc as any).doc_status,
      status: (doc as any).status,
      archived_at: (doc as any).archived_at,
      upload_status: (doc as any).upload_status,
    });
    
    const displayStatus = computeDisplayStatus(doc as any);
    const isSelected = selectedDocId === docId;
    const isAccessible = displayStatus !== 'deleted' && displayStatus !== 'superseded';

    return (
      <TableRow
        key={docId}
        className={`cursor-pointer hover:bg-muted/50 ${isSelected ? 'bg-muted' : ''} ${!isAccessible ? 'opacity-60' : ''}`}
        onClick={() => handleDocumentClick(docId)}
        title="Click row to view document details, chunks, and citations"
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
        <TableCell 
          className="text-sm text-muted-foreground" 
          title="Number of text chunks this document was split into (for RAG/search)"
        >
          {(doc as any).chunks_count !== undefined 
            ? `${(doc as any).chunks_count}` 
            : doc.chunk_count !== undefined 
            ? `${doc.chunk_count}` 
            : '0'}
        </TableCell>
        <TableCell 
          className="text-sm text-muted-foreground" 
          title="Number of FAQs/inbox items that reference this document"
        >
          {doc.citation_count !== undefined ? `${doc.citation_count}` : '0'}
        </TableCell>
        <TableCell className="text-sm text-muted-foreground">
          {formatDistanceToNow(doc.updated_at)}
        </TableCell>
        {showActions && (
          <TableCell>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={(e) => e.stopPropagation()}
                  disabled={actionLoading.has(docId)}
                >
                  {actionLoading.has(docId) ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <MoreVertical className="h-4 w-4" />
                  )}
                  <span className="sr-only">Open menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                {/* Primary action */}
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenFile(docId);
                  }}
                  disabled={actionLoading.has(docId)}
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  <span>Open File</span>
                  <span className="ml-2 text-xs text-muted-foreground">PDF/DOCX</span>
                </DropdownMenuItem>
                
                <DropdownMenuSeparator />
                
                {/* Status management */}
                {displayStatus === 'active' && (
                  <DropdownMenuItem
                    onClick={async (e) => {
                      e.stopPropagation();
                      try {
                        await handleArchive(docId, e);
                      } catch (err) {
                        console.error('Archive error:', err);
                        // Error is already handled in handleArchive
                      }
                    }}
                    disabled={actionLoading.has(docId)}
                    className="text-orange-600 focus:text-orange-600"
                  >
                    <Archive className="mr-2 h-4 w-4" />
                    <div className="flex flex-col">
                      <span>Archive</span>
                      <span className="text-xs text-muted-foreground">Hide from active view (can be restored)</span>
                    </div>
                  </DropdownMenuItem>
                )}
                {(displayStatus === 'superseded' || displayStatus === 'archived') && (
                  <DropdownMenuItem
                    onClick={async (e) => {
                      e.stopPropagation();
                      try {
                        await handleUnarchive(docId, e);
                      } catch (err) {
                        console.error('Unarchive error:', err);
                        // Error is already handled in handleUnarchive
                      }
                    }}
                    disabled={actionLoading.has(docId)}
                    className="text-green-600 focus:text-green-600"
                  >
                    <ArchiveRestore className="mr-2 h-4 w-4" />
                    <div className="flex flex-col">
                      <span>Unarchive</span>
                      <span className="text-xs text-muted-foreground">Restore to active view</span>
                    </div>
                  </DropdownMenuItem>
                )}
                
                <DropdownMenuSeparator />
                
                {/* Destructive actions */}
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteClick(doc, e);
                  }}
                  disabled={actionLoading.has(docId)}
                  className="text-red-600 focus:text-red-600"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  <div className="flex flex-col">
                    <span>Delete</span>
                    <span className="text-xs text-muted-foreground">Mark for removal (can be restored)</span>
                  </div>
                </DropdownMenuItem>
                
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    handleHardDeleteClick(doc, e);
                  }}
                  disabled={actionLoading.has(docId)}
                  className="text-red-700 focus:text-red-700 focus:bg-red-50"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  <div className="flex flex-col">
                    <span className="font-medium">Delete Permanently</span>
                    <span className="text-xs text-muted-foreground">Cannot be restored</span>
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </TableCell>
        )}
      </TableRow>
    );
  }, [selectedDocId, showActions, handleDocumentClick, handleArchive, handleUnarchive, handleDeleteClick, handleHardDeleteClick, handleOpenFile, actionLoading, getDocumentId]);

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
    <Card className="border-2 shadow-lg">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b-2">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <CardTitle className="text-xl font-bold text-gray-800">Documents</CardTitle>
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
        {/* Help Section - Collapsible */}
        <div className="mb-4 border rounded-lg bg-blue-50/50 border-blue-200">
          <button
            onClick={() => setShowHelp(!showHelp)}
            className="w-full flex items-center justify-between p-3 text-left hover:bg-blue-100/50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Info className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-900">Understanding Archive vs Delete</span>
            </div>
            {showHelp ? (
              <ChevronUp className="h-4 w-4 text-blue-600" />
            ) : (
              <ChevronDown className="h-4 w-4 text-blue-600" />
            )}
          </button>
          {showHelp && (
            <div className="px-3 pb-3 border-t border-blue-200 bg-white">
              <div className="pt-3 space-y-3 text-sm">
                <p className="text-muted-foreground">
                  Documents can be managed using three actions. Choose the right one for your workflow:
                </p>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2 font-semibold">Scenario</th>
                        <th className="text-center p-2 font-semibold">Archive</th>
                        <th className="text-center p-2 font-semibold">Soft Delete</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b">
                        <td className="p-2">I don't need this document anymore</td>
                        <td className="text-center p-2">✅</td>
                        <td className="text-center p-2">✅</td>
                      </tr>
                      <tr className="border-b">
                        <td className="p-2">I want to keep it for compliance</td>
                        <td className="text-center p-2">✅</td>
                        <td className="text-center p-2">❌</td>
                      </tr>
                      <tr className="border-b">
                        <td className="p-2">I want to delete but might need it back</td>
                        <td className="text-center p-2">❌</td>
                        <td className="text-center p-2">✅</td>
                      </tr>
                      <tr>
                        <td className="p-2">I want to permanently remove it</td>
                        <td className="text-center p-2">❌</td>
                        <td className="text-center p-2">❌</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div className="space-y-2 pt-2">
                  <div className="flex items-start gap-2">
                    <Archive className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="font-medium">Archive:</span>
                      <span className="text-muted-foreground"> Hides from active view, keeps for audit/compliance. Can be restored.</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Trash2 className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="font-medium">Delete (Soft):</span>
                      <span className="text-muted-foreground"> Marks as deleted, recoverable. Use when you might need it back.</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Trash2 className="h-4 w-4 text-red-700 mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="font-medium">Delete Permanently (Hard):</span>
                      <span className="text-muted-foreground"> Permanent removal, cannot be restored. Use with caution.</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

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
              <option value="archived">Archived</option>
              <option value="superseded">Superseded</option>
              <option value="deleted">Deleted</option>
            </Select>
          </div>
        </div>

        {/* Stats Summary - Enhanced with colored cards */}
        {computedStats && typeof computedStats.total === 'number' && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 mb-6">
            <Card className="bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-gray-800">{computedStats.total ?? 0}</div>
                <div className="text-xs font-medium text-gray-600 mt-1">Total</div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-700">{computedStats.active ?? 0}</div>
                <div className="text-xs font-medium text-green-600 mt-1">Active</div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-yellow-700">{computedStats.pending ?? 0}</div>
                <div className="text-xs font-medium text-yellow-600 mt-1">Pending</div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-700">{computedStats.processing ?? 0}</div>
                <div className="text-xs font-medium text-blue-600 mt-1">Processing</div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-red-700">{computedStats.failed ?? 0}</div>
                <div className="text-xs font-medium text-red-600 mt-1">Failed</div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-orange-700">{computedStats.superseded ?? 0}</div>
                <div className="text-xs font-medium text-orange-600 mt-1">Superseded</div>
              </CardContent>
            </Card>
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

      {/* Soft delete confirmation dialog */}
      <ConfirmationDialog
        open={deleteDialogOpen}
        onClose={() => {
          setDeleteDialogOpen(false);
          setDocToDelete(null);
        }}
        title="Delete Document"
        message={`Are you sure you want to delete "${docToDelete?.title || docToDelete?.file_name || 'this document'}"? This is a soft delete and can be restored later.`}
        confirmText="Delete"
        variant="destructive"
        onConfirm={() => handleDeleteConfirm(false)}
      />
      
      {/* Hard delete confirmation dialog */}
      <ConfirmationDialog
        open={hardDeleteDialogOpen}
        onClose={() => {
          setHardDeleteDialogOpen(false);
          setDocToDelete(null);
        }}
        title="⚠️ Permanently Delete Document"
        message={`⚠️ WARNING: Are you sure you want to PERMANENTLY delete "${docToDelete?.title || docToDelete?.file_name || 'this document'}"? This action CANNOT be undone. All data will be permanently removed from the system.`}
        confirmText="Delete Permanently"
        variant="destructive"
        onConfirm={() => handleDeleteConfirm(true)}
      />
    </Card>
  );
}

