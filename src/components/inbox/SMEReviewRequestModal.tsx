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
import { InboxDetail } from './ModernInboxClient';
import { AssignableMember } from './types';

type SMEReviewRequestModalProps = {
  open: boolean;
  inboxId: string | null;
  detail?: InboxDetail | null;
  onClose: () => void;
  onSuccess: (next: { assignedTo: AssignableMember[]; status?: string; reason?: string }) => void;
};

type MemberOption = AssignableMember & { label: string };

const MIN_REASON = 20;
const MAX_REASON = 500;

export function SMEReviewRequestModal({
  open,
  inboxId,
  detail,
  onClose,
  onSuccess,
}: SMEReviewRequestModalProps) {
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
      const response = await fetch('/api/admin/members?role=admin,curator', {
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
      if (!inboxId || submitting) return;

      const trimmedReason = reason.trim();
      if (trimmedReason.length < MIN_REASON || trimmedReason.length > MAX_REASON) {
        toast.error(reasonError ?? 'Reason must be between 20 and 500 characters.');
        return;
      }

      const assignees = Array.from(selected);
      if (!assignees.length) {
        toast.error('Select at least one SME.');
        return;
      }

      setSubmitting(true);
      try {
        const response = await fetch(
          `/api/admin/inbox/${encodeURIComponent(inboxId)}/request-review`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ reason: trimmedReason, assignees }),
            cache: 'no-store',
          }
        );

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
          const details = data?.details || data?.error || `Request failed (${response.status})`;
          if (response.status === 409) {
            toast.error('Already assigned. Use reassign workflow.');
          } else {
            toast.error(details);
          }
          throw new Error(details);
        }

        const assigned =
          Array.isArray(data?.assigned_to) && data.assigned_to.length > 0
            ? data.assigned_to
                .map((member: any) => {
                  if (!member) return null;
                  const id = typeof member.id === 'string' ? member.id : member.user_id;
                  if (!id) return null;
                  return {
                    id,
                    email: member.email ?? '',
                    name: member.name ?? null,
                    role: member.role ?? null,
                  };
                })
                .filter(Boolean)
            : members.filter((member) => selected.has(member.id));

        toast.success('SME review requested.');
        onSuccess({
          assignedTo: assigned,
          status: typeof data?.status === 'string' ? data.status : 'needs_review',
          reason: trimmedReason,
        });
        onClose();
      } catch (error) {
        console.error('SME review request failed:', error);
      } finally {
        setSubmitting(false);
      }
    },
    [inboxId, reason, reasonError, selected, submitting, members, onClose, onSuccess]
  );

  const questionPreview = detail?.question ?? '—';
  const answerPreview = detail?.answerDraft ?? detail?.answerFinal ?? '—';

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
                  <LabelledText title="Question">{questionPreview}</LabelledText>
                </div>
                <div className="space-y-2">
                  <LabelledText title="Draft answer">
                    <div className="max-h-40 overflow-y-auto whitespace-pre-wrap rounded-md border border-slate-200 p-3 text-sm">
                      {answerPreview}
                    </div>
                  </LabelledText>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700" htmlFor="sme-reason">
                  What needs review?
                </label>
                <Textarea
                  id="sme-reason"
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                  placeholder="Explain what needs to be verified or updated..."
                  rows={4}
                  className={reasonError ? 'border-destructive' : ''}
                  disabled={submitting}
                />
                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span className={reasonError ? 'text-destructive' : ''}>
                    {reasonError ?? '20–500 characters'}
                  </span>
                  <span>
                    {reasonLength}/{MAX_REASON}
                  </span>
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


