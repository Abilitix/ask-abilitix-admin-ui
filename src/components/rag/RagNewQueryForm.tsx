'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MessageCircle, Loader2 } from 'lucide-react';

type Props = {
  defaultQuery?: string;
  defaultTopK?: number;
  onTestChat: (q: string, k: number) => void;
  isLoading: boolean;
};

export function RagNewQueryForm({ defaultQuery = '', defaultTopK = 8, onTestChat, isLoading }: Props) {
  const [query, setQuery] = useState(defaultQuery);
  const [topK, setTopK] = useState(defaultTopK);

  const handleTestChat = async () => {
    if (!query.trim() || isLoading) return;
    onTestChat(query.trim(), topK);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isLoading) {
      handleTestChat();
    }
  };

  const isQueryValid = query.trim().length > 0;
  const isDisabled = isLoading;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <MessageCircle className="h-5 w-5" />
          <span>Ask a Question</span>
        </CardTitle>
        <p className="text-sm text-gray-600">
          Enter a question about your documents. The system will search for relevant information and provide an AI-generated answer.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="query">Question *</Label>
          <Input
            id="query"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="e.g., What is our refund policy?"
            disabled={isDisabled}
            className="text-base"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="topk">Number of Sources to Check</Label>
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
            How many documents to search through (1-20)
          </div>
        </div>
        
        <Button
          onClick={handleTestChat}
          disabled={!isQueryValid || isDisabled}
          className="w-full bg-blue-600 hover:bg-blue-700"
          size="lg"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Testing...
            </>
          ) : (
            <>
              <MessageCircle className="mr-2 h-5 w-5" />
              Test Chat
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
