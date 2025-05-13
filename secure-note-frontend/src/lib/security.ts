/**
 * Security utility functions to prevent XSS attacks
 */

/**
 * Sanitizes a string to prevent XSS attacks by escaping HTML tags and characters
 */
export function sanitizeString(input: string | null | undefined): string {
  if (input == null) {
    return '';
  }
  
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Creates a sanitized dangerouslySetInnerHTML object for React
 * Only use this when you need to render HTML content
 * Always sanitize the input first
 */
export function createSanitizedHTML(html: string): { __html: string } {
  return { __html: sanitizeString(html) };
}

/**
 * Validates that a URL is safe (not javascript: or data: protocol)
 */
export function isSafeUrl(url: string): boolean {
  try {
    const parsedUrl = new URL(url);
    return ['http:', 'https:'].includes(parsedUrl.protocol);
  } catch (e) {
    // If URL parsing fails, check if it's a relative URL (doesn't contain :)
    return !url.includes(':');
  }
}

/**
 * Returns a safe URL or a default URL if the provided one is unsafe
 */
export function getSafeUrl(url: string, defaultUrl: string = '/'): string {
  return isSafeUrl(url) ? url : defaultUrl;
}

/**
 * Performs basic validation of user input
 */
export function isValidInput(input: string, maxLength: number = 1000): boolean {
  // Check if input is not too long
  if (input.length > maxLength) {
    return false;
  }
  
  // Check for potentially malicious patterns
  const suspiciousPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, // Script tags
    /javascript:/gi, // JavaScript protocol
    /on\w+=/gi, // Event handlers
    /data:/gi, // Data URLs that could contain executable code
  ];
  
  return !suspiciousPatterns.some(pattern => pattern.test(input));
} 