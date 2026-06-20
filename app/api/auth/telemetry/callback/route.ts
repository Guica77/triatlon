import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { syncPhysiologyFromStrava } from '@/lib/telemetry/strava-sync';

function getBaseUrl(request: NextRequest) {
  const url = new URL(request.url);
  return `${url.protocol}//${url.host}`;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const error = searchParams.get('error');
  const state = searchParams.get('state') || 'settings';
  const isOnboarding = state === 'onboarding';

  if (error || !code) {
    console.error('Strava OAuth error or code missing:', error);
    return NextResponse.redirect(new URL(isOnboarding ? '/dashboard?error=strava_auth_failed' : '/settings?error=strava_auth_failed', request.url));
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  try {
    // Exchange authorization code for token
    const tokenResponse = await fetch('https://www.strava.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: process.env.STRAVA_CLIENT_ID,
        client_secret: process.env.STRAVA_CLIENT_SECRET,
        code,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('Failed to exchange code for token:', errorText);
      return NextResponse.redirect(new URL(isOnboarding ? '/dashboard?error=token_exchange_failed' : '/settings?error=token_exchange_failed', request.url));
    }

    const tokenData = await tokenResponse.json();
    const { access_token, refresh_token, expires_at, athlete } = tokenData;
    const externalAthleteId = `strava_user_${athlete.id}`;

    // Update profile in database
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        strava_connected: true,
        external_athlete_id: externalAthleteId,
        strava_auth_tokens: {
          access_token,
          refresh_token,
          expires_at: expires_at * 1000, // convert to ms
        },
      } as any)
      .eq('id', user.id);

    if (profileError) {
      console.error('Error updating user profile with Strava tokens:', profileError);
    }

    // Update user_connected_devices table for backward compatibility
    const { error: deviceError } = await supabase
      .from('user_connected_devices')
      .upsert({
        user_id: user.id,
        provider: 'strava',
        access_token,
        refresh_token,
        expires_at: new Date(expires_at * 1000).toISOString(),
        scopes: ['activity:read_all', 'read'],
      }, { onConflict: 'user_id, provider' });

    if (deviceError) {
      console.error('Error upserting to user_connected_devices:', deviceError);
    }

    // Sync physiological metrics from Strava activities and athlete profile
    await syncPhysiologyFromStrava(user.id, access_token);

    return NextResponse.redirect(new URL(isOnboarding ? '/dashboard?telemetry_connected=true' : '/settings?telemetry_connected=true', request.url));
  } catch (err) {
    console.error('Exception during Strava token exchange:', err);
    return NextResponse.redirect(new URL(isOnboarding ? '/dashboard?error=strava_exception' : '/settings?error=strava_exception', request.url));
  }
}
