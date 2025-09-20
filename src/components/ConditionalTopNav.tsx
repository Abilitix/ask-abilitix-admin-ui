'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import TopNav from './TopNav';
import { type UserRole } from '@/lib/roles';

export default function ConditionalTopNav() {
  const pathname = usePathname();
  const [user, setUser] = useState<{email?: string, tenant_name?: string, tenant_slug?: string, role?: UserRole} | null>(null);
  
  // Kill-switch: suspend client auth if needed
  const SUSPEND_CLIENT_AUTH = process.env.NEXT_PUBLIC_SUSPEND_CLIENT_AUTH === '1';
  
  // Quarantine public pages - no auth calls on auth routes
  const AUTH_ROUTES = ['/signin', '/signup', '/verify', '/verify/workspace-picker'];
  const isPublic = AUTH_ROUTES.some((r) => pathname === r || pathname.startsWith(r + '/'));
  
  // Fetch user data on client side
  useEffect(() => {
    if (SUSPEND_CLIENT_AUTH || isPublic) return;
    
    fetch('/api/auth/me')
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        console.log('User data fetched:', data);
        setUser(data);
      })
      .catch((error) => {
        console.error('Error fetching user data:', error);
        setUser(null);
      });
  }, [SUSPEND_CLIENT_AUTH, isPublic]);
  
  // Safe to return after hooks
  if (SUSPEND_CLIENT_AUTH || isPublic) {
    return null;
  }
  
  return <TopNav 
    userEmail={user?.email}
    tenantName={user?.tenant_name}
    tenantSlug={user?.tenant_slug}
    userRole={user?.role}
  />;
}

