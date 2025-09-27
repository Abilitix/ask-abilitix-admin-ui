'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, Loader2, FileText, File, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Upload as TusUpload } from 'tus-js-client';

type TusUploadFormProps = {
  onDone?: () => void;
};

type UploadType = 'text' | 'file';

type UploadStatus = 'idle' | 'uploading' | 'processing' | 'ready' | 'failed';

interface UploadProgress {
  status: UploadStatus;
  progress: number;
  error?: string;
  dedup?: boolean;
  duplicateOfDocId?: string;
}

// Environment variables
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://atnidggjuzhlcxxnnltn.supabase.co';

// File validation
const ALLOWED_MIME_TYPES = {
  'application/pdf': 'pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'video/mp4': 'mp4',
  'video/webm': 'webm'
};

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

export function TusUploadForm({ onDone }: TusUploadFormProps) {
  const [uploadType, setUploadType] = useState<UploadType>('file');
  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress>({
    status: 'idle',
    progress: 0
  });

  // Force re-render to ensure both options are visible
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  // Get upload mode (TUS default, legacy fallback)
  const getUploadMode = useCallback(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const queryMode = urlParams.get('uploadMode');
    const storageMode = localStorage.getItem('uploadMode');
    return queryMode || storageMode || 'tus';
  }, []);

  // Get upload token (secure, short-lived)
  const getUploadToken = useCallback(async () => {
    const response = await fetch('/api/admin/uploads/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Token request failed: ${response.status}`);
    }

    const data = await response.json();
    return data.token;
  }, []);

  // Token refresh wrapper for expired tokens
  const withUploadToken = useCallback(async <T,>(fn: (token: string) => Promise<T>): Promise<T> => {
    let token = await getUploadToken();
    try {
      return await fn(token);
    } catch (e: any) {
      if (e?.status === 401 || e?.status === 403) {
        // Re-mint token and retry
        token = await getUploadToken();
        return await fn(token);
      }
      throw e;
    }
  }, [getUploadToken]);

  // Poll upload status until ready
  const pollUploadStatus = useCallback(async (uploadId: number) => {
    const maxAttempts = 30; // 30 attempts with 2s interval = 1 minute max
    let attempts = 0;

    const poll = async (): Promise<void> => {
      try {
        const response = await fetch(`/api/admin/uploads/${uploadId}`, {
          headers: {
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error(`Status check failed: ${response.status}`);
        }

        const status = await response.json();
        
        if (status.status === 'ready') {
          setUploadProgress({
            status: 'ready',
            progress: 100,
            dedup: status.meta?.dedup,
            duplicateOfDocId: status.meta?.duplicate_of_doc_id
          });

          if (status.meta?.dedup) {
            toast.success('Uploaded file matched an existing document and was linked.');
          } else {
            toast.success('Upload completed successfully!');
          }

          // Clear form and trigger refresh
          setTitle('');
          setText('');
          setFile(null);
          onDone?.();
          return;
        }

        if (status.status === 'failed') {
          setUploadProgress({
            status: 'failed',
            progress: 0,
            error: status.error || 'Upload processing failed'
          });
          toast.error(`Upload failed: ${status.error || 'Processing failed'}`);
          return;
        }

        if (status.status === 'processing') {
          setUploadProgress(prev => ({ ...prev, status: 'processing' }));
        }

        // Continue polling
        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(poll, 2000); // Poll every 2 seconds
        } else {
          setUploadProgress({
            status: 'failed',
            progress: 0,
            error: 'Upload processing timeout'
          });
          toast.error('Upload processing timeout. Please try again.');
        }
      } catch (error) {
        console.error('Status polling error:', error);
        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(poll, 2000);
        } else {
          setUploadProgress({
            status: 'failed',
            progress: 0,
            error: 'Failed to check upload status'
          });
          toast.error('Failed to check upload status. Please refresh the page.');
        }
      }
    };

    poll();
  }, [onDone]);

  // Observability hooks for monitoring
  const emitUploadEvent = useCallback((event: string, data: any) => {
    // Emit lightweight UI events for monitoring
    console.log(`Upload Event: ${event}`, {
      file_size_bucket: file ? (file.size < 10 * 1024 * 1024 ? '<10MB' : file.size < 50 * 1024 * 1024 ? '10-50MB' : '>50MB') : 'unknown',
      mime_family: file ? file.type.split('/')[0] : 'text',
      ...data
    });
  }, []);

  // TUS upload handler
  const handleTusUpload = useCallback(async (file: File, title: string) => {
    try {
      setLoading(true);
      setUploadProgress({ status: 'uploading', progress: 0 });
      
      emitUploadEvent('upload_init', { file_name: file.name, file_size: file.size });

      // 1) INIT
      const initResponse = await fetch('/api/admin/docs/init', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          file_name: file.name,
          content_type: file.type || 'application/octet-stream',
          file_size: file.size,
          idempotency_key: crypto.randomUUID()
        })
      });

      if (!initResponse.ok) {
        const errorData = await initResponse.json().catch(() => ({}));
        throw new Error(errorData.error || `Init failed: ${initResponse.status}`);
      }

      const initData = await initResponse.json();
      emitUploadEvent('upload_tus_created', { upload_id: initData.upload_id });

      // 2) TUS CREATE + PATCH with token
      await withUploadToken(async (token) => {
        const b64 = (s: string) => btoa(s);
        
        // Create TUS upload
        const createResponse = await fetch(`${SUPABASE_URL}/storage/v1/upload/resumable`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Tus-Resumable': '1.0.0',
            'Upload-Length': String(file.size),
            'Upload-Metadata': `bucketName ${b64('tenant-uploads')},objectName ${b64(initData.object_name)},contentType ${b64(file.type || 'application/octet-stream')}`
          }
        });

        if (!createResponse.ok) {
          throw new Error(`TUS create failed: ${createResponse.status}`);
        }

        const uploadUrl = createResponse.headers.get('Location');
        if (!uploadUrl) {
          throw new Error('Missing TUS Location header');
        }

        // Upload file with tus-js-client
        const upload = new TusUpload(file, {
          endpoint: `${SUPABASE_URL}/storage/v1/upload/resumable`,
          uploadUrl,
          chunkSize: 6 * 1024 * 1024, // 6MB chunks
          parallelUploads: 3,
          retryDelays: [500, 1000, 2000, 4000],
          headers: { 'Authorization': `Bearer ${token}` },
          metadata: {
            filename: file.name,
            filetype: file.type || 'application/octet-stream'
          },
          onProgress: (sent, total) => {
            const progress = Math.round((sent / total) * 100);
            setUploadProgress(prev => ({ ...prev, progress }));
            emitUploadEvent('upload_progress', { progress, sent, total });
          },
          onError: (error) => {
            console.error('TUS upload error:', error);
            setUploadProgress({
              status: 'failed',
              progress: 0,
              error: `Upload failed: ${error.message}`
            });
            toast.error(`Upload failed: ${error.message}`);
          },
          onSuccess: async () => {
            setUploadProgress(prev => ({ ...prev, progress: 100 }));
            emitUploadEvent('upload_finalise', { upload_id: initData.upload_id });

              // 3) FINALISE
              try {
                const finaliseResponse = await fetch('/api/admin/docs/finalise', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify({ upload_id: initData.upload_id })
                });

              if (!finaliseResponse.ok) {
                const errorData = await finaliseResponse.json().catch(() => ({}));
                throw new Error(errorData.error || `Finalise failed: ${finaliseResponse.status}`);
              }

              // 4) POLL STATUS
              emitUploadEvent('upload_ready', { upload_id: initData.upload_id });
              await pollUploadStatus(initData.upload_id);
            } catch (error) {
              console.error('Finalise error:', error);
              setUploadProgress({
                status: 'failed',
                progress: 0,
                error: `Finalise failed: ${error instanceof Error ? error.message : 'Unknown error'}`
              });
              toast.error(`Finalise failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
          }
        });

        // Resume across reloads (optional)
        const previousUploads = await upload.findPreviousUploads();
        if (previousUploads.length) {
          upload.resumeFromPreviousUpload(previousUploads[0]);
        }

        upload.start();
      });

    } catch (error) {
      console.error('TUS upload error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      emitUploadEvent('upload_failed', { error: errorMessage });
      setUploadProgress({
        status: 'failed',
        progress: 0,
        error: errorMessage
      });
      toast.error(`Upload failed: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  }, [withUploadToken, pollUploadStatus, emitUploadEvent]);

  // Legacy upload handler (fallback)
  const handleLegacyUpload = useCallback(async (file: File, title: string) => {
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
        throw new Error(errorData.error || `Upload failed: ${response.status}`);
      }

      const data = await response.json();
      
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
  }, [onDone]);

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

    // File validation for TUS uploads
    if (uploadType === 'file' && file) {
      // Check file size
      if (file.size > MAX_FILE_SIZE) {
        toast.error('File is too large. Max 100 MB.');
        return;
      }

      // Check MIME type
      if (!ALLOWED_MIME_TYPES[file.type as keyof typeof ALLOWED_MIME_TYPES]) {
        toast.error('Only PDF, DOCX, JPEG, PNG, MP4, WEBM are supported.');
        return;
      }
    }

    const uploadMode = getUploadMode();

    if (uploadType === 'text') {
      // Text upload (legacy only)
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
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Upload failed: ${response.status}`);
        }

        const data = await response.json();
        
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
    } else if (uploadType === 'file' && file) {
      // File upload - choose TUS or legacy
      if (uploadMode === 'tus') {
        await handleTusUpload(file, title.trim());
      } else {
        await handleLegacyUpload(file, title.trim());
      }
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

  const getStatusIcon = () => {
    switch (uploadProgress.status) {
      case 'uploading':
      case 'processing':
        return <Loader2 className="h-4 w-4 animate-spin" />;
      case 'ready':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return null;
    }
  };

  const getStatusText = () => {
    switch (uploadProgress.status) {
      case 'uploading':
        return `Uploading... ${uploadProgress.progress}%`;
      case 'processing':
        return 'Processing...';
      case 'ready':
        return 'Ready!';
      case 'failed':
        return `Failed: ${uploadProgress.error}`;
      default:
        return '';
    }
  };

  if (!mounted) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Upload Document
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Upload Type Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Upload Type</Label>
            <div className="flex gap-4">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  value="file"
                  checked={uploadType === 'file'}
                  onChange={(e) => setUploadType(e.target.value as UploadType)}
                  className="w-4 h-4"
                />
                <div className="flex items-center gap-2">
                  <File className="h-4 w-4" />
                  <span className="text-sm">Upload File (PDF, TXT, DOCX)</span>
                </div>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  value="text"
                  checked={uploadType === 'text'}
                  onChange={(e) => setUploadType(e.target.value as UploadType)}
                  className="w-4 h-4"
                />
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  <span className="text-sm">Paste Text</span>
                </div>
              </label>
            </div>
          </div>

          {/* Title Input */}
          <div className="space-y-2">
            <Label htmlFor="title" className="text-sm font-medium">
              Title *
            </Label>
            <Input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter document title"
              className="w-full"
            />
          </div>

          {/* File Upload or Text Input */}
          {uploadType === 'file' ? (
            <div className="space-y-2">
              <Label htmlFor="file" className="text-sm font-medium">
                File
              </Label>
              <Input
                id="file"
                type="file"
                onChange={handleFileChange}
                accept=".pdf,.txt,.docx,.jpg,.jpeg,.png,.mp4,.webm"
                className="w-full"
              />
              <p className="text-xs text-gray-500">
                Supported formats: PDF, TXT, DOCX, JPG, PNG, MP4, WEBM (max 100MB)
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="text" className="text-sm font-medium">
                Text Content *
              </Label>
              <textarea
                id="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Paste your text content here..."
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="text-xs text-gray-500">
                Minimum 10 characters required
              </p>
            </div>
          )}

          {/* Upload Progress */}
          {(uploadProgress.status !== 'idle') && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                {getStatusIcon()}
                <span className="text-sm font-medium">{getStatusText()}</span>
              </div>
              {(uploadProgress.status === 'uploading' || uploadProgress.status === 'processing') && (
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress.progress}%` }}
                  />
                </div>
              )}
            </div>
          )}

          {/* Upload Button */}
          <Button
            type="submit"
            disabled={!isFormValid || loading || uploadProgress.status === 'uploading' || uploadProgress.status === 'processing'}
            className="w-full"
          >
            {loading || uploadProgress.status === 'uploading' || uploadProgress.status === 'processing' ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {uploadProgress.status === 'uploading' ? 'Uploading...' : 
                 uploadProgress.status === 'processing' ? 'Processing...' : 'Uploading...'}
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Upload Document
              </>
            )}
          </Button>

          {/* Upload Mode Indicator */}
          <div className="text-xs text-gray-500 text-center">
            Mode: {getUploadMode().toUpperCase()}
            {getUploadMode() === 'tus' && ' (Resumable)'}
            {getUploadMode() === 'legacy' && ' (Fallback)'}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
