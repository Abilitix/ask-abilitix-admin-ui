/**
 * Reusable badge component for displaying document status.
 * 
 * Provides consistent styling and icons for all document status states.
 * 
 * @module components/documents/DocumentStatusBadge
 */

import { Badge } from '@/components/ui/badge';
import type { DisplayStatus } from '@/lib/types/documents';
import { 
  CheckCircle2, 
  Clock, 
  Loader2, 
  XCircle, 
  Archive, 
  Trash2 
} from 'lucide-react';

export interface DocumentStatusBadgeProps {
  status: DisplayStatus;
  className?: string;
}

/**
 * Badge component for displaying document status with appropriate styling and icons.
 * 
 * @param status - Display status to show
 * @param className - Additional CSS classes
 * 
 * @example
 * ```tsx
 * <DocumentStatusBadge status="active" />
 * <DocumentStatusBadge status="processing" />
 * ```
 */
export function DocumentStatusBadge({ status, className }: DocumentStatusBadgeProps) {
  const config = {
    active: {
      label: 'Active',
      icon: CheckCircle2,
      className: 'bg-green-50 text-green-700 border-green-200',
    },
    archived: {
      label: 'Archived',
      icon: Archive,
      className: 'bg-gray-50 text-gray-700 border-gray-200',
    },
    pending: {
      label: 'Pending',
      icon: Clock,
      className: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    },
    processing: {
      label: 'Processing',
      icon: Loader2,
      className: 'bg-blue-50 text-blue-700 border-blue-200',
    },
    failed: {
      label: 'Failed',
      icon: XCircle,
      className: 'bg-red-50 text-red-700 border-red-200',
    },
    superseded: {
      label: 'Superseded',
      icon: Archive,
      className: 'bg-orange-50 text-orange-700 border-orange-200',
    },
    deleted: {
      label: 'Deleted',
      icon: Trash2,
      className: 'bg-red-50 text-red-700 border-red-200',
    },
  };

  const statusConfig = config[status];
  const Icon = statusConfig.icon;

  return (
    <Badge 
      variant="outline" 
      className={`${statusConfig.className} ${className || ''}`}
    >
      <Icon 
        className={`h-3 w-3 mr-1 ${status === 'processing' ? 'animate-spin' : ''}`} 
      />
      {statusConfig.label}
    </Badge>
  );
}

