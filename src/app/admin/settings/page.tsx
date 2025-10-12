'use client';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { HelpCircle, Settings, Users, Key, TestTube, Trash2, UserX } from 'lucide-react';
import { toast } from 'sonner';
import { isEmailValid, normalizeEmail } from '@/utils/email';
import { ApiErrorCode } from '@/types/errors';

type Eff = { DOC_MIN_SCORE:number; RAG_TOPK:number; DOC_VEC_W:number; DOC_TRGM_W:number; REQUIRE_WIDGET_KEY?: number; LLM_MAX_OUTPUT_TOKENS?: number; PROMPT_TOPK?: number; LLM_MAX_OUTPUT_TOKENS_CEILING?: number; };
type SettingsResp = { effective: Eff; overrides: Partial<Eff>; tenant_id?: string; tenant_slug?: string; tenant_name?: string; };

// Preset configuration
const PRESET_MAPPINGS = {
  'Concise': { PROMPT_TOPK: 3, LLM_MAX_OUTPUT_TOKENS: 300 },
  'Standard': { PROMPT_TOPK: 4, LLM_MAX_OUTPUT_TOKENS: 500 },
  'Detailed': { PROMPT_TOPK: 6, LLM_MAX_OUTPUT_TOKENS: 800 },
  'Comprehensive': { PROMPT_TOPK: 8, LLM_MAX_OUTPUT_TOKENS: 1000 }
} as const;

type PresetKey = keyof typeof PRESET_MAPPINGS | 'Custom';

// Detect preset from values
function detectPreset(promptTopK: number, maxTokens: number): PresetKey {
  for (const [key, values] of Object.entries(PRESET_MAPPINGS)) {
    if (values.PROMPT_TOPK === promptTopK && values.LLM_MAX_OUTPUT_TOKENS === maxTokens) {
      return key as PresetKey;
    }
  }
  return 'Custom';
}

// Token sync utility function
function getTokenLimitForRagTopK(ragTopK: number): number {
  if (ragTopK <= 2) return 250;
  if (ragTopK <= 4) return 400;
  if (ragTopK <= 6) return 600;
  if (ragTopK <= 8) return 800;
  if (ragTopK <= 12) return 1000;
  return 1200; // Max tokens
}

// User management types
type Member = {
  user_id: string;
  email: string;
  name: string;
  role: 'owner' | 'admin' | 'curator' | 'viewer';
  accepted_at: string;
};

type MembersResponse = {
  members: Member[];
};

// User-friendly preset mappings
const PRESETS = {
  answerQuality: {
    low: { value: 0.1, label: 'Low', description: 'Show more answers, even if less precise' },
    medium: { value: 0.15, label: 'Medium', description: 'Balanced quality and coverage' },
    high: { value: 0.3, label: 'High', description: 'Only show very relevant answers' }
  },
  answerDetail: {
    concise: { value: 3, label: 'Concise', description: 'Short, quick answers' },
    balanced: { value: 6, label: 'Balanced', description: 'Good detail without being too long' },
    comprehensive: { value: 10, label: 'Comprehensive', description: 'Detailed, thorough answers' }
  },
  understandingFocus: {
    keywordMatching: { value: 0.3, label: 'Keyword Matching', description: 'Focus on exact words and phrases' },
    balanced: { value: 0.6, label: 'Balanced', description: 'Mix of keyword and meaning matching' },
    meaningFocus: { value: 0.8, label: 'Meaning Focus', description: 'Focus on understanding intent and concepts' }
  },
  typoTolerance: {
    strict: { value: 0.2, label: 'Strict', description: 'Require exact spelling' },
    medium: { value: 0.4, label: 'Medium', description: 'Handle common typos and variations' },
    flexible: { value: 0.6, label: 'Flexible', description: 'Very forgiving with spelling and word variations' }
  },
  widgetSecurity: {
    openAccess: { value: 0, label: 'Open Access', description: 'Anyone can use the chatbot' },
    keyRequired: { value: 1, label: 'Key Required', description: 'Require API key for security' }
  }
};

