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
  return <section className="h-full rounded-2xl border border-border-default bg-bg-card p-5 shadow-card sm:p-6">
    <div className="flex items-start justify-between gap-3">
      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-swim">Conexiones</p>
        <h3 className="mt-1 text-base font-bold text-text-primary">Actividades de Strava</h3>
      </div>
      <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-wide ${connected ? 'border-success/30 bg-bike-subtle text-bike' : 'border-border-default bg-surface-elevated text-text-muted'}`}>
        {connected ? 'Conectado' : 'Disponible'}
      </span>
    </div>
    <p className="mt-3 text-sm leading-relaxed text-text-secondary">{connected ? 'Tu cuenta está conectada. Importaremos las actividades nuevas en TriWaveX.' : 'Autoriza Strava de forma segura para importar tus actividades y métricas.'}</p>
    {connected ? <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
      <button disabled={busy} onClick={() => run(syncPacesFromStravaAction, 'Métricas actualizadas.')} className="min-h-11 rounded-xl border border-swim/40 bg-swim-subtle px-4 py-2 text-sm font-bold text-swim transition-[background-color,transform] duration-150 active:scale-[0.98] disabled:opacity-50">Actualizar métricas</button>
      <button disabled={busy} onClick={() => run(() => disconnectTelemetry('strava'), 'Strava desconectado.')} className="min-h-11 rounded-xl border border-border-default bg-surface-elevated px-4 py-2 text-sm font-bold text-text-secondary transition-[background-color,transform] duration-150 active:scale-[0.98] disabled:opacity-50">Desconectar</button>
    </div> : <a href={native ? 'triwavex://strava/connect' : '/api/auth/telemetry/connect?provider=strava'} className="mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground shadow-button transition-[background-color,transform] duration-150 active:scale-[0.98] sm:w-auto">Conectar con Strava</a>}
    <div className="mt-5 border-t border-border-default pt-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-text-primary">Garmin Connect</h3>
          <p id="garmin-availability" className="mt-1 text-sm leading-relaxed text-text-secondary">La conexión directa está pendiente de aprobación de Garmin.</p>
        </div>
        <span className="shrink-0 rounded-full border border-border-default bg-surface-elevated px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-text-muted">Pendiente</span>
      </div>
      <button type="button" disabled aria-describedby="garmin-availability" className="mt-3 min-h-11 w-full rounded-xl border border-border-default bg-surface-elevated px-4 py-2 text-sm font-bold text-text-muted disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto">Conectar con Garmin · Próximamente</button>
      <p className="mt-3 text-xs leading-relaxed text-text-muted">Puedes vincular Garmin con Strava y conectar Strava aquí para importar las actividades que se sincronicen. El envío de entrenamientos al reloj todavía no está disponible.</p>
    </div>
    {(busy || message) && <p role="status" className="mt-4 rounded-xl border border-border-default bg-surface-elevated px-3 py-2 text-sm text-text-secondary">{busy ? 'Procesando…' : message}</p>}
  </section>;
}
