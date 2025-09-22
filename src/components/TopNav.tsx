"use client";

import { useCallback, useEffect, useState } from "react";
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

  const toggle = () => setOpen((v) => !v);
  const close = useCallback(() => setOpen(false), []);

  // Lock background scroll
  useEffect(() => {
    const prev = document.body.style.overflow;
    if (open) document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, close]);

  const DRAWER_WIDTH = 320; // hard clamp to prevent full-width

  return (
    <>
      {/* Header */}
      <header className="sticky top-0 z-30 w-full border-b bg-white">
        <nav className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          {/* Brand */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
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

          {/* Identity (desktop) + Menu button */}
          <div className="flex items-center gap-3">
            {(userEmail || tenantSlug || userRole) && (
              <div className="hidden md:flex items-center text-xs text-slate-600 whitespace-nowrap">
                {userEmail && <span className="truncate">{userEmail}</span>}
                {(userEmail && tenantSlug) || (userEmail && userRole) ? (
                  <span className="mx-2 text-slate-300">•</span>
                ) : null}
                {tenantSlug && (
                  <>
                    <span className="truncate">
                      tenant: <span className="font-medium">{tenantSlug}</span>
                    </span>
                    {userRole && <span className="mx-2 text-slate-300">•</span>}
                  </>
                )}
                {userRole && <span className="truncate">role: {userRole}</span>}
              </div>
            )}

            <button
              type="button"
              onClick={toggle}
              aria-haspopup="dialog"
              aria-expanded={open}
              aria-controls="app-drawer"
              className="inline-flex items-center rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50"
            >
              Menu
            </button>
          </div>
        </nav>
      </header>

      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-[1px]"
          onClick={close}
          aria-hidden="true"
        />
      )}

      {/* Right drawer (width hard-clamped inline) */}
      <aside
        id="app-drawer"
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
        className={[
          "fixed top-0 right-0 z-[70]",
          "h-[100dvh] box-border bg-white shadow-2xl",
          "will-change-transform transform-gpu transition-transform duration-200 ease-out",
          open ? "translate-x-0" : "translate-x-full",
        ].join(" ")}
        style={{
          width: DRAWER_WIDTH,
          maxWidth: "88vw",
          left: "auto",   // ensure no left:0 bleed from any global CSS
          right: 0,
        }}
      >
        <div className="flex flex-col h-full">
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

          {/* Identity (mobile) */}
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

          {/* Nav items */}
          <nav className="flex-1 overflow-y-auto px-2 py-2">
            {items.map((it) => (
              <Link
                key={it.href}
                href={it.href}
                onClick={close}
                aria-current={isActive(it.href) ? "page" : undefined}
                className={[
                  "block rounded-md px-3 py-2 text-slate-800 hover:bg-slate-100 break-words",
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
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-left text-slate-700 hover:bg-slate-50"
            >
              Sign out
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
