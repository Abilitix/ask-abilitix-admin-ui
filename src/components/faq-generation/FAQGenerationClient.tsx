'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { FileText, Loader2, Sparkles } from 'lucide-react';
import { JobStatusCard } from './JobStatusCard';
import type { 
  FAQGenerationJob, 
  GenerationSettings, 
  Document,
  DocumentsResponse,
  JobCreationResponse,
  ErrorResponse 
} from '@/lib/types/faq-generation';

export function FAQGenerationClient() {
  const router = useRouter();
  
  // State
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(true);
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [settings, setSettings] = useState<GenerationSettings>({
    max_faqs: 10,
    confidence_threshold: 0.75,
  });
  const [job, setJob] = useState<FAQGenerationJob | null>(null);
  const [generating, setGenerating] = useState(false);

  // Fetch active documents
  const loadDocuments = useCallback(async () => {
    try {
      setLoadingDocs(true);
      const response = await fetch('/api/admin/docs?status=active&limit=50', {
        headers: { 'Cache-Control': 'no-store' },
      });

      if (!response.ok) {
        throw new Error(`Failed to load documents: ${response.status}`);
      }

      const data: DocumentsResponse = await response.json();
      setDocuments(data.docs || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load documents';
      toast.error(errorMessage);
      console.error('Load documents error:', err);
    } finally {
      setLoadingDocs(false);
    }
  }, []);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  // Poll job status
  useEffect(() => {
    if (!job || job.status === 'done' || job.status === 'failed') {
      return;
    }

    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/admin/jobs/${job.job_id}`);
        
        if (!response.ok) {
          // Try to parse error response
          let errorMessage = `Failed to fetch job status: ${response.status}`;
          try {
            const errorData = await response.json();
            errorMessage = errorData.detail?.message || errorData.message || errorMessage;
          } catch {
            // If not JSON, use status text
            errorMessage = `${errorMessage} ${response.statusText}`;
          }
          console.error('Poll job status error:', errorMessage);
          // Don't show toast on polling errors (might be temporary network issue)
          return;
        }

        const updatedJob: FAQGenerationJob = await response.json();
        setJob(updatedJob);

        // Handle completion
        if (updatedJob.status === 'done' && updatedJob.result) {
          toast.success(
            `✅ Generated ${updatedJob.result.total_generated} FAQs with ${Math.round(updatedJob.result.avg_confidence * 100)}% average confidence`,
            {
              action: {
                label: 'View in Inbox',
                onClick: () => router.push('/admin/inbox?tag=doc_generated&status=pending'),
              },
            }
          );
        } else if (updatedJob.status === 'failed') {
          const errorMsg = updatedJob.error_message || 'Unknown error';
          // Show user-friendly message for common backend errors
          let userMessage = errorMsg;
          if (errorMsg.includes('Event loop is closed')) {
            userMessage = 'Backend service error. Please try again or contact support if the issue persists.';
          }
          toast.error(`Generation failed: ${userMessage}`, {
            duration: 10000, // Show longer for errors
          });
        }
      } catch (err) {
        console.error('Poll job status error:', err);
        // Don't show toast on polling errors (might be temporary)
      }
    }, 5000); // Poll every 5 seconds

    return () => clearInterval(interval);
  }, [job, router]);

  // Start generation
  const handleStartGeneration = async () => {
    if (!selectedDocId) {
      toast.error('Please select a document');
      return;
    }

    try {
      setGenerating(true);
      
      const response = await fetch(
        `/api/admin/docs/${selectedDocId}/generate-faqs?async_mode=true`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            max_faqs: settings.max_faqs,
            confidence_threshold: settings.confidence_threshold,
          }),
        }
      );

      if (!response.ok) {
        // Try to parse error response
        let error: ErrorResponse;
        try {
          error = await response.json();
        } catch {
          // If response is not JSON, create a generic error
          const errorText = await response.text();
          toast.error(`Generation failed: ${response.status} ${response.statusText}. ${errorText || 'Unknown error'}`);
          return;
        }
        
        const errorCode = error.detail?.error || error.error;
        const errorMessage = error.detail?.message || error.message || 'Unknown error';
        
        // Handle specific error codes
        switch (errorCode) {
          case 'document_not_active':
            toast.error('Document must be active to generate FAQs');
            break;
          case 'invalid_max_faqs':
            toast.error(`Invalid max FAQs: ${errorMessage}`);
            break;
          case 'invalid_confidence_threshold':
            toast.error(`Invalid confidence threshold: ${errorMessage}`);
            break;
          case 'generation_failed':
            // Check for common backend errors
            let userMessage = errorMessage;
            if (errorMessage.includes('Event loop is closed') || errorMessage.includes('RuntimeError')) {
              userMessage = 'Backend service error. Please try again or contact support if the issue persists.';
            }
            toast.error(`Generation failed: ${userMessage}`, {
              duration: 10000, // Show longer for errors
            });
            break;
          default:
            toast.error(`Error: ${errorMessage}`, {
              duration: 10000,
            });
        }
        return;
      }

      const result: JobCreationResponse = await response.json();
      
      // Initialize job state
      setJob({
        job_id: result.job_id,
        type: 'faq_generate',
        status: result.status,
        created_at: new Date().toISOString(),
        started_at: null,
        finished_at: null,
        error_message: null,
        estimated_time: result.estimated_time,
      });

      toast.success('FAQ generation started!');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start generation';
      toast.error(errorMessage);
      console.error('Start generation error:', err);
    } finally {
      setGenerating(false);
    }
  };

  const selectedDoc = documents.find(d => d.id === selectedDocId);

  return (
    <div className="space-y-6">
      {/* Document Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <span>Select Document</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingDocs ? (
            <div className="text-center py-8 text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
              Loading documents...
            </div>
          ) : documents.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No active documents found.</p>
              <p className="text-sm mt-2">
                <a href="/admin/docs" className="text-blue-600 hover:underline">
                  Upload a document
                </a>{' '}
                to generate FAQs.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {documents.map((doc) => (
                <button
                  key={doc.id}
                  onClick={() => setSelectedDocId(doc.id)}
                  className={`w-full text-left p-3 rounded-lg border-2 transition-colors ${
                    selectedDocId === doc.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-medium">{doc.title}</div>
                  <div className="text-sm text-muted-foreground">
                    Created {new Date(doc.created_at).toLocaleDateString()}
                  </div>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Settings Form */}
      {selectedDocId && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Sparkles className="h-5 w-5" />
              <span>Generation Settings</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="max_faqs">Max FAQs</Label>
              <Input
                id="max_faqs"
                type="number"
                min={1}
                max={50}
                value={settings.max_faqs}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    max_faqs: Math.max(1, Math.min(50, parseInt(e.target.value) || 10)),
                  }))
                }
              />
              <p className="text-xs text-muted-foreground">
                Maximum number of FAQs to generate (1-50)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confidence_threshold">Confidence Threshold</Label>
              <Input
                id="confidence_threshold"
                type="number"
                min={0}
                max={1}
                step={0.01}
                value={settings.confidence_threshold}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    confidence_threshold: Math.max(
                      0,
                      Math.min(1, parseFloat(e.target.value) || 0.75)
                    ),
                  }))
                }
              />
              <p className="text-xs text-muted-foreground">
                Minimum confidence score (0.0-1.0). Higher values = fewer, higher-quality FAQs.
              </p>
            </div>

            <Button
              onClick={handleStartGeneration}
              disabled={generating || !selectedDocId}
              className="w-full"
              size="lg"
            >
              {generating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Starting...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate FAQs
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Job Status */}
      {job && <JobStatusCard job={job} documentTitle={selectedDoc?.title} />}
    </div>
  );
}

