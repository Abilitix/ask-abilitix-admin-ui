/**
 * TypeScript types for Document Management System (DMS).
 * 
 * Aligned with Admin API response formats.
 * 
 * @module types/documents
 */

/**
 * Document status values.
 */
export type DocumentStatus = 'active' | 'archived' | 'deleted' | 'superseded';

/**
 * Document source types.
 */
export type DocumentSource = 'tus_upload' | 'manual' | 'gdrive' | 'upload_file';

/**
 * Upload status for TUS uploads.
 */
export type UploadStatus = 'uploading' | 'processing' | 'completed' | 'failed' | null;

/**
 * Display status combines doc_status and upload_status for UI.
 */
export type DisplayStatus = 
  | 'Uploading'
  | 'Processing'
  | 'Failed'
  | 'Archived'
  | 'Deleted'
  | 'Superseded'
  | 'Active';

/**
 * Document chunk information.
 */
export type DocumentChunk = {
  id: string;
  idx: number | null;
  content: string;
  has_embedding: boolean;
  metadata?: Record<string, any>;
  status: 'active' | 'archived';
  created_at: string;
};

/**
 * Document citation (FAQ that cites this document).
 */
export type DocumentCitation = {
  faq_id: string;
  question: string;
  answer: string;
  status: 'active' | 'archived';
  is_faq: boolean;
  created_at: string;
  updated_at: string;
};

/**
 * Document list item (from GET /admin/docs).
 */
export type DocumentListItem = {
  id: string;
  title: string;
  status: DocumentStatus;
  source: DocumentSource;
  upload_id: number | null;
  upload_status: UploadStatus;
  display_status: DisplayStatus;
  chunks_count: number;
  size_bytes: number | null;
  mime_type: string | null;
  created_at: string;
  updated_at: string;
};

/**
 * Document detail (from GET /admin/docs/{doc_id}).
 */
export type DocumentDetail = {
  id: string;
  title: string;
  status: DocumentStatus;
  source: DocumentSource;
  upload_id: number | null;
  upload_status: UploadStatus;
  display_status: DisplayStatus;
  mime_type: string | null;
  size_bytes: number | null;
  chunks_count: number;
  citations_count: number;
  created_at: string;
  updated_at: string;
  metadata: Record<string, any>;
  first_chunk: DocumentChunk | null;
};

/**
 * Document statistics (from GET /admin/docs/stats).
 */
export type DocumentStats = {
  total: number;
  active: number;
  archived: number;
  deleted: number;
  superseded: number;
};

/**
 * Document list response (from GET /admin/docs).
 */
export type DocumentListResponse = {
  ok: boolean;
  docs: DocumentListItem[];
  total: number;
  limit: number;
  offset: number;
};

/**
 * Document detail response (from GET /admin/docs/{doc_id}).
 */
export type DocumentDetailResponse = {
  ok: boolean;
  doc: DocumentDetail;
};

/**
 * Document chunks response (from GET /admin/docs/{doc_id}/chunks).
 */
export type DocumentChunksResponse = {
  ok: boolean;
  chunks: DocumentChunk[];
  total: number;
  limit: number;
  offset: number;
  has_more: boolean;
};

/**
 * Document citations response (from GET /admin/docs/{doc_id}/citations).
 */
export type DocumentCitationsResponse = {
  ok: boolean;
  citations: DocumentCitation[];
  total: number;
};

/**
 * Document stats response (from GET /admin/docs/stats).
 */
export type DocumentStatsResponse = {
  ok: boolean;
  stats: DocumentStats;
};

/**
 * Delete document response (from DELETE /admin/docs/{doc_id}).
 */
export type DeleteDocumentResponse = {
  ok: boolean;
  deleted: boolean;
  hard_delete: boolean;
  status?: DocumentStatus;
  can_restore?: boolean;
  chunks_deleted?: number;
  storage_deleted?: boolean;
  caches_invalidated?: boolean;
  faqs_updated?: number;
};

/**
 * Click-to-open response (from GET /admin/docs/{doc_id}/open?json=true).
 */
export type OpenDocumentResponse = {
  ok: boolean;
  url: string;
  expires_in: number;
};

/**
 * Document list query parameters.
 */
export type DocumentListParams = {
  status?: DocumentStatus | 'all';
  source?: DocumentSource | 'all';
  q?: string; // Search query
  limit?: number;
  offset?: number;
};

/**
 * Document chunks query parameters.
 */
export type DocumentChunksParams = {
  limit?: number;
  offset?: number;
};

