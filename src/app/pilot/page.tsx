import NoPrefetchLink from "@/components/NoPrefetchLink";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function PilotPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-10">
      {/* Back to Dashboard link */}
      <div className="mb-6">
        <NoPrefetchLink
          href="/admin"
          className="inline-flex items-center text-sm text-slate-500 hover:text-slate-700 hover:underline"
        >
          ← Back to Dashboard
        </NoPrefetchLink>
      </div>

      <div className="space-y-8">
        <section className="rounded-2xl bg-white p-6 shadow-sm">
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-slate-900">Pilot Objectives</h1>
          <p className="mt-2 text-slate-600 leading-relaxed">
            Use this page as your checklist during the pilot. Edit anytime.
          </p>
        </section>

      <section className="grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="font-bold">Goals</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm">
            <li>Upload 10–20 key documents to validate ingestion.</li>
            <li>Ask 25+ real questions; review answers and citations.</li>
            <li>Invite 2–3 teammates to try the workflow (functionality available soon).</li>
            <li>Capture issues/ideas and send weekly feedback.</li>
          </ul>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="font-bold">Success Criteria</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm">
            <li>≥80% answers marked useful/mostly useful.</li>
            <li>First token &lt; ~2s; full answer &lt; ~10s.</li>
            <li>No sign-in loops or auth errors after Day 1.</li>
            <li>All files process without stuck jobs.</li>
          </ul>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="font-bold">Scope</h2>
          <p className="mt-2 text-sm"><span className="font-medium">In:</span> PDF/TXT/DOCX uploads, Inbox, Settings, Test chat/RAG.</p>
          <p className="mt-1 text-sm"><span className="font-medium">Out of Scope:</span> Billing, analytics, SSO, custom theming, fine-tuning.</p>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="font-bold">Timeline (2 weeks)</h2>
          <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm">
            <li>Week 1: Setup (docs + users) and quickstart.</li>
            <li>Week 2: Daily usage; log questions/edge cases; review meeting.</li>
          </ol>
        </div>
      </section>

      <section className="rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="font-medium">Get Started</h2>
        <div className="mt-4 flex flex-wrap gap-3">
          <a href="/admin/docs" className="inline-flex items-center rounded-lg border px-3 py-2 text-sm hover:shadow">
            Upload docs
          </a>
          <a href="/admin/settings?tab=users" className="inline-flex items-center rounded-lg border px-3 py-2 text-sm hover:shadow">
            Invite teammates
          </a>
          <a href="/admin/inbox" className="inline-flex items-center rounded-lg border px-3 py-2 text-sm hover:shadow">
            Test answers
          </a>
          <a href="mailto:pilot@abilitix.com.au?subject=Pilot%20feedback" className="inline-flex items-center rounded-lg border px-3 py-2 text-sm hover:shadow">
            Report an issue
          </a>
        </div>
      </section>
      </div>
    </div>
  );
}
