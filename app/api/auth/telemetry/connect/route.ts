import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { issueTelemetryState, TELEMETRY_COOKIE } from '@/lib/auth/telemetry-oauth';
import { STRAVA_REQUIRED_SCOPES } from '@/lib/telemetry/strava-scopes';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL('/login', request.url));
  const provider = request.nextUrl.searchParams.get('provider') || 'strava';
  if (provider !== 'strava' || !process.env.STRAVA_CLIENT_ID || !process.env.STRAVA_CLIENT_SECRET) {
    return NextResponse.redirect(new URL('/settings?error=integration_unavailable', request.url));
  }
  try {
    const returnPath = request.nextUrl.searchParams.get('onboarding') === 'true' ? '/dashboard' : '/settings';
    const state = await issueTelemetryState(user.id, returnPath);
    const cookieStore = await cookies();
    cookieStore.set(TELEMETRY_COOKIE, state, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 600 });
    const origin = process.env.NEXT_PUBLIC_SITE_URL || request.nextUrl.origin;
    const url = new URL('https://www.strava.com/oauth/authorize');
    const reconnect = request.nextUrl.searchParams.get('reconnect') === '1';
    url.search = new URLSearchParams({ client_id: process.env.STRAVA_CLIENT_ID, redirect_uri: new URL('/api/auth/telemetry/callback', origin).href,
      response_type: 'code', approval_prompt: reconnect ? 'force' : 'auto', scope: STRAVA_REQUIRED_SCOPES.join(','), state }).toString();
    return NextResponse.redirect(url);
  } catch {
    return NextResponse.redirect(new URL('/settings?error=integration_unavailable', request.url));
  }
}
