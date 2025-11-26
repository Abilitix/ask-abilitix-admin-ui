"use client";

import NoPrefetchLink from "@/components/NoPrefetchLink";
import type { User } from "@/lib/auth"; // Adjust path if needed
import { hasPermission } from "@/lib/roles";

type DashboardClientProps = {
  user: User;
};

type Card = {
  href: string;
  title: string;
  desc: string;
  key: string;
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
    title: "Review Answers",
    desc: "Create, review, and approve FAQs; attach citations",
  },
  {
    key: "docs",
    href: "/admin/docs",
    title: "Upload Documents",
    desc: "Upload documents; generate FAQs; archive/unarchive; supersede",
  },
  {
    key: "faqs",
    href: "/admin/faqs",
    title: "FAQ Management",
    desc: "Manage FAQ lifecycle; archive, unarchive, supersede",
  },
  {
    key: "settings",
    href: "/admin/settings",
    title: "Settings",
    desc: "Manage team members, tenant defaults, and website widget",
  },
];

const AI_CARD: Card = {
  key: "ai",
  href: "/admin/ai",
  title: "AI Assistant",
  desc: "Chat with intelligent responses and citations",
};

export default function DashboardClient({ user }: DashboardClientProps) {
  const hideOld = process.env.NEXT_PUBLIC_HIDE_OLD_RAG === "1";
  const showPilot = process.env.NEXT_PUBLIC_SHOW_PILOT_LINK === "1";

  let cards: Card[] = [AI_CARD, ...BASE_CARDS];
  
  if (hideOld) {
    cards = cards.filter((c) => c.key !== "rag-classic");
  }

  // Filter cards based on user role (safety measure)
  if (user.role) {
    cards = cards.filter((card) => {
      switch (card.key) {
        case "rag-classic":
        case "ai":
          return hasPermission(user.role, "canAccessDebug");
        case "inbox":
          return hasPermission(user.role, "canAccessInbox");
        case "docs":
          return hasPermission(user.role, "canAccessDocs");
        case "faqs":
          return hasPermission(user.role, "canAccessFAQs");
        case "settings":
          return hasPermission(user.role, "canAccessSettings");
        default:
          return true;
      }
    });
  }

  const hasCards = cards.length > 0;
  const viewerEmptyState = !hasCards && user.role === "viewer";

  return (
    <div className="mx-auto max-w-6xl px-4 space-y-10">
      <section>
        <h2 className="text-sm font-semibold text-slate-700 mb-4">
          Dashboard Features
        </h2>
        {hasCards ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {cards.map((c) => (
              <NoPrefetchLink
                key={c.key}
                href={c.href}
                prefetch={false}
                className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:shadow-md"
              >
                <div className="text-base font-semibold text-slate-900">
                  {c.title}
                </div>
                <div className="mt-2 text-sm leading-relaxed text-slate-600">
                  {c.desc}
                </div>
              </NoPrefetchLink>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-600">
            {viewerEmptyState ? (
              <p>
                Your role is set to <strong>Viewer</strong>. Use the “AI Assistant”
                link in the menu to test the chatbot—uploads and settings are
                handled by administrators.
              </p>
            ) : (
              <p>
                No modules available for your role yet. Please contact an admin
                if you believe this is incorrect.
              </p>
            )}
          </div>
        )}
      </section>

      {showPilot && (
        <section className="border-t pt-6">
          <NoPrefetchLink
            href="/pilot"
            prefetch={false}
            className="inline-flex items-center gap-2 text-sm text-slate-700 hover:underline"
          >
            <span>🎯</span>
            <span>Pilot objectives</span>
          </NoPrefetchLink>
        </section>
      )}
    </div>
  );
}