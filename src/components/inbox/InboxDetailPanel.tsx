'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { InboxDetail } from './InboxPageClient';
import { Loader2, ListChecks } from 'lucide-react';

function formatRelativeTime(value: string | null) {
  if (!value) return { absolute: '—', relative: '—' };
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return { absolute: '—', relative: '—' };
  }

  const absolute = date.toLocaleString();
  const diff = Date.now() - date.getTime();
  const diffSeconds = Math.round(diff / 1000);
  const formatter = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

  if (Math.abs(diffSeconds) < 60) {
    return { absolute, relative: formatter.format(-diffSeconds, 'second') };
  }
  if (Math.abs(diffSeconds) < 3600) {
    return { absolute, relative: formatter.format(-Math.round(diffSeconds / 60), 'minute') };
  }
  if (Math.abs(diffSeconds) < 86400) {
    return { absolute, relative: formatter.format(-Math.round(diffSeconds / 3600), 'hour') };
  }
  if (Math.abs(diffSeconds) < 604800) {
    return { absolute, relative: formatter.format(-Math.round(diffSeconds / 86400), 'day') };
  }
  if (Math.abs(diffSeconds) < 2629800) {
    return { absolute, relative: formatter.format(-Math.round(diffSeconds / 604800), 'week') };
  }
  if (Math.abs(diffSeconds) < 31557600) {
    return { absolute, relative: formatter.format(-Math.round(diffSeconds / 2629800), 'month') };
  }
  return { absolute, relative: formatter.format(-Math.round(diffSeconds / 31557600), 'year') };
}

function renderTags(tags: string[]) {
  if (!tags.length) return <span className="text-xs text-muted-foreground">—</span>;
  return (
    <div className="flex flex-wrap gap-1">
      {tags.map((tag) => (
        <Badge
          key={tag}
          className={tag === 'no_source' ? 'bg-amber-100 text-amber-900 text-[11px]' : 'text-[11px]'}
          variant={tag === 'no_source' ? 'default' : 'outline'}
        >
          {tag}
        </Badge>
      ))}
    </div>
  );
}

type InboxDetailPanelProps = {
  loading: boolean;
  error: string | null;
  detail: InboxDetail | null;
  selectedId: string | null;
};

export function InboxDetailPanel({ loading, error, detail, selectedId }: InboxDetailPanelProps) {
  if (!selectedId) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="text-base">Details</CardTitle>
        </CardHeader>
        <CardContent className="flex h-full flex-col items-center justify-center text-center text-sm text-muted-foreground">
          <ListChecks className="mb-3 h-8 w-8 text-muted-foreground/70" />
          Select an inbox row to view details.
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="text-base">Details</CardTitle>
        </CardHeader>
        <CardContent className="flex h-full flex-col items-center justify-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
          Loading detail…
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="text-base">Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-destructive/40 bg-destructive/5 px-4 py-6 text-sm text-destructive">
            {error}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!detail) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="text-base">Details</CardTitle>
        </CardHeader>
        <CardContent className="flex h-full flex-col items-center justify-center text-sm text-muted-foreground">
          Unable to load detail for the selected item.
        </CardContent>
      </Card>
    );
  }

  const when = formatRelativeTime(detail.askedAt);
  const showNoSource = detail.tags.includes('no_source');

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-base">Details</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        {showNoSource && (
          <div className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-900">
            PR1-blocked — awaiting source.
          </div>
        )}

        <dl className="space-y-2">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Ref</dt>
            <dd className="font-mono text-xs">{detail.id}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Hash</dt>
            <dd className="font-mono text-xs">{detail.qHash ?? '—'}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Dup Count</dt>
            <dd>
              <Badge variant="secondary" className="text-xs">
                ×{detail.dupCount}
              </Badge>
            </dd>
          </div>
          <div className="flex justify-between" title={when.absolute}>
            <dt className="text-muted-foreground">Asked</dt>
            <dd className="text-muted-foreground">{when.relative}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Channel</dt>
            <dd className="text-muted-foreground">{detail.channel ?? '—'}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Tags</dt>
            <dd className="mt-1 flex flex-wrap gap-1">{renderTags(detail.tags)}</dd>
          </div>
        </dl>

        <div className="space-y-1">
          <div className="text-xs font-semibold uppercase text-muted-foreground">Question</div>
          <div className="rounded-md border border-slate-200 bg-white p-3 text-sm">
            {detail.question ?? '—'}
          </div>
        </div>

        <div className="space-y-2">
          <div className="text-xs font-semibold uppercase text-muted-foreground">Top scores</div>
          {detail.topScores === null ? (
            <p className="text-xs text-muted-foreground">
              Evidence snapshot not yet available.
            </p>
          ) : detail.topScores.length === 0 ? (
            <p className="text-xs text-muted-foreground">No scores recorded.</p>
          ) : (
            <ul className="space-y-2 text-xs">
              {detail.topScores.map((score) => (
                <li
                  key={score.docId}
                  className="rounded-md border border-slate-200 bg-slate-50 p-2"
                >
                  <div className="flex justify-between">
                    <span className="font-medium">{score.title ?? 'Untitled doc'}</span>
                    <span className="font-mono">{score.score.toFixed(3)}</span>
                  </div>
                  <div className="font-mono text-[11px] text-muted-foreground">
                    {score.docId}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
