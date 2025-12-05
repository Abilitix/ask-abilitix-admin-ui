'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Loader2, ShieldCheck, CreditCard, Settings, AlertCircle, Info, Users } from 'lucide-react';
import { toast } from 'sonner';
import {
  getEnforcementSettings,
  updateEnforcementSettings,
} from '@/lib/api/billing';
import type { EnforcementSettings, UpdateEnforcementSettingsPayload } from '@/lib/types/billing';

export default function EnforcementSettingsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<EnforcementSettings | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [enforcementMode, setEnforcementMode] = useState<'hard' | 'soft' | 'off'>('off');
  const [gracePeriodDays, setGracePeriodDays] = useState<string>('0');

  // Load settings
  const loadSettings = async () => {
    try {
      setLoading(true);
      const data = await getEnforcementSettings();
      setSettings(data);
      setEnforcementMode(data.enforcement_mode || 'off');
      setGracePeriodDays((data.payment_grace_period_days ?? 0).toString());
    } catch (error: any) {
      console.error('Failed to load enforcement settings:', error);
      // If 404 or settings don't exist, use defaults
      if (error.message?.includes('404') || error.message?.includes('not found') || error.message?.includes('404')) {
        const defaultSettings: EnforcementSettings = {
          enforcement_mode: 'off',
          payment_grace_period_days: 0,
        };
        setSettings(defaultSettings);
        setEnforcementMode('off');
        setGracePeriodDays('0');
        toast.info('Using default enforcement settings. Save to create settings.');
      } else {
        toast.error(error.message || 'Failed to load enforcement settings');
        // Still set defaults so user can save
        const defaultSettings: EnforcementSettings = {
          enforcement_mode: 'off',
          payment_grace_period_days: 0,
        };
        setSettings(defaultSettings);
        setEnforcementMode('off');
        setGracePeriodDays('0');
      }
    } finally {
      setLoading(false);
    }
  };

  // Check SuperAdmin auth
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/auth/me', { cache: 'no-store' });
        if (!res.ok) {
          router.push('/signin');
          return;
        }
        const user = await res.json();
        
        const SUPERADMIN_EMAILS = process.env.NEXT_PUBLIC_SUPERADMIN_EMAILS?.split(',') ?? [];
        const isSuperAdmin = SUPERADMIN_EMAILS.includes(user?.email ?? '');
        
        if (!isSuperAdmin) {
          router.push('/admin/docs?error=insufficient_permissions');
          return;
        }
        
        await loadSettings();
      } catch (error) {
        console.error('Auth check failed:', error);
        router.push('/signin');
      }
    })();
  }, [router]);

  // Handle save
  const handleSave = async () => {
    try {
      setSaving(true);
      const gracePeriod = parseInt(gracePeriodDays);
      if (isNaN(gracePeriod) || gracePeriod < 0) {
        toast.error('Grace period must be a positive number or zero.');
        setSaving(false);
        return;
      }

      const payload: UpdateEnforcementSettingsPayload = {
        enforcement_mode: enforcementMode,
        payment_grace_period_days: gracePeriod,
      };
      const updatedSettings = await updateEnforcementSettings(payload);
      
      // Update local state immediately with the response
      setSettings(updatedSettings);
      setEnforcementMode(updatedSettings.enforcement_mode);
      setGracePeriodDays(updatedSettings.payment_grace_period_days.toString());
      
      toast.success('Enforcement settings updated successfully');
      
      // Also reload from server to ensure we have the latest data
      await loadSettings();
    } catch (error: any) {
      console.error('Failed to update settings:', error);
      toast.error(error.message || 'Failed to update enforcement settings');
    } finally {
      setSaving(false);
    }
  };

  // Get enforcement mode description
  const getModeDescription = (mode: 'hard' | 'soft' | 'off') => {
    switch (mode) {
      case 'hard':
        return 'Tenants are immediately blocked when limits are exceeded or payment is overdue. No grace period applies.';
      case 'soft':
        return 'Tenants receive warnings when limits are exceeded or payment is overdue, but can continue using the service during the grace period.';
      case 'off':
        return 'No enforcement. Tenants can exceed limits and payment can be overdue without restrictions.';
      default:
        return '';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen" role="status" aria-live="polite">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" aria-hidden="true" />
          <p className="text-sm text-muted-foreground">Loading enforcement settings...</p>
        </div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="p-3 sm:p-4 md:p-6 max-w-7xl mx-auto">
        <div className="text-center py-16">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Settings not found</h3>
          <p className="text-sm text-gray-600 mb-6">Unable to load enforcement settings.</p>
          <Button onClick={() => router.push('/admin/billing/plans')} variant="outline">
            Back to Billing
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-4 md:p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-sm">
              <Settings className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Billing</h1>
              <p className="text-sm text-gray-500 mt-1">
                Configure billing enforcement and payment policies
              </p>
            </div>
          </div>
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            <ShieldCheck className="h-3 w-3 mr-1" />
            Superadmin
          </Badge>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 border-b border-gray-200 mt-6">
          <Link
            href="/admin/billing/plans"
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
              pathname === '/admin/billing/plans'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
            }`}
          >
            <CreditCard className="h-4 w-4 inline mr-2" />
            Plans
          </Link>
          <Link
            href="/admin/billing/tenants"
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
              pathname?.startsWith('/admin/billing/tenants')
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
            }`}
          >
            <Users className="h-4 w-4 inline mr-2" />
            Tenants
          </Link>
          <Link
            href="/admin/billing/settings"
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
              pathname === '/admin/billing/settings'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
            }`}
          >
            <Settings className="h-4 w-4 inline mr-2" />
            Settings
          </Link>
        </div>
      </div>

      {/* Enforcement Settings Card */}
      <Card className="bg-white rounded-xl border border-gray-200 shadow-md">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900">Enforcement Settings</CardTitle>
          <CardDescription>
            Configure how billing limits and payment enforcement are applied across all tenants
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Enforcement Mode */}
          <div className="space-y-3">
            <Label htmlFor="enforcement-mode">Enforcement Mode</Label>
            <Select
              id="enforcement-mode"
              value={enforcementMode}
              onChange={(e) => setEnforcementMode(e.target.value as 'hard' | 'soft' | 'off')}
              className="min-h-[44px] sm:min-h-0"
            >
              <option value="off">Off - No enforcement</option>
              <option value="soft">Soft - Warnings with grace period</option>
              <option value="hard">Hard - Immediate blocking</option>
            </Select>
            <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-blue-800">
                {getModeDescription(enforcementMode)}
              </p>
            </div>
          </div>

          {/* Grace Period */}
          <div className="space-y-3">
            <Label htmlFor="grace-period">Payment Grace Period (Days)</Label>
            <Input
              id="grace-period"
              type="number"
              min="0"
              value={gracePeriodDays}
              onChange={(e) => setGracePeriodDays(e.target.value)}
              placeholder="0"
              className="min-h-[44px] sm:min-h-0"
            />
            <p className="text-xs text-gray-500">
              Number of days tenants can continue using the service after payment becomes overdue (only applies to "Soft" enforcement mode).
            </p>
          </div>

          {/* Current Settings Summary */}
          <div className="pt-4 border-t border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Current Settings</span>
              <Badge
                variant={enforcementMode === 'off' ? 'outline' : enforcementMode === 'soft' ? 'default' : 'default'}
                className={
                  enforcementMode === 'hard'
                    ? 'bg-red-50 text-red-700 border-red-200'
                    : enforcementMode === 'soft'
                    ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
                    : 'bg-gray-50 text-gray-700'
                }
              >
                {enforcementMode === 'hard' ? 'Hard Enforcement' : enforcementMode === 'soft' ? 'Soft Enforcement' : 'No Enforcement'}
              </Badge>
            </div>
            <div className="text-sm text-gray-600">
              Grace Period: <span className="font-medium">{settings.payment_grace_period_days ?? 0} days</span>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end pt-4 border-t border-gray-100">
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700 text-white min-h-[44px] sm:min-h-0"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Settings className="h-4 w-4 mr-2" />
                  Save Settings
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

