'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from 'sonner';
import { requestNewMagicLink } from '@/lib/api/public';
import { TokenErrorDetail, TokenErrorCode } from '@/lib/auth/token-errors';

function fmt(d?: string) { return d ? new Date(d).toLocaleString() : '--'; }

export default function TokenErrorView({
  detail,
  getUserEmail
}: {
  detail: TokenErrorDetail;
  getUserEmail: () => string | null;
}) {
  const [busy, setBusy] = useState(false);
  const [cooldown, setCooldown] = useState<number | null>(null);

  useEffect(() => {
    let t: any;
    if (typeof cooldown === 'number' && cooldown > 0) {
      t = setInterval(() => setCooldown(c => (c ?? 0) > 0 ? (c as number) - 1 : 0), 1000);
    }
    return () => t && clearInterval(t);
  }, [cooldown]);

  const titleByCode: Record<TokenErrorCode, string> = {
    TOKEN_EXPIRED: 'Sign-in Link Expired',
    TOKEN_ALREADY_USED: 'Link Already Used',
    TOKEN_NOT_FOUND: 'Invalid Sign-in Link',
    TOKEN_MALFORMED: 'Invalid Sign-in Link',
    SESSION_ERROR: 'Couldn\'t Start Session',
  };

  async function onResend() {
    const email = getUserEmail();
    if (!email) {
      toast.error('Email required. Please enter your email to get a new link.');
      return;
    }
    setBusy(true);
    try {
      const r = await requestNewMagicLink(email);
      const cd = typeof r?.cooldown_seconds === 'number' ? r.cooldown_seconds : 60;
      setCooldown(cd);
      toast.success('Check your email. A new sign-in link is on its way.');
    } catch {
      toast.error('Could not send link. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="max-w-xl mx-auto mt-10">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Badge variant="outline">{detail.code}</Badge>
          <CardTitle>{titleByCode[detail.code] ?? 'Sign-in Error'}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-muted-foreground">{detail.message}</p>

        {(detail.code === 'TOKEN_EXPIRED' || detail.code === 'TOKEN_ALREADY_USED') && (
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><span className="font-medium">Created:</span> {fmt(detail.created_at)}</div>
            {detail.expired_at && <div><span className="font-medium">Expired:</span> {fmt(detail.expired_at)}</div>}
            {detail.used_at && <div><span className="font-medium">Used:</span> {fmt(detail.used_at)}</div>}
          </div>
        )}

        <div className="pt-2 flex items-center gap-2">
          <Button onClick={onResend} disabled={busy || (cooldown !== null && cooldown > 0)}>
            {cooldown ? `Resend available in ${cooldown}s` : '📧 Request New Sign-in Link'}
          </Button>
        </div>

        <p className="text-xs text-muted-foreground pt-2">
          We never store your password. Magic links are single-use and expire quickly for your security.
        </p>
      </CardContent>
    </Card>
  );
}
