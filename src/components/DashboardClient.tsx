"use client";

import Image from "next/image";
import Link from "next/link";
import { useTenant } from "./TenantContext";

const cards = [
  {
    href: "/signup",
    title: "Onboarding",
    desc: "Create a tenant and get a one-time widget key",
  },
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
      {/* Hero */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-4">
          <Image
            src="/abilitix-logo.png"
            alt="AbilitiX"
            width={44}
            height={44}
            className="rounded"
            priority
          />
          <div>
            <h1 className="text-2xl font-semibold leading-tight">
              Welcome to Abiliti<span className="text-sm">X</span> Admin
              {tenant && (
                <span className="ml-2 text-lg font-normal text-slate-600">
                  - {tenant.name}
                </span>
              )}
            </h1>
            <p className="text-sm text-slate-600">
              Manage your AI-powered knowledge base: upload docs, configure settings,
              and monitor performance.
            </p>
            <div className="mt-2 flex items-center gap-4 text-xs text-slate-500">
              <span>Signed in as {user.email} ({user.role})</span>
              {tenant && (
                <span className="px-2 py-1 rounded bg-slate-100">
                  {tenant.type === 'demo' ? 'Demo Mode' : 'Pilot Mode'}
                </span>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Feature cards */}
      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => (
          <Link
            key={c.href}
            href={c.href}
            className="group rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 hover:shadow-md hover:border-slate-300"
          >
            <div className="mb-1 font-medium text-slate-900">{c.title}</div>
            <div className="text-sm text-slate-600">{c.desc}</div>
          </Link>
        ))}
      </section>
    </div>
  );
}
