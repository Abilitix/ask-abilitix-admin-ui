"use client";

import { createContext, useContext, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

interface TenantInfo {
  id: string;
  slug: string;
  name: string;
  type: 'demo' | 'pilot';
}

interface TenantContextType {
  tenant: TenantInfo | null;
  loading: boolean;
  error: string | null;
}

const TenantContext = createContext<TenantContextType>({
  tenant: null,
  loading: true,
  error: null,
});

export function TenantProvider({ children }: { children: React.ReactNode }) {
  const [tenant, setTenant] = useState<TenantInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    const loadTenant = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get tenant information from authenticated user session
        const response = await fetch('/api/auth/me', {
          credentials: 'include',
          cache: 'no-store'
        });
        
        if (!response.ok) {
          throw new Error(`Authentication failed: ${response.status}`);
        }

        const userData = await response.json();
        
        if (userData.tenant_id) {
          // Use tenant info directly from /auth/me response (new fields)
          setTenant({
            id: userData.tenant_id,
            slug: userData.tenant_slug || `tenant-${userData.tenant_id.slice(0, 8)}`,
            name: userData.tenant_name || userData.tenant_slug || `Tenant ${userData.tenant_id.slice(0, 8)}`,
            type: 'pilot' // Always show as pilot mode for now
          });
        } else {
          throw new Error('No tenant information in user session');
        }

      } catch (err) {
        console.error('Tenant loading error:', err);
        setError(err instanceof Error ? err.message : 'Failed to load tenant');
        
        // No fallback - show proper error instead of wrong tenant data
        setTenant(null);
      } finally {
        setLoading(false);
      }
    };

    loadTenant();
  }, [pathname]);

  return (
    <TenantContext.Provider value={{ tenant, loading, error }}>
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant() {
  const context = useContext(TenantContext);
  if (context === undefined) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
}
