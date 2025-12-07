"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

export default function AuthPageBodyOverflow() {
  const pathname = usePathname();
  const isAuthPage =
    pathname?.startsWith("/signin") ||
    pathname?.startsWith("/signup") ||
    pathname?.startsWith("/verify");

  useEffect(() => {
    if (isAuthPage) {
      // Prevent body scrolling on auth pages
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";
    } else {
      // Restore normal scrolling on other pages
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    }

    // Cleanup on unmount
    return () => {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    };
  }, [isAuthPage]);

  return null;
}

