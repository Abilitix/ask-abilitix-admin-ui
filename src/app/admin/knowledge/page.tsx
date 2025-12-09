'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Sparkles, BookOpen, ShieldCheck, RefreshCcw, AlertCircle } from 'lucide-react';

type Template = {
  id: string;
  name: string;
  description?: string;
  required_feature?: string;
  type?: 'faq' | 'email' | string;
  category?: string;
  channel?: string;
  prompt_config?: unknown;
};

type TemplatesResponse = Template[];

type GenerateState = {
  template?: Template;
  docIds: string;
  category: string;
  channel: string;
  submitting: boolean;
  message?: string;
  error?: string;
};

export default function KnowledgeStudioPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selected, setSelected] = useState<Template | null>(null);
  const [gen, setGen] = useState<GenerateState>({
    template: undefined,
    docIds: '',
    category: '',
    channel: '',
    submitting: false,
  });

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/admin/knowledge/templates', { cache: 'no-store' });
        if (!active) return;
        if (res.status === 401 || res.status === 403 || res.status === 404) {
          setError('Knowledge Studio is not enabled for this tenant.');
          setTemplates([]);
          return;
        }
        if (!res.ok) {
          setError('Failed to load templates. Please try again.');
          return;
        }
        const data: TemplatesResponse = await res.json();
        setTemplates(Array.isArray(data) ? data : []);
      } catch (err) {
        if (active) setError('Failed to load templates. Please try again.');
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, []);

  const hasTemplates = useMemo(() => templates.length > 0, [templates]);

  const openGenerate = (template: Template) => {
    setSelected(template);
    setGen((prev) => ({
      ...prev,
      template,
      docIds: '',
      category: template.category || '',
      channel: template.channel || '',
      message: undefined,
      error: undefined,
    }));
  };

  const handleGenerate = async () => {
    if (!gen.template) return;
    const docIds = gen.docIds
      .split(',')
      .map((d) => d.trim())
      .filter(Boolean);
    if (!docIds.length) {
      setGen((prev) => ({ ...prev, error: 'Please add at least one document ID.' }));
      return;
    }
    setGen((prev) => ({ ...prev, submitting: true, error: undefined, message: undefined }));
    try {
      const res = await fetch('/api/admin/knowledge/drafts/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          template_id: gen.template.id,
          doc_ids: docIds,
          category: gen.category || undefined,
          channel: gen.channel || undefined,
        }),
      });
      if (res.status === 401 || res.status === 403 || res.status === 404) {
        setGen((prev) => ({
          ...prev,
          submitting: false,
          error: 'Not entitled or feature disabled for this tenant.',
        }));
        return;
      }
      if (!res.ok) {
        const text = await res.text();
        setGen((prev) => ({
          ...prev,
          submitting: false,
          error: text || 'Generation failed. Please try again.',
        }));
        return;
      }
      setGen((prev) => ({
        ...prev,
        submitting: false,
        message: 'Drafts generated. You can edit and approve them from Drafts.',
        docIds: '',
      }));
    } catch (err) {
      setGen((prev) => ({
        ...prev,
        submitting: false,
        error: 'Generation failed. Please try again.',
      }));
    }
  };

  const renderCard = (tpl: Template) => {
    const typeLabel = tpl.type === 'email' ? 'Email' : 'FAQ';
    return (
      <Card key={tpl.id} className="h-full flex flex-col shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="capitalize">
                {typeLabel}
              </Badge>
              {tpl.required_feature && (
                <Badge className="bg-indigo-50 text-indigo-700 border-indigo-200">
                  {tpl.required_feature}
                </Badge>
              )}
            </div>
          </div>
          <CardTitle className="text-lg leading-tight">{tpl.name}</CardTitle>
          {tpl.description && (
            <CardDescription className="text-sm text-slate-600">{tpl.description}</CardDescription>
          )}
        </CardHeader>
        <CardContent className="flex-1 space-y-2 text-sm text-slate-600">
          {tpl.category && (
            <div className="flex items-center gap-2">
              <Badge variant="secondary">Category: {tpl.category}</Badge>
            </div>
          )}
          {tpl.channel && (
            <div className="flex items-center gap-2">
              <Badge variant="secondary">Channel: {tpl.channel}</Badge>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex items-center justify-between gap-3">
          <Button variant="outline" asChild>
            <Link href="/admin/faqs">View Drafts</Link>
          </Button>
          <Button onClick={() => openGenerate(tpl)}>Generate drafts</Button>
        </CardFooter>
      </Card>
    );
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:py-10 space-y-6">
      <div className="flex items-start justify-between gap-3 flex-col sm:flex-row sm:items-center">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-indigo-600">
            <Sparkles className="h-5 w-5" />
            <span className="text-sm font-semibold">Knowledge Studio</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
            Templates → Drafts → Approve → Publish/Send
          </h1>
          <p className="text-sm sm:text-base text-slate-600">
            Generate cited drafts from templates, edit in the editor, approve, and publish/send—all governed and explicit.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href="/admin/docs">Upload docs</Link>
          </Button>
          <Button asChild>
            <Link href="/admin/faqs">Go to drafts</Link>
          </Button>
        </div>
      </div>

      {error && (
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader>
            <div className="flex items-center gap-2 text-amber-700">
              <AlertCircle className="h-5 w-5" />
              <CardTitle className="text-base">Not available</CardTitle>
            </div>
            <CardDescription className="text-amber-700">
              {error} If you believe you should have access, check feature flag and entitlements.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {!error && (
        <Card className="shadow-sm">
          <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <CardTitle className="text-lg">Template Library</CardTitle>
              <CardDescription>Choose a template, select docs, and generate drafts with citations.</CardDescription>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <ShieldCheck className="h-4 w-4" />
              <span>Gated by entitlements & feature flag</span>
            </div>
          </CardHeader>
          <CardContent>
            {loading && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-48 rounded-xl border border-slate-200 bg-slate-50 animate-pulse"
                  />
                ))}
              </div>
            )}
            {!loading && !hasTemplates && (
              <div className="text-sm text-slate-600">
                No templates available. Check entitlements or add templates in the backend registry.
              </div>
            )}
            {!loading && hasTemplates && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {templates.map((tpl) => renderCard(tpl))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Generate panel */}
      {selected && (
        <div className="fixed inset-0 z-[120] bg-black/40 backdrop-blur-[2px] flex items-end sm:items-center justify-center px-3"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white w-full sm:max-w-lg rounded-xl shadow-2xl p-5 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-wide text-indigo-600 font-semibold">Generate drafts</p>
                <h3 className="text-lg font-semibold text-slate-900">{selected.name}</h3>
                {selected.description && (
                  <p className="text-sm text-slate-600 mt-1">{selected.description}</p>
                )}
              </div>
              <Button variant="ghost" size="sm" onClick={() => setSelected(null)}>
                Close
              </Button>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Document IDs (comma separated)</Label>
                <Textarea
                  value={gen.docIds}
                  onChange={(e) => setGen((prev) => ({ ...prev, docIds: e.target.value }))}
                  placeholder="doc_id_1, doc_id_2"
                  rows={3}
                />
                <p className="text-xs text-slate-500">We’ll fetch these docs and draft answers with citations.</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Category (optional)</Label>
                  <Input
                    value={gen.category}
                    onChange={(e) => setGen((prev) => ({ ...prev, category: e.target.value }))}
                    placeholder="e.g., recruiter, legal"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Channel (optional)</Label>
                  <Input
                    value={gen.channel}
                    onChange={(e) => setGen((prev) => ({ ...prev, channel: e.target.value }))}
                    placeholder="e.g., email, faq"
                  />
                </div>
              </div>

              {gen.error && (
                <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {gen.error}
                </div>
              )}
              {gen.message && (
                <div className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
                  {gen.message}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between gap-3">
              <Button variant="outline" onClick={() => setSelected(null)}>
                Cancel
              </Button>
              <Button onClick={handleGenerate} disabled={gen.submitting}>
                {gen.submitting ? (
                  <span className="inline-flex items-center gap-2">
                    <RefreshCcw className="h-4 w-4 animate-spin" />
                    Generating...
                  </span>
                ) : (
                  'Generate drafts'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

