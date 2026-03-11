// Pure Node.js HTML sanitizer - no browser dependencies needed
// Strips dangerous tags/attributes without dompurify/jsdom

const ALLOWED_TAGS = new Set([
  'p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'ul', 'ol', 'li', 'blockquote', 'pre', 'code', 'a', 'span', 'div',
  'table', 'thead', 'tbody', 'tr', 'th', 'td', 'hr', 'img', 's', 'strike',
]);

const ALLOWED_ATTRS = new Set([
  'href', 'target', 'rel', 'class', 'src', 'alt', 'style',
]);

const DANGEROUS_PROTOCOLS = /^(javascript|data|vbscript|file):/i;

const sanitizeHtml = (dirty) => {
  if (!dirty || typeof dirty !== 'string') return '';

  // Remove script tags and their content entirely
  let clean = dirty.replace(/<script[\s\S]*?<\/script>/gi, '');

  // Remove event handlers (onclick, onload, etc.)
  clean = clean.replace(/\s+on\w+\s*=\s*(['"])[^'"]*\1/gi, '');
  clean = clean.replace(/\s+on\w+\s*=\s*[^\s>]*/gi, '');

  // Remove dangerous href/src protocols
  clean = clean.replace(/(href|src)\s*=\s*(['"])(javascript|data|vbscript)[^'"]*\2/gi, '');

  // Remove style attributes with expressions
  clean = clean.replace(/style\s*=\s*(['"])[^'"]*expression[^'"]*\1/gi, '');

  // Remove iframe, object, embed, form tags
  clean = clean.replace(/<(iframe|object|embed|form|input|button|select|textarea)[^>]*>[\s\S]*?<\/\1>/gi, '');
  clean = clean.replace(/<(iframe|object|embed|form|input|button|select|textarea)[^>]*\/?>/gi, '');

  return clean;
};

module.exports = { sanitizeHtml };
