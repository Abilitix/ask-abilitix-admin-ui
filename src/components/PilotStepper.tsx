"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useState, useEffect } from "react";
import type { UserRole } from "@/lib/roles";

// Toggle visibility with env; default ON unless explicitly "0"
const SHOW_STEPPER = process.env.NEXT_PUBLIC_SHOW_PILOT_STEPPER !== "0";

type Step = { key: "docs" | "chat" | "approve" | "faqs" | "settings"; label: string; href: string };

const STEPS: Step[] = [
  { key: "docs",     label: "① Upload Docs",     href: "/admin/docs" },
  { key: "chat",     label: "② AI Assistant",    href: "/admin/ai" },
  { key: "approve",  label: "③ Review Answers",  href: "/admin/inbox" },
  { key: "faqs",     label: "④ Manage FAQs",     href: "/admin/faqs" },
  { key: "settings", label: "⑤ Settings",        href: "/admin/settings" },
];

function getActive(path: string): Step["key"] | null {
  if (path.startsWith("/admin/docs")) return "docs";
  if (path.startsWith("/admin/ai") || path.startsWith("/admin/rag")) return "chat";
  if (path.startsWith("/admin/inbox")) return "approve";
  if (path.startsWith("/admin/faqs")) return "faqs";
  if (path.startsWith("/admin/settings")) return "settings";
  return null;
}

export default function PilotStepper() {
  const pathname = usePathname();
  const [userRole, setUserRole] = useState<UserRole | undefined>();
  const [roleLoaded, setRoleLoaded] = useState(false);
  
  if (!SHOW_STEPPER) return null;

  // Get user role for step filtering
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok && alive) {
          const data = await res.json();
          const role = data?.role;
          if (role === 'owner' || role === 'admin' || role === 'curator' || role === 'viewer' || role === 'guest') {
            setUserRole(role);
          }
        }
      } catch {
        // Ignore errors, role will remain undefined
      } finally {
        if (alive) {
          setRoleLoaded(true);
        }
      }
    })();
    return () => { alive = false; };
  }, []);

  const active = getActive(pathname || "");
  
  // Filter steps based on user role
  const visibleSteps = !roleLoaded
    ? []
    : userRole === 'viewer'
      ? STEPS.filter(step => step.key === 'chat') // Only show Test Chat for viewers
      : userRole === 'curator'
        ? STEPS.filter(step => step.key !== 'settings') // Curators shouldn't see settings step
        : STEPS; // Owners/Admins see all steps

  return (
    <div className="w-full border-b border-slate-200 bg-white/95 backdrop-blur-sm sm:sticky sm:top-[56px] z-20">
      <div className="mx-auto max-w-7xl px-4">
        <nav className="flex items-center gap-2 overflow-x-auto py-2.5 text-xs text-slate-600" aria-label="Pilot steps">
          {!roleLoaded && (
            <div className="flex items-center gap-2">
              {[1, 2, 3].map((key) => (
                <div
                  key={key}
                  className="h-7 w-32 animate-pulse rounded-full border border-slate-200 bg-slate-100"
                />
              ))}
            </div>
          )}
          {visibleSteps.map((s, i) => {
            const isActive = s.key === active;
            return (
              <React.Fragment key={s.key}>
                {i > 0 && <div className="hidden sm:block text-slate-300">›</div>}
                <Link
                  href={s.href}
                  className={[
                    "inline-flex items-center rounded-full border px-3 py-1.5 whitespace-nowrap font-medium transition-colors",
                    isActive
                      ? "border-amber-600 bg-amber-50 text-amber-800 shadow-sm"
                      : "border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300",
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
