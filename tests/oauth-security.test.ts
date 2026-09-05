import { describe, expect, it } from 'vitest';
import { oauthDisplayName, parseOAuthRole, safeOAuthNext } from '@/lib/auth/oauth';

describe('OAuth safety helpers', () => {
  it('only accepts known roles', () => {
    expect(parseOAuthRole('athlete')).toBe('athlete');
    expect(parseOAuthRole('coach')).toBe('coach');
    expect(parseOAuthRole('admin')).toBeNull();
  });

  it('allows internal redirects and rejects external redirects', () => {
    expect(safeOAuthNext('/chat?from=login')).toBe('/chat?from=login');
    expect(safeOAuthNext('//evil.example/path')).toBe('/dashboard');
    expect(safeOAuthNext('https://evil.example/path')).toBe('/dashboard');
    expect(safeOAuthNext(null)).toBe('/dashboard');
  });

  it('handles Apple private relay users without a name', () => {
    expect(oauthDisplayName(undefined)).toEqual({ firstName: 'Usuario', lastName: '' });
    expect(oauthDisplayName({ name: 'Ana María Pérez' })).toEqual({ firstName: 'Ana', lastName: 'María Pérez' });
  });
});
