const SAFE_TEXT_REGEX = /[^\p{L}\p{N}\p{P}\p{Zs}]/gu;

function sanitizeUsername(value) {
  if (typeof value !== 'string') return '';
  const trimmed = value.trim().replace(/\s+/g, ' ');
  if (!trimmed) return '';
  return trimmed.slice(0, 24);
}

function sanitizeItemContent(value) {
  if (typeof value !== 'string') return '';
  const collapsed = value.replace(/\s+/g, ' ').trim();
  if (!collapsed) return '';
  if (collapsed.length > 280) {
    return collapsed.slice(0, 280);
  }
  return collapsed;
}

function ensureSafeText(value) {
  if (!value) return '';
  return value.replace(SAFE_TEXT_REGEX, '');
}

function readAuthToken(headerValue) {
  if (!headerValue || typeof headerValue !== 'string') return null;
  if (headerValue.startsWith('Bearer ')) {
    return headerValue.slice(7).trim();
  }
  return headerValue.trim();
}

module.exports = {
  sanitizeUsername,
  sanitizeItemContent,
  ensureSafeText,
  readAuthToken,
};

