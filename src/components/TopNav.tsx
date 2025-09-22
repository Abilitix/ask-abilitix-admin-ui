"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import type { UserRole } from "@/lib/roles";

type TopNavProps = {
  userEmail?: string;
  tenantSlug?: string;
  userRole?: UserRole;
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

  // Dashboard always first in drawer
  return [{ label: "Dashboard", href: "/" }, ...base];
}

export default function TopNav({
  userEmail,
  tenantSlug,
  userRole,
}: TopNavProps) {
  const [open, setOpen] = useState(false);
  const items = buildNavItems();

  const toggle = () => setOpen((v) => !v);
  const close = () => setOpen(false);

  return (
    <>
      {/* Header bar */}
      <header className="sticky top-0 z-30 w-full border-b bg-white">
        <nav className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          {/* Left: brand with logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <Image
              src="/abilitix-logo.png"
              alt="AbilitiX"
              width={28}
              height={28}
              priority
              className="rounded"
            />
            <span className="font-semibold tracking-tight">Admin Portal</span>
          </Link>

          {/* Right: identity (desktop) + menu button */}
          <div className="flex items-center gap-3">
            {(userEmail || tenantSlug) && (
              <div className="hidden md:flex items-center text-xs text-slate-600 whitespace-nowrap">
                {userEmail && <span className="truncate">{userEmail}</span>}
                {userEmail && tenantSlug && (
                  <span className="mx-2 text-slate-300">•</span>
                )}
                {tenantSlug && (
                  <span className="truncate">
                    tenant: <span className="font-medium">{tenantSlug}</span>
                  </span>
                )}
              </div>
            )}

            <button
              type="button"
              onClick={toggle}
              aria-label="Open menu"
              className="inline-flex items-center rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50"
            >
              Menu
            </button>
          </div>
        </nav>
      </header>

      {/* Dim overlay (prevents overlapping readability issues) */}
      {open && (
        <button
          aria-label="Close menu overlay"
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          onClick={close}
        />
      )}

      {/* Right-side drawer */}
      <aside
        className={[
          "fixed top-0 right-0 z-50 h-full w-80 max-w-[85vw] bg-white shadow-xl transition-transform duration-300",
          "flex flex-col", // layout
          open ? "translate-x-0" : "translate-x-full",
        ].join(" ")}
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

        {/* Identity block (shown in drawer; includes role) */}
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

        {/* Scrollable nav list */}
        <nav className="px-2 py-2 overflow-y-auto max-h-[calc(100%-9rem)]">
          {items.map((it) => (
            <Link
              key={it.href}
              href={it.href}
              onClick={close}
              className="block rounded-md px-3 py-2 text-slate-800 hover:bg-slate-100"
            >
              {it.label}
            </Link>
          ))}

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
            className="mt-2 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-left text-slate-700 hover:bg-slate-50"
          >
            Sign out
          </button>
        </nav>
      </aside>
    </>
  );
}
