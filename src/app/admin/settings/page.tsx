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

type Eff = { DOC_MIN_SCORE:number; RAG_TOPK:number; DOC_VEC_W:number; DOC_TRGM_W:number; REQUIRE_WIDGET_KEY?: number; };
type SettingsResp = { effective: Eff; overrides: Partial<Eff>; tenant_id?: string; tenant_slug?: string; tenant_name?: string; };

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
    setForm({
      DOC_MIN_SCORE: j.effective.DOC_MIN_SCORE,
      RAG_TOPK: j.effective.RAG_TOPK,
      DOC_VEC_W: j.effective.DOC_VEC_W,
      DOC_TRGM_W: j.effective.DOC_TRGM_W,
      ...(supportsGate ? { REQUIRE_WIDGET_KEY: j.effective.REQUIRE_WIDGET_KEY ?? 0 } : {})
    });
  }

  useEffect(() => { load(); /* eslint-disable-line react-hooks/exhaustive-deps */ }, []);

  function set<K extends keyof Eff>(k:K, v:any){ setForm(p => ({...p, [k]: v})); }

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
    }
  }

  // Reset to defaults
  function resetToDefaults() {
    setForm({
      DOC_MIN_SCORE: 0.15,
      RAG_TOPK: 6,
      DOC_VEC_W: 0.6,
      DOC_TRGM_W: 0.4,
      ...(supportsGate ? { REQUIRE_WIDGET_KEY: 0 } : {})
    });
  }

  async function save() {
    setSaving(true); setErr(null);
    try {
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
    
    setInviting(true);
    setErr(null);
    setInviteSuccess(false);
    
    try {
      const r = await fetch('/api/admin/members/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: inviteEmail.trim(), 
          role: inviteRole 
        }),
        cache: 'no-store'
      });
      
      if (!r.ok) {
        const errorData = await r.json();
        if (r.status === 409) {
          throw new Error(errorData.error || 'This email already has an account. Ask them to sign in directly.');
        }
        throw new Error(errorData.error || `HTTP ${r.status}`);
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
      <div className="p-6 max-w-4xl">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <Settings className="h-8 w-8 text-blue-600" />
          <h1 className="text-3xl font-bold">Chatbot Settings</h1>
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
            Chatbot Configuration
          </CardTitle>
          <CardDescription>
            Configure how your chatbot responds to questions and handles different types of content.
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
            <div className="flex items-center gap-4">
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
                <div className="flex items-center gap-2">
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
            <div className="flex items-center gap-4">
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
                <div className="flex items-center gap-2">
                  <Label className="text-sm text-gray-500">RAG_TOPK:</Label>
                  <Input
                    type="number"
                    min="1" max="50" step="1"
                    value={form.RAG_TOPK ?? ''}
                    onChange={(e) => set('RAG_TOPK', parseInt(e.target.value))}
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
            <div className="flex items-center gap-4">
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
                <div className="flex items-center gap-2">
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
            <div className="flex items-center gap-4">
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
                <div className="flex items-center gap-2">
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
              <div className="flex items-center gap-4">
                <Select
                  value={getPresetKey('widgetSecurity', form.REQUIRE_WIDGET_KEY ?? 0)}
                  onChange={(e) => setPreset('widgetSecurity', e.target.value)}
                  className="w-48"
                >
                  <option value="openAccess">Open Access</option>
                  <option value="keyRequired">Key Required</option>
                </Select>
                {advancedMode && (
                  <div className="flex items-center gap-2">
                    <Label className="text-sm text-gray-500">REQUIRE_WIDGET_KEY:</Label>
                    <Select
                      value={form.REQUIRE_WIDGET_KEY ?? 0}
                      onChange={(e) => set('REQUIRE_WIDGET_KEY', parseInt(e.target.value))}
                      className="w-24"
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
            <p className="text-xs text-gray-500 mt-1">
              Display technical parameter names and allow custom value input
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
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
                <div key={member.user_id} className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:bg-slate-50">
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
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input
                type="email"
                placeholder="Enter email address"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="flex-1"
              />
              <Select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as 'admin' | 'curator' | 'viewer')}
                className="w-32"
              >
                <option value="admin">Admin</option>
                <option value="curator">Curator</option>
                <option value="viewer">Viewer</option>
              </Select>
              <Button
                onClick={inviteUser}
                disabled={inviting || !inviteEmail.trim()}
                className="flex items-center gap-2"
              >
                {inviting ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Inviting...
                  </>
                ) : (
                  <>
                    <Users className="h-4 w-4" />
                    Invite
                  </>
                )}
              </Button>
            </div>
            
            {inviteSuccess && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700">
                ✓ User invitation sent successfully!
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      </div>
    </TooltipProvider>
  );
}
