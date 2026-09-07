import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { fetchWithTimeout } from '@/lib/fetch-with-timeout';
import { consumeTelemetryState, TELEMETRY_COOKIE } from '@/lib/auth/telemetry-oauth';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL('/login', request.url));
  const cookieStore = await cookies();
  const cookie = cookieStore.get(TELEMETRY_COOKIE)?.value;
  cookieStore.delete(TELEMETRY_COOKIE);
  try {
    const returnPath = await consumeTelemetryState(user.id, request.nextUrl.searchParams.get('state'), cookie);
    if (!returnPath) return NextResponse.redirect(new URL('/settings?error=invalid_oauth_state', request.url));
    const code = request.nextUrl.searchParams.get('code');
    if (!code || request.nextUrl.searchParams.has('error')) return NextResponse.redirect(new URL(returnPath + '?error=strava_cancelled', request.url));
    const response = await fetchWithTimeout('https://www.strava.com/oauth/token', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ client_id: process.env.STRAVA_CLIENT_ID, client_secret: process.env.STRAVA_CLIENT_SECRET, code, grant_type: 'authorization_code' }),
    });
    if (!response.ok) throw new Error('Token exchange failed');
    const token = await response.json();
    if (typeof token.access_token !== 'string' || typeof token.refresh_token !== 'string' || !Number.isFinite(token.expires_at) || !Number.isSafeInteger(token.athlete?.id)) throw new Error('Invalid token response');
    const admin = createAdminClient();
    const { error: deviceError } = await admin.from('user_connected_devices').upsert({
      user_id: user.id, provider: 'strava', access_token: token.access_token, refresh_token: token.refresh_token,
      expires_at: new Date(token.expires_at * 1000).toISOString(), scopes: ['activity:read_all','read'],
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
