// Read the existing subscription by default. --register creates it only if absent.
import { existsSync } from 'node:fs';

if (existsSync('.env.local')) process.loadEnvFile('.env.local');
const clientId = process.env.STRAVA_CLIENT_ID;
const clientSecret = process.env.STRAVA_CLIENT_SECRET;
const site = process.env.NEXT_PUBLIC_SITE_URL;
if (!clientId || !clientSecret || !site) {
  console.error('Faltan STRAVA_CLIENT_ID, STRAVA_CLIENT_SECRET o NEXT_PUBLIC_SITE_URL.');
  process.exit(1);
}

const callback = new URL('/api/webhooks/telemetry', site);
if (callback.protocol !== 'https:') {
  console.error('El receptor necesita una dirección pública HTTPS.');
  process.exit(1);
}
const endpoint = 'https://www.strava.com/api/v3/push_subscriptions';
const credentials = new URLSearchParams({ client_id: clientId, client_secret: clientSecret });

try {
  const response = await fetch(`${endpoint}?${credentials}`, { signal: AbortSignal.timeout(15000) });
  if (!response.ok) throw new Error(`Consulta rechazada por Strava (${response.status}).`);
  const subscriptions = await response.json();
  if (!Array.isArray(subscriptions)) throw new Error('Respuesta inesperada de Strava.');
  if (subscriptions.some(item => item.callback_url === callback.href)) {
    console.log('La suscripción a nuevas actividades ya está registrada para esta app.');
  } else if (subscriptions.length) {
    throw new Error('Ya existe una suscripción para otra dirección. No se ha sustituido.');
  } else if (!process.argv.includes('--register')) {
    console.log('No hay suscripción. Tras publicar el receptor, ejecutar con --register.');
  } else {
    const form = new URLSearchParams(credentials);
    form.set('callback_url', callback.href);
    form.set('verify_token', process.env.STRAVA_WEBHOOK_VERIFY_TOKEN || 'triatlon_verify_token');
    const created = await fetch(endpoint, {
      method: 'POST', body: form, signal: AbortSignal.timeout(15000),
    });
    if (!created.ok) throw new Error(`Strava no pudo registrar el receptor (${created.status}).`);
    console.log('Suscripción registrada. Verificar con una nueva actividad real.');
  }
} catch (error) {
  // Do not print request URLs, which contain application credentials.
  console.error(error instanceof Error && error.message.startsWith('fetch')
    ? 'No se pudo conectar con Strava.' : error.message);
  process.exitCode = 1;
}
