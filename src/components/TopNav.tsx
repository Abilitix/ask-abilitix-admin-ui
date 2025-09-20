"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { getVisibleNavItems, type UserRole } from "@/lib/roles";
import NoPrefetchLink from "./NoPrefetchLink";

interface TopNavProps {
  userEmail?: string;
  tenantName?: string;
  tenantSlug?: string;
  tenantId?: string;            // ← add this
  userRole?: UserRole;
}

const MOBILE_KEEP_LABELS = new Set(["Dashboard", "Inbox", "Docs"]);

export default function TopNav({
  userEmail,
  tenantName,
  tenantSlug,
  tenantId,                      // ← will render on desktop
  userRole = "viewer",
}: TopNavProps) {
  const pathname = usePathname();
  const [isMobile, setIsMobile] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const apply = () => setIsMobile(window.innerWidth < 768); // md breakpoint
    apply();
    window.addEventListener("resize", apply);
    return () => window.removeEventListener("resize", apply);
  }, []);

  // Always get the full list, then enforce our mobile policy locally.
  const fullNav = getVisibleNavItems(userRole, false);
  const navItems = mounted && isMobile
    ? fullNav.filter((i) => MOBILE_KEEP_LABELS.has(i.label))
    : fullNav;

  const handleSignOut = async () => {
    try {
      // Prefer same-origin proxy if you have it; otherwise keep ADMIN_API.
      const api = process.env.NEXT_PUBLIC_ADMIN_API!;
      await fetch(`${api}/auth/logout`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });
    } catch (_) {
      // ignore
    } finally {
      // Hard navigate to avoid any half-authed state
      window.location.assign("/signin");
    }
  };

  return (
    // Add mb-4 to create a clear gap below the sticky bar
    <header className="sticky top-0 z-40 w-full border-b bg-white/80 backdrop-blur mb-4">
      <nav className="mx-auto flex h-auto md:h-14 max-w-6xl items-start md:items-center justify-between px-4 py-2 md:py-0">
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
          <span className="font-bold tracking-tight text-lg">
            Abiliti<span className="text-sm">X</span> Admin
          </span>
        </NoPrefetchLink>

        {/* Nav links */}
        <ul className="ml-0 md:ml-6 flex flex-wrap items-center text-sm mt-2 md:mt-0 gap-2">
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <li key={item.href}>
                <NoPrefetchLink
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={[
                    "px-4 py-2 rounded-lg border transition-colors duration-200",
                    active
                      ? "bg-blue-500 text-white border-blue-500 shadow-md"
                      : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50 hover:border-slate-400",
                  ].join(" ")}
                >
                  {item.label}
                </NoPrefetchLink>
              </li>
            );
          })}
        </ul>

        {/* Right side: user + tenant (desktop only) + sign out */}
        <div className="flex items-center justify-end gap-3 text-xs text-slate-600">
          {/* Desktop-only identity block */}
          <div className="hidden md:flex items-center gap-2">
            {userEmail && <span className="font-medium text-slate-700">{userEmail}</span>}
            {(tenantSlug || tenantId) && <span className="text-slate-400">•</span>}
            {tenantSlug && (
              <span className="truncate">
                <span className="text-slate-500">Tenant:</span>{" "}
                <span className="font-medium">{tenantSlug}</span>
              </span>
            )}
            {tenantId && (
              <span className="truncate font-mono text-[11px] text-slate-500">
                id:{tenantId}
              </span>
            )}
          </div>

          {/* Sign out (both mobile + desktop) */}
          <button
            onClick={handleSignOut}
            className="text-xs text-slate-500 hover:text-slate-700"
          >
            Sign out
          </button>
        </div>
      </nav>
    </header>
  );
}
