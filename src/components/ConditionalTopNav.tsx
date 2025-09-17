'use client';

import { usePathname } from 'next/navigation';
import TopNav from './TopNav';

export default function ConditionalTopNav() {
  const pathname = usePathname();
  
  // Hide TopNav only on auth pages
  const hideOnPaths = ['/signin', '/signup', '/demo/signup'];
  const shouldHide = hideOnPaths.includes(pathname);
  
  if (shouldHide) {
    return null;
  }
  
  return <TopNav />;
}

