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
  
  // Backend only accepts: active, archived, superseded, all
  // Map our DisplayStatus to backend status
  if (params.status) {
    const status = params.status as string;
    // Only send valid backend statuses
    if (['active', 'archived', 'superseded'].includes(status)) {
      searchParams.set('status', status);
    } else if (status === 'all') {
      searchParams.set('status', 'all');
    }
    // Ignore: pending, processing, failed, deleted (these are computed from upload_status/doc_status)
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

  console.log('[DMS] Fetching documents:', { url, params });

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

  const data = await safeParseJson<any>(response);
  if (!data) {
    throw new Error('Empty response from server');
  }

  console.log('[DMS] API response:', { 
    hasItems: !!data.items, 
    hasDocs: !!data.docs, 
    hasDocuments: !!data.documents, 
    isArray: Array.isArray(data),
    keys: Object.keys(data),
    total: data.total,
    sample: JSON.stringify(data).substring(0, 200)
  });
  
  // Debug: Log first document's status fields
  const firstDoc = data.items?.[0] || data.docs?.[0] || data.documents?.[0] || (Array.isArray(data) ? data[0] : null);
  if (firstDoc) {
    console.log('[DMS] Sample document status fields:', {
      doc_status: firstDoc.doc_status,
      status: firstDoc.status,
      archived_at: firstDoc.archived_at,
      upload_status: firstDoc.upload_status,
      allKeys: Object.keys(firstDoc)
    });
  }

  // Handle both old format (docs/documents array) and new format (items array)
  let items: Document[] = [];
  let total = 0;

  // New DMS format: { items: [...], total: number, limit: number, offset: number }
  if (data.items && Array.isArray(data.items)) {
    items = data.items;
    total = typeof data.total === 'number' ? data.total : items.length;
  }
  // Old format: { docs: [...] } or { documents: [...] }
  else if (data.docs && Array.isArray(data.docs)) {
    items = data.docs;
    total = items.length;
  }
  else if (data.documents && Array.isArray(data.documents)) {
    items = data.documents;
    total = items.length;
  }
  // Legacy: direct array
  else if (Array.isArray(data)) {
    items = data;
    total = items.length;
  }
  else {
    console.error('Invalid API response structure:', data);
    return {
      items: [],
      total: 0,
      limit: params.limit || 20,
      offset: params.offset || 0,
    };
  }

  return {
    items,
    total,
    limit: typeof data.limit === 'number' ? data.limit : (params.limit || 20),
    offset: typeof data.offset === 'number' ? data.offset : (params.offset || 0),
  };
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

  const data = await safeParseJson<any>(response);
  if (!data) {
    throw new Error('Empty response from server');
  }

  console.log('[DMS Stats] Backend response:', data);

  // Map backend response to expected format
  // Backend now returns: total_docs, active, pending, processing, failed, archived, deleted, superseded (document counts)
  // Plus: with_vec, missing_vec, total (chunk counts - preserved for backward compatibility)
  const normalizedStats: DocumentStats = {
    // Chunk statistics (preserved from backend)
    with_vec: typeof data.with_vec === 'number' ? data.with_vec : undefined,
    missing_vec: typeof data.missing_vec === 'number' ? data.missing_vec : undefined,
    total: typeof data.total === 'number' ? data.total : undefined, // Total chunks (legacy field)
    
    // Document counts by status (new fields from backend)
    total_docs: typeof data.total_docs === 'number' ? data.total_docs : undefined,
    active: typeof data.active === 'number' ? data.active : 0,
    pending: typeof data.pending === 'number' ? data.pending : 0,
    processing: typeof data.processing === 'number' ? data.processing : 0,
    failed: typeof data.failed === 'number' ? data.failed : 0,
    archived: typeof data.archived === 'number' ? data.archived : 0, // New field
    superseded: typeof data.superseded === 'number' ? data.superseded : 0,
    deleted: typeof data.deleted === 'number' ? data.deleted : 0,
  };

  console.log('[DMS Stats] Normalized stats:', normalizedStats);

  return normalizedStats;
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
  // Validate docId format
  if (!docId || docId === 'undefined' || docId === 'null' || docId.trim() === '') {
    throw new Error('Invalid document ID');
  }

  console.log('[DMS] Fetching document detail:', { docId, url: `${API_BASE}/${encodeURIComponent(docId)}` });

  const response = await fetch(`${API_BASE}/${encodeURIComponent(docId)}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
  });

  console.log('[DMS] Document detail response:', { status: response.status, ok: response.ok });

  if (!response.ok) {
    const data = await safeParseJson(response);
    const errorMessage = handleApiError(response, data);
    console.error('[DMS] Document detail error:', { status: response.status, error: errorMessage, data });
    throw new Error(errorMessage);
  }

  const data = await safeParseJson<DocumentDetail>(response);
  if (!data) {
    throw new Error('Empty response from server');
  }

  console.log('[DMS] Document detail success:', { docId, hasData: !!data });

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
  // Validate docId
  if (!docId || docId === 'undefined' || docId === 'null' || docId.trim() === '') {
    throw new Error('Invalid document ID');
  }

  try {
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
      const errorMessage = handleApiError(response, data);
      console.error('[fetchDocumentChunks] API error:', { status: response.status, docId, error: errorMessage });
      throw new Error(errorMessage);
    }

    const data = await safeParseJson<DocumentChunksResponse>(response);
    if (!data) {
      throw new Error('Empty response from server');
    }

    return data;
  } catch (err) {
    // Re-throw with context if it's not already an Error
    if (err instanceof Error) {
      throw err;
    }
    throw new Error(`Failed to fetch document chunks: ${String(err)}`);
  }
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
  // Validate docId
  if (!docId || docId === 'undefined' || docId === 'null' || docId.trim() === '') {
    throw new Error('Invalid document ID');
  }

  try {
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
      const errorMessage = handleApiError(response, data);
      console.error('[fetchDocumentCitations] API error:', { status: response.status, docId, error: errorMessage });
      throw new Error(errorMessage);
    }

    const data = await safeParseJson<DocumentCitationsResponse>(response);
    if (!data) {
      throw new Error('Empty response from server');
    }

    return data;
  } catch (err) {
    // Re-throw with context if it's not already an Error
    if (err instanceof Error) {
      throw err;
    }
    throw new Error(`Failed to fetch document citations: ${String(err)}`);
  }
}

/**
 * Opens a document (returns signed URL to open the original file).
 * 
 * @param docId - Document ID (UUID)
 * @returns Signed URL response with { url: string, expires_in: number }
 * @throws Error if request fails
 * 
 * @example
 * ```typescript
 * const result = await openDocument(docId);
 * window.open(result.url, '_blank');
 * ```
 */
/**
 * Error types for document open operation
 */
export class DocumentOpenError extends Error {
  constructor(
    message: string,
    public code?: string,
    public originalError?: unknown
  ) {
    super(message);
    this.name = 'DocumentOpenError';
  }
}

export async function openDocument(docId: string): Promise<{ url: string; expires_in?: number }> {
  const response = await fetch(`${API_BASE}/${encodeURIComponent(docId)}/open`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    const data = await safeParseJson<any>(response);
    
    // Parse structured error response from API
    const errorCode = data?.error?.code || data?.detail?.error?.code;
    const errorMessage = data?.error?.message || data?.detail?.error?.message || data?.detail?.message || data?.message;
    
    console.error('[Open Document] Error response:', { 
      status: response.status, 
      code: errorCode, 
      message: errorMessage,
      data 
    });

    // Map error codes to user-friendly messages
    let userMessage: string;
    switch (errorCode) {
      case 'no_original_file':
        userMessage = 'This document was uploaded as text and cannot be opened as a file. Only documents uploaded as files (PDF/DOCX) can be opened.';
        break;
      case 'document_not_accessible':
        userMessage = 'This document has been deleted or superseded and cannot be opened.';
        break;
      case 'doc_not_found':
        userMessage = 'Document not found. It may have been deleted or you may not have access to it.';
        break;
      default:
        userMessage = errorMessage || `Unable to open document (${response.status}). Please try again.`;
    }

    throw new DocumentOpenError(userMessage, errorCode, data);
  }

  const data = await safeParseJson<{ url: string; signed_url?: string; expires_in?: number }>(response);
  if (!data) {
    throw new DocumentOpenError('Empty response from server');
  }

  return {
    url: data.url || data.signed_url || '',
    expires_in: data.expires_in,
  };
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

