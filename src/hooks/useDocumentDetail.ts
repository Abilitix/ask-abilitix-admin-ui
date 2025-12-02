/**
 * Custom hook for fetching and managing a single document's detail view.
 * 
 * Provides state management for document detail, chunks, and citations,
 * with loading states and error handling.
 * 
 * @module hooks/useDocumentDetail
 */

import { useState, useCallback, useEffect } from 'react';
import {
  fetchDocument,
  fetchDocumentChunks,
  fetchDocumentCitations,
  openDocument,
  deleteDocument,
} from '@/lib/api/documents';
import type {
  DocumentDetail,
  DocumentChunk,
  DocumentCitation,
  DocumentChunksResponse,
  DocumentCitationsResponse,
} from '@/lib/types/documents';
import { toast } from 'sonner';

/**
 * Return type for useDocumentDetail hook.
 */
export interface UseDocumentDetailReturn {
  // Data
  document: DocumentDetail | null;
  chunks: DocumentChunk[];
  citations: DocumentCitation[];
  chunksTotal: number;
  citationsTotal: number;
  
  // Loading states
  loading: boolean;
  chunksLoading: boolean;
  citationsLoading: boolean;
  actionLoading: boolean;
  
  // Error state
  error: string | null;
  
  // Actions
  refetch: () => Promise<void>;
  refetchChunks: (options?: { limit?: number; offset?: number }) => Promise<void>;
  refetchCitations: (options?: { limit?: number; offset?: number }) => Promise<void>;
  handleOpen: () => Promise<void>;
  handleDelete: () => Promise<void>;
}

/**
 * Custom hook for managing a single document's detail state.
 * 
 * @param docId - Document ID (UUID)
 * @param autoFetch - Whether to automatically fetch on mount (default: true)
 * @returns Hook return object with data, loading states, and actions
 * 
 * @example
 * ```typescript
 * const { document, chunks, loading, refetch } = useDocumentDetail(docId);
 * ```
 */
export function useDocumentDetail(
  docId: string | null,
  autoFetch: boolean = true
): UseDocumentDetailReturn {
  const [document, setDocument] = useState<DocumentDetail | null>(null);
  const [chunks, setChunks] = useState<DocumentChunk[]>([]);
  const [citations, setCitations] = useState<DocumentCitation[]>([]);
  const [chunksTotal, setChunksTotal] = useState(0);
  const [citationsTotal, setCitationsTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [chunksLoading, setChunksLoading] = useState(false);
  const [citationsLoading, setCitationsLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch document detail
  const refetch = useCallback(async () => {
    if (!docId) {
      setDocument(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const data = await fetchDocument(docId);
      setDocument(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch document';
      setError(errorMessage);
      toast.error(errorMessage);
      console.error('Failed to fetch document:', err);
    } finally {
      setLoading(false);
    }
  }, [docId]);

  // Fetch document chunks
  const refetchChunks = useCallback(
    async (options: { limit?: number; offset?: number } = {}) => {
      if (!docId) {
        setChunks([]);
        return;
      }

      try {
        setChunksLoading(true);
        console.log('[useDocumentDetail] Fetching chunks:', { docId, options });
        const response: DocumentChunksResponse = await fetchDocumentChunks(docId, options);
        console.log('[useDocumentDetail] Chunks response:', { total: response.total, itemsCount: response.items?.length });
        setChunks(Array.isArray(response.items) ? response.items : []);
        setChunksTotal(typeof response.total === 'number' ? response.total : 0);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch chunks';
        console.error('[useDocumentDetail] Failed to fetch chunks:', { docId, error: err, message: errorMessage });
        // Don't show toast for chunks - it's not critical
        setChunks([]);
        setChunksTotal(0);
      } finally {
        setChunksLoading(false);
      }
    },
    [docId]
  );

  // Fetch document citations
  const refetchCitations = useCallback(
    async (options: { limit?: number; offset?: number } = {}) => {
      if (!docId) {
        setCitations([]);
        return;
      }

      try {
        setCitationsLoading(true);
        console.log('[useDocumentDetail] Fetching citations:', { docId, options });
        const response: DocumentCitationsResponse = await fetchDocumentCitations(docId, options);
        console.log('[useDocumentDetail] Citations response:', { total: response.total, itemsCount: response.items?.length });
        setCitations(Array.isArray(response.items) ? response.items : []);
        setCitationsTotal(typeof response.total === 'number' ? response.total : 0);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch citations';
        console.error('[useDocumentDetail] Failed to fetch citations:', { docId, error: err, message: errorMessage });
        // Don't show toast for citations - it's not critical
        setCitations([]);
        setCitationsTotal(0);
      } finally {
        setCitationsLoading(false);
      }
    },
    [docId]
  );

  // Handle open document action
  const handleOpen = useCallback(async () => {
    if (!docId) return;

    try {
      setActionLoading(true);
      await openDocument(docId);
      toast.success('Document opened successfully');
      // Refetch to get updated status
      await refetch();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to open document';
      toast.error(errorMessage);
      console.error('Failed to open document:', err);
    } finally {
      setActionLoading(false);
    }
  }, [docId, refetch]);

  // Handle delete document action
  const handleDelete = useCallback(async () => {
    if (!docId) return;

    try {
      setActionLoading(true);
      await deleteDocument(docId);
      toast.success('Document deleted successfully');
      // Clear document state
      setDocument(null);
      setChunks([]);
      setCitations([]);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete document';
      toast.error(errorMessage);
      console.error('Failed to delete document:', err);
    } finally {
      setActionLoading(false);
    }
  }, [docId]);

  // Auto-fetch on mount and when docId changes
  useEffect(() => {
    if (autoFetch && docId) {
      refetch();
    }
  }, [docId, autoFetch, refetch]);

  return {
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
  };
}

