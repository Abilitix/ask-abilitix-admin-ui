"use client";

import NoPrefetchLink from "@/components/NoPrefetchLink";

type Card = {
  href: string;
  title: string;
  desc: string;
};

interface DashboardClientProps {
  user?: {
    email: string;
    role: string;
  };
}

function Tile({ href, title, desc }: Card) {
  return (
    <NoPrefetchLink
      href={href}
      className="group rounded-2xl border border-slate-200 bg-white p-8 md:p-10 shadow-lg transition-all duration-200 hover:shadow-xl hover:border-slate-300 hover:scale-105"
    >
      <div className="mb-4 text-lg font-semibold text-slate-900">{title}</div>
      <div className="text-base text-slate-600 leading-relaxed">{desc}</div>
    </NoPrefetchLink>
  );
}

export default function DashboardClient({ user }: DashboardClientProps) {
  // keep prop for compatibility (avoid “unused var” complaints)
  void user;

  const showPilotLink = process.env.NEXT_PUBLIC_SHOW_PILOT_LINK === "1";
  const enableRagNew = process.env.NEXT_PUBLIC_ENABLE_RAG_NEW !== "0"; // default ON

  const cards: Card[] = [
    ...(enableRagNew
      ? [
          {
            href: "/admin/rag-new",
            title: "RAG Testing (New)",
            desc: "Denser-style chat; streaming; inline sources",
          } as Card,
        ]
      : []),
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

  return (
    <div className="mx-auto max-w-6xl px-4">
      {/* Responsive grid wrapper */}
      <section className="grid grid-cols-1 gap-8 md:gap-10 lg:gap-12 md:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => (
          <Tile key={c.href} {...c} />
        ))}
      </section>

      {/* Pilot objectives footer link (flagged) */}
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
