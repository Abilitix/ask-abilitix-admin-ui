'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
import { Sparkles, BookOpen, ShieldCheck, RefreshCcw, AlertCircle, Lock, ArrowUpRight, FileText, Loader2 } from 'lucide-react';
import type { Template, KnowledgeErrorResponse } from '@/lib/types/knowledge';
import { hasFeature, hasKnowledgeStudio } from '@/lib/features';
import { useUserFeatures } from '@/hooks/useUserFeatures';
import { DocumentPicker } from '@/components/knowledge/DocumentPicker';
import { Breadcrumbs } from '@/components/knowledge/Breadcrumbs';

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
  const router = useRouter();
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

  // Debug helper: Expose debug function to window for console access
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).debugKnowledgeStudio = async () => {
        try {
          console.log('[Knowledge Studio] Fetching debug info...');
          const res = await fetch('/api/admin/knowledge/debug/features', { cache: 'no-store' });
          const data = await res.json();
          console.log('[Knowledge Studio] Debug info:', data);
          return data;
        } catch (err) {
          console.error('[Knowledge Studio] Debug fetch failed:', err);
          return null;
        }
      };
      console.log('[Knowledge Studio] Debug helper available: window.debugKnowledgeStudio()');
    }
  }, []);
  const [selected, setSelected] = useState<Template | null>(null);
  const [gen, setGen] = useState<GenerateState>({
    template: undefined,
    docIds: '',
    category: '',
    channel: '',
    submitting: false,
  });
  const [selectedDocIds, setSelectedDocIds] = useState<string[]>([]);

  // Async job (new generator) state
  const [jobTemplate, setJobTemplate] = useState<Template | null>(null);
  const [jobForm, setJobForm] = useState<{
    roleId: string;
    candidateId: string;
    clientId: string;
    docIds: string;
    submitting: boolean;
    polling: boolean;
    error: string | null;
    jobId: string | null;
  }>({
    roleId: '',
    candidateId: '',
    clientId: '',
    docIds: '',
    submitting: false,
    polling: false,
    error: null,
    jobId: null,
  });
  const pollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pollAttemptsRef = useRef(0);

  const resetJob = () => {
    setJobTemplate(null);
    setJobForm({
      roleId: '',
      candidateId: '',
      clientId: '',
      docIds: '',
      submitting: false,
      polling: false,
      error: null,
      jobId: null,
    });
    if (pollTimeoutRef.current) {
      clearTimeout(pollTimeoutRef.current);
      pollTimeoutRef.current = null;
    }
    pollAttemptsRef.current = 0;
  };

  useEffect(() => {
    return () => {
      if (pollTimeoutRef.current) clearTimeout(pollTimeoutRef.current);
    };
  }, []);

  const startPoll = (jobId: string) => {
    const poll = async () => {
      pollAttemptsRef.current += 1;
      if (pollAttemptsRef.current > 40) {
        setJobForm((prev) => ({
          ...prev,
          polling: false,
          error: 'Timed out waiting for generation. Please try again.',
        }));
        return;
      }

      try {
        const res = await fetch(`/api/admin/knowledge/generate/${jobId}`, { cache: 'no-store' });
        if (!res.ok) {
          const text = await res.text().catch(() => '');
          setJobForm((prev) => ({
            ...prev,
            polling: false,
            error: text || `Failed to poll job (${res.status}).`,
          }));
          return;
        }
        const data = await res.json().catch(() => ({}));
        const status = data.status;
        if (status === 'completed' && data.draft_id) {
          resetJob();
          router.push(`/admin/knowledge/drafts/${data.draft_id}`);
          return;
        }
        if (status === 'failed') {
          const detail = data.detail || data.message || 'Generation failed.';
          // Check for SQL generation failures specifically
          const isSqlError = detail.toLowerCase().includes('sql') || 
                            detail.toLowerCase().includes('generation failed');
          const errorMsg = isSqlError
            ? `SQL generation failed: ${detail}. Check backend logs and feature flags. Use the debug endpoint to diagnose: GET /api/admin/knowledge/debug/features`
            : detail;
          console.error('[Knowledge Studio] Job failed:', {
            jobId,
            status,
            detail,
            fullData: data,
          });
          setJobForm((prev) => ({
            ...prev,
            polling: false,
            error: errorMsg,
          }));
          return;
        }
        // still pending
        pollTimeoutRef.current = setTimeout(poll, 1500);
      } catch (err) {
        setJobForm((prev) => ({
          ...prev,
          polling: false,
          error: err instanceof Error ? err.message : 'Failed to poll job.',
        }));
      }
    };

    setJobForm((prev) => ({ ...prev, polling: true, error: null, jobId }));
    pollTimeoutRef.current = setTimeout(poll, 1200);
  };

  const handleSubmitJob = async () => {
    if (!jobTemplate) return;
    const hasContext = jobForm.roleId || jobForm.candidateId || jobForm.clientId;
    const docIds = jobForm.docIds
      .split(',')
      .map((d) => d.trim())
      .filter(Boolean);

    if (!hasContext && docIds.length === 0) {
      setJobForm((prev) => ({ ...prev, error: 'Add role/candidate/client or doc IDs.' }));
      return;
    }

    setJobForm((prev) => ({ ...prev, submitting: true, polling: false, error: null }));
    try {
      const body: any = { template_id: jobTemplate.id };
      if (docIds.length) body.doc_ids = docIds;
      if (hasContext) {
        body.context = {
          ...(jobForm.roleId ? { role_id: jobForm.roleId } : {}),
          ...(jobForm.candidateId ? { candidate_id: jobForm.candidateId } : {}),
          ...(jobForm.clientId ? { client_id: jobForm.clientId } : {}),
        };
      }

      const res = await fetch('/api/admin/knowledge/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        // Try to parse error response - handle both JSON and text
        let errData: any = {};
        let errorText = '';
        
        try {
          const contentType = res.headers.get('content-type');
          if (contentType?.includes('application/json')) {
            errData = await res.json().catch(() => ({}));
            errorText = errData.detail || errData.message || errData.error || '';
          } else {
            errorText = await res.text().catch(() => '');
          }
        } catch (e) {
          errorText = await res.text().catch(() => '');
        }
        
        const msg = errorText || errData.detail || errData.message || `Failed to start generation (${res.status}).`;
        
        // Enhanced error logging for SQL generation issues
        console.error('[Knowledge Studio] Generation start failed:', {
          status: res.status,
          statusText: res.statusText,
          error: errData,
          errorText,
          message: msg,
          headers: Object.fromEntries(res.headers.entries()),
        });
        
        // Check for 403 (feature/permission) errors
        if (res.status === 403) {
          const enhancedMsg = errorText 
            ? `${errorText}. Check feature flags and tenant entitlements. Use window.debugKnowledgeStudio() in console to diagnose.`
            : `Access denied (403). Check feature flags and tenant entitlements. Use window.debugKnowledgeStudio() in console to diagnose.`;
          setJobForm((prev) => ({ ...prev, submitting: false, error: enhancedMsg }));
        } else if (res.status === 400) {
          const enhancedMsg = errorText || `Invalid request (400). ${msg}`;
          setJobForm((prev) => ({ ...prev, submitting: false, error: enhancedMsg }));
        } else {
          setJobForm((prev) => ({ ...prev, submitting: false, error: msg }));
        }
        return;
      }

      const data = await res.json().catch(() => ({}));
      if (!data.job_id) {
        setJobForm((prev) => ({ ...prev, submitting: false, error: 'No job_id returned.' }));
        return;
      }

      setJobForm((prev) => ({ ...prev, submitting: false, jobId: data.job_id }));
      startPoll(data.job_id);
    } catch (err) {
      setJobForm((prev) => ({
        ...prev,
        submitting: false,
        error: err instanceof Error ? err.message : 'Failed to start generation.',
      }));
    }
  };

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
        
        // Enhanced error logging for SQL generation issues
        console.error('[Knowledge Studio] Inline generation failed:', {
          status: res.status,
          statusText: res.statusText,
          error: errorData,
          message: errorText,
        });
        
        // Check for SQL generation failures
        const isSqlError = errorText.toLowerCase().includes('sql') || 
                          errorText.toLowerCase().includes('generation failed');
        const enhancedError = isSqlError
          ? `SQL generation failed: ${errorText}. Check backend logs and feature flags. Use GET /api/admin/knowledge/debug/features to diagnose.`
          : errorText || `Generation failed (${res.status}). Please try again.`;
        
        setGen((prev) => ({
          ...prev,
          submitting: false,
          error: enhancedError,
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
    
    const isRecruiterBrief = tpl.id === 'recruiter_candidate_brief_v1';
    const isRecruiterShortlist = tpl.id === 'recruiter_shortlist_email';

    return (
      <Card 
        key={tpl.id} 
        className={`h-full flex flex-col transition-all duration-200 ${
          isLocked 
            ? 'opacity-75 border-slate-300 bg-slate-50 cursor-not-allowed' 
            : 'border-slate-200 hover:border-indigo-300 hover:shadow-lg shadow-sm bg-white'
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
        <CardFooter className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 pt-4 border-t border-slate-100">
          <Button 
            variant="outline" 
            asChild
            className="min-h-[44px] sm:min-h-0 w-full sm:w-auto order-2 sm:order-1"
          >
            <Link href="/admin/knowledge/drafts" className="flex items-center justify-center gap-2">
              <BookOpen className="h-4 w-4" />
              <span>View Drafts</span>
            </Link>
          </Button>
          <Button 
            onClick={() => {
              if (isRecruiterBrief || isRecruiterShortlist) {
                setJobTemplate(tpl);
              } else {
                openGenerate(tpl);
              }
            }} 
            disabled={isLocked || !canUse}
            title={isLocked ? `Requires ${tpl.required_feature} feature` : undefined}
            className="min-h-[44px] sm:min-h-0 w-full sm:w-auto order-1 sm:order-2"
          >
            {isLocked ? (
              <>
                <Lock className="h-4 w-4 mr-2" />
                <span>Locked</span>
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                <span>
                  {isRecruiterBrief
                    ? 'Generate brief'
                    : isRecruiterShortlist
                    ? 'Generate shortlist'
                    : 'Generate drafts'}
                </span>
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    );
  };

  return (
    <div className="mx-auto max-w-7xl px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8 space-y-4 sm:space-y-6">
      {/* Breadcrumbs */}
      <Breadcrumbs items={[{ label: 'Templates' }]} />
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-indigo-600">
            <Sparkles className="h-5 w-5 sm:h-6 sm:w-6" />
            <span className="text-sm sm:text-base font-semibold">Knowledge Studio</span>
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900">
            Template Library
          </h1>
          <p className="text-sm sm:text-base text-slate-600 max-w-2xl">
            Generate cited drafts from templates, edit in the editor, approve, and publish/send—all governed and explicit.
          </p>
          <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-500 pt-1">
            <ShieldCheck className="h-3 w-3 sm:h-4 sm:w-4" />
            <span>Gated by plan features & feature flag</span>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
          <Button 
            variant="outline" 
            asChild
            className="min-h-[44px] sm:min-h-0 w-full sm:w-auto"
          >
            <Link href="/admin/docs" className="flex items-center justify-center gap-2">
              <FileText className="h-4 w-4" />
              <span>Upload Docs</span>
            </Link>
          </Button>
          <Button 
            asChild
            className="min-h-[44px] sm:min-h-0 w-full sm:w-auto"
          >
            <Link href="/admin/knowledge/drafts" className="flex items-center justify-center gap-2">
              <BookOpen className="h-4 w-4" />
              <span>View Drafts</span>
            </Link>
          </Button>
          <Button 
            variant="ghost"
            asChild
            className="min-h-[44px] sm:min-h-0 w-full sm:w-auto"
          >
            <Link href="/admin/knowledge/tagging" className="flex items-center justify-center gap-2">
              <ShieldCheck className="h-4 w-4" />
              <span>Needs Tagging</span>
            </Link>
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

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-4 border-t border-slate-200">
              <Button 
                variant="outline" 
                onClick={() => setSelected(null)}
                disabled={gen.submitting}
                className="min-h-[44px] sm:min-h-0 w-full sm:w-auto order-2 sm:order-1"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleGenerate} 
                disabled={gen.submitting || selectedDocIds.length === 0}
                className="min-h-[44px] sm:min-h-0 w-full sm:w-auto order-1 sm:order-2"
              >
                {gen.submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    <span>Generating drafts...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    <span>Generate Drafts</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Async generate job modal (recruiter templates) */}
      {jobTemplate && (
        <div className="fixed inset-0 z-[130] bg-black/40 backdrop-blur-[2px] flex items-end sm:items-center justify-center px-3"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white w-full sm:max-w-lg rounded-xl shadow-2xl p-5 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-wide text-indigo-600 font-semibold">Generate</p>
                <h3 className="text-lg font-semibold text-slate-900">{jobTemplate.name}</h3>
                {jobTemplate.description && (
                  <p className="text-sm text-slate-600 mt-1">{jobTemplate.description}</p>
                )}
                <p className="text-xs text-slate-500 mt-1">
                  Provide role/candidate context, or specify doc IDs (advanced).
                </p>
              </div>
              <Button variant="ghost" size="sm" onClick={resetJob} disabled={jobForm.submitting || jobForm.polling}>
                Close
              </Button>
            </div>

            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="roleId">Role ID</Label>
                <Input
                  id="roleId"
                  placeholder="ROLE-123"
                  value={jobForm.roleId}
                  onChange={(e) => setJobForm((prev) => ({ ...prev, roleId: e.target.value }))}
                  disabled={jobForm.submitting || jobForm.polling}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="candidateId">Candidate ID</Label>
                <Input
                  id="candidateId"
                  placeholder="CAND-456"
                  value={jobForm.candidateId}
                  onChange={(e) => setJobForm((prev) => ({ ...prev, candidateId: e.target.value }))}
                  disabled={jobForm.submitting || jobForm.polling}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="clientId">Client ID (optional)</Label>
                <Input
                  id="clientId"
                  placeholder="CLIENT-789"
                  value={jobForm.clientId}
                  onChange={(e) => setJobForm((prev) => ({ ...prev, clientId: e.target.value }))}
                  disabled={jobForm.submitting || jobForm.polling}
                />
              </div>

              <details className="text-xs text-slate-500">
                <summary className="cursor-pointer hover:text-slate-700">Advanced: use specific doc IDs</summary>
                <div className="mt-2 space-y-2">
                  <Textarea
                    placeholder="doc_id_1, doc_id_2"
                    value={jobForm.docIds}
                    onChange={(e) => setJobForm((prev) => ({ ...prev, docIds: e.target.value }))}
                    disabled={jobForm.submitting || jobForm.polling}
                    rows={2}
                  />
                  <p className="text-xs text-slate-500">Comma-separated document IDs. Use if context docs are missing.</p>
                </div>
              </details>

              {jobForm.error && (
                <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 space-y-2">
                  {jobForm.error.startsWith('rag_extraction_failed') ? (
                    <>
                      <p>Missing required docs. Please attach a JD and CV for this role/candidate (or provide doc_ids).</p>
                      <p className="text-xs text-red-500 break-words">{jobForm.error}</p>
                    </>
                  ) : (
                    <>
                      <p className="break-words">{jobForm.error}</p>
                      {jobForm.error.includes('403') || jobForm.error.includes('Access denied') ? (
                        <p className="text-xs text-red-600 mt-2">
                          💡 Tip: Run <code className="bg-red-100 px-1 rounded">window.debugKnowledgeStudio()</code> in the browser console for diagnostic info.
                        </p>
                      ) : null}
                    </>
                  )}
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-4 border-t border-slate-200">
              <Button
                variant="outline"
                onClick={resetJob}
                disabled={jobForm.submitting || jobForm.polling}
                className="min-h-[44px] sm:min-h-0 w-full sm:w-auto order-2 sm:order-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmitJob}
                disabled={jobForm.submitting || jobForm.polling}
                className="min-h-[44px] sm:min-h-0 w-full sm:w-auto order-1 sm:order-2"
              >
                {jobForm.submitting ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Starting...
                  </span>
                ) : jobForm.polling ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Generating...
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-2">
                    <Sparkles className="h-4 w-4" />
                    Generate
                  </span>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

