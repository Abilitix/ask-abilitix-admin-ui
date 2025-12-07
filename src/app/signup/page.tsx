'use client';
import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Eye, EyeOff, Lock, ArrowRight } from 'lucide-react';
import { isEmailValid, normalizeEmail } from '@/utils/email';
import { SegmentedControl } from '@/components/ui/segmented-control';

export default function SignupPage() {
  const [company, setCompany] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [method, setMethod] = useState<'magic_link' | 'password'>('password');
  const [showPassword, setShowPassword] = useState(false);
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState<string|null>(null);
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  // Password validation (real-time)
  const passwordValidation = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    numbers: /[0-9]/.test(password),
    symbols: /[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password),
  };

  const isPasswordValid = Object.values(passwordValidation).every(Boolean);

  async function submit(e: React.FormEvent) {
    e.preventDefault(); 
    setErr(null);
    setPasswordErrors([]);
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
    if (method === 'password') {
      if (!password) {
        setErr('Please enter a password.');
        setLoading(false);
        return;
      }
      
      // Client-side password validation
      if (!isPasswordValid) {
        const missingRequirements = [];
        if (!passwordValidation.length) missingRequirements.push('at least 8 characters');
        if (!passwordValidation.uppercase) missingRequirements.push('one uppercase letter');
        if (!passwordValidation.lowercase) missingRequirements.push('one lowercase letter');
        if (!passwordValidation.numbers) missingRequirements.push('one number');
        if (!passwordValidation.symbols) missingRequirements.push('one symbol');
        
        setErr(`Password must contain ${missingRequirements.join(', ')}.`);
        setLoading(false);
        return;
      }
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
      
      // Handle specific HTTP status codes per validation document
      if (r.status === 409) {
        // Email already exists
        const data = await r.json();
        setErr(data.detail?.message || data.message || 'An account with this email address already exists. Please sign in instead.');
        setLoading(false);
        return;
      }
      
      if (!r.ok) {
        const errorData = await r.json().catch(() => ({}));
        
        // Handle specific error codes per validation document
        if (r.status === 400) {
          // 400 Bad Request - Validation errors
          if (errorData.detail?.error === 'invalid_password') {
            // Invalid password with errors array
            const errorsArray = errorData.detail.errors || [];
            setErr(errorData.detail.message || 'Password does not meet requirements');
            if (errorsArray.length > 0) {
              setPasswordErrors(errorsArray);
            }
          } else if (errorData.detail?.error === 'invalid_request') {
            // Invalid email format or empty company name
            // Check which field is invalid based on error context
            if (errorData.detail.message) {
              setErr(errorData.detail.message);
            } else {
              // Generic validation error - check field names in detail
              const fieldErrors = Array.isArray(errorData.detail) 
                ? errorData.detail.filter((err: any) => err.loc && Array.isArray(err.loc))
                : [];
              
              const emailError = fieldErrors.find((err: any) => err.loc?.includes('email'));
              const companyError = fieldErrors.find((err: any) => err.loc?.includes('company_name') || err.loc?.includes('company'));
              
              if (emailError) {
                setErr('Please enter a valid email address');
              } else if (companyError) {
                setErr('Company name is required');
              } else {
                setErr('Please check your input and try again');
              }
            }
          } else {
            // Other 400 errors - try to parse
            if (errorData.detail?.message) {
              setErr(errorData.detail.message);
            } else if (Array.isArray(errorData.detail)) {
              // FastAPI validation errors array
              const emailError = errorData.detail.find((err: any) => err.loc?.includes('email'));
              const companyError = errorData.detail.find((err: any) => err.loc?.includes('company_name') || err.loc?.includes('company'));
              const passwordError = errorData.detail.find((err: any) => err.loc?.includes('password'));
              
              if (emailError) {
                setErr('Please enter a valid email address');
              } else if (companyError) {
                setErr('Company name is required');
              } else if (passwordError) {
                setErr(`Password: ${passwordError.msg || 'does not meet requirements'}`);
              } else {
                const messages = errorData.detail.map((err: any) => err.msg || JSON.stringify(err)).join(', ');
                setErr(messages || 'Please check your input and try again');
              }
            } else {
              setErr('Please check your input and try again');
            }
          }
        } else if (r.status === 429) {
          // Rate limiting
          setErr('Too many signup attempts. Please try again in a few minutes.');
        } else if (r.status === 403) {
          // Signup disabled
          if (errorData.detail === 'signup_disabled' || errorData.detail?.error === 'signup_disabled') {
            setErr('Signup is currently disabled. Please contact support.');
          } else {
            setErr(errorData.detail?.message || errorData.message || 'Access denied. Please contact support.');
          }
        } else if (r.status === 500) {
          // Internal server error
          setErr('Something went wrong. Please try again later.');
        } else {
          // Other errors - fallback parsing
          if (errorData.detail?.message) {
            setErr(errorData.detail.message);
          } else if (errorData.detail?.error) {
            setErr(errorData.detail.error);
          } else if (errorData.message) {
            setErr(errorData.message);
          } else if (typeof errorData.detail === 'string') {
            setErr(errorData.detail);
          } else {
            setErr('Signup failed. Please check your information and try again.');
          }
        }
        
        setLoading(false);
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
    <div className="min-h-screen min-h-[100dvh] bg-gradient-to-br from-blue-50 to-indigo-100 flex items-start justify-center p-4 pt-8 sm:pt-12">
      <div className="max-w-md w-full">
        {/* Header with Logo - Compact spacing */}
        <div className="text-center mb-4">
          <div className="flex justify-center mb-3">
            <Image
              src="/abilitix-logo.png"
              alt="Abilitix"
              width={64}
              height={64}
              priority
              className="rounded-lg"
            />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">Welcome to Ask Abilitix</h1>
          <p className="text-sm sm:text-base text-gray-600">Create your AI-powered workspace</p>
        </div>

        {/* Signup Form - Enhanced shadow with glass effect */}
        <div className="relative bg-white rounded-[20px] shadow-xl p-5 sm:p-6 overflow-hidden">
          {/* Glass reflection overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />
          <div className="relative">
          {!sent ? (
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

              <form onSubmit={submit} className={`space-y-3.5 sm:space-y-4 md:space-y-5 transition-opacity duration-200 ${loading ? 'opacity-90' : 'opacity-100'}`}>
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
                      if (passwordErrors.length > 0) setPasswordErrors([]);
                    }}
                    placeholder="Enter your company name"
                    className="w-full px-4 py-3 text-base sm:text-sm bg-[#F8F9FC] border border-[#D0D5DD] rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 placeholder:text-gray-400 disabled:opacity-60 disabled:cursor-not-allowed"
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
                      if (passwordErrors.length > 0) setPasswordErrors([]);
                    }}
                    placeholder="Enter your email address"
                    className="w-full px-4 py-3 text-base sm:text-sm bg-[#F8F9FC] border border-[#D0D5DD] rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 placeholder:text-gray-400 disabled:opacity-60 disabled:cursor-not-allowed"
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
                            if (passwordErrors.length > 0) setPasswordErrors([]);
                          }}
                        onFocus={() => setPasswordFocused(true)}
                        onBlur={() => setPasswordFocused(false)}
                        placeholder="Create a strong password"
                        className="w-full px-4 py-3 pr-12 sm:pr-11 text-base sm:text-sm bg-[#F8F9FC] border border-[#D0D5DD] rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 placeholder:text-gray-400 disabled:opacity-60 disabled:cursor-not-allowed"
                        required={method === 'password'}
                        autoComplete="new-password"
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

                    {/* Password Requirements - Best-in-class SaaS UI */}
                    {(password || passwordFocused) && (
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-3.5 space-y-1.5">
                        <div className="text-xs font-semibold text-gray-700 mb-2">Password requirements:</div>
                        <div className={`flex items-center transition-colors ${passwordValidation.length ? 'text-green-600' : 'text-gray-500'}`}>
                          <span className="mr-2.5 text-base font-medium">{passwordValidation.length ? '✓' : '○'}</span>
                          <span className={`text-sm ${passwordValidation.length ? 'font-medium' : ''}`}>At least 8 characters</span>
                        </div>
                        <div className={`flex items-center transition-colors ${passwordValidation.uppercase ? 'text-green-600' : 'text-gray-500'}`}>
                          <span className="mr-2.5 text-base font-medium">{passwordValidation.uppercase ? '✓' : '○'}</span>
                          <span className={`text-sm ${passwordValidation.uppercase ? 'font-medium' : ''}`}>One uppercase letter</span>
                        </div>
                        <div className={`flex items-center transition-colors ${passwordValidation.lowercase ? 'text-green-600' : 'text-gray-500'}`}>
                          <span className="mr-2.5 text-base font-medium">{passwordValidation.lowercase ? '✓' : '○'}</span>
                          <span className={`text-sm ${passwordValidation.lowercase ? 'font-medium' : ''}`}>One lowercase letter</span>
                        </div>
                        <div className={`flex items-center transition-colors ${passwordValidation.numbers ? 'text-green-600' : 'text-gray-500'}`}>
                          <span className="mr-2.5 text-base font-medium">{passwordValidation.numbers ? '✓' : '○'}</span>
                          <span className={`text-sm ${passwordValidation.numbers ? 'font-medium' : ''}`}>One number</span>
                        </div>
                        <div className={`flex items-center transition-colors ${passwordValidation.symbols ? 'text-green-600' : 'text-gray-500'}`}>
                          <span className="mr-2.5 text-base font-medium">{passwordValidation.symbols ? '✓' : '○'}</span>
                          <span className={`text-sm ${passwordValidation.symbols ? 'font-medium' : ''}`}>One symbol (!@#$%^&*...)</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              
                <button
                  type="submit"
                  disabled={loading || !company || !email || (method === 'password' && (!password || !isPasswordValid)) || !isEmailValid(normalizeEmail(email))}
                  className={`w-full bg-indigo-600 text-white py-3.5 sm:py-3 px-4 rounded-xl font-semibold text-base sm:text-sm shadow-[0_4px_10px_rgba(62,44,195,0.25)] hover:bg-indigo-700 hover:shadow-[0_4px_12px_rgba(62,44,195,0.3)] active:bg-indigo-800 active:scale-[0.98] focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 transition-all duration-200 flex items-center justify-center gap-2 touch-manipulation min-h-[48px] ${loading ? 'animate-pulse' : ''}`}
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
                    <>
                      <Lock className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
                      <span>Create Workspace</span>
                    </>
                  )}
                </button>

              {/* Error Message - Enhanced with better UX */}
              {err && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg" role="alert" aria-live="assertive">
                  <div className="flex">
                    <svg className="w-5 h-5 text-red-400 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    <div className="text-sm text-red-700 flex-1">
                      <div className="font-medium mb-1">{err}</div>
                      {/* Password errors array - display as bulleted list */}
                      {passwordErrors.length > 0 && (
                        <ul className="mt-2 space-y-1 list-disc list-inside text-xs">
                          {passwordErrors.map((error, index) => (
                            <li key={index}>{error}</li>
                          ))}
                        </ul>
                      )}
                      {err.includes('already exists') && (
                        <div className="mt-2 text-xs text-gray-600">
                          <Link href="/signin" className="text-indigo-600 hover:text-indigo-500 font-medium underline">
                            Sign in to your account
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
          <div className="mt-3 text-center text-xs text-gray-500 relative z-10">
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

        {/* Link to Signin */}
        <div className="mt-3 text-center">
          <p className="text-sm text-gray-600 mb-2">
            Already have a workspace?
          </p>
          <Link 
            href="/signin" 
            className="inline-flex items-center gap-1.5 text-[#6941C6] hover:text-indigo-700 font-semibold text-sm transition-colors group"
          >
            Sign in
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>

      </div>
    </div>
  );
}