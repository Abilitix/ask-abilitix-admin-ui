"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

function buildNavItems() {
  const enableNew = process.env.NEXT_PUBLIC_ENABLE_RAG_NEW === "1";
  const showPilot = process.env.NEXT_PUBLIC_SHOW_PILOT_LINK === "1";

  const base = [
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

type UserRole = "owner" | "admin" | "curator" | "viewer" | "guest" | undefined;

type TopNavProps = {
  userEmail?: string;
  tenantSlug?: string;
  userRole?: UserRole;
};

export default function TopNav({ userEmail, tenantSlug, userRole }: TopNavProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const items = buildNavItems();
  const drawerId = "site-drawer";

  const isActive = (href: string) =>
    pathname === href || (pathname && pathname.startsWith(href + "/"));

  const toggle = () => setOpen((v) => !v);
  const close = () => setOpen(false);

  return (
    <>
      {/* Header bar (no stretch risk) */}
      <header className="sticky top-0 z-30 w-full border-b bg-white">
        <nav className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          {/* Left: brand */}
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

          {/* Right: identity (desktop) + menu button */}
          <div className="flex items-center gap-3">
            {(userEmail || tenantSlug || userRole) && (
              <div className="hidden md:flex items-center text-xs text-slate-600 whitespace-nowrap">
                {userEmail && <span className="truncate">{userEmail}</span>}
                {(userEmail && tenantSlug) || (userEmail && userRole) ? (
                  <span className="mx-2 text-slate-300">•</span>
                ) : null}
                {tenantSlug && (
                  <span className="truncate">
                    tenant: <span className="font-medium">{tenantSlug}</span>
                  </span>
                )}
                {tenantSlug && userRole ? (
                  <span className="mx-2 text-slate-300">•</span>
                ) : null}
                {userRole && <span className="truncate">role: {userRole}</span>}
              </div>
            )}

            <button
              type="button"
              onClick={toggle}
              aria-label="Open menu"
              aria-controls={drawerId}
              aria-expanded={open}
              className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50"
            >
              {/* Minimal, self-contained hamburger – does not affect layout */}
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
              <span>Menu</span>
            </button>
          </div>
        </nav>
      </header>

      {/* Overlay (separate layer; no sizing impact on drawer) */}
      {open && (
        <div
          className="fixed inset-0 z-[60] bg-black/40"
          onClick={close}
          aria-hidden="true"
        />
      )}

      {/* Drawer – explicit fixed box on the RIGHT; never stretches */}
      <aside
        id={drawerId}
        role="dialog"
        aria-label="Navigation menu"
        className={[
          // explicit pin right, explicit height; no 'inset-*', no 'w-full'
          "fixed top-0 right-0 z-[70]",
          // hard width with box sizing; capped on very small viewports
          "w-[320px] max-w-[85vw] h-[100dvh] box-border bg-white shadow-2xl",
          // smooth slide
          "transform-gpu transition-transform duration-200 ease-out will-change-transform",
          open ? "translate-x-0" : "translate-x-full",
          // ensure it can receive clicks even if parent has pointer rules
          "pointer-events-auto",
        ].join(" ")}
        style={{ left: "auto" }} // guard against any global left:0
      >
        <div className="flex h-full flex-col">
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

          {/* Identity block */}
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
        </div>
      </aside>
    </>
  );
}
