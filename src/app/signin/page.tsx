'use client';
import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams, useRouter } from 'next/navigation';
import { isEmailValid, normalizeEmail } from '@/utils/email';
import { ApiErrorCode } from '@/types/errors';
import { Eye, EyeOff, Lock, ArrowRight } from 'lucide-react';
import { SegmentedControl } from '@/components/ui/segmented-control';

function SignInForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [method, setMethod] = useState<'magic_link' | 'password'>('password');
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
    <div className="min-h-screen min-h-[100dvh] overflow-y-auto bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4 py-8 sm:py-12">
      <div className="max-w-md w-full my-auto">
        {/* Header with Logo - Fade-in animation */}
        <div className="text-center mb-4 sm:mb-5 md:mb-6">
          <div className="flex justify-center mb-6 sm:mb-7 md:mb-8">
            <Image
              src="/abilitix-logo.png"
              alt="Abilitix"
              width={88}
              height={88}
              priority
              className="rounded-lg"
            />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1 sm:mb-1.5">Welcome back</h1>
          <p className="text-sm sm:text-base text-gray-600">Sign in to your workspace</p>
        </div>

               {/* Sign-in Form - Enhanced shadow with glass effect */}
               <div className="relative bg-white rounded-[20px] shadow-xl p-5 sm:p-6 md:p-8 overflow-hidden">
                 {/* Glass reflection overlay */}
                 <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />
                 <div className="relative">
                 {tokenLoading ? (
                   /* Token Exchange Loading State */
                   <div className="text-center py-8 relative z-10">
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
                   <div className="relative z-10">
                     {/* Authentication Method Toggle - Segmented Control */}
                     <div className={`mb-4 sm:mb-5 ${loading ? 'opacity-90 pointer-events-none' : ''}`}>
                      <SegmentedControl
                        options={[
                          { value: 'password', label: 'Password' },
                          { value: 'magic_link', label: 'Magic Link' },
                        ]}
                         value={method}
                         onChange={(value) => setMethod(value as 'magic_link' | 'password')}
                         disabled={loading}
                       />
                     </div>
                     
                     {/* Sign-in Form */}
                     <form onSubmit={submit} className={`space-y-3.5 sm:space-y-4 md:space-y-5 transition-opacity duration-200 ${(loading || redirecting) ? 'opacity-90' : 'opacity-100'}`}>
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
                           className="w-full px-4 py-3 text-base sm:text-sm bg-[#F8F9FC] border border-[#D0D5DD] rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 placeholder:text-gray-400 disabled:opacity-60 disabled:cursor-not-allowed"
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
                               className="w-full px-4 py-3 pr-12 sm:pr-11 text-base sm:text-sm bg-[#F8F9FC] border border-[#D0D5DD] rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 placeholder:text-gray-400 disabled:opacity-60 disabled:cursor-not-allowed"
                               required={method === 'password'}
                               autoComplete="current-password"
                               disabled={loading}
                             />
                             <button
                               type="button"
                               onClick={() => setShowPassword(!showPassword)}
                               className="absolute right-3 top-[38px] sm:top-[38px] text-[#98A2B3] hover:text-gray-600 active:text-gray-700 transition-colors p-2 -mr-2 rounded-md hover:bg-gray-100 active:bg-gray-200 touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed"
                               aria-label={showPassword ? 'Hide password' : 'Show password'}
                               disabled={loading}
                             >
                               {showPassword ? (
                                 <EyeOff className="h-4 w-4" />
                               ) : (
                                 <Eye className="h-4 w-4" />
                               )}
                             </button>
                           </div>
                           <div className="flex items-center justify-end pt-1">
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
                         className={`w-full bg-indigo-600 text-white py-3.5 sm:py-3 px-4 rounded-xl font-semibold text-base sm:text-sm shadow-[0_4px_10px_rgba(62,44,195,0.25)] hover:bg-indigo-700 hover:shadow-[0_4px_12px_rgba(62,44,195,0.3)] active:bg-indigo-800 active:scale-[0.98] focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 transition-all duration-200 flex items-center justify-center gap-2 touch-manipulation min-h-[48px] ${(loading || redirecting) ? 'animate-pulse' : ''}`}
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
                           <>
                             <Lock className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
                             <span>{method === 'password' ? 'Sign In' : 'Continue'}</span>
                           </>
                         )}
                       </button>

                       {/* Trust Microcopy */}
                       {method === 'magic_link' && (
                         <div className="mt-3 text-xs text-gray-500 text-center leading-relaxed">
                           <p className="opacity-60">You will receive a secure sign-in link.</p>
                           <p className="opacity-60">No password required.</p>
                         </div>
                       )}

                       {/* Error Message - Enhanced with better UX */}
                       {err && (
                         <div id="email-error" role="alert" aria-live="assertive" className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                           <div className="flex">
                             <svg className="w-5 h-5 text-red-400 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                               <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                             </svg>
                             <div className="text-sm text-red-700">
                               <div className="font-medium mb-1">{err}</div>
                               {err.includes('No account found') && (
                                 <div className="mt-2 text-xs text-gray-600">
                                   <Link href="/signup" className="text-indigo-600 hover:text-indigo-500 font-medium underline">
                                     Create your workspace
                                   </Link>
                                 </div>
                               )}
                             </div>
                           </div>
                         </div>
                       )}
                     </form>
                   </div>
          ) : (
            /* Success State */
            <div className="text-center py-4 relative z-10">
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
          <div className="mt-3 sm:mt-4 md:mt-6 text-center text-xs text-gray-500 relative z-10">
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
               </div>

        {/* Link to Signup */}
        <div className="mt-6 sm:mt-8 text-center pb-4">
          <p className="text-sm text-gray-600 mb-2">
            <span className="font-bold">New to Ask AbilitiX?</span>
          </p>
          <Link 
            href="/signup" 
            className="inline-flex items-center gap-1.5 text-[#6941C6] hover:text-indigo-700 font-semibold text-sm transition-colors group"
          >
            Create your workspace
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>

      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen min-h-[100dvh] bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4 py-8 sm:py-12">
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