'use client';
import { useEffect, useState } from 'react';

type Tenant = { id:string; slug:string; name:string; created_at:string };

export default function TenantsPage() {
  const [items, setItems] = useState<Tenant[]>([]);
  const [err, setErr] = useState<string|null>(null);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch('/api/admin/tenants', { cache: 'no-store' });
        const j = await r.json();
        setItems(j.items || []);
      } catch(e:any){ setErr(e.message || 'Load failed'); }
    })();
  }, []);

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Tenants</h1>
      {err && <div className="text-red-600 text-sm">{err}</div>}
      <table className="w-full text-sm">
        <thead><tr className="text-left">
          <th className="py-2">Slug</th><th>Name</th><th>Created</th>
        </tr></thead>
        <tbody>
          {items.map(t => (
            <tr key={t.id} className="border-t">
              <td className="py-2">{t.slug}</td>
              <td>{t.name}</td>
              <td>{new Date(t.created_at).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

