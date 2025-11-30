"use client";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";

function ResetRequestForm() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();

  // Check for token parameter - if exists, redirect to reset/confirm
  useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      router.replace(`/reset/confirm?token=${token}`);
    }
  }, [searchParams, router]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/auth/request-reset`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email }),
        credentials: "include",
      });
      setSent(true); // always 200, non-enumerating
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-sm p-6 space-y-4">
      <h1 className="text-xl font-semibold">Reset password</h1>
      {sent ? (
        <p>If that email exists, we've sent a reset link.</p>
      ) : (
        <form onSubmit={onSubmit} className="space-y-3">
          <label htmlFor="reset_email" className="block text-sm font-medium">Email</label>
          <input id="reset_email" type="email" required autoComplete="username"
                 className="w-full border rounded p-2"
                 value={email} onChange={e=>setEmail(e.target.value)} />
          <button type="submit" disabled={loading} className="w-full btn btn-primary">
            {loading ? "Sending…" : "Send reset link"}
          </button>
        </form>
      )}
    </main>
  );
}

export default function ResetRequestPage() {
  return (
    <Suspense fallback={
      <main className="mx-auto max-w-sm p-6 space-y-4">
        <h1 className="text-xl font-semibold">Reset password</h1>
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
      <ResetRequestForm />
    </Suspense>
  );
}
