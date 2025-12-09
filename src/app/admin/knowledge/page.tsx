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
import { Sparkles, BookOpen, ShieldCheck, RefreshCcw, AlertCircle, Lock, ArrowUpRight } from 'lucide-react';
import type { Template, KnowledgeErrorResponse } from '@/lib/types/knowledge';
import { hasFeature, hasKnowledgeStudio } from '@/lib/features';
import { useUserFeatures } from '@/hooks/useUserFeatures';
import { DocumentPicker } from '@/components/knowledge/DocumentPicker';

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
  const { features, loading: featuresLoading } = useUserFeatures();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [templates, setTemplates] = useState<Template[]>([]);
  
  // Debug: Log features when they load
  useEffect(() => {
    if (!featuresLoading && features !== undefined) {
      console.log('[Knowledge Studio] User features:', features);
      console.log('[Knowledge Studio] Has knowledge_studio:', features?.knowledge_studio);
    }
  }, [features, featuresLoading]);
  const [selected, setSelected] = useState<Template | null>(null);
  const [gen, setGen] = useState<GenerateState>({
    template: undefined,
    docIds: '',
    category: '',
    channel: '',
    submitting: false,
  });
  const [selectedDocIds, setSelectedDocIds] = useState<string[]>([]);

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/admin/knowledge/templates', { cache: 'no-store' });
        if (!active) return;
        
        // 404 = Template not found (shouldn't happen for list, but handle gracefully)
        if (res.status === 404) {
          setError('Templates not found. Verify tenant has access.');
          setTemplates([]);
          return;
        }
        
        // 401 = Authentication required
        if (res.status === 401) {
          setError('Authentication required. Please sign in again.');
          setTemplates([]);
          return;
        }
        
        // 403 = Feature not enabled or not entitled
        if (res.status === 403) {
          const errorData = (await res.json().catch(() => ({}))) as KnowledgeErrorResponse;
          if (errorData.detail === 'feature_not_enabled') {
            setError('This feature is not available for your plan. Contact support to upgrade.');
          } else {
            setError('Knowledge Studio is not enabled for this tenant. Check feature flag (KNOWLEDGE_STUDIO_ENABLE) and tenant entitlements.');
          }
          setTemplates([]);
          return;
        }
        
        if (!res.ok) {
          const errorText = await res.text().catch(() => '');
          setError(`Failed to load templates (${res.status}). ${errorText || 'Please try again.'}`);
          return;
        }
        const data: TemplatesResponse = await res.json();
        
        // Debug logging in development
        if (process.env.NODE_ENV !== 'production') {
          console.log('[Knowledge Studio] Templates API response:', {
            status: res.status,
            isArray: Array.isArray(data),
            count: Array.isArray(data) ? data.length : 0,
            data: data,
          });
        }
        
        // Always log in preview/production for debugging
        console.log('[Knowledge Studio] Templates loaded:', {
          status: res.status,
          count: Array.isArray(data) ? data.length : 0,
          templates: Array.isArray(data) ? data.map(t => ({ id: t.id, name: t.name, required_feature: t.required_feature })) : [],
        });
        
        setTemplates(Array.isArray(data) ? data : []);
      } catch (err) {
        if (active) {
          const msg = err instanceof Error ? err.message : 'Failed to load templates. Please try again.';
          setError(msg);
        }
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
    // Check if template is locked
    const requiredFeature = template.required_feature;
    if (requiredFeature && typeof requiredFeature === 'string') {
      const isLocked = !hasFeature(features, requiredFeature);
      if (isLocked) {
        // Don't open modal if locked - user should see upgrade prompt
        return;
      }
    }
    
    setSelected(template);
    setSelectedDocIds([]); // Reset document selection
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
    
    // Use selectedDocIds if available, otherwise fall back to manual docIds input
    const docIds = selectedDocIds.length > 0 
      ? selectedDocIds 
      : gen.docIds
          .split(',')
          .map((d) => d.trim())
          .filter(Boolean);
    
    if (!docIds.length) {
      setGen((prev) => ({ ...prev, error: 'Please select at least one document.' }));
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
      
      // Handle specific error codes with user-friendly messages
      if (res.status === 401) {
        setGen((prev) => ({
          ...prev,
          submitting: false,
          error: 'Authentication required. Please sign in again.',
        }));
        return;
      }
      
      if (res.status === 403) {
        const errorData = (await res.json().catch(() => ({}))) as KnowledgeErrorResponse;
        if (errorData.detail === 'feature_not_enabled') {
          setGen((prev) => ({
            ...prev,
            submitting: false,
            error: 'This feature is not available for your plan. Contact support to upgrade.',
          }));
        } else {
          setGen((prev) => ({
            ...prev,
            submitting: false,
            error: 'Not entitled or feature disabled for this tenant.',
          }));
        }
        return;
      }
      
      if (res.status === 404) {
        const errorData = (await res.json().catch(() => ({}))) as KnowledgeErrorResponse;
        if (errorData.detail === 'drafts_not_found') {
          setGen((prev) => ({
            ...prev,
            submitting: false,
            error: 'One or more document IDs not found. Please verify the document IDs are correct.',
          }));
        } else {
          setGen((prev) => ({
            ...prev,
            submitting: false,
            error: 'Template or documents not found. Please verify your selection.',
          }));
        }
        return;
      }
      
      if (res.status === 400) {
        const errorData = (await res.json().catch(() => ({}))) as KnowledgeErrorResponse;
        if (errorData.detail === 'invalid_email') {
          setGen((prev) => ({
            ...prev,
            submitting: false,
            error: 'Invalid email address. Please check the email format.',
          }));
        } else {
          setGen((prev) => ({
            ...prev,
            submitting: false,
            error: errorData.detail || errorData.message || 'Invalid request. Please check your input.',
          }));
        }
        return;
      }
      
      if (!res.ok) {
        const errorData = (await res.json().catch(() => ({}))) as KnowledgeErrorResponse;
        const errorText = errorData.detail || errorData.message || await res.text().catch(() => '');
        setGen((prev) => ({
          ...prev,
          submitting: false,
          error: errorText || `Generation failed (${res.status}). Please try again.`,
        }));
        return;
      }
      
      setGen((prev) => ({
        ...prev,
        submitting: false,
        message: 'Drafts generated successfully. You can edit and approve them from Drafts.',
        docIds: '',
      }));
    } catch (err) {
      setGen((prev) => ({
        ...prev,
        submitting: false,
        error: err instanceof Error ? err.message : 'Generation failed. Please try again.',
      }));
    }
  };

  const renderCard = (tpl: Template) => {
    // Determine type from channel or email_layout presence
    const isEmail = tpl.email_layout !== undefined || tpl.channel === 'email';
    const typeLabel = isEmail ? 'Email' : 'FAQ';
    const requiredFeature = tpl.required_feature;
    const hasFeatureGate = requiredFeature !== null && requiredFeature !== undefined;
    const isLocked = hasFeatureGate && requiredFeature ? !hasFeature(features, requiredFeature) : false;
    const canUse = !isLocked && hasKnowledgeStudio(features);
    
    return (
      <Card 
        key={tpl.id} 
        className={`h-full flex flex-col shadow-sm transition-all ${
          isLocked 
            ? 'opacity-75 border-slate-300 bg-slate-50' 
            : 'hover:shadow-md'
        }`}
      >
        <CardHeader className="space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className="capitalize">
                {typeLabel}
              </Badge>
              {hasFeatureGate && (
                <Badge className={isLocked ? 'bg-slate-200 text-slate-600 border-slate-300' : 'bg-indigo-50 text-indigo-700 border-indigo-200'}>
                  {isLocked && <Lock className="h-3 w-3 mr-1" />}
                  {tpl.required_feature}
                </Badge>
              )}
            </div>
          </div>
          <CardTitle className="text-lg leading-tight">{tpl.name}</CardTitle>
          <CardDescription className="text-sm text-slate-600">{tpl.description}</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 space-y-2 text-sm text-slate-600">
          <div className="flex items-center gap-2">
            <Badge variant="secondary">Category: {tpl.category}</Badge>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">Channel: {tpl.channel}</Badge>
          </div>
          {isLocked && (
            <div className="mt-3 pt-3 border-t border-slate-200">
              <p className="text-xs text-slate-500 mb-2">
                Requires <strong>{tpl.required_feature}</strong> feature
              </p>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full"
                asChild
              >
                <Link href="/admin/settings/billing">
                  Upgrade Plan
                  <ArrowUpRight className="h-3 w-3 ml-1" />
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex items-center justify-between gap-3">
          <Button variant="outline" asChild>
            <Link href="/admin/knowledge/drafts">View Drafts</Link>
          </Button>
          <Button 
            onClick={() => openGenerate(tpl)} 
            disabled={isLocked || !canUse}
            title={isLocked ? `Requires ${tpl.required_feature} feature` : undefined}
          >
            {isLocked ? (
              <>
                <Lock className="h-4 w-4 mr-2" />
                Locked
              </>
            ) : (
              'Generate drafts'
            )}
          </Button>
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
            <Link href="/admin/knowledge/drafts">Go to drafts</Link>
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
              <CardDescription>
                {hasKnowledgeStudio(features) 
                  ? 'Choose a template, select docs, and generate drafts with citations.'
                  : 'Upgrade your plan to unlock Knowledge Studio templates.'}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <ShieldCheck className="h-4 w-4" />
              <span>Gated by plan features & feature flag</span>
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
              <div className="text-center py-8 space-y-3">
                {hasKnowledgeStudio(features) ? (
                  <>
                    <p className="text-sm text-slate-600">
                      No templates available. Add templates in the backend registry.
                    </p>
                    <p className="text-xs text-slate-500">
                      Templates are registered in the backend and filtered by your plan's features.
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-sm text-slate-600">
                      Knowledge Studio is not enabled for your plan.
                    </p>
                    <Button variant="outline" asChild>
                      <Link href="/admin/settings/billing">
                        View Plans
                        <ArrowUpRight className="h-3 w-3 ml-1" />
                      </Link>
                    </Button>
                  </>
                )}
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
                <Label>Select Documents</Label>
                <DocumentPicker
                  selectedDocIds={selectedDocIds}
                  onSelectionChange={(docIds) => {
                    setSelectedDocIds(docIds);
                    // Also update the manual input field for backward compatibility
                    setGen((prev) => ({ ...prev, docIds: docIds.join(', ') }));
                  }}
                  disabled={gen.submitting}
                />
                <p className="text-xs text-slate-500">
                  Search and select documents to generate drafts with citations. Only active documents are shown.
                </p>
              </div>
              
              {/* Fallback: Manual document ID input (hidden by default, can be shown if needed) */}
              <details className="text-xs text-slate-400">
                <summary className="cursor-pointer hover:text-slate-600">Or enter document IDs manually</summary>
                <div className="mt-2 space-y-2">
                  <Textarea
                    value={gen.docIds}
                    onChange={(e) => {
                      setGen((prev) => ({ ...prev, docIds: e.target.value }));
                      // Sync with selectedDocIds if manual input is used
                      const manualIds = e.target.value.split(',').map((d) => d.trim()).filter(Boolean);
                      if (manualIds.length > 0) {
                        setSelectedDocIds(manualIds);
                      }
                    }}
                    placeholder="doc_id_1, doc_id_2"
                    rows={2}
                    disabled={gen.submitting}
                  />
                </div>
              </details>
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

