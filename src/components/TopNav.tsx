"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import NoPrefetchLink from "./NoPrefetchLink";
import { getVisibleNavItems, type UserRole } from "@/lib/roles";

interface TopNavProps {
  userEmail?: string;
  tenantName?: string; // kept for future, not displayed now
  tenantSlug?: string;
  userRole?: UserRole;
}

export default function TopNav({
  userEmail,
  tenantName, // eslint still happy
  tenantSlug,
  userRole = "viewer",
}: TopNavProps) {
  const pathname = usePathname();

  // Detect mobile once mounted so SSR renders desktop (prevents flicker)
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    setMounted(true);
    const check = () => setIsMobile(window.innerWidth < 768); // md breakpoint
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Desktop by default until mounted; role logic unchanged
  const navItems = getVisibleNavItems(userRole, mounted ? isMobile : false);

  const [isSigningOut, setIsSigningOut] = useState(false);
  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      const api = process.env.NEXT_PUBLIC_ADMIN_API!;
      await fetch(`${api}/auth/logout`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });
    } catch {
      /* ignore and still hard-nav */
    } finally {
      window.location.assign("/signin");
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 mb-4">
      <nav className="mx-auto max-w-6xl px-4 py-2 md:h-14 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
        {/* Brand */}
        <NoPrefetchLink href="/" className="flex items-center gap-3">
          <Image
            src="/abilitix-logo.png"
            alt="AbilitiX"
            width={32}
            height={32}
            priority
            className="rounded"
          />
          <span className="font-bold tracking-tight text-lg">Admin Portal</span>
        </NoPrefetchLink>

        {/* Nav buttons */}
        <ul className="flex flex-wrap items-center gap-2 md:gap-3 mt-1 md:mt-0">
          {navItems.map((item) => {
            const active = pathname === item.href;
            // If this item is not meant for mobile, hide it under md
            const mobileHideClass = item.mobileVisible ? "" : "hidden md:inline-flex";

            return (
              <li key={item.href} className={mobileHideClass}>
                <NoPrefetchLink
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={[
                    "inline-flex items-center rounded-lg border text-sm",
                    "px-3 md:px-4 py-2 transition-colors duration-200",
                    active
                      ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                      : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50 hover:border-slate-400",
                  ].join(" ")}
                >
                  {item.label}
                </NoPrefetchLink>
              </li>
            );
          })}
        </ul>

        {/* Right side: user info + sign out */}
        <div className="flex items-center justify-end gap-3 md:gap-4">
          {/* Mobile: tenant slug only (compact chip) */}
          {tenantSlug && (
            <span
              className="md:hidden inline-flex items-center rounded-full border border-slate-300 bg-white px-2 py-1 text-xs text-slate-600 max-w-[40vw] truncate"
              title={tenantSlug}
            >
              {tenantSlug}
            </span>
          )}

          {/* Desktop: email + slug */}
          <div className="hidden md:flex items-center gap-2 text-xs text-slate-600">
            {userEmail && (
              <span className="truncate max-w-[28ch]" title={userEmail}>
                {userEmail}
              </span>
            )}
            {tenantSlug && (
              <span
                className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5"
                title={tenantSlug}
              >
                {tenantSlug}
              </span>
            )}
          </div>

          <button
            onClick={handleSignOut}
            disabled={isSigningOut}
            className="text-xs text-slate-500 hover:text-slate-700 disabled:opacity-50"
          >
            {isSigningOut ? "Signing out..." : "Sign out"}
          </button>
        </div>
      </nav>
    </header>
  );
}
