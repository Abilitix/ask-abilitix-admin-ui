'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface PasswordValidation {
  length: boolean;
  uppercase: boolean;
  lowercase: boolean;
  numbers: boolean;
  symbols: boolean;
}

interface LoginResponse {
  ok: boolean;
  user: {
    id: string;
    email: string;
    name: string;
    email_verified: boolean;
  };
  tenant: {
    id: string;
    name: string;
    slug: string;
    role: string;
  };
  tenants: Array<{
    id: string;
    name: string;
    slug: string;
    role: string;
  }>;
}

interface ErrorResponse {
  detail: {
    code: string;
    message: string;
  };
}

export default function EmailPasswordForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // Password validation
  const validatePassword = (pwd: string): PasswordValidation => ({
    length: pwd.length >= 8,
    uppercase: /[A-Z]/.test(pwd),
    lowercase: /[a-z]/.test(pwd),
    numbers: /\d/.test(pwd),
    symbols: /[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(pwd),
  });

  const passwordValidation = validatePassword(password);
  const isPasswordValid = Object.values(passwordValidation).every(Boolean);
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const canSubmit = isEmailValid && isPasswordValid && !isLoading;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        // Success - session cookie is set by the API
        const loginData = data as LoginResponse;
        console.log('Login successful:', loginData);
        
        // Redirect to dashboard
        router.push('/admin');
        router.refresh();
      } else {
        // Handle specific error codes
        const errorData = data as ErrorResponse;
        handleLoginError(errorData.detail.code, errorData.detail.message);
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Unable to connect, please try again');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoginError = (code: string, message: string) => {
    switch (code) {
      case 'INVALID_CREDENTIALS':
        setError('Invalid email or password');
        break;
      case 'EMAIL_NOT_VERIFIED':
        setError('Please verify your email address before signing in');
        break;
      case 'NO_TENANT_ACCESS':
        setError('Account has no workspace access. Please contact your administrator.');
        break;
      case 'rate_limited':
        setError('Too many attempts, try again later');
        break;
      default:
        setError(message || 'An error occurred during sign in');
    }
  };

  const handleResendVerification = async () => {
    // TODO: Implement resend verification email
    console.log('Resend verification for:', email);
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Sign in with Email</CardTitle>
        <CardDescription>
          Enter your email and password to access your workspace
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email Field */}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
              required
              className={email && !isEmailValid ? 'border-red-500' : ''}
            />
            {email && !isEmailValid && (
              <p className="text-sm text-red-500">Please enter a valid email address</p>
            )}
          </div>

          {/* Password Field */}
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                className={password && !isPasswordValid ? 'border-red-500' : ''}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
            
            {/* Password Requirements */}
            {password && (
              <div className="space-y-1 text-sm">
                <div className={`flex items-center ${passwordValidation.length ? 'text-green-600' : 'text-red-500'}`}>
                  <span className="mr-2">{passwordValidation.length ? '✓' : '✗'}</span>
                  At least 8 characters
                </div>
                <div className={`flex items-center ${passwordValidation.uppercase ? 'text-green-600' : 'text-red-500'}`}>
                  <span className="mr-2">{passwordValidation.uppercase ? '✓' : '✗'}</span>
                  One uppercase letter
                </div>
                <div className={`flex items-center ${passwordValidation.lowercase ? 'text-green-600' : 'text-red-500'}`}>
                  <span className="mr-2">{passwordValidation.lowercase ? '✓' : '✗'}</span>
                  One lowercase letter
                </div>
                <div className={`flex items-center ${passwordValidation.numbers ? 'text-green-600' : 'text-red-500'}`}>
                  <span className="mr-2">{passwordValidation.numbers ? '✓' : '✗'}</span>
                  One number
                </div>
                <div className={`flex items-center ${passwordValidation.symbols ? 'text-green-600' : 'text-red-500'}`}>
                  <span className="mr-2">{passwordValidation.symbols ? '✓' : '✗'}</span>
                  One symbol (!@#$%^&*()_+-=[]{}|;:,.<>?)
                </div>
              </div>
            )}
          </div>

          {/* Error Display */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
              {error.includes('verify your email') && (
                <button
                  type="button"
                  onClick={handleResendVerification}
                  className="mt-2 text-sm text-blue-600 hover:text-blue-800 underline"
                >
                  Resend verification email
                </button>
              )}
            </div>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full"
            disabled={!canSubmit}
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Signing in...
              </>
            ) : (
              'Sign in'
            )}
          </Button>
        </form>

        {/* Forgot Password Link */}
        <div className="mt-4 text-center">
          <a
            href="/forgot-password"
            className="text-sm text-blue-600 hover:text-blue-800 underline"
          >
            Forgot your password?
          </a>
        </div>
      </CardContent>
    </Card>
  );
}
