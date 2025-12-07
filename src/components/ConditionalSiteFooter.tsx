"use client";

import { usePathname } from "next/navigation";
import SiteFooter from "./SiteFooter";

export default function ConditionalSiteFooter() {
  const pathname = usePathname();
  const isAuthPage =
    pathname?.startsWith("/signin") ||
    pathname?.startsWith("/signup") ||
    pathname?.startsWith("/verify");

  // Hide footer on auth pages to prevent height issues
  if (isAuthPage) return null;

  return <SiteFooter />;
}

