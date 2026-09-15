import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { issueTelemetryState, TELEMETRY_COOKIE, TELEMETRY_PROVIDER_COOKIE } from '@/lib/auth/telemetry-oauth';
import { STRAVA_REQUIRED_SCOPES } from '@/lib/telemetry/strava-scopes';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL('/login', request.url));
  const provider = request.nextUrl.searchParams.get('provider') || 'strava';
  if (!['strava', 'polar'].includes(provider)) {
    return NextResponse.redirect(new URL('/settings?error=integration_unavailable', request.url));
  }
  const configured = provider === 'strava'
    ? Boolean(process.env.STRAVA_CLIENT_ID && process.env.STRAVA_CLIENT_SECRET)
    : Boolean(process.env.POLAR_CLIENT_ID && process.env.POLAR_CLIENT_SECRET)
  if (!configured) return NextResponse.redirect(new URL('/settings?error=integration_unavailable', request.url));
  try {
    const returnPath = request.nextUrl.searchParams.get('onboarding') === 'true' ? '/dashboard' : '/settings';
    const state = await issueTelemetryState(user.id, returnPath);
    const cookieStore = await cookies();
    cookieStore.set(TELEMETRY_COOKIE, state, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 600 });
    cookieStore.set(TELEMETRY_PROVIDER_COOKIE, provider, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 600 });
    const origin = process.env.NEXT_PUBLIC_SITE_URL || request.nextUrl.origin;
    const callback = new URL('/api/auth/telemetry/callback', origin).href;
    if (provider === 'polar') {
      const url = new URL('https://auth.polar.com/oauth/authorize');
      url.search = new URLSearchParams({
        client_id: process.env.POLAR_CLIENT_ID!, response_type: 'code', redirect_uri: callback, state,
        scope: 'activity:read calendar:read nightly_recharge:read sleep:read training_sessions:read devices:read profile:read',
      }).toString();
      return NextResponse.redirect(url);
    }
    const url = new URL('https://www.strava.com/oauth/authorize');
    const reconnect = request.nextUrl.searchParams.get('reconnect') === '1';
    url.search = new URLSearchParams({ client_id: process.env.STRAVA_CLIENT_ID!, redirect_uri: callback,
      response_type: 'code', approval_prompt: reconnect ? 'force' : 'auto', scope: STRAVA_REQUIRED_SCOPES.join(','), state }).toString();
    return NextResponse.redirect(url);
  } catch {
    return NextResponse.redirect(new URL('/settings?error=integration_unavailable', request.url));
  }
}
