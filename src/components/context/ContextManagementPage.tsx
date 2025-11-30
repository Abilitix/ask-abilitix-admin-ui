'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { ContextSettings, DEFAULT_CTX, getContextErrorMessage } from './types';
import { ProfileSection } from './ProfileSection';
import { GlossarySection } from './GlossarySection';
import { PolicySection } from './PolicySection';
import { RoutingSection } from './RoutingSection';
import { PreviewSection } from './PreviewSection';
import { ContextHelpCard } from './ContextHelpCard';

export function ContextManagementPage() {
  const [ctx, setCtx] = useState<ContextSettings>(DEFAULT_CTX);
  const [originalCtx, setOriginalCtx] = useState<ContextSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [tenantSlug, setTenantSlug] = useState<string>('');

  // Load context settings
  useEffect(() => {
    async function loadSettings() {
      try {
        setLoading(true);
        setError(null);

        // Get tenant slug for preview
        const authResponse = await fetch('/api/auth/me');
        if (authResponse.ok) {
          const authData = await authResponse.json();
          setTenantSlug(authData.tenant_slug || '');
        }

        // Load settings
        const response = await fetch('/api/admin/settings', { cache: 'no-store' });
        if (!response.ok) {
          throw new Error(`Failed to load settings: ${response.status}`);
        }

        const data = await response.json();
        
        // Extract ctx from overrides
        const loadedCtx = data.overrides?.ctx || DEFAULT_CTX;
        setCtx(loadedCtx);
        setOriginalCtx(JSON.parse(JSON.stringify(loadedCtx))); // Deep copy
        setIsDirty(false);
      } catch (err) {
        console.error('Failed to load context settings:', err);
        setError('Failed to load context settings. Please try again.');
        toast.error('Failed to load context settings');
      } finally {
        setLoading(false);
      }
    }

    loadSettings();
  }, []);

  // Track dirty state
  useEffect(() => {
    if (originalCtx) {
      const dirty = JSON.stringify(ctx) !== JSON.stringify(originalCtx);
      setIsDirty(dirty);
    }
  }, [ctx, originalCtx]);

  // Save context settings
  async function handleSave() {
    try {
      setSaving(true);
      setError(null);

      const response = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ctx }),
        cache: 'no-store',
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle context-specific errors
        const errorCode = data.detail?.error || data.error;
        if (errorCode && errorCode.startsWith('invalid_ctx.')) {
          const errorMessage = getContextErrorMessage(errorCode);
          setError(errorMessage);
          toast.error(errorMessage);
          return;
        }
        throw new Error(data.detail?.message || data.error || 'Failed to save settings');
      }

      // Update original to mark as saved
      setOriginalCtx(JSON.parse(JSON.stringify(ctx)));
      setIsDirty(false);
      toast.success('Context settings saved. Changes may take up to 60 seconds to apply.');
    } catch (err) {
      console.error('Failed to save context settings:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to save context settings';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  }

  // Discard changes
  function handleDiscard() {
    if (originalCtx) {
      setCtx(JSON.parse(JSON.stringify(originalCtx)));
      setIsDirty(false);
      setError(null);
      toast.info('Changes discarded');
    }
  }

  if (loading) {
    return (
      <div className="p-3 sm:p-4 md:p-6 max-w-6xl">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <span className="ml-3 text-gray-600">Loading context settings...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-4 md:p-6 max-w-6xl">
      {/* Back Navigation */}
      <Link
        href="/admin/settings"
        className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-6 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Settings
      </Link>

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
          Context Management
        </h1>
        <p className="text-sm sm:text-base text-gray-600">
          Control how Abilitix talks about your business and interprets your terminology. 
          General questions are unaffected.
        </p>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Help Card */}
      <ContextHelpCard />

      {/* Enable Toggle */}
      <Card className="mb-6">
        <div className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex-1">
              <h3 className="text-base font-semibold text-gray-900 mb-1">
                Enable Context Bundle
              </h3>
              <p className="text-sm text-gray-600">
                When enabled, Abilitix will use your Profile, Glossary and Policy below to answer 
                brand and terminology questions in your voice.
              </p>
            </div>
            <label className="flex items-center gap-3 cursor-pointer min-h-[44px]">
              <input
                type="checkbox"
                checked={ctx.enable}
                onChange={(e) => setCtx({ ...ctx, enable: e.target.checked })}
                className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-sm font-medium text-gray-700">
                {ctx.enable ? 'Enabled' : 'Disabled'}
              </span>
            </label>
          </div>
        </div>
      </Card>

      {/* Profile Section */}
      <ProfileSection ctx={ctx} setCtx={setCtx} />

      {/* Glossary Section */}
      <GlossarySection ctx={ctx} setCtx={setCtx} />

      {/* Policy Section */}
      <PolicySection ctx={ctx} setCtx={setCtx} />

      {/* Routing Section */}
      <RoutingSection ctx={ctx} setCtx={setCtx} />

      {/* Preview Section */}
      <PreviewSection ctx={ctx} tenantSlug={tenantSlug} />

      {/* Save Actions */}
      <div className="flex flex-col sm:flex-row gap-3 mt-8 pt-6 border-t">
        <Button
          onClick={handleSave}
          disabled={saving || !isDirty}
          className="flex items-center gap-2 w-full sm:w-auto min-h-[44px] bg-indigo-600 hover:bg-indigo-700"
        >
          {saving ? (
            <>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Save Changes
            </>
          )}
        </Button>
        
        <Button
          onClick={handleDiscard}
          disabled={saving || !isDirty}
          variant="outline"
          className="flex items-center gap-2 w-full sm:w-auto min-h-[44px]"
        >
          <X className="h-4 w-4" />
          Discard Changes
        </Button>
      </div>
    </div>
  );
}

