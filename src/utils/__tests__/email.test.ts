/**
 * Email validation utility tests
 * Tests the isEmailValid and normalizeEmail functions
 */

import { isEmailValid, normalizeEmail } from '../email';

describe('Email Validation', () => {
  describe('isEmailValid', () => {
    test('valid emails should return true', () => {
      const validEmails = [
        'user@example.com',
        'test.user@domain.co.uk',
        'user+tag@example.org',
        'user123@test-domain.com',
        'admin@company.co.au',
        'a@b.co',
        'very.long.email.address@very.long.domain.name.com'
      ];

      validEmails.forEach(email => {
        expect(isEmailValid(email)).toBe(true);
      });
    });

    test('invalid emails should return false', () => {
      const invalidEmails = [
        'invalid-email',                    // No @ symbol
        'user@',                           // Missing domain
        '@domain.com',                     // Missing local part
        'user@domain',                     // Missing TLD
        'user space@domain.com',           // Space in email
        'user@domain..com',               // Double dots
        'admin@company.co',                // Incomplete TLD
        '',                                // Empty string
        'a'.repeat(255) + '@domain.com',  // Too long
        'user@domain.c',                  // Single character TLD
        'user@@domain.com',               // Double @
        'user@domain@com',                // Multiple @
        '.user@domain.com',               // Leading dot
        'user.@domain.com',                // Trailing dot
        'user@.domain.com',                // Leading dot in domain
        'user@domain.com.',               // Trailing dot in domain
      ];

      invalidEmails.forEach(email => {
        expect(isEmailValid(email)).toBe(false);
      });
    });

    test('edge cases should be handled correctly', () => {
      expect(isEmailValid('')).toBe(false);
      expect(isEmailValid('   ')).toBe(false);
      expect(isEmailValid('user@domain.com   ')).toBe(true); // Should handle whitespace
    });
  });

  describe('normalizeEmail', () => {
    test('should trim whitespace and convert to lowercase', () => {
      expect(normalizeEmail('  USER@EXAMPLE.COM  ')).toBe('user@example.com');
      expect(normalizeEmail('Test.User@Domain.Co.UK')).toBe('test.user@domain.co.uk');
      expect(normalizeEmail('  admin@company.com  ')).toBe('admin@company.com');
    });

    test('should handle empty strings', () => {
      expect(normalizeEmail('')).toBe('');
      expect(normalizeEmail('   ')).toBe('');
    });
  });

  describe('integration tests', () => {
    test('normalized emails should be valid', () => {
      const testEmails = [
        '  USER@EXAMPLE.COM  ',
        'Test.User@Domain.Co.UK',
        '  admin@company.com  '
      ];

      testEmails.forEach(email => {
        const normalized = normalizeEmail(email);
        expect(isEmailValid(normalized)).toBe(true);
      });
    });
  });
});
