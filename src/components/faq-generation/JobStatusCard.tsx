'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Loader2, CheckCircle2, XCircle, Clock } from 'lucide-react';
import type { FAQGenerationJob } from '@/lib/types/faq-generation';

type JobStatusCardProps = {
  job: FAQGenerationJob;
  documentTitle?: string;
};

export function JobStatusCard({ job, documentTitle }: JobStatusCardProps) {
  const getStatusBadge = () => {
    switch (job.status) {
      case 'queued':
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
            <Clock className="h-3 w-3 mr-1" />
            Queued
          </Badge>
        );
      case 'running':
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            Running
          </Badge>
        );
      case 'done':
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Complete
          </Badge>
        );
      case 'failed':
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            <XCircle className="h-3 w-3 mr-1" />
            Failed
          </Badge>
        );
      default:
        return <Badge variant="outline">{job.status}</Badge>;
    }
  };

  const getStatusMessage = () => {
    switch (job.status) {
      case 'queued':
        return 'Waiting to start...';
      case 'running':
        if (job.progress) {
          return `Generating FAQs... ${job.progress.current} of ${job.progress.total}`;
        }
        return 'Generating FAQs...';
      case 'done':
        if (job.result) {
          return `✅ Generated ${job.result.total_generated} FAQs with ${Math.round(job.result.avg_confidence * 100)}% average confidence`;
        }
        return '✅ Generation complete!';
      case 'failed':
        return `❌ Failed: ${job.error_message || 'Unknown error'}`;
      default:
        return '';
    }
  };

  const getTimeElapsed = () => {
    if (!job.started_at) return null;
    
    const start = new Date(job.started_at).getTime();
    const end = job.finished_at ? new Date(job.finished_at).getTime() : Date.now();
    const seconds = Math.floor((end - start) / 1000);
    
    if (seconds < 60) return `${seconds}s`;
    return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <CardTitle className="text-base sm:text-lg">Generation Status</CardTitle>
          {getStatusBadge()}
        </div>
        {documentTitle && (
          <p className="text-sm text-muted-foreground mt-1 truncate" title={documentTitle}>
            {documentTitle}
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-sm">{getStatusMessage()}</p>
          {job.started_at && (
            <p className="text-xs text-muted-foreground mt-1">
              Running for {getTimeElapsed()}
            </p>
          )}
        </div>

        {job.progress && job.progress.percent > 0 && (
          <div className="space-y-2">
            <Progress value={job.progress.percent} className="h-2 sm:h-2" />
            <p className="text-xs sm:text-sm text-muted-foreground text-center">
              {job.progress.percent}% complete
            </p>
          </div>
        )}

        {job.status === 'running' && !job.progress && (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}

        {job.estimated_time && job.status === 'queued' && (
          <p className="text-xs text-muted-foreground">
            Estimated time: {job.estimated_time}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

