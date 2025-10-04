export async function checkTokenStatus(token: string) {
  const r = await fetch(`/public/token-status?token=${encodeURIComponent(token)}`, { cache: 'no-store' });
  return r.ok ? r.json() : null;
}

export async function requestNewMagicLink(email: string) {
  const r = await fetch('/api/public/signin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email })
  });
  return r.json(); // { ok: true, cooldown_seconds?: number }
}
