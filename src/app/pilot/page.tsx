export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function PilotPage() {
  return (
    <div className="space-y-8">
      <section className="rounded-2xl bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold">Pilot Objectives</h1>
        <p className="mt-2 text-sm text-slate-600">
          Use this page as your checklist during the pilot. Edit anytime.
        </p>
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="font-medium">Goals</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm">
            <li>Upload 10–20 key documents to validate ingestion.</li>
            <li>Ask 25+ real questions; review answers and citations.</li>
            <li>Invite 2–3 teammates to try the workflow.</li>
            <li>Capture issues/ideas and send weekly feedback.</li>
          </ul>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="font-medium">Success Criteria</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm">
            <li>≥80% answers marked useful/mostly useful.</li>
            <li>First token &lt; ~2s; full answer &lt; ~10s.</li>
            <li>No sign-in loops or auth errors after Day 1.</li>
            <li>All files process without stuck jobs.</li>
          </ul>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="font-medium">Scope</h2>
          <p className="mt-2 text-sm"><span className="font-medium">In:</span> PDF/TXT/DOCX uploads, Inbox, Settings, Test chat/RAG.</p>
          <p className="mt-1 text-sm"><span className="font-medium">Out:</span> Billing, analytics, SSO, custom theming, fine-tuning.</p>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="font-medium">Timeline (2–4 weeks)</h2>
          <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm">
            <li>Week 1: Setup (docs + users) and quickstart.</li>
            <li>Week 2: Daily usage; log questions/edge cases.</li>
            <li>Week 3: Triage fixes; second round of docs.</li>
            <li>Week 4: Review meeting; go/no-go.</li>
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
          <a href="mailto:support@abilitix.com.au?subject=Pilot%20feedback" className="inline-flex items-center rounded-lg border px-3 py-2 text-sm hover:shadow">
            Report an issue
          </a>
        </div>
      </section>
    </div>
  );
}
