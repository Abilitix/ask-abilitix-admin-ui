'use client';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Pencil, Trash2, ChevronUp, ChevronDown } from 'lucide-react';
import type { CustomDimension } from '@/lib/types/knowledge';

type DimensionCardProps = {
  dimension: CustomDimension;
  index: number;
  totalDimensions: number;
  onEdit: () => void;
  onRemove: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  isExtracted?: boolean; // Whether this was auto-extracted from JD
};

export function DimensionCard({
  dimension,
  index,
  totalDimensions,
  onEdit,
  onRemove,
  onMoveUp,
  onMoveDown,
  isExtracted = false,
}: DimensionCardProps) {
  const importanceColor = dimension.importance === 'must' 
    ? 'bg-red-50 text-red-700 border-red-200' 
    : 'bg-blue-50 text-blue-700 border-blue-200';

  const keywordsPreview = dimension.keywords.slice(0, 3).join(', ') + 
    (dimension.keywords.length > 3 ? ` +${dimension.keywords.length - 3} more` : '');

  return (
    <div className="flex items-start gap-3 p-3 border rounded-lg bg-white hover:bg-slate-50 transition-colors">
      {/* Reorder buttons */}
      <div className="flex flex-col gap-1 pt-1">
        {onMoveUp && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onMoveUp}
            disabled={index === 0}
            className="h-6 w-6 p-0"
            title="Move up"
          >
            <ChevronUp className="h-3 w-3" />
          </Button>
        )}
        {onMoveDown && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onMoveDown}
            disabled={index === totalDimensions - 1}
            className="h-6 w-6 p-0"
            title="Move down"
          >
            <ChevronDown className="h-3 w-3" />
          </Button>
        )}
      </div>

      {/* Dimension content */}
      <div className="flex-1 space-y-2 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-medium text-slate-900 truncate">{dimension.label}</h4>
              <Badge variant="outline" className={importanceColor}>
                {dimension.importance === 'must' ? 'Must Have' : 'Nice to Have'}
              </Badge>
              {isExtracted && (
                <Badge variant="secondary" className="text-xs">
                  Auto-extracted
                </Badge>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Keywords: {keywordsPreview}
            </p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 flex-shrink-0">
        <Button
          variant="ghost"
          size="sm"
          onClick={onEdit}
          className="h-8 w-8 p-0"
          title="Edit dimension"
        >
          <Pencil className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onRemove}
          className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
          title="Remove dimension"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

