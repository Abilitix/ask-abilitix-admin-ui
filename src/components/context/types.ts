// Context Management TypeScript Types

export type ContextSettings = {
  enable: boolean;
  profile: {
    value_prop: string;        // ≤ 200 chars
    offerings: string[];        // ≤ 10 items, each ≤ 80 chars
    industry: string;           // ≤ 100 chars
    tone: string;              // ≤ 200 chars
  };
  glossary: Array<{             // ≤ 50 entries
    term: string;               // ≤ 40 chars
    meaning: string;            // ≤ 160 chars
  }>;
  policy: {
    must: string[];            // ≤ 10 items, ≤ 160 chars each
    never: string[];           // ≤ 10 items, ≤ 160 chars each
  };
  routing: {
    boost_profile_in_about_intent: boolean;
  };
};

export type ContextSettingsResponse = {
  effective: Record<string, any>;
  overrides: {
    ctx?: ContextSettings;
  };
  environment_defaults?: Record<string, any>;
};

export type PreviewResponse = {
  bundle: {
    text: string;
    meta: {
      tokens: number;
      intents: string[];
      applied: boolean;
      cache_hit: boolean;
    };
  };
  flags: {
    CTX_ENABLE: boolean;
    CTX_TOKEN_BUDGET: number;
  };
  settings: {
    ctx: ContextSettings;
  };
};

export const DEFAULT_CTX: ContextSettings = {
  enable: false,
  profile: {
    value_prop: '',
    offerings: [],
    industry: '',
    tone: 'Concise, cited, no hype',
  },
  glossary: [],
  policy: {
    must: [],
    never: [],
  },
  routing: {
    boost_profile_in_about_intent: false,
  },
};

// Error code mapping
export function getContextErrorMessage(errorCode: string): string {
  const errorMap: Record<string, string> = {
    'invalid_ctx.profile.value_prop_too_long': 'Value proposition must be 200 characters or less',
    'invalid_ctx.profile.offerings_too_many': 'Maximum 10 offerings allowed',
    'invalid_ctx.profile.offerings_item_too_long': 'Each offering must be 80 characters or less',
    'invalid_ctx.profile.industry_too_long': 'Industry must be 100 characters or less',
    'invalid_ctx.profile.tone_too_long': 'Tone must be 200 characters or less',
    'invalid_ctx.glossary_too_many': 'Maximum 50 glossary entries allowed',
    'invalid_ctx.glossary.term_too_long': 'Term must be 40 characters or less',
    'invalid_ctx.glossary.meaning_too_long': 'Meaning must be 160 characters or less',
    'invalid_ctx.policy.must_too_many': 'Maximum 10 "must" rules allowed',
    'invalid_ctx.policy.must_item_too_long': 'Each "must" rule must be 160 characters or less',
    'invalid_ctx.policy.never_too_many': 'Maximum 10 "never" rules allowed',
    'invalid_ctx.policy.never_item_too_long': 'Each "never" rule must be 160 characters or less',
  };
  
  return errorMap[errorCode] || `Validation error: ${errorCode}`;
}

