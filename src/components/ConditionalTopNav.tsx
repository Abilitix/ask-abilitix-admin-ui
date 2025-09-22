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
      userEmail={me?.email}
      tenantSlug={me?.tenant_slug}
      userRole={normalizeRole(me?.role)}
    />
  );
}
