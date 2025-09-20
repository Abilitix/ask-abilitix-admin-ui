"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { getVisibleNavItems, type UserRole } from "@/lib/roles";
import NoPrefetchLink from "./NoPrefetchLink";

interface TopNavProps {
  userEmail?: string;
  tenantName?: string;
  tenantSlug?: string;
  userRole?: UserRole;
}

export default function TopNav({ userEmail, tenantName, tenantSlug, userRole = 'viewer' }: TopNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);

  // Get visible navigation items based on user role and device type
  const [isMobile, setIsMobile] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768); // md breakpoint
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  // Default to PC (show all buttons) until mounted, then use actual device detection
  const visibleNavItems = getVisibleNavItems(userRole, mounted ? isMobile : false);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      const api = process.env.NEXT_PUBLIC_ADMIN_API!;
      const response = await fetch(`${api}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      // Use hard navigation to avoid rendering half-authed state
      window.location.assign('/signin');
    } catch (error) {
      console.error('Sign out error:', error);
      // Force hard navigation even if logout API fails
      window.location.assign('/signin');
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-white/80 backdrop-blur">
      <nav className="mx-auto flex flex-col md:flex-row h-auto md:h-14 max-w-6xl items-start md:items-center justify-between px-4 py-2 md:py-0 mb-4 md:mb-2">
        <NoPrefetchLink href="/" className="flex items-center gap-3">
          <Image
            src="/abilitix-logo.png"
            alt="AbilitiX"
            width={32}
            height={32}
            priority
            className="rounded"
          />
          <span className="font-bold tracking-tight text-lg">
            Abiliti<span className="text-sm">X</span> Admin
          </span>
        </NoPrefetchLink>
        
        {/* Visual separator between logo and navigation - hidden on mobile */}
        <div className="hidden md:block h-8 w-px bg-slate-400 mx-6"></div>
        
        {/* Navigation buttons - left side */}
        <ul className="flex flex-wrap items-center text-sm mt-2 md:mt-0" style={{ gap: '0.5rem' }}>
          {visibleNavItems.map((item) => {
            const active = pathname === item.href;
            const isMobileHidden = !item.mobileVisible;
            return (
              <li key={item.href} className={isMobileHidden ? "hidden md:inline-flex" : ""}>
                <NoPrefetchLink
                  href={item.href}
                  className={`px-4 py-2 rounded-lg border transition-colors duration-200 ${
                    active 
                      ? "bg-blue-500 text-white border-blue-500 shadow-md" 
                      : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50 hover:border-slate-400"
                  }`}
                  aria-current={active ? "page" : undefined}
                >
                  {item.label}
                </NoPrefetchLink>
              </li>
            );
          })}
        </ul>
        
        {/* User info and sign out - right side */}
        <div className="flex items-center gap-3 text-xs text-slate-500">
          {/* User info - PC only */}
          <div className="hidden md:flex items-center gap-2">
            {userEmail && (
              <span className="font-medium text-slate-700">{userEmail}</span>
            )}
            {tenantSlug && (
              <>
                <span>Tenant: {tenantSlug}</span>
                <span className="px-1 py-0.5 rounded text-xs bg-slate-100">
                  pilot
                </span>
              </>
            )}
          </div>
          
          {/* Sign out - both mobile and desktop */}
          <button
            onClick={handleSignOut}
            disabled={isSigningOut}
            className="text-xs text-slate-500 hover:text-slate-700 disabled:opacity-50"
          >
            {isSigningOut ? 'Signing out...' : 'Sign out'}
          </button>
        </div>
        
      </nav>
    </header>
  );
}
