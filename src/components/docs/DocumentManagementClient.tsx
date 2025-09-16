'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Upload, Loader2, FileText, File, Search, Archive, ArchiveRestore, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

type Document = {
  id: string;
  title: string;
  status: 'active' | 'archived' | 'superseded';
  created_at: string;
  topic_key?: string;
  version?: string;
};

type UploadType = 'text' | 'file';

export function DocumentManagementClient() {
  // Upload form state
  const [uploadType, setUploadType] = useState<UploadType>('file');
  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [uploadLoading, setUploadLoading] = useState(false);

  // Document list state
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Load documents
  const loadDocuments = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/docs', {
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

  // Handle upload
  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      toast.error('Title is required');
      return;
    }

    if (uploadType === 'text' && !text.trim()) {
      toast.error('Text content is required');
      return;
    }

    if (uploadType === 'text' && text.trim().length < 10) {
      toast.error('Text must be at least 10 characters long');
      return;
    }

    if (uploadType === 'file' && !file) {
      toast.error('Please select a file to upload');
      return;
    }

    try {
      setUploadLoading(true);
      
      let response: Response;
      
      if (uploadType === 'text') {
        // Text upload
        response = await fetch('/api/admin/docs/upload_text', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: title.trim(),
            text: text.trim(),
          }),
        });
      } else {
        // File upload
        const formData = new FormData();
        formData.append('file', file!);
        formData.append('title', title.trim());

        response = await fetch('/api/admin/docs/upload_file', {
          method: 'POST',
          body: formData,
        });
      }

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.status}`);
      }

      const data = await response.json();
      
      // Handle proxy error responses
      if (data.error) {
        throw new Error(data.details || data.error);
      }

      toast.success('Uploaded ✓');
      
      // Clear form
      setTitle('');
      setText('');
      setFile(null);
      
      // Reload documents
      await loadDocuments();
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Upload failed';
      toast.error(`Upload failed: ${errorMessage}`);
      console.error('Upload error:', err);
    } finally {
      setUploadLoading(false);
    }
  };

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

  // Handle file change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    setFile(selectedFile);
    
    // Auto-fill title from filename if empty
    if (selectedFile && !title.trim()) {
      const nameWithoutExt = selectedFile.name.replace(/\.[^/.]+$/, '');
      setTitle(nameWithoutExt);
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

  const isFormValid = title.trim().length > 0 && (
    (uploadType === 'text' && text.trim().length >= 10) ||
    (uploadType === 'file' && file !== null)
  );

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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Upload className="h-5 w-5" />
            <span>Upload Document</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpload} className="space-y-4">
            {/* Upload Type Selector */}
            <div className="space-y-2">
              <Label>Upload Type</Label>
              <div className="flex space-x-4">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="uploadType"
                    value="file"
                    checked={uploadType === 'file'}
                    onChange={(e) => setUploadType(e.target.value as UploadType)}
                    disabled={uploadLoading}
                    className="text-blue-600"
                  />
                  <File className="h-4 w-4" />
                  <span>Upload File (PDF, TXT, DOCX)</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="uploadType"
                    value="text"
                    checked={uploadType === 'text'}
                    onChange={(e) => setUploadType(e.target.value as UploadType)}
                    disabled={uploadLoading}
                    className="text-blue-600"
                  />
                  <FileText className="h-4 w-4" />
                  <span>Paste Text</span>
                </label>
              </div>
            </div>

            {/* Title Input */}
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter document title"
                disabled={uploadLoading}
              />
            </div>
            
            {/* File Upload or Text Input */}
            {uploadType === 'file' ? (
              <div className="space-y-2">
                <Label htmlFor="file">File *</Label>
                <Input
                  id="file"
                  type="file"
                  accept=".pdf,.txt,.docx"
                  onChange={handleFileChange}
                  disabled={uploadLoading}
                  className="file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                <div className="text-xs text-muted-foreground">
                  Supported formats: PDF, TXT, DOCX (max 15MB)
                </div>
                {file && (
                  <div className="text-sm text-green-600">
                    Selected: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="text">Content *</Label>
                <Textarea
                  id="text"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Enter document content (minimum 10 characters)"
                  rows={6}
                  disabled={uploadLoading}
                />
                <div className="text-xs text-muted-foreground">
                  {text.trim().length} characters (minimum 10)
                </div>
              </div>
            )}
            
            <Button 
              type="submit" 
              disabled={!isFormValid || uploadLoading}
              className="w-full"
            >
              {uploadLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Document
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

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
              <div className="text-sm text-gray-500">
                Recent uploads will appear here
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
