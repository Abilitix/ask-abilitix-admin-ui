'use client';

import { useEffect, useMemo, useState } from 'react';
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

  const loadDocs = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ status: 'all', limit: '200' });
      const res = await fetch(`/api/admin/docs?${params.toString()}`, { cache: 'no-store' });
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(text || `Failed to load documents (${res.status})`);
      }
      const data = await res.json();
      const items =
        (Array.isArray(data?.items) && data.items) ||
        (Array.isArray(data?.documents) && data.documents) ||
        (Array.isArray(data) && data) ||
        [];
      setDocs(items);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load documents.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocs();
  }, []);

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

  const filtered = useMemo(() => {
    return docs.filter((doc) => {
      const { missingType, missingRole, missingCandidate, needs } = needsTagging(doc);
      if (!needs) return false;

      if (filters.missingType && !missingType) return false;
      if (filters.missingRole && !missingRole) return false;
      if (filters.missingCandidate && !missingCandidate) return false;

      if (filters.search.trim()) {
        const q = filters.search.toLowerCase();
        const text =
          `${doc.title || ''} ${doc.file_name || ''} ${doc.doc_id || ''} ${doc.document_type || ''}`.toLowerCase();
        if (!text.includes(q)) return false;
      }
      return true;
    });
  }, [docs, filters]);

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
      const res = await fetch(`/api/admin/docs/${id}`, {
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
      <Card key={id} className="border-slate-200 hover:border-slate-300 hover:shadow-sm transition">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle className="text-base">{doc.title || doc.file_name || 'Untitled document'}</CardTitle>
              <CardDescription className="text-xs font-mono break-all">ID: {id}</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="capitalize">
                {status || 'unknown'}
              </Badge>
              {missingType || missingRole || missingCandidate ? (
                <Badge variant="destructive">Needs tagging</Badge>
              ) : (
                <Badge className="bg-green-100 text-green-700 border-green-200">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Ready
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor={`type-${id}`}>Document type</Label>
              <select
                id={`type-${id}`}
                value={type}
                onChange={(e) => handleFieldChange(id, 'document_type', e.target.value)}
                className="w-full rounded-md border border-input bg-white px-3 py-2 text-sm"
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
            <div className="space-y-1">
              <Label htmlFor={`role-${id}`}>Role ID</Label>
              <Input
                id={`role-${id}`}
                value={doc.role_id || ''}
                onChange={(e) => handleFieldChange(id, 'role_id', e.target.value)}
                disabled={isSaving}
                placeholder="ROLE-123"
              />
              {missingRole && <p className="text-xs text-amber-600">Required for recruiter flows</p>}
            </div>
            <div className="space-y-1">
              <Label htmlFor={`candidate-${id}`}>Candidate ID</Label>
              <Input
                id={`candidate-${id}`}
                value={doc.candidate_id || ''}
                onChange={(e) => handleFieldChange(id, 'candidate_id', e.target.value)}
                disabled={isSaving}
                placeholder="CAND-456"
              />
              {missingCandidate && <p className="text-xs text-amber-600">Required for recruiter flows</p>}
            </div>
            <div className="space-y-1">
              <Label htmlFor={`client-${id}`}>Client ID (optional)</Label>
              <Input
                id={`client-${id}`}
                value={doc.client_id || ''}
                onChange={(e) => handleFieldChange(id, 'client_id', e.target.value)}
                disabled={isSaving}
                placeholder="CLIENT-789"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              onClick={() => saveDoc(doc)}
              disabled={isSaving}
              className="min-h-[38px] min-w-[120px]"
            >
              {isSaving ? (
                <span className="inline-flex items-center gap-2">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Saving...
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
      <Breadcrumbs items={[{ label: 'Needs tagging' }]} />

      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-bold">Needs Tagging</h1>
          <p className="text-sm sm:text-base text-slate-600">
            Tag JDs and CVs with role and candidate so recruiter generators can select the right documents.
          </p>
        </div>
        <Button variant="outline" onClick={loadDocs} disabled={loading} className="w-full sm:w-auto">
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <Card>
        <CardContent className="p-4 sm:p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-3">
            <div>
              <Label htmlFor="search">Search</Label>
              <Input
                id="search"
                placeholder="Search by title, filename, or ID"
                value={filters.search}
                onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label>Filters</Label>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant={filters.missingType ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilters((prev) => ({ ...prev, missingType: !prev.missingType }))}
                  className="gap-2"
                >
                  <Filter className="h-4 w-4" />
                  Missing type
                </Button>
                <Button
                  type="button"
                  variant={filters.missingRole ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilters((prev) => ({ ...prev, missingRole: !prev.missingRole }))}
                  className="gap-2"
                >
                  <Filter className="h-4 w-4" />
                  Missing role
                </Button>
                <Button
                  type="button"
                  variant={filters.missingCandidate ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilters((prev) => ({ ...prev, missingCandidate: !prev.missingCandidate }))}
                  className="gap-2"
                >
                  <Filter className="h-4 w-4" />
                  Missing candidate
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

          {!loading && !error && filtered.length === 0 && (
            <div className="text-center py-10 space-y-3">
              <FileText className="h-8 w-8 mx-auto text-slate-300" />
              <p className="text-sm text-slate-600">No documents need tagging based on your filters.</p>
              <p className="text-xs text-slate-500">
                Try refreshing, adjusting filters, or uploading new documents.
              </p>
            </div>
          )}

          {!loading && !error && filtered.length > 0 && (
            <div className="space-y-3">
              <div className="text-sm text-slate-600">
                Showing {filtered.length} document{filtered.length === 1 ? '' : 's'} needing tagging.
              </div>
              <div className="space-y-3">
                {filtered.map((doc) => renderDoc(doc))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

