export type TokenErrorCode =
  | 'TOKEN_EXPIRED'
  | 'TOKEN_ALREADY_USED'
  | 'TOKEN_NOT_FOUND'
  | 'TOKEN_MALFORMED'
  | 'SESSION_ERROR';

export type TokenErrorDetail = {
  error: 'token_verification_failed' | string;
  code: TokenErrorCode;
  message: string;
  reason?: string;
  recovery_action?: 'request_new_link' | string;
  created_at?: string;
  expired_at?: string;
  used_at?: string;
};

export function parseTokenError(res: any): TokenErrorDetail | null {
  const d = res?.detail;
  if (!d?.code) return null;
  return {
    error: d.error ?? 'token_verification_failed',
    code: d.code,
    message: d.message ?? 'There was a problem with your sign-in link.',
    reason: d.reason,
    recovery_action: d.recovery_action,
    created_at: d.created_at,
    expired_at: d.expired_at,
    used_at: d.used_at,
  };
}
