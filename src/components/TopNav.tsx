"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import type { UserRole } from "@/lib/roles";

type TopNavProps = {
  userEmail?: string;
  tenantSlug?: string;
  userRole?: UserRole | undefined;
};

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

  return [{ label: "Dashboard", href: "/" }, ...base];
}

export default function TopNav({
  userEmail,
  tenantSlug,
  userRole,
}: TopNavProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const items = buildNavItems();

  const isActive = (href: string) =>
    pathname === href || (pathname && pathname.startsWith(href + "/"));

  const toggle = () => setOpen((v) => !v);
  const close = () => setOpen(false);

  return (
    <>
      {/* Header bar */}
      <header className="sticky top-0 z-30 w-full border-b bg-white">
        <nav className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          {/* Left: brand */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            {/* If you have /public/abilitix-logo.png this will render; otherwise it’s fine to keep just text */}
            <Image
              src="/abilitix-logo.png"
              alt="Abilitix"
              width={20}
              height={20}
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
                {(userEmail && (tenantSlug || userRole)) && (
                  <span className="mx-2 text-slate-300">•</span>
                )}
                {tenantSlug && (
                  <span className="truncate">
                    tenant: <span className="font-medium">{tenantSlug}</span>
                  </span>
                )}
                {userRole && (
                  <>
                    <span className="mx-2 text-slate-300">•</span>
                    <span className="truncate">role: {userRole}</span>
                  </>
                )}
              </div>
            )}

            {/* Minimal-safe: icon inside the button (fixed size); no drawer CSS touched */}
            <button
              type="button"
              onClick={toggle}
              aria-label="Open menu"
              aria-expanded={open ? "true" : "false"}
              aria-controls="main-drawer"
              className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
            >
              {/* Hamburger icon (SVG) – fixed size, won’t affect layout */}
              <svg
                aria-hidden="true"
                className="flex-none w-4 h-4"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <rect x="2" y="4" width="16" height="2" rx="1" />
                <rect x="2" y="9" width="16" height="2" rx="1" />
                <rect x="2" y="14" width="16" height="2" rx="1" />
              </svg>
              <span>Menu</span>
            </button>
          </div>
        </nav>
      </header>

      {/* Overlay (no layout changes) */}
      {open && (
        <div
          className="fixed inset-0 z-[60] bg-black/40"
          onClick={close}
          aria-hidden="true"
        />
      )}

      {/* Drawer panel (RIGHT-side). Sizing/positioning unchanged -> no stretch regression */}
      <aside
        id="main-drawer"
        className={[
          "fixed inset-y-0 right-0 z-[70]",
          "w-[320px] max-w-[85vw] bg-white shadow-2xl",
          "transform-gpu transition-transform duration-200 ease-out will-change-transform",
          open ? "translate-x-0" : "translate-x-full",
        ].join(" ")}
        role="dialog"
        aria-label="Navigation menu"
      >
        <div className="flex h-full flex-col">
          {/* Drawer header */}
          <div className="flex items-center justify-between border-b px-4 py-3">
            <div className="font-medium text-slate-900">Menu</div>
            <button
              type="button"
              onClick={close}
              aria-label="Close menu"
              className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs text-slate-700 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
            >
              ✕
            </button>
          </div>

          {/* Identity block (mobile) */}
          {(userEmail || tenantSlug || userRole) && (
            <div className="border-b px-4 py-3 text-sm text-slate-700">
              {userEmail && <div className="truncate">{userEmail}</div>}
              {tenantSlug && (
                <div className="truncate">
                  tenant: <span className="font-medium">{tenantSlug}</span>
                </div>
              )}
              {userRole && (
                <div className="mt-1 text-xs text-slate-500">role: {userRole}</div>
              )}
            </div>
          )}

          {/* Nav items (slightly larger padding + active state) */}
          <nav className="flex-1 overflow-y-auto px-2 py-2">
            {items.map((it) => {
              const active = isActive(it.href);
              return (
                <Link
                  key={it.href}
                  href={it.href}
                  onClick={close}
                  aria-current={active ? "page" : undefined}
                  className={[
                    "block rounded-md px-3 py-2.5 text-[13px] text-slate-800 hover:bg-slate-100 break-words",
                    active ? "bg-slate-50 font-medium border-l-2 border-slate-300" : "",
                    "focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-300",
                  ].join(" ")}
                >
                  {it.label}
                </Link>
              );
            })}
          </nav>

          {/* Sign out */}
          <div className="px-2 py-3 border-t">
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
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-left text-slate-700 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
            >
              Sign out
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
