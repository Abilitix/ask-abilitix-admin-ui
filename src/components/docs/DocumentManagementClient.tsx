'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Upload, Loader2, FileText, File, Search, Archive, ArchiveRestore, RefreshCw, MoreVertical } from 'lucide-react';
import { toast } from 'sonner';
import { DocsUploadForm } from './DocsUploadForm';
import { BottomSheet } from '@/components/ui/bottom-sheet';

type Document = {
  id: string;
  title: string;
  status: 'active' | 'archived' | 'superseded';
  created_at: string;
  topic_key?: string;
  version?: string;
};


export function DocumentManagementClient() {
  // Document list state
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [mobileActionSheetOpen, setMobileActionSheetOpen] = useState<string | null>(null);

  // Load documents
  const loadDocuments = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/docs?status=all&limit=100', {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-store'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to load documents: ${response.status}`);
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(data.details || data.error);
      }

      // Handle both 'docs' and 'documents' response formats
      const documents = data.docs || data.documents || [];
      setDocuments(documents);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load documents';
      toast.error(`Error: ${errorMessage}`);
      console.error('Load documents error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load documents on mount
  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);


  // Handle archive
  const handleArchive = async (id: string) => {
    try {
      const response = await fetch('/api/admin/docs/archive', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id }),
      });

      if (!response.ok) {
        throw new Error(`Archive failed: ${response.status}`);
      }

      toast.success('Document archived');
      await loadDocuments();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Archive failed';
      toast.error(`Archive failed: ${errorMessage}`);
    }
  };

  // Handle unarchive
  const handleUnarchive = async (id: string) => {
    try {
      const response = await fetch('/api/admin/docs/unarchive', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id }),
      });

      if (!response.ok) {
        throw new Error(`Unarchive failed: ${response.status}`);
      }

      toast.success('Document unarchived');
      await loadDocuments();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unarchive failed';
      toast.error(`Unarchive failed: ${errorMessage}`);
    }
  };


  // Filter documents
  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = !searchTerm || 
      doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || doc.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Get recent uploads (top 5 by creation date)
  const recentUploads = [...documents]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);


  const getStatusBadge = (status: string) => {
    const baseClasses = "px-2 py-1 text-xs rounded-full font-medium";
    switch (status) {
      case 'active':
        return `${baseClasses} bg-green-100 text-green-800`;
      case 'archived':
        return `${baseClasses} bg-gray-100 text-gray-800`;
      case 'superseded':
        return `${baseClasses} bg-yellow-100 text-yellow-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  const getActionButton = (doc: Document) => {
    if (doc.status === 'active') {
      return (
        <button
          onClick={() => handleArchive(doc.id)}
          className="px-3 py-1.5 text-xs bg-red-100 text-red-800 rounded hover:bg-red-200 transition-colors min-h-[44px] min-w-[44px]"
        >
          Archive
        </button>
      );
    } else if (doc.status === 'archived') {
      return (
        <button
          onClick={() => handleUnarchive(doc.id)}
          className="px-3 py-1.5 text-xs bg-green-100 text-green-800 rounded hover:bg-green-200 transition-colors min-h-[44px] min-w-[44px]"
        >
          Unarchive
        </button>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Upload Form */}
      <DocsUploadForm onDone={loadDocuments} />

      {/* Document Management */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {/* Search */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Search className="h-5 w-5" />
                <span>Search Documents</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                  <div className="flex-1">
                    <Label className="block text-sm font-medium mb-2">Search by title or ID</Label>
                    <Input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Enter document title or ID..."
                      className="min-h-[44px]"
                    />
                  </div>
                  <div className="w-full sm:w-48">
                    <Label className="block text-sm font-medium mb-2">Status filter</Label>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="w-full border rounded px-3 py-2 min-h-[44px]"
                    >
                      <option value="all">All documents</option>
                      <option value="active">Active only</option>
                      <option value="archived">Archived only</option>
                      <option value="superseded">Superseded only</option>
                    </select>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Document Table */}
          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Document Management</span>
                <Button
                  onClick={loadDocuments}
                  disabled={loading}
                  size="sm"
                  variant="outline"
                  className="min-h-[44px] sm:min-h-0"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8 text-gray-500">Loading documents...</div>
              ) : filteredDocuments.length === 0 ? (
                <div className="text-center py-8 text-gray-500">No documents found</div>
              ) : (
                <>
                  {/* Desktop Table */}
                  <div className="hidden lg:block overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b text-left">
                          <th className="py-2 pr-4">Title</th>
                          <th className="py-2 pr-4">Status</th>
                          <th className="py-2 pr-4">Created</th>
                          <th className="py-2 pr-4">Topic</th>
                          <th className="py-2">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredDocuments.map((doc) => (
                          <tr key={doc.id} className="border-b hover:bg-gray-50">
                            <td className="py-3 pr-4">
                              <div className="font-medium">{doc.title}</div>
                              <div className="text-xs text-gray-500 font-mono">{doc.id}</div>
                            </td>
                            <td className="py-3 pr-4">
                              <span className={getStatusBadge(doc.status)}>
                                {doc.status}
                              </span>
                            </td>
                            <td className="py-3 pr-4 text-gray-600">
                              {new Date(doc.created_at).toLocaleDateString()}
                            </td>
                            <td className="py-3 pr-4 text-gray-600">
                              {doc.topic_key || '—'}
                            </td>
                            <td className="py-3">
                              {getActionButton(doc)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Card View */}
                  <div className="lg:hidden space-y-4">
                    {filteredDocuments.map((doc) => (
                      <Card key={doc.id}>
                        <CardContent className="p-4 space-y-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-2">
                                <span className={getStatusBadge(doc.status)}>
                                  {doc.status}
                                </span>
                              </div>
                              <h3 className="font-medium text-sm text-slate-900 mb-1 truncate" title={doc.title}>
                                {doc.title}
                              </h3>
                              <p className="text-xs text-slate-500 font-mono mb-2 truncate" title={doc.id}>
                                {doc.id}
                              </p>
                              <div className="space-y-1 text-xs text-slate-600">
                                <div>
                                  <span className="font-medium">Created:</span>{' '}
                                  {new Date(doc.created_at).toLocaleDateString()}
                                </div>
                                {doc.topic_key && (
                                  <div>
                                    <span className="font-medium">Topic:</span> {doc.topic_key}
                                  </div>
                                )}
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setMobileActionSheetOpen(doc.id)}
                              className="h-11 w-11 min-h-[44px] min-w-[44px] flex-shrink-0"
                              aria-label="Actions"
                            >
                              <MoreVertical className="h-5 w-5" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  {/* Mobile Action Bottom Sheet */}
                  {mobileActionSheetOpen && (() => {
                    const doc = filteredDocuments.find(d => d.id === mobileActionSheetOpen);
                    if (!doc) return null;
                    return (
                      <BottomSheet
                        open={!!mobileActionSheetOpen}
                        onClose={() => setMobileActionSheetOpen(null)}
                        title={doc.title}
                        className="max-h-[60vh]"
                      >
                        <div className="space-y-4 pb-4">
                          <div className="space-y-1.5">
                            <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Status</div>
                            <div>
                              <span className={getStatusBadge(doc.status)}>
                                {doc.status}
                              </span>
                            </div>
                          </div>
                          <div className="space-y-1.5">
                            <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Created</div>
                            <div className="text-sm text-slate-700">
                              {new Date(doc.created_at).toLocaleDateString()}
                            </div>
                          </div>
                          {doc.topic_key && (
                            <div className="space-y-1.5">
                              <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Topic</div>
                              <div className="text-sm text-slate-700">{doc.topic_key}</div>
                            </div>
                          )}
                          <div className="pt-2 border-t">
                            {doc.status === 'active' ? (
                              <Button
                                onClick={() => {
                                  handleArchive(doc.id);
                                  setMobileActionSheetOpen(null);
                                }}
                                className="w-full bg-red-100 text-red-800 hover:bg-red-200 min-h-[44px]"
                                variant="outline"
                              >
                                <Archive className="h-4 w-4 mr-2" />
                                Archive Document
                              </Button>
                            ) : doc.status === 'archived' ? (
                              <Button
                                onClick={() => {
                                  handleUnarchive(doc.id);
                                  setMobileActionSheetOpen(null);
                                }}
                                className="w-full bg-green-100 text-green-800 hover:bg-green-200 min-h-[44px]"
                                variant="outline"
                              >
                                <ArchiveRestore className="h-4 w-4 mr-2" />
                                Unarchive Document
                              </Button>
                            ) : null}
                          </div>
                        </div>
                      </BottomSheet>
                    );
                  })()}
                </>
              )}
            </CardContent>
          </Card>
        </div>
        
        <div className="space-y-4">
          {/* Recent Uploads */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Uploads</CardTitle>
            </CardHeader>
            <CardContent>
              {recentUploads.length === 0 ? (
                <div className="text-sm text-gray-500">
                  Recent uploads will appear here
                </div>
              ) : (
                <div className="space-y-2">
                  {recentUploads.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between py-2 border-b last:border-b-0">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900 truncate">
                          {doc.title}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(doc.created_at).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric', 
                            year: 'numeric',
                            hour: 'numeric',
                            minute: '2-digit'
                          })}
                        </div>
                      </div>
                      <span className={getStatusBadge(doc.status)}>
                        {doc.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
