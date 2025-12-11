/**
 * Knowledge Studio API types
 * Aligned with backend API response models
 */

export type Template = {
  id: string;
  name: string;
  description: string;
  category: string;
  channel: string;
  required_feature?: string | null; // null if no feature gate
  email_layout?: {
    subject?: string;
    body_html?: string;
    body_item_html?: string;
  };
};

export type Draft = {
  id: string;
  tenant_id: string;
  template_id?: string;
  question?: string;
  answer?: string;
  status: 'draft' | 'approved';
  category?: string;
  channel?: string;
  citations?: Array<{
    doc_id: string;
    page?: number;
    span?: string;
    text?: string;
  }>;
  metadata?: Record<string, any>;
  needs_input: boolean; // true if requires manual editing
  created_at: string;
  updated_at: string;
};

export type DraftListResponse = Draft[];

export type GenerateDraftsRequest = {
  template_id: string;
  doc_ids: string[];
  category?: string;
  channel?: string;
};

export type UpdateDraftRequest = {
  question?: string;
  answer?: string;
  status?: 'draft' | 'approved';
  category?: string;
  channel?: string;
  citations?: Draft['citations'];
};

export type MergeDraftsRequest = {
  source_draft_id: string;
};

export type SendPreviewRequest = {
  draft_ids: string[];
  to_email: string;
  subject?: string;
};

export type SendPreviewResponse = {
  preview_html: string;
  preview_text: string;
  subject: string;
  to_email: string;
};

export type SendRequest = {
  draft_ids: string[];
  to_email: string;
  subject?: string;
};

export type SendResponse = {
  message: string;
  sent_at: string;
};

/**
 * Backend error response format
 */
export type KnowledgeErrorResponse = {
  detail: string;
  message?: string;
};

/**
 * Error detail codes from backend
 */
export type ErrorDetailCode =
  | 'feature_not_enabled'
  | 'send_rate_limited'
  | 'invalid_email'
  | 'drafts_not_found'
  | 'send_failed';

/**
 * Custom dimension for candidate evaluation
 */
export type CustomDimension = {
  label: string;
  keywords: string[];
  importance: 'must' | 'nice';
};

