"use client";

import * as React from "react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import NoPrefetchLink from "./NoPrefetchLink"; // adjust if your path differs
import { getVisibleNavItems, type UserRole } from "@/lib/roles";

interface TopNavProps {
  userEmail?: string;
  tenantSlug?: string; // show slug only
  tenantName?: string; // back-compat; unused
  userRole?: UserRole;
}

// Mobile shows only these (by label or href); desktop shows ALL
const MOBILE_PRIMARY_LABELS = new Set(["Dashboard", "Inbox", "Documents"]);
const MOBILE_PRIMARY_HREFS = new Set(["/", "/admin", "/admin/inbox", "/admin/docs"]);

const isPrimaryMobile = (item: { label: string; href: string }) =>
  MOBILE_PRIMARY_LABELS.has(item.label) || MOBILE_PRIMARY_HREFS.has(item.href);

const isDocs = (item: { label: string; href: string }) =>
  item.href === "/admin/docs" || item.label.toLowerCase().startsWith("doc");

export default function TopNav({
  userEmail,
  tenantSlug,
  userRole = "viewer",
}: TopNavProps) {
  const pathname = usePathname();
  const [signingOut, setSigningOut] = React.useState(false);

  // Always fetch full list for desktop; CSS hides extras on mobile (no flicker)
  const items = getVisibleNavItems(userRole, /*isMobileInRoles*/ false);

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
      // ignore — we hard redirect anyway
    } finally {
      window.location.assign("/signin");
    }
  };

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur">
        <nav
          className="mx-auto flex h-auto max-w-6xl items-center justify-between px-4 py-2 md:h-14 md:py-3"
          role="navigation"
          aria-label="Main"
        >
          {/* Left: brand */}
          <NoPrefetchLink href="/" className="flex shrink-0 items-center gap-2 md:gap-3">
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

          {/* Middle: nav list */}
          <ul className="min-w-0 flex flex-1 items-center justify-center gap-3 overflow-x-auto whitespace-nowrap text-sm md:justify-start md:gap-4">
            {items.map((item) => {
              const active = pathname === item.href;
              return (
                <li
                  key={item.href}
                  className={isPrimaryMobile(item) ? "block" : "hidden md:block"}
                >
                  <NoPrefetchLink
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={[
                      "inline-flex items-center rounded-lg border px-3 py-1.5 transition-colors",
                      active
                        ? "border-blue-600 bg-blue-600 text-white"
                        : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50",
                    ].join(" ")}
                  >
                    {/* Short label on mobile, full on desktop */}
                    <span className="md:hidden">{isDocs(item) ? "Docs" : item.label}</span>
                    <span className="hidden md:inline">{item.label}</span>
                  </NoPrefetchLink>
                </li>
              );
            })}
          </ul>

          {/* Right: identity + sign-out */}
          <div className="flex shrink-0 items-center gap-2 md:gap-4">
            {/* Mobile: slug pill */}
            {tenantSlug && (
              <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600 md:hidden">
                {tenantSlug}
              </span>
            )}

            {/* Desktop: email | tenant: slug */}
            {(userEmail || tenantSlug) && (
              <div className="hidden max-w-[46ch] items-center whitespace-nowrap text-xs text-slate-600 md:flex">
                {userEmail && <span className="truncate font-medium">{userEmail}</span>}
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

      {/* spacer between TopNav and first content */}
      <div className="h-5 md:h-6" />
    </>
  );
}
