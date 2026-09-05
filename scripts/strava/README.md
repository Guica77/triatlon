# Recogida al subir una actividad a Strava

La app recibe `activity/create` en `/api/webhooks/telemetry` y consulta
los detalles con el permiso del atleta. El flujo existente guarda telemetría
y compara la actividad con el plan. Es independiente del cron horario de Garmin.

Desde la raíz del proyecto, con Node 22 o posterior:

```sh
node scripts/strava/webhook.mjs
node scripts/strava/webhook.mjs --register
```

La primera orden solo consulta. La segunda registra si no existe una suscripción.
Nunca elimina una suscripción previa. Lee `.env.local` o variables del entorno:
`STRAVA_CLIENT_ID`, `STRAVA_CLIENT_SECRET`, `NEXT_PUBLIC_SITE_URL` y,
opcionalmente, `STRAVA_WEBHOOK_VERIFY_TOKEN` (debe coincidir con producción).

El receptor debe estar publicado y responder a la verificación. El atleta debe
haber conectado Strava con `activity:read` o `activity:read_all`; este último
es necesario para actividades privadas. Verificar después con una actividad real.

Limitación existente: el receptor procesa antes de responder; Strava exige
confirmación en dos segundos. Antes de considerar garantizada la entrega,
migrar a una cola persistente con confirmación rápida y reintentos del procesamiento.
No se ha confirmado aquí el registro ni la entrega en producción.

Referencia: https://developers.strava.com/docs/webhooks/
