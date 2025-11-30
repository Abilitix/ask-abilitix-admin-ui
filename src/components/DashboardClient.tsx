"use client";

import Link from "next/link";
import NoPrefetchLink from "@/components/NoPrefetchLink";
import type { User } from "@/lib/auth"; // Adjust path if needed
import { hasPermission } from "@/lib/roles";
import { useDashboardSummary } from "@/hooks/useDashboardSummary";
import { DashboardGreeting } from "@/components/dashboard/DashboardGreeting";
import { DashboardMetricsStrip } from "@/components/dashboard/DashboardMetricsStrip";
import { Rocket } from "lucide-react";

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
    desc: "Manage team members, tenant defaults, website widget, and context management",
  },
];

const AI_CARD: Card = {
  key: "ai",
  href: "/admin/ai",
  title: "AI Assistant",
  desc: "Chat with intelligent responses and citations",
};

export default function DashboardClient({ user }: DashboardClientProps) {
  const { summary, isLoading, isError } = useDashboardSummary();
  const hideOld = process.env.NEXT_PUBLIC_HIDE_OLD_RAG === "1";
  const showPilot = process.env.NEXT_PUBLIC_SHOW_PILOT_LINK === "1";

  // Best-in-class SaaS principle: Users control their navigation
  // Welcome page is accessible via "Take Tour" button - no forced redirects

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
    <div className="mx-auto max-w-7xl px-3 sm:px-4 md:px-6 lg:px-8 space-y-6 sm:space-y-8 md:space-y-10">
      {/* Greeting */}
      <DashboardGreeting
        name={summary?.user.name}
        tenantName={summary?.tenant.name}
        industry={summary?.tenant.industry}
      />

      {/* Take Tour Button - Prominent placement after greeting */}
      <div className="flex items-center justify-center -mt-4 mb-2">
        <Link
          href="/welcome"
          prefetch={true}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <span>Take Tour</span>
        </Link>
      </div>

      {/* Metrics Strip */}
      {!isError && (
        <DashboardMetricsStrip
          metrics={summary?.metrics}
          isLoading={isLoading}
          userRole={user.role}
        />
      )}

      {/* Coming Soon Note */}
      <div className="flex items-center justify-center py-2">
        <p className="text-xs sm:text-sm text-slate-500 italic">
          More dashboard features coming soon
        </p>
      </div>

      <section>
        <h2 className="text-sm font-semibold text-slate-700 mb-5 uppercase tracking-wider">
          Dashboard Features
        </h2>
        {hasCards ? (
          <div className="grid grid-cols-1 gap-4 sm:gap-5 md:grid-cols-2 xl:grid-cols-3">
            {cards.map((c) => (
              <NoPrefetchLink
                key={c.key}
                href={c.href}
                prefetch={false}
                className="group relative rounded-xl border border-slate-200/80 bg-white p-6 sm:p-7 shadow-sm hover:shadow-lg hover:border-slate-300/80 transition-all duration-200 hover:-translate-y-0.5"
              >
                <div className="text-lg font-bold text-slate-900 mb-2 group-hover:text-slate-700 transition-colors">
                  {c.title}
                </div>
                <div className="text-sm leading-relaxed text-slate-600 group-hover:text-slate-700 transition-colors">
                  {c.desc}
                </div>
                {/* Subtle hover indicator */}
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
              </NoPrefetchLink>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-slate-300/60 bg-gradient-to-br from-slate-50/50 to-white p-8 sm:p-10 text-center">
            {viewerEmptyState ? (
              <div className="max-w-md mx-auto">
                <p className="text-base text-slate-700 leading-relaxed">
                  Your role is set to <strong className="font-semibold text-slate-900">Viewer</strong>. Use the "AI Assistant"
                  link in the menu to test the chatbot—uploads and settings are
                  handled by administrators.
                </p>
              </div>
            ) : (
              <div className="max-w-md mx-auto">
                <p className="text-base text-slate-700 leading-relaxed">
                  No modules available for your role yet. Please contact an admin
                  if you believe this is incorrect.
                </p>
              </div>
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