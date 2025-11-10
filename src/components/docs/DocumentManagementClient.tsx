'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Upload, Loader2, FileText, File, Search, Archive, ArchiveRestore, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { DocsUploadForm } from './DocsUploadForm';

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
      
      console.log('Document API Response:', {
        status: response.status,
        data: data,
        docsCount: data.docs?.length || 0,
        documentsCount: data.documents?.length || 0
      });
      
      if (data.error) {
        throw new Error(data.details || data.error);
      }

      // Handle both 'docs' and 'documents' response formats
      const documents = data.docs || data.documents || [];
      console.log('Setting documents:', documents.length, 'items');
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
  const recentUploads = documents
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
          className="px-3 py-1 text-xs bg-red-100 text-red-800 rounded hover:bg-red-200 transition-colors"
        >
          Archive
        </button>
      );
    } else if (doc.status === 'archived') {
      return (
        <button
          onClick={() => handleUnarchive(doc.id)}
          className="px-3 py-1 text-xs bg-green-100 text-green-800 rounded hover:bg-green-200 transition-colors"
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
                <div className="flex gap-4">
                  <div className="flex-1">
                    <Label className="block text-sm font-medium mb-2">Search by title or ID</Label>
                    <Input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Enter document title or ID..."
                    />
                  </div>
                  <div className="w-48">
                    <Label className="block text-sm font-medium mb-2">Status filter</Label>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="w-full border rounded px-3 py-2"
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
                <div className="overflow-x-auto">
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
