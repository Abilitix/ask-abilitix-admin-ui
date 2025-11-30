'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, AlertCircle } from 'lucide-react';
import { ContextSettings, PreviewResponse } from './types';

interface PreviewSectionProps {
  ctx: ContextSettings;
  tenantSlug: string;
}

const SAMPLE_QUERIES = [
  { label: 'About us', value: 'About us' },
  { label: 'What is RAG?', value: 'What is RAG?' },
  { label: 'Privacy policy', value: 'Privacy policy' },
];

export function PreviewSection({ ctx, tenantSlug }: PreviewSectionProps) {
  const [query, setQuery] = useState('About us');
  const [preview, setPreview] = useState<PreviewResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handlePreview() {
    if (!query.trim() || !tenantSlug) {
      setError('Query and tenant slug are required');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setPreview(null);

      const response = await fetch(
        `/api/runtime/ctx-preview?tenantSlug=${encodeURIComponent(tenantSlug)}&q=${encodeURIComponent(query)}`
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to fetch preview');
      }

      const data = await response.json();
      setPreview(data);
    } catch (err) {
      console.error('Preview error:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch preview');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Preview Context Bundle</CardTitle>
        <CardDescription>
          See how your context will be applied to sample queries.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Query Input */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Sample Query</Label>
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="flex-1">
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Enter a query to preview"
                className="min-h-[44px]"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handlePreview();
                  }
                }}
              />
            </div>
            <Button
              onClick={handlePreview}
              disabled={loading || !query.trim() || !tenantSlug}
              className="w-full sm:w-auto min-h-[44px]"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Loading...
                </>
              ) : (
                'Preview'
              )}
            </Button>
          </div>
          
          {/* Sample Query Buttons */}
          <div className="flex flex-wrap gap-2">
            {SAMPLE_QUERIES.map((sample) => (
              <Button
                key={sample.value}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setQuery(sample.value);
                  setPreview(null);
                  setError(null);
                }}
                className="text-xs"
              >
                {sample.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Runtime Flag Banner */}
        {preview && !preview.flags.CTX_ENABLE && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800 text-sm">
            <AlertCircle className="h-4 w-4 inline mr-2" />
            Runtime context is disabled at the platform level. This preview shows what would be used if enabled.
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            <AlertCircle className="h-4 w-4 inline mr-2" />
            {error}
          </div>
        )}

        {/* Preview Results */}
        {preview && (
          <div className="space-y-4">
            {/* Metadata */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 bg-gray-50 rounded border">
                <div className="text-xs text-gray-500">Tokens</div>
                <div className="text-sm font-semibold">{preview.bundle.meta.tokens}</div>
              </div>
              <div className="p-3 bg-gray-50 rounded border">
                <div className="text-xs text-gray-500">Intents</div>
                <div className="text-sm font-semibold">
                  {preview.bundle.meta.intents.length > 0
                    ? preview.bundle.meta.intents.join(', ')
                    : 'None'}
                </div>
              </div>
              <div className="p-3 bg-gray-50 rounded border">
                <div className="text-xs text-gray-500">Applied</div>
                <div className="text-sm font-semibold">
                  {preview.bundle.meta.applied ? 'Yes' : 'No'}
                </div>
              </div>
              <div className="p-3 bg-gray-50 rounded border">
                <div className="text-xs text-gray-500">Cache Hit</div>
                <div className="text-sm font-semibold">
                  {preview.bundle.meta.cache_hit ? 'Yes' : 'No'}
                </div>
              </div>
            </div>

            {/* Bundle Text */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Context Bundle</Label>
              <div className="p-4 bg-gray-900 text-gray-100 rounded-lg font-mono text-sm whitespace-pre-wrap overflow-x-auto max-h-96 overflow-y-auto">
                {preview.bundle.text || '(Empty bundle)'}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

