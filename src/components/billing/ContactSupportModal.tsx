'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, X, Mail, MessageSquare } from 'lucide-react';
import type { Plan } from '@/lib/types/billing';

type ContactSupportModalProps = {
  open: boolean;
  onClose: () => void;
  plan: Plan | null;
  tenantName?: string;
};

export function ContactSupportModal({
  open,
  onClose,
  plan,
  tenantName,
}: ContactSupportModalProps) {
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (open) {
      setMessage('');
      setSubmitted(false);
    }
  }, [open]);

  // Handle ESC key
  useEffect(() => {
    if (!open) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !loading) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [open, loading, onClose]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!plan || loading) return;

    setLoading(true);

    try {
      // Build email content
      const subject = encodeURIComponent(`Plan Upgrade Request: ${plan.name}`);
      
      // Format price safely
      const monthlyPrice = plan.price_monthly_cents 
        ? `$${(plan.price_monthly_cents / 100).toFixed(2)}`
        : 'Contact for pricing';
      const annualPrice = plan.price_annual_cents 
        ? `$${(plan.price_annual_cents / 100).toFixed(2)}`
        : null;
      
      const body = encodeURIComponent(
        `Hello Abilitix Support,

I would like to upgrade to the ${plan.name} plan.

Plan Details:
- Plan: ${plan.name}
${plan.description ? `- Description: ${plan.description}` : ''}
- Monthly Price: ${monthlyPrice}
${annualPrice ? `- Annual Price: ${annualPrice}` : ''}
- Seats: ${plan.max_seats}
- Token Quota: ${plan.monthly_token_quota?.toLocaleString() || 'N/A'} tokens/month

${tenantName ? `Tenant: ${tenantName}` : ''}

${message.trim() ? `Additional Message:\n${message}` : 'Please contact me to proceed with the upgrade.'}

Thank you!`
      );

      // Open mailto link
      const mailtoLink = `mailto:support@abilitix.com.au?subject=${subject}&body=${body}`;
      window.location.href = mailtoLink;

      // Show success state
      setSubmitted(true);
      
      // Close modal after a brief delay
      setTimeout(() => {
        onClose();
        setSubmitted(false);
      }, 2000);
    } catch (error) {
      console.error('Failed to open email client:', error);
      // Fallback: copy email to clipboard
      try {
        await navigator.clipboard.writeText('support@abilitix.com.au');
        // Show toast or message
      } catch (clipboardError) {
        console.error('Failed to copy email:', clipboardError);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !loading) {
      onClose();
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm py-4 overflow-y-auto"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="contact-support-title"
    >
      <Card
        className="w-full max-w-lg mx-4 bg-white shadow-2xl border-0 animate-in zoom-in-95 fade-in-0 slide-in-from-bottom-2"
        onClick={(e) => e.stopPropagation()}
      >
        <CardHeader className="pb-4 border-b">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center">
              <MessageSquare className="w-6 h-6 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <CardTitle
                id="contact-support-title"
                className="text-lg font-semibold text-slate-900 leading-tight"
              >
                Contact Support
              </CardTitle>
              <p className="text-sm text-slate-600 mt-1">
                Request an upgrade to {plan?.name || 'this plan'}
              </p>
            </div>
            {!loading && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="h-8 w-8 rounded-full hover:bg-slate-100 -mt-1 -mr-1"
                aria-label="Close dialog"
              >
                <X className="h-4 w-4 text-slate-500" />
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-6 pb-6">
          {submitted ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
                <Mail className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                Email client opening...
              </h3>
              <p className="text-sm text-slate-600">
                Your email client should open with a pre-filled message. If it doesn't, please email us at{' '}
                <a
                  href="mailto:support@abilitix.com.au"
                  className="text-blue-600 hover:text-blue-700 underline"
                >
                  support@abilitix.com.au
                </a>
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {plan && (
                <div className="bg-slate-50 rounded-lg p-4 space-y-2">
                  <div className="text-sm font-medium text-slate-900">Plan Details</div>
                  <div className="text-sm text-slate-600 space-y-1">
                    <div>
                      <span className="font-medium">Plan:</span> {plan.name}
                    </div>
                    {plan.description && (
                      <div>
                        <span className="font-medium">Description:</span> {plan.description}
                      </div>
                    )}
                    <div>
                      <span className="font-medium">Price:</span>{' '}
                      {plan.price_monthly_cents 
                        ? `$${(plan.price_monthly_cents / 100).toFixed(2)}/month`
                        : 'Contact for pricing'}
                      {plan.price_annual_cents && plan.price_annual_cents > 0 && (
                        <span> or ${(plan.price_annual_cents / 100).toFixed(2)}/year</span>
                      )}
                    </div>
                    <div>
                      <span className="font-medium">Includes:</span> {plan.max_seats} seats,{' '}
                      {plan.monthly_token_quota?.toLocaleString() || 'N/A'} tokens/month
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="message" className="text-sm font-medium text-slate-900">
                  Additional Message <span className="text-slate-400 font-normal">(optional)</span>
                </Label>
                <Textarea
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Tell us about your requirements or any questions you have..."
                  rows={5}
                  className="resize-none"
                  disabled={loading}
                />
                <p className="text-xs text-slate-500">
                  Your email client will open with a pre-filled message. You can edit it before sending.
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  disabled={loading}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white min-h-[44px]"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Opening...
                    </>
                  ) : (
                    <>
                      <Mail className="h-4 w-4 mr-2" />
                      Open Email
                    </>
                  )}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

