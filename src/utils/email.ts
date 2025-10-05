/**
 * Email validation utilities
 * Provides client-side email format validation to match server-side validation
 */

const EMAIL_RX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Validates email format using regex and length constraints
 * Matches server-side validation logic
 * 
 * @param raw - Raw email string to validate
 * @returns true if email format is valid, false otherwise
 */
export const isEmailValid = (raw: string): boolean => {
  if (!raw) return false;
  
  const email = raw.trim();
  
  // Check length constraint (RFC 5321 limit)
  if (email.length > 254) return false;
  
  // Check basic format with regex
  return EMAIL_RX.test(email);
};

/**
 * Normalizes email to lowercase and trims whitespace
 * Matches server-side normalization
 * 
 * @param email - Email string to normalize
 * @returns Normalized email string
 */
export const normalizeEmail = (email: string): string => {
  return email.trim().toLowerCase();
};
