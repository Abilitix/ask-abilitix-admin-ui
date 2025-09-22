"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { type UserRole } from "@/lib/roles";

type NavItem = { label: string; href: string };

function buildNavItems(): NavItem[] {
  const enableNew = process.env.NEXT_PUBLIC_ENABLE_RAG_NEW === "1";
  const showPilot = process.env.NEXT_PUBLIC_SHOW_PILOT_LINK === "1";

  const base: NavItem[] = [
    enableNew
      ? { label: "Test Chat", href: "/admin/rag-new" }
      : { label: "RAG Testing", href: "/admin/rag" },
    { label: "Inbox", href: "/admin/inbox" },
    { label: "Docs", href: "/admin/docs" },
    { label: "Settings", href: "/admin/settings" },
  ];

  if (showPilot) base.push({ label: "Pilot", href: "/pilot" });

  // Dashboard always first option in the drawer:
  return [{ label: "Dashboard", href: "/" }, ...base];
}

type TopNavProps = {
  userEmail?: string;
  tenantSlug?: string;
  userRole?: UserRole;
};

export default function TopNav({ userEmail, tenantSlug, userRole }: TopNavProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const items = buildNavItems();

  const isActive = (href: string) =>
    pathname === href || (pathname && pathname.startsWith(href + "/"));

  const toggle = useCallback(() => setOpen((v) => !v), []);
  const close = useCallback(() => setOpen(false), []);

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === "Escape") close();
    },
    [close]
  );

  return (
    <>
      {/* Header bar */}
      <header className="sticky top-0 z-30 w-full border-b bg-white">
        <nav className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          {/* Left: brand */}
          <Link href="/" className="flex shrink-0 items-center gap-2">
            <Image
              src="/abilitix-logo.png"
              alt="Abilitix"
              width={24}
              height={24}
              className="rounded"
              priority
            />
            <span className="font-semibold tracking-tight">Admin Portal</span>
          </Link>

          {/* Right: identity (desktop) + menu button */}
          <div className="flex items-center gap-3">
            {(userEmail || tenantSlug || userRole) && (
              <div className="hidden md:flex items-center text-xs text-slate-600 whitespace-nowrap">
                {userEmail && <span className="truncate">{userEmail}</span>}
                {userEmail && (tenantSlug || userRole) && (
                  <span className="mx-2 text-slate-300">•</span>
                )}
                {tenantSlug && (
                  <span className="truncate">
                    tenant: <span className="font-medium">{tenantSlug}</span>
                  </span>
                )}
                {tenantSlug && userRole && (
                  <span className="mx-2 text-slate-300">•</span>
                )}
                {userRole && <span className="truncate">role: {userRole}</span>}
              </div>
            )}

            {/* Menu (hamburger) */}
            <button
              type="button"
              onClick={toggle}
              aria-label="Open menu"
              className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50"
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
              >
                <path d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              <span>Menu</span>
            </button>
          </div>
        </nav>
      </header>

      {/* Drawer + overlay (only rendered when open) */}
      {open && (
        <div
          className="fixed inset-0 z-[70]"
          onKeyDown={onKeyDown}
          role="presentation"
        >
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-black/45 backdrop-blur-[2px]"
            onClick={close}
            aria-hidden="true"
          />

          {/* Right-anchored wrapper ensures the panel never stretches */}
          <div className="absolute inset-0 flex justify-end pointer-events-none">
            <aside
              className={[
                "h-full bg-white shadow-2xl",
                "transform-gpu transition-transform duration-200 ease-out will-change-transform",
                "pointer-events-auto",
                open ? "translate-x-0" : "translate-x-full",
              ].join(" ")}
              // Inline width beats any global width:100% rules
              style={{ width: 320, maxWidth: "85vw", boxSizing: "border-box" }}
              role="dialog"
              aria-modal="true"
              aria-label="Navigation menu"
            >
              {/* Drawer header */}
              <div className="flex items-center justify-between border-b px-4 py-3">
                <div className="font-medium">Menu</div>
                <button
                  type="button"
                  onClick={close}
                  aria-label="Close menu"
                  className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs text-slate-700 hover:bg-slate-50"
                >
                  ✕
                </button>
              </div>

              {/* Identity (mobile/inside drawer) */}
              {(userEmail || tenantSlug || userRole) && (
                <div className="border-b px-4 py-3 text-sm text-slate-700">
                  {userEmail && <div className="truncate">{userEmail}</div>}
                  {tenantSlug && (
                    <div className="truncate">
                      tenant: <span className="font-medium">{tenantSlug}</span>
                    </div>
                  )}
                  {userRole && (
                    <div className="mt-1 text-xs text-slate-500">
                      role: {userRole}
                    </div>
                  )}
                </div>
              )}

              {/* Nav items */}
              <nav className="flex-1 overflow-y-auto px-2 py-2">
                {items.map((it) => (
                  <Link
                    key={it.href}
                    href={it.href}
                    onClick={close}
                    aria-current={isActive(it.href) ? "page" : undefined}
                    className={[
                      "block break-words rounded-md px-3 py-2 text-slate-800 hover:bg-slate-100",
                      isActive(it.href)
                        ? "bg-slate-50 font-medium border-l-2 border-slate-300"
                        : "",
                    ].join(" ")}
                  >
                    {it.label}
                  </Link>
                ))}
              </nav>

              {/* Sign out */}
              <div className="border-t px-2 py-3">
                <button
                  onClick={async () => {
                    try {
                      const api = process.env.NEXT_PUBLIC_ADMIN_API!;
                      await fetch(`${api}/auth/logout`, {
                        method: "POST",
                        credentials: "include",
                        headers: { "Content-Type": "application/json" },
                      });
                    } catch {
                      /* ignore */
                    } finally {
                      window.location.assign("/signin");
                    }
                  }}
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-left text-slate-700 hover:bg-slate-50"
                >
                  Sign out
                </button>
              </div>
            </aside>
          </div>
        </div>
      )}
    </>
  );
}
