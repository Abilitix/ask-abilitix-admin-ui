import Link from "next/link";

const cards = [
  { href: "/signup", title: "Onboarding", desc: "Create a tenant and get a one-time widget key" },
  { href: "/admin/rag", title: "RAG Testing", desc: "Stream answers; see first token and total time" },
  { href: "/admin/inbox", title: "Inbox", desc: "Approve/reject Q&A; copy citations" },
  { href: "/admin/docs", title: "Documents", desc: "Upload; archive/unarchive; supersede" },
  { href: "/admin/settings", title: "Settings", desc: "Tune DOC_MIN_SCORE and RAG_TOPK" },
];

export default function Page() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">Welcome to Abilitix Admin</h1>
        <p className="text-slate-600">
          Manage your AI-powered knowledge base: upload docs, configure settings, and monitor performance.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {cards.map(c => (
          <Link
            key={c.href}
            href={c.href}
            className="rounded-xl border bg-white p-5 shadow-sm transition hover:shadow"
          >
            <div className="text-base font-medium">{c.title}</div>
            <div className="mt-1 text-sm text-slate-600">{c.desc}</div>
          </Link>
        ))}
      </div>

      <div className="rounded-xl border bg-white p-5">
        <div className="mb-2 text-sm font-medium text-slate-700">Quick Demo Tips</div>
        <ul className="list-disc pl-5 text-sm text-slate-600 space-y-1">
          <li>Run <em>Onboarding</em> to show tenant creation and email.</li>
          <li>Use <em>RAG Testing</em> to highlight first-token and total latency.</li>
          <li>Approve an item in <em>Inbox</em>, then re-ask to show improvement.</li>
          <li>Archive a doc in <em>Documents</em>, re-ask to show lifecycle control.</li>
          <li>Tweak <em>Settings</em> (DOC_MIN_SCORE / RAG_TOPK) to show knobs.</li>
        </ul>
      </div>

      {/* Visual test for Tailwind */}
      <div className="h-4 rounded bg-emerald-600 my-4 p-4 text-white font-bold text-center">
        ✅ Tailwind is working! If you see this green bar with white text, styling is active.
      </div>
    </div>
  );
}