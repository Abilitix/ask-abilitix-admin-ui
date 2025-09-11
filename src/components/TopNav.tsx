"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
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
    <header className="sticky top-0 z-40 border-b bg-white/90 backdrop-blur">
      <nav className="mx-auto flex h-14 max-w-6xl items-center gap-6 px-4">
        <Link href="/" className="font-semibold tracking-tight">Abilitix Admin</Link>
        <ul className="flex gap-3 text-sm text-slate-700">
          {items.map(it => {
            const active = pathname === it.href;
            return (
              <li key={it.href}>
                <Link
                  href={it.href}
                  className={`px-2 py-1 rounded-md hover:bg-slate-100 ${active ? "bg-slate-200 font-medium" : ""}`}
                >
                  {it.label}
                </Link>
              </li>
            );
          })}
        </ul>
        <div className="ml-auto text-xs text-slate-500">
          {process.env.NEXT_PUBLIC_TW_CDN === "1" ? "Demo style (CDN)" : "Build style"}
        </div>
      </nav>
    </header>
  );
}
