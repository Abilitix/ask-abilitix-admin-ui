'use client';
import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Eye, EyeOff } from 'lucide-react';
import { isEmailValid, normalizeEmail } from '@/utils/email';

export default function SignupPage() {
  const [company, setCompany] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [method, setMethod] = useState<'magic_link' | 'password'>('magic_link');
  const [showPassword, setShowPassword] = useState(false);
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState<string|null>(null);
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

    // Password validation (if password method)
    if (method === 'password' && !password) {
      setErr('Please enter a password.');
      setLoading(false);
      return;
    }
    
    try {
      const body: { company: string; email: string; password?: string } = { 
        company, 
        email: normalizedEmail 
      };
      
      // Add password if password method is selected
      if (method === 'password' && password) {
        body.password = password;
      }

      const r = await fetch('/api/public/signup', {
        method:'POST', 
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify(body),
      });
      
      if (r.status === 409) {
        const data = await r.json();
        setErr(data.message || 'An account with this email address already exists. Please sign in instead.');
        return;
      }
      
      if (!r.ok) { 
        const errorData = await r.json();
        setErr(errorData.error || errorData.message || 'Signup failed'); 
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
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1.5 sm:mb-2">Welcome to Abilitix</h1>
          <p className="text-sm sm:text-base text-gray-600">Create your AI-powered workspace</p>
        </div>

        {/* Signup Form */}
        <div className="bg-white rounded-xl shadow-lg p-6 md:p-8">
          {!sent ? (
            <>
              {/* Authentication Method Toggle */}
              <div className={`space-y-2.5 sm:space-y-3 mb-5 sm:mb-6 ${loading ? 'opacity-90 pointer-events-none' : ''}`}>
                <label className={`group flex items-start p-3 sm:p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 active:scale-[0.98] ${
                  method === 'magic_link' 
                    ? 'border-indigo-500 bg-indigo-50/50 shadow-sm' 
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50/50'
                }`}>
                  <div className="flex items-center h-5 sm:h-5 mt-0.5 mr-3 flex-shrink-0">
                    <input
                      type="radio"
                      name="auth_method"
                      value="magic_link"
                      checked={method === 'magic_link'}
                      onChange={() => setMethod('magic_link')}
                      className="w-5 h-5 sm:w-4 sm:h-4 text-indigo-600 border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-0 cursor-pointer"
                      disabled={loading}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={`font-semibold text-sm sm:text-sm ${method === 'magic_link' ? 'text-gray-900' : 'text-gray-800'}`}>
                      Use Magic Link
                    </div>
                    <div className="text-xs text-gray-500 mt-1 leading-relaxed">
                      We'll email you a secure link to get started
                    </div>
                  </div>
                </label>
                
                <label className={`group flex items-start p-3 sm:p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 active:scale-[0.98] ${
                  method === 'password' 
                    ? 'border-indigo-500 bg-indigo-50/50 shadow-sm' 
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50/50'
                }`}>
                  <div className="flex items-center h-5 sm:h-5 mt-0.5 mr-3 flex-shrink-0">
                    <input
                      type="radio"
                      name="auth_method"
                      value="password"
                      checked={method === 'password'}
                      onChange={() => setMethod('password')}
                      className="w-5 h-5 sm:w-4 sm:h-4 text-indigo-600 border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-0 cursor-pointer"
                      disabled={loading}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={`font-semibold text-sm sm:text-sm ${method === 'password' ? 'text-gray-900' : 'text-gray-800'}`}>
                      Set Up Password Now
                    </div>
                    <div className="text-xs text-gray-500 mt-1 leading-relaxed">
                      Create a password for instant access
                    </div>
                  </div>
                </label>
              </div>

              <form onSubmit={submit} className={`space-y-4 sm:space-y-5 transition-opacity duration-200 ${loading ? 'opacity-90' : 'opacity-100'}`}>
                <div>
                  <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-2">
                    Company Name
                  </label>
                  <input
                    id="company"
                    type="text"
                    value={company}
                    onChange={e => {
                      setCompany(e.target.value);
                      if (err) setErr(null);
                    }}
                    placeholder="Enter your company name"
                    className="w-full px-4 py-3 text-base sm:text-sm border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 placeholder:text-gray-400 disabled:opacity-60 disabled:cursor-not-allowed"
                    required
                    disabled={loading}
                  />
                </div>
                
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
                    placeholder="Enter your email address"
                    className="w-full px-4 py-3 text-base sm:text-sm border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 placeholder:text-gray-400 disabled:opacity-60 disabled:cursor-not-allowed"
                    required
                    autoComplete="email"
                    inputMode="email"
                    disabled={loading}
                  />
                </div>

                {/* Password Field (Conditional) */}
                {method === 'password' && (
                  <div className="space-y-2">
                    <div className="relative">
                      <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                        Password
                      </label>
                      <input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value);
                          if (err) setErr(null);
                        }}
                        placeholder="Create a strong password"
                        className="w-full px-4 py-3 pr-12 sm:pr-11 text-base sm:text-sm border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 placeholder:text-gray-400 disabled:opacity-60 disabled:cursor-not-allowed"
                        required={method === 'password'}
                        autoComplete="new-password"
                        disabled={loading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-[38px] sm:top-[38px] text-gray-400 hover:text-gray-600 active:text-gray-700 transition-colors p-2 -mr-2 rounded-md hover:bg-gray-100 active:bg-gray-200 touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                        disabled={loading}
                      >
                        {showPassword ? (
                          <EyeOff className="h-5 w-5 sm:h-5 sm:w-5" />
                        ) : (
                          <Eye className="h-5 w-5 sm:h-5 sm:w-5" />
                        )}
                      </button>
                    </div>
                  </div>
                )}
              
                <button
                  type="submit"
                  disabled={loading || !company || !email || (method === 'password' && !password) || !isEmailValid(normalizeEmail(email))}
                  className={`w-full bg-indigo-600 text-white py-3.5 sm:py-3 px-4 rounded-lg font-semibold text-base sm:text-sm shadow-sm hover:bg-indigo-700 hover:shadow active:bg-indigo-800 active:scale-[0.98] focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 transition-all duration-200 flex items-center justify-center gap-2 touch-manipulation min-h-[44px] ${loading ? 'animate-pulse' : ''}`}
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin h-5 w-5 sm:h-4 sm:w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Creating Workspace...</span>
                    </>
                  ) : (
                    <span>Create Workspace</span>
                  )}
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
            </>
          ) : (
            /* Success State */
            <div className="text-center py-4">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-6">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Workspace Created!</h3>
              <p className="text-gray-600 mb-6">
                {method === 'password' 
                  ? `Check your email for a verification link to ${email}. After verification, you can sign in with your password.`
                  : `Check your email for a sign-in link to ${email}`
                }
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
                  setCompany('');
                  setEmail('');
                  setPassword('');
                  setMethod('magic_link');
                }}
                className="text-indigo-600 hover:text-indigo-500 font-medium text-sm"
              >
                Create another workspace
              </button>
            </div>
          )}

          {/* Terms and Privacy */}
          <div className="mt-4 md:mt-6 text-center text-xs text-gray-500">
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

        {/* Link to Signin */}
        <div className="mt-4 md:mt-6 text-center">
          <p className="text-sm text-gray-600">
            Already have a workspace?{' '}
            <Link href="/signin" className="text-indigo-600 hover:text-indigo-500 font-medium">
              Sign in
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
}