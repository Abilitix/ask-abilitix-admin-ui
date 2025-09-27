'use client';

import { useState, useCallback } from 'react';
import { TusUploadForm } from './TusUploadForm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, Loader2, FileText } from 'lucide-react';
import { toast } from 'sonner';

type DocsUploadFormProps = {
  onDone?: () => void;
};

// Legacy upload form component
function LegacyUploadForm({ onDone }: DocsUploadFormProps) {
  const [title, setTitle] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error('Title is required');
      return;
    }

    if (!file) {
      toast.error('Please select a file to upload');
      return;
    }

    try {
      setLoading(true);

      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', title);

      const response = await fetch('/api/admin/docs/upload_file', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.details || errorData.error || `Upload failed: ${response.status}`);
      }

      toast.success('Uploaded ✓ (Legacy)');
      onDone?.();
    } catch (err: any) {
      const errorMessage = err instanceof Error ? err.message : 'Upload failed (Legacy)';
      toast.error(`Upload failed (Legacy): ${errorMessage}`);
      console.error('Legacy upload error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    setFile(selectedFile);

    // Auto-fill title from filename if empty
    if (selectedFile && !title.trim()) {
      const nameWithoutExt = selectedFile.name.replace(/\.[^/.]+$/, '');
      setTitle(nameWithoutExt);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Upload className="h-5 w-5" />
          <span>Upload Document (Legacy)</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title Input */}
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter document title"
              disabled={loading}
            />
          </div>

          {/* File Upload */}
          <div className="space-y-2">
            <Label htmlFor="file">File *</Label>
            <Input
              id="file"
              type="file"
              accept=".pdf,.txt,.docx"
              onChange={handleFileChange}
              disabled={loading}
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

          <Button
            type="submit"
            disabled={loading}
            className="w-full"
          >
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Upload className="mr-2 h-4 w-4" />
            )}
            {loading ? 'Uploading...' : 'Upload Document (Legacy)'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export function DocsUploadForm({ onDone }: DocsUploadFormProps) {
  // Get upload mode (legacy default, TUS via ?uploadMode=tus or localStorage)
  const getUploadMode = useCallback(() => {
    if (typeof window === 'undefined') return 'legacy';
    
    const urlParams = new URLSearchParams(window.location.search);
    const queryMode = urlParams.get('uploadMode');
    const storageMode = localStorage.getItem('uploadMode');
    
    // Default to legacy, TUS only if explicitly requested
    return queryMode || storageMode || 'legacy';
  }, []);

  const uploadMode = getUploadMode();

  // Toggle between TUS and Legacy uploaders
  if (uploadMode === 'tus') {
    return <TusUploadForm onDone={onDone} />;
  }

  return <LegacyUploadForm onDone={onDone} />;
}