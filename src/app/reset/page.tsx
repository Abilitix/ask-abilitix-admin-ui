"use client";
import { useState } from "react";

export default function ResetRequestPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

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
