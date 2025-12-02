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
 * - Else if doc_status = 'archived' → display_status = 'archived' (if backend supports it)
 * - Else if upload_status = 'failed' → display_status = 'failed'
 * - Else if upload_status = 'pending' → display_status = 'pending'
 * - Else if upload_status = 'processing' → display_status = 'processing'
 * - Else if doc_status = 'superseded' → display_status = 'superseded'
 * - Else → display_status = 'active'
 */
export type DisplayStatus = 
  | 'active' 
  | 'archived'
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
  status?: 'active' | 'archived' | 'superseded' | 'deleted'; // Backend Admin API uses 'status' field (sets status='archived')
  doc_status?: DocStatus | 'archived'; // Alternative field name (for compatibility)
  upload_status?: UploadStatus;
  created_at: string; // ISO 8601 timestamp
  updated_at: string; // ISO 8601 timestamp
  archived_at?: string | null; // Optional: timestamp when document was archived
  file_name?: string;
  file_size?: number;
  mime_type?: string;
  chunk_count?: number; // Legacy field name
  chunks_count?: number; // Backend API returns 'chunks_count'
  citation_count?: number;
  storage_path?: string | null; // Optional: path to original file in storage (required for /open endpoint)
  has_original_file?: boolean; // Optional: whether document has an original file that can be opened
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
  doc_status?: DocStatus | 'archived';
  status?: 'active' | 'archived' | 'superseded' | 'deleted'; // Backend uses 'status' field (Admin API sets status='archived')
  upload_status?: UploadStatus;
  archived_at?: string | null; // Optional field to check if document is archived
}): DisplayStatus {
  // Backend Admin API uses 'status' field (not 'doc_status')
  // Priority: status field (from Admin API) > doc_status field > archived_at timestamp
  const backendStatus = (doc as any).status || doc.doc_status;
  const uploadStatus = doc.upload_status || 'completed'; // Default to completed if not provided
  
  // Priority 1: deleted
  if (backendStatus === 'deleted') {
    return 'deleted';
  }

  // Priority 2: archived (Admin API sets status='archived')
  // Check status field first (what Admin API uses), then doc_status, then archived_at
  if (backendStatus === 'archived' || doc.archived_at) {
    return 'archived';
  }

  // Priority 3: upload_status takes precedence (only if upload_status is provided and not completed)
  if (uploadStatus && uploadStatus !== 'completed') {
    if (uploadStatus === 'failed') {
      return 'failed';
    }
    if (uploadStatus === 'pending') {
      return 'pending';
    }
    if (uploadStatus === 'processing') {
      return 'processing';
    }
  }

  // Priority 4: superseded
  if (backendStatus === 'superseded') {
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
    archived: 'Archived',
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
    archived: 'outline',
    pending: 'secondary',
    processing: 'secondary',
    failed: 'destructive',
    superseded: 'outline',
    deleted: 'destructive',
  };
  return variants[status];
}

