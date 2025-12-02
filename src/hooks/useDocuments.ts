/**
 * Custom hook for fetching and managing document lists.
 * 
 * Provides state management, loading states, error handling, and refresh functionality
 * for the document list view.
 * 
 * @module hooks/useDocuments
 */

import { useState, useCallback, useEffect } from 'react';
import { fetchDocuments, fetchDocumentStats } from '@/lib/api/documents';
import type {
  Document,
  DocumentListResponse,
  DocumentStats,
  DocumentListParams,
  DisplayStatus,
} from '@/lib/types/documents';
import { toast } from 'sonner';

/**
 * Return type for useDocuments hook.
 */
export interface UseDocumentsReturn {
  // Data
  documents: Document[];
  stats: DocumentStats | null;
  total: number;
  
  // Loading states
  loading: boolean;
  statsLoading: boolean;
  
  // Error state
  error: string | null;
  
  // Actions
  refetch: () => Promise<void>;
  refetchStats: () => Promise<void>;
  silentRefetch: () => Promise<void>; // Refetch without showing loading state
  setFilters: (filters: DocumentListParams) => void;
  
  // Current filters
  filters: DocumentListParams;
}

/**
 * Custom hook for managing document list state and fetching.
 * 
 * @param initialFilters - Initial filter parameters
 * @returns Hook return object with data, loading states, and actions
 * 
 * @example
 * ```typescript
 * const { documents, loading, refetch, setFilters } = useDocuments({
 *   status: 'active',
 *   limit: 20,
 * });
 * ```
 */
export function useDocuments(initialFilters: DocumentListParams = {}): UseDocumentsReturn {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [stats, setStats] = useState<DocumentStats | null>(null);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFiltersState] = useState<DocumentListParams>(initialFilters);

  // Fetch documents list
  const refetch = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response: DocumentListResponse = await fetchDocuments(filters);
      
      // Defensive check
      setDocuments(Array.isArray(response.items) ? response.items : []);
      setTotal(typeof response.total === 'number' ? response.total : 0);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch documents';
      setError(errorMessage);
      toast.error(errorMessage);
      console.error('Failed to fetch documents:', err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Silent refetch - updates data without showing loading state
  const silentRefetch = useCallback(async () => {
    try {
      setError(null);
      const response: DocumentListResponse = await fetchDocuments(filters);
      setDocuments(Array.isArray(response.items) ? response.items : []);
      setTotal(typeof response.total === 'number' ? response.total : 0);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch documents';
      console.error('Silent refetch failed:', err);
      // Don't show toast or set error for silent refetch - it's background update
    }
  }, [filters]);

  // Fetch document statistics
  const refetchStats = useCallback(async () => {
    try {
      setStatsLoading(true);
      const data = await fetchDocumentStats();
      setStats(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch statistics';
      console.error('Failed to fetch document stats:', err);
      // Don't show toast for stats errors - they're not critical
    } finally {
      setStatsLoading(false);
    }
  }, []);

  // Update filters and trigger refetch
  const setFilters = useCallback((newFilters: DocumentListParams) => {
    setFiltersState(newFilters);
  }, []);

  // Initial fetch on mount and when filters change
  useEffect(() => {
    refetch().catch((err) => {
      console.error('Initial fetch error:', err);
    });
  }, [refetch]);

  // Initial stats fetch on mount
  useEffect(() => {
    refetchStats().catch((err) => {
      console.error('Initial stats fetch error:', err);
    });
  }, [refetchStats]);

  return {
    documents,
    stats,
    total,
    loading,
    statsLoading,
    error,
    refetch,
    refetchStats,
    silentRefetch,
    setFilters,
    filters,
  };
}

