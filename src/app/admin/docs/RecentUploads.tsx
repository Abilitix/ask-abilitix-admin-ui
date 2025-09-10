'use client';
import React from 'react';

export default function RecentUploads() {
  const [items, setItems] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  async function load() {
    setLoading(true);
    const r = await fetch('/api/admin/audit?limit=5', { cache: 'no-store' });
    const j = await r.json().catch(() => ({}));
    setItems(j?.items || []);
    setLoading(false);
  }

  React.useEffect(() => {
    load();
    const onRefresh = () => load();
    window.addEventListener('recent-uploads:refresh', onRefresh);
    return () => window.removeEventListener('recent-uploads:refresh', onRefresh);
  }, []);

  if (loading) return <div className="text-sm text-gray-500">Loading recent uploads…</div>;
  if (!items.length) return null;

  return (
    <div className="rounded-2xl border p-4 shadow-sm">
      <h4 className="font-medium mb-2">Recent uploads</h4>
      <ul className="text-sm space-y-1">
        {items.map((it: any, idx: number) => (
          <li key={idx} className="text-gray-700">
            <span className="font-mono text-xs">{(it?.ts || '').slice(0, 19)}</span>
            {' — '}
            <span>{it?.metadata?.title ?? it?.metadata?.name ?? 'document'}</span>
            {it?.metadata?.chunks != null && <> · {it.metadata.chunks} chunks</>}
          </li>
        ))}
      </ul>
    </div>
  );
}
