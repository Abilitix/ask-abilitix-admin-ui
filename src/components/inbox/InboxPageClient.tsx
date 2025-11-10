'use client';

import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { InboxList } from './InboxList';
import { InboxDetailPanel } from './InboxDetailPanel';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

const DEFAULT_LIMIT = 25;

type Filters = {
  ref: string;
  tag: string;
  qHash: string;
};

export type InboxListItem = {
  id: string;
  qHash: string | null;
  askedAt: string | null;
  channel: string | null;
  tags: string[];
  dupCount: number;
};

export type InboxTopScore = {
  docId: string;
  score: number;
  title?: string | null;
};

export type InboxDetail = InboxListItem & {
  question?: string | null;
  topScores: InboxTopScore[] | null;
};

function normaliseListItem(raw: any): InboxListItem | null {
  if (!raw || typeof raw !== 'object') return null;
  const idValue = raw.id ?? raw.ref_id;
  if (!idValue) return null;

  const tags = Array.isArray(raw.tags) ? raw.tags.filter((tag: unknown) => typeof tag === 'string') : [];
  const qHash =
    typeof raw.q_hash === 'string'
      ? raw.q_hash
      : typeof raw.question_hash === 'string'
        ? raw.question_hash
        : null;

  const askedAt =
    typeof raw.asked_at === 'string'
      ? raw.asked_at
      : typeof raw.created_at === 'string'
        ? raw.created_at
        : null;

  const channel = typeof raw.channel === 'string' ? raw.channel : null;

  const dupCountRaw =
    typeof raw.dup_count === 'number'
      ? raw.dup_count
      : typeof raw.duplicate_count === 'number'
        ? raw.duplicate_count
        : null;

  return {
    id: String(idValue),
    qHash,
    askedAt,
    channel,
    tags,
    dupCount: dupCountRaw && dupCountRaw >= 1 ? dupCountRaw : 1,
  };
}

function normaliseDetail(raw: any): InboxDetail | null {
  const base = normaliseListItem(raw);
  if (!base) return null;

  let topScores: InboxTopScore[] | null = null;
  if (Array.isArray(raw.top_scores)) {
    const scores = raw.top_scores
      .map((entry: any) => {
        if (!entry || typeof entry !== 'object') return null;
        const docId = entry.doc_id;
        const score = entry.score;
        if (!docId || typeof docId !== 'string') return null;
        if (typeof score !== 'number') return null;
        return {
          docId,
          score,
          title: typeof entry.title === 'string' ? entry.title : null,
        };
      })
      .filter(Boolean) as InboxTopScore[];

    topScores = scores.length > 0 ? scores : [];
  }

  return {
    ...base,
    question: typeof raw.question === 'string' ? raw.question : null,
    topScores,
  };
}

function parseListResponse(json: any): { items: InboxListItem[]; nextCursor: string | null } | null {
  if (!json) return null;

  const maybeItems = Array.isArray(json.items) ? json.items : Array.isArray(json) ? json : null;
  if (!maybeItems) return null;

  // Detect legacy payload by checking for answer/question fields without dup_count/q_hash
  const first = maybeItems[0];
  const looksLegacy =
    first &&
    typeof first === 'object' &&
    ('answer' in first || 'question' in first) &&
    !('dup_count' in first) &&
    !('q_hash' in first);

  if (looksLegacy) {
    return null;
  }

  const items = maybeItems
    .map((item) => normaliseListItem(item))
    .filter((item): item is InboxListItem => Boolean(item));

  if (items.length === 0) {
    return { items: [], nextCursor: null };
  }

  const nextCursor =
    typeof json.next_cursor === 'string' && json.next_cursor.length > 0
      ? json.next_cursor
      : null;

  return { items, nextCursor };
}

const DEFAULT_FILTERS: Filters = {
  ref: '',
  tag: 'no_source',
  qHash: '',
};

