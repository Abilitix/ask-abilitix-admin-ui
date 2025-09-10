'use client';
import { useState } from 'react';

export default function OnboardingPage() {
  const [wid, setWid] = useState<string| null>(null);
  const [msg, setMsg] = useState<string| null>(null);
  const [doc, setDoc] = useState<{id:string}|null>(null);
  const [err, setErr] = useState<string| null>(null);

  async function rotate() {
    setErr(null);
    const r = await fetch('/api/admin/keys/rotate', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({kind:'widget'})});
    const j = await r.json();
    if (j?.value) setWid(j.value); else setErr('Rotate failed');
  }
  async function uploadQuick() {
    setErr(null);
    const r = await fetch('/api/admin/docs/upload_text', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ title: 'Onboarding Doc', text: 'hello abilitix' })
    });
    const j = await r.json();
    if (j?.doc?.id) setDoc({id: j.doc.id}); else setErr('Upload failed');
  }
  async function copyKey() {
    if (!wid) return;
    await navigator.clipboard.writeText(wid);
    setMsg('Copied!');
    setTimeout(()=>setMsg(null), 2000);
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Onboarding</h1>
      {err && <div className="text-red-600 text-sm">{err}</div>}

      <section className="space-y-2">
        <h2 className="font-semibold">1) Rotate widget key</h2>
        <button onClick={rotate} className="px-4 py-2 rounded border">Rotate</button>
        {wid && (
          <div className="p-3 rounded bg-yellow-50 border text-sm">
            One-time widget key (copy now): <code className="break-all">{wid}</code>
            <button onClick={copyKey} className="ml-2 px-2 py-1 text-xs rounded border">Copy</button>
            {msg && <span className="ml-2 text-green-700">{msg}</span>}
          </div>
        )}
      </section>

      <section className="space-y-2">
        <h2 className="font-semibold">2) Upload quick text doc</h2>
        <button onClick={uploadQuick} className="px-4 py-2 rounded border">Upload</button>
        {doc?.id && <div className="text-sm">Uploaded doc id: <code>{doc.id}</code></div>}
      </section>

      <section className="space-y-2">
        <h2 className="font-semibold">3) Approve one inbox item</h2>
        <a href="/admin/inbox" className="text-blue-600 underline">Go to Inbox</a>
      </section>

      <section className="space-y-2">
        <h2 className="font-semibold">4) Test ask</h2>
        <a href="/debug" className="text-blue-600 underline">Open test page</a>
      </section>
    </div>
  );
}
