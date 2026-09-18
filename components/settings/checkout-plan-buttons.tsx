'use client';

import * as React from 'react';
import { ArrowRight, Check, LoaderCircle, LockKeyhole, Settings2, X } from 'lucide-react';

type Plan = 'athlete' | 'coach';

const plans: Array<{ id: Plan; name: string; price: string; description: string; features: string[] }> = [
  { id: 'athlete', name: 'Atleta', price: '5 €/mes', description: 'Tu entrenamiento, progreso y recuperación en un solo lugar.', features: ['Plan personal', 'Seguimiento de sesiones', 'Orientación con IA'] },
  { id: 'coach', name: 'Entrenador', price: '30 €/mes', description: 'Organiza tu equipo y acompaña a cada atleta con claridad.', features: ['10 atletas incluidos', 'Planificación compartida', 'Progreso y chat', 'Cada bloque adicional de 5: 2,99 €/mes'] },
];

export function CheckoutPlanButtons({ canManage = false }: { canManage?: boolean }) {
  const [selected, setSelected] = React.useState<Plan>('athlete');
  const [showPaymentReview, setShowPaymentReview] = React.useState(false);
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

      <button type="button" onClick={() => setShowPaymentReview(true)} disabled={loading !== null} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-accent px-6 text-[15px] font-semibold text-white shadow-[0_8px_24px_rgba(0,122,255,0.22)] transition-[transform,filter,box-shadow] duration-150 hover:brightness-95 hover:shadow-[0_10px_28px_rgba(0,122,255,0.28)] active:scale-[0.97] disabled:cursor-wait disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 motion-reduce:transition-none motion-reduce:active:scale-100">
        {loading === selected ? <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" /> : <ArrowRight className="h-4 w-4" aria-hidden="true" />}
        {loading === selected ? 'Abriendo pago seguro…' : 'Revisar y continuar al pago'}
      </button>

      {showPaymentReview ? <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 backdrop-blur-sm sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-labelledby="payment-review-title">
        <div className="w-full max-w-lg rounded-t-[28px] bg-surface-card p-5 shadow-2xl sm:rounded-[28px] sm:p-6">
          <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.12em] text-accent">Paso 2 de 2</p><h2 id="payment-review-title" className="mt-1 text-xl font-bold text-text-primary">Revisa tu pago seguro</h2></div><button type="button" onClick={() => setShowPaymentReview(false)} className="rounded-full p-2 text-text-muted hover:bg-surface-hover" aria-label="Cerrar"><X className="h-5 w-5" /></button></div>
          <div className="mt-5 rounded-2xl border border-border-default bg-surface-hover/60 p-4"><div className="flex items-center justify-between"><span className="font-semibold text-text-primary">{plans.find((plan) => plan.id === selected)?.name}</span><span className="font-bold text-text-primary">{plans.find((plan) => plan.id === selected)?.price}</span></div><p className="mt-2 text-sm text-text-secondary">7 días gratis, sin cobro hoy. Verás impuestos y el importe exacto en Stripe antes de confirmar.</p>{selected === 'coach' ? <p className="mt-2 text-sm text-text-secondary">Incluye 10 atletas; cada bloque adicional de 5 atletas cuesta 2,99 €/mes.</p> : null}</div>
          <div className="mt-4 flex items-start gap-2 text-xs leading-5 text-text-muted"><LockKeyhole className="mt-0.5 h-4 w-4 shrink-0 text-accent" />Stripe procesa el pago de forma segura. Puedes cancelar cuando quieras desde tu suscripción.</div>
          <button type="button" onClick={() => { setShowPaymentReview(false); void openEndpoint('/api/billing/checkout', selected, { plan: selected }); }} disabled={loading !== null} className="mt-5 flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-accent px-6 text-[15px] font-semibold text-white shadow-[0_8px_24px_rgba(0,122,255,0.22)] transition-[transform,filter] duration-150 hover:brightness-95 active:scale-[0.97] disabled:opacity-60 motion-reduce:transition-none motion-reduce:active:scale-100">{loading === selected ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <LockKeyhole className="h-4 w-4" />}Continuar con Stripe</button>
          <button type="button" onClick={() => setShowPaymentReview(false)} className="mt-2 min-h-10 w-full rounded-full px-4 text-sm font-semibold text-text-secondary transition-colors hover:bg-surface-hover active:bg-surface-hover/80">Volver a elegir plan</button>
        </div>
      </div> : null}

      {canManage ? <button type="button" onClick={() => openEndpoint('/api/billing/portal', 'manage')} disabled={loading !== null} className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl text-sm font-semibold text-accent transition-colors hover:bg-accent/10 active:bg-accent/15 disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"><Settings2 className="h-4 w-4" aria-hidden="true" />{loading === 'manage' ? 'Abriendo tu suscripción…' : 'Gestionar suscripción actual'}</button> : null}
      {error ? <p role="alert" className="rounded-xl bg-red-500/10 px-4 py-3 text-sm font-medium text-red-600 dark:text-red-400">{error}</p> : null}
      <p className="text-center text-xs leading-relaxed text-text-muted">Cancela cuando quieras. El total y los impuestos aplicables se muestran antes de confirmar.</p>
    </div>
  );
}
