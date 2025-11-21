'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { WidgetKeyDisplay } from './WidgetKeyDisplay';
import { EmbedSnippetBlock } from './EmbedSnippetBlock';
import type { WidgetConfig, RotateKeyResponse } from '@/lib/types/widget';

export function WidgetSettingsSection() {
  const [config, setConfig] = useState<WidgetConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [rotating, setRotating] = useState(false);
  const [togglingEnabled, setTogglingEnabled] = useState(false);

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

  const handleToggleEnabled = async () => {
    if (!config) return;

    const previousEnabled = config.enabled;
    const newEnabled = !previousEnabled;
    setTogglingEnabled(true);

    try {
      const payload: Record<string, unknown> = {
        updates: [
          {
            key: 'WIDGET.ENABLED',
            value: { value: newEnabled ? 1 : 0 },
          },
        ],
      };

      // Use tenant_slug from config if available
      if (config.tenant_slug) {
        payload.tenant_slug = config.tenant_slug;
      }

      const response = await fetch('/api/admin/tenant-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[widget-toggle] API error:', {
          status: response.status,
          error: errorText,
          payload,
        });
        throw new Error(errorText || `Failed to update widget status: ${response.status}`);
      }

      // Check response body for any errors
      const responseData = await response.json().catch(() => null);
      if (responseData?.error) {
        console.error('[widget-toggle] Response contains error:', responseData);
        throw new Error(responseData.error || responseData.message || 'Failed to update widget status');
      }

      // Update local state optimistically
      setConfig((prev) => (prev ? { ...prev, enabled: newEnabled } : null));

      // Reload config in background to ensure consistency
      loadConfig(false).catch((err) => {
        console.error('Background config reload failed:', err);
      });

      console.log('[widget-toggle] Success:', { newEnabled, responseData });
      toast.success(`Widget ${newEnabled ? 'enabled' : 'disabled'}.`);
    } catch (error) {
      console.error('[widget-toggle] failed', error);
      toast.error(`Failed to ${newEnabled ? 'enable' : 'disable'} widget. Please try again.`);
      // Revert local state on error
      setConfig((prev) => (prev ? { ...prev, enabled: previousEnabled } : null));
    } finally {
      setTogglingEnabled(false);
    }
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
        {/* Enabled Toggle - Phase 2 */}
        <div className="flex items-center justify-between">
          <div>
            <label className="text-sm font-medium">Widget Status</label>
            <p className="text-xs text-muted-foreground mt-0.5">
              {config.enabled
                ? 'Widget is active and can be embedded on your website'
                : 'Widget is disabled and will not respond to requests'}
            </p>
          </div>
          <Button
            onClick={handleToggleEnabled}
            disabled={togglingEnabled}
            variant={config.enabled ? 'default' : 'outline'}
            className={`min-w-[100px] ${
              config.enabled
                ? 'bg-green-600 hover:bg-green-700 text-white'
                : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
            }`}
          >
            {togglingEnabled ? (
              <>
                <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                Updating...
              </>
            ) : config.enabled ? (
              'Enabled'
            ) : (
              'Disabled'
            )}
          </Button>
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

