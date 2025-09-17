'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

type DocsStatsCardProps = {
  refreshSignal?: number;
  onLoaded?: (stats: { total: number; with_vec: number; missing_vec: number }) => void;
};

type StatsData = {
  total: number;
  with_vec: number;
  missing_vec: number;
};

export function DocsStatsCard({ refreshSignal, onLoaded }: DocsStatsCardProps) {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/admin/docs/stats');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch stats: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Handle proxy error responses
      if (data.error) {
        throw new Error(data.details || data.error);
      }
      
      setStats(data);
      onLoaded?.(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load stats';
      setError(errorMessage);
      console.error('Stats fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []); // Remove onLoaded dependency to prevent infinite re-renders

  useEffect(() => {
    fetchStats();
  }, [refreshSignal, fetchStats]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Document Statistics</CardTitle>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchStats}
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </CardHeader>
      <CardContent>
        {loading && !stats ? (
          <div className="flex items-center space-x-2">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span className="text-sm text-muted-foreground">Loading stats...</span>
          </div>
        ) : error ? (
          <div className="text-sm text-destructive">
            Error: {error}
          </div>
        ) : stats ? (
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{stats.total}</div>
              <div className="text-xs text-muted-foreground">Total</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats.with_vec}</div>
              <div className="text-xs text-muted-foreground">With Vectors</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{stats.missing_vec}</div>
              <div className="text-xs text-muted-foreground">Missing Vectors</div>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
