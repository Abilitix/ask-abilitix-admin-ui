'use client';
import { useEffect, useState } from 'react';

type Eff = { DOC_MIN_SCORE:number; RAG_TOPK:number; DOC_VEC_W:number; DOC_TRGM_W:number; REQUIRE_WIDGET_KEY?: number; };
type SettingsResp = { effective: Eff; overrides: Partial<Eff>; tenant_id?: string; tenant_slug?: string; };

export default function SettingsPage() {
  const [data, setData] = useState<SettingsResp | null>(null);
  const [form, setForm] = useState<Partial<Eff>>({});
  const [saving, setSaving] = useState(false);
  const [rot, setRot] = useState<string|null>(null);
  const [err, setErr] = useState<string|null>(null);
  const [supportsGate, setSupportsGate] = useState(false);

  async function load() {
    setErr(null);
    const r = await fetch('/api/admin/settings', { cache: 'no-store' });
    const j: SettingsResp & { effective: Eff } = await r.json();
    setData(j);
    setSupportsGate(Object.prototype.hasOwnProperty.call(j.effective, 'REQUIRE_WIDGET_KEY'));
    setForm({
      DOC_MIN_SCORE: j.effective.DOC_MIN_SCORE,
      RAG_TOPK: j.effective.RAG_TOPK,
      DOC_VEC_W: j.effective.DOC_VEC_W,
      DOC_TRGM_W: j.effective.DOC_TRGM_W,
      ...(supportsGate ? { REQUIRE_WIDGET_KEY: j.effective.REQUIRE_WIDGET_KEY ?? 0 } : {})
    });
  }

  useEffect(() => { load(); /* eslint-disable-line react-hooks/exhaustive-deps */ }, []);

  function set<K extends keyof Eff>(k:K, v:any){ setForm(p => ({...p, [k]: v})); }

  async function save() {
    setSaving(true); setErr(null);
    try {
      const r = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
        cache: 'no-store'
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      await load();
    } catch (e) {
      setErr(String(e));
    } finally {
      setSaving(false);
    }
  }

  async function rotate() {
    setErr(null);
    try {
      const r = await fetch('/api/admin/keys/rotate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind: 'widget' }),
        cache: 'no-store'
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const j = await r.json();
      setRot(j.key);
    } catch (e) {
      setErr(String(e));
    }
  }

  if (!data) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-sm text-gray-600 mt-1">
          Tenant: <code className="bg-gray-100 px-2 py-1 rounded text-xs">{data?.tenant_slug || 'Loading...'}</code>
        </p>
      </div>
      
      {err && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700">
          Error: {err}
        </div>
      )}

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2">DOC_MIN_SCORE</label>
          <input
            type="number"
            min="0" max="1" step="0.01"
            value={form.DOC_MIN_SCORE ?? ''}
            onChange={(e) => set('DOC_MIN_SCORE', parseFloat(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">RAG_TOPK</label>
          <input
            type="number"
            min="1" max="50" step="1"
            value={form.RAG_TOPK ?? ''}
            onChange={(e) => set('RAG_TOPK', parseInt(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">DOC_VEC_W</label>
          <input
            type="number"
            min="0" max="1" step="0.01"
            value={form.DOC_VEC_W ?? ''}
            onChange={(e) => set('DOC_VEC_W', parseFloat(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">DOC_TRGM_W</label>
          <input
            type="number"
            min="0" max="1" step="0.01"
            value={form.DOC_TRGM_W ?? ''}
            onChange={(e) => set('DOC_TRGM_W', parseFloat(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded"
          />
        </div>

        {supportsGate && (
          <div>
            <label className="block text-sm font-medium mb-2">REQUIRE_WIDGET_KEY</label>
            <select
              value={form.REQUIRE_WIDGET_KEY ?? 0}
              onChange={(e) => set('REQUIRE_WIDGET_KEY', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded"
            >
              <option value={0}>Disabled</option>
              <option value={1}>Enabled</option>
            </select>
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={save}
            disabled={saving}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
          
          <button
            onClick={rotate}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Rotate Widget Key
          </button>
        </div>

        {rot && (
          <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">One-time key:</span>
              <code className="flex-1 text-sm bg-white px-2 py-1 border rounded">{rot}</code>
              <button
                onClick={async ()=>{ await navigator.clipboard.writeText(rot!); }}
                className="ml-2 px-2 py-1 text-xs rounded border"
                aria-label="Copy widget key"
              >
                Copy
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
