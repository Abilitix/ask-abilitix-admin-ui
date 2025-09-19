"use client";

import Image from "next/image";
import Link from "next/link";
import { useTenant } from "./TenantContext";

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
      {/* Welcome Banner */}
      <section className="rounded-2xl border border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 p-6 shadow-sm">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h1 className="text-2xl font-semibold leading-tight text-gray-900 mb-2">
              Welcome to Abiliti<span className="text-xs">X</span> 👋
            </h1>
            <p className="text-gray-700">
              This is your pilot workspace. Start by uploading a few docs, then ask a question and approve an answer.
            </p>
          </div>
          <div className="ml-4 text-right text-xs text-gray-500">
            <div>Signed in as {user.email}</div>
            <div className="font-medium">{user.role}</div>
            {tenant && (
              <div className="mt-1 px-2 py-1 rounded bg-white/50 text-gray-600">
                {tenant.type === 'demo' ? 'Demo Mode' : 'Pilot Mode'}
              </div>
            )}
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
