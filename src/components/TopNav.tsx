"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";
import NoPrefetchLink from "./NoPrefetchLink";
import { getVisibleNavItems, type UserRole } from "@/lib/roles";

interface TopNavProps {
  userEmail?: string;
  tenantSlug?: string;  // show slug only
  tenantName?: string;  // accepted for compat; not displayed
  userRole?: UserRole;
}

// desktop shows all links; mobile shows only these three
const MOBILE_PRIMARY = new Set(["Dashboard", "Inbox", "Docs"]);

export default function TopNav({
  userEmail,
  tenantSlug,
  userRole,
}: TopNavProps) {
  const pathname = usePathname();
  const [signingOut, setSigningOut] = useState(false);

  // default to 'owner' so desktop always shows all items even if role is momentarily undefined
  const items = getVisibleNavItems(userRole ?? "owner");

  const handleSignOut = async () => {
    try {
      setSigningOut(true);
      const api = process.env.NEXT_PUBLIC_ADMIN_API!;
      await fetch(`${api}/auth/logout`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });
    } catch {
      // ignore
    } finally {
      window.location.assign("/signin");
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b bg-white/80 backdrop-blur">
        <nav
          className="
            mx-auto max-w-6xl
            grid grid-cols-3 items-center gap-3
            px-4 py-2 md:py-3 min-h-12 md:min-h-14
          "
        >
          {/* Brand (left) */}
          <NoPrefetchLink href="/" className="flex items-center gap-2 md:gap-3">
            <Image
              src="/abilitix-logo.png"
              alt="AbilitiX"
              width={28}
              height={28}
              priority
              className="rounded"
            />
            <span className="font-semibold tracking-tight">Admin Portal</span>
          </NoPrefetchLink>

          {/* Center nav — keeps its own width so the right side doesn’t jump */}
          <ul className="col-start-2 col-end-3 flex flex-wrap items-center justify-center gap-2 md:gap-3 text-sm">
            {items.map((item) => {
              const active = pathname === item.href;
              const hideOnMobile = !MOBILE_PRIMARY.has(item.label);
              return (
                <li
                  key={item.href}
                  className={hideOnMobile ? "hidden md:inline-flex" : ""}
                >
                  <NoPrefetchLink
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={[
                      "inline-flex items-center rounded-lg border px-3 py-1.5 transition-colors",
                      // equal border widths → no layout shift on hover
                      active
                        ? "bg-blue-600 text-white border-blue-600"
                        : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50",
                    ].join(" ")}
                  >
                    {item.label}
                  </NoPrefetchLink>
                </li>
              );
            })}
          </ul>

          {/* Right (email + slug + sign out) */}
          <div className="col-start-3 col-end-4 flex items-center justify-end gap-2 md:gap-4">
            {/* Mobile: slug pill */}
            {tenantSlug && (
              <span className="md:hidden inline-flex items-center rounded-full bg-slate-100 text-slate-600 text-xs px-2 py-0.5">
                {tenantSlug}
              </span>
            )}
            {/* Desktop: email | tenant: slug */}
            {(userEmail || tenantSlug) && (
              <div className="hidden md:flex items-center text-xs text-slate-600 whitespace-nowrap max-w-[46ch]">
                {userEmail && <span className="font-medium truncate">{userEmail}</span>}
                {userEmail && tenantSlug && <span className="mx-2 text-slate-300">•</span>}
                {tenantSlug && (
                  <span className="truncate">
                    tenant: <span className="font-medium">{tenantSlug}</span>
                  </span>
                )}
              </div>
            )}
            <button
              onClick={handleSignOut}
              disabled={signingOut}
              className="inline-flex select-none items-center rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 disabled:opacity-60"
            >
              {signingOut ? "Signing out…" : "Sign out"}
            </button>
          </div>
        </nav>
      </header>

      {/* Consistent gap below the bar */}
      <div className="h-4 md:h-5" />
    </>
  );
}
