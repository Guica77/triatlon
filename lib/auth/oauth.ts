export type OAuthRole = 'athlete' | 'coach';

export function parseOAuthRole(value: string | undefined): OAuthRole | null {
  return value === 'athlete' || value === 'coach' ? value : null;
}

export function safeOAuthNext(value: string | null): string {
  if (!value || !value.startsWith('/') || value.startsWith('//')) return '/dashboard';
  try {
    const parsed = new URL(value, 'https://triatlon-pro.local');
    if (parsed.origin !== 'https://triatlon-pro.local') return '/dashboard';
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return '/dashboard';
  }
}

export function oauthDisplayName(metadata: Record<string, unknown> | undefined) {
  const fullName = [metadata?.full_name, metadata?.name]
    .find((value): value is string => typeof value === 'string' && value.trim().length > 0)
    ?.trim();
  const parts = fullName?.split(/\s+/) ?? [];
  return { firstName: parts[0] || 'Usuario', lastName: parts.slice(1).join(' ') };
}
