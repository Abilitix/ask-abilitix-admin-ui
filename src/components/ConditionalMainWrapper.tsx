"use client";

import { usePathname } from "next/navigation";

export default function ConditionalMainWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage =
    pathname?.startsWith("/signin") ||
    pathname?.startsWith("/signup") ||
    pathname?.startsWith("/verify");

  // For auth pages, remove padding to prevent scrolling
  // For other pages, keep the standard padding
  return (
    <main className={isAuthPage ? "mx-auto max-w-6xl" : "mx-auto max-w-6xl px-4 py-8 sm:pt-16"}>
      {children}
    </main>
  );
}

