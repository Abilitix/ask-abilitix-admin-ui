"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import TopNav from "@/components/TopNav";
import type { UserRole } from "@/lib/roles";

type MeResponse = {
  email?: string;
  tenant_slug?: string;
  role?: UserRole;
  // tenant_name?: string; // intentionally unused by TopNav
};

export default function ConditionalTopNav() {
  const pathname = usePathname();
  const [user, setUser] = useState<MeResponse | null>(null);

  // Kill-switch: suspend client auth if needed
  const SUSPEND_CLIENT_AUTH = process.env.NEXT_PUBLIC_SUSPEND_CLIENT_AUTH === "1";

  // Public pages: do not render TopNav or fetch user
  const AUTH_ROUTES = ["/signin", "/signup", "/verify", "/verify/workspace-picker"];
  const isPublic = AUTH_ROUTES.some(
    (r) => pathname === r || (pathname && pathname.startsWith(r + "/"))
  );

  useEffect(() => {
    if (SUSPEND_CLIENT_AUTH || isPublic) return;

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/auth/me", { credentials: "include" });
        if (!res.ok) {
          if (!cancelled) setUser(null);
          return;
        }
        const data: MeResponse = await res.json();
        if (!cancelled) setUser(data);
      } catch {
        if (!cancelled) setUser(null);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [SUSPEND_CLIENT_AUTH, isPublic]);

  if (SUSPEND_CLIENT_AUTH || isPublic) {
    return null;
  }

  return (
    <TopNav
      userEmail={user?.email}
      tenantSlug={user?.tenant_slug}
      userRole={user?.role}
    />
  );
}
