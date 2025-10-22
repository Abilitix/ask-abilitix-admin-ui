"use client";
import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";

export default function ResetConfirmPage() {
  const sp = useSearchParams();
  const token = sp.get("token");
  const router = useRouter();
  const [pw, setPw] = useState("");
  const [err, setErr] = useState<string|null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => { if (!token) router.replace("/reset"); }, [token, router]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setLoading(true); setErr(null);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/auth/reset`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token, new_password: pw }),
        credentials: "include",
      });
      if (!res.ok) {
        const d = await res.json().catch(()=> ({}));
        throw new Error(d?.detail || "Link expired or invalid");
      }
      router.push("/signin?reset=ok");
    } catch (e:any) {
      setErr(e.message || "Could not reset password");
    } finally {
      setLoading(false);
    }
  }

  if (!token) return null;
  return (
    <main className="mx-auto max-w-sm p-6 space-y-4">
      <h1 className="text-xl font-semibold">Choose a new password</h1>
      <form onSubmit={onSubmit} className="space-y-3">
        <label htmlFor="pw_new" className="block text-sm font-medium">New password</label>
        <input id="pw_new" type="password" required autoComplete="new-password"
               className="w-full border rounded p-2"
               value={pw} onChange={e=>setPw(e.target.value)} />
        {err && <p className="text-red-600 text-sm">{err}</p>}
        <button type="submit" disabled={loading} className="w-full btn btn-primary">
          {loading ? "Setting…" : "Set password"}
        </button>
      </form>
    </main>
  );
}
