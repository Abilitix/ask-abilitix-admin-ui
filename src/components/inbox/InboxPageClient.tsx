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
  enableReviewPromote: 'INBOX.ENABLE_REVIEW_PROMOTE',
  allowEmptyCitations: 'ALLOW_EMPTY_CITATIONS',
  enableFaqCreation: 'INBOX.ENABLE_REVIEW_PROMOTE', // Maps to same backend flag
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
  const isInitialMountRef = useRef(true);
  const [mode, setMode] = useState<ReviewMode>(initialFlags.adminInboxApiEnabled ? 'modern' : 'legacy');
  const [modeSource, setModeSource] = useState<ModeSource>('tenant');
  const [flagPanelOpen, setFlagPanelOpen] = useState(false);
  const [updatingKey, setUpdatingKey] = useState<keyof InitialInboxFlags | null>(null);
  const [modernActions, setModernActions] = useState<ModernInboxActions | null>(null);
  const CITATIONS_LOCK_MESSAGE = 'Citations are required. This control is managed centrally.';
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

  const flagsStorageKey = useMemo(() => {
    const suffix = tenantId ?? tenantSlug ?? 'default';
    return `inbox-flags:${suffix}`;
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

  // Load flags from localStorage on mount (if available) to preserve user changes
  // Otherwise, use initialFlags from server
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (isInitialMountRef.current) {
      isInitialMountRef.current = false;
      
      // Try to load persisted flags from localStorage
      try {
        const stored = window.localStorage.getItem(flagsStorageKey);
        if (stored) {
          const parsed = JSON.parse(stored);
          // Validate it's a valid flags object
          if (parsed && typeof parsed === 'object' && Object.keys(initialFlags).every(key => key in parsed)) {
            // Always use server value for enableFaqCreation (respects new default of true)
            // This prevents old localStorage false values from overriding the new default
            const mergedFlags = {
              ...parsed,
              enableFaqCreation: initialFlags.enableFaqCreation,
            };
            setFlags(mergedFlags);
            flagsRef.current = mergedFlags;
            return;
          }
        }
      } catch (err) {
        // If parse fails, fall back to initialFlags
        console.warn('[flags] Failed to load from localStorage:', err);
      }
      
      // Fall back to server-provided initialFlags
      setFlags(initialFlags);
      flagsRef.current = initialFlags;
    }
  }, [initialFlags, flagsStorageKey]);

  // Persist flags to localStorage whenever they change (but not on initial mount)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (isInitialMountRef.current) return; // Skip on initial mount

    try {
      window.localStorage.setItem(flagsStorageKey, JSON.stringify(flags));
    } catch (err) {
      console.warn('[flags] Failed to save to localStorage:', err);
    }
  }, [flags, flagsStorageKey]);

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
    if (key === 'allowEmptyCitations') {
      toast.info(CITATIONS_LOCK_MESSAGE);
      return;
    }
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
        const payload: Record<string, unknown> = {
          updates: [
            {
              key: backendKey,
              value: { value: nextValue ? 1 : 0 },
            },
          ],
        };
        if (tenantId) {
          payload.tenant_id = tenantId;
        } else if (tenantSlug) {
          payload.tenant_slug = tenantSlug;
        }
        const response = await fetch('/api/admin/tenant-settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('[flag-toggle] API error:', {
            key: backendKey,
            status: response.status,
            error: errorText,
            payload,
          });
          throw new Error(errorText);
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
            allowEmptyCitations={false}
            tenantId={tenantId}
            reviewFlagEnabled={flags.enableReviewPromote === true}
            hasReviewerAccess={canModerate}
            enableFaqCreation={flags.enableFaqCreation === true}
            modeKey={resolvedMode}
            onRegisterActions={setModernActions}
          />
        </>
      ) : (
        <LegacyInboxPageClient 
          enableFaqCreation={flags.enableFaqCreation === true}
          allowEmptyCitations={flags.allowEmptyCitations === true}
          canManageFlags={Boolean(canManageFlags)}
          flags={{
            enableFaqCreation: flags.enableFaqCreation,
            allowEmptyCitations: flags.allowEmptyCitations,
          }}
          onUpdateFlag={updateFlag}
          updatingKey={updatingKey}
          tenantId={tenantId}
          tenantSlug={tenantSlug}
          userRole={userRole}
        />
      )}

    </div>
  );
}
