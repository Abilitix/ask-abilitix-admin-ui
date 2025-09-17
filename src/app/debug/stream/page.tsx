'use client';

import { useRef, useState } from 'react';

export default function StreamTest() {
  const [q, setQ] = useState('What can you do?');
  const [out, setOut] = useState('');
  const [lat, setLat] = useState<number| null>(null);
  const esRef = useRef<EventSource | null>(null);

  function start() {
    setOut(''); setLat(null);
    esRef.current?.close();
    const es = new EventSource('/api/ask/stream', { withCredentials: false }); // proxy handles headers
    esRef.current = es;
    es.addEventListener('start', () => {});
    es.addEventListener('latency', (e:any) => { try { setLat(JSON.parse(e.data).t_first_byte_ms); } catch {} });
    es.addEventListener('done', () => es.close());
    es.onmessage = (e) => {
      try {
        const j = JSON.parse(e.data);
        if (j.token) setOut(prev => prev + j.token);
      } catch {}
    };
    fetch('/api/ask/stream', { // kick off POST body via fetch; EventSource can't POST; we keep ES open for downstream
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question: q })
    });
  }

  return (
    <div className="p-6 space-y-3 max-w-2xl">
      <h1 className="text-2xl font-semibold">Streaming Test</h1>
      <textarea value={q} onChange={e=>setQ(e.target.value)} className="w-full border p-2 rounded" rows={3}/>
      <button onClick={start} className="px-4 py-2 rounded border">Stream</button>
      {lat !== null && <div className="text-sm">First byte: {lat} ms</div>}
      <pre className="whitespace-pre-wrap border rounded p-3 min-h-[120px]">{out}</pre>
    </div>
  );
}

