'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from 'sonner';
import { Loader2, HelpCircle, Palette } from 'lucide-react';
import { WidgetKeyDisplay } from './WidgetKeyDisplay';
import { EmbedSnippetBlock } from './EmbedSnippetBlock';
import type { WidgetConfig, RotateKeyResponse } from '@/lib/types/widget';

export function WidgetSettingsSection() {
  const [config, setConfig] = useState<WidgetConfig | null>(null);
  const configRef = useRef<WidgetConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [rotating, setRotating] = useState(false);
  const [togglingEnabled, setTogglingEnabled] = useState(false);
  
  // Theme settings state
  const [themeSettings, setThemeSettings] = useState({
    primary_color: '#3b82f6',
    accent_color: '#8b5cf6',
    title: '',
    welcome_message: '',
    position: 'bottom-right',
  });
  const [savingTheme, setSavingTheme] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Keep ref in sync with state
  useEffect(() => {
    configRef.current = config;
  }, [config]);

  const loadConfig = useCallback(async (showLoading: boolean = true) => {
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
      // Initialize theme settings from config
      if (data) {
        setThemeSettings({
          primary_color: data.primary_color || '#3b82f6',
          accent_color: data.accent_color || '#8b5cf6',
          title: data.title || '',
          welcome_message: data.welcome_message || '',
          position: data.position || 'bottom-right',
        });
      }
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
  }, []);

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

  // Save theme settings with debouncing
  const saveThemeSettings = useCallback((updates: Partial<typeof themeSettings>) => {
    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Update local state immediately for responsive UI
    setThemeSettings((prev) => ({ ...prev, ...updates }));

    // Debounce API call
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        setSavingTheme(true);
        
        // Get latest config from ref at save time
        const currentConfig = configRef.current;
        if (!currentConfig) {
          setSavingTheme(false);
          return;
        }

        const payload: {
          updates: Array<{ key: string; value: { value: string } }>;
          tenant_slug?: string;
        } = {
          updates: [],
        };

        // Build updates array for changed settings
        if (updates.primary_color !== undefined) {
          payload.updates.push({
            key: 'WIDGET.PRIMARY_COLOR',
            value: { value: updates.primary_color },
          });
        }
        if (updates.accent_color !== undefined) {
          payload.updates.push({
            key: 'WIDGET.ACCENT_COLOR',
            value: { value: updates.accent_color },
          });
        }
        if (updates.title !== undefined) {
          payload.updates.push({
            key: 'WIDGET.TITLE',
            value: { value: updates.title },
          });
        }
        if (updates.welcome_message !== undefined) {
          payload.updates.push({
            key: 'WIDGET.WELCOME_MESSAGE',
            value: { value: updates.welcome_message },
          });
        }
        if (updates.position !== undefined) {
          payload.updates.push({
            key: 'WIDGET.POSITION',
            value: { value: updates.position },
          });
        }

        if (payload.updates.length === 0) {
          setSavingTheme(false);
          return;
        }

        if (currentConfig.tenant_slug) {
          payload.tenant_slug = currentConfig.tenant_slug;
        }

        const response = await fetch('/api/admin/tenant-settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(errorText || `Failed to save theme settings: ${response.status}`);
        }

        const responseData = await response.json().catch(() => null);
        if (responseData?.error) {
          throw new Error(responseData.error || responseData.message || 'Failed to save theme settings');
        }

        // Reload config to get updated embed snippet
        await loadConfig(false);
        toast.success('Theme settings saved');
      } catch (error) {
        console.error('[theme-save] failed', error);
        toast.error('Failed to save theme settings. Please try again.');
        // Reload config to revert to server state
        loadConfig(false).catch(() => {});
      } finally {
        setSavingTheme(false);
      }
    }, 500); // 500ms debounce
  }, [loadConfig]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

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

        {/* Theme Settings - Phase 2+ */}
        <div className="border-t pt-6 mt-6">
          <div className="flex items-center gap-2 mb-4">
            <Palette className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-semibold">Theme Customization</h3>
            {savingTheme && (
              <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
            )}
          </div>
          <p className="text-sm text-muted-foreground mb-6">
            Customize the appearance of your widget to match your brand.
          </p>

          <div className="space-y-6">
            {/* Colors Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Primary Color */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="primary-color" className="text-sm font-medium">
                    Primary Color
                  </Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-4 w-4 text-gray-400 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Main color used for buttons and primary actions in the widget</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <input
                      type="color"
                      id="primary-color"
                      value={themeSettings.primary_color}
                      onChange={(e) => saveThemeSettings({ primary_color: e.target.value })}
                      className="h-10 w-16 rounded border border-gray-300 cursor-pointer"
                    />
                  </div>
                  <Input
                    type="text"
                    value={themeSettings.primary_color}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (/^#[0-9A-Fa-f]{6}$/.test(value) || value === '') {
                        saveThemeSettings({ primary_color: value || '#3b82f6' });
                      }
                    }}
                    placeholder="#3b82f6"
                    className="flex-1 font-mono text-sm"
                    maxLength={7}
                  />
                </div>
              </div>

              {/* Accent Color */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="accent-color" className="text-sm font-medium">
                    Accent Color
                  </Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-4 w-4 text-gray-400 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Secondary color used for highlights and accents in the widget</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <input
                      type="color"
                      id="accent-color"
                      value={themeSettings.accent_color}
                      onChange={(e) => saveThemeSettings({ accent_color: e.target.value })}
                      className="h-10 w-16 rounded border border-gray-300 cursor-pointer"
                    />
                  </div>
                  <Input
                    type="text"
                    value={themeSettings.accent_color}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (/^#[0-9A-Fa-f]{6}$/.test(value) || value === '') {
                        saveThemeSettings({ accent_color: value || '#8b5cf6' });
                      }
                    }}
                    placeholder="#8b5cf6"
                    className="flex-1 font-mono text-sm"
                    maxLength={7}
                  />
                </div>
              </div>
            </div>

            {/* Title */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="widget-title" className="text-sm font-medium">
                  Widget Title
                </Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-4 w-4 text-gray-400 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Title displayed in the widget header (optional)</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Input
                id="widget-title"
                type="text"
                value={themeSettings.title}
                onChange={(e) => saveThemeSettings({ title: e.target.value })}
                placeholder="Chat with us"
                maxLength={50}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                {themeSettings.title.length}/50 characters
              </p>
            </div>

            {/* Welcome Message */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="welcome-message" className="text-sm font-medium">
                  Welcome Message
                </Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-4 w-4 text-gray-400 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Initial message shown when users open the widget (optional)</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Textarea
                id="welcome-message"
                value={themeSettings.welcome_message}
                onChange={(e) => saveThemeSettings({ welcome_message: e.target.value })}
                placeholder="Hi! How can I help you today?"
                maxLength={200}
                rows={3}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                {themeSettings.welcome_message.length}/200 characters
              </p>
            </div>

            {/* Position */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="widget-position" className="text-sm font-medium">
                  Widget Position
                </Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-4 w-4 text-gray-400 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Where the widget appears on your website</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Select
                id="widget-position"
                value={themeSettings.position}
                onChange={(e) => saveThemeSettings({ position: e.target.value })}
                className="w-full"
              >
                <option value="bottom-right">Bottom Right</option>
                <option value="bottom-left">Bottom Left</option>
              </Select>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

