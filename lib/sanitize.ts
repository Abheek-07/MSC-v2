/**
 * Certificate templates are administrator-supplied HTML, not trusted markup.
 * `sanitize-html` parses first, so entities and malformed HTML are normalised
 * before its attribute and URL policies are applied.
 */
import sanitizeHtml from 'sanitize-html';

export function escapeHtml(value: unknown): string {
  if (value === null || value === undefined) return '';
  return String(value).replace(/[&<>"']/g, (match) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[match] || match);
}

const CERTIFICATE_TAGS = [
  'div', 'span', 'p', 'br', 'hr', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'strong', 'b', 'em', 'i', 'small', 'sup', 'sub', 'ul', 'ol', 'li',
  'table', 'thead', 'tbody', 'tr', 'th', 'td', 'img', 'a',
];

const SAFE_STYLE_PROPERTIES = [
  'background', 'background-color', 'border', 'border-bottom', 'border-top',
  'border-left', 'border-right', 'border-radius', 'box-shadow', 'box-sizing',
  'color', 'display', 'font-family', 'font-size', 'font-weight', 'font-style',
  'height', 'width', 'max-width', 'min-width', 'min-height', 'margin',
  'margin-top', 'margin-right', 'margin-bottom', 'margin-left', 'padding',
  'padding-top', 'padding-right', 'padding-bottom', 'padding-left', 'position',
  'top', 'right', 'bottom', 'left', 'text-align', 'text-transform',
  'text-decoration', 'letter-spacing', 'line-height', 'vertical-align',
  'align-items', 'justify-content', 'flex-direction', 'flex-wrap', 'gap',
  'grid-template-columns', 'grid-template-rows', 'overflow', 'opacity',
];

/**
 * Preserves the certificate designer primitives while rejecting executable
 * markup. SVG is intentionally not allowed: it is not needed by templates
 * and has an unusually broad executable surface.
 */
export function sanitizeCertificateHtml(html: unknown): string {
  if (typeof html !== 'string' || !html) return '';

  return sanitizeHtml(html, {
    allowedTags: CERTIFICATE_TAGS,
    allowedAttributes: {
      '*': ['style', 'class', 'title', 'role', 'aria-label'],
      a: ['href', 'target', 'rel'],
      img: ['src', 'alt', 'width', 'height'],
      td: ['colspan', 'rowspan'],
      th: ['colspan', 'rowspan'],
    },
    allowedSchemes: ['http', 'https', 'mailto'],
    allowedSchemesByTag: { img: ['http', 'https'], a: ['http', 'https', 'mailto'] },
    allowedStyles: {
      '*': Object.fromEntries(SAFE_STYLE_PROPERTIES.map((property) => [
        property,
        [/^(?!.*(?:url\s*\(|expression\s*\(|@import|behavior\s*:|javascript:|vbscript:|data:))[#(),.%\-\s\w'"/]+$/i],
      ])),
    },
    transformTags: {
      a: sanitizeHtml.simpleTransform('a', { rel: 'noopener noreferrer' }, true),
    },
    disallowedTagsMode: 'discard',
    enforceHtmlBoundary: true,
    parser: { lowerCaseAttributeNames: true },
  });
}

