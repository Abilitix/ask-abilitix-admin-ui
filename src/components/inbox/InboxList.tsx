'use client';

import { useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { InboxListItem } from './ModernInboxClient';
import { ArrowDownCircle, Inbox as InboxIcon, Loader2, RefreshCw } from 'lucide-react';

type AppliedFilters = {
  ref: string;
  tag: string;
  qHash: string;
};

type InboxListProps = {
  items: InboxListItem[];
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  filters: AppliedFilters;
  selectedId: string | null;
  nextCursor: string | null;
  onSelect: (id: string) => void;
  onRefresh: () => void;
  onLoadMore: () => void;
  // Bulk selection props
  selectedIds?: Set<string>;
  onToggleSelect?: (id: string) => void;
  onSelectAll?: () => void;
  bulkActionLoading?: boolean;
};

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

function renderTag(tag: string) {
  const base = 'text-xs font-medium';
  if (tag === 'no_source') {
    return (
      <Badge key={tag} className={`${base} bg-amber-100 text-amber-900`}>
        no_source
      </Badge>
    );
  }

  return (
    <Badge key={tag} variant="outline" className={base}>
      {tag}
    </Badge>
  );
}

export function InboxList({
  items,
  loading,
  refreshing,
  error,
  filters,
  selectedId,
  nextCursor,
  onSelect,
  onRefresh,
  onLoadMore,
  selectedIds,
  onToggleSelect,
  onSelectAll,
  bulkActionLoading = false,
}: InboxListProps) {
  // Ensure items is always an array
  const safeItems = Array.isArray(items) ? items : [];

  const hasFilters = useMemo(
    () => Boolean(filters.ref || filters.tag || filters.qHash),
    [filters]
  );

  if (loading && !safeItems.length) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-base">
            <span>Inbox Items</span>
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin" />
            Loading inbox…
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-base">
            <span>Inbox Items</span>
            <Button onClick={onRefresh} size="sm" variant="outline">
              <RefreshCw className="mr-2 h-4 w-4" />
              Retry
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-destructive/40 bg-destructive/5 px-4 py-6 text-sm text-destructive">
            {error}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!safeItems.length) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-base">
            <span>Inbox Items</span>
            <Button onClick={onRefresh} size="sm" variant="outline">
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center gap-3 py-10 text-center text-sm text-muted-foreground">
            <InboxIcon className="h-12 w-12 text-muted-foreground/60" />
            <p>No inbox items found.</p>
            {hasFilters && (
              <p className="max-w-sm text-xs text-muted-foreground">
                Try adjusting or clearing filters to see more results.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-base">
          <span>Inbox Items</span>
          <Button onClick={onRefresh} size="sm" variant="outline">
            {refreshing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            Refresh
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                {selectedIds && onToggleSelect && onSelectAll && (
                  <TableHead className="w-12">
                    <input
                      type="checkbox"
                      className="form-checkbox h-4 w-4 text-blue-600"
                      checked={items.length > 0 && items.every((item) => selectedIds.has(item.id))}
                      onChange={onSelectAll}
                      disabled={bulkActionLoading}
                    />
                  </TableHead>
                )}
                <TableHead className="w-[24ch]">Ref</TableHead>
                <TableHead className="w-[18ch]">Hash</TableHead>
                <TableHead>Tags</TableHead>
                <TableHead className="w-[16ch]">Dup Count</TableHead>
                <TableHead className="w-[22ch]">Asked</TableHead>
                <TableHead className="w-[16ch]">Channel</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {safeItems.map((item) => {
                const when = formatRelativeTime(item.askedAt);
                const isSelected = selectedId === item.id;
                const safeTags = Array.isArray(item.tags) ? item.tags : [];
                const isBulkSelected = selectedIds?.has(item.id) ?? false;
                return (
                  <TableRow
                    key={item.id}
                    onClick={() => onSelect(item.id)}
                    className={[
                      'cursor-pointer transition-colors',
                      isSelected ? 'bg-slate-50' : 'hover:bg-slate-50',
                    ].join(' ')}
                  >
                    {selectedIds && onToggleSelect && (
                      <TableCell
                        className="w-12"
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleSelect(item.id);
                        }}
                      >
                        <input
                          type="checkbox"
                          className="form-checkbox h-4 w-4 text-blue-600"
                          checked={isBulkSelected}
                          onChange={() => onToggleSelect(item.id)}
                          disabled={bulkActionLoading}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </TableCell>
                    )}
                    <TableCell className="font-mono text-xs">{item.id}</TableCell>
                    <TableCell className="font-mono text-xs">
                      {item.qHash ?? '—'}
                    </TableCell>
                    <TableCell className="space-x-1 whitespace-nowrap">
                      {safeTags.length ? safeTags.map(renderTag) : '—'}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-xs">
                        ×{item.dupCount}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground" title={when.absolute}>
                      {when.relative}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {item.channel ?? '—'}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {nextCursor && (
          <div className="flex justify-center">
            <Button onClick={onLoadMore} variant="ghost" size="sm">
              <ArrowDownCircle className="mr-2 h-4 w-4" />
              Load more
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}