'use client';
import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams, useRouter } from 'next/navigation';
import { isEmailValid, normalizeEmail } from '@/utils/email';
import { ApiErrorCode } from '@/types/errors';
import { Eye, EyeOff } from 'lucide-react';

function SignInForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [method, setMethod] = useState<'magic_link' | 'password'>('magic_link');
  const [showPassword, setShowPassword] = useState(false);
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const [tokenLoading, setTokenLoading] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();

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
      window.location.replace('/admin');
    } catch (error) {
      console.error('Magic link error:', error);
      setErr('Magic link verification failed. Please try again.');
    } finally {
      setTokenLoading(false);
    }
  }

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
      setErr('Please enter your password.');
      setLoading(false);
      return;
    }
    
    let passwordLoginSuccess = false;
    
    try {
      // Determine endpoint and body based on method
      // Both use proxy routes to handle cookie management properly (same domain)
      const endpoint = method === 'password' 
        ? '/api/auth/login'  // Proxy route for password login (sets cookie on UI domain)
        : '/api/public/signin';  // Proxy route for magic link (existing behavior)
      
      const body = method === 'password'
        ? { email: normalizedEmail, password }
        : { email: normalizedEmail };

      const r = await fetch(endpoint, {
        method: 'POST', 
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(body),
        credentials: 'include',  // ← CRITICAL: Backend sets cookie
      });
      
      const data = await r.json().catch(() => ({}));

      if (!r.ok || !data.ok) {
        // Handle specific error codes
        if (r.status === 404 && method === 'password') {
          setErr('Password login is not available. Please use magic link.');
        } else if (r.status === 401) {
          setErr('Invalid email or password.');
        } else if (r.status === 403 && data.detail?.code === 'EMAIL_NOT_VERIFIED') {
          setErr('Please verify your email address first.');
        } else if (r.status === 403 && data.detail?.code === 'NO_TENANT_ACCESS') {
          setErr('Account has no workspace access. Please contact your administrator.');
        } else if (r.status === 429) {
          setErr('Too many attempts. Please try again later.');
        } else if (data.status === 'user_not_found') {
          setErr(data.message || 'No account found with this email address.');
        } else {
          setErr(data.message || data.detail?.message || 'An error occurred. Please try again.');
        }
        return; 
      }

      // Success handling
      if (method === 'password') {
        // Password login: Backend has set aa_sess cookie automatically
        // Show "Redirecting..." message and keep loading state active (no gap)
        passwordLoginSuccess = true;
        setRedirecting(true);
        // Use window.location.replace() for faster redirect (matches Stripe/Notion pattern)
        // Small delay to show "Redirecting..." message
        setTimeout(() => {
          window.location.replace('/admin');
        }, 100);
        // Don't set loading = false - page will unload anyway
        return;
      } else {
        // Magic link: Show success state
        if (data.status === 'email_sent') {
          // Store email in localStorage for recovery functionality
          if (typeof window !== 'undefined') {
            localStorage.setItem('last_signin_email', normalizedEmail);
          }
          setSent(true);  // Show success state
        } else {
          setErr('Unexpected response from server');
        }
      }
    } catch (error) {
      setErr('Unable to connect. Please check your internet connection and try again.');
    } finally {
      // Only set loading = false if not redirecting (password login keeps loading until redirect)
      if (!passwordLoginSuccess) {
        setLoading(false);
      }
      // For password login success, loading stays true until redirect (page unloads)
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
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1.5 sm:mb-2">Welcome back</h1>
          <p className="text-sm sm:text-base text-gray-600">Sign in to your workspace</p>
        </div>

               {/* Sign-in Form */}
               <div className="bg-white rounded-xl shadow-lg p-6 md:p-8">
                 {tokenLoading ? (
                   /* Token Exchange Loading State */
                   <div className="text-center py-8">
                     <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-6">
                       <svg className="animate-spin w-8 h-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                         <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                         <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                       </svg>
                     </div>
                     <h3 className="text-xl font-semibold text-gray-900 mb-3">Verifying your magic link</h3>
                     <p className="text-gray-600">Please wait while we sign you in...</p>
                   </div>
                 ) : !sent ? (
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
                               Continue with Magic Link
                             </div>
                             <div className="text-xs text-gray-500 mt-1 leading-relaxed">
                               We'll email you a secure link to access your workspace
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
                               Continue with Password
                             </div>
                             <div className="text-xs text-gray-500 mt-1 leading-relaxed">
                               Sign in instantly with your password
                             </div>
                           </div>
                         </label>
                       </div>
                     
                     {/* Sign-in Form */}
                     <form onSubmit={submit} className={`space-y-4 sm:space-y-5 transition-opacity duration-200 ${(loading || redirecting) ? 'opacity-90' : 'opacity-100'}`}>
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
                             // Clear error when user starts typing
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
                               placeholder="Enter your password"
                               className="w-full px-4 py-3 pr-12 sm:pr-11 text-base sm:text-sm border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 placeholder:text-gray-400 disabled:opacity-60 disabled:cursor-not-allowed"
                               required={method === 'password'}
                               autoComplete="current-password"
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
                           <div className="flex justify-end pt-1">
                             <Link
                               href="/forgot-password"
                               className="text-sm font-medium text-indigo-600 hover:text-indigo-700 active:text-indigo-800 transition-colors py-1 -mr-1 pr-1 touch-manipulation"
                             >
                               Forgot password?
                             </Link>
                           </div>
                         </div>
                       )}
                       
                       <button
                         type="submit"
                         disabled={loading || redirecting || !email || (method === 'password' && !password) || !isEmailValid(normalizeEmail(email))}
                         className={`w-full bg-indigo-600 text-white py-3.5 sm:py-3 px-4 rounded-lg font-semibold text-base sm:text-sm shadow-sm hover:bg-indigo-700 hover:shadow active:bg-indigo-800 active:scale-[0.98] focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 transition-all duration-200 flex items-center justify-center gap-2 touch-manipulation min-h-[44px] ${(loading || redirecting) ? 'animate-pulse' : ''}`}
                       >
                         {loading || redirecting ? (
                           <>
                             <svg className="animate-spin h-5 w-5 sm:h-4 sm:w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                               <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                               <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                             </svg>
                             <span>
                               {redirecting 
                                 ? 'Redirecting...' 
                                 : (method === 'password' ? 'Signing in...' : 'Sending link...')
                               }
                             </span>
                           </>
                         ) : (
                           <span>{method === 'password' ? 'Sign In' : 'Send Magic Link'}</span>
                         )}
                       </button>

                       {/* Helper Text (only for magic link) */}
                       {method === 'magic_link' && (
                         <div className="mt-3 text-xs text-gray-500 text-center">
                           <p>We'll email you a secure link to access your workspace</p>
                         </div>
                       )}

                       {/* Error Message */}
                       {err && (
                         <div id="email-error" role="alert" aria-live="assertive" className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                           <div className="flex">
                             <svg className="w-5 h-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                               <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                             </svg>
                             <div className="text-sm text-red-700">
                               {err}
                               {err.includes('No account found') && (
                                 <div className="mt-2">
                                   <span className="text-gray-600">New to AbilitiX? </span>
                                   <Link href="/signup" className="text-indigo-600 hover:text-indigo-500 font-medium underline">
                                     Create your workspace below
                                   </Link>
                                 </div>
                               )}
                             </div>
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

        {/* Link to Signup */}
        <div className="mt-4 md:mt-6 text-center">
          <p className="text-sm text-gray-600">
            <span className="font-bold">New to AbilitiX?</span>{' '}
            <Link href="/signup" className="text-indigo-600 hover:text-indigo-500 font-medium">
              Create your workspace
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen min-h-[100dvh] overflow-y-auto bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-6">
            <svg className="animate-spin w-8 h-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <SignInForm />
    </Suspense>
  );
}