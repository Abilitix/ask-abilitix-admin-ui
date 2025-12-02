/**
 * Standardized response parsing utilities for API responses.
 * 
 * Provides consistent response parsing and validation
 * across all Admin UI API calls.
 * 
 * @module lib/api/responseParser
 */

/**
 * Safely parses a JSON response, handling empty bodies and parse errors.
 * 
 * @param response - Fetch Response object
 * @returns Parsed JSON data, or null if response is empty or invalid
 * 
 * @example
 * ```typescript
 * const response = await fetch('/api/admin/docs');
 * const data = await safeParseJson(response);
 * if (data) {
 *   // Use data
 * }
 * ```
 */
export async function safeParseJson<T = any>(response: Response): Promise<T | null> {
  const contentType = response.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');

  if (!isJson) {
    return null;
  }

  const text = await response.text().catch(() => '');
  if (!text || text.trim().length === 0) {
    return null;
  }

  try {
    return JSON.parse(text) as T;
  } catch (err) {
    console.error('Failed to parse JSON response:', err);
    return null;
  }
}

/**
 * Validates that a response contains the expected data structure.
 * 
 * @param data - Parsed response data
 * @param validator - Function that validates the data structure
 * @returns True if data is valid, false otherwise
 * 
 * @example
 * ```typescript
 * const isValid = validateResponse(data, (d) => 
 *   Array.isArray(d?.items) && typeof d?.total === 'number'
 * );
 * ```
 */
export function validateResponse<T>(
  data: unknown,
  validator: (data: unknown) => data is T
): data is T {
  return validator(data);
}
