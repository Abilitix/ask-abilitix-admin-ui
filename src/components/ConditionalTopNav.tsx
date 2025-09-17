'use client';

import { usePathname } from 'next/navigation';
import TopNav from './TopNav';

interface ConditionalTopNavProps {
  userEmail?: string;
  tenantName?: string;
  tenantSlug?: string;
}

export default function ConditionalTopNav({ userEmail, tenantName, tenantSlug }: ConditionalTopNavProps) {
  const pathname = usePathname();
  
  // Hide TopNav on auth pages only (admin layout handles its own nav)
  const hideOnPaths = ['/signin', '/signup', '/demo/signup'];
  const shouldHide = hideOnPaths.includes(pathname);
  
  if (shouldHide) {
    return null;
  }
  
  return <TopNav userEmail={userEmail} tenantName={tenantName} tenantSlug={tenantSlug} />;
}

