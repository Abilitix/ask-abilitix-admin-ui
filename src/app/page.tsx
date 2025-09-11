import Image from "next/image";
import Link from "next/link";

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

export default function Page() {
  return (
    <div className="space-y-8">
      {/* Hero */}
      <section className="rounded-2xl border bg-white p-6">
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
              Welcome to AbilitiX Admin
            </h1>
            <p className="text-sm text-slate-600">
              Manage your AI-powered knowledge base: upload docs, configure settings,
              and monitor performance.
            </p>
          </div>
        </div>
      </section>

      {/* Feature cards */}
      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => (
          <Link
            key={c.href}
            href={c.href}
            className="group rounded-xl border bg-white p-5 shadow-sm transition hover:shadow-md"
          >
            <div className="mb-1 font-medium">{c.title}</div>
            <div className="text-sm text-slate-600">{c.desc}</div>
            <div className="mt-3 text-xs text-emerald-700 opacity-0 transition group-hover:opacity-100">
              Open →
            </div>
          </Link>
        ))}
      </section>

      {/* Quick demo tips */}
      <section className="rounded-2xl border bg-white p-6">
        <h2 className="mb-2 text-lg font-semibold">Quick Demo Tips</h2>
        <ol className="list-decimal space-y-1 pl-5 text-sm text-slate-700">
          <li>Run <strong>Onboarding</strong> to show tenant creation and email.</li>
          <li>Use <strong>RAG Testing</strong> to highlight first-token and total latency.</li>
          <li>Approve an item in <strong>Inbox</strong>, then re-ask to show improvement.</li>
          <li>Archive a doc in <strong>Documents</strong>, then re-ask to show lifecycle control.</li>
          <li>Tweak <strong>Settings</strong> (<code>DOC_MIN_SCORE</code> / <code>RAG_TOPK</code>) to show knobs.</li>
        </ol>
      </section>
    </div>
  );
}