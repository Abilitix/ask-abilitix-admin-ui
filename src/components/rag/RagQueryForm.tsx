'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Search, Play, Loader2, Zap } from 'lucide-react';

type Props = {
  defaultQuery?: string;
  defaultTopK?: number; // default 8
  onRun: (q: string, k: number) => void;
  onAsk?: (q: string) => void; // optional callback for Try /ask
  onStream?: (q: string) => void; // optional callback for Stream Answer
};

export function RagQueryForm({ defaultQuery = '', defaultTopK = 8, onRun, onAsk, onStream }: Props) {
  const [query, setQuery] = useState(defaultQuery);
  const [topK, setTopK] = useState(defaultTopK);
  const [ragLoading, setRagLoading] = useState(false);
  const [askLoading, setAskLoading] = useState(false);
  const [streamLoading, setStreamLoading] = useState(false);

  const handleRunRAG = async () => {
    if (!query.trim() || ragLoading || askLoading || streamLoading) return;
    
    setRagLoading(true);
    try {
      onRun(query.trim(), topK);
    } finally {
      setRagLoading(false);
    }
  };

  const handleTryAsk = async () => {
    if (!query.trim() || ragLoading || askLoading || streamLoading) return;
    
    setAskLoading(true);
    try {
      onAsk?.(query.trim());
    } finally {
      setAskLoading(false);
    }
  };

  const handleStreamAsk = async () => {
    if (!query.trim() || ragLoading || askLoading || streamLoading) return;
    
    setStreamLoading(true);
    try {
      onStream?.(query.trim());
    } finally {
      setStreamLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !ragLoading && !askLoading) {
      handleRunRAG();
    }
  };

  const isQueryValid = query.trim().length > 0;
  const isDisabled = ragLoading || askLoading || streamLoading;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Search className="h-5 w-5" />
          <span>RAG Query</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="query">Query *</Label>
          <Input
            id="query"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Enter your query (e.g., refund policy)"
            disabled={isDisabled}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="topk">Top K Results</Label>
          <Input
            id="topk"
            type="number"
            value={topK}
            onChange={(e) => setTopK(Math.max(1, Math.min(20, parseInt(e.target.value) || 8)))}
            min={1}
            max={20}
            disabled={isDisabled}
          />
          <div className="text-xs text-muted-foreground">
            Number of results to retrieve (1-20)
          </div>
        </div>
        
        <div className="flex space-x-2">
          <Button
            onClick={handleRunRAG}
            disabled={!isQueryValid || isDisabled}
            className="flex-1"
          >
            {ragLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Running RAG...
              </>
            ) : (
              <>
                <Search className="mr-2 h-4 w-4" />
                Run RAG
              </>
            )}
          </Button>
          
          {onAsk && (
            <Button
              onClick={handleTryAsk}
              disabled={!isQueryValid || isDisabled}
              variant="outline"
              className="flex-1"
            >
              {askLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Asking...
                </>
              ) : (
                <>
                  <Play className="mr-2 h-4 w-4" />
                  Try /ask
                </>
              )}
            </Button>
          )}

          {onStream && (
            <Button
              onClick={handleStreamAsk}
              disabled={!isQueryValid || isDisabled}
              variant="outline"
              className="flex-1"
            >
              {streamLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Streaming...
                </>
              ) : (
                <>
                  <Zap className="mr-2 h-4 w-4" />
                  Stream Answer
                </>
              )}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
