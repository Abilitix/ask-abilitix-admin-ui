'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Loader2, AlertCircle } from 'lucide-react';
import type { AskResponse } from '@/lib/api/ask';
import { useState, useEffect } from 'react';

type Props = { 
  data?: AskResponse; 
  loading?: boolean; 
  error?: string | null;
  streamingAnswer?: string;
  isStreaming?: boolean;
};

// Determine answer type label based on source and match information
function getAnswerTypeLabel(
  source?: string,
  sourceDetail?: string,
  match?: { matched: boolean; source_detail?: string }
): { label: string; color: string } | null {
  // FAQ fast path hit: REQUIRES match.matched === true AND match.source_detail === 'qa_pair'
  // If match data is missing or doesn't indicate FAQ hit, treat as regular QA pair
  const isFaqHit = 
    match?.matched === true && 
    match?.source_detail === 'qa_pair';

  // FAQ fast path hit: only show "Approved FAQ" when explicitly matched
  if (
    (source === 'db' || sourceDetail === 'qa_pair') &&
    isFaqHit
  ) {
    return { label: 'Approved FAQ', color: 'text-emerald-700' };
  }

  // Regular QA pair (non-FAQ): source === 'db' BUT NOT FAQ fast path
  // This includes: answer cache hits, regular QA pairs, FAQ misses
  if (
    (source === 'db' || sourceDetail === 'qa_pair') &&
    !isFaqHit  // Explicitly not FAQ hit (match missing, matched=false, or source_detail !== 'qa_pair')
  ) {
    return { label: 'Approved QA Pair', color: 'text-blue-700' };
  }

  // Document RAG: source === 'docs.rag' OR sourceDetail === 'docs'
  if (source === 'docs.rag' || sourceDetail === 'docs') {
    return { label: 'Document Search', color: 'text-green-700' };
  }

  // Model-generated or other: no label
  return null;
}

export function AskResultCard({ data, loading, error, streamingAnswer, isStreaming }: Props) {
  const [documentNames, setDocumentNames] = useState<Record<string, string>>({});
  const matchSourceDetail = (data as any)?.match?.source_detail as string | undefined;
  const topLevelSourceDetail = (data as any)?.source_detail as string | undefined;
  // Determine answer type label using enhanced logic
  const answerType = getAnswerTypeLabel(
    data?.source,
    topLevelSourceDetail || matchSourceDetail,
    data?.match
  );

  // Fetch document names when citations are available
  useEffect(() => {
    if (data?.citations && data.citations.length > 0) {
      const fetchDocumentNames = async () => {
        try {
          const response = await fetch('/api/admin/docs?limit=100', { cache: 'no-store' });
          if (response.ok) {
            const docsData = await response.json();
            const names = (docsData.docs || []).reduce((acc: Record<string, string>, doc: any) => {
              acc[doc.id] = doc.title || `Document ${doc.id}`;
              return acc;
            }, {});
            setDocumentNames(names);
          }
        } catch (error) {
          console.warn('Failed to fetch document names:', error);
        }
      };
      fetchDocumentNames();
    }
  }, [data?.citations]);

  const getSourceColor = (source: AskResponse['source']) => {
    switch (source) {
      case 'docs.rag':
        return 'bg-green-100 text-green-800';
      case 'qa.model':
        return 'bg-blue-100 text-blue-800';
      case 'model+inbox_pending':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getSourceLabel = (source: AskResponse['source']) => {
    switch (source) {
      case 'docs.rag':
        return 'Document RAG';
      case 'qa.model':
        return 'QA Model';
      case 'model+inbox_pending':
        return 'Model + Inbox Pending';
      default:
        return source;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <MessageSquare className="h-5 w-5" />
            <span>Ask Result</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <span>Asking...</span>
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
            <MessageSquare className="h-5 w-5" />
            <span>Ask Result</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 text-destructive">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">{error}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data && !streamingAnswer && !isStreaming) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <MessageSquare className="h-5 w-5" />
            <span>Ask Result</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-muted-foreground">No result yet</p>
            <p className="text-sm text-muted-foreground">
              Click &quot;AI Assistant&quot; to test the Q&A flow
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <MessageSquare className="h-5 w-5" />
            <span>Ask Result</span>
            {isStreaming && <span className="text-xs text-muted-foreground">(Streaming)</span>}
          </div>
          {data?.source ? (
            <Badge 
              variant="outline" 
              className={getSourceColor(data.source)}
            >
              {getSourceLabel(data.source)}
            </Badge>
          ) : isStreaming ? (
            <Badge variant="outline" className="bg-blue-100 text-blue-800">
              Streaming
            </Badge>
          ) : null}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Answer */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium">Answer</h4>
            <button
              onClick={() => navigator.clipboard.writeText(streamingAnswer || data?.answer || '')}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              title="Copy answer"
            >
              📋 Copy
            </button>
          </div>
          {answerType && (
            <div className={`mb-1 text-[11px] font-medium ${answerType.color}`}>
              Answer type: {answerType.label}
            </div>
          )}
          <div className="text-sm leading-relaxed bg-muted/50 p-3 rounded-md">
            {streamingAnswer || data?.answer || ''}
            {isStreaming && <span className="animate-pulse">|</span>}
          </div>
        </div>

        {/* Citations */}
        {data?.citations && data.citations.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-2">
              Citations ({data.citations.length})
            </h4>
            <div className="space-y-2">
              {data.citations.map((citation, index) => (
                <div 
                  key={index}
                  className="flex items-center justify-between bg-muted/30 p-2 rounded text-sm"
                >
                  <div className="flex items-center space-x-2">
                    <span className="text-sm">
                      {documentNames[citation.doc_id] || `${citation.doc_id.substring(0, 8)}...`}
                    </span>
                    <button
                      onClick={() => navigator.clipboard.writeText(citation.doc_id)}
                      className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                      title="Copy full doc ID"
                    >
                      📋
                    </button>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {citation.score.toFixed(3)}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Match Info */}
        {data?.match && (
          <div>
            <h4 className="text-sm font-medium mb-2">Match Info</h4>
            <div className="text-sm space-y-1">
              <div className="flex justify-between">
                <span>Matched:</span>
                <Badge variant={data.match.matched ? "default" : "secondary"}>
                  {data.match.matched ? "Yes" : "No"}
                </Badge>
              </div>
              {data.match.id && (
                <div className="flex justify-between">
                  <span>ID:</span>
                  <span className="font-mono text-xs">{data.match.id}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Similarity:</span>
                <span title="Similarity is the combined vec/trgm score used to gate doc mode">
                  {data.match.similarity ? data.match.similarity.toFixed(3) : '–'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Inbox ID (for model+inbox_pending) */}
        {data?.inbox_id && (
          <div>
            <h4 className="text-sm font-medium mb-2">Inbox ID</h4>
            <div className="text-sm font-mono bg-muted/30 p-2 rounded">
              {data.inbox_id}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
