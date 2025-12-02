/**
 * Document Detail Component
 * 
 * Well-organized component (400-600 lines) for displaying detailed document information,
 * including metadata, chunks, citations, and actions.
 * 
 * @module components/documents/DocumentDetail
 */

'use client';

import { useState, useCallback, useEffect } from 'react';
import { useDocumentDetail } from '@/hooks/useDocumentDetail';
import { DocumentStatusBadge } from './DocumentStatusBadge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import type { DocumentDetail } from '@/lib/types/documents';
import { computeDisplayStatus, isDocumentAccessible } from '@/lib/types/documents';
import {
  FileText,
  RefreshCw,
  Loader2,
  Trash2,
  Play,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  FileCode,
  Link2,
} from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

export interface DocumentDetailProps {
  /**
   * Document ID to display.
   */
  docId: string | null;
  
  /**
   * Callback when document is closed/deleted.
   */
  onClose?: () => void;
  
  /**
   * Whether to show actions (open, delete).
   */
  showActions?: boolean;
}

/**
 * Formats a date string as a relative time (e.g., "2h ago", "3d ago").
 */
function formatDistanceToNow(dateString: string): string {
  const date = new Date(dateString);
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

/**
 * Document Detail Component
 * 
 * Displays comprehensive document information including metadata, chunks, and citations.
 * Well-organized into logical sections for maintainability.
 */
export function DocumentDetail({
  docId,
  onClose,
  showActions = true,
}: DocumentDetailProps) {
  // Local UI state
  const [chunksLimit, setChunksLimit] = useState(20);
  const [chunksOffset, setChunksOffset] = useState(0);
  const [citationsLimit, setCitationsLimit] = useState(20);
  const [citationsOffset, setCitationsOffset] = useState(0);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'chunks' | 'citations'>('chunks');

  // Document data hook
  const {
    document,
    chunks,
    citations,
    chunksTotal,
    citationsTotal,
    loading,
    chunksLoading,
    citationsLoading,
    actionLoading,
    error,
    refetch,
    refetchChunks,
    refetchCitations,
    handleOpen,
    handleDelete,
  } = useDocumentDetail(docId, true);

  // Load chunks and citations when document loads
  useEffect(() => {
    if (docId && document) {
      refetchChunks({ limit: chunksLimit, offset: chunksOffset });
      refetchCitations({ limit: citationsLimit, offset: citationsOffset });
    }
  }, [docId, document, chunksLimit, chunksOffset, citationsLimit, citationsOffset, refetchChunks, refetchCitations]);

  // Delete handler with confirmation
  const handleDeleteConfirm = useCallback(async () => {
    setDeleteDialogOpen(false);
    await handleDelete();
    onClose?.();
  }, [handleDelete, onClose]);

  // Pagination handlers for chunks
  const handleChunksPrevious = useCallback(() => {
    if (chunksOffset > 0) {
      const newOffset = Math.max(0, chunksOffset - chunksLimit);
      setChunksOffset(newOffset);
    }
  }, [chunksOffset, chunksLimit]);

  const handleChunksNext = useCallback(() => {
    if (chunksOffset + chunksLimit < chunksTotal) {
      setChunksOffset(chunksOffset + chunksLimit);
    }
  }, [chunksOffset, chunksLimit, chunksTotal]);

  // Pagination handlers for citations
  const handleCitationsPrevious = useCallback(() => {
    if (citationsOffset > 0) {
      const newOffset = Math.max(0, citationsOffset - citationsLimit);
      setCitationsOffset(newOffset);
    }
  }, [citationsOffset, citationsLimit]);

  const handleCitationsNext = useCallback(() => {
    if (citationsOffset + citationsLimit < citationsTotal) {
      setCitationsOffset(citationsOffset + citationsLimit);
    }
  }, [citationsOffset, citationsLimit, citationsTotal]);

  // Refresh handler
  const handleRefresh = useCallback(async () => {
    await Promise.all([refetch(), refetchChunks({ limit: chunksLimit, offset: chunksOffset }), refetchCitations({ limit: citationsLimit, offset: citationsOffset })]);
    toast.success('Document refreshed');
  }, [refetch, refetchChunks, refetchCitations, chunksLimit, chunksOffset, citationsLimit, citationsOffset]);

  // Render loading state
  if (loading && !document) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Loading document...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Render error state
  if (error && !document) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center gap-2">
            <AlertCircle className="h-8 w-8 text-destructive" />
            <p className="text-sm text-destructive">{error}</p>
            <Button variant="outline" size="sm" onClick={handleRefresh}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Render empty state
  if (!document) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center gap-2">
            <FileText className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No document selected</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const displayStatus = computeDisplayStatus(document);
  const isAccessible = isDocumentAccessible(document);

  // Render document metadata section
  const renderMetadata = () => (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex-1">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {document.title || document.file_name || 'Untitled Document'}
            </CardTitle>
            <div className="mt-2 flex items-center gap-2">
              <DocumentStatusBadge status={displayStatus} />
              <span className="text-sm text-muted-foreground">
                ID: {document.doc_id.slice(0, 8)}...
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {showActions && (
              <>
                {isAccessible && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleOpen}
                    disabled={actionLoading}
                  >
                    <Play className={`h-4 w-4 mr-2 ${actionLoading ? 'animate-spin' : ''}`} />
                    Open
                  </Button>
                )}
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setDeleteDialogOpen(true)}
                  disabled={actionLoading}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </>
            )}
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            {onClose && (
              <Button variant="ghost" size="sm" onClick={onClose}>
                <ChevronLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <div className="text-xs text-muted-foreground mb-1">File Name</div>
            <div className="text-sm font-medium">{document.file_name || '-'}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground mb-1">File Size</div>
            <div className="text-sm font-medium">
              {document.file_size ? `${(document.file_size / 1024).toFixed(2)} KB` : '-'}
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground mb-1">MIME Type</div>
            <div className="text-sm font-medium">{document.mime_type || '-'}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground mb-1">Chunks</div>
            <div className="text-sm font-medium">{document.chunk_count ?? '-'}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground mb-1">Citations</div>
            <div className="text-sm font-medium">{document.citation_count ?? '-'}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground mb-1">Created</div>
            <div className="text-sm font-medium">{formatDistanceToNow(document.created_at)}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground mb-1">Updated</div>
            <div className="text-sm font-medium">{formatDistanceToNow(document.updated_at)}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  // Render chunks table
  const renderChunks = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileCode className="h-5 w-5" />
          Chunks ({chunksTotal})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {chunksLoading ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : chunks.length === 0 ? (
          <div className="flex items-center justify-center h-32">
            <p className="text-sm text-muted-foreground">No chunks found</p>
          </div>
        ) : (
          <>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Page</TableHead>
                    <TableHead>Content Preview</TableHead>
                    <TableHead>Span</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {chunks.map((chunk) => (
                    <TableRow key={chunk.chunk_id}>
                      <TableCell className="font-medium">
                        {chunk.page_number !== undefined ? `Page ${chunk.page_number}` : '-'}
                      </TableCell>
                      <TableCell>
                        <div className="max-w-md truncate text-sm">
                          {chunk.content.slice(0, 200)}
                          {chunk.content.length > 200 && '...'}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {chunk.span_start !== undefined && chunk.span_end !== undefined
                          ? `${chunk.span_start}-${chunk.span_end}`
                          : '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {chunksTotal > chunksLimit && (
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-muted-foreground">
                  Showing {chunksOffset + 1} to {Math.min(chunksOffset + chunksLimit, chunksTotal)} of {chunksTotal} chunks
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleChunksPrevious}
                    disabled={chunksOffset === 0 || chunksLoading}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleChunksNext}
                    disabled={chunksOffset + chunksLimit >= chunksTotal || chunksLoading}
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );

  // Render citations table
  const renderCitations = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Link2 className="h-5 w-5" />
          Citations ({citationsTotal})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {citationsLoading ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : citations.length === 0 ? (
          <div className="flex items-center justify-center h-32">
            <p className="text-sm text-muted-foreground">No citations found</p>
          </div>
        ) : (
          <>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Citation ID</TableHead>
                    <TableHead>Chunk ID</TableHead>
                    <TableHead>Page</TableHead>
                    <TableHead>Span Text</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {citations.map((citation) => (
                    <TableRow key={citation.citation_id}>
                      <TableCell className="font-medium text-sm">
                        {citation.citation_id.slice(0, 8)}...
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {citation.chunk_id ? `${citation.chunk_id.slice(0, 8)}...` : '-'}
                      </TableCell>
                      <TableCell className="text-sm">
                        {citation.page_number !== undefined ? `Page ${citation.page_number}` : '-'}
                      </TableCell>
                      <TableCell className="text-sm">
                        <div className="max-w-md truncate">
                          {citation.span_text || '-'}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {citationsTotal > citationsLimit && (
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-muted-foreground">
                  Showing {citationsOffset + 1} to {Math.min(citationsOffset + citationsLimit, citationsTotal)} of {citationsTotal} citations
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCitationsPrevious}
                    disabled={citationsOffset === 0 || citationsLoading}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCitationsNext}
                    disabled={citationsOffset + citationsLimit >= citationsTotal || citationsLoading}
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-4">
      {/* Metadata */}
      {renderMetadata()}

      {/* Tabs for chunks/citations */}
      <div className="flex gap-2 border-b">
        <button
          onClick={() => setActiveTab('chunks')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'chunks'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Chunks
        </button>
        <button
          onClick={() => setActiveTab('citations')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'citations'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Citations
        </button>
      </div>

      {/* Content based on active tab */}
      {activeTab === 'chunks' ? renderChunks() : renderCitations()}

      {/* Delete confirmation dialog */}
      <ConfirmationDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        title="Delete Document"
        message={`Are you sure you want to delete "${document.title || document.file_name || 'this document'}"? This action cannot be undone.`}
        confirmText="Delete"
        variant="destructive"
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}

