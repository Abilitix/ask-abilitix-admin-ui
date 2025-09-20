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

  // Kill-switch: suspend client auth if needed
  const SUSPEND_CLIENT_AUTH = process.env.NEXT_PUBLIC_SUSPEND_CLIENT_AUTH === '1';
  if (SUSPEND_CLIENT_AUTH) {
    return <>{children}</>;
  }

  // Quarantine public pages - no auth calls on auth routes
  const AUTH_ROUTES = ['/signin', '/signup', '/verify', '/verify/workspace-picker'];
  const isAuthRoute = AUTH_ROUTES.some((r) => pathname === r || pathname.startsWith(r + '/'));
  
  if (isAuthRoute) {
    return <>{children}</>;
  }

  // No client-side auth calls - data should come from server
  useEffect(() => {
    setLoading(false);
  }, []);

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
