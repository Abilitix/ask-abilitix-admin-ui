/**
 * FAQ Generation Types
 * 
 * Types for FAQ generation job management and settings
 */

export type FAQGenerationJob = {
  job_id: string;
  type: 'faq_generate';
  status: 'queued' | 'running' | 'done' | 'failed';
  progress?: {
    current: number;
    total: number;
    stage: string; // e.g., "generating_questions", "generating_answers", "done"
    percent: number;
  };
  result?: {
    total_generated: number;
    sent_to_inbox: number;
    avg_confidence: number;
  };
  error_message: string | null;
  created_at: string; // ISO 8601
  started_at: string | null; // ISO 8601
  finished_at: string | null; // ISO 8601
  estimated_time?: string; // Optional, from job creation response
};

export type GenerationSettings = {
  max_faqs: number; // 1-50
  confidence_threshold: number; // 0.0-1.0
};

export type Document = {
  id: string;
  title: string;
  status: 'active' | 'archived' | 'superseded';
  created_at: string;
  topic_key?: string | null;
  version?: number;
};

export type DocumentsResponse = {
  docs: Document[];
  total: number;
};

export type JobCreationResponse = {
  job_id: string;
  status: 'queued';
  estimated_time?: string;
};

export type ErrorResponse = {
  detail?: {
    error: string;
    message?: string;
    status?: string;
  };
  error?: string;
  message?: string;
};

