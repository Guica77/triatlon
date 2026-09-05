import { NextRequest, NextResponse } from 'next/server';
import { isAuthorizedCronRequest } from '@/lib/cron-auth';

export async function POST(request: NextRequest) {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const clientId = process.env.STRAVA_CLIENT_ID;
  const clientSecret = process.env.STRAVA_CLIENT_SECRET;
  const verifyToken = process.env.STRAVA_WEBHOOK_VERIFY_TOKEN;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (!clientId || !clientSecret || !verifyToken || !siteUrl) {
    return NextResponse.json({ error: 'Configuración incompleta' }, { status: 500 });
  }

  const endpoint = 'https://www.strava.com/api/v3/push_subscriptions';
  const callbackUrl = new URL('/api/webhooks/telemetry', siteUrl).href;
  const credentials = new URLSearchParams({ client_id: clientId, client_secret: clientSecret });
  const current = await fetch(`${endpoint}?${credentials}`, { cache: 'no-store' });
  if (!current.ok) {
    return NextResponse.json({ error: 'Strava rechazó las credenciales', status: current.status }, { status: 502 });
  }

  const subscriptions = await current.json() as Array<{ callback_url?: string }>;
  if (subscriptions.some((item) => item.callback_url === callbackUrl)) {
    return NextResponse.json({ registered: true, existed: true });
  }
  if (subscriptions.length > 0) {
    return NextResponse.json({ error: 'Existe una suscripción para otra URL' }, { status: 409 });
  }

  const form = new URLSearchParams(credentials);
  form.set('callback_url', callbackUrl);
  form.set('verify_token', verifyToken);
  const created = await fetch(endpoint, { method: 'POST', body: form });
  if (!created.ok) {
    return NextResponse.json({ error: 'Strava rechazó el registro', status: created.status }, { status: 502 });
  }
  return NextResponse.json({ registered: true, existed: false });
}
