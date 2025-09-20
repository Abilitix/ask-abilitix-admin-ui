'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { RagNewQueryForm } from '@/components/rag/RagNewQueryForm';
import { RagHitsTable, type Hit } from '@/components/rag/RagHitsTable';
import { AskResultCard } from '@/components/rag/AskResultCard';
import { askPost, type AskResponse } from '@/lib/api/ask';
import { toast } from 'sonner';

export function RagNewPageClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  // State
  const [query, setQuery] = useState('');
  const [topK, setTopK] = useState(8);
  const [hits, setHits] = useState<Hit[]>([]);
  const [topScore, setTopScore] = useState<number | undefined>();
  const [askResult, setAskResult] = useState<AskResponse | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [streamingAnswer, setStreamingAnswer] = useState<string>('');
  const [isStreaming, setIsStreaming] = useState(false);

  // Initialize from URL params
  useEffect(() => {
    const urlQuery = searchParams.get('q');
    const urlTopK = searchParams.get('k');
    
    if (urlQuery) setQuery(urlQuery);
    if (urlTopK) setTopK(Math.max(1, Math.min(20, parseInt(urlTopK) || 8)));
  }, [searchParams]);

  // Update URL when query/topK changes
  const updateURL = useCallback((newQuery: string, newTopK: number) => {
    const params = new URLSearchParams();
    if (newQuery) params.set('q', newQuery);
    if (newTopK !== 8) params.set('k', newTopK.toString());
    
    const newURL = params.toString() ? `?${params.toString()}` : '';
    router.replace(`/admin/rag-new${newURL}`, { scroll: false });
  }, [router]);

  // Single Test Chat handler - does both search and ask
  const handleTestChat = useCallback(async (q: string, k: number) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Clear previous results
      setHits([]);
      setTopScore(undefined);
      setAskResult(undefined);
      setStreamingAnswer('');
      
      // Step 1: Run RAG search
      console.log('Starting RAG search...');
      const ragResponse = await fetch(`/api/smoke/rag?q=${encodeURIComponent(q)}&topk=${k}`);
      
      if (!ragResponse.ok) {
        throw new Error(`RAG search failed: ${ragResponse.status}`);
      }
      
      const ragData = await ragResponse.json();
      
      if (ragData.error) {
        throw new Error(ragData.details || ragData.error);
      }
      
      // Transform RAG results
      const transformedHits: Hit[] = ragData.hits?.map((hit: unknown, index: number) => {
        const h = hit as { score?: number; vec_sim?: number; trgm_sim?: number; preview?: string; text?: string };
        return {
          idx: index + 1,
          score: h.score || 0,
          vec_sim: h.vec_sim || 0,
          trgm_sim: h.trgm_sim || 0,
          preview: h.preview || h.text || 'No preview available'
        };
      }) || [];
      
      setHits(transformedHits);
      setTopScore(transformedHits.length > 0 ? transformedHits[0].score : undefined);
      
      console.log(`Found ${transformedHits.length} search results`);
      
      // Step 2: Run Ask with streaming
      console.log('Starting Ask with streaming...');
      setIsStreaming(true);
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      const askResponse = await fetch('/api/ask/stream', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          question: q,
          session_id: 'ui-rag-new-test'
        })
      });

      if (!askResponse.ok) {
        const errorText = await askResponse.text();
        throw new Error(`Ask failed: ${askResponse.status} - ${errorText}`);
      }

      const reader = askResponse.body?.getReader();
      if (!reader) {
        throw new Error('No response body');
      }

      const decoder = new TextDecoder();
      let answer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim();
            if (data === '[DONE]') {
              setIsStreaming(false);
              break;
            }
            
            try {
              const parsed = JSON.parse(data);
              if (parsed.delta) {
                answer += parsed.delta;
                setStreamingAnswer(answer);
              }
            } catch (e) {
              console.log('Failed to parse streaming data:', data);
            }
          }
        }
      }
      
      // Update URL
      updateURL(q, k);
      
      toast.success(`Test completed: Found ${transformedHits.length} sources and generated answer`);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Test failed';
      setError(errorMessage);
      toast.error(`Test failed: ${errorMessage}`);
      console.error('Test error:', err);
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
    }
  }, [updateURL]);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">RAG Testing</h1>
          <p className="text-gray-600 mt-2">Test how well our system answers questions from your documents</p>
        </div>
      </div>

      {/* Query Form */}
      <RagNewQueryForm
        defaultQuery={query}
        defaultTopK={topK}
        onTestChat={handleTestChat}
        isLoading={isLoading}
      />

      {/* Results Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Search Results */}
        <RagHitsTable
          hits={hits}
          topScore={topScore}
          loading={isLoading}
        />
        
        {/* AI Answer */}
        <AskResultCard
          data={askResult}
          loading={isLoading}
          error={error}
          streamingAnswer={streamingAnswer}
          isStreaming={isStreaming}
        />
      </div>
    </div>
  );
}
