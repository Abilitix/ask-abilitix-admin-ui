'use client';
import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { isEmailValid, normalizeEmail } from '@/utils/email';
import { ApiErrorCode } from '@/types/errors';
// import EmailPasswordForm from '@/components/auth/EmailPasswordForm';

function SignInForm() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [tokenLoading, setTokenLoading] = useState(false);
  const searchParams = useSearchParams();
  
  // Feature flag for email/password login
  const showPasswordLogin = process.env.NEXT_PUBLIC_ALLOW_PASSWORD_LOGIN === "1";

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
    
    try {
      const r = await fetch('/api/public/signin', {
        method: 'POST', 
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ email: normalizedEmail }),
      });
      
      if (!r.ok) { 
        const errorData = await r.json();
        
        // Handle specific error codes
        if (errorData?.detail?.code === 'INVALID_EMAIL_FORMAT') {
          setErr('Please check email format and try again.');
        } else {
          setErr('Please check email format and try again.');
        }
        return; 
      }
      
      // Parse the response to check status
      const responseData = await r.json();
      
      if (responseData.status === 'email_sent') {
        // Store email in localStorage for recovery functionality
        if (typeof window !== 'undefined') {
          localStorage.setItem('last_signin_email', normalizedEmail);
        }
        setSent(true);  // Show success state
      } else if (responseData.status === 'user_not_found') {
        setErr(responseData.message);  // Show "No account found" message
      } else if (responseData.status === 'error') {
        setErr(responseData.message);  // Show error message
      } else {
        setErr('Unexpected response from server');
      }
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
        <div className="text-center mb-6 md:mb-8">
          <div className="flex justify-center mb-4 md:mb-6">
            <Image
              src="/abilitix-logo.png"
              alt="Abilitix"
              width={64}
              height={64}
              priority
              className="rounded-lg"
            />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome back</h1>
          <p className="text-gray-600">Sign in to your workspace</p>
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
                     {/* Email/Password Form - Temporarily disabled for debugging */}
                     {/* {false && showPasswordLogin && (
                       <div className="mb-6">
                         <EmailPasswordForm />
                         <div className="text-center text-sm text-gray-500 my-4">or</div>
                       </div>
                     )} */}
                     {/* Magic Link Form */}
                     <form onSubmit={submit} className="space-y-4 md:space-y-6">
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
                           className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                           aria-invalid={!!err}
                           aria-describedby={err ? "email-error" : undefined}
                           required
                         />
                       </div>
                       
                       <button
                         type="submit"
                         disabled={loading || !isEmailValid(normalizeEmail(email))}
                         className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                       >
                         {loading ? 'Sending link...' : 'Send Magic Link'}
                       </button>

                       {/* Helper Text */}
                       <div className="mt-4 text-sm text-gray-600 text-center">
                         <p>We'll email you a secure link to access your workspace</p>
                       </div>

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