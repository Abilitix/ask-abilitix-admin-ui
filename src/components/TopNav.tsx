"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { type UserRole, getVisibleNavItems } from "@/lib/roles";

type Me = {
  ok: boolean;
  email: string | null;
  user?: { email?: string | null };
  tenant?: { slug?: string | null; role?: string | null } | null;
  role?: string | null;
};

type TopNavProps = {
  userEmail?: string;
  tenantSlug?: string;
  userRole?: UserRole;
};

function roleBadge(role: UserRole) {
  const base = "px-1.5 py-0.5 rounded text-xs font-medium";
  switch (role) {
    case "owner":
      return <span className={`${base} bg-green-100 text-green-700`}>Owner</span>;
    case "admin":
      return <span className={`${base} bg-yellow-100 text-yellow-700`}>Admin</span>;
    case "curator":
      return <span className={`${base} bg-blue-100 text-blue-700`}>Curator</span>;
    case "viewer":
      return <span className={`${base} bg-slate-100 text-slate-600`}>Viewer</span>;
    case "guest":
      return <span className={`${base} bg-slate-200 text-slate-500`}>Guest</span>;
    default:
      return <span className={`${base} bg-red-100 text-red-700`}>Unknown</span>;
  }
}

export default function TopNav({ userEmail, tenantSlug, userRole }: TopNavProps) {
  const [open, setOpen] = useState(false);
  const [me, setMe] = useState<Me | null>(null);
  const [inboxEnabled, setInboxEnabled] = useState(false);
  const pathname = usePathname();

  // Fetch identity data
  useEffect(() => {
    let live = true;
    (async () => {
      try {
        const r = await fetch("/api/auth/me", { credentials: "include", cache: "no-store" });
        const j = await r.json().catch(() => ({}));
        if (!live) return;
        
        
        setMe({
          ok: !!(j.ok ?? j.user),
          email: j.email ?? j.user?.email ?? null,
          tenant: j.tenant ?? null,
          role: j.role ?? j.user?.role ?? j.tenant?.role ?? null,
        });
      } catch (err) {
        if (live) setMe(null);
      }
    })();
    return () => { live = false; };
  }, []);

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        const response = await fetch('/api/admin/inbox?limit=1', {
          credentials: 'include',
          cache: 'no-store',
        });

        if (!active) return;

        if (response.status === 404) {
          setInboxEnabled(false);
          return;
        }

        const text = await response.text();
        if (!active) return;

        if (!response.ok) {
          setInboxEnabled(false);
          return;
        }

        let json: any = null;
        if (text) {
          try {
            json = JSON.parse(text);
          } catch {
            setInboxEnabled(false);
            return;
          }
        }

        if (json && typeof json === 'object' && json.error) {
          setInboxEnabled(false);
          return;
        }

        const list = Array.isArray(json?.items)
          ? json.items
          : Array.isArray(json)
            ? json
            : [];

        if (!Array.isArray(list)) {
          setInboxEnabled(false);
          return;
        }

        if (list.length === 0) {
          setInboxEnabled(true);
          return;
        }

        const first = list[0];
        const looksNew =
          first &&
          typeof first === 'object' &&
          ('dup_count' in first || 'q_hash' in first || 'asked_at' in first || 'tags' in first);

        setInboxEnabled(Boolean(looksNew));
      } catch {
        if (active) {
          setInboxEnabled(false);
        }
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  // Use fetched identity or fallback to props
  const identity = me?.email || me?.tenant?.slug || me?.role || userEmail || tenantSlug || userRole;
  const effectiveRole = (me?.role as UserRole) || userRole;
  const effectiveEmail = me?.email || userEmail;
  
  
  // Use role-based navigation filtering
  const navItems = effectiveRole ? getVisibleNavItems(effectiveRole, false, effectiveEmail) : [];
  const filteredNavItems = navItems.filter((it) =>
    it.href === '/admin/inbox' ? inboxEnabled : true
  );
  const isRoleLoading = !effectiveRole;

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
      <header className="sticky top-0 z-30 w-full bg-gradient-to-r from-blue-600 to-blue-700 shadow-md border-b border-blue-800/20">
        <nav className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex shrink-0 items-center gap-2.5 hover:opacity-90 transition-opacity">
            <Image
              src="/abilitix-logo.png"
              alt="Abilitix"
              width={24}
              height={24}
              className="rounded"
              priority
            />
            <span className="font-semibold tracking-tight text-white">Admin Portal</span>
          </Link>

          <div className="flex items-center gap-3">
            {/* Mobile: show only email */}
            {effectiveEmail && (
              <span className="md:hidden truncate text-xs text-blue-50/90 whitespace-nowrap font-medium">
                {effectiveEmail}
              </span>
            )}

            {/* Desktop: horizontal identity block */}
            {identity && (
              <div className="hidden md:flex items-center gap-2.5 text-xs text-blue-50/90 whitespace-nowrap font-medium">
                {me?.tenant?.slug && <span>Tenant: {me.tenant.slug}</span>}
                {effectiveRole && <span className="text-blue-200/70">•</span>}
                {effectiveRole && (
                  <span className="[&>span]:bg-blue-500/30 [&>span]:text-white [&>span]:border-blue-400/50">
                    {roleBadge(effectiveRole)}
                  </span>
                )}
                {effectiveEmail && <span className="text-blue-200/70">•</span>}
                {effectiveEmail && <span>{effectiveEmail}</span>}
              </div>
            )}

            {/* Always render burger button */}
            <button
              type="button"
              onClick={toggle}
              aria-label="Open menu"
              className="inline-flex items-center justify-center rounded-md border border-blue-400/30 bg-blue-500/20 backdrop-blur-sm px-2.5 py-1.5 text-xs text-white hover:bg-blue-500/30 transition-colors"
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

              {/* Mobile identity block */}
              {identity && (
                <div className="px-4 py-3 text-xs text-slate-600 border-b bg-gradient-to-r from-blue-50 to-white">
                  {me?.tenant?.slug && <div className="font-medium">Tenant: {me.tenant.slug}</div>}
                  {effectiveRole && <div className="mt-1">Role: {roleBadge(effectiveRole)}</div>}
                </div>
              )}

              <nav className="flex-1 overflow-y-auto px-2 py-2 divide-y divide-slate-200 text-slate-900">
                {isRoleLoading && (
                  <div className="space-y-2 px-1 py-2">
                    {[1, 2, 3, 4].map((idx) => (
                      <div
                        key={idx}
                        className="h-10 animate-pulse rounded-xl border border-slate-200 bg-slate-50"
                      />
                    ))}
                  </div>
                )}
                {!isRoleLoading &&
                  filteredNavItems.map((it) => (
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
                      await fetch(`/api/auth/logout`, {
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