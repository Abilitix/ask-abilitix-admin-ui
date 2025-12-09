'use client';

import { useState, useEffect } from 'react';
import type { UserFeatures } from '@/lib/features';

type AuthMeResponse = {
  ok: boolean;
  user?: { id?: string; email?: string };
  email?: string;
  tenant_id?: string;
  features?: UserFeatures;
  [key: string]: any;
};

export function useUserFeatures() {
  const [features, setFeatures] = useState<UserFeatures | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const response = await fetch('/api/auth/me', {
          credentials: 'include',
          cache: 'no-store',
        });
        const data: AuthMeResponse = await response.json().catch(() => ({}));
        if (!active) return;
        
        setFeatures(data.features || {});
        setError(null);
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : 'Failed to load features');
          setFeatures({});
        }
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  return { features, loading, error };
}

