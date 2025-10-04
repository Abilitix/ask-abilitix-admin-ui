'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import TokenErrorView from '@/components/auth/TokenErrorView';
import { TokenErrorDetail } from '@/lib/auth/token-errors';

function VerifyErrorContent() {
  const searchParams = useSearchParams();
  const code = searchParams.get('code') as TokenErrorDetail['code'] | null;
  const created_at = searchParams.get('created_at');
  const expired_at = searchParams.get('expired_at');
  const used_at = searchParams.get('used_at');

  const getUserEmail = () => {
    return typeof window !== 'undefined' ? (localStorage.getItem('last_signin_email') || null) : null;
  };

  // Map Admin API error codes to our error detail format
  const errorDetail: TokenErrorDetail = {
    error: 'token_verification_failed',
    code: code || 'TOKEN_NOT_FOUND',
    message: getErrorMessage(code),
    created_at: created_at || undefined,
    expired_at: expired_at || undefined,
    used_at: used_at || undefined,
  };

  return <TokenErrorView detail={errorDetail} getUserEmail={getUserEmail} />;
}

function getErrorMessage(code: string | null): string {
  switch (code) {
    case 'TOKEN_EXPIRED':
      return 'This sign-in link has expired. Please request a new one.';
    case 'TOKEN_ALREADY_USED':
      return 'This sign-in link has already been used. Please request a new one.';
    case 'TOKEN_NOT_FOUND':
      return 'Invalid sign-in link. Please request a new one.';
    case 'TOKEN_MALFORMED':
      return 'Invalid sign-in link format. Please request a new one.';
    case 'SESSION_ERROR':
      return 'Unable to start your session. Please try again or request a new link.';
    default:
      return 'There was a problem with your sign-in link. Please try again or request a new one.';
  }
}

export default function VerifyErrorPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-muted-foreground">Loading...</div>}>
      <VerifyErrorContent />
    </Suspense>
  );
}