export default function SettingsPage() {
  const [data, setData] = useState<SettingsResp | null>(null);
  const [form, setForm] = useState<Partial<Eff>>({});
  const [saving, setSaving] = useState(false);
  const [rot, setRot] = useState<string|null>(null);
  const [err, setErr] = useState<string|null>(null);
  const [supportsGate, setSupportsGate] = useState(false);
  const [advancedMode, setAdvancedMode] = useState(false);
  
  // New preset + sliders state
  const [presetState, setPresetState] = useState<{
    promptTopK: number;
    maxTokens: number;
    preset: PresetKey;
    ceiling: number;
    supportsPromptTopK: boolean;
  }>({
    promptTopK: 4,
    maxTokens: 500,
    preset: 'Standard',
    ceiling: 1200,
    supportsPromptTopK: false
  });
  
  // User invitation state
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'admin' | 'curator' | 'viewer'>('viewer');
  const [inviting, setInviting] = useState(false);
  const [inviteSuccess, setInviteSuccess] = useState(false);

  // User list state
  const [members, setMembers] = useState<Member[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [offboardingUsers, setOffboardingUsers] = useState<Set<string>>(new Set());
  const [currentUser, setCurrentUser] = useState<{ id: string; role: string } | null>(null);

  // Helper functions to map between presets and technical values
  function getPresetKey(category: keyof typeof PRESETS, value: number): string {
    const categoryPresets = PRESETS[category];
    for (const [key, preset] of Object.entries(categoryPresets)) {
      if ((preset as any).value === value) return key;
    }
    return 'custom';
  }

  function getPresetValue(category: keyof typeof PRESETS, key: string): number {
    const categoryPresets = PRESETS[category];
    if (key in categoryPresets) {
      return (categoryPresets as any)[key].value;
    }
    return 0;
  }

  async function load() {
    setErr(null);
    const r = await fetch('/api/admin/settings', { cache: 'no-store' });
    const j: SettingsResp & { effective: Eff } = await r.json();
    setData(j);
    setSupportsGate(Object.prototype.hasOwnProperty.call(j.effective, 'REQUIRE_WIDGET_KEY'));
    
    // Debug logging
    console.log('Load Debug - Backend values:', {
      DOC_MIN_SCORE: j.effective.DOC_MIN_SCORE,
      RAG_TOPK: j.effective.RAG_TOPK,
      LLM_MAX_OUTPUT_TOKENS: j.effective.LLM_MAX_OUTPUT_TOKENS,
      PROMPT_TOPK: j.effective.PROMPT_TOPK
    });
    
    // Only update form if not currently setting a preset (prevents conflicts)
    if (!isSettingPreset) {
      // Preserve existing form state to prevent overwriting user changes
      setForm(prev => ({
        ...prev,
        DOC_MIN_SCORE: j.effective.DOC_MIN_SCORE,
        RAG_TOPK: j.effective.RAG_TOPK,
        DOC_VEC_W: j.effective.DOC_VEC_W,
        DOC_TRGM_W: j.effective.DOC_TRGM_W,
        LLM_MAX_OUTPUT_TOKENS: j.effective.LLM_MAX_OUTPUT_TOKENS ?? getTokenLimitForRagTopK(j.effective.RAG_TOPK),
        PROMPT_TOPK: j.effective.PROMPT_TOPK ?? 4,
        ...(supportsGate ? { REQUIRE_WIDGET_KEY: j.effective.REQUIRE_WIDGET_KEY ?? 0 } : {})
      }));
    }
    
    // Initialize preset state
    const promptTopK = j.effective.PROMPT_TOPK ?? 4;
    const maxTokens = j.effective.LLM_MAX_OUTPUT_TOKENS ?? 500;
    const ceiling = j.effective.LLM_MAX_OUTPUT_TOKENS_CEILING ?? 1200;
    const supportsPromptTopK = j.effective.PROMPT_TOPK !== undefined;
    
    setPresetState({
      promptTopK,
      maxTokens,
      preset: detectPreset(promptTopK, maxTokens),
      ceiling,
      supportsPromptTopK
    });
  }

  useEffect(() => { load(); /* eslint-disable-line react-hooks/exhaustive-deps */ }, []);

  // Debounced save state
  const [saveTimeout, setSaveTimeout] = useState<NodeJS.Timeout | null>(null);
  const [isSettingPreset, setIsSettingPreset] = useState(false);

  // Trigger save when preset values change (but not during preset selection)
  useEffect(() => {
    if (data && !isSettingPreset) { // Only save after initial load and not during preset selection
      // Only save for manual slider changes, not preset selections
      debouncedSavePresetSettings();
    }
  }, [presetState.promptTopK, presetState.maxTokens, isSettingPreset]);

  function set<K extends keyof Eff>(k:K, v:any){ setForm(p => ({...p, [k]: v})); }

  // Preset handlers
  const applyPreset = (presetKey: PresetKey) => {
    if (presetKey === 'Custom') return;
    
    setIsSettingPreset(true);
    const values = PRESET_MAPPINGS[presetKey as keyof typeof PRESET_MAPPINGS];
    setPresetState(prev => ({
      ...prev,
      promptTopK: values.PROMPT_TOPK,
      maxTokens: values.LLM_MAX_OUTPUT_TOKENS,
      preset: presetKey
    }));
    
    // Sync preset values into form state for main save button
    setForm(prev => ({
      ...prev,
      PROMPT_TOPK: values.PROMPT_TOPK,
      LLM_MAX_OUTPUT_TOKENS: values.LLM_MAX_OUTPUT_TOKENS
    }));
    
    // Save immediately for presets
    setTimeout(async () => {
      try {
        const response = await fetch('/api/admin/settings', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            PROMPT_TOPK: values.PROMPT_TOPK,
            LLM_MAX_OUTPUT_TOKENS: values.LLM_MAX_OUTPUT_TOKENS
          })
        });
        
        if (response.ok) {
          // Fire telemetry event
          if (typeof window !== 'undefined' && (window as any).gtag) {
            (window as any).gtag('event', 'settings.update', {
              preset: presetKey,
              prompt_topk: values.PROMPT_TOPK,
              llm_max_tokens: values.LLM_MAX_OUTPUT_TOKENS
            });
          }
        }
      } catch (error) {
        console.error('Error saving preset:', error);
      } finally {
        setIsSettingPreset(false);
      }
    }, 100);
  };

  const updatePromptTopK = (value: number) => {
    const clamped = Math.max(1, Math.min(12, value));
    setPresetState(prev => ({
      ...prev,
      promptTopK: clamped,
      preset: detectPreset(clamped, prev.maxTokens)
    }));
    
    // Sync to form state for main save button
    setForm(prev => ({
      ...prev,
      PROMPT_TOPK: clamped
    }));
  };

  const updateMaxTokens = (value: number) => {
    const clamped = Math.max(100, Math.min(presetState.ceiling, value));
    setPresetState(prev => ({
      ...prev,
      maxTokens: clamped,
      preset: detectPreset(prev.promptTopK, clamped)
    }));
    
    // Sync to form state for main save button
    setForm(prev => ({
      ...prev,
      LLM_MAX_OUTPUT_TOKENS: clamped
    }));
  };

  const resetToPreset = () => {
    if (presetState.preset === 'Custom') return;
    applyPreset(presetState.preset);
  };

  const debouncedSavePresetSettings = async () => {
    if (saveTimeout) clearTimeout(saveTimeout);
    
    const timeout = setTimeout(async () => {
      try {
        const payload: any = {};
        const currentPromptTopK = data?.effective?.PROMPT_TOPK ?? 4;
        const currentMaxTokens = data?.effective?.LLM_MAX_OUTPUT_TOKENS ?? 500;
        
        if (presetState.promptTopK !== currentPromptTopK) {
          payload.PROMPT_TOPK = presetState.promptTopK;
        }
        if (presetState.maxTokens !== currentMaxTokens) {
          payload.LLM_MAX_OUTPUT_TOKENS = presetState.maxTokens;
        }
        
        if (Object.keys(payload).length > 0) {
          const response = await fetch('/api/admin/settings', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
          
          if (!response.ok) {
            const errorData = await response.json();
            console.error('Preset settings save failed:', errorData);
            return;
          }
          
          // Fire telemetry event
          if (typeof window !== 'undefined' && (window as any).gtag) {
            (window as any).gtag('event', 'settings.update', {
              preset: presetState.preset,
              prompt_topk: presetState.promptTopK,
              llm_max_tokens: presetState.maxTokens
            });
          }
          
          // No need to reload - we just saved these values and they're already in state
        }
      } catch (error) {
        console.error('Error saving preset settings:', error);
      }
    }, 400);
    
    setSaveTimeout(timeout);
  };

  // Handle preset selection
  function setPreset(category: keyof typeof PRESETS, presetKey: string) {
    if (presetKey === 'custom') return; // Don't change value for custom
    
    const value = getPresetValue(category, presetKey);
    const mapping: Record<keyof typeof PRESETS, keyof Eff> = {
      answerQuality: 'DOC_MIN_SCORE',
      answerDetail: 'RAG_TOPK',
      understandingFocus: 'DOC_VEC_W',
      typoTolerance: 'DOC_TRGM_W',
      widgetSecurity: 'REQUIRE_WIDGET_KEY'
    };
    
    const technicalKey = mapping[category];
    if (technicalKey) {
      set(technicalKey, value);
      
      // Auto-sync tokens when RAG_TOPK changes
      if (technicalKey === 'RAG_TOPK') {
        const correspondingTokens = getTokenLimitForRagTopK(value);
        set('LLM_MAX_OUTPUT_TOKENS', correspondingTokens);
      }
    }
  }

  // Reset to defaults - try Admin API first, fallback to UI defaults
  async function resetToDefaults() {
    // UI fallback defaults (used if Admin API call fails)
    const fallbackDefaults = {
      DOC_MIN_SCORE: 0.24,
      RAG_TOPK: 6,
      DOC_VEC_W: 0.6,
      DOC_TRGM_W: 0.4,
      PROMPT_TOPK: 4,
      LLM_MAX_OUTPUT_TOKENS: getTokenLimitForRagTopK(6),
      REQUIRE_WIDGET_KEY: 0
    };
    
    try {
      // Try to fetch environment defaults from Admin API
      const response = await fetch('/api/admin/settings', { cache: 'no-store' });
      if (response.ok) {
        const freshData = await response.json();
        
        // Use environment_defaults for reset (true system defaults)
        const defaults = freshData.environment_defaults || freshData.effective;
        const defaultTokens = getTokenLimitForRagTopK(defaults.RAG_TOPK);
        
        setForm({
          DOC_MIN_SCORE: defaults.DOC_MIN_SCORE,
          RAG_TOPK: defaults.RAG_TOPK,
          DOC_VEC_W: defaults.DOC_VEC_W,
          DOC_TRGM_W: defaults.DOC_TRGM_W,
          LLM_MAX_OUTPUT_TOKENS: defaults.LLM_MAX_OUTPUT_TOKENS ?? defaultTokens,
          PROMPT_TOPK: defaults.PROMPT_TOPK ?? 4,
          ...(supportsGate ? { REQUIRE_WIDGET_KEY: defaults.REQUIRE_WIDGET_KEY ?? 0 } : {})
        });
        
        // Also reset preset state to match
        setPresetState({
          promptTopK: defaults.PROMPT_TOPK ?? 4,
          maxTokens: defaults.LLM_MAX_OUTPUT_TOKENS ?? 500,
          preset: detectPreset(defaults.PROMPT_TOPK ?? 4, defaults.LLM_MAX_OUTPUT_TOKENS ?? 500),
          ceiling: defaults.LLM_MAX_OUTPUT_TOKENS_CEILING ?? 1200,
          supportsPromptTopK: defaults.PROMPT_TOPK !== undefined
        });
      } else {
        throw new Error('Admin API not available');
      }
    } catch (error) {
      console.warn('Failed to fetch defaults from Admin API, using fallback:', error);
      
      // Fallback to UI defaults
      setForm({
        ...fallbackDefaults,
        ...(supportsGate ? { REQUIRE_WIDGET_KEY: fallbackDefaults.REQUIRE_WIDGET_KEY } : {})
      });
      
      setPresetState({
        promptTopK: fallbackDefaults.PROMPT_TOPK,
        maxTokens: fallbackDefaults.LLM_MAX_OUTPUT_TOKENS,
        preset: 'Standard',
        ceiling: 1200,
        supportsPromptTopK: true
      });
    }
  }

  async function save() {
    setSaving(true); setErr(null);
    try {
      // Debug logging
      console.log('Save Debug - Form values:', {
        DOC_MIN_SCORE: form.DOC_MIN_SCORE,
        RAG_TOPK: form.RAG_TOPK,
        LLM_MAX_OUTPUT_TOKENS: form.LLM_MAX_OUTPUT_TOKENS,
        PROMPT_TOPK: form.PROMPT_TOPK
      });
      
      const r = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
        cache: 'no-store'
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      await load();
    } catch (e) {
      setErr(String(e));
    } finally {
      setSaving(false);
    }
  }

  async function rotate() {
    setErr(null);
    try {
      const r = await fetch('/api/admin/keys/rotate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind: 'widget' }),
        cache: 'no-store'
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const j = await r.json();
      setRot(j.key);
    } catch (e) {
      setErr(String(e));
    }
  }

  async function inviteUser() {
    if (!inviteEmail.trim()) {
      setErr('Please enter an email address');
      return;
    }

    // Client-side email validation
    const normalizedEmail = normalizeEmail(inviteEmail);
    if (!isEmailValid(normalizedEmail)) {
      setErr('Please check email format and try again.');
      return;
    }
    
    setInviting(true);
    setErr(null);
    setInviteSuccess(false);
    
    try {
      const r = await fetch('/api/admin/members/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: normalizedEmail, 
          role: inviteRole 
        }),
        cache: 'no-store'
      });
      
      if (!r.ok) {
        const errorData = await r.json();
        
        // Handle specific error codes
        if (errorData?.detail?.code === 'INVALID_EMAIL_FORMAT') {
          setErr('Please check email format and try again.');
        } else if (errorData?.detail?.code === 'INVITATION_PENDING') {
          setErr('An invitation is already active for this address.');
        } else if (errorData?.detail?.code === 'EMAIL_TAKEN') {
          setErr('This email already has access.');
        } else if (r.status === 409) {
          setErr('This email already has an account. Ask them to sign in directly.');
        } else {
          setErr('Please check email format and try again.');
        }
        return;
      }
      
      setInviteSuccess(true);
      setInviteEmail('');
      // Reset success message after 3 seconds
      setTimeout(() => setInviteSuccess(false), 3000);
      
    } catch (e) {
      setErr(String(e));
    } finally {
      setInviting(false);
    }
  }

  // User list functions
  async function fetchMembers() {
    setLoadingMembers(true);
    try {
      const response = await fetch('/api/admin/members', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store'
      });
      
      if (response.ok) {
        const data: MembersResponse = await response.json();
        setMembers(data.members || []);
      } else {
        toast.error('Failed to fetch members');
      }
    } catch (error) {
      toast.error('Failed to fetch members');
    } finally {
      setLoadingMembers(false);
    }
  }

  async function offboardUser(userId: string, userName: string) {
    if (!confirm(`Remove ${userName} from this workspace?`)) return;
    
    setOffboardingUsers(prev => new Set([...prev, userId]));
    try {
      const response = await fetch(`/api/admin/members/${userId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store'
      });
      
      if (response.ok) {
        const result = await response.json();
        toast.success(`User removed successfully. ${result.actions_taken?.join(', ') || ''}`);
        // Refresh members list
        await fetchMembers();
      } else {
        const errorData = await response.json();
        const errorMessage = getErrorMessage(errorData.error);
        toast.error(errorMessage);
      }
    } catch (error) {
      toast.error('Failed to remove user. Please try again.');
    } finally {
      setOffboardingUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    }
  }

  function getErrorMessage(errorCode: string): string {
    const messages: Record<string, string> = {
      'user_not_found_in_tenant': 'User not found in this workspace',
      'cannot_remove_self': 'You cannot remove yourself',
      'cannot_remove_last_owner': 'Cannot remove the last owner of the workspace',
      'invalid_user_id_format': 'Invalid user ID format',
      'offboarding_failed': 'Failed to remove user. Please try again.'
    };
    return messages[errorCode] || 'An error occurred while removing the user';
  }

  function canRemoveUser(user: Member): boolean {
    if (!currentUser) return false;
    
    // Only admin/owner can remove users
    if (!['admin', 'owner'].includes(currentUser.role)) return false;
    
    // Cannot remove yourself
    if (user.user_id === currentUser.id) return false;
    
    // Cannot remove last owner
    const ownerCount = members.filter(m => m.role === 'owner').length;
    if (user.role === 'owner' && ownerCount <= 1) return false;
    
    return true;
  }

  function getRoleBadgeColor(role: string): string {
    switch (role) {
      case 'owner': return 'bg-green-100 text-green-700';
      case 'admin': return 'bg-yellow-100 text-yellow-700';
      case 'curator': return 'bg-blue-100 text-blue-700';
      case 'viewer': return 'bg-slate-100 text-slate-600';
      default: return 'bg-gray-100 text-gray-700';
    }
  }

  // Load current user and members on component mount
  useEffect(() => {
    // Get current user info
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        setCurrentUser({ id: data.id, role: data.role });
      })
      .catch(() => {});
    
    // Load members list
    fetchMembers();
  }, []);

  if (!data) return <div className="p-6">Loading...</div>;

  return (
    <TooltipProvider>
      <div className="p-4 sm:p-6 max-w-4xl">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <Settings className="h-8 w-8 text-blue-600" />
          <h1 className="text-3xl font-bold">AI Assistant Settings</h1>
        </div>
        <p className="text-sm text-gray-600">
          Tenant: <Badge variant="outline">{data?.tenant_slug || data?.tenant_name || 'Loading...'}</Badge>
        </p>
      </div>
      
      {err && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          <strong>Error:</strong> {err}
        </div>
      )}

      {/* Main Settings Card */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            AI Assistant Configuration
          </CardTitle>
          <CardDescription>
            Configure how your AI Assistant responds to questions and handles different types of content.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          {/* Answer Quality Threshold */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Label htmlFor="answer-quality" className="text-base font-medium">
                Answer Quality Threshold
              </Label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-4 w-4 text-gray-400 cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Controls how picky the system is about answer quality. Higher values mean more precise answers but might result in 'I don't know' responses more often.</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:gap-4">
              <Select
                value={getPresetKey('answerQuality', form.DOC_MIN_SCORE ?? 0.15)}
                onChange={(e) => setPreset('answerQuality', e.target.value)}
                className="w-48"
              >
                <option value="low">Low (0.1)</option>
                <option value="medium">Medium (0.15)</option>
                <option value="high">High (0.3)</option>
                <option value="custom">Custom</option>
              </Select>
              {advancedMode && (
                <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:gap-2">
                  <Label className="text-sm text-gray-500">DOC_MIN_SCORE:</Label>
                  <Input
                    type="number"
                    min="0" max="1" step="0.01"
                    value={form.DOC_MIN_SCORE ?? ''}
                    onChange={(e) => set('DOC_MIN_SCORE', parseFloat(e.target.value))}
                    className="w-24"
                  />
                </div>
              )}
            </div>
            <p className="text-sm text-gray-600">
              {PRESETS.answerQuality[getPresetKey('answerQuality', form.DOC_MIN_SCORE ?? 0.15) as keyof typeof PRESETS.answerQuality]?.description || 'Custom value'}
            </p>
          </div>

          {/* Answer Detail Level */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Label htmlFor="answer-detail" className="text-base font-medium">
                Answer Detail Level
              </Label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-4 w-4 text-gray-400 cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>How much detail to include in responses. Higher values provide more comprehensive answers but may take longer to generate.</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:gap-4">
              <Select
                value={getPresetKey('answerDetail', form.RAG_TOPK ?? 6)}
                onChange={(e) => setPreset('answerDetail', e.target.value)}
                className="w-48"
              >
                <option value="concise">Concise (3)</option>
                <option value="balanced">Balanced (6)</option>
                <option value="comprehensive">Comprehensive (10)</option>
                <option value="custom">Custom</option>
              </Select>
              {advancedMode && (
                <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:gap-2">
                  <Label className="text-sm text-gray-500">RAG_TOPK:</Label>
                  <Input
                    type="number"
                    min="1" max="50" step="1"
                    value={form.RAG_TOPK ?? ''}
                    onChange={(e) => {
                      const newTopK = parseInt(e.target.value);
                      set('RAG_TOPK', newTopK);
                      // Auto-sync tokens when RAG_TOPK changes
                      const correspondingTokens = getTokenLimitForRagTopK(newTopK);
                      set('LLM_MAX_OUTPUT_TOKENS', correspondingTokens);
                    }}
                    className="w-24"
                  />
                </div>
              )}
            </div>
            <p className="text-sm text-gray-600">
              {PRESETS.answerDetail[getPresetKey('answerDetail', form.RAG_TOPK ?? 6) as keyof typeof PRESETS.answerDetail]?.description || 'Custom value'}
            </p>
          </div>

          {/* Understanding Focus */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Label htmlFor="understanding-focus" className="text-base font-medium">
                Understanding Focus
              </Label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-4 w-4 text-gray-400 cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Balance between exact word matching and understanding meaning. Higher values help with questions that use different wording than your documents.</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:gap-4">
              <Select
                value={getPresetKey('understandingFocus', form.DOC_VEC_W ?? 0.6)}
                onChange={(e) => setPreset('understandingFocus', e.target.value)}
                className="w-48"
              >
                <option value="keywordMatching">Keyword Matching (0.3)</option>
                <option value="balanced">Balanced (0.6)</option>
                <option value="meaningFocus">Meaning Focus (0.8)</option>
                <option value="custom">Custom</option>
              </Select>
              {advancedMode && (
                <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:gap-2">
                  <Label className="text-sm text-gray-500">DOC_VEC_W:</Label>
                  <Input
                    type="number"
                    min="0" max="1" step="0.01"
                    value={form.DOC_VEC_W ?? ''}
                    onChange={(e) => set('DOC_VEC_W', parseFloat(e.target.value))}
                    className="w-24"
                  />
                </div>
              )}
            </div>
            <p className="text-sm text-gray-600">
              {PRESETS.understandingFocus[getPresetKey('understandingFocus', form.DOC_VEC_W ?? 0.6) as keyof typeof PRESETS.understandingFocus]?.description || 'Custom value'}
            </p>
          </div>

          {/* Typo Tolerance */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Label htmlFor="typo-tolerance" className="text-base font-medium">
                Typo Tolerance
              </Label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-4 w-4 text-gray-400 cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>How forgiving the system is with spelling mistakes and word variations. Higher values help users who make typos.</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:gap-4">
              <Select
                value={getPresetKey('typoTolerance', form.DOC_TRGM_W ?? 0.4)}
                onChange={(e) => setPreset('typoTolerance', e.target.value)}
                className="w-48"
              >
                <option value="strict">Strict (0.2)</option>
                <option value="medium">Medium (0.4)</option>
                <option value="flexible">Flexible (0.6)</option>
                <option value="custom">Custom</option>
              </Select>
              {advancedMode && (
                <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:gap-2">
                  <Label className="text-sm text-gray-500">DOC_TRGM_W:</Label>
                  <Input
                    type="number"
                    min="0" max="1" step="0.01"
                    value={form.DOC_TRGM_W ?? ''}
                    onChange={(e) => set('DOC_TRGM_W', parseFloat(e.target.value))}
                    className="w-24"
                  />
                </div>
              )}
            </div>
            <p className="text-sm text-gray-600">
              {PRESETS.typoTolerance[getPresetKey('typoTolerance', form.DOC_TRGM_W ?? 0.4) as keyof typeof PRESETS.typoTolerance]?.description || 'Custom value'}
            </p>
          </div>

          {/* Widget Security */}
          {supportsGate && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Label htmlFor="widget-security" className="text-base font-medium">
                  Widget Security
                </Label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-4 w-4 text-gray-400 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Whether the public chatbot requires a password to use. Enable for security, disable for easy access.</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:gap-4">
                <Select
                  value={getPresetKey('widgetSecurity', form.REQUIRE_WIDGET_KEY ?? 0)}
                  onChange={(e) => setPreset('widgetSecurity', e.target.value)}
                  className="w-48"
                >
                  <option value="openAccess">Open Access</option>
                  <option value="keyRequired">Key Required</option>
                </Select>
                {advancedMode && (
                  <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:gap-2">
                    <Label className="text-sm text-gray-500">REQUIRE_WIDGET_KEY:</Label>
                    <Select
                      value={form.REQUIRE_WIDGET_KEY ?? 0}
                      onChange={(e) => set('REQUIRE_WIDGET_KEY', parseInt(e.target.value))}
                      className="w-full sm:w-24"
                    >
                      <option value="0">Disabled</option>
                      <option value="1">Enabled</option>
                    </Select>
                  </div>
                )}
              </div>
              <p className="text-sm text-gray-600">
                {PRESETS.widgetSecurity[getPresetKey('widgetSecurity', form.REQUIRE_WIDGET_KEY ?? 0) as keyof typeof PRESETS.widgetSecurity]?.description}
              </p>
            </div>
          )}

          {/* AI Response Configuration */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Label className="text-base font-medium">
                AI Response Configuration
              </Label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-4 w-4 text-gray-400 cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Configure how comprehensive AI responses are. Presets set both answer length and source count automatically.</p>
                </TooltipContent>
              </Tooltip>
            </div>
            
            {/* Preset Dropdown */}
            <div className="space-y-2">
              <Label htmlFor="preset" className="text-sm font-medium">Response Style</Label>
              <Select
                value={presetState.preset}
                onChange={(e) => applyPreset(e.target.value as PresetKey)}
                className="w-48"
              >
                <option value="Concise">Concise</option>
                <option value="Standard">Standard</option>
                <option value="Detailed">Detailed</option>
                <option value="Comprehensive">Comprehensive</option>
                <option value="Custom">Custom</option>
              </Select>
              {presetState.preset === 'Custom' && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={resetToPreset}
                    className="text-xs text-blue-600 hover:text-blue-700 underline"
                  >
                    Reset to preset
                  </button>
                </div>
              )}
            </div>

            {/* Sliders */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Max Answer Length */}
              <div className="space-y-3">
                <Label htmlFor="max-tokens" className="text-sm font-medium">
                  Max Answer Length
                </Label>
                <div className="space-y-2">
                  <input
                    type="range"
                    min="100"
                    max={presetState.ceiling}
                    step="50"
                    value={presetState.maxTokens}
                    onChange={(e) => updateMaxTokens(parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>100</span>
                    <span className="font-medium">{presetState.maxTokens}</span>
                    <span>{presetState.ceiling}</span>
                  </div>
                </div>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <p className="text-xs text-gray-600 cursor-help">
                      Upper limit on tokens generated
                    </p>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Controls how long AI responses can be. Higher values allow more detailed answers.</p>
                  </TooltipContent>
                </Tooltip>
              </div>

              {/* Sources in Prompt */}
              {presetState.supportsPromptTopK && (
                <div className="space-y-3">
                  <Label htmlFor="prompt-topk" className="text-sm font-medium">
                    Sources in Prompt
                  </Label>
                  <div className="space-y-2">
                    <input
                      type="range"
                      min="1"
                      max="12"
                      step="1"
                      value={presetState.promptTopK}
                      onChange={(e) => updatePromptTopK(parseInt(e.target.value))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>1</span>
                      <span className="font-medium">{presetState.promptTopK}</span>
                      <span>12</span>
                    </div>
                  </div>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <p className="text-xs text-gray-600 cursor-help">
                        Number of document chunks included in the prompt
                      </p>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>More sources provide richer context but increase processing time.</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              )}
            </div>

            {/* Linked Controls Badge */}
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span>🔗</span>
              <span>Linked controls. Editing flips to Custom.</span>
            </div>
          </div>

          {/* Advanced Mode Toggle */}
          <div className="pt-4 border-t">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="advanced-mode"
                checked={advancedMode}
                onChange={(e) => setAdvancedMode(e.target.checked)}
                className="rounded"
              />
              <Label htmlFor="advanced-mode" className="text-sm font-medium">
                Show Advanced Settings
              </Label>
            </div>
            <p className="text-xs text-gray-500 mt-1 break-words">
              Display technical parameter names and allow custom value input
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-3 pt-4 sm:flex-row sm:gap-3">
            <Button
              onClick={save}
              disabled={saving}
              className="flex items-center gap-2"
            >
              {saving ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Saving...
                </>
              ) : (
                <>
                  <Settings className="h-4 w-4" />
                  Save Settings
                </>
              )}
            </Button>
            
            <Button
              onClick={resetToDefaults}
              variant="outline"
              className="flex items-center gap-2"
            >
              Reset to Defaults
            </Button>
            
            <Button
              onClick={rotate}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Key className="h-4 w-4" />
              Rotate Widget Key
            </Button>
          </div>

          {/* Generated Key Display */}
          {rot && (
            <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Key className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-green-700">One-time Widget Key Generated</span>
              </div>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-sm bg-white px-3 py-2 border rounded font-mono">{rot}</code>
                <Button
                  onClick={async () => { await navigator.clipboard.writeText(rot!); }}
                  variant="outline"
                  size="sm"
                >
                  Copy
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                This key will only be shown once. Copy it now if you need it.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Current Members Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Current Members ({members.length})
          </CardTitle>
          <CardDescription>
            Manage existing team members and their access levels.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingMembers ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-slate-600">Loading members...</span>
            </div>
          ) : members.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              No members found. Invite your first team member below.
            </div>
          ) : (
            <div className="space-y-3">
              {members.map((member) => (
                <div key={member.user_id} className="flex flex-col gap-3 p-4 border border-slate-200 rounded-lg hover:bg-slate-50 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center">
                        <UserX className="h-4 w-4 text-slate-600" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-slate-900 truncate">
                          {member.name || member.email}
                        </span>
                        <Badge className={`text-xs ${getRoleBadgeColor(member.role)}`}>
                          {member.role}
                        </Badge>
                      </div>
                      <div className="text-sm text-slate-500 truncate">
                        {member.email}
                      </div>
                      <div className="text-xs text-slate-400">
                        Joined {new Date(member.accepted_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    {canRemoveUser(member) ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => offboardUser(member.user_id, member.name || member.email)}
                        disabled={offboardingUsers.has(member.user_id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                      >
                        {offboardingUsers.has(member.user_id) ? (
                          <>
                            <div className="h-3 w-3 animate-spin rounded-full border border-red-600 border-t-transparent mr-1" />
                            Removing...
                          </>
                        ) : (
                          <>
                            <Trash2 className="h-3 w-3 mr-1" />
                            Remove
                          </>
                        )}
                      </Button>
                    ) : (
                      <div className="text-xs text-slate-400 px-2 py-1">
                        {member.user_id === currentUser?.id ? 'You' : 'Protected'}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* User Management Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            User Management (Live now)
          </CardTitle>
          <CardDescription>
            Invite new users to your tenant with appropriate access levels.
          </CardDescription>
        </CardHeader>

        <CardContent>
          {/* Wrap in a form so Enter works and button can be type="submit" */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!inviting && inviteEmail.trim()) {
                // Clear any existing errors when user submits
                setErr('');
                inviteUser();
              }
            }}
            className="space-y-4"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              {/* Email */}
              <div className="flex-1">
                <label htmlFor="invite-email" className="sr-only">Email address</label>
                <Input
                  id="invite-email"
                  name="inviteEmail"
                  type="email"
                  autoComplete="email"
                  inputMode="email"
                  enterKeyHint="send"
                  placeholder="Enter email address"
                  value={inviteEmail}
                  onChange={(e) => {
                    setInviteEmail(e.target.value);
                    // Clear error when user starts typing
                    if (err) setErr('');
                  }}
                  className="h-9 w-full"
                  aria-invalid={!!err}
                  aria-describedby={err ? "email-error" : undefined}
                  required
                />
              </div>

              {/* Role + Button */}
              <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                <div>
                  <label htmlFor="invite-role" className="sr-only">Role</label>
                  <select
                    id="invite-role"
                    name="inviteRole"
                    value={inviteRole}
                    onChange={(e) => {
                      const v = e.target.value;
                      if (v === 'admin' || v === 'curator' || v === 'viewer') {
                        setInviteRole(v);
                      }
                    }}
                    className="h-9 w-full rounded-md border border-gray-300 bg-white px-3 py-1 text-sm shadow-sm
                               focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                               disabled:cursor-not-allowed disabled:opacity-50 sm:w-32"
                    aria-label="Select user role"
                  >
                    <option value="admin">Admin</option>
                    <option value="curator">Curator</option>
                    <option value="viewer">Viewer</option>
                  </select>
                </div>

                <Button
                  type="submit"
                  disabled={inviting || !inviteEmail.trim() || !isEmailValid(normalizeEmail(inviteEmail))}
                  className="h-9 w-full whitespace-nowrap sm:w-auto"
                  aria-busy={inviting ? true : undefined}
                >
                  {inviting ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2" />
                      Inviting...
                    </>
                  ) : (
                    <>
                      <Users className="h-4 w-4 mr-2" />
                      Invite
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Status messages with screen-reader friendly live regions */}
            {inviteSuccess && (
              <div role="status" aria-live="polite"
                   className="rounded-lg border border-green-200 bg-green-50 p-3 text-green-700">
                ✓ User invitation sent successfully!
              </div>
            )}
            {err && (
              <div id="email-error" role="alert" aria-live="assertive"
                   className="rounded-lg border border-red-200 bg-red-50 p-3 text-red-700">
                ⚠️ {err}
              </div>
            )}
          </form>
        </CardContent>
      </Card>
      </div>
    </TooltipProvider>
  );
}
