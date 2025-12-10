'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Breadcrumbs } from '@/components/knowledge/Breadcrumbs';
import { AlertCircle, CheckCircle2, RefreshCw, Filter, FileText } from 'lucide-react';
import { toast } from 'sonner';

type Doc = {
  doc_id: string;
  id?: string;
  title?: string;
  file_name?: string;
  status?: string;
  doc_status?: string;
  upload_status?: string;
  document_type?: string | null;
  role_id?: string | null;
  candidate_id?: string | null;
  client_id?: string | null;
};

type FilterState = {
  search: string;
  missingType: boolean;
  missingRole: boolean;
  missingCandidate: boolean;
};

const KNOWN_TYPES = ['jd', 'job_description', 'cv', 'resume', 'policy', 'contract', 'note', 'email'];

export function TaggingListClient() {
  const [docs, setDocs] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingIds, setSavingIds] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    missingType: true,
    missingRole: true,
    missingCandidate: true,
  });

  const loadDocs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      
      // Search query
      if (filters.search.trim()) {
        params.append('q', filters.search.trim());
      }
      
      // Filter flags - backend handles filtering
      if (filters.missingType) {
        params.append('missing_type', 'true');
      }
      // missing_role covers both role_id and candidate_id for recruiter docs
      if (filters.missingRole || filters.missingCandidate) {
        params.append('missing_role', 'true');
      }
      
      // Pagination
      params.append('limit', '100');
      
      const url = `/api/admin/knowledge/tagging?${params.toString()}`;
      console.log('[Tagging] Fetching:', url);
      
      const res = await fetch(url, { cache: 'no-store' });
      
      console.log('[Tagging] Response status:', res.status);
      
      if (res.status === 401) {
        setError('Authentication required. Please sign in again.');
        setLoading(false);
        return;
      }
      
      if (res.status === 403) {
        setError('Knowledge Studio is not enabled for this tenant.');
        setLoading(false);
        return;
      }
      
      if (res.status === 404) {
        setError('Tagging endpoint not found. The backend endpoint may not be implemented yet.');
        setLoading(false);
        return;
      }
      
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        console.error('[Tagging] Error response:', text);
        setError(`Failed to load documents (${res.status}): ${text || 'Unknown error'}`);
        setLoading(false);
        return;
      }
      
      const data = await res.json();
      console.log('[Tagging] Response data:', data);
      
      // Debug logging
      if (process.env.NODE_ENV !== 'production') {
        console.log('[Tagging] API response:', {
          status: res.status,
          dataKeys: Object.keys(data || {}),
          isArray: Array.isArray(data),
          hasItems: Array.isArray(data?.items),
          itemsCount: Array.isArray(data?.items) ? data.items.length : 0,
          arrayCount: Array.isArray(data) ? data.length : 0,
        });
      }
      
      // Handle response format (items array or direct array)
      const items =
        (Array.isArray(data?.items) && data.items) ||
        (Array.isArray(data) && data) ||
        [];
      
      console.log('[Tagging] Loaded documents:', items.length, 'items');
      console.log('[Tagging] Sample item:', items[0]);
      
      if (items.length === 0) {
        console.log('[Tagging] No documents returned. Filters:', {
          missingType: filters.missingType,
          missingRole: filters.missingRole,
          missingCandidate: filters.missingCandidate,
          search: filters.search,
        });
      }
      
      setDocs(items);
    } catch (err) {
      console.error('[Tagging] Exception:', err);
      setError(err instanceof Error ? err.message : 'Failed to load documents.');
    } finally {
      setLoading(false);
    }
  }, [filters.search, filters.missingType, filters.missingRole, filters.missingCandidate]);

  useEffect(() => {
    loadDocs();
  }, [loadDocs]);

  // Backend handles filtering, so we just display the returned docs
  // But we still need to check which fields are missing for UI badges
  const needsTagging = (doc: Doc) => {
    const type = doc.document_type?.toLowerCase();
    const missingType = !type || !KNOWN_TYPES.includes(type);
    const missingRole = !doc.role_id;
    const missingCandidate = !doc.candidate_id;
    return {
      missingType,
      missingRole,
      missingCandidate,
      needs: missingType || missingRole || missingCandidate,
    };
  };

  const handleFieldChange = (docId: string, field: keyof Doc, value: string) => {
    setDocs((prev) =>
      prev.map((d) => {
        const id = (d as any).id || d.doc_id;
        if (id !== docId) return d;
        return { ...d, [field]: value };
      })
    );
  };

  const saveDoc = async (doc: Doc) => {
    const id = (doc as any).id || doc.doc_id;
    if (!id) return;
    setSavingIds((prev) => new Set(prev).add(id));
    try {
      const payload = {
        document_type: doc.document_type || null,
        role_id: doc.role_id || null,
        candidate_id: doc.candidate_id || null,
        client_id: doc.client_id || null,
      };
      const res = await fetch(`/api/admin/docs/${id}/metadata`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(text || `Failed to save (${res.status})`);
      }
      toast.success('Saved tags');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save tags');
    } finally {
      setSavingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const renderDoc = (doc: Doc) => {
    const id = (doc as any).id || doc.doc_id || 'unknown';
    const type = doc.document_type || '';
    const status = doc.status || doc.doc_status;
    const { missingType, missingRole, missingCandidate } = needsTagging(doc);
    const isSaving = savingIds.has(id);

    return (
      <Card key={id} className="border-slate-200 hover:border-slate-300 hover:shadow-md transition-all duration-200">
        <CardHeader className="pb-3 sm:pb-4">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-base sm:text-lg font-semibold truncate">
                {doc.title || doc.file_name || 'Untitled document'}
              </CardTitle>
              <CardDescription className="text-xs font-mono break-all mt-1">
                ID: {id}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Badge variant="secondary" className="capitalize text-xs">
                {status || 'unknown'}
              </Badge>
              {missingType || missingRole || missingCandidate ? (
                <Badge variant="destructive" className="text-xs">
                  Needs tagging
                </Badge>
              ) : (
                <Badge className="bg-green-100 text-green-700 border-green-200 text-xs">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Ready
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 sm:space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
            <div className="space-y-2">
              <Label htmlFor={`type-${id}`} className="text-sm font-medium">
                Document type
                {missingType && <span className="text-amber-600 ml-1">*</span>}
              </Label>
              <select
                id={`type-${id}`}
                value={type}
                onChange={(e) => handleFieldChange(id, 'document_type', e.target.value)}
                className="w-full rounded-md border border-input bg-white px-3 py-2.5 text-sm min-h-[44px] sm:min-h-0 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isSaving}
              >
                <option value="">Select type</option>
                <option value="jd">JD</option>
                <option value="cv">CV</option>
                <option value="resume">Resume</option>
                <option value="policy">Policy</option>
                <option value="contract">Contract</option>
                <option value="note">Note</option>
                <option value="email">Email</option>
              </select>
              {missingType && <p className="text-xs text-amber-600">Required</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor={`role-${id}`} className="text-sm font-medium">
                Role ID
                {missingRole && <span className="text-amber-600 ml-1">*</span>}
              </Label>
              <Input
                id={`role-${id}`}
                value={doc.role_id || ''}
                onChange={(e) => handleFieldChange(id, 'role_id', e.target.value)}
                disabled={isSaving}
                placeholder="ROLE-123"
                className="min-h-[44px] sm:min-h-0"
              />
              {missingRole && <p className="text-xs text-amber-600">Required for recruiter flows</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor={`candidate-${id}`} className="text-sm font-medium">
                Candidate ID
                {missingCandidate && <span className="text-amber-600 ml-1">*</span>}
              </Label>
              <Input
                id={`candidate-${id}`}
                value={doc.candidate_id || ''}
                onChange={(e) => handleFieldChange(id, 'candidate_id', e.target.value)}
                disabled={isSaving}
                placeholder="CAND-456"
                className="min-h-[44px] sm:min-h-0"
              />
              {missingCandidate && <p className="text-xs text-amber-600">Required for recruiter flows</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor={`client-${id}`} className="text-sm font-medium">
                Client ID <span className="text-slate-400 font-normal">(optional)</span>
              </Label>
              <Input
                id={`client-${id}`}
                value={doc.client_id || ''}
                onChange={(e) => handleFieldChange(id, 'client_id', e.target.value)}
                disabled={isSaving}
                placeholder="CLIENT-789"
                className="min-h-[44px] sm:min-h-0"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2 border-t border-slate-100">
            <Button
              onClick={() => saveDoc(doc)}
              disabled={isSaving}
              className="min-h-[44px] sm:min-h-0 min-w-[120px]"
            >
              {isSaving ? (
                <span className="inline-flex items-center gap-2">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span className="hidden sm:inline">Saving...</span>
                  <span className="sm:hidden">Saving</span>
                </span>
              ) : (
                'Save'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <Card className="shadow-sm border-slate-200">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4">
          <div>
            <CardTitle className="text-lg sm:text-xl">Documents Needing Tags</CardTitle>
            <CardDescription className="text-sm mt-1">
              Filter and tag documents with missing type, role, or candidate information.
            </CardDescription>
          </div>
          <Button 
            variant="outline" 
            onClick={loadDocs} 
            disabled={loading} 
            className="min-h-[44px] sm:min-h-0 w-full sm:w-auto"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-4 sm:gap-6">
            <div className="space-y-2">
              <Label htmlFor="search" className="text-sm font-medium">Search</Label>
              <Input
                id="search"
                placeholder="Search by title, filename, or ID"
                value={filters.search}
                onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
                className="min-h-[44px] sm:min-h-0"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Filters</Label>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant={filters.missingType ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilters((prev) => ({ ...prev, missingType: !prev.missingType }))}
                  className="min-h-[44px] sm:min-h-0 gap-2"
                >
                  <Filter className="h-4 w-4" />
                  <span className="hidden sm:inline">Missing type</span>
                  <span className="sm:hidden">Type</span>
                </Button>
                <Button
                  type="button"
                  variant={filters.missingRole ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilters((prev) => ({ ...prev, missingRole: !prev.missingRole }))}
                  className="min-h-[44px] sm:min-h-0 gap-2"
                >
                  <Filter className="h-4 w-4" />
                  <span className="hidden sm:inline">Missing role</span>
                  <span className="sm:hidden">Role</span>
                </Button>
                <Button
                  type="button"
                  variant={filters.missingCandidate ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilters((prev) => ({ ...prev, missingCandidate: !prev.missingCandidate }))}
                  className="min-h-[44px] sm:min-h-0 gap-2"
                >
                  <Filter className="h-4 w-4" />
                  <span className="hidden sm:inline">Missing candidate</span>
                  <span className="sm:hidden">Candidate</span>
                </Button>
              </div>
            </div>
          </div>

          {loading && (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardContent className="p-4 sm:p-6 space-y-3">
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-10 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}

          {!loading && !error && docs.length === 0 && (
            <div className="text-center py-10 space-y-3">
              <FileText className="h-8 w-8 mx-auto text-slate-300" />
              <p className="text-sm text-slate-600">No documents need tagging based on your filters.</p>
              <p className="text-xs text-slate-500">
                Try refreshing, adjusting filters, or uploading new documents.
              </p>
            </div>
          )}

          {!loading && !error && docs.length > 0 && (
            <div className="space-y-4 sm:space-y-5">
              <div className="text-sm text-slate-600 font-medium">
                Showing {docs.length} document{docs.length === 1 ? '' : 's'} needing tagging.
              </div>
              <div className="space-y-4 sm:space-y-5">
                {docs.map((doc) => renderDoc(doc))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

