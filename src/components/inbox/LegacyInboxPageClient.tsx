'use client';

import { useState, useCallback, useEffect } from 'react';
import { LegacyInboxList } from './LegacyInboxList';
import { LegacyInboxStatsCard } from './LegacyInboxStatsCard';
import { toast } from 'sonner';

export type LegacyInboxItem = {
  id: string;
  question: string;
  answer: string;
  created_at: string;
  has_pii?: boolean;
  pii_fields?: string[];
  status: 'pending' | 'approved' | 'rejected';
  suggested_citations?: Array<{
    doc_id: string;
    page?: number;
    span?: { start?: number; end?: number; text?: string };
  }>;
};

type LegacyInboxPageClientProps = {
  disabled?: boolean;
  enableFaqCreation?: boolean;
  allowEmptyCitations?: boolean;
};

export function LegacyInboxPageClient({ disabled, enableFaqCreation = false, allowEmptyCitations = false }: LegacyInboxPageClientProps) {
  const [items, setItems] = useState<LegacyInboxItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshSignal, setRefreshSignal] = useState(0);

  const fetchItems = useCallback(async () => {
    if (disabled) return;
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/admin/inbox?status=pending');

      if (!response.ok) {
        throw new Error(`Failed to fetch inbox items: ${response.status}`);
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(data.details || data.error);
      }

      setItems(data.items || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load inbox items';
      setError(errorMessage);
      toast.error(`Failed to load inbox: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  }, [disabled]);

  const handleApprove = useCallback(async (id: string, editedAnswer?: string, isFaq: boolean = true) => {
    try {
      // Use /promote endpoint for FAQ creation (requires ENABLE_REVIEW_PROMOTE=1)
      // For regular QA pairs without FAQ, use /approve endpoint (legacy)
      const endpoint = isFaq 
        ? `/api/admin/inbox/${encodeURIComponent(id)}/promote`
        : '/api/admin/inbox/approve';
      
      const body = isFaq
        ? {
            ...(editedAnswer && { answer: editedAnswer }),
            is_faq: true,
          }
        : {
            id,
            reembed: true,
            ...(editedAnswer && { answer: editedAnswer }),
          };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        throw new Error(data.details || data.error || `Failed to ${isFaq ? 'promote' : 'approve'}: ${response.status}`);
      }

      toast.success(isFaq 
        ? 'Item promoted as FAQ ✓ (embeddings generated automatically)'
        : 'Item approved ✓ (embeddings generated automatically)'
      );
      setItems((prev) => prev.filter((item) => item.id !== id));
      setRefreshSignal((prev) => prev + 1);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : `Failed to ${isFaq ? 'promote' : 'approve'} item`;
      toast.error(`${isFaq ? 'Promotion' : 'Approval'} failed: ${errorMessage}`);
    }
  }, []);

  const handleAttachCitations = useCallback(async (id: string, citations: Array<{ doc_id: string; page?: number; span?: { start?: number; end?: number; text?: string } }>) => {
    try {
      const response = await fetch(`/api/admin/inbox/${encodeURIComponent(id)}/attach_source`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ citations }),
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        throw new Error(data.details || data.error || `Failed to attach citations: ${response.status}`);
      }

      toast.success('Citations attached ✓');
      await fetchItems(); // Refresh to get updated item
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to attach citations';
      toast.error(`Attachment failed: ${errorMessage}`);
      throw err; // Re-throw so caller can handle
    }
  }, [fetchItems]);

  const handleReject = useCallback(async (id: string) => {
    try {
      const response = await fetch('/api/admin/inbox/reject', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id }),
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        throw new Error(data.details || data.error || `Failed to reject: ${response.status}`);
      }

      toast.success('Item rejected ✓');
      setItems((prev) => prev.filter((item) => item.id !== id));
      setRefreshSignal((prev) => prev + 1);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to reject item';
      toast.error(`Rejection failed: ${errorMessage}`);
    }
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  return (
    <div className="container mx-auto space-y-6 px-4 py-6 lg:px-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Inbox</h1>
        <p className="text-sm text-muted-foreground">
          Review and approve pending items. Embeddings are automatically generated when approving.
        </p>
      </div>

      <LegacyInboxStatsCard itemCount={items.length} refreshSignal={refreshSignal} />

      <LegacyInboxList
        items={items}
        loading={loading}
        error={error}
        enableFaqCreation={enableFaqCreation}
        allowEmptyCitations={allowEmptyCitations}
        onApprove={handleApprove}
        onReject={handleReject}
        onAttachCitations={handleAttachCitations}
        onRefresh={fetchItems}
      />
    </div>
  );
}



