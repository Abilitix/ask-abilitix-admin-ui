'use client';

import { useEffect, useMemo, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import TokenErrorView from '@/components/auth/TokenErrorView';
import { parseTokenError, TokenErrorDetail } from '@/lib/auth/token-errors';
import { checkTokenStatus } from '@/lib/api/public';

function VerifyPageContent() {
  const sp = useSearchParams();
  const token = sp.get('token') ?? '';
  const [errorDetail, setErrorDetail] = useState<TokenErrorDetail | null>(null);
  const [checking, setChecking] = useState(true);

  const getUserEmail = useMemo(() => {
    return () => (typeof window !== 'undefined' ? (localStorage.getItem('last_signin_email') || null) : null);
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      if (!token) { setChecking(false); return; }

      const status = await checkTokenStatus(token);
      if (!alive) return;

      if (status?.state === 'valid') {
        window.location.href = `/public/verify?token=${encodeURIComponent(token)}`;
      } else if (status?.state) {
        const codeMap: Record<string, TokenErrorDetail['code']> = {
          expired: 'TOKEN_EXPIRED',
          used: 'TOKEN_ALREADY_USED',
          invalid: 'TOKEN_NOT_FOUND',
          malformed: 'TOKEN_MALFORMED',
          domain_mismatch: 'TOKEN_MALFORMED',
          check_error: 'TOKEN_CHECK_ERROR',
        };
        setErrorDetail({
          error: 'token_verification_failed',
          code: codeMap[status.state] ?? 'TOKEN_NOT_FOUND',
          message: status.message ?? 'There was a problem with your sign-in link.',
          created_at: status.created_at,
          expired_at: status.expired_at,
          used_at: status.used_at
        });
        setChecking(false);
      } else {
        const r = await fetch(`/public/verify?token=${encodeURIComponent(token)}`, { method: 'GET' });
        if (r.ok) { window.location.href = '/'; return; }
        const json = await r.json().catch(() => null);
        setErrorDetail(parseTokenError(json));
        setChecking(false);
      }
    })();
    return () => { alive = false; }
  }, [token]);

  if (checking) return <div className="p-8 text-center text-muted-foreground">Checking your sign-in link…</div>;
  if (errorDetail) return <TokenErrorView detail={errorDetail} getUserEmail={getUserEmail} />;
  return <div className="p-8 text-center">Redirecting…</div>;
}

export default function VerifyPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-muted-foreground">Loading...</div>}>
      <VerifyPageContent />
    </Suspense>
  );
}
