'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { LegacyInboxPageClient } from './LegacyInboxPageClient';
import { ModernInboxClient, ModernInboxActions } from './ModernInboxClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { InitialInboxFlags } from '@/lib/server/adminSettings';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { Filter, Settings2, Sparkles, FlaskConical, ShieldAlert } from 'lucide-react';

type ReviewMode = 'legacy' | 'modern';
type ModeSource = 'tenant' | 'override';

type InboxPageClientProps = {
  initialFlags: InitialInboxFlags;
  tenantId?: string;
  tenantSlug?: string;
  userRole?: string;
};

const FLAG_KEY_MAP = {
  adminInboxApiEnabled: 'ADMIN_INBOX_API',
  enableReviewPromote: 'ENABLE_REVIEW_PROMOTE',
  allowEmptyCitations: 'ALLOW_EMPTY_CITATIONS',
  enableFaqCreation: 'ENABLE_REVIEW_PROMOTE', // Maps to same backend flag
} as const;

const FLAG_LABELS: Record<keyof InitialInboxFlags, string> = {
  adminInboxApiEnabled: 'Structured inbox',
  enableReviewPromote: 'Attach & Promote',
  allowEmptyCitations: 'Allow empty citations',
  enableFaqCreation: 'Enable FAQ creation',
};

const FLAG_HINTS: Record<keyof InitialInboxFlags, string> = {
  adminInboxApiEnabled: 'Enables the new inbox list with filters and detail drawer.',
  enableReviewPromote: 'Requires the structured inbox. Unlocks attach source & promote actions.',
  allowEmptyCitations: 'When enabled, SMEs can promote without attaching citations.',
  enableFaqCreation: 'Allows promoting inbox items as FAQs with fast-path embedding generation. Works with both legacy and modern inbox.',
};

const FLAG_DEPENDENCIES: Partial<Record<keyof InitialInboxFlags, keyof InitialInboxFlags>> = {
  enableReviewPromote: 'adminInboxApiEnabled',
};

