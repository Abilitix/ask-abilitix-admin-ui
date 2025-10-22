"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import TopNav from "@/components/TopNav";
import type { UserRole } from "@/lib/roles";

type Me = {
  ok: boolean;
  email: string | null;
  user: { id?: string; email: string | null };
  tenant?: { id?: string; slug?: string; role?: string } | null;
  tenants?: Array<any>;
  role?: string | null;
};

function normalizeRole(r?: string | null): UserRole | undefined {
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

  const [me, setMe] = useState<Me | null>(null);

  useEffect(() => {
    if (isPublic) return;
    let alive = true;
    (async () => {
      try {
        const res = await fetch("/api/auth/me");
        const data = res.ok ? await res.json() : null;
        if (alive) setMe(data);
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
      userEmail={me?.email || undefined}
      tenantSlug={me?.tenant?.slug}
      userRole={normalizeRole(me?.role)}
    />
  );
}
