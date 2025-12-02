/**
 * Standardized error handling utilities for API responses.
 * 
 * Provides consistent error parsing and user-friendly error messages
 * across all Admin UI API calls.
 * 
 * @module lib/api/errorHandler
 */

/**
 * Standard API error structure returned by Admin API.
 */
export type ApiError = {
  code: string;
  message: string;
  details?: string;
  fields?: Array<{
    field: string;
    message: string;
    index?: number;
  }>;
};

/**
 * Parsed error response from API.
 */
export type ParsedError = {
  code: string;
  message: string;
  details?: string;
  fields?: ApiError['fields'];
  status: number;
  statusText: string;
};

/**
 * Parses an API error response into a standardized format.
 * 
 * Handles various error response formats from Admin API:
 * - Standard format: `{ detail: { error: { code, message } } }`
 * - Legacy format: `{ error, details, message }`
 * - Field errors: `{ detail: { error: { fields: [...] } } }`
 * 
 * @param response - Fetch Response object
 * @param data - Parsed JSON response data (may be null)
 * @returns Parsed error object with code, message, and details
 * 
 * @example
 * ```typescript
 * const response = await fetch('/api/admin/docs');
 * if (!response.ok) {
 *   const data = await response.json().catch(() => null);
 *   const error = parseApiError(response, data);
 *   toast.error(error.message);
 * }
 * ```
 */
export function parseApiError(response: Response, data: any): ParsedError {
  // Default error message
  const defaultMessage = `Request failed: ${response.status} ${response.statusText}`;
  
  // Try to extract error from various response formats
  let code = 'unknown_error';
  let message = defaultMessage;
  let details: string | undefined;
  let fields: ApiError['fields'] | undefined;

  if (data) {
    // Standard Admin API format: { detail: { error: { code, message } } }
    if (data.detail?.error) {
      const error = data.detail.error;
      code = error.code || 'api_error';
      message = error.message || defaultMessage;
      details = error.details || data.details;
      fields = error.fields;
    }
    // Legacy format: { error, details, message }
    else if (data.error) {
      code = typeof data.error === 'string' ? data.error : 'api_error';
      message = data.message || data.details || data.error || defaultMessage;
      details = data.details;
    }
    // Simple format: { message, details }
    else if (data.message || data.details) {
      code = 'api_error';
      message = data.message || data.details || defaultMessage;
      details = data.details;
    }
  }

  return {
    code,
    message,
    details,
    fields,
    status: response.status,
    statusText: response.statusText,
  };
}

/**
 * Converts a parsed API error into a user-friendly error message.
 * 
 * Maps error codes to user-friendly messages and includes
 * field-level errors when available.
 * 
 * @param error - Parsed error object
 * @returns User-friendly error message string
 * 
 * @example
 * ```typescript
 * const error = parseApiError(response, data);
 * const userMessage = getUserFriendlyError(error);
 * toast.error(userMessage);
 * ```
 */
export function getUserFriendlyError(error: ParsedError): string {
  // Map common error codes to user-friendly messages
  const errorMessages: Record<string, string> = {
    invalid_doc_id: 'Invalid document ID format',
    doc_not_found: 'Document not found',
    document_not_accessible: 'This document is not accessible (may be deleted or superseded)',
    no_original_file: 'This document was uploaded as text and cannot be opened as a file. Only documents uploaded as files (PDF/DOCX) can be opened.',
    unauthorized: 'You are not authenticated. Please sign in.',
    forbidden: 'You do not have permission to perform this action',
    duplicate_faq_exists: 'This FAQ already exists',
    duplicate_inbox_item: 'This item already exists',
    admin_proxy_error: 'Failed to connect to server. Please try again.',
  };

  // Use mapped message if available, otherwise use error message
  let message = errorMessages[error.code] || error.message;

  // Add field-level errors if available
  if (error.fields && error.fields.length > 0) {
    const fieldMessages = error.fields
      .map((field) => `${field.field}: ${field.message}`)
      .join(', ');
    message = `${message} (${fieldMessages})`;
  }

  // Add details if available and not already in message
  if (error.details && !message.includes(error.details)) {
    message = `${message}. ${error.details}`;
  }

  return message;
}

/**
 * Handles an API error response and returns a user-friendly message.
 * 
 * Convenience function that combines parseApiError and getUserFriendlyError.
 * 
 * @param response - Fetch Response object
 * @param data - Parsed JSON response data (may be null)
 * @returns User-friendly error message string
 * 
 * @example
 * ```typescript
 * const response = await fetch('/api/admin/docs');
 * if (!response.ok) {
 *   const data = await response.json().catch(() => null);
 *   const message = handleApiError(response, data);
 *   toast.error(message);
 * }
 * ```
 */
export function handleApiError(response: Response, data: any): string {
  const error = parseApiError(response, data);
  return getUserFriendlyError(error);
}


