/**
 * Safe handling of the `returnTo` query param used by the Connect page.
 *
 * Only internal, allowlisted app routes are accepted so the param can never be
 * used as an open redirect (external URLs, protocol-relative `//host`,
 * `javascript:` URIs, etc. are all rejected).
 */
export const RETURN_TO_ALLOWLIST = [
  '/',
  '/dashboard',
  '/leaderboard',
  '/learn',
  '/pools',
  '/tournament',
  '/profile',
  '/settings',
] as const;

export const DEFAULT_RETURN_TO = '/dashboard';

/** Control characters (incl. tab/newline) and backslashes are never valid. */
function hasUnsafeChars(value: string): boolean {
  for (let i = 0; i < value.length; i += 1) {
    const code = value.charCodeAt(i);
    if (code <= 0x1f || code === 0x7f || code === 0x5c) return true;
  }
  return false;
}

/**
 * Returns the (query/hash preserving) internal path if `raw` is allowlisted,
 * otherwise `null`.
 */
export function sanitizeReturnTo(raw: string | null | undefined): string | null {
  if (!raw || typeof raw !== 'string') return null;

  const value = raw;
  if (!value.startsWith('/') || value.startsWith('//')) return null;
  if (hasUnsafeChars(value)) return null;

  const pathEnd = value.search(/[?#]/);
  const pathname = pathEnd === -1 ? value : value.slice(0, pathEnd);
  const rest = pathEnd === -1 ? '' : value.slice(pathEnd);

  const normalized = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname;

  return (RETURN_TO_ALLOWLIST as readonly string[]).includes(normalized)
    ? `${normalized}${rest}`
    : null;
}
