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

        // Get tenant from URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        const tenantSlug = urlParams.get('tenant');
        
        if (!tenantSlug) {
          // Demo mode - use hardcoded demo tenant
          setTenant({
            id: 'demo',
            slug: 'abilitix',
            name: 'Abilitix Demo',
            type: 'demo'
          });
          setLoading(false);
          return;
        }

        // Pilot mode - fetch tenant data
        const response = await fetch(`/api/tenant/${tenantSlug}`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch tenant: ${response.status}`);
        }

        const tenantData = await response.json();
        
        setTenant({
          id: tenantData.id,
          slug: tenantData.slug,
          name: tenantData.name,
          type: 'pilot'
        });

      } catch (err) {
        console.error('Tenant loading error:', err);
        setError(err instanceof Error ? err.message : 'Failed to load tenant');
        
        // Fallback to demo tenant on error
        setTenant({
          id: 'demo',
          slug: 'abilitix',
          name: 'Abilitix Demo',
          type: 'demo'
        });
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
