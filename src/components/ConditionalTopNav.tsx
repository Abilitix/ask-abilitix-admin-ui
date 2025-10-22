"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import TopNav from "@/components/TopNav";
import type { UserRole } from "@/lib/roles";

type UserMe = {
  email?: string;
  tenant_name?: string;
  tenant_slug?: string;
  role?: string; // API may return roles outside our union
};

function normalizeRole(r?: string): UserRole | undefined {
  switch (r) {
    case "owner":
    case "admin":
    case "curator":
    case "viewer":
    case "guest":
      return r;
    default:
      return undefined; // hide unknown roles (e.g., "editor")
  }
}

export default function ConditionalTopNav() {
  const pathname = usePathname();
  const isPublic =
    pathname?.startsWith("/signin") ||
    pathname?.startsWith("/signup") ||
    pathname?.startsWith("/verify");

  const [me, setMe] = useState<UserMe | null>(null);

  useEffect(() => {
    if (isPublic) return;
    let alive = true;
    (async () => {
      try {
        const res = await fetch("/api/auth/me");
        const raw = res.ok ? await res.json() : null;
        // Normalize possible shapes from the API
        const normalized: UserMe | null = raw
          ? {
              email: raw.email || raw.user?.email || undefined,
              tenant_name: raw.tenant_name || raw.tenant?.name || undefined,
              tenant_slug: raw.tenant_slug || raw.tenant?.slug || raw.tenant_id || undefined,
              role: raw.role || raw.user?.role || undefined,
            }
          : null;
        if (alive) setMe(normalized);
      } catch {
        if (alive) setMe(null);
      }
    })();
    return () => {
      alive = false;
    };
  }, [isPublic]);

  if (isPublic) return null;

  return (
    <TopNav
      userEmail={me?.email}
      tenantSlug={me?.tenant_slug}
      userRole={normalizeRole(me?.role)}
    />
  );
}
