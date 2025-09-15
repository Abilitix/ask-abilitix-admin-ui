'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Upload, Loader2, FileText, File } from 'lucide-react';
import { toast } from 'sonner';

type DocsUploadFormProps = {
  onDone?: () => void;
};

type UploadType = 'text' | 'file';

export function DocsUploadForm({ onDone }: DocsUploadFormProps) {
  const [uploadType, setUploadType] = useState<UploadType>('file');
  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
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
      setLoading(true);
      
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
      
      // Trigger refresh
      onDone?.();
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Upload failed';
      toast.error(`Upload failed: ${errorMessage}`);
      console.error('Upload error:', err);
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = title.trim().length > 0 && (
    (uploadType === 'text' && text.trim().length >= 10) ||
    (uploadType === 'file' && file !== null)
  );

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
          <span>Upload Document</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
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
                  disabled={loading}
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
                  disabled={loading}
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
              disabled={loading}
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
          ) : (
            <div className="space-y-2">
              <Label htmlFor="text">Content *</Label>
              <Textarea
                id="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Enter document content (minimum 10 characters)"
                rows={6}
                disabled={loading}
              />
              <div className="text-xs text-muted-foreground">
                {text.trim().length} characters (minimum 10)
              </div>
            </div>
          )}
          
          <Button 
            type="submit" 
            disabled={!isFormValid || loading}
            className="w-full"
          >
            {loading ? (
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
  );
}
