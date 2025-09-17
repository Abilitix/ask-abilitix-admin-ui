'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Inbox } from 'lucide-react';

type InboxStatsCardProps = {
  itemCount: number;
  refreshSignal?: number;
};

export function InboxStatsCard({ itemCount, refreshSignal }: InboxStatsCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-semibold flex items-center space-x-2 text-[#1e3a8a]">
          <Inbox className="h-4 w-4" aria-hidden />
          <span>Pending Items</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center">
          <div className="text-3xl font-bold tracking-tight">{itemCount}</div>
          <p className="text-xs text-muted-foreground">
            {itemCount === 1 ? 'item' : 'items'} awaiting review
          </p>
        </div>
      </CardContent>
    </Card>
  );
}