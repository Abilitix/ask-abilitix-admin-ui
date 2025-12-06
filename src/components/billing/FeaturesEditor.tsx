'use client';

import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus, X, Code, ToggleLeft } from 'lucide-react';

interface FeaturesEditorProps {
  features: Record<string, any>;
  onChange: (features: Record<string, any>) => void;
  disabled?: boolean;
}

// Common features that should be available as toggles
const COMMON_FEATURES = [
  { key: 'ai_chat', label: 'AI Chat', description: 'Enable AI chat functionality' },
  { key: 'widget', label: 'Widget', description: 'Enable embedded widget' },
  { key: 'api_access', label: 'API Access', description: 'Enable API access' },
  { key: 'analytics', label: 'Analytics', description: 'Enable analytics dashboard' },
  { key: 'custom_branding', label: 'Custom Branding', description: 'Allow custom branding' },
  { key: 'priority_support', label: 'Priority Support', description: 'Priority customer support' },
  { key: 'sso', label: 'SSO', description: 'Single Sign-On support' },
  { key: 'webhooks', label: 'Webhooks', description: 'Webhook integrations' },
];

export function FeaturesEditor({ features, onChange, disabled = false }: FeaturesEditorProps) {
  const [viewMode, setViewMode] = useState<'toggles' | 'json'>('toggles');
  const [customFeatureKey, setCustomFeatureKey] = useState('');
  const [customFeatureValue, setCustomFeatureValue] = useState('');

  // Get all feature keys (common + custom)
  const allFeatureKeys = new Set([
    ...COMMON_FEATURES.map(f => f.key),
    ...Object.keys(features || {}),
  ]);

  const handleToggle = (key: string, value: boolean) => {
    const updated = { ...features };
    if (value) {
      updated[key] = true;
    } else {
      delete updated[key];
    }
    onChange(updated);
  };

  const handleAddCustomFeature = () => {
    if (!customFeatureKey.trim()) return;
    
    const updated = { ...features };
    try {
      // Try to parse as JSON if it looks like JSON
      if (customFeatureValue.trim().startsWith('{') || customFeatureValue.trim().startsWith('[')) {
        updated[customFeatureKey] = JSON.parse(customFeatureValue);
      } else if (customFeatureValue.toLowerCase() === 'true' || customFeatureValue.toLowerCase() === 'false') {
        updated[customFeatureKey] = customFeatureValue.toLowerCase() === 'true';
      } else if (!isNaN(Number(customFeatureValue))) {
        updated[customFeatureKey] = Number(customFeatureValue);
      } else {
        updated[customFeatureKey] = customFeatureValue || true;
      }
      onChange(updated);
      setCustomFeatureKey('');
      setCustomFeatureValue('');
    } catch {
      // If parsing fails, just use the string value
      updated[customFeatureKey] = customFeatureValue || true;
      onChange(updated);
      setCustomFeatureKey('');
      setCustomFeatureValue('');
    }
  };

  const handleRemoveCustomFeature = (key: string) => {
    const updated = { ...features };
    delete updated[key];
    onChange(updated);
  };

  const handleJSONChange = (jsonString: string) => {
    try {
      const parsed = JSON.parse(jsonString);
      onChange(parsed);
    } catch {
      // Invalid JSON, ignore
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label>Plan Features</Label>
        <div className="flex gap-2">
          <Button
            type="button"
            variant={viewMode === 'toggles' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('toggles')}
            disabled={disabled}
            className="h-8"
          >
            <ToggleLeft className="h-4 w-4 mr-1" />
            Toggles
          </Button>
          <Button
            type="button"
            variant={viewMode === 'json' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('json')}
            disabled={disabled}
            className="h-8"
          >
            <Code className="h-4 w-4 mr-1" />
            JSON
          </Button>
        </div>
      </div>

      {viewMode === 'toggles' ? (
        <div className="space-y-4">
          {/* Common Features */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-gray-700">Common Features</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {COMMON_FEATURES.map(feature => {
                const isEnabled = features?.[feature.key] === true;
                return (
                  <div
                    key={feature.key}
                    className="flex items-start space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    <input
                      type="checkbox"
                      id={`feature-${feature.key}`}
                      checked={isEnabled}
                      onChange={(e) => handleToggle(feature.key, e.target.checked)}
                      disabled={disabled}
                      className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <div className="flex-1 min-w-0">
                      <label
                        htmlFor={`feature-${feature.key}`}
                        className="text-sm font-medium text-gray-900 cursor-pointer"
                      >
                        {feature.label}
                      </label>
                      <p className="text-xs text-gray-500 mt-0.5">{feature.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Custom Features */}
          <div className="space-y-3 pt-4 border-t border-gray-200">
            <h4 className="text-sm font-semibold text-gray-700">Custom Features</h4>
            
            {/* Existing custom features */}
            {Object.keys(features || {})
              .filter(key => !COMMON_FEATURES.find(f => f.key === key))
              .map(key => (
                <div
                  key={key}
                  className="flex items-center justify-between p-3 border border-gray-200 rounded-lg bg-gray-50"
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900">{key}</div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      {typeof features[key] === 'boolean'
                        ? features[key] ? 'Enabled' : 'Disabled'
                        : JSON.stringify(features[key])}
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveCustomFeature(key)}
                    disabled={disabled}
                    className="h-8 w-8 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}

            {/* Add custom feature */}
            <div className="flex gap-2">
              <Input
                placeholder="Feature key (e.g., custom_feature)"
                value={customFeatureKey}
                onChange={(e) => setCustomFeatureKey(e.target.value)}
                disabled={disabled}
                className="flex-1 min-h-[44px] sm:min-h-0"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddCustomFeature();
                  }
                }}
              />
              <Input
                placeholder="Value (true/false/number/JSON)"
                value={customFeatureValue}
                onChange={(e) => setCustomFeatureValue(e.target.value)}
                disabled={disabled}
                className="flex-1 min-h-[44px] sm:min-h-0"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddCustomFeature();
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddCustomFeature}
                disabled={disabled || !customFeatureKey.trim()}
                className="min-h-[44px] sm:min-h-0"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-gray-500">
              Add custom features with any value (boolean, number, string, or JSON object)
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <textarea
            value={JSON.stringify(features || {}, null, 2)}
            onChange={(e) => handleJSONChange(e.target.value)}
            placeholder='{"feature1": true, "feature2": false}'
            rows={8}
            disabled={disabled}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed font-mono min-h-[44px]"
          />
          <p className="text-xs text-gray-500">Edit features as JSON for advanced configuration</p>
        </div>
      )}
    </div>
  );
}

