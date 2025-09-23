import NoPrefetchLink from "@/components/NoPrefetchLink";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const USE_RAG_NEW = process.env.NEXT_PUBLIC_ENABLE_RAG_NEW !== "0";

// Small helper so each card is a single clickable element
function QuickLinkCard({
  href,
  emoji,
  title,
  tooltip,
  className,
}: {
  href: string;
  emoji: string;
  title: string;
  tooltip: string;
  className: string;
}) {
  return (
    <NoPrefetchLink
      href={href}
      className={[
        "group inline-flex items-center justify-center rounded-2xl px-6 py-5 font-medium shadow-md transition-all",
        "ring-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
        "hover:shadow-lg active:scale-[0.99]",
        className,
      ].join(" ")}
    >
      {/* Put tooltip on inner span to avoid typing issues with NoPrefetchLink */}
      <span title={tooltip} className="flex items-center gap-2">
        <span className="text-xl">{emoji}</span>
        <span className="text-base sm:text-lg">{title}</span>
      </span>
    </NoPrefetchLink>
  );
}

export default function PilotPage() {
  const chatHref = USE_RAG_NEW ? "/admin/rag-new" : "/admin/rag";

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-10">
      {/* Back to Dashboard link */}
      <div className="mb-6">
        <NoPrefetchLink
          href="/"
          className="inline-flex items-center text-sm text-slate-500 hover:text-slate-700 hover:underline"
        >
          ← Back to Dashboard
        </NoPrefetchLink>
      </div>

      <div className="space-y-8">
        {/* Hero Section with Gradient */}
        <section className="rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 p-8 shadow-lg border border-blue-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
              <span className="text-2xl">🎯</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-blue-900">
              Pilot Objectives
            </h1>
          </div>
          <p className="text-lg text-blue-700 leading-relaxed">
            Use this page as your checklist during the pilot. Edit anytime.
          </p>
        </section>

        {/* 4-up Quick Actions with tooltips */}
        <section className="rounded-2xl bg-gradient-to-r from-slate-50 to-gray-50 p-8 shadow-lg border border-slate-200">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 bg-slate-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">🚀</span>
            </div>
            <h2 className="text-2xl font-bold text-slate-900">Get Started</h2>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <QuickLinkCard
              href="/admin/docs"
              emoji="📄"
              title="Upload docs"
              tooltip="Tip: Upload at least 3–5 representative docs before testing chat for best results."
              className="bg-blue-500 text-white hover:bg-blue-600"
            />
            <QuickLinkCard
              href={chatHref}
              emoji="💬"
              title="Test chat"
              tooltip="Ask 10–25 real questions. Watch sources; adjust TopK if answers feel thin."
              className="bg-purple-500 text-white hover:bg-purple-600"
            />
            <QuickLinkCard
              href="/admin/inbox"
              emoji="✅"
              title="Approve / Reject"
              tooltip="Curate model answers; this feedback improves quality for your team."
              className="bg-green-500 text-white hover:bg-green-600"
            />
            <QuickLinkCard
              href="/admin/settings"
              emoji="⚙️"
              title="Settings"
              tooltip="Tune DOC_MIN_SCORE and RAG_TOPK after a few chat runs; lower score = more lenient."
              className="bg-orange-500 text-white hover:bg-orange-600"
            />
          </div>
        </section>

        {/* Goals + Success Criteria + Scope + Timeline */}
        <section className="grid gap-8 md:grid-cols-2">
          {/* Goals Card */}
          <div className="rounded-2xl bg-gradient-to-br from-green-50 to-emerald-50 p-8 shadow-lg border border-green-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">✓</span>
              </div>
              <h2 className="text-xl font-bold text-green-900">Goals</h2>
            </div>
            <ul className="space-y-3 text-green-800">
              <li className="flex items-start gap-3">
                <span className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></span>
                <span>Upload 10–20 key documents to validate ingestion.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></span>
                <span>Ask 25+ real questions; review answers and citations.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></span>
                <span>Invite 2–3 teammates to try the workflow.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></span>
                <span>Capture issues/ideas and send weekly feedback.</span>
              </li>
            </ul>
          </div>

          {/* Success Criteria Card */}
          <div className="rounded-2xl bg-gradient-to-br from-purple-50 to-violet-50 p-8 shadow-lg border border-purple-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">★</span>
              </div>
              <h2 className="text-xl font-bold text-purple-900">Success Criteria</h2>
            </div>
            <ul className="space-y-3 text-purple-800">
              <li className="flex items-start gap-3">
                <span className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></span>
                <span>≥80% answers marked useful/mostly useful.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></span>
                <span>First token &lt; ~2s; full answer &lt; ~10s.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></span>
                <span>No sign-in loops or auth errors after Day 1.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></span>
                <span>All files process without stuck jobs.</span>
              </li>
            </ul>
          </div>

          {/* Scope Card */}
          <div className="rounded-2xl bg-gradient-to-br from-orange-50 to-amber-50 p-8 shadow-lg border border-orange-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">📋</span>
              </div>
              <h2 className="text-xl font-bold text-orange-900">Scope</h2>
            </div>
            <div className="space-y-3 text-orange-800">
              <div>
                <span className="font-semibold text-orange-900">In:</span> PDF/TXT/DOCX uploads, Inbox, Settings, Test chat/RAG.
              </div>
              <div>
                <span className="font-semibold text-orange-900">Out of Scope:</span> Billing, analytics, SSO, custom theming, fine-tuning.
              </div>
            </div>
          </div>

          {/* Timeline Card */}
          <div className="rounded-2xl bg-gradient-to-br from-cyan-50 to-blue-50 p-8 shadow-lg border border-cyan-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-cyan-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">⏰</span>
              </div>
              <h2 className="text-xl font-bold text-cyan-900">Timeline (2 weeks)</h2>
            </div>
            <ol className="space-y-3 text-cyan-800">
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 bg-cyan-500 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                  1
                </span>
                <span>Week 1: Setup (docs + users) and quickstart.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 bg-cyan-500 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                  2
                </span>
                <span>Week 2: Daily usage; log questions/edge cases; review meeting.</span>
              </li>
            </ol>
          </div>
        </section>
      </div>
    </div>
  );
}
