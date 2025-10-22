'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function EmailPasswordFormSimple() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    console.log('Simple form submitted:', { email, password });

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      console.log('API Response:', { status: response.status, data });

      if (response.ok) {
        console.log('Login successful:', data);
        // Success - session cookie is set by the API
        router.push('/admin');
        router.refresh();
      } else {
        // Handle specific error codes
        console.log('Login failed:', data);
        if (data?.detail?.code === 'INVALID_CREDENTIALS') {
          setError('Invalid email or password');
        } else if (data?.detail?.code === 'EMAIL_NOT_VERIFIED') {
          setError('Please verify your email address before signing in');
        } else if (data?.detail?.code === 'NO_TENANT_ACCESS') {
          setError('Account has no workspace access. Please contact your administrator.');
        } else if (data?.detail?.code === 'rate_limited') {
          setError('Too many attempts, try again later');
        } else {
          setError(data?.detail?.message || 'An error occurred during sign in');
        }
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Unable to connect, please try again');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto bg-white rounded-xl shadow-lg p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Sign in with Email</h2>
        <p className="text-sm text-gray-600">
          Enter your email and password to access your workspace
        </p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="user@example.com"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        {/* Error Display */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Signing in...' : 'Sign in'}
        </button>
      </form>
    </div>
  );
}