export function InboxPageClient({
  initialFlags,
  tenantId,
  tenantSlug,
  userRole,
}: InboxPageClientProps) {
  const [flags, setFlags] = useState<InitialInboxFlags>(initialFlags);
  const flagsRef = useRef(initialFlags);
  const [mode, setMode] = useState<ReviewMode>(initialFlags.adminInboxApiEnabled ? 'modern' : 'legacy');
  const [modeSource, setModeSource] = useState<ModeSource>('tenant');
  const [flagPanelOpen, setFlagPanelOpen] = useState(false);
  const [updatingKey, setUpdatingKey] = useState<keyof InitialInboxFlags | null>(null);
  const [modernActions, setModernActions] = useState<ModernInboxActions | null>(null);
  const pendingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const pendingRequestRef = useRef<{
    key: keyof InitialInboxFlags;
    prevFlags: InitialInboxFlags;
    nextFlags: InitialInboxFlags;
  } | null>(null);

  const storageKey = useMemo(() => {
    const suffix = tenantId ?? tenantSlug ?? 'default';
    return `inbox-review-mode:${suffix}`;
  }, [tenantId, tenantSlug]);

  const canUseModern = !!flags.adminInboxApiEnabled;
  const canModerate = Boolean(userRole && ['owner', 'admin', 'curator'].includes(userRole));
  const allowReviewPromote =
    Boolean((flags as unknown as Record<string, any>).enableReviewPromote) && canModerate;
  const defaultMode: ReviewMode = canUseModern ? 'modern' : 'legacy';
  const resolvedMode: ReviewMode = canUseModern ? mode : 'legacy';
  const canManageFlags = (userRole && ['owner', 'admin', 'curator'].includes(userRole)) ?? false;
  const canTestAsk = canManageFlags;

  useEffect(() => {
    flagsRef.current = flags;
  }, [flags]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (!canUseModern) {
      setMode('legacy');
      setModeSource('tenant');
      window.localStorage.removeItem(storageKey);
      return;
    }

    const stored = window.localStorage.getItem(storageKey);
    if (stored === 'legacy' || stored === 'modern') {
      setMode(stored as ReviewMode);
      setModeSource('override');
    } else {
      setMode(defaultMode);
      setModeSource('tenant');
    }
  }, [canUseModern, defaultMode, storageKey]);

  useEffect(() => {
    if (!flags.adminInboxApiEnabled) {
      setMode('legacy');
      setModeSource('tenant');
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(storageKey);
      }
    } else if (modeSource === 'tenant') {
      setMode('modern');
    }
  }, [flags.adminInboxApiEnabled, modeSource, storageKey]);

  const changeMode = (next: ReviewMode) => {
    if (next === 'modern' && !canUseModern) return;
    setMode(next);
    if (typeof window !== 'undefined') {
      if (next === defaultMode) {
        window.localStorage.removeItem(storageKey);
        setModeSource('tenant');
      } else {
        window.localStorage.setItem(storageKey, next);
        setModeSource('override');
      }
    }
  };

  const handleNoSourceFilter = () => {
    if (!modernActions) {
      toast.info('Switch to Attach & Promote mode to filter.');
      return;
    }
    modernActions.applyNoSourceFilter();
  };

  const handleTestAsk = async () => {
    if (!canTestAsk) return;
    if (!modernActions) {
      toast.info('Select an item in Attach & Promote mode first.');
      return;
    }
    const { id, detail } = modernActions.getCurrentDetail();
    if (!id || !detail?.question) {
      toast.info('Select an item with a question to test.');
      return;
    }
    try {
      const response = await fetch('/api/admin/test-ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: detail.question,
          tenantSlug,
          refId: id,
        }),
      });
      if (!response.ok) {
        throw new Error(await response.text());
      }
      const data = await response.json().catch(() => null);
      toast.success('Ask service responded', {
        description: data?.source_detail ? `source_detail=${data.source_detail}` : 'See console for full payload.',
      });
      console.info('[test-ask]', data);
    } catch (error) {
      console.error('[test-ask] failed', error);
      toast.error('Test ask failed. Check logs for details.');
    }
  };

  const updateFlag = (key: keyof InitialInboxFlags, nextValue: boolean) => {
    if (pendingTimerRef.current) {
      clearTimeout(pendingTimerRef.current);
      pendingTimerRef.current = null;
    }

    const prevFlags = flagsRef.current;
    if (prevFlags[key] === nextValue) {
      return;
    }

    const nextFlags = { ...prevFlags, [key]: nextValue };
    setFlags(nextFlags);
    setUpdatingKey(key);
    pendingRequestRef.current = { key, prevFlags, nextFlags };

    pendingTimerRef.current = setTimeout(async () => {
      try {
        const backendKey = FLAG_KEY_MAP[key];
        const response = await fetch('/api/admin/tenant-settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            key: backendKey,
            value: { value: nextValue ? 1 : 0 },
            ...(tenantId ? { tenant_id: tenantId } : tenantSlug ? { tenant_slug: tenantSlug } : {}),
          }),
        });

        if (!response.ok) {
          throw new Error(await response.text());
        }

        if (typeof window !== 'undefined' && (window as any).gtag) {
          (window as any).gtag('event', 'ui.flags.toggle', {
            key: backendKey,
            old: prevFlags[key] ? 1 : 0,
            new: nextValue ? 1 : 0,
            tenant_id: tenantId ?? tenantSlug ?? 'unknown',
          });
        }

        setUpdatingKey(null);
        pendingTimerRef.current = null;
        pendingRequestRef.current = null;
        toast.success(`${FLAG_LABELS[key]} ${nextValue ? 'enabled' : 'disabled'}.`);
      } catch (error) {
        console.error('[flag-toggle] failed', error);
        const prev = pendingRequestRef.current?.prevFlags ?? flagsRef.current;
        setFlags(prev);
        flagsRef.current = prev;
        setUpdatingKey(null);
        pendingTimerRef.current = null;
        pendingRequestRef.current = null;
        toast.error(
          `Reverted ${FLAG_LABELS[key]} to ${prev[key] ? 'enabled' : 'disabled'} after an error.`
        );
      }
    }, 300);
  };

  const modeSourceLabel = modeSource === 'tenant' ? 'Default via tenant flags' : 'User override';

  return (
    <div className="container mx-auto space-y-6 px-4 py-6 lg:px-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Inbox</h1>
        <p className="text-sm text-muted-foreground">
          Manage blocked questions, attach citations, and promote verified answers.
        </p>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-4 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex rounded-md border border-input p-1">
              <Button
                size="sm"
                variant={resolvedMode === 'legacy' ? 'default' : 'ghost'}
                onClick={() => changeMode('legacy')}
                className="rounded-sm"
              >
                Legacy review
              </Button>
              <Button
                size="sm"
                variant={resolvedMode === 'modern' ? 'default' : 'ghost'}
                onClick={() => changeMode('modern')}
                disabled={!canUseModern}
                className="rounded-sm"
              >
                Attach &amp; Promote
              </Button>
            </div>
            <Badge variant="outline">{modeSourceLabel}</Badge>
            <Badge variant={flags.allowEmptyCitations ? 'outline' : 'secondary'}>
              {flags.allowEmptyCitations ? 'Citations optional' : 'Citations required'}
            </Badge>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={handleNoSourceFilter}
              disabled={resolvedMode !== 'modern'}
            >
              <Filter className="mr-2 h-4 w-4" />
              no_source
            </Button>
            {canTestAsk && (
              <Button type="button" size="sm" variant="outline" onClick={handleTestAsk}>
                <FlaskConical className="mr-2 h-4 w-4" />
                Test ask
              </Button>
            )}
            {canManageFlags && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setFlagPanelOpen((prev) => !prev)}
              >
                <Settings2 className="mr-2 h-4 w-4" />
                Feature controls
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {flagPanelOpen && canManageFlags && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tenant flags</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {(Object.keys(flags) as (keyof InitialInboxFlags)[]).map((key) => {
              const dependency = FLAG_DEPENDENCIES[key];
              const dependencyMet = dependency ? flags[dependency] : true;
              const disabled = !dependencyMet || updatingKey === key;
              const tooltipText = !dependencyMet
                ? `Requires ${FLAG_LABELS[dependency!]}`
                : updatingKey === key
                  ? 'Updating…'
                  : undefined;
              return (
                <div key={key} className="flex flex-col gap-2 rounded-md border border-border/60 p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{FLAG_LABELS[key]}</p>
                      <p className="text-xs text-muted-foreground">{FLAG_HINTS[key]}</p>
                    </div>
                    <div className="inline-flex items-center gap-2">
                      <Button
                        size="sm"
                        variant={flags[key] ? 'default' : 'outline'}
                        onClick={() => updateFlag(key, true)}
                        disabled={disabled || flags[key]}
                        title={tooltipText}
                      >
                        On
                      </Button>
                      <Button
                        size="sm"
                        variant={!flags[key] ? 'default' : 'outline'}
                        onClick={() => updateFlag(key, false)}
                        disabled={disabled || !flags[key]}
                        title={tooltipText}
                      >
                        Off
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {resolvedMode === 'modern' ? (
        <>
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="flex flex-col gap-3 py-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-2 text-amber-900">
                <Sparkles className="h-4 w-4" />
                <span className="text-sm font-medium">
                  Citations-only mode: blocked questions appear here. Select an item to attach
                  sources or promote from the detail panel.
                </span>
              </div>
            </CardContent>
          </Card>
          <ModernInboxClient
            allowActions={!!allowReviewPromote}
            allowEmptyCitations={flags.allowEmptyCitations === true}
            tenantId={tenantId}
            reviewFlagEnabled={flags.enableReviewPromote === true}
            hasReviewerAccess={canModerate}
            enableFaqCreation={flags.enableFaqCreation === true}
            modeKey={resolvedMode}
            onRegisterActions={setModernActions}
          />
        </>
      ) : (
        <LegacyInboxPageClient />
      )}

      {!flags.adminInboxApiEnabled && (
        <Card className="bg-muted">
          <CardContent className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
            <ShieldAlert className="h-4 w-4" />
            Structured inbox is disabled by tenant flags. Toggle “Structured inbox” in Feature
            Controls to preview the new experience.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
