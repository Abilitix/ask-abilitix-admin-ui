"use client";

import { usePathname } from "next/navigation";
import TopNav from "@/components/TopNav";

export default function ConditionalTopNav() {
  const pathname = usePathname();
  const isPublic =
    pathname?.startsWith("/signin") ||
    pathname?.startsWith("/signup") ||
    pathname?.startsWith("/verify");

  if (isPublic) return null;

  // Always render TopNav - let it handle identity fetching and display
  return <TopNav />;
}
