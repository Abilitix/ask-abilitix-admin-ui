"use client";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";

function ResetConfirmForm() {
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

export default function ResetConfirmPage() {
  return (
    <Suspense fallback={
      <main className="mx-auto max-w-sm p-6 space-y-4">
        <h1 className="text-xl font-semibold">Choose a new password</h1>
        <div className="text-center py-8">
          <div className="inline-flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full mb-4">
            <svg className="animate-spin w-4 h-4 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </main>
    }>
      <ResetConfirmForm />
    </Suspense>
  );
}
