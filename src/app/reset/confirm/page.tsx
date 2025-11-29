'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Eye, EyeOff } from 'lucide-react';

function ResetConfirmForm() {
  const sp = useSearchParams();
  const token = sp.get('token');
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      router.replace('/forgot-password');
    }
  }, [token, router]);

  // Password validation
  const passwordValidation = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    numbers: /[0-9]/.test(password),
    symbols: /[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password),
  };

  const isPasswordValid = Object.values(passwordValidation).every(Boolean);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    
    setErr(null);
    setLoading(true);

    // Client-side password validation
    if (!isPasswordValid) {
      setErr('Please ensure your password meets all requirements.');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, new_password: password }),
        credentials: 'include',
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const errorMessage = data?.detail || data?.message || 'Link expired or invalid. Please request a new reset link.';
        setErr(errorMessage);
        setLoading(false);
        return;
      }

      // Success: Show success state briefly before redirect
      setSuccess(true);
      setTimeout(() => {
        router.push('/signin?reset=success');
      }, 1500);
    } catch (error) {
      setErr('Network error. Please check your connection and try again.');
      setLoading(false);
    }
  }

  if (!token) return null;

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
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1.5 sm:mb-2">Set your new password</h1>
          <p className="text-sm sm:text-base text-gray-600">Choose a strong password to secure your account</p>
        </div>

        {/* Reset Password Form */}
        <div className="bg-white rounded-xl shadow-lg p-6 md:p-8">
          {success ? (
            /* Success State */
            <div className="text-center py-4">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-6">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Password reset successful!</h3>
              <p className="text-gray-600 mb-6">Redirecting you to sign in...</p>
              <div className="flex justify-center">
                <div className="inline-flex items-center justify-center w-8 h-8">
                  <svg className="animate-spin w-6 h-6 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
              </div>
            </div>
          ) : (
            <>
              <form onSubmit={onSubmit} className={`space-y-4 sm:space-y-5 transition-opacity duration-200 ${loading ? 'opacity-90' : 'opacity-100'}`}>
                <div className="relative">
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                    New Password
                  </label>
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (err) setErr(null);
                    }}
                    placeholder="Enter your new password"
                    className="w-full px-4 py-3 pr-12 sm:pr-11 text-base sm:text-sm border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 placeholder:text-gray-400 disabled:opacity-60 disabled:cursor-not-allowed"
                    required
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

                {/* Password Requirements */}
                {password && (
                  <div className="space-y-1.5 text-sm bg-gray-50 border border-gray-200 rounded-lg p-3">
                    <div className="text-xs font-medium text-gray-700 mb-2">Password requirements:</div>
                    <div className={`flex items-center ${passwordValidation.length ? 'text-green-600' : 'text-gray-500'}`}>
                      <span className="mr-2 text-base">{passwordValidation.length ? '✓' : '○'}</span>
                      <span className={passwordValidation.length ? 'font-medium' : ''}>At least 8 characters</span>
                    </div>
                    <div className={`flex items-center ${passwordValidation.uppercase ? 'text-green-600' : 'text-gray-500'}`}>
                      <span className="mr-2 text-base">{passwordValidation.uppercase ? '✓' : '○'}</span>
                      <span className={passwordValidation.uppercase ? 'font-medium' : ''}>One uppercase letter</span>
                    </div>
                    <div className={`flex items-center ${passwordValidation.lowercase ? 'text-green-600' : 'text-gray-500'}`}>
                      <span className="mr-2 text-base">{passwordValidation.lowercase ? '✓' : '○'}</span>
                      <span className={passwordValidation.lowercase ? 'font-medium' : ''}>One lowercase letter</span>
                    </div>
                    <div className={`flex items-center ${passwordValidation.numbers ? 'text-green-600' : 'text-gray-500'}`}>
                      <span className="mr-2 text-base">{passwordValidation.numbers ? '✓' : '○'}</span>
                      <span className={passwordValidation.numbers ? 'font-medium' : ''}>One number</span>
                    </div>
                    <div className={`flex items-center ${passwordValidation.symbols ? 'text-green-600' : 'text-gray-500'}`}>
                      <span className="mr-2 text-base">{passwordValidation.symbols ? '✓' : '○'}</span>
                      <span className={passwordValidation.symbols ? 'font-medium' : ''}>One symbol (!@#$%^&*...)</span>
                    </div>
                  </div>
                )}

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
                  disabled={loading || !password || !isPasswordValid}
                  className={`w-full bg-indigo-600 text-white py-3.5 sm:py-3 px-4 rounded-lg font-semibold text-base sm:text-sm shadow-sm hover:bg-indigo-700 hover:shadow active:bg-indigo-800 active:scale-[0.98] focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 transition-all duration-200 flex items-center justify-center gap-2 touch-manipulation min-h-[44px] ${loading ? 'animate-pulse' : ''}`}
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin h-5 w-5 sm:h-4 sm:w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Setting password...</span>
                    </>
                  ) : (
                    <span>Set password</span>
                  )}
                </button>
              </form>

              {/* Helper Text */}
              <div className="mt-4 md:mt-6 text-center">
                <p className="text-sm text-gray-600">
                  Remember your password?{' '}
                  <Link href="/signin" className="text-indigo-600 hover:text-indigo-500 font-medium">
                    Sign in
                  </Link>
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ResetConfirmPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen min-h-[100dvh] overflow-y-auto bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-xl shadow-lg p-6 md:p-8">
            <div className="text-center py-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-6">
                <svg className="animate-spin w-8 h-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Loading...</h3>
              <p className="text-gray-600">Please wait while we load the reset page</p>
            </div>
          </div>
        </div>
      </div>
    }>
      <ResetConfirmForm />
    </Suspense>
  );
}
