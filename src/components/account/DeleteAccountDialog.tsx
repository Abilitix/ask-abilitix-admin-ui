'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertTriangle, X, Loader2, Mail } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

type DeleteAccountDialogProps = {
  open: boolean;
  onClose: () => void;
};

type OwnerError = {
  code: string;
  message: string;
  tenants: string[];
};

export function DeleteAccountDialog({ open, onClose }: DeleteAccountDialogProps) {
  const router = useRouter();
  const [step, setStep] = useState<'password' | 'otp'>('password');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [ownerError, setOwnerError] = useState<OwnerError | null>(null);
  const [otpSent, setOtpSent] = useState(false);

  const handleClose = () => {
    if (!loading) {
      setStep('password');
      setPassword('');
      setOtp('');
      setOwnerError(null);
      setOtpSent(false);
      onClose();
    }
  };

  // Handle ESC key
  useEffect(() => {
    if (!open) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !loading) {
        handleClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [open, loading]);

  // Prevent body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  const handleRequestDeletion = async () => {
    if (!password.trim()) {
      toast.error('Please enter your password');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/auth/account/request-deletion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        
        if (error.code === 'OWNER_CANNOT_DELETE') {
          setOwnerError({
            code: error.code,
            message: error.message || 'You are the workspace owner. Transfer or delete the workspace before deleting your account.',
            tenants: error.tenants || [],
          });
          setLoading(false);
          return;
        }

        throw new Error(error.message || 'Failed to request account deletion');
      }

      // Success - proceed to OTP step
      setOtpSent(true);
      setStep('otp');
      toast.success('Verification code sent to your email');
    } catch (error: any) {
      console.error('Failed to request deletion:', error);
      toast.error(error.message || 'Failed to request account deletion. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmDeletion = async () => {
    if (!otp.trim() || otp.length !== 6) {
      toast.error('Please enter a valid 6-digit verification code');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/auth/account', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, otp }),
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || 'Failed to delete account');
      }

      const data = await response.json();

      if (data.ok) {
        if (data.soft_deleted) {
          // Complete deletion - redirect to signup
          toast.success('Account deleted successfully');
          toast.info('You can sign up again with the same email if needed.', { duration: 5000 });
          setTimeout(() => {
            window.location.href = '/signup';
          }, 3000);
        } else {
          // Removed from workspace - redirect to login
          toast.success('Removed from workspace successfully');
          toast.info('You still have access to other workspaces.', { duration: 5000 });
          setTimeout(() => {
            window.location.href = '/signin';
          }, 3000);
        }
      }
    } catch (error: any) {
      console.error('Failed to delete account:', error);
      toast.error(error.message || 'Failed to delete account. Please try again.');
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    // Re-request OTP by calling request-deletion again
    await handleRequestDeletion();
  };

  if (!open) return null;

  // Owner error dialog
  if (ownerError) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
        onClick={handleClose}
        role="dialog"
        aria-modal="true"
      >
        <Card
          className="w-full max-w-md bg-white shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <CardHeader>
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-red-50 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div className="flex-1 min-w-0">
                <CardTitle className="text-lg font-semibold text-slate-900">
                  Cannot Delete Account
                </CardTitle>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleClose}
                className="h-8 w-8 rounded-full"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-slate-700">{ownerError.message}</p>
            
            {ownerError.tenants && ownerError.tenants.length > 0 && (
              <div>
                <p className="text-sm font-medium text-slate-900 mb-2">
                  You own the following workspace(s):
                </p>
                <div className="bg-slate-50 rounded-lg p-3 space-y-1 max-h-48 overflow-y-auto">
                  {ownerError.tenants.map((tenantName, index) => (
                    <div key={index} className="text-sm text-slate-700 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-slate-400 rounded-full" />
                      {tenantName}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <Button
                variant="outline"
                onClick={handleClose}
                className="flex-1 min-h-[44px] sm:min-h-0"
              >
                Cancel
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  // Navigate to workspace settings if available
                  // For now, just show message
                  toast.info('Please go to workspace settings to transfer ownership');
                  handleClose();
                }}
                className="flex-1 min-h-[44px] sm:min-h-0"
              >
                Go to Workspace Settings
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Main deletion dialog
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
    >
      <Card
        className="w-full max-w-md bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <CardHeader>
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-red-50 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg font-semibold text-slate-900">
                {step === 'password' ? 'Delete Account' : 'Confirm Account Deletion'}
              </CardTitle>
            </div>
            {!loading && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleClose}
                className="h-8 w-8 rounded-full"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {step === 'password' ? (
            <>
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-800">
                  <strong>Warning:</strong> This action cannot be undone. All your data will be permanently removed.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="delete-password">Enter your password to confirm</Label>
                <Input
                  id="delete-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  disabled={loading}
                  className="min-h-[44px]"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !loading && password.trim()) {
                      handleRequestDeletion();
                    }
                  }}
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-2 pt-2">
                <Button
                  variant="outline"
                  onClick={handleClose}
                  disabled={loading}
                  className="flex-1 min-h-[44px] sm:min-h-0"
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleRequestDeletion}
                  disabled={loading || !password.trim()}
                  className="flex-1 min-h-[44px] sm:min-h-0"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Requesting...
                    </>
                  ) : (
                    'Request Deletion'
                  )}
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start gap-2">
                <Mail className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-blue-900 mb-1">
                    Check your email for verification code
                  </p>
                  <p className="text-xs text-blue-700">
                    Enter the 6-digit code sent to your email address. The code expires in 10 minutes.
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="delete-otp">Verification Code</Label>
                <Input
                  id="delete-otp"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                    setOtp(value);
                  }}
                  placeholder="000000"
                  disabled={loading}
                  className="min-h-[44px] text-center text-2xl tracking-widest font-mono"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !loading && otp.length === 6) {
                      handleConfirmDeletion();
                    }
                  }}
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-2 pt-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setStep('password');
                    setOtp('');
                  }}
                  disabled={loading}
                  className="flex-1 min-h-[44px] sm:min-h-0"
                >
                  Back
                </Button>
                <Button
                  variant="outline"
                  onClick={handleResendOTP}
                  disabled={loading}
                  className="flex-1 min-h-[44px] sm:min-h-0"
                >
                  Resend Code
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleConfirmDeletion}
                  disabled={loading || otp.length !== 6}
                  className="flex-1 min-h-[44px] sm:min-h-0"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    'Confirm Deletion'
                  )}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

