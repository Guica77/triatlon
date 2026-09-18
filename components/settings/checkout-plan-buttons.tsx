'use client';

import * as React from 'react';
import { ArrowRight, Check, LoaderCircle, Settings2 } from 'lucide-react';

type Plan = 'athlete' | 'coach';

const plans: Array<{ id: Plan; name: string; price: string; description: string; features: string[] }> = [
  { id: 'athlete', name: 'Atleta', price: '5 €/mes', description: 'Tu entrenamiento, progreso y recuperación en un solo lugar.', features: ['Plan personal', 'Seguimiento de sesiones', 'Orientación con IA'] },
  { id: 'coach', name: 'Entrenador', price: '30 €/mes', description: 'Organiza tu equipo y acompaña a cada atleta con claridad.', features: ['10 atletas incluidos', 'Planificación compartida', 'Progreso y chat'] },
];

export function CheckoutPlanButtons({ canManage = false }: { canManage?: boolean }) {
  const [selected, setSelected] = React.useState<Plan>('athlete');
  const [loading, setLoading] = React.useState<Plan | 'manage' | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  async function openEndpoint(endpoint: string, pending: Plan | 'manage', body?: unknown) {
    setLoading(pending);
    setError(null);
    try {
      const response = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined });
      const result = await response.json() as { url?: string; error?: string };
      if (!response.ok || !result.url) throw new Error(result.error || 'No se ha podido abrir el pago seguro.');
      window.location.assign(result.url);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se ha podido continuar.');
      setLoading(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Elige tu plan">
        {plans.map((plan) => {
          const active = selected === plan.id;
          return (
            <button key={plan.id} type="button" role="radio" aria-checked={active} onClick={() => setSelected(plan.id)} className={`group min-h-48 rounded-[22px] border p-5 text-left transition-[transform,background-color,border-color,box-shadow] duration-200 ease-out active:scale-[0.985] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 ${active ? 'border-accent bg-accent/[0.07] shadow-[0_14px_40px_rgba(0,122,255,0.10)]' : 'border-border-default bg-surface-card hover:bg-surface-hover'}`}>
              <span className="flex items-start justify-between gap-3">
                <span><span className="block text-lg font-semibold tracking-[-0.02em] text-text-primary">{plan.name}</span><span className="mt-1 block text-2xl font-semibold tracking-[-0.035em] text-text-primary">{plan.price}</span></span>
                <span className={`flex h-6 w-6 items-center justify-center rounded-full border transition-colors ${active ? 'border-accent bg-accent text-white' : 'border-border-default text-transparent'}`}><Check className="h-4 w-4" strokeWidth={3} aria-hidden="true" /></span>
              </span>
              <span className="mt-3 block text-sm leading-relaxed text-text-secondary">{plan.description}</span>
              <span className="mt-4 block space-y-1.5">{plan.features.map((feature) => <span key={feature} className="flex items-center gap-2 text-sm text-text-primary"><Check className="h-3.5 w-3.5 text-accent" aria-hidden="true" />{feature}</span>)}</span>
            </button>
          );
        })}
      </div>

      <button type="button" onClick={() => openEndpoint('/api/billing/checkout', selected, { plan: selected })} disabled={loading !== null} className="flex min-h-13 w-full items-center justify-center gap-2 rounded-[14px] bg-accent px-5 text-[15px] font-semibold text-white shadow-[0_8px_24px_rgba(0,122,255,0.22)] transition-[transform,filter] duration-150 hover:brightness-95 active:scale-[0.985] disabled:cursor-wait disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2">
        {loading === selected ? <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" /> : <ArrowRight className="h-4 w-4" aria-hidden="true" />}
        {loading === selected ? 'Abriendo pago seguro…' : 'Continuar con 7 días gratis'}
      </button>

      {canManage ? <button type="button" onClick={() => openEndpoint('/api/billing/portal', 'manage')} disabled={loading !== null} className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl text-sm font-semibold text-accent transition-colors hover:bg-accent/10 active:bg-accent/15 disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"><Settings2 className="h-4 w-4" aria-hidden="true" />{loading === 'manage' ? 'Abriendo tu suscripción…' : 'Gestionar suscripción actual'}</button> : null}
      {error ? <p role="alert" className="rounded-xl bg-red-500/10 px-4 py-3 text-sm font-medium text-red-600 dark:text-red-400">{error}</p> : null}
      <p className="text-center text-xs leading-relaxed text-text-muted">Cancela cuando quieras. El total y los impuestos aplicables se muestran antes de confirmar.</p>
    </div>
  );
}
