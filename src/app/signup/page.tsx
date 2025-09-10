'use client';
import { useState } from 'react';

export default function SignupPage() {
  const [company, setCompany] = useState('');
  const [email, setEmail] = useState('');
  const [res, setRes] = useState<any>(null);
  const [err, setErr] = useState<string|null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setErr(null); setRes(null);
    const r = await fetch('/api/public/signup', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ company, email }),
    });
    if (!r.ok) { setErr('Signup failed'); return; }
    setRes(await r.json());
  }

  return (
    <div className="p-6 max-w-lg space-y-4">
      <h1 className="text-2xl font-semibold">Create your workspace</h1>
      <form onSubmit={submit} className="space-y-3">
        <input value={company} onChange={e=>setCompany(e.target.value)} placeholder="Company" className="w-full border p-2 rounded"/>
        <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email" className="w-full border p-2 rounded"/>
        <button className="px-4 py-2 rounded border">Create</button>
      </form>
      {err && <div className="text-red-600 text-sm">{err}</div>}
      {res && (
        <div className="p-3 rounded bg-yellow-50 border text-sm">
          <div className="mb-1">Tenant slug: <code>{res.tenant_slug}</code></div>
          <div className="mb-1">One-time widget key (copy now): <code className="break-all">{res.widget_key_once}</code></div>
          <button onClick={() => navigator.clipboard.writeText(res.widget_key_once)} className="mt-2 px-2 py-1 text-xs rounded border">Copy key</button>
        </div>
      )}
    </div>
  );
}
