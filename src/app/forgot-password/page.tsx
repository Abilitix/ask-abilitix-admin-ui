'use client';
import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { isEmailValid, normalizeEmail } from '@/utils/email';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setSent(false);
    setLoading(true);

    // Client-side email validation
    const normalizedEmail = normalizeEmail(email);
    if (!isEmailValid(normalizedEmail)) {
      setErr('Please check email format and try again.');
      setLoading(false);
      return;
    }

    try {
      const r = await fetch('/api/auth/request-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: normalizedEmail }),
        credentials: 'include',
      });

      const data = await r.json().catch(() => ({}));

      if (!r.ok && !data.ok) {
        // Even on error, show success message (non-enumerating UX)
        // Backend handles actual email sending
        setSent(true);
        return;
      }

      // Success: Always show success message (non-enumerating UX)
      setSent(true);
    } catch (error) {
      // Even on network error, show success message (non-enumerating UX)
      setSent(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen min-h-[100dvh] overflow-y-auto bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Header with Logo */}
        <div className="text-center mb-5 sm:mb-6 md:mb-8">
          <div className="flex justify-center mb-3 sm:mb-4 md:mb-6">
            <Image
              src="/abilitix-logo.png"
              alt="Abilitix"
              width={64}
              height={64}
              priority
              className="rounded-lg"
            />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1.5 sm:mb-2">Reset your password</h1>
          <p className="text-sm sm:text-base text-gray-600">We'll send you a link to reset your password</p>
        </div>

        {/* Forgot Password Form */}
        <div className="bg-white rounded-xl shadow-lg p-6 md:p-8">
          {!sent ? (
            <>
              <form onSubmit={submit} className={`space-y-4 sm:space-y-5 transition-opacity duration-200 ${loading ? 'opacity-90' : 'opacity-100'}`}>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={e => {
                      setEmail(e.target.value);
                      if (err) setErr(null);
                    }}
                    placeholder="Enter your registered email address"
                    className="w-full px-4 py-3 text-base sm:text-sm border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 placeholder:text-gray-400 disabled:opacity-60 disabled:cursor-not-allowed"
                    aria-invalid={!!err}
                    aria-describedby={err ? "email-error" : undefined}
                    required
                    autoComplete="email"
                    inputMode="email"
                    disabled={loading}
                  />
                </div>

                {/* Error Message */}
                {err && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex">
                      <svg className="w-5 h-5 text-red-400 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                      <div className="text-sm text-red-700">{err}</div>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || !email || !isEmailValid(normalizeEmail(email))}
                  className={`w-full bg-indigo-600 text-white py-3.5 sm:py-3 px-4 rounded-lg font-semibold text-base sm:text-sm shadow-sm hover:bg-indigo-700 hover:shadow active:bg-indigo-800 active:scale-[0.98] focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 transition-all duration-200 flex items-center justify-center gap-2 touch-manipulation min-h-[44px] ${loading ? 'animate-pulse' : ''}`}
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin h-5 w-5 sm:h-4 sm:w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Sending reset link...</span>
                    </>
                  ) : (
                    <span>Send reset link</span>
                  )}
                </button>
              </form>

              {/* Link to Signin */}
              <div className="mt-4 md:mt-6 text-center">
                <p className="text-sm text-gray-600">
                  Remember your password?{' '}
                  <Link href="/signin" className="text-indigo-600 hover:text-indigo-500 font-medium">
                    Sign in
                  </Link>
                </p>
              </div>
            </>
          ) : (
            /* Success State */
            <div className="text-center py-4">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-6">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Check your email</h3>
              <p className="text-gray-600 mb-6">
                If that email exists, we've sent a password reset link to <span className="font-medium text-gray-900">{email}</span>
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-start">
                  <svg className="w-5 h-5 text-blue-400 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <div className="text-sm text-blue-700">
                    <p className="font-medium mb-1">Link expires in 30 minutes</p>
                    <p>Click the link in your email to reset your password</p>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <button
                  onClick={() => {
                    setSent(false);
                    setEmail('');
                    setErr(null);
                  }}
                  className="text-indigo-600 hover:text-indigo-500 font-medium text-sm"
                >
                  Send another link
                </button>
                <div className="text-sm text-gray-600">
                  <Link href="/signin" className="text-indigo-600 hover:text-indigo-500 font-medium">
                    Back to sign in
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

