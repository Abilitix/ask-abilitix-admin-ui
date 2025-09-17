'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import TopNav from './TopNav';
import { type UserRole } from '@/lib/roles';

export default function ConditionalTopNav() {
  const pathname = usePathname();
  const [user, setUser] = useState<{email?: string, tenant_name?: string, tenant_slug?: string, role?: UserRole} | null>(null);
  
  // Hide TopNav only on auth pages
  const hideOnPaths = ['/signin', '/signup', '/demo/signup'];
  const shouldHide = hideOnPaths.includes(pathname);
  
  // Fetch user data on client side
  useEffect(() => {
    if (!shouldHide) {
      fetch('/api/auth/me')
        .then(res => res.ok ? res.json() : null)
        .then(data => setUser(data))
        .catch(() => setUser(null));
    }
  }, [shouldHide]);
  
  if (shouldHide) {
    return null;
  }
  
  return <TopNav 
    userEmail={user?.email}
    tenantName={user?.tenant_name}
    tenantSlug={user?.tenant_slug}
    userRole={user?.role}
  />;
}

