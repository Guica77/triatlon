import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { fetchWithTimeout } from '@/lib/fetch-with-timeout';
import { consumeTelemetryState, TELEMETRY_COOKIE, TELEMETRY_PROVIDER_COOKIE } from '@/lib/auth/telemetry-oauth';
import { hasRequiredStravaScopes, normalizeStravaScopes } from '@/lib/telemetry/strava-scopes';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL('/login', request.url));
  const cookieStore = await cookies();
  const cookie = cookieStore.get(TELEMETRY_COOKIE)?.value;
  const provider = cookieStore.get(TELEMETRY_PROVIDER_COOKIE)?.value;
  cookieStore.delete(TELEMETRY_COOKIE);
  cookieStore.delete(TELEMETRY_PROVIDER_COOKIE);
  try {
    const returnPath = await consumeTelemetryState(user.id, request.nextUrl.searchParams.get('state'), cookie);
    if (!returnPath) return NextResponse.redirect(new URL('/settings?error=invalid_oauth_state', request.url));
    const code = request.nextUrl.searchParams.get('code');
    if (!code || request.nextUrl.searchParams.has('error')) return NextResponse.redirect(new URL(returnPath + `?error=${provider === 'polar' ? 'polar' : 'strava'}_cancelled`, request.url));
    if (provider === 'polar') {
      if (!process.env.POLAR_CLIENT_ID || !process.env.POLAR_CLIENT_SECRET) throw new Error('Polar is not configured');
      const credentials = Buffer.from(`${process.env.POLAR_CLIENT_ID}:${process.env.POLAR_CLIENT_SECRET}`).toString('base64');
      const callback = new URL('/api/auth/telemetry/callback', process.env.NEXT_PUBLIC_SITE_URL || request.nextUrl.origin).href;
      const response = await fetchWithTimeout('https://auth.polar.com/oauth/token', {
        method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded', Authorization: `Basic ${credentials}` },
        body: new URLSearchParams({ grant_type: 'authorization_code', code, redirect_uri: callback }).toString(),
      });
      if (!response.ok) throw new Error('Polar token exchange failed');
      const token = await response.json();
      if (typeof token.access_token !== 'string' || typeof token.refresh_token !== 'string' || !Number.isFinite(token.expires_in)) throw new Error('Invalid Polar token response');
      const admin = createAdminClient();
      const { error: deviceError } = await (admin as any).from('user_connected_devices').upsert({
        user_id: user.id, provider: 'polar', access_token: token.access_token, refresh_token: token.refresh_token,
        expires_at: new Date(Date.now() + token.expires_in * 1000).toISOString(), scopes: typeof token.scope === 'string' ? token.scope.split(/\s+/) : [],
      }, { onConflict: 'user_id, provider' });
      if (deviceError) throw new Error('Could not save Polar connection');
      return NextResponse.redirect(new URL(returnPath + '?telemetry_connected=polar', request.url));
    }
    const response = await fetchWithTimeout('https://www.strava.com/oauth/token', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ client_id: process.env.STRAVA_CLIENT_ID, client_secret: process.env.STRAVA_CLIENT_SECRET, code, grant_type: 'authorization_code' }),
    });
    if (!response.ok) throw new Error('Token exchange failed');
    const token = await response.json();
    if (typeof token.access_token !== 'string' || typeof token.refresh_token !== 'string' || !Number.isFinite(token.expires_at) || !Number.isSafeInteger(token.athlete?.id)) throw new Error('Invalid token response');
    const scopes = normalizeStravaScopes(token.scope);
    if (!hasRequiredStravaScopes(scopes)) return NextResponse.redirect(new URL(returnPath + '?error=strava_missing_permissions', request.url));
    const admin = createAdminClient();
    const { error: deviceError } = await admin.from('user_connected_devices').upsert({
      user_id: user.id, provider: 'strava', access_token: token.access_token, refresh_token: token.refresh_token,
      expires_at: new Date(token.expires_at * 1000).toISOString(), scopes,
    }, { onConflict: 'user_id, provider' });
    if (deviceError) throw new Error('Could not save connection');
    const { error: profileError } = await admin.from('profiles').update({
      strava_connected: true, external_athlete_id: `strava_user_${token.athlete.id}`,
    }).eq('id', user.id);
    if (profileError) throw new Error('Could not save connection status');
    return NextResponse.redirect(new URL(returnPath + '?telemetry_connected=true', request.url));
  } catch {
    return NextResponse.redirect(new URL('/settings?error=strava_connection_failed', request.url));
  }
}
