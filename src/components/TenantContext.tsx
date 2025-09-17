"use client";

import { createContext, useContext } from 'react';

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
  loading: false,
  error: null,
});

interface TenantProviderProps {
  children: React.ReactNode;
  userEmail?: string;
  tenantName?: string;
  tenantSlug?: string;
}

export function TenantProvider({ children, userEmail, tenantName, tenantSlug }: TenantProviderProps) {
  // Create tenant info from props (no client-side fetching)
  const tenant: TenantInfo | null = userEmail && tenantName ? {
    id: tenantSlug || 'unknown',
    slug: tenantSlug || tenantName || 'unknown',
    name: tenantName || 'Unknown Tenant',
    type: 'pilot'
  } : null;

  return (
    <TenantContext.Provider value={{ 
      tenant, 
      loading: false, 
      error: null 
    }}>
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