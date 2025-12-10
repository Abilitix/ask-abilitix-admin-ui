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
      
      // Always log the response (even in production) to debug
      console.log('[Tagging] Full API response:', JSON.stringify(data, null, 2));
      console.log('[Tagging] Response type:', typeof data);
      console.log('[Tagging] Is array:', Array.isArray(data));
      console.log('[Tagging] Data keys:', Object.keys(data || {}));
      
      // Check various possible response formats
      let items: Doc[] = [];
      
      if (Array.isArray(data)) {
        // Direct array response
        items = data;
        console.log('[Tagging] Found direct array with', items.length, 'items');
      } else if (Array.isArray(data?.items)) {
        // { items: [...] } format
        items = data.items;
        console.log('[Tagging] Found items array with', items.length, 'items');
      } else if (Array.isArray(data?.documents)) {
        // { documents: [...] } format
        items = data.documents;
        console.log('[Tagging] Found documents array with', items.length, 'items');
      } else if (data && typeof data === 'object') {
        // Check for other possible keys
        const possibleKeys = ['results', 'data', 'docs', 'list'];
        for (const key of possibleKeys) {
          if (Array.isArray(data[key])) {
            items = data[key];
            console.log(`[Tagging] Found ${key} array with`, items.length, 'items');
            break;
          }
        }
      }
      
      console.log('[Tagging] Final items count:', items.length);
      if (items.length > 0) {
        console.log('[Tagging] Sample item:', items[0]);
      } else {
        console.log('[Tagging] No items found. Raw response structure:', {
          isArray: Array.isArray(data),
          hasItems: Array.isArray(data?.items),
          hasDocuments: Array.isArray(data?.documents),
          keys: Object.keys(data || {}),
          dataType: typeof data,
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

  // Backend handles filtering, but we need to check which fields are missing for UI badges
  // Data model:
  // - JD: requires role_id only, candidate_id should be NULL
  // - CV: requires candidate_id, role_id is recommended
  const needsTagging = (doc: Doc) => {
    const type = doc.document_type?.toLowerCase();
    const missingType = !type || !KNOWN_TYPES.includes(type);
    const isJD = type === 'jd' || type === 'job_description';
    const isCV = type === 'cv' || type === 'resume';
    
    // JD: only role_id is required
    const missingRole = isJD && !doc.role_id;
    // CV: candidate_id is required, role_id is recommended
    const missingCandidate = isCV && !doc.candidate_id;
    const missingRoleForCV = isCV && !doc.role_id; // Recommended but not required
    
    return {
      missingType,
      missingRole,
      missingCandidate,
      missingRoleForCV,
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
      const typeLower = (doc.document_type || '').toLowerCase();
      const isJD = typeLower === 'jd' || typeLower === 'job_description';
      
      // Data model: JD should have candidate_id = null
      const payload = {
        document_type: doc.document_type || null,
        role_id: doc.role_id || null,
        candidate_id: isJD ? null : (doc.candidate_id || null), // JD: always null, CV: use value
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
      toast.success('Tags saved successfully', {
        description: 'Document has been updated with the new tags.',
      });
      
      // Reload the list to reflect changes (document might no longer need tagging)
      await loadDocs();
    } catch (err) {
      toast.error('Failed to save tags', {
        description: err instanceof Error ? err.message : 'Please try again.',
      });
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
    const typeLower = type.toLowerCase();
    const isJD = typeLower === 'jd' || typeLower === 'job_description';
    const isCV = typeLower === 'cv' || typeLower === 'resume';
    const status = doc.status || doc.doc_status;
    const { missingType, missingRole, missingCandidate, missingRoleForCV } = needsTagging(doc);
    const isSaving = savingIds.has(id);

    return (
      <Card key={id} className="border-slate-200 hover:border-slate-300 hover:shadow-lg transition-all duration-200 bg-white">
        <CardHeader className="pb-4 sm:pb-5 border-b border-slate-100">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-base sm:text-lg font-semibold text-slate-900 truncate">
                {doc.title || doc.file_name || 'Untitled document'}
              </CardTitle>
              <CardDescription className="text-xs text-slate-500 font-mono break-all mt-1.5">
                ID: {id.slice(0, 8)}...
              </CardDescription>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
              <Badge variant="secondary" className="capitalize text-xs font-medium">
                {status || 'unknown'}
              </Badge>
              {missingType || missingRole || missingCandidate ? (
                <Badge variant="destructive" className="text-xs font-medium">
                  Needs tagging
                </Badge>
              ) : (
                <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs font-medium">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Ready
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 space-y-5">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
            <div className="space-y-2">
              <Label htmlFor={`type-${id}`} className="text-sm font-semibold text-slate-700">
                Document type
                {missingType && <span className="text-red-500 ml-1">*</span>}
              </Label>
              <select
                id={`type-${id}`}
                value={type}
                onChange={(e) => handleFieldChange(id, 'document_type', e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm font-medium min-h-[44px] focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                disabled={isSaving}
              >
                <option value="">Select document type</option>
                <option value="jd">Job Description (JD)</option>
                <option value="cv">CV</option>
                <option value="resume">Resume</option>
                <option value="policy">Policy</option>
                <option value="contract">Contract</option>
                <option value="note">Note</option>
                <option value="email">Email</option>
              </select>
              {missingType && (
                <p className="text-xs text-amber-600 font-medium flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  Required field
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor={`role-${id}`} className="text-sm font-semibold text-slate-700">
                Role ID
                {missingRole && <span className="text-red-500 ml-1">*</span>}
                {isCV && !missingRole && <span className="text-slate-400 ml-1 text-xs font-normal">(recommended)</span>}
              </Label>
              <Input
                id={`role-${id}`}
                value={doc.role_id || ''}
                onChange={(e) => handleFieldChange(id, 'role_id', e.target.value)}
                disabled={isSaving}
                placeholder={isJD ? "Enter role identifier (required)" : "Enter role identifier (recommended)"}
                className="min-h-[44px] sm:min-h-0 font-mono text-sm"
              />
              {missingRole && (
                <p className="text-xs text-amber-600 font-medium flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {isJD ? 'Required for JD documents' : 'Recommended for CV documents'}
                </p>
              )}
              {missingRoleForCV && !missingRole && (
                <p className="text-xs text-slate-500 font-medium flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  Recommended: Link CV to a specific role
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor={`candidate-${id}`} className="text-sm font-semibold text-slate-700">
                Candidate ID
                {missingCandidate && <span className="text-red-500 ml-1">*</span>}
                {isJD && <span className="text-slate-400 ml-1 text-xs font-normal">(leave empty for JD)</span>}
              </Label>
              <Input
                id={`candidate-${id}`}
                value={doc.candidate_id || ''}
                onChange={(e) => {
                  // For JD, always set to empty/null
                  if (isJD) {
                    handleFieldChange(id, 'candidate_id', '');
                  } else {
                    handleFieldChange(id, 'candidate_id', e.target.value);
                  }
                }}
                disabled={isSaving || isJD}
                placeholder={isJD ? "Not applicable for JD documents" : "Enter candidate identifier (required)"}
                className="min-h-[44px] sm:min-h-0 font-mono text-sm"
              />
              {missingCandidate && (
                <p className="text-xs text-amber-600 font-medium flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  Required for CV documents
                </p>
              )}
              {isJD && doc.candidate_id && (
                <p className="text-xs text-amber-600 font-medium flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  JD documents should not have candidate_id (will be cleared on save)
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor={`client-${id}`} className="text-sm font-semibold text-slate-700">
                Client ID <span className="text-slate-400 font-normal text-xs">(optional)</span>
              </Label>
              <Input
                id={`client-${id}`}
                value={doc.client_id || ''}
                onChange={(e) => handleFieldChange(id, 'client_id', e.target.value)}
                disabled={isSaving}
                placeholder="Enter client identifier (optional)"
                className="min-h-[44px] sm:min-h-0 font-mono text-sm"
              />
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100">
            <Button
              onClick={() => saveDoc(doc)}
              disabled={
                isSaving || 
                (!doc.document_type && missingType) ||
                (isJD && !doc.role_id) || // JD requires role_id
                (isCV && !doc.candidate_id) // CV requires candidate_id
              }
              className="min-h-[44px] sm:min-h-0 min-w-[140px] font-semibold shadow-sm hover:shadow-md transition-shadow"
            >
              {isSaving ? (
                <span className="inline-flex items-center gap-2">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span className="hidden sm:inline">Saving...</span>
                  <span className="sm:hidden">Saving</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  Save tags
                </span>
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
              <p className="text-sm text-slate-600 font-medium">No documents need tagging</p>
              <p className="text-xs text-slate-500">
                {filters.missingType || filters.missingRole || filters.missingCandidate
                  ? 'No documents match your current filters. Try adjusting the filters or uploading new documents.'
                  : 'All documents appear to be properly tagged. Upload new documents to tag them.'}
              </p>
              {(filters.missingType || filters.missingRole || filters.missingCandidate) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setFilters({
                      search: '',
                      missingType: true,
                      missingRole: true,
                      missingCandidate: true,
                    });
                  }}
                  className="mt-2"
                >
                  Reset Filters
                </Button>
              )}
            </div>
          )}

          {!loading && !error && docs.length > 0 && (
            <div className="space-y-5 sm:space-y-6">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="text-sm text-slate-600 font-semibold">
                  Showing <span className="text-slate-900">{docs.length}</span> document{docs.length === 1 ? '' : 's'} needing tagging
                </div>
                <div className="text-xs text-slate-500">
                  {docs.filter(d => {
                    const { missingType, missingRole, missingCandidate } = needsTagging(d);
                    return missingType || missingRole || missingCandidate;
                  }).length} require action
                </div>
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

