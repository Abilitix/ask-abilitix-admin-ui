"use client";

import Image from "next/image";
import Link from "next/link";
import { useTenant } from "./TenantContext";
import NoPrefetchLink from "./NoPrefetchLink";

const cards = [
  {
    href: "/admin/rag",
    title: "RAG Testing",
    desc: "Stream answers; see first token and total time",
  },
  {
    href: "/admin/inbox",
    title: "Inbox",
    desc: "Approve/reject Q&A; copy citations",
  },
  {
    href: "/admin/docs",
    title: "Documents",
    desc: "Upload; archive/unarchive; supersede",
  },
  {
    href: "/admin/settings",
    title: "Settings",
    desc: "Tune DOC_MIN_SCORE and RAG_TOPK",
  },
];

interface DashboardClientProps {
  user: {
    email: string;
    role: string;
  };
}

export default function DashboardClient({ user }: DashboardClientProps) {
  const { tenant, loading } = useTenant();
  const showPilotLink = process.env.NEXT_PUBLIC_SHOW_PILOT_LINK === '1';

  return (
    <div className="space-y-16 md:space-y-20">
      {/* Feature cards */}
      <section className="grid grid-cols-1 gap-8 md:gap-10 lg:gap-12 md:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => (
          <NoPrefetchLink
            key={c.href}
            href={c.href}
            className="group rounded-2xl border border-slate-200 bg-white p-8 md:p-10 shadow-lg transition-all duration-200 hover:shadow-xl hover:border-slate-300 hover:scale-105"
          >
            <div className="mb-4 text-lg font-semibold text-slate-900">{c.title}</div>
            <div className="text-base text-slate-600 leading-relaxed">{c.desc}</div>
          </NoPrefetchLink>
        ))}
      </section>

      {/* Pilot objectives footer link */}
      {showPilotLink && (
        <footer className="mt-8 border-t border-slate-200 pt-6">
          <NoPrefetchLink
            href="/pilot"
            className="inline-flex items-center text-xs text-slate-500 hover:text-slate-700 hover:underline"
          >
            🎯 Pilot objectives
          </NoPrefetchLink>
        </footer>
      )}
    </div>
  );
}
