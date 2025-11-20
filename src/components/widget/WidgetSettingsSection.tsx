'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';
import { WidgetKeyDisplay } from './WidgetKeyDisplay';
import { EmbedSnippetBlock } from './EmbedSnippetBlock';
import type { WidgetConfig, RotateKeyResponse } from '@/lib/types/widget';

export function WidgetSettingsSection() {
  const [config, setConfig] = useState<WidgetConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [rotating, setRotating] = useState(false);

  const loadConfig = async (showLoading: boolean = true) => {
    try {
      if (showLoading) {
        setLoading(true);
      }
      const response = await fetch('/api/admin/widget/config', {
        cache: 'no-store'
      });

      if (!response.ok) {
        throw new Error(`Failed to load widget config: ${response.status}`);
      }

      const data: WidgetConfig = await response.json();
      setConfig(data);
    } catch (error) {
      console.error('Failed to load widget config:', error);
      if (showLoading) {
        toast.error('Failed to load widget configuration');
      }
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    loadConfig();
  }, []);

  const handleRotateKey = async () => {
    // Show confirmation modal
    const confirmed = window.confirm(
      'Rotate Widget Key?\n\n' +
      'The old key will stop working immediately. You must update the embed code on your website with the new key.'
    );

    if (!confirmed) return;

    try {
      setRotating(true);
      const response = await fetch('/api/admin/widget/rotate-key', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-store'
      });

      if (!response.ok) {
        throw new Error(`Failed to rotate widget key: ${response.status}`);
      }

      const data: RotateKeyResponse = await response.json();

      // Update config state directly with new key and snippet
      // Then reload config in background to get masked key (without showing loading spinner)
      if (config) {
        const maskKey = (key: string): string => {
          if (!key || key.length <= 10) return key;
          return key.slice(0, 10) + '***' + key.slice(-6);
        };

        setConfig({
          ...config,
          widget_key: data.widget_key,
          widget_key_masked: maskKey(data.widget_key),
          embed_snippet: data.embed_snippet,
        });
      }

      // Reload config in background to get full updated config (usage stats, etc.)
      // but don't show loading spinner
      loadConfig(false).catch((err) => {
        console.error('Background config reload failed:', err);
        // Non-critical - we already updated the key and snippet
      });

      toast.success('Widget key rotated. Copy the new embed code.');
    } catch (error) {
      console.error('Failed to rotate widget key:', error);
      toast.error('Failed to rotate widget key');
    } finally {
      setRotating(false);
    }
  };

  const maskKey = (key: string): string => {
    if (!key || key.length <= 10) return key;
    return key.slice(0, 10) + '***' + key.slice(-6);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Website Widget</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-slate-600">Loading widget configuration...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!config) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Website Widget</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-red-600">
            Failed to load widget configuration
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Website Widget</CardTitle>
        <CardDescription>
          Embed a chatbot widget on your website. All questions flow into the same governed FAQ inbox.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Enabled Status - Phase 1: Display as text */}
        <div className="text-sm">
          <span className="font-medium">Status: </span>
          <span className={config.enabled ? 'text-green-600' : 'text-gray-500'}>
            {config.enabled ? 'Enabled' : 'Disabled'}
          </span>
        </div>

        <WidgetKeyDisplay
          widgetKey={config.widget_key}
          widgetKeyMasked={config.widget_key_masked}
          usage={config.usage}
          onRotate={handleRotateKey}
          rotating={rotating}
        />

        <EmbedSnippetBlock embedSnippet={config.embed_snippet} />
      </CardContent>
    </Card>
  );
}

