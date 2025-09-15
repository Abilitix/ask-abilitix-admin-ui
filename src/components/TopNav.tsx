"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useTenant } from "./TenantContext";
import { getVisibleNavItems, type UserRole } from "@/lib/roles";

export default function TopNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const { tenant, loading, error } = useTenant();

  // Fetch user role on component mount
  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        const api = process.env.NEXT_PUBLIC_ADMIN_API!;
        const response = await fetch(`${api}/auth/me`, {
          credentials: 'include',
          cache: 'no-store'
        });
        if (response.ok) {
          const userData = await response.json();
          setUserRole(userData.role || 'viewer'); // Default to viewer if no role
        }
      } catch (error) {
        console.error('Failed to fetch user role:', error);
        setUserRole('viewer'); // Default to viewer on error
      }
    };
    
    fetchUserRole();
  }, []);

  // Get visible navigation items based on user role
  const visibleNavItems = userRole ? getVisibleNavItems(userRole) : [];

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
      
      if (response.ok) {
        // Redirect to signin page after successful logout
        router.replace('/signin');
      } else {
        // Force redirect even if logout API fails
        router.replace('/signin');
      }
    } catch (error) {
      console.error('Sign out error:', error);
      // Force redirect on client side if server redirect fails
      router.replace('/signin');
    } finally {
      setIsSigningOut(false);
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-white/80 backdrop-blur">
      <nav className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/abilitix-logo.png"
            alt="AbilitiX"
            width={28}
            height={28}
            priority
            className="rounded"
          />
          <span className="font-semibold tracking-tight">
            Abiliti<span className="text-xs">X</span> Admin
          </span>
        </Link>
        <ul className="flex items-center text-sm text-slate-700" style={{ gap: '1.25rem' }}>
          {visibleNavItems.map((item) => {
            const active = pathname === item.href;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`rounded-md hover:bg-slate-100 ${
                    active ? "bg-slate-200 font-medium" : ""
                  }`}
                  style={{ padding: '0.5rem 1rem' }}
                  aria-current={active ? "page" : undefined}
                >
                  {item.label}
                </Link>
              </li>
            );
          })}
          <li className="ml-2 pl-3 border-l text-xs text-slate-500" id="tenantBadge">
            {loading ? (
              'Loading...'
            ) : error ? (
              'Demo Mode'
            ) : tenant ? (
              <>
                Tenant: {tenant.slug}
                <span className="ml-1 px-1 py-0.5 rounded text-xs bg-slate-100">
                  {tenant.type}
                </span>
              </>
            ) : (
              'Demo Mode'
            )}
          </li>
          <li className="ml-2 pl-3 border-l">
            <button
              onClick={handleSignOut}
              disabled={isSigningOut}
              className="text-xs text-slate-500 hover:text-slate-700 disabled:opacity-50"
            >
              {isSigningOut ? 'Signing out...' : 'Sign out'}
            </button>
          </li>
        </ul>
      </nav>
    </header>
  );
}
