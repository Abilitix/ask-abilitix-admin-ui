'use client';

import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import type { WidgetConfig } from '@/lib/types/widget';

interface WidgetKeyDisplayProps {
  widgetKey: string;
  widgetKeyMasked: string;
  usage?: {
    last_used_at?: string;
    last_used_from?: string;
    total_requests?: number;
  };
  onRotate: () => void;
  rotating?: boolean;
}

export function WidgetKeyDisplay({
  widgetKey,
  widgetKeyMasked,
  usage,
  onRotate,
  rotating
}: WidgetKeyDisplayProps) {
  const handleCopyKey = async () => {
    try {
      await navigator.clipboard.writeText(widgetKey);
      toast.success('Widget key copied to clipboard');
    } catch (error) {
      toast.error('Failed to copy to clipboard');
    }
  };

  const formatLastUsed = (timestamp?: string): string => {
    if (!timestamp) return 'Never';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins} ${diffMins === 1 ? 'minute' : 'minutes'} ago`;
    if (diffHours < 24) return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
    return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">Widget Key:</span>
        <code className="text-sm bg-gray-100 px-2 py-1 rounded font-mono">
          {widgetKeyMasked}
        </code>
      </div>

      {usage?.last_used_at && (
        <div className="text-sm text-gray-600">
          Last used: {formatLastUsed(usage.last_used_at)}
          {usage.last_used_from && ` from ${usage.last_used_from}`}
        </div>
      )}

      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleCopyKey}
        >
          Copy Key
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onRotate}
          disabled={rotating}
        >
          {rotating ? 'Rotating...' : 'Rotate Key'}
        </Button>
      </div>
    </div>
  );
}

