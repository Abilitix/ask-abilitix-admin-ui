'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

type ReembedButtonProps = {
  onDone?: () => void;
};

type ReembedResponse = {
  ok: boolean;
  selected: number;
  reembedded: number;
  skipped: number;
  errors: number;
  error?: string;
  details?: string;
};

export function ReembedButton({ onDone }: ReembedButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleReembed = async () => {
    try {
      setLoading(true);
      
      const response = await fetch('/api/admin/docs/reembed_missing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Re-embed failed: ${response.status}`);
      }

      const data: ReembedResponse = await response.json();
      
      // Handle proxy error responses
      if (data.error) {
        throw new Error(data.details || data.error);
      }

      if (data.ok) {
        toast.success(
          `Re-embedded (selected: ${data.selected}, reembedded: ${data.reembedded}, skipped: ${data.skipped})`
        );
        
        // Trigger refresh
        onDone?.();
      } else {
        throw new Error('Re-embed operation failed');
      }
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Re-embed failed';
      toast.error(`Re-embed failed: ${errorMessage}`);
      console.error('Re-embed error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <RefreshCw className="h-5 w-5" />
          <span>Re-embed Missing Vectors</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          Re-embed documents that are missing vector embeddings. This will process all documents 
          that don&apos;t have vector representations yet.
        </p>
        <Button 
          onClick={handleReembed}
          disabled={loading}
          className="w-full"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Re-embedding...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Re-embed Missing Vectors
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
