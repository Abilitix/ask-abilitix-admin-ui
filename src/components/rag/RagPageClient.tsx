'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { RagQueryForm } from '@/components/rag/RagQueryForm';
import { RagHitsTable, type Hit } from '@/components/rag/RagHitsTable';
import { AskResultCard } from '@/components/rag/AskResultCard';
import { askPost, type AskResponse } from '@/lib/api/ask';
import { toast } from 'sonner';
import type { UserRole } from '@/lib/roles';

export function RagPageClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  // State
  const [query, setQuery] = useState('');
  const [topK, setTopK] = useState(8);
  const [hits, setHits] = useState<Hit[]>([]);
  const [topScore, setTopScore] = useState<number | undefined>();
  const [ragLoading, setRagLoading] = useState(false);
  const [askResult, setAskResult] = useState<AskResponse | undefined>();
  const [askLoading, setAskLoading] = useState(false);
  const [askError, setAskError] = useState<string | null>(null);
  const [streamingAnswer, setStreamingAnswer] = useState<string>('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [userRole, setUserRole] = useState<UserRole | undefined>();

  // Initialize from URL params
  useEffect(() => {
    const urlQuery = searchParams.get('q');
    const urlTopK = searchParams.get('k');
    
    if (urlQuery) setQuery(urlQuery);
    if (urlTopK) setTopK(Math.max(1, Math.min(20, parseInt(urlTopK) || 8)));
  }, [searchParams]);

  // Get user role for viewer instructions
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok && alive) {
          const data = await res.json();
          const role = data?.role;
          if (role === 'owner' || role === 'admin' || role === 'curator' || role === 'viewer' || role === 'guest') {
            setUserRole(role);
          }
        }
      } catch {
        // Ignore errors, role will remain undefined
      }
    })();
    return () => { alive = false; };
  }, []);

  // Update URL when query/topK changes
  const updateURL = useCallback((newQuery: string, newTopK: number) => {
    const params = new URLSearchParams();
    if (newQuery) params.set('q', newQuery);
    if (newTopK !== 8) params.set('k', newTopK.toString());
    
    const newURL = params.toString() ? `?${params.toString()}` : '';
    router.replace(`/admin/rag${newURL}`, { scroll: false });
  }, [router]);

  // RAG probe handler
  const handleRunRAG = useCallback(async (q: string, k: number) => {
    try {
      setRagLoading(true);
      setAskError(null);
      // Clear previous results immediately when starting new query
      setHits([]);
      setTopScore(undefined);
      
      const response = await fetch(`/api/smoke/rag?q=${encodeURIComponent(q)}&topk=${k}`);
      
      if (!response.ok) {
        throw new Error(`RAG probe failed: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Handle proxy error responses
      if (data.error) {
        throw new Error(data.details || data.error);
      }
      
      // Transform the response to our Hit format
      const transformedHits: Hit[] = data.hits?.map((hit: unknown, index: number) => {
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
      
      // Update URL
      updateURL(q, k);
      
      toast.success(`Found ${transformedHits.length} results`);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'RAG probe failed';
      setAskError(errorMessage);
      toast.error(`RAG probe failed: ${errorMessage}`);
      console.error('RAG probe error:', err);
    } finally {
      setRagLoading(false);
    }
  }, [updateURL]);

  // Ask handler
  const handleTryAsk = useCallback(async (q: string) => {
    try {
      setAskLoading(true);
      setAskError(null);
      // Clear previous ask result when starting new query
      setAskResult(undefined);
      
      const result = await askPost({
        question: q,
        session_id: 'ui-rag-test'
      });
      
      setAskResult(result);
      toast.success('Ask completed successfully');
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Ask failed';
      setAskError(errorMessage);
      toast.error(`Ask failed: ${errorMessage}`);
      console.error('Ask error:', err);
    } finally {
      setAskLoading(false);
    }
  }, []);

  // Streaming handler
  const handleStreamAsk = useCallback(async (q: string) => {
    try {
      console.log('Starting stream ask for:', q);
      setIsStreaming(true);
      setAskError(null);
      setStreamingAnswer('');
      setAskResult(undefined);
      
      console.log('Making request to /api/ask/stream');
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      // Note: ADMIN_TOKEN removed for Phase 2 - using session-based auth only
      
      const response = await fetch('/api/ask/stream', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          question: q,
          session_id: 'ui-rag-stream-test'
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Streaming response error:', response.status, errorText);
        throw new Error(`Streaming failed: ${response.status} - ${errorText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body');
      }

      const decoder = new TextDecoder();
      let answer = '';

      console.log('Starting to read stream...');
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          console.log('Stream completed');
          break;
        }

        const chunk = decoder.decode(value, { stream: true });
        console.log('Received chunk:', chunk);
        
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim();
            if (data === '[DONE]') {
              console.log('Stream marked as done');
              setIsStreaming(false);
              return;
            }
            
            try {
              const parsed = JSON.parse(data);
              if (parsed.delta) {
                answer += parsed.delta;
                setStreamingAnswer(answer);
                console.log('Added delta:', parsed.delta, 'Total length:', answer.length);
              }
            } catch (e) {
              console.log('Failed to parse line as JSON:', data);
            }
          }
        }
      }
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Streaming failed';
      setAskError(errorMessage);
      toast.error(`Streaming failed: ${errorMessage}`);
      console.error('Streaming error:', err);
    } finally {
      setIsStreaming(false);
    }
  }, []);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Chat Testing</h1>
      </div>

      {/* Viewer Instructions */}
      {userRole === 'viewer' && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">
                Welcome, Viewer!
              </h3>
              <div className="mt-2 text-sm text-blue-700">
                <p>
                  Welcome! You're here to test our chatbot and see how well it answers questions from your team's documents. 
                  Document uploads and settings are handled by your administrators.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Query Form */}
      <RagQueryForm
        defaultQuery={query}
        defaultTopK={topK}
        onRun={handleRunRAG}
        onAsk={handleTryAsk}
      />

      {/* Results Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* RAG Hits Table */}
        <RagHitsTable
          hits={hits}
          topScore={topScore}
          loading={ragLoading}
        />
        
        {/* Ask Result Card */}
        <AskResultCard
          data={askResult}
          loading={askLoading}
          error={askError}
          streamingAnswer={streamingAnswer}
          isStreaming={isStreaming}
        />
      </div>
    </div>
  );
}
