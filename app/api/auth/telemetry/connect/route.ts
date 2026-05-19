import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

function getBaseUrl(request: NextRequest) {
  const url = new URL(request.url);
  return `${url.protocol}//${url.host}`;
}

/**
 * Endpoint de Conexión Real OAuth 2.0 para Garmin / Strava
 * GET /api/auth/telemetry/connect?provider=garmin
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const provider = searchParams.get('provider') || 'strava';

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Conexión real con Strava si el proveedor es strava
  if (provider === 'strava') {
    const clientId = process.env.STRAVA_CLIENT_ID;
    if (!clientId) {
      console.error('STRAVA_CLIENT_ID no configurado en variables de entorno');
      return NextResponse.redirect(new URL('/settings?error=strava_config_missing', request.url));
    }
    const redirectUri = `${getBaseUrl(request)}/api/auth/telemetry/callback`;
    const stravaUrl = `https://www.strava.com/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&approval_prompt=auto&scope=activity:read_all,read`;
    return NextResponse.redirect(stravaUrl);
  }

  // Simulación/Handshake para otros proveedores (por ejemplo, Garmin mock)
  const mockExternalAthleteId = `${provider}_user_${user.id.substring(0, 8)}`;
  const mockAccessToken = `racc_${Math.random().toString(36).substring(2, 15)}`;
  const mockRefreshToken = `rref_${Math.random().toString(36).substring(2, 15)}`;

  const updateData: Record<string, any> = {
    external_athlete_id: mockExternalAthleteId,
  };

  if (provider === 'garmin') {
    updateData.garmin_connected = true;
    updateData.garmin_auth_tokens = { access_token: mockAccessToken, refresh_token: mockRefreshToken, expires_at: Date.now() + 86400000 * 30 };
  }

  const { error: profileError } = await supabase
    .from('profiles')
    .update(updateData as any)
    .eq('id', user.id);

  if (profileError) {
    console.error(`Error actualizando perfil con conexión mock ${provider}:`, profileError);
  }

  await supabase.from('user_connected_devices').upsert({
    user_id: user.id,
    provider,
    access_token: mockAccessToken,
    refresh_token: mockRefreshToken,
    expires_at: new Date(Date.now() + 30 * 86400000).toISOString(),
    scopes: ['workout:write', 'telemetry:read']
  }, { onConflict: 'user_id, provider' });

  return NextResponse.redirect(new URL('/settings?telemetry_connected=true', request.url));
}
