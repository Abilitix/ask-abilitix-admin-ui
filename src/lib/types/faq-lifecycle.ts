// Types for FAQ Lifecycle Management

export type FAQStatus = 'active' | 'archived' | 'superseded';

export type FAQ = {
  id: string;
  question: string;
  answer: string;
  status: FAQStatus;
  archived_at: string | null;
  superseded_by: string | null;
  created_at: string;
  updated_at?: string;
  citations?: Array<{
    doc_id: string;
    page?: string;
    span?: string;
    type?: string;
  }>;
  is_faq: boolean;
};

export type FAQListResponse = {
  items: FAQ[];
  total: number;
  limit: number;
  offset: number;
};

export type ArchiveResponse = {
  ok: true;
  faq_id: string;
  status: 'archived';
  archived_at: string;
};

export type UnarchiveResponse = {
  ok: true;
  faq_id: string;
};

export type SupersedeRequest = {
  new_faq_id: string;
  obsolete_faq_ids: string[];
  reason?: string;
};

export type SupersedeResponse = {
  ok: true;
  new_faq_id: string;
  obsolete_faq_ids: string[];
};

export type BulkActionRequest = {
  ids: string[];
};

export type BulkActionResponse = {
  ok: true;
  processed: string[];
  skipped: string[];
  errors: Array<{
    id: string;
    reason: string;
  }>;
};

export type BulkSupersedeRequest = {
  new_faq_id: string;
  obsolete_ids: string[];
};

export type FAQListFilters = {
  status?: FAQStatus | 'all';
  search?: string;
  limit?: number;
  offset?: number;
};

