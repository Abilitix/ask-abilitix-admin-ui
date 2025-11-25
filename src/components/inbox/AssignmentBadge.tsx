'use client';

import { AssignableMember } from './types';
import { Badge } from '@/components/ui/badge';

type AssignmentBadgeProps = {
  assignees?: AssignableMember[] | null;
  maxVisible?: number;
  size?: 'sm' | 'md';
};

export function AssignmentBadge({ assignees, maxVisible = 2, size = 'md' }: AssignmentBadgeProps) {
  const list = Array.isArray(assignees) ? assignees.filter(Boolean) : [];

  if (!list.length) {
    return <span className="text-xs text-muted-foreground">Unassigned</span>;
  }

  const visible = list.slice(0, maxVisible);
  const remaining = list.length - visible.length;
  const base = size === 'sm' ? 'text-[10px]' : 'text-xs';

  return (
    <div className="flex items-center flex-wrap gap-1">
      {visible.map((member) => (
        <Badge
          key={member.id}
          variant="outline"
          className={`${base} font-medium`}
          title={member.email || member.name || member.id}
        >
          {member.name || member.email || member.id.slice(0, 8)}
        </Badge>
      ))}
      {remaining > 0 && (
        <Badge variant="secondary" className={`${base} font-medium`}>
          +{remaining}
        </Badge>
      )}
    </div>
  );
}


