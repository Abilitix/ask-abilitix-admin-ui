'use client';

import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Loader2, Search, X } from 'lucide-react';
import { AssignableMember } from '../inbox/types';

type ChatSMEReviewModalProps = {
  open: boolean;
  question: string;
  answer: string;
  citations?: Array<{
    id?: string;
    title?: string;
    url?: string;
    doc_id?: string;
    span?: { text?: string; offset?: number };
  }>;
  conversationId?: string;
  messageId?: string;
  onClose: () => void;
  onSuccess: () => void;
};

type MemberOption = AssignableMember & { label: string };

const MIN_REASON = 20;
const MAX_REASON = 500;

export function ChatSMEReviewModal({
  open,
  question,
  answer,
  citations = [],
  conversationId,
  messageId,
  onClose,
  onSuccess,
}: ChatSMEReviewModalProps) {
  const [reason, setReason] = useState('');
  const [members, setMembers] = useState<MemberOption[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [membersError, setMembersError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');

  const resetState = useCallback(() => {
    setReason('');
    setMembers([]);
    setMembersError(null);
    setSelected(new Set());
    setSearch('');
  }, []);

  useEffect(() => {
    if (!open) {
      resetState();
    }
  }, [open, resetState]);

  const fetchMembers = useCallback(async () => {
    setMembersLoading(true);
    setMembersError(null);
    try {
      const response = await fetch('/api/admin/members?role=admin,curator,owner', {
        method: 'GET',
        cache: 'no-store',
        credentials: 'include',
      });

      const text = await response.text();
      let data: any = {};
      if (text) {
        try {
          data = JSON.parse(text);
        } catch {
          data = {};
        }
      }

      if (!response.ok || data?.error) {
        throw new Error(data?.details || data?.error || `Failed to load members (${response.status})`);
      }

      const mapped: MemberOption[] = Array.isArray(data?.members)
        ? data.members
            .map((member: any) => {
              if (!member) return null;
              const id =
                typeof member.user_id === 'string'
                  ? member.user_id
                  : typeof member.id === 'string'
                    ? member.id
                    : null;
              if (!id) return null;
              const email =
                typeof member.email === 'string' && member.email.length > 0
                  ? member.email
                  : null;
              const name =
                typeof member.name === 'string' && member.name.length > 0 ? member.name : null;
              const role =
                typeof member.role === 'string' && member.role.length > 0 ? member.role : null;
              return {
                id,
                email: email ?? '',
                name,
                role,
                label: name ? `${name} (${email ?? id})` : email ?? id,
              };
            })
            .filter(Boolean)
        : [];

      setMembers(mapped);
    } catch (error) {
      console.error('Assignee fetch failed:', error);
      setMembersError(error instanceof Error ? error.message : 'Failed to load members');
    } finally {
      setMembersLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    fetchMembers();
  }, [open, fetchMembers]);

  const filteredMembers = useMemo(() => {
    if (!search.trim()) return members;
    const term = search.trim().toLowerCase();
    return members.filter((member) => member.label.toLowerCase().includes(term));
  }, [members, search]);

  const reasonLength = reason.trim().length;
  const reasonError =
    reasonLength > 0 && reasonLength < MIN_REASON
      ? `Explain the concern (${MIN_REASON} chars min).`
      : reasonLength > MAX_REASON
        ? `Please shorten to ${MAX_REASON} characters.`
        : null;

  const handleToggle = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const handleSubmit = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();
      if (submitting) return;

      const trimmedReason = reason.trim();
      // Reason is optional but if provided, must meet length requirements
      if (trimmedReason.length > 0 && (trimmedReason.length < MIN_REASON || trimmedReason.length > MAX_REASON)) {
        toast.error(reasonError ?? 'Reason must be between 20 and 500 characters if provided.');
        return;
      }

      const assignees = Array.from(selected);
      if (!assignees.length) {
        toast.error('Select at least one SME.');
        return;
      }

      setSubmitting(true);
      try {
        // Normalize citations to match backend CitationPayload format
        // Backend expects: { doc_id: string, title?: string, page?: number, span?: { text: string, start?: number, end?: number } }
        const normalizedCitations = citations
          .filter((citation) => {
            // Only include citations with a valid doc_id
            return citation.doc_id || citation.id;
          })
          .map((citation) => {
            const citationObj: any = {
              doc_id: citation.doc_id || citation.id || '',
            };
            
            // Optional title
            if (citation.title) {
              citationObj.title = citation.title;
            }
            
            // Optional page (if available from citation data)
            // Note: Chat sources don't typically have page info, but include if present
            
            // Optional span with text, start, end
            if (citation.span) {
              citationObj.span = {};
              if (citation.span.text) {
                citationObj.span.text = citation.span.text;
              }
              // Backend expects start/end (not offset)
              // If we have offset, we'd need to convert, but chat sources typically don't provide this
              // For now, only include text if available
            }
            
            return citationObj;
          });

        const requestBody: any = {
          question: question.trim(),
          answer: answer.trim(),
          assignees,
        };

        if (normalizedCitations.length > 0) {
          requestBody.citations = normalizedCitations;
        }

        // Admin API requires reason field (20-500 chars)
        // If user didn't provide one, use a default reason
        if (trimmedReason && trimmedReason.length >= MIN_REASON) {
          requestBody.reason = trimmedReason;
        } else {
          // Default reason if user didn't provide one or it's too short
          requestBody.reason = 'Please review this answer for accuracy and completeness.';
        }

        if (conversationId) {
          requestBody.conversation_id = conversationId;
        }

        if (messageId) {
          requestBody.message_id = messageId;
        }

        const response = await fetch('/api/admin/chat/request-sme-review', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
          cache: 'no-store',
          credentials: 'include',
        });

        const text = await response.text();
        let data: any = {};
        if (text) {
          try {
            data = JSON.parse(text);
          } catch {
            data = {};
          }
        }

        if (!response.ok || data?.error) {
          // Backend returns structured errors: { error: { code: string, message: string } }
          // Or flat errors: { error: string, details: string }
          let errorMessage = `Request failed (${response.status})`;
          
          if (data?.error) {
            if (typeof data.error === 'object' && data.error.message) {
              // Structured error: { error: { code, message } }
              errorMessage = data.error.message;
            } else if (typeof data.error === 'string') {
              // Flat error string
              errorMessage = data.error;
            }
          }
          
          // Fallback to details if available
          if (data?.details && !errorMessage.includes(data.details)) {
            errorMessage = data.details;
          }
          
          if (response.status === 403) {
            toast.error('Permission denied. Only curators and admins can request SME review.');
          } else if (response.status === 409 || data?.error === 'duplicate_review_request') {
            toast.error('A review request for this question already exists. Please check the inbox.');
          } else if (response.status === 400) {
            toast.error(errorMessage);
          } else if (response.status === 404) {
            toast.error('Resource not found. Please refresh and try again.');
          } else {
            toast.error(errorMessage);
          }
          throw new Error(errorMessage);
        }

        toast.success('SME review request sent.');
        onSuccess();
        onClose();
      } catch (error) {
        console.error('Chat SME review request failed:', error);
      } finally {
        setSubmitting(false);
      }
    },
    [question, answer, citations, conversationId, messageId, reason, reasonError, selected, submitting, onClose, onSuccess]
  );

  if (!open) return null;

  const modalContent = (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-[2px] px-4">
      <div className="w-full max-w-3xl">
        <Card className="shadow-2xl border-slate-200 bg-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">Request SME Review</CardTitle>
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-slate-200 p-1 text-slate-600 hover:bg-slate-50"
            >
              <X className="h-4 w-4" />
            </button>
          </CardHeader>
          <CardContent>
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <LabelledText title="Question">
                    <div className="max-h-32 overflow-y-auto whitespace-pre-wrap text-sm">
                      {question || '—'}
                    </div>
                  </LabelledText>
                </div>
                <div className="space-y-2">
                  <LabelledText title="Answer">
                    <div className="max-h-40 overflow-y-auto whitespace-pre-wrap rounded-md border border-slate-200 p-3 text-sm">
                      {answer || '—'}
                    </div>
                  </LabelledText>
                </div>
              </div>

              {citations.length > 0 && (
                <div className="space-y-2">
                  <div className="text-sm font-medium text-slate-700">Citations</div>
                  <div className="max-h-32 overflow-y-auto rounded-md border border-slate-200 bg-slate-50 p-3">
                    <div className="flex flex-wrap gap-2">
                      {citations.map((citation, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {citation.title || `Source ${idx + 1}`}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700" htmlFor="chat-sme-reason">
                  What needs review? <span className="text-slate-500 font-normal">(optional)</span>
                </label>
                <Textarea
                  id="chat-sme-reason"
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                  placeholder="Explain what needs to be verified or updated (recommended for context)..."
                  rows={4}
                  className={reasonError ? 'border-destructive' : ''}
                  disabled={submitting}
                />
                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span className={reasonError ? 'text-destructive' : ''}>
                    {reasonError ?? (reasonLength > 0 ? `${MIN_REASON}–${MAX_REASON} characters` : 'Optional, 20+ chars recommended')}
                  </span>
                  {reasonLength > 0 && <span>{reasonLength}/{MAX_REASON}</span>}
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-slate-700">Assign SMEs</label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={fetchMembers}
                    disabled={membersLoading}
                  >
                    {membersLoading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshIcon />
                    )}
                    Refresh
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      placeholder="Search by name or email"
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      className="pl-9"
                      disabled={membersLoading}
                    />
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {selected.size} selected
                  </Badge>
                </div>
                <div className="max-h-48 overflow-y-auto rounded-md border border-slate-200 bg-slate-50">
                  {membersLoading && (
                    <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading SME list…
                    </div>
                  )}
                  {!membersLoading && membersError && (
                    <div className="p-4 text-sm text-destructive">{membersError}</div>
                  )}
                  {!membersLoading && !membersError && filteredMembers.length === 0 && (
                    <div className="p-4 text-sm text-muted-foreground">No members match your search.</div>
                  )}
                  {!membersLoading &&
                    !membersError &&
                    filteredMembers.map((member) => (
                      <label
                        key={member.id}
                        className="flex items-center gap-3 border-b border-slate-200/60 px-4 py-2 text-sm last:border-b-0"
                      >
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-0"
                          checked={selected.has(member.id)}
                          onChange={() => handleToggle(member.id)}
                          disabled={submitting}
                        />
                        <div className="flex flex-1 flex-col">
                          <span className="font-medium text-slate-800">{member.label}</span>
                          <span className="text-xs text-slate-500">
                            {member.role ? member.role.toUpperCase() : 'Member'}
                          </span>
                        </div>
                      </label>
                    ))}
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Send request
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  if (typeof window === 'undefined') return null;
  return createPortal(modalContent, document.body);
}

function LabelledText({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="space-y-1">
      <div className="text-sm font-medium text-slate-700">{title}</div>
      <div className="rounded-md border border-slate-200 bg-white p-3 text-sm text-slate-800 shadow-inner">
        {children}
      </div>
    </div>
  );
}

function RefreshIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="mr-2 h-4 w-4"
    >
      <polyline points="23 4 23 10 17 10" />
      <polyline points="1 20 1 14 7 14" />
      <path d="M3.51 9a9 9 0 0114.13-3.36L23 10" />
      <path d="M20.49 15a9 9 0 01-14.13 3.36L1 14" />
    </svg>
  );
}

