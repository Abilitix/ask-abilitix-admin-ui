'use client';

import { usePathname } from 'next/navigation';
import TopNav from './TopNav';

export default function ConditionalTopNav() {
  const pathname = usePathname();
  
  // Hide TopNav on auth pages and admin pages (admin layout handles it)
  const hideOnPaths = ['/signin', '/signup', '/demo/signup'];
  const shouldHide = hideOnPaths.includes(pathname) || pathname.startsWith('/admin');
  
  if (shouldHide) {
    return null;
  }
  
  return <TopNav />;
}

