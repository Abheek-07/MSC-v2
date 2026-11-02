/**
 * Client-safe HTML escaping and sanitization utilities.
 * Pure string operations with zero Node.js built-in dependencies.
 */

/**
 * HTML entities escape helper to prevent stored & reflected XSS
 */
export function escapeHtml(value: unknown): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  return str.replace(/[&<>"']/g, (match) => {
    switch (match) {
      case '&': return '&amp;';
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '"': return '&quot;';
      case "'": return '&#39;';
      default: return match;
    }
  });
}

/**
 * Sanitize certificate HTML templates.
 * Strips script tags, iframes, objects, forms, on* event handlers, and dangerous URIs.
 */
export function sanitizeCertificateHtml(html: string): string {
  if (!html || typeof html !== 'string') return '';

  let sanitized = html;
  // 1. Remove dangerous tags and their contents
  sanitized = sanitized.replace(/<\s*(script|iframe|object|embed|applet|form|input|button|base|link|meta)\b[^>]*>.*?<\s*\/\s*\1\s*>/gis, '');
  sanitized = sanitized.replace(/<\s*(script|iframe|object|embed|applet|form|input|button|base|link|meta)\b[^>]*\/?>/gis, '');

  // 2. Remove all inline event handlers (on* attributes like onclick, onload, onerror, etc.)
  sanitized = sanitized.replace(/\s*on[a-zA-Z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gis, '');

  // 3. Remove dangerous protocols in attributes (javascript:, vbscript:, data:text/html, etc.)
  sanitized = sanitized.replace(/(href|src|action|data)\s*=\s*(?:"\s*(?:javascript|vbscript|data:(?!image\/(?:png|jpe?g|webp|gif)))[^"]*"|'\s*(?:javascript|vbscript|data:(?!image\/(?:png|jpe?g|webp|gif)))[^']*'|[^\s>]*(?:javascript|vbscript):[^\s>]*)/gis, '$1="#"');

  return sanitized;
}

