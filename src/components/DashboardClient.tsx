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

  return (
    <div className="space-y-8">
      {/* Feature cards */}
      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => (
          <NoPrefetchLink
            key={c.href}
            href={c.href}
            className="group rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 hover:shadow-md hover:border-slate-300"
          >
            <div className="mb-1 font-medium text-slate-900">{c.title}</div>
            <div className="text-sm text-slate-600">{c.desc}</div>
          </NoPrefetchLink>
        ))}
      </section>
    </div>
  );
}
