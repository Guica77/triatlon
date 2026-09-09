 'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { disconnectTelemetry, syncPacesFromStravaAction } from '@/app/(app)/settings/actions';

export function TelemetryConnectCard({ connectedProviders = [] }: { connectedProviders: string[]; lastSyncTime?: string | null }) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const router = useRouter();
  const connected = connectedProviders.includes('strava');
  const native = typeof navigator !== 'undefined' && navigator.userAgent.includes('TriWaveXNative/');
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
    </div> : <a href={native ? 'triwavex://strava/connect' : '/api/auth/telemetry/connect?provider=strava'} className="inline-block rounded-lg border px-3 py-2 text-sm">Conectar con Strava</a>}
    <div className="space-y-3 border-t border-border-default pt-4">
      <h3 className="text-sm font-bold text-text-primary">Garmin Connect</h3>
      <p id="garmin-availability" className="text-sm text-text-secondary">La conexión directa está pendiente de aprobación de Garmin.</p>
      <button type="button" disabled aria-describedby="garmin-availability" className="min-h-11 rounded-lg border border-border-default px-3 py-2 text-sm text-text-muted disabled:cursor-not-allowed disabled:opacity-60">Conectar con Garmin · Próximamente</button>
      <p className="text-xs text-text-muted">Mientras tanto, puedes vincular Garmin con Strava y conectar Strava aquí para importar las actividades que se sincronicen. El envío de entrenamientos al reloj todavía no está disponible.</p>
    </div>
    <p role="status" className="text-sm text-text-secondary">{busy ? 'Procesando…' : message}</p>
  </section>;
}
