/**
 * Feature checking utilities
 * Works with features exposed in /auth/me response
 */

export type UserFeatures = Record<string, boolean>;

/**
 * Check if user has a specific feature
 */
export function hasFeature(features: UserFeatures | undefined, feature: string): boolean {
  if (!features) return false;
  return features[feature] === true;
}

/**
 * Check if user requires upgrade for a feature
 */
export function requiresUpgrade(features: UserFeatures | undefined, feature: string): boolean {
  return !hasFeature(features, feature);
}

/**
 * Get all Knowledge Studio related features
 */
export function getKnowledgeStudioFeatures(features: UserFeatures | undefined): UserFeatures {
  if (!features) return {};
  
  const knowledgeFeatures = [
    'knowledge_studio',
    'templates_recruiter',
    'templates_legal',
    'shortlist_matching',
    'knowledge.send_email',
  ];
  
  return Object.fromEntries(
    Object.entries(features).filter(([key]) => knowledgeFeatures.includes(key))
  );
}

/**
 * Check if user has base Knowledge Studio access
 */
export function hasKnowledgeStudio(features: UserFeatures | undefined): boolean {
  return hasFeature(features, 'knowledge_studio');
}

/**
 * Check if user can access recruiter templates
 */
export function hasRecruiterTemplates(features: UserFeatures | undefined): boolean {
  return hasFeature(features, 'templates_recruiter');
}

/**
 * Check if user can access legal templates
 */
export function hasLegalTemplates(features: UserFeatures | undefined): boolean {
  return hasFeature(features, 'templates_legal');
}

/**
 * Check if user can send emails
 */
export function canSendEmail(features: UserFeatures | undefined): boolean {
  return hasFeature(features, 'knowledge.send_email');
}

