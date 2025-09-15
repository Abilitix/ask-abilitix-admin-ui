'use client';
import { useState } from 'react';
import Link from 'next/link';

const DEMO_TENANT = "abilitix-demo";

export default function DemoSignupPage() {
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
        body: JSON.stringify({ 
          email: email.trim(),
          tenant_slug: DEMO_TENANT 
        }),
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Demo Workspace</h1>
          <p className="text-gray-600">Try Abilitix with our demo environment</p>
        </div>

        {/* Demo Signup Form */}
        <div className="bg-white rounded-xl shadow-lg p-8">
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
              {loading ? 'Sending link...' : 'Access Demo Workspace'}
            </button>
          </form>

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

          {/* Success Message */}
          {sent && (
            <div className="mt-6 p-6 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-start">
                <svg className="w-6 h-6 text-green-400 mr-3 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-green-800 mb-3">Demo Access Sent!</h3>
                  <p className="text-green-700 mb-4">
                    Check your email for a demo workspace link (valid 15 minutes).
                  </p>
                  <div className="text-sm text-green-600">
                    This will give you access to our demo environment.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Link to Production */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Need a real workspace?{' '}
              <Link href="/signup" className="text-indigo-600 hover:text-indigo-500 font-medium">
                Create one
              </Link>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-500">
          <p>© 2025 Abilitix. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}
