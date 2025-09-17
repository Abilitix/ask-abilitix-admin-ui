'use client';
import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

function SignInForm() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [tokenLoading, setTokenLoading] = useState(false);
  const searchParams = useSearchParams();

  // Handle magic link token exchange
  useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      handleMagicLinkToken(token);
    }
  }, [searchParams]);

  async function handleMagicLinkToken(token: string) {
    setTokenLoading(true);
    setErr(null);

    try {
      const api = process.env.NEXT_PUBLIC_ADMIN_API!;

      // Exchange token for session
      const exchangeResponse = await fetch(`${api}/auth/exchange`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });

      if (!exchangeResponse.ok) {
        throw new Error('Token exchange failed');
      }

      // Successfully logged in, redirect to dashboard
      // No need to check /api/auth/me - server wrapper handles auth check
      window.location.replace('/');
    } catch (error) {
      console.error('Magic link error:', error);
      setErr('Magic link verification failed. Please try again.');
    } finally {
      setTokenLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    setErr(null);

    try {
      const api = process.env.NEXT_PUBLIC_ADMIN_API!;
      const response = await fetch(`${api}/auth/signin`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });

      if (response.ok) {
        setSent(true);
      } else {
        const errorData = await response.json();
        setErr(errorData.error || 'Failed to send magic link');
      }
    } catch (error) {
      console.error('Signin error:', error);
      setErr('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  if (tokenLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
            <h2 className="mt-6 text-2xl font-bold text-gray-900">Verifying your magic link...</h2>
            <p className="mt-2 text-sm text-gray-600">Please wait while we log you in.</p>
          </div>
        </div>
      </div>
    );
  }

  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
              <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="mt-6 text-2xl font-bold text-gray-900">Check your email</h2>
            <p className="mt-2 text-sm text-gray-600">
              We've sent a magic link to <strong>{email}</strong>
            </p>
            <p className="mt-1 text-sm text-gray-500">
              Click the link in your email to sign in. The link will expire in 10 minutes.
            </p>
            <button
              onClick={() => {
                setSent(false);
                setEmail('');
              }}
              className="mt-4 text-sm text-blue-600 hover:text-blue-500"
            >
              Try a different email
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Welcome back
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Sign in to your workspace
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email" className="sr-only">
              Email Address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
              placeholder="Enter your email address"
            />
          </div>

          {err && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="text-sm text-red-700">{err}</div>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading || !email.trim()}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Sending magic link...
                </div>
              ) : (
                'Email me a sign-in link'
              )}
            </button>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-600">
              By continuing, you confirm that you have read and agree to our{' '}
              <Link href="/terms" className="font-medium text-blue-600 hover:text-blue-500">
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link href="/privacy" className="font-medium text-blue-600 hover:text-blue-500">
                Privacy Policy
              </Link>
              .
            </p>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-600">
              Don't have a workspace?{' '}
              <Link href="/signup" className="font-medium text-blue-600 hover:text-blue-500">
                Create one
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function SigninClient() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    }>
      <SignInForm />
    </Suspense>
  );
}
