'use client';

import { useState, useEffect, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Search, X, Check, Loader2, FileText, AlertCircle } from 'lucide-react';
import type { Document } from '@/lib/types/documents';

type DocumentPickerProps = {
  selectedDocIds: string[];
  onSelectionChange: (docIds: string[]) => void;
  disabled?: boolean;
  maxSelection?: number;
};

export function DocumentPicker({
  selectedDocIds,
  onSelectionChange,
  disabled = false,
  maxSelection,
}: DocumentPickerProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch documents
  useEffect(() => {
    let active = true;
    const fetchDocs = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch all documents (not just 'active') to show more options
        // Backend will filter out deleted/superseded, but we want to show pending/processing too
        const params = new URLSearchParams({
          status: 'all', // Show all non-deleted documents
          limit: '100', // Fetch up to 100 documents
          ...(searchQuery && { search: searchQuery }), // Backend expects `search`
        });
        
        const res = await fetch(`/api/admin/docs?${params}`, { cache: 'no-store' });
        if (!active) return;

        if (!res.ok) {
          const errorText = await res.text().catch(() => '');
          setError(`Failed to load documents (${res.status}). ${errorText || 'Please try again.'}`);
          setDocuments([]);
          return;
        }

        // Read raw response for debugging
        const responseText = await res.text();
        let data: any;
        try {
          data = JSON.parse(responseText);
        } catch {
          console.error('[DocumentPicker] Failed to parse /api/admin/docs JSON', {
            status: res.status,
            responseText: responseText?.slice(0, 500),
          });
          setError('Invalid response format from /api/admin/docs.');
          setDocuments([]);
          return;
        }

        // Handle various backend shapes: { items: [...] }, { documents: [...] }, nested data, or an array response
        const candidates = [
          (data as any)?.items,
          (data as any)?.documents,
          (data as any)?.data?.items,
          (data as any)?.data?.documents,
          (data as any)?.results,
          (data as any)?.docs,
          Array.isArray(data) ? data : null,
        ].filter(Boolean);

        // Find the first non-empty array; if none, try any array even if empty; otherwise empty array
        let docs: any[] = [];
        for (const c of candidates) {
          if (Array.isArray(c) && c.length > 0) {
            docs = c;
            break;
          }
        }
        if (docs.length === 0) {
          const firstArray = candidates.find((c) => Array.isArray(c));
          if (Array.isArray(firstArray)) {
            docs = firstArray;
          }
        }
        
        // Debug logging
        console.log('[DocumentPicker] Documents fetched:', {
          status: res.status,
          total: data?.total || data?.count || docs.length || 0,
          itemsCount: docs.length,
          keys: Object.keys(data || {}),
          documents: docs.map((d: Document) => ({
            id: (d as any).id || d.doc_id,
            title: d.title,
            status: (d as any).status || d.doc_status,
            upload_status: d.upload_status,
          })),
          rawSample: responseText?.slice(0, 300),
        });
        
        setDocuments(docs);
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : 'Failed to load documents.');
          setDocuments([]);
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    // Debounce search
    const timeoutId = setTimeout(() => {
      fetchDocs();
    }, searchQuery ? 300 : 0);

    return () => {
      active = false;
      clearTimeout(timeoutId);
    };
  }, [searchQuery]);

  // Filter documents by search query and status
  // Only show documents that are usable (not deleted, not superseded)
  const filteredDocuments = useMemo(() => {
    // First filter by status - exclude deleted and superseded
    const usableDocs = documents.filter((doc) => {
      const status = (doc as any).status || doc.doc_status;
      return status !== 'deleted' && status !== 'superseded';
    });
    
    // Then filter by search query if provided
    if (!searchQuery.trim()) return usableDocs;
    
    const query = searchQuery.toLowerCase();
    return usableDocs.filter(
      (doc) =>
        doc.title?.toLowerCase().includes(query) ||
        doc.file_name?.toLowerCase().includes(query) ||
        doc.doc_id?.toLowerCase().includes(query)
    );
  }, [documents, searchQuery]);

  // Get document ID (handle both 'id' and 'doc_id' fields)
  const getDocumentId = (doc: Document): string => {
    return (doc as any).id || doc.doc_id || '';
  };

  // Toggle document selection
  const toggleSelection = (doc: Document) => {
    if (disabled) return;
    
    const docId = getDocumentId(doc);
    if (!docId) return;

    const isSelected = selectedDocIds.includes(docId);
    
    if (isSelected) {
      // Deselect
      onSelectionChange(selectedDocIds.filter((id) => id !== docId));
    } else {
      // Select (check max selection limit)
      if (maxSelection && selectedDocIds.length >= maxSelection) {
        return; // Don't allow more selections
      }
      onSelectionChange([...selectedDocIds, docId]);
    }
  };

  // Remove selected document
  const removeSelection = (docId: string) => {
    if (disabled) return;
    onSelectionChange(selectedDocIds.filter((id) => id !== docId));
  };

  // Get selected documents for display
  const selectedDocuments = useMemo(() => {
    return documents.filter((doc) => selectedDocIds.includes(getDocumentId(doc)));
  }, [documents, selectedDocIds]);

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input
          type="text"
          placeholder="Search documents by title, filename, or ID..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          disabled={disabled || loading}
          className="pl-10"
        />
      </div>

      {/* Selected Documents (Chips) */}
      {selectedDocuments.length > 0 && (
        <div className="space-y-2">
          <div className="text-sm font-medium text-slate-700">Selected Documents ({selectedDocuments.length})</div>
          <div className="flex flex-wrap gap-2">
            {selectedDocuments.map((doc) => {
              const docId = getDocumentId(doc);
              return (
                <Badge
                  key={docId}
                  variant="secondary"
                  className="flex items-center gap-1.5 px-2 py-1 text-xs"
                >
                  <FileText className="h-3 w-3" />
                  <span className="max-w-[200px] truncate">{doc.title || doc.file_name || docId}</span>
                  {!disabled && (
                    <button
                      type="button"
                      onClick={() => removeSelection(docId)}
                      className="ml-1 hover:bg-slate-200 rounded-full p-0.5"
                      aria-label="Remove document"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </Badge>
              );
            })}
          </div>
        </div>
      )}

      {/* Document List */}
      <div className="space-y-2">
        {loading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
            <span className="ml-2 text-sm text-slate-500">Loading documents...</span>
          </div>
        )}

        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          </div>
        )}

        {!loading && !error && filteredDocuments.length === 0 && (
          <div className="text-center py-8 text-sm text-slate-500">
            {searchQuery ? (
              <>
                <FileText className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                <p>No documents found matching &quot;{searchQuery}&quot;</p>
                <p className="text-xs mt-1">Try a different search term or upload documents first</p>
              </>
            ) : (
              <>
                <FileText className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                <p>No documents available</p>
                <p className="text-xs mt-1">Upload documents first to generate drafts</p>
              </>
            )}
          </div>
        )}

        {!loading && !error && filteredDocuments.length > 0 && (
          <div className="max-h-[300px] overflow-y-auto space-y-2 border border-slate-200 rounded-md p-2">
            {filteredDocuments.map((doc) => {
              const docId = getDocumentId(doc);
              const isSelected = selectedDocIds.includes(docId);
              const isDisabled = maxSelection && !isSelected && selectedDocIds.length >= maxSelection;

              return (
                <Card
                  key={docId}
                  className={`cursor-pointer transition-all ${
                    isSelected
                      ? 'border-indigo-500 bg-indigo-50'
                      : isDisabled
                      ? 'opacity-50 cursor-not-allowed'
                      : 'hover:border-slate-300 hover:shadow-sm'
                  }`}
                  onClick={() => !isDisabled && toggleSelection(doc)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <FileText className="h-4 w-4 text-slate-400 flex-shrink-0" />
                          <span className="font-medium text-sm text-slate-900 truncate">
                            {doc.title || doc.file_name || 'Untitled Document'}
                          </span>
                          {isSelected && (
                            <Badge variant="default" className="ml-auto flex-shrink-0">
                              <Check className="h-3 w-3 mr-1" />
                              Selected
                            </Badge>
                          )}
                        </div>
                        {doc.file_name && doc.file_name !== doc.title && (
                          <p className="text-xs text-slate-500 truncate">{doc.file_name}</p>
                        )}
                        <p className="text-xs text-slate-400 mt-1 font-mono truncate">ID: {docId}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {maxSelection && selectedDocIds.length >= maxSelection && (
          <p className="text-xs text-amber-600 mt-2">
            Maximum {maxSelection} document{maxSelection !== 1 ? 's' : ''} selected
          </p>
        )}
      </div>
    </div>
  );
}

