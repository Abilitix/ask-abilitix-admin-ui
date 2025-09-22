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
      <header className="sticky top-0 z-30 w-full border-b bg-white">
        <nav className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
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

            <button
              type="button"
              onClick={toggle}
              aria-label="Open menu"
              className="inline-flex items-center justify-center rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-700 hover:bg-slate-50"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                className="h-4 w-4"
                fill="currentColor"
              >
                <circle cx="12" cy="5" r="1.5" />
                <circle cx="12" cy="12" r="1.5" />
                <circle cx="12" cy="19" r="1.5" />
              </svg>
            </button>
          </div>
        </nav>
      </header>

      {open && (
        <div
          className="fixed inset-0 z-[70]"
          onKeyDown={onKeyDown}
          role="presentation"
        >
          <div
            className="absolute inset-0 bg-black/45 backdrop-blur-[2px]"
            onClick={close}
            aria-hidden="true"
          />

          <div className="absolute inset-0 flex justify-end pointer-events-none">
            <aside
              className={[
                "h-full bg-white shadow-2xl",
                "transform-gpu transition-transform duration-200 ease-out will-change-transform",
                "pointer-events-auto",
                open ? "translate-x-0" : "translate-x-full",
              ].join(" ")}
              style={{ width: 320, maxWidth: "85vw", boxSizing: "border-box" }}
              role="dialog"
              aria-modal="true"
              aria-label="Navigation menu"
            >
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

              <nav className="flex-1 overflow-y-auto px-2 py-2 divide-y divide-slate-200 text-slate-900">
                {items.map((it) => (
                  <Link
                    key={it.href}
                    href={it.href}
                    onClick={close}
                    aria-current={isActive(it.href) ? "page" : undefined}
                    className={[
                      "block break-words px-3 py-3 text-[15px] hover:bg-slate-50 focus:bg-slate-50 focus:outline-none",
                      isActive(it.href)
                        ? "bg-slate-50 font-medium border-l-2 border-slate-300"
                        : "bg-white",
                    ].join(" ")}
                  >
                    {it.label}
                  </Link>
                ))}
              </nav>

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