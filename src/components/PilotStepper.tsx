"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";

// Toggle visibility with env; default ON unless explicitly "0"
const SHOW_STEPPER = process.env.NEXT_PUBLIC_SHOW_PILOT_STEPPER !== "0";
const USE_RAG_NEW  = process.env.NEXT_PUBLIC_ENABLE_RAG_NEW !== "0";

type Step = { key: "docs" | "chat" | "approve" | "settings"; label: string; href: string };

const STEPS: Step[] = [
  { key: "docs",     label: "① Upload Docs",     href: "/admin/docs" },
  { key: "chat",     label: "② Test Chat",       href: USE_RAG_NEW ? "/admin/rag-new" : "/admin/rag" },
  { key: "approve",  label: "③ Approve/Reject",  href: "/admin/inbox" },
  { key: "settings", label: "④ Settings",        href: "/admin/settings" },
];

function getActive(path: string): Step["key"] | null {
  if (path.startsWith("/admin/docs")) return "docs";
  if (path.startsWith("/admin/rag-new") || path.startsWith("/admin/rag")) return "chat";
  if (path.startsWith("/admin/inbox")) return "approve";
  if (path.startsWith("/admin/settings")) return "settings";
  return null;
}

export default function PilotStepper() {
  const pathname = usePathname();
  if (!SHOW_STEPPER) return null;

  const active = getActive(pathname || "");

  return (
    <div className="w-full border-b bg-white/80 backdrop-blur">
      <div className="mx-auto max-w-6xl px-4">
        <nav className="flex items-center gap-2 overflow-x-auto py-2 text-xs text-slate-600" aria-label="Pilot steps">
          {STEPS.map((s, i) => {
            const isActive = s.key === active;
            return (
              <React.Fragment key={s.key}>
                {i > 0 && <div className="hidden sm:block text-slate-300">›</div>}
                <Link
                  href={s.href}
                  className={[
                    "inline-flex items-center rounded-full border px-3 py-1 whitespace-nowrap",
                    isActive
                      ? "border-blue-600 bg-blue-50 text-blue-700"
                      : "border-slate-200 bg-white hover:bg-slate-50",
                  ].join(" ")}
                  aria-current={isActive ? "step" : undefined}
                >
                  {s.label}
                </Link>
              </React.Fragment>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
