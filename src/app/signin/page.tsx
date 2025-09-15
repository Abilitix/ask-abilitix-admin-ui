'use client';
import { useState } from 'react';
import Link from 'next/link';

export default function SignInPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault(); 
    setErr(null); 
    setSent(false);
    setLoading(true);
    
    try {
      const r = await fetch('/api/public/signin', {
        method: 'POST', 
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ email }),
      });
      
      if (!r.ok) { 
        const errorData = await r.json();
        setErr(errorData.error || 'Could not request sign-in link. Please try again.'); 
        return; 
      }
      
      setSent(true);
    } catch (error) {
      setErr('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome back</h1>
          <p className="text-gray-600">Sign in to your workspace</p>
        </div>

        {/* Sign-in Form */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          {!sent ? (
            <form onSubmit={submit} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                  required
                />
              </div>
              
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Sending link...' : 'Email me a sign-in link'}
              </button>

              {/* Error Message */}
              {err && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex">
                    <svg className="w-5 h-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    <div className="text-sm text-red-700">{err}</div>
                  </div>
                </div>
              )}
            </form>
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
                We've sent a secure sign-in link to <strong>{email}</strong>
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-start">
                  <svg className="w-5 h-5 text-blue-400 mr-3 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <div className="text-sm text-blue-700">
                    <p className="font-medium mb-1">Link expires in 15 minutes</p>
                    <p>Click the link in your email to access your workspace</p>
                  </div>
                </div>
              </div>
              <button
                onClick={() => {
                  setSent(false);
                  setEmail('');
                }}
                className="text-indigo-600 hover:text-indigo-500 font-medium text-sm"
              >
                Send another link
              </button>
            </div>
          )}

          {/* Terms and Privacy */}
          <div className="mt-6 text-center text-xs text-gray-500">
            <p>
              By continuing, you confirm that you have read and agree to our{' '}
              <a 
                href="https://abilitix.com.au/abilitix-pilot-terms-of-use/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-indigo-600 hover:text-indigo-500 underline"
              >
                Terms of Service
              </a>{' '}
              and{' '}
              <a 
                href="https://abilitix.com.au/abilitix-privacy-policy/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-indigo-600 hover:text-indigo-500 underline"
              >
                Privacy Policy
              </a>
              .
            </p>
          </div>
        </div>

        {/* Link to Signup */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Don't have a workspace?{' '}
            <Link href="/signup" className="text-indigo-600 hover:text-indigo-500 font-medium">
              Create one
            </Link>
          </p>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-500">
          <p>© 2025 Abilitix. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}