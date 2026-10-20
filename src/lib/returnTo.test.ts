import { describe, expect, it } from 'vitest';
import { DEFAULT_RETURN_TO, RETURN_TO_ALLOWLIST, sanitizeReturnTo } from './returnTo';

const BACKSLASH = String.fromCharCode(92);

describe('sanitizeReturnTo', () => {
  it.each(RETURN_TO_ALLOWLIST)('accepts allowlisted path %s', (path) => {
    expect(sanitizeReturnTo(path)).toBe(path);
  });

  it('preserves query string and hash', () => {
    expect(sanitizeReturnTo('/dashboard?asset=XLM#chart')).toBe('/dashboard?asset=XLM#chart');
  });

  it('normalizes trailing slashes', () => {
    expect(sanitizeReturnTo('/pools/')).toBe('/pools');
  });

  it.each([
    null,
    undefined,
    '',
    '   ',
    'dashboard',
    '/admin',
    '/connect',
    '/dashboard/evil',
    '//evil.example',
    '///evil.example',
    `/${BACKSLASH}evil.example`,
    'https://evil.example',
    'http://localhost/dashboard',
    'javascript:alert(1)',
    'data:text/html,hi',
    '/dashboard\n',
    '/da\tshboard',
  ])('rejects %j', (value) => {
    expect(sanitizeReturnTo(value as string | null | undefined)).toBeNull();
  });

  it('defaults to the dashboard', () => {
    expect(DEFAULT_RETURN_TO).toBe('/dashboard');
  });
});
