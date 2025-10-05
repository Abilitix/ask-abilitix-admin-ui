/**
 * API Error Code Types
 * Defines all possible error codes returned by the Admin API
 */

export type ApiErrorCode =
  // Token verification errors
  | "TOKEN_EXPIRED"
  | "TOKEN_ALREADY_USED"
  | "TOKEN_MALFORMED"
  | "TOKEN_NOT_FOUND"
  | "SESSION_ERROR"
  | "TOKEN_CHECK_ERROR"
  // Email validation errors
  | "INVALID_EMAIL_FORMAT"
  | "INVITATION_PENDING"
  | "EMAIL_TAKEN";

/**
 * API Error Detail structure
 * Matches the error response format from Admin API
 */
export interface ApiErrorDetail {
  code: ApiErrorCode;
  message: string;
  reason?: string;
  recovery_action?: string;
  created_at?: string;
  expired_at?: string;
  used_at?: string;
}

/**
 * API Error Response structure
 * Standard error response format from Admin API
 */
export interface ApiErrorResponse {
  detail: ApiErrorDetail;
}
