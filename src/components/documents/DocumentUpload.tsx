'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import {
  Upload,
  X,
  FileText,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Cloud,
  File,
} from 'lucide-react';
import { toast } from 'sonner';
import { Upload as TusUpload } from 'tus-js-client';

type DocumentUploadProps = {
  onUploadComplete?: () => void;
  compact?: boolean; // Compact mode for header integration
  header?: boolean; // Header mode - prominent button for page header
};

type UploadItem = {
  id: string;
  file: File;
  title: string;
  status: 'pending' | 'uploading' | 'processing' | 'ready' | 'failed';
  progress: number;
  error?: string;
  uploadId?: string;
};

// Environment variables
const STORAGE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_STORAGE_URL ||
  'https://atnidggjuzhlcxxnnltn.storage.supabase.co';

const ALLOWED_MIME_TYPES = {
  'application/pdf': 'pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'video/mp4': 'mp4',
  'video/webm': 'webm',
};

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

export function DocumentUpload({ onUploadComplete, compact = false, header = false }: DocumentUploadProps) {
  const [uploads, setUploads] = useState<UploadItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [showUploadArea, setShowUploadArea] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  // Get upload token
  const getUploadToken = useCallback(async () => {
    const response = await fetch('/api/admin/uploads/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`Token request failed: ${response.status}`);
    }

    const data = await response.json();
    return data.token;
  }, []);

  // Poll upload status
  const pollUploadStatus = useCallback(async (uploadId: string, itemId: string) => {
    const maxAttempts = 60; // 5 minutes max
    let attempts = 0;

    const poll = async () => {
      try {
        const response = await fetch(`/api/admin/uploads/${uploadId}`);
        if (!response.ok) {
          throw new Error(`Status check failed: ${response.status}`);
        }

        const data = await response.json();
        const status = data.status || data.upload_status;

        if (status === 'ready' || status === 'completed') {
          setUploads((prev) =>
            prev.map((item) =>
              item.id === itemId
                ? { ...item, status: 'ready', progress: 100 }
                : item
            )
          );
          toast.success('Document uploaded and processed');
          onUploadComplete?.();
          return;
        }

        if (status === 'failed' || status === 'error') {
          setUploads((prev) =>
            prev.map((item) =>
              item.id === itemId
                ? { ...item, status: 'failed', error: 'Processing failed' }
                : item
            )
          );
          toast.error('Document processing failed');
          return;
        }

        // Continue polling
        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(poll, 5000); // Poll every 5 seconds
        } else {
          setUploads((prev) =>
            prev.map((item) =>
              item.id === itemId
                ? { ...item, status: 'failed', error: 'Processing timeout' }
                : item
            )
          );
        }
      } catch (error) {
        console.error('Poll error:', error);
        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(poll, 5000);
        }
      }
    };

    setTimeout(poll, 2000); // Start polling after 2 seconds
  }, [onUploadComplete]);

  // Handle TUS upload
  const handleTusUpload = useCallback(async (item: UploadItem) => {
    const { file, title, id: itemId } = item;

    try {
      setUploads((prev) =>
        prev.map((item) =>
          item.id === itemId ? { ...item, status: 'uploading', progress: 0 } : item
        )
      );

      // 1) INIT
      const initResponse = await fetch('/api/admin/docs/init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          file_name: file.name,
          content_type: file.type || 'application/octet-stream',
          file_size: file.size,
          idempotency_key: crypto.randomUUID(),
        }),
      });

      if (!initResponse.ok) {
        const errorData = await initResponse.json().catch(() => ({}));
        throw new Error(errorData.error || `Init failed: ${initResponse.status}`);
      }

      const initData = await initResponse.json();
      const uploadId = initData.upload_id;

      setUploads((prev) =>
        prev.map((item) => (item.id === itemId ? { ...item, uploadId } : item))
      );

      // 2) Get token and upload
      const token = await getUploadToken();
      const bucket = initData.bucket || 'tenant-uploads';
      const createUrl = `${STORAGE_URL}/storage/v1/upload/resumable`;

      const b64 = (s: string) => btoa(s);

      const createResponse = await fetch(createUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Tus-Resumable': '1.0.0',
          'Upload-Length': String(file.size),
          'Upload-Metadata': `bucketName ${b64(bucket)},objectName ${b64(initData.object_name)},contentType ${b64(file.type || 'application/octet-stream')}`,
        },
      });

      if (!createResponse.ok) {
        throw new Error(`TUS create failed: ${createResponse.status}`);
      }

      const uploadUrl = createResponse.headers.get('Location');
      if (!uploadUrl) {
        throw new Error('Missing TUS Location header');
      }

      // 3) Upload with TUS client
      const upload = new TusUpload(file, {
        endpoint: createUrl,
        uploadUrl,
        chunkSize: 6 * 1024 * 1024, // 6MB chunks
        parallelUploads: 1,
        retryDelays: [500, 1000, 2000],
        headers: { Authorization: `Bearer ${token}` },
        metadata: {
          objectName: initData.object_name,
          contentType: file.type || 'application/octet-stream',
        },
        onProgress: (sent, total) => {
          const progress = Math.round((sent / total) * 100);
          setUploads((prev) =>
            prev.map((item) =>
              item.id === itemId ? { ...item, progress } : item
            )
          );
        },
        onError: (error) => {
          console.error('TUS upload error:', error);
          setUploads((prev) =>
            prev.map((item) =>
              item.id === itemId
                ? { ...item, status: 'failed', error: error.message }
                : item
            )
          );
          toast.error(`Upload failed: ${error.message}`);
        },
        onSuccess: async () => {
          setUploads((prev) =>
            prev.map((item) =>
              item.id === itemId ? { ...item, progress: 100, status: 'processing' } : item
            )
          );

          // 4) FINALISE
          try {
            const finaliseResponse = await fetch('/api/admin/docs/finalise', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ upload_id: uploadId }),
            });

            if (!finaliseResponse.ok) {
              const errorData = await finaliseResponse.json().catch(() => ({}));
              throw new Error(errorData.error || `Finalise failed: ${finaliseResponse.status}`);
            }

            // 5) POLL STATUS
            await pollUploadStatus(uploadId, itemId);
          } catch (error) {
            console.error('Finalise error:', error);
            setUploads((prev) =>
              prev.map((item) =>
                item.id === itemId
                  ? {
                      ...item,
                      status: 'failed',
                      error: error instanceof Error ? error.message : 'Finalise failed',
                    }
                  : item
              )
            );
            toast.error('Upload finalisation failed');
          }
        },
      });

      upload.start();
    } catch (error) {
      console.error('Upload error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      setUploads((prev) =>
        prev.map((item) =>
          item.id === itemId
            ? { ...item, status: 'failed', error: errorMessage }
            : item
        )
      );
      toast.error(`Upload failed: ${errorMessage}`);
    }
  }, [getUploadToken, pollUploadStatus]);

  // Handle file selection
  const handleFiles = useCallback(
    (files: FileList | File[]) => {
      const fileArray = Array.from(files);

      const newUploads: UploadItem[] = fileArray
        .filter((file) => {
          // Validate file size
          if (file.size > MAX_FILE_SIZE) {
            toast.error(`${file.name} is too large. Max 100 MB.`);
            return false;
          }

          // Validate MIME type
          if (!ALLOWED_MIME_TYPES[file.type as keyof typeof ALLOWED_MIME_TYPES]) {
            toast.error(`${file.name}: Only PDF, DOCX, JPEG, PNG, MP4, WEBM are supported.`);
            return false;
          }

          return true;
        })
        .map((file) => {
          const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
          return {
            id: crypto.randomUUID(),
            file,
            title: nameWithoutExt,
            status: 'pending' as const,
            progress: 0,
          };
        });

      if (newUploads.length > 0) {
        setUploads((prev) => [...prev, ...newUploads]);
        setShowUploadArea(true);

        // Auto-start uploads
        newUploads.forEach((item) => {
          handleTusUpload(item);
        });
      }
    },
    [handleTusUpload]
  );

  // Drag and drop handlers
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget === dropZoneRef.current) {
      setIsDragging(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const files = e.dataTransfer.files;
      if (files.length > 0) {
        handleFiles(files);
      }
    },
    [handleFiles]
  );

  // Remove upload
  const removeUpload = useCallback((id: string) => {
    setUploads((prev) => prev.filter((item) => item.id !== id));
    if (uploads.length === 1) {
      setShowUploadArea(false);
    }
  }, [uploads.length]);

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  // Get file icon
  const getFileIcon = (mimeType: string) => {
    if (mimeType.includes('pdf')) return '📄';
    if (mimeType.includes('word') || mimeType.includes('document')) return '📝';
    if (mimeType.includes('image')) return '🖼️';
    if (mimeType.includes('video')) return '🎥';
    return '📎';
  };

  const activeUploads = uploads.filter((u) => u.status === 'uploading' || u.status === 'processing');
  const completedUploads = uploads.filter((u) => u.status === 'ready');
  const failedUploads = uploads.filter((u) => u.status === 'failed');

  // Header mode - prominent button for page header
  if (header) {
    return (
      <>
        <Button
          onClick={() => {
            fileInputRef.current?.click();
            setShowUploadArea(true);
          }}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-sm hover:shadow-md transition-all min-h-[44px] px-4"
          size="default"
        >
          <Upload className="h-4 w-4" />
          Upload Documents
        </Button>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.docx,.jpg,.jpeg,.png,.mp4,.webm"
          className="hidden"
          onChange={(e) => {
            if (e.target.files) {
              handleFiles(e.target.files);
            }
          }}
        />

        {/* Upload Queue - Compact with Enhanced UI */}
        {showUploadArea && uploads.length > 0 && (
          <Card className="mt-4 border-2 shadow-lg animate-in slide-in-from-top-2 fade-in-0">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Upload className="h-4 w-4 text-blue-600" />
                  <h3 className="text-sm font-semibold text-gray-900">
                    Upload Queue {activeUploads.length > 0 && `(${activeUploads.length} active)`}
                  </h3>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowUploadArea(false);
                    setUploads([]);
                  }}
                  className="h-8 w-8 sm:h-7 sm:w-7 p-0 hover:bg-gray-100 touch-manipulation"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-2 max-h-64 overflow-y-auto">
                {uploads.map((item) => (
                  <div
                    key={item.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                      item.status === 'uploading' || item.status === 'processing'
                        ? 'bg-blue-50 border-blue-200'
                        : item.status === 'ready'
                        ? 'bg-green-50 border-green-200'
                        : item.status === 'failed'
                        ? 'bg-red-50 border-red-200'
                        : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="flex-shrink-0">
                      {item.status === 'uploading' || item.status === 'processing' ? (
                        <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                      ) : item.status === 'ready' ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      ) : item.status === 'failed' ? (
                        <AlertCircle className="h-5 w-5 text-red-600" />
                      ) : (
                        <File className="h-5 w-5 text-gray-400" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate text-gray-900">{item.title}</div>
                      <div className="text-xs text-gray-600 mt-0.5">
                        {formatFileSize(item.file.size)}
                        {item.status === 'uploading' && ` • ${item.progress}%`}
                        {item.status === 'processing' && ' • Processing document...'}
                        {item.status === 'failed' && item.error && ` • ${item.error}`}
                      </div>
                      {item.status === 'uploading' && (
                        <div className="mt-2 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-300 ease-out rounded-full"
                            style={{ width: `${item.progress}%` }}
                          />
                        </div>
                      )}
                      {item.status === 'processing' && (
                        <div className="mt-2 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-blue-400 to-blue-500 rounded-full animate-pulse" style={{ width: '60%' }} />
                        </div>
                      )}
                    </div>

                    {(item.status === 'ready' || item.status === 'failed') && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeUpload(item.id)}
                        className="h-7 w-7 p-0 hover:bg-gray-200"
                        aria-label="Remove"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </>
    );
  }

  if (compact) {
    return (
      <>
        <Button
          onClick={() => {
            fileInputRef.current?.click();
            setShowUploadArea(true);
          }}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-all hover:shadow-md"
          size="sm"
        >
          <Upload className="h-4 w-4" />
          <span className="hidden sm:inline">Upload</span>
        </Button>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.docx,.jpg,.jpeg,.png,.mp4,.webm"
          className="hidden"
          onChange={(e) => {
            if (e.target.files) {
              handleFiles(e.target.files);
            }
          }}
        />

        {/* Upload Queue - Compact with Enhanced UI */}
        {showUploadArea && uploads.length > 0 && (
          <Card className="mt-4 border-2 shadow-lg animate-in slide-in-from-top-2 fade-in-0">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Upload className="h-4 w-4 text-blue-600" />
                  <h3 className="text-sm font-semibold text-gray-900">
                    Upload Queue {activeUploads.length > 0 && `(${activeUploads.length} active)`}
                  </h3>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowUploadArea(false);
                    setUploads([]);
                  }}
                  className="h-8 w-8 sm:h-7 sm:w-7 p-0 hover:bg-gray-100 touch-manipulation"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-2 max-h-64 overflow-y-auto">
                {uploads.map((item) => (
                  <div
                    key={item.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                      item.status === 'uploading' || item.status === 'processing'
                        ? 'bg-blue-50 border-blue-200'
                        : item.status === 'ready'
                        ? 'bg-green-50 border-green-200'
                        : item.status === 'failed'
                        ? 'bg-red-50 border-red-200'
                        : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="flex-shrink-0">
                      {item.status === 'uploading' || item.status === 'processing' ? (
                        <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                      ) : item.status === 'ready' ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      ) : item.status === 'failed' ? (
                        <AlertCircle className="h-5 w-5 text-red-600" />
                      ) : (
                        <File className="h-5 w-5 text-gray-400" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate text-gray-900">{item.title}</div>
                      <div className="text-xs text-gray-600 mt-0.5">
                        {formatFileSize(item.file.size)}
                        {item.status === 'uploading' && ` • ${item.progress}%`}
                        {item.status === 'processing' && ' • Processing document...'}
                        {item.status === 'failed' && item.error && ` • ${item.error}`}
                      </div>
                      {item.status === 'uploading' && (
                        <div className="mt-2 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-300 ease-out rounded-full"
                            style={{ width: `${item.progress}%` }}
                          />
                        </div>
                      )}
                      {item.status === 'processing' && (
                        <div className="mt-2 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-blue-400 to-blue-500 rounded-full animate-pulse" style={{ width: '60%' }} />
                        </div>
                      )}
                    </div>

                    {(item.status === 'ready' || item.status === 'failed') && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeUpload(item.id)}
                        className="h-7 w-7 p-0 hover:bg-gray-200"
                        aria-label="Remove"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </>
    );
  }

  // Full upload area (for modal or dedicated page)
  return (
    <div className="space-y-4">
      {/* Drag and Drop Zone - Enhanced */}
      <div
        ref={dropZoneRef}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          border-2 border-dashed rounded-xl p-8 md:p-12 text-center transition-all duration-200
          ${isDragging 
            ? 'border-blue-500 bg-blue-50 scale-[1.02] shadow-lg' 
            : 'border-gray-300 bg-gradient-to-br from-gray-50 to-gray-100/50'
          }
          hover:border-blue-400 hover:bg-blue-50/30 hover:shadow-md cursor-pointer
        `}
      >
        <div className={`transition-transform duration-200 ${isDragging ? 'scale-110' : ''}`}>
          <Cloud className={`h-12 w-12 md:h-16 md:w-16 mx-auto mb-4 transition-colors ${
            isDragging ? 'text-blue-600' : 'text-gray-400'
          }`} />
        </div>
        <p className="text-sm md:text-base font-semibold text-gray-800 mb-2">
          {isDragging ? 'Drop files here' : 'Drag and drop files here, or click to browse'}
        </p>
        <p className="text-xs md:text-sm text-gray-600 mb-6">
          PDF, DOCX, JPEG, PNG, MP4, WEBM • Max 100 MB per file
        </p>
        <Button
          onClick={() => fileInputRef.current?.click()}
          className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow-md transition-all"
          size="sm"
        >
          <Upload className="h-4 w-4 mr-2" />
          Select Files
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.docx,.jpg,.jpeg,.png,.mp4,.webm"
          className="hidden"
          onChange={(e) => {
            if (e.target.files) {
              handleFiles(e.target.files);
            }
          }}
        />
      </div>

      {/* Upload Queue - Enhanced */}
      {uploads.length > 0 && (
        <Card className="border-2 shadow-lg">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Upload className="h-5 w-5 text-blue-600" />
                <h3 className="text-base font-semibold text-gray-900">
                  Upload Queue
                </h3>
                {activeUploads.length > 0 && (
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium">
                    {activeUploads.length} active
                  </span>
                )}
              </div>
              {uploads.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setUploads([]);
                  }}
                  className="text-xs text-gray-600 hover:text-gray-900"
                >
                  Clear all
                </Button>
              )}
            </div>

            <div className="space-y-3">
              {uploads.map((item) => (
                <div
                  key={item.id}
                  className={`flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-4 rounded-lg border transition-all ${
                    item.status === 'uploading' || item.status === 'processing'
                      ? 'bg-blue-50/50 border-blue-200 shadow-sm'
                      : item.status === 'ready'
                      ? 'bg-green-50/50 border-green-200'
                      : item.status === 'failed'
                      ? 'bg-red-50/50 border-red-200'
                      : 'bg-white border-gray-200'
                  }`}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="flex-shrink-0 text-2xl">
                      {getFileIcon(item.file.type)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-2 mb-2">
                        <div className="text-sm font-semibold text-gray-900 truncate">{item.title}</div>
                        <div className="text-xs text-gray-600 font-medium">
                          {formatFileSize(item.file.size)}
                        </div>
                      </div>

                      {item.status === 'uploading' && (
                        <>
                          <div className="flex items-center justify-between text-xs text-gray-600 mb-2">
                            <span>Uploading...</span>
                            <span className="font-medium text-blue-600">{item.progress}%</span>
                          </div>
                          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-300 ease-out rounded-full"
                              style={{ width: `${item.progress}%` }}
                            />
                          </div>
                        </>
                      )}

                      {item.status === 'processing' && (
                        <>
                          <div className="flex items-center gap-2 text-xs text-blue-600 mb-2">
                            <Loader2 className="h-3 w-3 animate-spin" />
                            <span>Processing document...</span>
                          </div>
                          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-blue-400 to-blue-500 rounded-full animate-pulse" style={{ width: '60%' }} />
                          </div>
                        </>
                      )}

                      {item.status === 'ready' && (
                        <div className="flex items-center gap-2 text-xs text-green-700 font-medium">
                          <CheckCircle2 className="h-4 w-4" />
                          <span>Document ready</span>
                        </div>
                      )}

                      {item.status === 'failed' && (
                        <div className="flex items-center gap-2 text-xs text-red-700">
                          <AlertCircle className="h-4 w-4" />
                          <span className="truncate">{item.error || 'Upload failed'}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {(item.status === 'ready' || item.status === 'failed') && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeUpload(item.id)}
                      className="h-8 w-8 p-0 hover:bg-gray-200 self-end sm:self-auto"
                      aria-label="Remove"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Future: Google Drive integration placeholder */}
      {/* This can be extended later */}
      {false && (
        <Card className="border-dashed">
          <CardContent className="p-4 text-center">
            <p className="text-sm text-gray-500">
              Google Drive integration coming soon
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

