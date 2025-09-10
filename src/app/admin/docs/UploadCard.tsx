'use client';
import React from 'react';

export default function UploadCard() {
  const [busy, setBusy] = React.useState(false);
  const [msg, setMsg] = React.useState<string | null>(null);
  const [fileName, setFileName] = React.useState<string | null>(null);

  async function onSubmit(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
    setBusy(true); 
    setMsg(null);

    try {
      // Get file and title from inputs
      const fileInput = document.getElementById('file-input') as HTMLInputElement;
      const titleInput = document.getElementById('title-input') as HTMLInputElement;
      
      const file = fileInput?.files?.[0] || null;
      const title = titleInput?.value || '';

    if (!file) {
      setBusy(false);
      setMsg('Please select a file.');
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      setBusy(false);
      setMsg('File too large (max 15MB).');
      return;
    }

    // Create FormData
    const fd = new FormData();
    fd.append('file', file);
    if (title) {
      fd.append('title', title);
    }

    const res = await fetch('/api/admin/docs/upload_file', {
      method: 'POST',
      body: fd,
      cache: 'no-store',
    });

    let data: any = {};
    try { data = await res.json(); } catch {}

    setBusy(false);

    // Handle duplicate documents (Admin API returns 200 with duplicate: true)
    if (data?.duplicate === true) {
      const docId = data?.doc?.id || 'unknown';
      const title = data?.doc?.title || data?.message || 'existing document';
      setMsg(`This document already exists: "${title}" (ID: ${docId})`);
      return;
    }

    if (!res.ok) {
      // Handle other errors
      const detail = data?.detail || data?.error || data?.message || `HTTP ${res.status}`;
      setMsg(`Upload failed: ${typeof detail === 'string' ? detail : JSON.stringify(detail)}`);
      return;
    }

    // Success
    const t = data?.doc?.title ?? '—';
    const c = data?.chunks ?? '?';
    const id = data?.doc?.id ?? '';
    setMsg(`Uploaded: ${t} (${c} chunk${c === 1 ? '' : 's'})${id ? ` · id=${id}` : ''}`);

    // Reset form inputs
    if (fileInput) fileInput.value = '';
    if (titleInput) titleInput.value = '';
    setFileName(null);

    // Optional: notify RecentUploads to refresh if present
    const ev = new CustomEvent('recent-uploads:refresh');
    window.dispatchEvent(ev);
    
    } catch (error) {
      console.error('Upload error:', error);
      setBusy(false);
      setMsg('An error occurred during upload.');
    }
  }

  return (
    <div className="rounded-2xl border p-4 shadow-sm">
      <h3 className="text-lg font-semibold mb-2">Upload document</h3>
      <p className="text-sm text-gray-500 mb-3">Accepted: .pdf, .txt, .docx — up to 15MB.</p>
      <div className="space-y-3">
        <input
          type="file"
          id="file-input"
          accept=".pdf,.txt,.docx"
          onChange={(e) => setFileName(e.target.files?.[0]?.name || null)}
          className="block w-full"
          required
        />
        <input 
          type="text" 
          id="title-input"
          placeholder="Optional title" 
          className="w-full border rounded px-2 py-1" 
        />
        <button
          type="button"
          onClick={onSubmit}
          disabled={busy}
          className="px-3 py-1.5 rounded bg-black text-white disabled:opacity-50"
        >
          {busy ? 'Uploading…' : 'Upload'}
        </button>
        {fileName && <div className="text-xs text-gray-600">Selected: {fileName}</div>}
        {msg && <div className="text-sm mt-2">{msg}</div>}
      </div>
    </div>
  );
}