export function InboxPageClient() {
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [draftFilters, setDraftFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [items, setItems] = useState<InboxListItem[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<InboxDetail | null>(null);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [detailLoading, setDetailLoading] = useState<boolean>(false);
  const [isInitialised, setIsInitialised] = useState<boolean>(false);
  const refreshTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resetRefreshTimer = useCallback(() => {
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
      refreshTimeoutRef.current = null;
    }
  }, []);

  const loadList = useCallback(
    async (opts: { cursor?: string | null; append?: boolean } = {}) => {
      try {
        setLoading(true);
        setError(null);

        const params = new URLSearchParams();
        params.set('limit', String(DEFAULT_LIMIT));

        if (opts.cursor) {
          params.set('cursor', opts.cursor);
        }

        if (filters.tag) {
          params.set('tag', filters.tag);
        }

        if (filters.ref) {
          params.set('ref', filters.ref);
        }

        if (filters.qHash) {
          params.set('q_hash', filters.qHash);
        }

        const query = params.toString();
        const response = await fetch(`/api/admin/inbox${query ? `?${query}` : ''}`, {
          method: 'GET',
          credentials: 'include',
          cache: 'no-store',
        });

        const text = await response.text();
        let json: any = null;
        if (text) {
          try {
            json = JSON.parse(text);
          } catch {
            throw new Error('Invalid JSON response from Admin API');
          }
        }

        if (response.status === 404) {
          setIsAvailable(false);
          setItems([]);
          setNextCursor(null);
          setError(null);
          return;
        }

        if (!response.ok) {
          const message =
            (json && typeof json === 'object' && (json.details || json.error)) ||
            `Admin inbox request failed (${response.status})`;
          throw new Error(message);
        }

        if (json && typeof json === 'object' && json.error) {
          throw new Error(json.details || json.error);
        }

        const parsed = parseListResponse(json);

        if (!parsed) {
          setIsAvailable(false);
          setItems([]);
          setNextCursor(null);
          setError(null);
          return;
        }

        setIsAvailable(true);
        setNextCursor(parsed.nextCursor);

        let updatedItems: InboxListItem[] = [];
        setItems((prev) => {
          if (opts.append) {
            const existingIds = new Set(prev.map((item) => item.id));
            const merged = [...prev];
            for (const item of parsed.items) {
              if (!existingIds.has(item.id)) {
                merged.push(item);
                existingIds.add(item.id);
              }
            }
            updatedItems = merged;
            return merged;
          }
          updatedItems = parsed.items;
          return parsed.items;
        });

        setSelectedId((prev) => {
          if (!prev) return prev;
          return updatedItems.some((item) => item.id === prev) ? prev : null;
        });
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Failed to load inbox items';
        setError(message);
        toast.error(message);
      } finally {
        setLoading(false);
        setIsInitialised(true);
      }
    },
    [filters]
  );

  const loadDetail = useCallback(async (id: string) => {
    try {
      setDetailLoading(true);
      setDetailError(null);
      setDetail(null);

      const response = await fetch(`/api/admin/inbox/${encodeURIComponent(id)}`, {
        method: 'GET',
        credentials: 'include',
        cache: 'no-store',
      });

      if (response.status === 404) {
        setDetailError('Not found or disabled');
        return;
      }

      const json = await response.json().catch(() => null);

      if (!response.ok) {
        const message =
          (json && typeof json === 'object' && (json.details || json.error)) ||
          `Failed to load inbox detail (${response.status})`;
        throw new Error(message);
      }

      const normalised = normaliseDetail(json);
      if (!normalised) {
        setDetailError('Unable to parse inbox detail payload.');
        return;
      }

      setDetail(normalised);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to load inbox detail';
      setDetailError(message);
      toast.error(message);
    } finally {
      setDetailLoading(false);
    }
  }, []);

  useEffect(() => {
    loadList();
    return () => resetRefreshTimer();
  }, [loadList, resetRefreshTimer]);

  const handleApplyFilters = useCallback(() => {
    const next = {
      ref: draftFilters.ref.trim(),
      tag: draftFilters.tag,
      qHash: draftFilters.qHash.trim(),
    };

    const changed =
      filters.ref !== next.ref ||
      filters.tag !== next.tag ||
      filters.qHash !== next.qHash;

    if (!changed) {
      loadList({ append: false });
      return;
    }

    setFilters(next);
    setSelectedId(null);
    setDetail(null);
    setDetailError(null);
  }, [draftFilters, filters, loadList]);

  const handleResetFilters = useCallback(() => {
    const alreadyDefault =
      filters.ref === DEFAULT_FILTERS.ref &&
      filters.tag === DEFAULT_FILTERS.tag &&
      filters.qHash === DEFAULT_FILTERS.qHash;

    setDraftFilters(DEFAULT_FILTERS);
    if (alreadyDefault) {
      loadList({ append: false });
      return;
    }

    setFilters(DEFAULT_FILTERS);
    setSelectedId(null);
    setDetail(null);
    setDetailError(null);
  }, [filters, loadList]);

  const handleRefresh = useCallback(() => {
    if (refreshTimeoutRef.current) return;

    refreshTimeoutRef.current = setTimeout(() => {
      loadList({ append: false });
      resetRefreshTimer();
    }, 350);
  }, [loadList, resetRefreshTimer]);

  const handleLoadMore = useCallback(() => {
    if (!nextCursor) return;
    loadList({ cursor: nextCursor, append: true });
  }, [loadList, nextCursor]);

  const handleSelect = useCallback(
    (id: string) => {
      setSelectedId(id);
    },
    []
  );

  useEffect(() => {
    if (!selectedId) {
      setDetail(null);
      setDetailError(null);
      return;
    }
    loadDetail(selectedId);
  }, [selectedId, loadDetail]);

  const filtersApplied = useMemo(() => {
    return {
      ref: filters.ref,
      tag: filters.tag,
      qHash: filters.qHash,
    };
  }, [filters]);

  return (
    <div className="container mx-auto space-y-6 px-4 py-6 lg:px-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Inbox</h1>
        <p className="text-sm text-muted-foreground">
          Read-only queue of blocked asks. Open an item to review full context.
        </p>
      </div>

      {isAvailable === false ? (
        <Card>
          <CardHeader>
            <CardTitle>Inbox unavailable</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              The inbox feature is not enabled for this tenant. Enable the{' '}
              <span className="font-medium">ADMIN_INBOX_API</span> flag to
              surface no-source asks.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Filters</CardTitle>
            </CardHeader>
            <CardContent>
              <form
                className="grid gap-4 md:grid-cols-4"
                onSubmit={(event) => {
                  event.preventDefault();
                  handleApplyFilters();
                }}
              >
                <div className="space-y-2">
                  <Label htmlFor="inbox-ref-filter">Ref</Label>
                  <Input
                    id="inbox-ref-filter"
                    placeholder="UUID..."
                    value={draftFilters.ref}
                    onChange={(event) =>
                      setDraftFilters((prev) => ({
                        ...prev,
                        ref: event.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="inbox-tag-filter">Tag</Label>
                  <select
                    id="inbox-tag-filter"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={draftFilters.tag}
                    onChange={(event) =>
                      setDraftFilters((prev) => ({
                        ...prev,
                        tag: event.target.value,
                      }))
                    }
                  >
                    <option value="">All</option>
                    <option value="no_source">no_source</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="inbox-qhash-filter">Hash</Label>
                  <Input
                    id="inbox-qhash-filter"
                    placeholder="q_hash..."
                    value={draftFilters.qHash}
                    onChange={(event) =>
                      setDraftFilters((prev) => ({
                        ...prev,
                        qHash: event.target.value,
                      }))
                    }
                  />
                </div>
                <div className="flex items-end gap-2">
                  <Button type="submit" size="sm" className="w-24">
                    Apply
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={handleResetFilters}
                  >
                    Reset
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
            <InboxList
              items={items}
              loading={loading && !isInitialised}
              refreshing={loading && isInitialised}
              error={error}
              filters={filtersApplied}
              selectedId={selectedId}
              onSelect={handleSelect}
              onRefresh={handleRefresh}
              onLoadMore={handleLoadMore}
              nextCursor={nextCursor}
            />

            <InboxDetailPanel
              loading={detailLoading}
              error={detailError}
              detail={detail}
              selectedId={selectedId}
            />
          </div>
        </>
      )}
    </div>
  );
}