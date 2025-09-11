"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

const nav = [
  { href: "/", label: "Dashboard" },
  { href: "/admin/inbox", label: "Inbox" },
  { href: "/admin/docs", label: "Docs" },
  { href: "/admin/settings", label: "Settings" },
  { href: "/signup", label: "Onboarding" },
  { href: "/admin/rag", label: "Debug" },
];

export default function TopNav() {
  const pathname = usePathname();
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-white/80 backdrop-blur">
      <nav className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/abilitix-logo.png"
            alt="AbilitiX"
            width={28}
            height={28}
            priority
            className="rounded"
          />
          <span className="font-semibold tracking-tight">AbilitiX Admin</span>
        </Link>
        <ul className="flex items-center gap-3 text-sm text-slate-700">
          {nav.map((item) => {
            const active = pathname === item.href;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`px-2 py-1 rounded-md hover:bg-slate-100 ${
                    active ? "bg-slate-200 font-medium" : ""
                  }`}
                  aria-current={active ? "page" : undefined}
                >
                  {item.label}
                </Link>
              </li>
            );
          })}
          <li className="ml-2 pl-3 border-l text-xs text-slate-500" id="tenantBadge">
            Tenant: {process.env.NEXT_PUBLIC_TENANT_SLUG || 'loading...'}
          </li>
        </ul>
      </nav>
    </header>
  );
}
