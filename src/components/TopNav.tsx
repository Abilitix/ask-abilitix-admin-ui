"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import NoPrefetchLink from "@/components/NoPrefetchLink";
import { getVisibleNavItems, type UserRole } from "@/lib/roles";

interface TopNavProps {
  userEmail?: string;
  tenantSlug?: string; // slug only (eg. "acme-co")
  userRole?: UserRole; // "owner" | "editor" | "viewer"
}

/**
 * Mobile shows only these primary links; desktop shows all role-allowed items.
 */
const MOBILE_PRIMARY = new Set(["Dashboard", "Inbox", "Docs"]);

export default function TopNav({
  userEmail,
  tenantSlug,
  userRole = "viewer",
}: TopNavProps) {
  const pathname = usePathname();

  // sign-out button state
  const [signingOut, setSigningOut] = useState(false);

  // mobile detection for client-only rendering
  const [isMobile, setIsMobile] = useState(false);
  const [mounted, setMounted] = useState(false);

  // drawer state
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const detect = () =>
      setIsMobile(typeof window !== "undefined" && window.innerWidth < 768);
    detect();
    setMounted(true);
    window.addEventListener("resize", detect);
    return () => window.removeEventListener("resize", detect);
  }, []);

  // Always fetch full list from roles (desktop shows all; mobile we filter)
  const items = getVisibleNavItems(userRole, /* isMobileInRoles */ false);

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
      // ignore — we hard-redirect anyway
    } finally {
      window.location.assign("/signin");
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <nav className="mx-auto flex h-auto md:h-14 max-w-6xl items-center justify-between px-4 py-2 md:py-3">
          {/* Left: brand + mobile menu button */}
          <div className="flex items-center gap-2 md:gap-3">
            {/* Mobile: hamburger */}
            <button
              type="button"
              aria-label="Open menu"
              onClick={() => setOpen(true)}
              className="md:hidden inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-300 bg-white hover:bg-slate-50"
            >
              <span className="sr-only">Open menu</span>
              {/* simple hamburger icon */}
              <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M3 6h18M3 12h18M3 18h18" fill="none" stroke="currentColor" strokeWidth="2" />
              </svg>
            </button>

            <NoPrefetchLink href="/" className="flex items-center gap-2 md:gap-3 shrink-0">
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
          </div>

          {/* Middle: desktop nav list */}
          <ul className="hidden md:flex min-w-0 flex-1 items-center justify-start gap-4 text-sm">
            {items.map((item) => {
              const active = pathname === item.href;
              return (
                <li key={item.href}>
                  <NoPrefetchLink
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={[
                      "inline-flex items-center rounded-lg border px-3 py-1.5 transition-colors",
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

          {/* Right: identity + sign-out (desktop) */}
          <div className="hidden md:flex items-center gap-4 shrink-0">
            {(userEmail || tenantSlug || userRole) && (
              <div className="hidden md:flex items-center text-xs text-slate-600 whitespace-nowrap max-w-[56ch]">
                {userEmail && <span className="font-medium truncate">{userEmail}</span>}

                {(userEmail && (tenantSlug || userRole)) && (
                  <span className="mx-2 text-slate-300">•</span>
                )}

                {tenantSlug && (
                  <>
                    <span className="truncate">
                      tenant: <span className="font-medium">{tenantSlug}</span>
                    </span>
                    {userRole && <span className="mx-2 text-slate-300">•</span>}
                  </>
                )}

                {userRole && (
                  <span className="truncate">
                    role: <span className="font-medium">{userRole}</span>
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

      {/* Mobile drawer */}
      <div
        className={[
          "fixed inset-0 z-50 md:hidden transition",
          open ? "visible" : "invisible",
        ].join(" ")}
        aria-hidden={!open}
      >
        {/* Backdrop */}
        <button
          aria-label="Close menu"
          className={[
            "absolute inset-0 bg-black/20 transition-opacity",
            open ? "opacity-100" : "opacity-0",
          ].join(" ")}
          onClick={() => setOpen(false)}
        />

        {/* Panel */}
        <div
          className={[
            "absolute right-0 top-0 h-full w-[84%] max-w-xs bg-white shadow-xl border-l",
            "transition-transform duration-200",
            open ? "translate-x-0" : "translate-x-full",
          ].join(" ")}
        >
          <div className="flex items-center justify-between px-4 py-3 border-b bg-white/95">
            <div className="min-w-0">
              {/* Identity block with role */}
              {(userEmail || tenantSlug || userRole) && (
                <div className="text-[13px] text-slate-700 leading-snug">
                  {userEmail && <div className="font-medium truncate">{userEmail}</div>}
                  {tenantSlug && (
                    <div className="truncate">
                      tenant: <span className="font-medium">{tenantSlug}</span>
                    </div>
                  )}
                  {userRole && (
                    <div className="truncate">
                      role: <span className="font-medium">{userRole}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
            <button
              type="button"
              aria-label="Close menu"
              onClick={() => setOpen(false)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-300 bg-white hover:bg-slate-50"
            >
              <span className="sr-only">Close menu</span>
              {/* X icon */}
              <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M6 6l12 12M18 6l-12 12" fill="none" stroke="currentColor" strokeWidth="2" />
              </svg>
            </button>
          </div>

          <div className="px-2 py-2">
            <ul className="space-y-1">
              {items
                .filter((it) => !mounted || !isMobile || MOBILE_PRIMARY.has(it.label))
                .map((it) => {
                  const active = pathname === it.href;
                  return (
                    <li key={it.href}>
                      <NoPrefetchLink
                        href={it.href}
                        onClick={() => setOpen(false)}
                        className={[
                          "block rounded-lg px-3 py-2 text-sm border",
                          active
                            ? "bg-blue-600 text-white border-blue-600"
                            : "bg-white text-slate-800 border-slate-300 hover:bg-slate-50",
                        ].join(" ")}
                      >
                        {it.label}
                      </NoPrefetchLink>
                    </li>
                  );
                })}
            </ul>

            <div className="mt-4 border-t pt-3">
              <button
                onClick={handleSignOut}
                disabled={signingOut}
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-60"
              >
                {signingOut ? "Signing out…" : "Sign out"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
