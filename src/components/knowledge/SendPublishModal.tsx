'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  X,
  Mail,
  Eye,
  Send,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Clock,
  RefreshCw,
} from 'lucide-react';
import type {
  SendPreviewRequest,
  SendPreviewResponse,
  SendRequest,
  SendResponse,
  KnowledgeErrorResponse,
} from '@/lib/types/knowledge';

type SendPublishModalProps = {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  draftIds: string[];
  defaultEmail?: string;
  defaultSubject?: string;
};

type Step = 'preview' | 'send';

export function SendPublishModal({
  open,
  onClose,
  onSuccess,
  draftIds,
  defaultEmail = '',
  defaultSubject = '',
}: SendPublishModalProps) {
  const [step, setStep] = useState<Step>('preview');
  const [email, setEmail] = useState(defaultEmail);
  const [subject, setSubject] = useState(defaultSubject);
  const [preview, setPreview] = useState<SendPreviewResponse | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rateLimitInfo, setRateLimitInfo] = useState<{
    remaining?: number;
    resetAt?: string;
  } | null>(null);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (open) {
      setStep('preview');
      setEmail(defaultEmail);
      setSubject(defaultSubject);
      setPreview(null);
      setError(null);
      setRateLimitInfo(null);
    }
  }, [open, defaultEmail, defaultSubject]);

  // Load preview when step changes to preview
  useEffect(() => {
    if (open && step === 'preview' && email && !preview && !loadingPreview) {
      handlePreview();
    }
  }, [open, step, email]);

  // Validate email
  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  // Preview email
  const handlePreview = async () => {
    if (!email || !isValidEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }

    if (draftIds.length === 0) {
      setError('No drafts selected');
      return;
    }

    setLoadingPreview(true);
    setError(null);

    try {
      const res = await fetch('/api/admin/knowledge/send/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          draft_ids: draftIds,
          to_email: email,
          subject: subject || undefined,
        } as SendPreviewRequest),
      });

      if (res.status === 400) {
        const errorData = (await res.json().catch(() => ({}))) as KnowledgeErrorResponse;
        if (errorData.detail === 'invalid_email') {
          setError('Invalid email address. Please check the email format.');
        } else {
          setError(errorData.detail || errorData.message || 'Invalid request');
        }
        return;
      }

      if (res.status === 401) {
        setError('Authentication required. Please sign in again.');
        return;
      }

      if (res.status === 403) {
        const errorData = (await res.json().catch(() => ({}))) as KnowledgeErrorResponse;
        if (errorData.detail === 'feature_not_enabled') {
          setError('This feature is not available for your plan. Contact support to upgrade.');
        } else {
          setError('Knowledge Studio is not enabled for this tenant.');
        }
        return;
      }

      if (res.status === 404) {
        const errorData = (await res.json().catch(() => ({}))) as KnowledgeErrorResponse;
        if (errorData.detail === 'drafts_not_found') {
          setError('One or more drafts not found. Please refresh and try again.');
        } else {
          setError('Drafts not found');
        }
        return;
      }

      if (!res.ok) {
        const errorData = (await res.json().catch(() => ({}))) as KnowledgeErrorResponse;
        setError(errorData.detail || errorData.message || `Failed to preview (${res.status})`);
        return;
      }

      const data: SendPreviewResponse = await res.json();
      
      // Debug logging
      console.log('[SendPublishModal] Preview response:', {
        status: res.status,
        data: data,
        hasPreviewHtml: !!data.preview_html,
        hasPreviewText: !!data.preview_text,
        previewHtmlLength: data.preview_html?.length || 0,
        previewTextLength: data.preview_text?.length || 0,
      });
      
      // Validate response structure
      if (!data.preview_html && !data.preview_text) {
        console.error('[SendPublishModal] Preview response missing content:', data);
        setError('Preview response is empty. Please check backend logs.');
        return;
      }
      
      setPreview(data);
    } catch (err) {
      console.error('[SendPublishModal] Preview error:', err);
      setError(err instanceof Error ? err.message : 'Failed to preview email');
    } finally {
      setLoadingPreview(false);
    }
  };

  // Send email
  const handleSend = async () => {
    if (!email || !isValidEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }

    if (draftIds.length === 0) {
      setError('No drafts selected');
      return;
    }

    setSending(true);
    setError(null);

    try {
      const res = await fetch('/api/admin/knowledge/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          draft_ids: draftIds,
          to_email: email,
          subject: subject || undefined,
        } as SendRequest),
      });

      if (res.status === 400) {
        const errorData = (await res.json().catch(() => ({}))) as KnowledgeErrorResponse;
        if (errorData.detail === 'invalid_email') {
          setError('Invalid email address. Please check the email format.');
        } else {
          setError(errorData.detail || errorData.message || 'Invalid request');
        }
        return;
      }

      if (res.status === 429) {
        const errorData = (await res.json().catch(() => ({}))) as KnowledgeErrorResponse;
        if (errorData.detail === 'send_rate_limited') {
          setError('Rate limit exceeded. You can send up to 20 emails per hour. Please try again later.');
          // Try to extract rate limit info from response headers or body
          const retryAfter = res.headers.get('Retry-After');
          if (retryAfter) {
            const resetTime = new Date(Date.now() + parseInt(retryAfter) * 1000);
            setRateLimitInfo({
              resetAt: resetTime.toISOString(),
            });
          }
        } else {
          setError('Rate limit exceeded. Please try again later.');
        }
        return;
      }

      if (res.status === 401) {
        setError('Authentication required. Please sign in again.');
        return;
      }

      if (res.status === 403) {
        const errorData = (await res.json().catch(() => ({}))) as KnowledgeErrorResponse;
        if (errorData.detail === 'feature_not_enabled') {
          setError('This feature is not available for your plan. Contact support to upgrade.');
        } else {
          setError('Knowledge Studio is not enabled for this tenant.');
        }
        return;
      }

      if (res.status === 404) {
        const errorData = (await res.json().catch(() => ({}))) as KnowledgeErrorResponse;
        if (errorData.detail === 'drafts_not_found') {
          setError('One or more drafts not found. Please refresh and try again.');
        } else {
          setError('Drafts not found');
        }
        return;
      }

      if (res.status === 500) {
        const errorData = (await res.json().catch(() => ({}))) as KnowledgeErrorResponse;
        if (errorData.detail?.startsWith('send_failed:')) {
          setError(`Failed to send email: ${errorData.detail.replace('send_failed:', '')}`);
        } else {
          setError('Failed to send email. Please try again.');
        }
        return;
      }

      if (!res.ok) {
        const errorData = (await res.json().catch(() => ({}))) as KnowledgeErrorResponse;
        setError(errorData.detail || errorData.message || `Failed to send (${res.status})`);
        return;
      }

      const data: SendResponse = await res.json();
      toast.success('Email sent successfully');
      if (onSuccess) {
        onSuccess();
      }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send email');
    } finally {
      setSending(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !loadingPreview && !sending) {
      onClose();
    }
  };

  // Format rate limit reset time
  const formatResetTime = (resetAt: string) => {
    try {
      const reset = new Date(resetAt);
      const now = new Date();
      const diffMs = reset.getTime() - now.getTime();
      const diffMins = Math.ceil(diffMs / 60000);
      if (diffMins <= 0) return 'now';
      if (diffMins < 60) return `in ${diffMins} minute${diffMins > 1 ? 's' : ''}`;
      const diffHours = Math.ceil(diffMins / 60);
      return `in ${diffHours} hour${diffHours > 1 ? 's' : ''}`;
    } catch {
      return 'later';
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm py-4 overflow-y-auto"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="send-publish-title"
    >
      <Card
        className="w-full max-w-4xl max-h-[calc(100vh-2rem)] overflow-hidden flex flex-col m-4 bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <CardHeader className="flex-shrink-0 flex flex-row items-center justify-between border-b">
          <div>
            <CardTitle id="send-publish-title" className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Send Email
            </CardTitle>
            <CardDescription>
              {draftIds.length} {draftIds.length === 1 ? 'draft' : 'drafts'} selected
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            disabled={loadingPreview || sending}
            aria-label="Close dialog"
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>

        <CardContent className="flex-1 overflow-y-auto space-y-6 pt-6">
          {/* Email and Subject Inputs */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Recipient Email *</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError(null);
                }}
                placeholder="recipient@example.com"
                disabled={loadingPreview || sending}
                className={error && !isValidEmail(email) ? 'border-red-300' : ''}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="subject">Subject (optional)</Label>
              <Input
                id="subject"
                value={subject}
                onChange={(e) => {
                  setSubject(e.target.value);
                  setError(null);
                }}
                placeholder="Email subject"
                disabled={loadingPreview || sending}
              />
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <div className="flex-1">
                  <p>{error}</p>
                  {rateLimitInfo?.resetAt && (
                    <p className="text-xs mt-1 text-red-600">
                      Rate limit resets {formatResetTime(rateLimitInfo.resetAt)}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Rate Limit Warning */}
          {rateLimitInfo && !error && (
            <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <p>
                  Rate limit: {rateLimitInfo.remaining !== undefined
                    ? `${rateLimitInfo.remaining} sends remaining`
                    : 'Approaching rate limit'}
                </p>
              </div>
            </div>
          )}

          {/* Preview Section */}
          {step === 'preview' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Eye className="h-5 w-5 text-slate-600" />
                  <h3 className="font-semibold text-slate-900">Preview</h3>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePreview}
                  disabled={loadingPreview || sending || !email || !isValidEmail(email)}
                >
                  {loadingPreview ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Refresh Preview
                    </>
                  )}
                </Button>
              </div>

              {loadingPreview && (
                <div className="flex items-center justify-center py-12 border rounded-lg bg-slate-50">
                  <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
                </div>
              )}

              {!loadingPreview && preview && (
                <div className="space-y-4">
                  <div className="border rounded-lg p-4 bg-slate-50">
                    <div className="text-xs text-slate-500 mb-2">To: {preview.to_email}</div>
                    <div className="text-sm font-semibold text-slate-900 mb-3">
                      Subject: {preview.subject}
                    </div>
                    <div className="prose prose-sm max-w-none">
                      <div
                        dangerouslySetInnerHTML={{ __html: preview.preview_html }}
                        className="bg-white p-4 rounded border"
                      />
                    </div>
                  </div>
                  <div className="border rounded-lg p-4 bg-slate-50">
                    <div className="text-xs text-slate-500 mb-2">Plain Text Preview:</div>
                    <pre className="text-xs text-slate-700 whitespace-pre-wrap font-sans bg-white p-4 rounded border">
                      {preview.preview_text}
                    </pre>
                  </div>
                </div>
              )}

              {!loadingPreview && !preview && (
                <div className="border rounded-lg p-8 text-center text-slate-500">
                  <Eye className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                  <p className="text-sm">Click "Refresh Preview" to see the email preview</p>
                </div>
              )}
            </div>
          )}

          {/* Send Confirmation */}
          {step === 'send' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-slate-600">
                <Send className="h-5 w-5" />
                <h3 className="font-semibold text-slate-900">Send Confirmation</h3>
              </div>
              <div className="border rounded-lg p-4 bg-slate-50">
                <p className="text-sm text-slate-700 mb-2">
                  You are about to send an email to <strong>{email}</strong> with{' '}
                  <strong>{draftIds.length}</strong> {draftIds.length === 1 ? 'draft' : 'drafts'}.
                </p>
                {preview && (
                  <div className="mt-3 pt-3 border-t">
                    <p className="text-xs text-slate-500 mb-1">Subject:</p>
                    <p className="text-sm font-semibold text-slate-900">{preview.subject}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>

        {/* Footer Actions */}
        <div className="flex-shrink-0 border-t px-6 py-4 flex items-center justify-between gap-3">
          <Button variant="outline" onClick={onClose} disabled={loadingPreview || sending}>
            Cancel
          </Button>
          <div className="flex items-center gap-3">
            {step === 'preview' && (
              <>
                <Button
                  variant="outline"
                  onClick={() => setStep('send')}
                  disabled={loadingPreview || sending || !preview}
                >
                  Continue to Send
                </Button>
                <Button
                  onClick={handleSend}
                  disabled={loadingPreview || sending || !preview || !email || !isValidEmail(email)}
                >
                  {sending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Send Now
                    </>
                  )}
                </Button>
              </>
            )}
            {step === 'send' && (
              <Button
                onClick={handleSend}
                disabled={sending || !email || !isValidEmail(email)}
              >
                {sending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Confirm & Send
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}

