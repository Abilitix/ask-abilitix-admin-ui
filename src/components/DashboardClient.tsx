"use client";

import NoPrefetchLink from "@/components/NoPrefetchLink";

type Card = {
  href: string;
  title: string;
  desc: string;
  key: string; // stable key for conditionals
};

const BASE_CARDS: Card[] = [
  {
    key: "rag-classic",
    href: "/admin/rag",
    title: "RAG Testing (Classic)",
    desc: "Stream answers; see first token and total time",
  },
  {
    key: "inbox",
    href: "/admin/inbox",
    title: "Inbox",
    desc: "Approve/reject Q&A; copy citations",
  },
  {
    key: "docs",
    href: "/admin/docs",
    title: "Documents",
    desc: "Upload; archive/unarchive; supersede",
  },
  {
    key: "settings",
    href: "/admin/settings",
    title: "Settings",
    desc: "Tune DOC_MIN_SCORE and RAG_TOPK",
  },
];

const NEW_RAG_CARD: Card = {
  key: "rag-new",
  href: "/admin/rag-new",
  title: "Test Chat",
  desc: "Streaming answers; inline sources",
};

export default function DashboardClient() {
  const enableNew = process.env.NEXT_PUBLIC_ENABLE_RAG_NEW === "1";
  const hideOld = process.env.NEXT_PUBLIC_HIDE_OLD_RAG === "1";
  const showPilot = process.env.NEXT_PUBLIC_SHOW_PILOT_LINK === "1";

  // Build cards with simple, composable rules:
  // 1) Start with base
  // 2) Add new card first if enabled
  // 3) Optionally remove classic if hideOld is set
  let cards: Card[] = [...BASE_CARDS];
  if (enableNew) {
    cards = [NEW_RAG_CARD, ...cards];
  }
  if (hideOld) {
    cards = cards.filter((c) => c.key !== "rag-classic");
  }

  return (
    <div className="mx-auto max-w-6xl px-4 space-y-10">
      <section className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        {cards.map((c) => (
          <NoPrefetchLink
            key={c.key}
            href={c.href}
            prefetch={false}
            className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:shadow-md"
          >
            <div className="text-base font-semibold text-slate-900">{c.title}</div>
            <div className="mt-2 text-sm leading-relaxed text-slate-600">{c.desc}</div>
          </NoPrefetchLink>
        ))}
      </section>

      {showPilot && (
        <div className="mt-2">
          <NoPrefetchLink
            href="/pilot"
            prefetch={false}
            className="inline-flex items-center gap-2 text-sm text-slate-700 hover:underline"
          >
            <span>🎯</span>
            <span>Pilot objectives</span>
          </NoPrefetchLink>
        </div>
      )}
    </div>
  );
}
