/**
 * TypeScript types for Document Management System (DMS).
 * 
 * These types match the Admin API DMS endpoints and display status logic.
 * 
 * @module lib/types/documents
 */

/**
 * Document status from backend.
 */
export type DocStatus = 'active' | 'superseded' | 'deleted';

/**
 * Upload status from backend.
 */
export type UploadStatus = 'pending' | 'processing' | 'completed' | 'failed';

/**
 * Combined display status for UI (computed from doc_status + upload_status).
 * 
 * Logic:
 * - If doc_status = 'deleted' → display_status = 'deleted'
 * - Else if upload_status = 'failed' → display_status = 'failed'
 * - Else if upload_status = 'pending' → display_status = 'pending'
 * - Else if upload_status = 'processing' → display_status = 'processing'
 * - Else if doc_status = 'superseded' → display_status = 'superseded'
 * - Else → display_status = 'active'
 */
export type DisplayStatus = 
  | 'active' 
  | 'pending' 
  | 'processing' 
  | 'failed' 
  | 'superseded' 
  | 'deleted';

/**
 * Document metadata from Admin API.
 */
export interface Document {
  doc_id: string;
  title: string;
  doc_status: DocStatus;
  upload_status: UploadStatus;
  created_at: string; // ISO 8601 timestamp
  updated_at: string; // ISO 8601 timestamp
  file_name?: string;
  file_size?: number;
  mime_type?: string;
  chunk_count?: number;
  citation_count?: number;
}

/**
 * Document list response from GET /admin/docs.
 */
export interface DocumentListResponse {
  items: Document[];
  total: number;
  limit: number;
  offset: number;
}

/**
 * Document statistics response from GET /admin/docs/stats.
 */
export interface DocumentStats {
  total: number;
  active: number;
  pending: number;
  processing: number;
  failed: number;
  superseded: number;
  deleted: number;
}

/**
 * Document detail response from GET /admin/docs/{doc_id}.
 */
export interface DocumentDetail extends Document {
  // Additional fields may be present in detail view
  metadata?: Record<string, unknown>;
}

/**
 * Document chunk from GET /admin/docs/{doc_id}/chunks.
 */
export interface DocumentChunk {
  chunk_id: string;
  doc_id: string;
  content: string;
  page_number?: number;
  span_start?: number;
  span_end?: number;
  metadata?: Record<string, unknown>;
}

/**
 * Document chunks response.
 */
export interface DocumentChunksResponse {
  items: DocumentChunk[];
  total: number;
}

/**
 * Document citation from GET /admin/docs/{doc_id}/citations.
 */
export interface DocumentCitation {
  citation_id: string;
  doc_id: string;
  chunk_id?: string;
  page_number?: number;
  span_text?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Document citations response.
 */
export interface DocumentCitationsResponse {
  items: DocumentCitation[];
  total: number;
}

/**
 * Query parameters for document list endpoint.
 */
export interface DocumentListParams {
  status?: DisplayStatus;
  search?: string;
  limit?: number;
  offset?: number;
}

/**
 * Computes the display status from doc_status and upload_status.
 * 
 * @param doc - Document object with doc_status and upload_status
 * @returns Display status for UI
 */
export function computeDisplayStatus(doc: {
  doc_status: DocStatus;
  upload_status: UploadStatus;
}): DisplayStatus {
  // Priority 1: deleted
  if (doc.doc_status === 'deleted') {
    return 'deleted';
  }

  // Priority 2: upload_status takes precedence
  if (doc.upload_status === 'failed') {
    return 'failed';
  }
  if (doc.upload_status === 'pending') {
    return 'pending';
  }
  if (doc.upload_status === 'processing') {
    return 'processing';
  }

  // Priority 3: superseded
  if (doc.doc_status === 'superseded') {
    return 'superseded';
  }

  // Default: active
  return 'active';
}

/**
 * Checks if a document is accessible (not deleted or superseded).
 * 
 * @param doc - Document object
 * @returns True if document is accessible
 */
export function isDocumentAccessible(doc: Document): boolean {
  const displayStatus = computeDisplayStatus(doc);
  return displayStatus !== 'deleted' && displayStatus !== 'superseded';
}

/**
 * Gets a human-readable label for display status.
 * 
 * @param status - Display status
 * @returns Human-readable label
 */
export function getDisplayStatusLabel(status: DisplayStatus): string {
  const labels: Record<DisplayStatus, string> = {
    active: 'Active',
    pending: 'Pending',
    processing: 'Processing',
    failed: 'Failed',
    superseded: 'Superseded',
    deleted: 'Deleted',
  };
  return labels[status];
}

/**
 * Gets a color variant for display status (for badges).
 * 
 * @param status - Display status
 * @returns Color variant name
 */
export function getDisplayStatusVariant(status: DisplayStatus): 
  | 'default' 
  | 'secondary' 
  | 'destructive' 
  | 'outline' {
  const variants: Record<DisplayStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    active: 'default',
    pending: 'secondary',
    processing: 'secondary',
    failed: 'destructive',
    superseded: 'outline',
    deleted: 'destructive',
  };
  return variants[status];
}

