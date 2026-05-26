'use client';

import * as React from 'react';
import { CreditCard, Check, Zap, Sparkles, RefreshCw } from 'lucide-react';
import { updateSubscriptionStatus } from '@/app/settings/actions';
import { AnimatedButton } from '@/components/ui/animated-button';

interface BillingCardProps {
  status: string | null | undefined;
}

export function BillingCard({ status }: BillingCardProps) {
  const [loading, setLoading] = React.useState(false);
  const isPro = status === 'pro';

  const handleToggleSubscription = async () => {
    setLoading(true);
    // Simulate payment processor pop-up delay
    await new Promise((resolve) => setTimeout(resolve, 1000));
    try {
      const nextStatus = isPro ? 'free' : 'pro';
      const res = await updateSubscriptionStatus(nextStatus);
      if (res && res.error) {
        console.error('Subscription error:', res.error);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 rounded-2xl bg-[#18181b] border border-zinc-800 shadow-xl relative h-full flex flex-col justify-between group overflow-hidden">
      {/* Decorative ambient background */}
      {isPro && (
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
      )}

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              isPro ? 'bg-emerald-500/10' : 'bg-zinc-900 border border-zinc-800'
            }`}>
              <CreditCard className={`w-4 h-4 ${isPro ? 'text-emerald-400' : 'text-zinc-400'}`} />
            </div>
            <h3 className="text-base font-bold text-zinc-100 font-sans">Suscripción y Pagos</h3>
          </div>
          
          <span className={`text-[10px] uppercase tracking-widest font-black px-2.5 py-1 rounded-full ${
            isPro 
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-emerald-500/5 shadow-md' 
              : 'bg-zinc-900 text-zinc-500 border border-zinc-800/80'
          }`}>
            {isPro ? 'Plan Pro' : 'Plan Free'}
          </span>
        </div>

        {/* Plan price / details */}
        <div className="space-y-1">
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-black text-white">{isPro ? '9,99€' : '0,00€'}</span>
            <span className="text-xs text-zinc-500 font-medium">/ mes</span>
          </div>
          <p className="text-xs text-zinc-400 leading-relaxed pt-1">
            {isPro 
              ? 'Tienes activadas todas las funciones de periodización avanzada, análisis de fatiga PMC y exportación estructurada de TCX ilimitada.'
              : 'Estás en la cuenta básica. Actualiza a Pro para desbloquear analíticas avanzadas, planes adaptados de forma ilimitada y sincronización en tiempo real.'}
          </p>
        </div>

        {/* Benefits list */}
        <div className="border-t border-zinc-800/80 pt-4 space-y-2.5">
          <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold block mb-1">
            {isPro ? 'Beneficios Activos' : 'Ventajas del Plan Pro'}
          </span>
          
          <div className="space-y-2">
            {[
              { text: 'Semanas ilimitadas de entrenamiento', pro: true },
              { text: 'Zonas fisiológicas dinámicas auto-adaptadas', pro: true },
              { text: 'Métricas de carga, fatiga y estrés (PMC)', pro: true },
              { text: 'Conexión total con Garmin y Strava Webhooks', pro: true },
              { text: 'Exportación estructurada en TCX para el reloj', pro: true }
            ].map((benefit, idx) => (
              <div key={idx} className="flex items-center gap-2 text-xs">
                <Check className={`w-3.5 h-3.5 shrink-0 ${isPro ? 'text-emerald-400' : 'text-zinc-500'}`} />
                <span className={isPro ? 'text-zinc-300' : 'text-zinc-400'}>{benefit.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="pt-6 border-t border-zinc-800/80 mt-6">
        <AnimatedButton
          variant={isPro ? 'ghost' : 'primary'}
          onClick={handleToggleSubscription}
          disabled={loading}
          className={`w-full py-3 text-xs font-bold flex items-center justify-center gap-1.5 ${
            isPro 
              ? 'border-zinc-800 hover:border-rose-500/30 hover:bg-rose-500/5 hover:text-rose-400 transition-all'
              : '!bg-emerald-500 hover:!bg-emerald-400 !text-black shadow-emerald-500/10 shadow-lg'
          }`}
        >
          {loading ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              Procesando Pasarela...
            </>
          ) : isPro ? (
            'Cancelar Suscripción'
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5 text-black" />
              Suscribirse a Pro
            </>
          )}
        </AnimatedButton>
      </div>
    </div>
  );
}
