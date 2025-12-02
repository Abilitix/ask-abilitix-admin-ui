/**
 * Client-side API helpers for Document Management System (DMS).
 * 
 * All functions make requests to Next.js API routes which proxy to Admin API.
 * 
 * @module lib/api/documents
 */

import { handleApiError } from './errorHandler';
import { safeParseJson } from './responseParser';
import type {
  Document,
  DocumentListResponse,
  DocumentStats,
  DocumentDetail,
  DocumentChunk,
  DocumentChunksResponse,
  DocumentCitation,
  DocumentCitationsResponse,
  DocumentListParams,
} from '@/lib/types/documents';

/**
 * Base URL for document API routes.
 */
const API_BASE = '/api/admin/docs';

/**
 * Fetches a paginated list of documents.
 * 
 * @param params - Query parameters (status, search, limit, offset)
 * @returns Document list response
 * @throws Error if request fails
 * 
 * @example
 * ```typescript
 * const docs = await fetchDocuments({ status: 'active', limit: 20 });
 * ```
 */
export async function fetchDocuments(
  params: DocumentListParams = {}
): Promise<DocumentListResponse> {
  const searchParams = new URLSearchParams();
  
  if (params.status) {
    searchParams.set('status', params.status);
  }
  if (params.search) {
    searchParams.set('search', params.search);
  }
  if (params.limit) {
    searchParams.set('limit', String(params.limit));
  }
  if (params.offset) {
    searchParams.set('offset', String(params.offset));
  }

  const queryString = searchParams.toString();
  const url = `${API_BASE}${queryString ? `?${queryString}` : ''}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    const data = await safeParseJson(response);
    throw new Error(handleApiError(response, data));
  }

  const data = await safeParseJson<DocumentListResponse>(response);
  if (!data) {
    throw new Error('Empty response from server');
  }

  return data;
}

/**
 * Fetches document statistics.
 * 
 * @returns Document statistics
 * @throws Error if request fails
 * 
 * @example
 * ```typescript
 * const stats = await fetchDocumentStats();
 * console.log(`Total: ${stats.total}, Active: ${stats.active}`);
 * ```
 */
export async function fetchDocumentStats(): Promise<DocumentStats> {
  const response = await fetch(`${API_BASE}/stats`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    const data = await safeParseJson(response);
    throw new Error(handleApiError(response, data));
  }

  const data = await safeParseJson<DocumentStats>(response);
  if (!data) {
    throw new Error('Empty response from server');
  }

  return data;
}

/**
 * Fetches a single document by ID.
 * 
 * @param docId - Document ID (UUID)
 * @returns Document detail
 * @throws Error if request fails or document not found
 * 
 * @example
 * ```typescript
 * const doc = await fetchDocument('123e4567-e89b-12d3-a456-426614174000');
 * ```
 */
export async function fetchDocument(docId: string): Promise<DocumentDetail> {
  const response = await fetch(`${API_BASE}/${encodeURIComponent(docId)}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    const data = await safeParseJson(response);
    throw new Error(handleApiError(response, data));
  }

  const data = await safeParseJson<DocumentDetail>(response);
  if (!data) {
    throw new Error('Empty response from server');
  }

  return data;
}

/**
 * Fetches chunks for a document.
 * 
 * @param docId - Document ID (UUID)
 * @param limit - Maximum number of chunks to return (optional)
 * @param offset - Offset for pagination (optional)
 * @returns Document chunks response
 * @throws Error if request fails
 * 
 * @example
 * ```typescript
 * const chunks = await fetchDocumentChunks(docId, { limit: 50 });
 * ```
 */
export async function fetchDocumentChunks(
  docId: string,
  options: { limit?: number; offset?: number } = {}
): Promise<DocumentChunksResponse> {
  const searchParams = new URLSearchParams();
  if (options.limit) {
    searchParams.set('limit', String(options.limit));
  }
  if (options.offset) {
    searchParams.set('offset', String(options.offset));
  }

  const queryString = searchParams.toString();
  const url = `${API_BASE}/${encodeURIComponent(docId)}/chunks${queryString ? `?${queryString}` : ''}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    const data = await safeParseJson(response);
    throw new Error(handleApiError(response, data));
  }

  const data = await safeParseJson<DocumentChunksResponse>(response);
  if (!data) {
    throw new Error('Empty response from server');
  }

  return data;
}

/**
 * Fetches citations for a document.
 * 
 * @param docId - Document ID (UUID)
 * @param limit - Maximum number of citations to return (optional)
 * @param offset - Offset for pagination (optional)
 * @returns Document citations response
 * @throws Error if request fails
 * 
 * @example
 * ```typescript
 * const citations = await fetchDocumentCitations(docId);
 * ```
 */
export async function fetchDocumentCitations(
  docId: string,
  options: { limit?: number; offset?: number } = {}
): Promise<DocumentCitationsResponse> {
  const searchParams = new URLSearchParams();
  if (options.limit) {
    searchParams.set('limit', String(options.limit));
  }
  if (options.offset) {
    searchParams.set('offset', String(options.offset));
  }

  const queryString = searchParams.toString();
  const url = `${API_BASE}/${encodeURIComponent(docId)}/citations${queryString ? `?${queryString}` : ''}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    const data = await safeParseJson(response);
    throw new Error(handleApiError(response, data));
  }

  const data = await safeParseJson<DocumentCitationsResponse>(response);
  if (!data) {
    throw new Error('Empty response from server');
  }

  return data;
}

/**
 * Opens a document (triggers processing/reprocessing).
 * 
 * @param docId - Document ID (UUID)
 * @returns Success response
 * @throws Error if request fails
 * 
 * @example
 * ```typescript
 * await openDocument(docId);
 * ```
 */
export async function openDocument(docId: string): Promise<void> {
  const response = await fetch(`${API_BASE}/${encodeURIComponent(docId)}/open`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const data = await safeParseJson(response);
    throw new Error(handleApiError(response, data));
  }
}

/**
 * Deletes a document.
 * 
 * @param docId - Document ID (UUID)
 * @returns Success response
 * @throws Error if request fails
 * 
 * @example
 * ```typescript
 * await deleteDocument(docId);
 * ```
 */
export async function deleteDocument(docId: string): Promise<void> {
  const response = await fetch(`${API_BASE}/${encodeURIComponent(docId)}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const data = await safeParseJson(response);
    throw new Error(handleApiError(response, data));
  }
}

