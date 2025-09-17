'use client';

import { usePathname } from 'next/navigation';
import TopNav from './TopNav';
import { type UserRole } from '@/lib/roles';

interface ConditionalTopNavProps {
  userEmail?: string;
  tenantName?: string;
  tenantSlug?: string;
  userRole?: UserRole;
}

export default function ConditionalTopNav({ userEmail, tenantName, tenantSlug, userRole }: ConditionalTopNavProps) {
  const pathname = usePathname();
  
  // Hide TopNav only on auth pages
  const hideOnPaths = ['/signin', '/signup', '/demo/signup'];
  const shouldHide = hideOnPaths.includes(pathname);
  
  if (shouldHide) {
    return null;
  }
  
  return <TopNav 
    userEmail={userEmail}
    tenantName={tenantName}
    tenantSlug={tenantSlug}
    userRole={userRole}
  />;
}

