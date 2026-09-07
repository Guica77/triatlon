 'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { disconnectTelemetry, syncPacesFromStravaAction } from '@/app/(app)/settings/actions';

export function TelemetryConnectCard({ connectedProviders = [] }: { connectedProviders: string[]; lastSyncTime?: string | null }) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const router = useRouter();
  const connected = connectedProviders.includes('strava');
  async function run(action: () => Promise<{ error?: string }>, success: string) {
    setBusy(true); setMessage('');
    try { const result = await action(); setMessage(result.error || success); if (!result.error) router.refresh(); }
    catch { setMessage('No se pudo completar la operación. Inténtalo de nuevo.'); }
    finally { setBusy(false); }
  }
  return <section className="h-full rounded-xl border border-border-default bg-bg-card p-5 space-y-3">
    <h3 className="text-sm font-bold text-text-primary">Actividades de Strava</h3>
    <p className="text-sm text-text-secondary">{connected ? 'Cuenta conectada.' : 'Conecta tu cuenta para importar tus actividades. La autorización se realiza en Strava.'}</p>
    {connected ? <div className="flex flex-wrap gap-2">
      <button disabled={busy} onClick={() => run(syncPacesFromStravaAction, 'Métricas actualizadas.')} className="rounded-lg border px-3 py-2 text-sm disabled:opacity-50">Actualizar métricas</button>
      <button disabled={busy} onClick={() => run(() => disconnectTelemetry('strava'), 'Strava desconectado.')} className="rounded-lg border px-3 py-2 text-sm disabled:opacity-50">Desconectar</button>
    </div> : <a href="/api/auth/telemetry/connect?provider=strava" className="inline-block rounded-lg border px-3 py-2 text-sm">Conectar con Strava</a>}
    <p className="text-xs text-text-muted">La conexión directa con Garmin y el envío de sesiones al reloj todavía no están disponibles. No te pediremos tu contraseña de Garmin.</p>
    <p role="status" className="text-sm text-text-secondary">{busy ? 'Procesando…' : message}</p>
  </section>;
}
