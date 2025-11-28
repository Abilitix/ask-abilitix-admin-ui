'use client';

import { useState, useEffect } from 'react';

export interface DashboardSummary {
  metrics: {
    cited_pct: number | null;
    faq_hit_pct: number | null;
    runtime_p95: number | null;
    pending_reviews: number;
    faq_count: number;
    docs_active: number;
  };
  user: {
    name: string | null;
  };
  tenant: {
    name: string | null;
    industry: string | null;
    tone: string | null;
  };
}

export function useDashboardSummary() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function fetchSummary() {
      try {
        setIsLoading(true);
        setIsError(false);

        const response = await fetch('/api/admin/dashboard/summary', {
          credentials: 'include',
          cache: 'no-store',
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch dashboard summary: ${response.status}`);
        }

        const data = await response.json();
        
        if (mounted) {
          setSummary(data);
        }
      } catch (err) {
        console.error('Dashboard summary fetch error:', err);
        if (mounted) {
          setIsError(true);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    fetchSummary();

    return () => {
      mounted = false;
    };
  }, []);

  return { summary, isLoading, isError };
}

