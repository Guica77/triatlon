'use client';
import * as React from 'react';

export function CheckoutPlanButtons() {
  const [loading, setLoading] = React.useState<string | null>(null);
  async function checkout(plan: 'athlete' | 'coach') {
    setLoading(plan);
    const response = await fetch('/api/billing/checkout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ plan }) });
    const body = await response.json();
    if (body.url) window.location.assign(body.url); else { alert(body.error || 'No se ha podido iniciar el pago.'); setLoading(null); }
  }
  return <div className="grid gap-3 sm:grid-cols-2">
    <button onClick={() => checkout('athlete')} disabled={loading !== null} className="min-h-11 rounded-xl bg-accent px-4 text-sm font-semibold text-white disabled:opacity-50">{loading === 'athlete' ? 'Abriendo pago seguro…' : 'Elegir atleta · 5 €/mes'}</button>
    <button onClick={() => checkout('coach')} disabled={loading !== null} className="min-h-11 rounded-xl border border-border-default bg-surface-card px-4 text-sm font-semibold text-text-primary disabled:opacity-50">{loading === 'coach' ? 'Abriendo pago seguro…' : 'Elegir entrenador · 30 €/mes'}</button>
  </div>;
}
