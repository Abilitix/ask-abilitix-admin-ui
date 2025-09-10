'use client';

import { useState, useCallback, useEffect } from 'react';
import { InboxList } from './InboxList';
import { InboxStatsCard } from './InboxStatsCard';
import { toast } from 'sonner';

export type InboxItem = {
  id: string;
  question: string;
  answer: string;
  created_at: string;
  has_pii?: boolean;
  pii_fields?: string[];
  status: 'pending' | 'approved' | 'rejected';
};

export function InboxPageClient() {
  const [items, setItems] = useState<InboxItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshSignal, setRefreshSignal] = useState(0);

  const fetchItems = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/admin/inbox?status=pending');

      if (!response.ok) {
        throw new Error(`Failed to fetch inbox items: ${response.status}`);
      }

      const data = await response.json();

      // Handle proxy error responses
      if (data.error) {
        throw new Error(data.details || data.error);
      }

      setItems(data.items || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load inbox items';
      setError(errorMessage);
      toast.error(`Failed to load inbox: ${errorMessage}`);
      console.error('Inbox fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleApprove = useCallback(async (id: string, editedAnswer?: string) => {
    try {
      const response = await fetch('/api/admin/inbox/approve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          id,
          reembed: true,
          ...(editedAnswer && { answer: editedAnswer })
        }),
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        throw new Error(data.details || data.error || `Failed to approve: ${response.status}`);
      }

      toast.success('Item approved ✓ (embeddings generated automatically)');
      
      // Remove item from list
      setItems(prev => prev.filter(item => item.id !== id));
      setRefreshSignal(prev => prev + 1);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to approve item';
      toast.error(`Approval failed: ${errorMessage}`);
      console.error('Approve error:', err);
    }
  }, []);

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
      
      // Remove item from list
      setItems(prev => prev.filter(item => item.id !== id));
      setRefreshSignal(prev => prev + 1);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to reject item';
      toast.error(`Rejection failed: ${errorMessage}`);
      console.error('Reject error:', err);
    }
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Inbox</h1>
        <p className="text-sm text-muted-foreground">
          Review and approve pending items. Embeddings are automatically generated when approving.
        </p>
      </div>

      <InboxStatsCard 
        itemCount={items.length} 
        refreshSignal={refreshSignal}
      />

      <InboxList
        items={items}
        loading={loading}
        error={error}
        onApprove={handleApprove}
        onReject={handleReject}
        onRefresh={fetchItems}
      />
    </div>
  );
}