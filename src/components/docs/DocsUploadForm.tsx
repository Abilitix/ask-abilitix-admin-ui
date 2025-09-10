'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Upload, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

type DocsUploadFormProps = {
  onDone?: () => void;
};

export function DocsUploadForm({ onDone }: DocsUploadFormProps) {
  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || !text.trim()) {
      toast.error('Title and text are required');
      return;
    }
    
    if (text.trim().length < 10) {
      toast.error('Text must be at least 10 characters long');
      return;
    }

    try {
      setLoading(true);
      
      const response = await fetch('/api/admin/docs/upload_text', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: title.trim(),
          text: text.trim(),
        }),
      });

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

  const isFormValid = title.trim().length > 0 && text.trim().length >= 10;

  // Debug logging
  console.log('Form state:', { title, text, titleLength: title.trim().length, textLength: text.trim().length, isFormValid });

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
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => {
                console.log('Title changed:', e.target.value);
                setTitle(e.target.value);
              }}
              placeholder="Enter document title"
              disabled={loading}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="text">Content *</Label>
            <Textarea
              id="text"
              value={text}
              onChange={(e) => {
                console.log('Text changed:', e.target.value);
                setText(e.target.value);
              }}
              placeholder="Enter document content (minimum 10 characters)"
              rows={6}
              disabled={loading}
            />
            <div className="text-xs text-muted-foreground">
              {text.trim().length} characters (minimum 10)
            </div>
          </div>
          
          <div className="text-xs text-muted-foreground">
            Debug: Title=&quot;{title}&quot; (len: {title.trim().length}), Text=&quot;{text}&quot; (len: {text.trim().length}), Valid: {isFormValid ? 'YES' : 'NO'}
          </div>
          
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
