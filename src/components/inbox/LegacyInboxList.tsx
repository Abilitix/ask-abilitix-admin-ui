'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Textarea } from '@/components/ui/textarea';
import { LegacyInboxItem } from './LegacyInboxPageClient';
import {
  Check,
  X,
  RefreshCw,
  Loader2,
  AlertTriangle,
  Inbox,
  Edit2,
  Save,
  RotateCcw,
} from 'lucide-react';

type LegacyInboxListProps = {
  items: LegacyInboxItem[];
  loading: boolean;
  error: string | null;
  onApprove: (id: string, editedAnswer?: string) => void;
  onReject: (id: string) => void;
  onRefresh: () => void;
};

export function LegacyInboxList({
  items,
  loading,
  error,
  onApprove,
  onReject,
  onRefresh,
}: LegacyInboxListProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editedAnswers, setEditedAnswers] = useState<Record<string, string>>({});

  const formatDate = (dateString: string) => new Date(dateString).toLocaleString();

  const truncateText = (text: string, maxLength: number = 100) => {
    if (text.length <= maxLength) return text;
    return `${text.substring(0, maxLength)}...`;
  };

  const startEditing = (id: string, currentAnswer: string) => {
    setEditingId(id);
    setEditedAnswers((prev) => ({ ...prev, [id]: currentAnswer }));
  };

  const cancelEditing = (id: string) => {
    setEditingId(null);
    setEditedAnswers((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const saveEditing = (id: string) => {
    setEditingId(null);
  };

  const handleApprove = (id: string) => {
    const editedAnswer = editedAnswers[id];
    onApprove(id, editedAnswer);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Inbox className="h-5 w-5" />
            <span>Inbox Items</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Loading inbox items...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Inbox className="h-5 w-5" />
            <span>Inbox Items</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="text-red-500 text-sm mb-2">Error: {error}</div>
            <Button onClick={onRefresh} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (items.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Inbox className="h-5 w-5" />
            <span>Inbox Items</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Inbox className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No pending items</p>
            <p className="text-sm text-muted-foreground mt-2">
              All items have been reviewed or there are no new submissions.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium flex items-center space-x-2">
          <Inbox className="h-4 w-4" />
          <span>Inbox Items ({items.length})</span>
        </CardTitle>
        <Button onClick={onRefresh} variant="ghost" size="icon" title="Refresh inbox">
          <RefreshCw className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px]">Question</TableHead>
                <TableHead className="w-[300px]">Answer</TableHead>
                <TableHead className="w-[120px]">Created</TableHead>
                <TableHead className="w-[100px]">PII</TableHead>
                <TableHead className="w-[150px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="w-[200px]">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger className="text-left">
                          {truncateText(item.question, 80)}
                        </TooltipTrigger>
                        <TooltipContent className="max-w-md">
                          <p>{item.question}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TableCell>
                  <TableCell className="w-[300px]">
                    {editingId === item.id ? (
                      <div className="space-y-2">
                        <Textarea
                          value={editedAnswers[item.id] ?? item.answer}
                          onChange={(event) =>
                            setEditedAnswers((prev) => ({ ...prev, [item.id]: event.target.value }))
                          }
                          className="min-h-[100px] resize-y"
                          placeholder="Edit the answer..."
                        />
                        <div className="flex space-x-2">
                          <Button
                            onClick={() => saveEditing(item.id)}
                            size="sm"
                            className="!bg-blue-600 !hover:bg-blue-700 !text-white"
                          >
                            <Save className="h-3 w-3 mr-1" />
                            Save
                          </Button>
                          <Button onClick={() => cancelEditing(item.id)} size="sm" variant="outline">
                            <RotateCcw className="h-3 w-3 mr-1" />
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="text-sm whitespace-pre-wrap max-h-32 overflow-y-auto">
                          {editedAnswers[item.id] || item.answer}
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            onClick={() => startEditing(item.id, editedAnswers[item.id] || item.answer)}
                            size="sm"
                            variant="outline"
                            className="text-xs"
                          >
                            <Edit2 className="h-3 w-3 mr-1" />
                            Edit Answer
                          </Button>
                          <Badge variant="outline" className="text-xs">
                            Click to edit
                          </Badge>
                        </div>
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground w-[120px]">
                    {formatDate(item.created_at)}
                  </TableCell>
                  <TableCell className="w-[100px]">
                    {item.has_pii ? (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <Badge variant="destructive" className="flex items-center space-x-1">
                              <AlertTriangle className="h-3 w-3" />
                              <span>PII</span>
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>PII detected in fields: {item.pii_fields?.join(', ') || 'unknown'}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    ) : (
                      <Badge variant="secondary">Clean</Badge>
                    )}
                  </TableCell>
                  <TableCell className="w-[150px]">
                    <div className="flex space-x-2">
                      <Button
                        onClick={() => handleApprove(item.id)}
                        size="sm"
                        className="!bg-green-600 !hover:bg-green-700 !text-white !border-green-600 !hover:border-green-700"
                        disabled={editingId === item.id}
                        title="Approve and automatically generate embeddings"
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Approve
                      </Button>
                      <Button
                        onClick={() => onReject(item.id)}
                        size="sm"
                        variant="destructive"
                        disabled={editingId === item.id}
                      >
                        <X className="h-4 w-4 mr-1" />
                        Reject
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}


