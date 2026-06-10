'use client';

import * as React from 'react';
import { CreditCard, Check, Zap, Sparkles, RefreshCw, X, Lock } from 'lucide-react';
import { updateSubscriptionStatus } from '@/app/(app)/settings/actions';
import { AnimatedButton } from '@/components/ui/animated-button';

interface BillingCardProps {
  status: string | null | undefined;
}

export function BillingCard({ status }: BillingCardProps) {
  const [loading, setLoading] = React.useState(false);
  const [showPayModal, setShowPayModal] = React.useState(false);
  const [showCancelModal, setShowCancelModal] = React.useState(false);
  const [cardNumber, setCardNumber] = React.useState('4242 4242 4242 4242');
  const [expiry, setExpiry] = React.useState('12/28');
  const [cvc, setCvc] = React.useState('424');
  const [nameOnCard, setNameOnCard] = React.useState('Atleta Pro');
  const [paymentSuccess, setPaymentSuccess] = React.useState(false);

  const isPro = status === 'pro';
  const isCoach = status === 'coach';

  const [activeTab, setActiveTab] = React.useState<'pro' | 'coach'>(isCoach ? 'coach' : 'pro');

  React.useEffect(() => {
    if (isCoach) {
      setActiveTab('coach');
    } else if (isPro) {
      setActiveTab('pro');
    }
  }, [isPro, isCoach]);

  const currentPlanActive = (activeTab === 'pro' && isPro) || (activeTab === 'coach' && isCoach);

  const handleButtonClick = () => {
    if (currentPlanActive) {
      setShowCancelModal(true);
    } else {
      setShowPayModal(true);
    }
  };

  const planPrice = activeTab === 'pro' ? '5,00€' : '19,00€';
  const planName = activeTab === 'pro' ? 'Plan Atleta Pro' : 'Plan Entrenador Pro';
  const planDescription = activeTab === 'pro'
    ? 'Tienes activadas todas las funciones de periodización avanzada, análisis de fatiga PMC y exportación estructurada de TCX ilimitada.'
    : 'Roster de atletas ilimitado, tarifa plana sin cobros por atleta, panel de control con alertas avanzadas (HRV/TSS), asignación de planes y chat.';

  const benefitsList = activeTab === 'pro' ? [
    'Semanas ilimitadas de entrenamiento',
    'Zonas fisiológicas dinámicas auto-adaptadas',
    'Métricas de carga, fatiga y estrés (PMC)',
    'Conexión total con Garmin y Strava Webhooks',
    'Exportación estructurada en TCX para el reloj'
  ] : [
    'Roster y gestión de atletas sin límites (B2B)',
    'Tarifa plana de 19€/mes (sin coste extra por atleta)',
    'Panel de control con semáforo de alertas (HRV/TSS)',
    'Asignación remota e instantánea de planes de entrenamiento',
    'Soporte prioritario y mensajería en español/multilingüe'
  ];

  return (
    <>
      <div className="p-6 rounded-2xl bg-[#18181b] border border-zinc-800 shadow-xl relative h-full flex flex-col justify-between group overflow-hidden">
        {/* Decorative ambient background */}
        {status && status !== 'free' && (
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
        )}

        <div className="space-y-6">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  status && status !== 'free' ? 'bg-emerald-500/10' : 'bg-zinc-900 border border-zinc-800'
                }`}>
                  <CreditCard className={`w-4 h-4 ${status && status !== 'free' ? 'text-emerald-400' : 'text-zinc-400'}`} />
                </div>
                <h3 className="text-base font-bold text-zinc-100 font-sans">Planes y Facturación</h3>
              </div>
              
              <span className={`text-[10px] uppercase tracking-widest font-black px-2.5 py-1 rounded-full ${
                status && status !== 'free'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-emerald-500/5 shadow-md' 
                  : 'bg-zinc-900 text-zinc-500 border border-zinc-800/80'
              }`}>
                {isCoach ? 'Entrenador' : isPro ? 'Atleta Pro' : 'Plan Free'}
              </span>
            </div>

            {/* Plan Tabs Selection (only allow toggling if not fully subscribed to both) */}
            {(!isPro && !isCoach) && (
              <div className="grid grid-cols-2 gap-1 p-1 bg-zinc-950 rounded-xl border border-zinc-800">
                <button
                  onClick={() => setActiveTab('pro')}
                  className={`py-1.5 text-xs font-bold rounded-lg transition-all ${
                    activeTab === 'pro' 
                      ? 'bg-zinc-800 text-white shadow-sm' 
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  Atleta
                </button>
                <button
                  onClick={() => setActiveTab('coach')}
                  className={`py-1.5 text-xs font-bold rounded-lg transition-all ${
                    activeTab === 'coach' 
                      ? 'bg-zinc-800 text-white shadow-sm' 
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  Entrenador
                </button>
              </div>
            )}

            {isPro && (
              <div className="flex justify-between items-center bg-zinc-900/50 border border-zinc-800/60 p-2.5 rounded-xl">
                <span className="text-[11px] text-zinc-400 font-medium">¿Eres entrenador?</span>
                <button
                  onClick={() => setActiveTab('coach')}
                  className="px-2.5 py-1 bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 rounded-lg text-[10px] font-bold border border-cyan-500/20 transition-colors"
                >
                  Subir a Entrenador
                </button>
              </div>
            )}
          </div>

          {/* Plan price / details */}
          <div className="space-y-1">
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-black text-white">{planPrice}</span>
              <span className="text-xs text-zinc-500 font-medium">/ mes</span>
            </div>
            {currentPlanActive && (
              <p className="text-[9px] text-emerald-400 font-extrabold tracking-wider uppercase bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md inline-block">
                Próxima renovación: 26 de Junio de 2026
              </p>
            )}
            <p className="text-xs text-zinc-400 leading-relaxed pt-1">
              {planDescription}
            </p>
          </div>

          {/* Benefits list */}
          <div className="border-t border-zinc-800/80 pt-4 space-y-2.5">
            <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold block mb-1">
              {currentPlanActive ? 'Beneficios Activos' : `Ventajas del ${planName}`}
            </span>
            
            <div className="space-y-2">
              {benefitsList.map((benefit, idx) => (
                <div key={idx} className="flex items-center gap-2 text-xs">
                  <Check className={`w-3.5 h-3.5 shrink-0 ${currentPlanActive ? 'text-emerald-400' : 'text-zinc-500'}`} />
                  <span className={currentPlanActive ? 'text-zinc-300' : 'text-zinc-400'}>{benefit}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-zinc-800/80 mt-6">
          <AnimatedButton
            variant={currentPlanActive ? 'ghost' : 'primary'}
            onClick={handleButtonClick}
            disabled={loading}
            className={`w-full py-3 text-xs font-bold flex items-center justify-center gap-1.5 ${
              currentPlanActive 
                ? 'border-zinc-800 hover:border-rose-500/30 hover:bg-rose-500/5 hover:text-rose-400 transition-all'
                : '!bg-emerald-500 hover:!bg-emerald-400 !text-black shadow-emerald-500/10 shadow-lg'
            }`}
          >
            {currentPlanActive ? (
              'Cancelar Suscripción'
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 text-black" />
                {status && status !== 'free' ? 'Cambiar a este Plan' : `Activar ${planName}`}
              </>
            )}
          </AnimatedButton>
        </div>
      </div>

      {/* Modal de Pago */}
      {showPayModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fade-in">
          <div className="bg-[#121214] border border-zinc-800 rounded-3xl w-full max-w-md p-6 relative shadow-2xl space-y-6 text-left">
            {/* Cierre */}
            <button 
              onClick={() => { if (!loading && !paymentSuccess) setShowPayModal(false); }}
              className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors cursor-pointer"
              disabled={loading || paymentSuccess}
            >
              <X className="w-5 h-5" />
            </button>

            {/* Cabecera */}
            <div className="text-center space-y-2">
              <div className="mx-auto w-12 h-12 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                <Sparkles className="w-6 h-6 animate-pulse" />
              </div>
              <h3 className="text-lg font-black text-white">Pasarela de Pago Segura</h3>
              <p className="text-xs text-zinc-400 flex items-center justify-center gap-1">
                <Lock className="w-3.5 h-3.5 text-emerald-400" /> Modo Simulación Pro
              </p>
            </div>

            {paymentSuccess ? (
              <div className="text-center py-6 space-y-4">
                <div className="mx-auto w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <Check className="w-8 h-8 stroke-[3]" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-white font-extrabold text-base">¡Suscripción Activada!</h4>
                  <p className="text-xs text-zinc-400 max-w-xs mx-auto">
                    Bienvenido al plan de Alto Rendimiento. Tus entrenamientos adaptativos ya están listos.
                  </p>
                </div>
              </div>
            ) : (
              <form onSubmit={async (e) => {
                e.preventDefault();
                setLoading(true);
                // Simular procesamiento del banco
                await new Promise((resolve) => setTimeout(resolve, 1500));
                try {
                  const res = await updateSubscriptionStatus(activeTab);
                  if (res && res.error) {
                    alert(res.error);
                  } else {
                    setPaymentSuccess(true);
                    // Esperar a que se renderice el éxito y cerrar
                    setTimeout(() => {
                      setShowPayModal(false);
                      setPaymentSuccess(false);
                    }, 2500);
                  }
                } catch (err) {
                  console.error(err);
                } finally {
                  setLoading(false);
                }
              }} className="space-y-4">
                {/* Tarjeta de Crédito Visual */}
                <div className="h-40 rounded-2xl bg-gradient-to-br from-zinc-800 to-zinc-950 border border-zinc-700/80 p-5 flex flex-col justify-between shadow-lg relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-black uppercase tracking-widest text-zinc-400">Triatlon Pro Card</span>
                    <CreditCard className="w-6 h-6 text-zinc-400" />
                  </div>
                  <div className="space-y-1">
                    <div className="text-zinc-500 text-[10px] tracking-wider uppercase">Número de Tarjeta</div>
                    <div className="text-white text-base font-mono tracking-widest">{cardNumber || '•••• •••• •••• ••••'}</div>
                  </div>
                  <div className="flex justify-between items-center text-xs font-mono">
                    <div>
                      <span className="text-zinc-500 text-[8px] uppercase block">Titular</span>
                      <span className="text-zinc-300 font-bold uppercase">{nameOnCard || 'Atleta Pro'}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-zinc-500 text-[8px] uppercase block">Expira</span>
                      <span className="text-zinc-300 font-bold">{expiry || 'MM/AA'}</span>
                    </div>
                  </div>
                </div>

                {/* Formulario */}
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[10px] text-zinc-400 uppercase tracking-wider font-semibold">Titular de la Tarjeta</label>
                    <input 
                      type="text" 
                      value={nameOnCard}
                      onChange={(e) => setNameOnCard(e.target.value)}
                      required
                      className="w-full bg-[#18181b] border border-zinc-800 focus:border-cyan-500 rounded-xl p-3 text-xs text-white outline-none transition-colors"
                      placeholder="Nombre y Apellidos"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-zinc-400 uppercase tracking-wider font-semibold">Número de Tarjeta (Stripe Test)</label>
                    <input 
                      type="text" 
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      maxLength={19}
                      required
                      className="w-full bg-[#18181b] border border-zinc-800 focus:border-cyan-500 rounded-xl p-3 text-xs text-white font-mono outline-none transition-colors"
                      placeholder="4242 4242 4242 4242"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] text-zinc-400 uppercase tracking-wider font-semibold">Vencimiento</label>
                      <input 
                        type="text" 
                        value={expiry}
                        onChange={(e) => setExpiry(e.target.value)}
                        maxLength={5}
                        required
                        className="w-full bg-[#18181b] border border-zinc-800 focus:border-cyan-500 rounded-xl p-3 text-xs text-white font-mono outline-none transition-colors"
                        placeholder="MM/AA"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-zinc-400 uppercase tracking-wider font-semibold">CVC</label>
                      <input 
                        type="password" 
                        value={cvc}
                        onChange={(e) => setCvc(e.target.value)}
                        maxLength={4}
                        required
                        className="w-full bg-[#18181b] border border-zinc-800 focus:border-cyan-500 rounded-xl p-3 text-xs text-white font-mono outline-none transition-colors"
                        placeholder="•••"
                      />
                    </div>
                  </div>
                </div>

                <AnimatedButton
                  variant="primary"
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 text-xs font-extrabold !bg-emerald-500 hover:!bg-emerald-400 !text-black shadow-emerald-500/10 shadow-lg flex items-center justify-center gap-1.5"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Procesando Pago Seguro...
                    </>
                  ) : (
                    <>
                      <Lock className="w-3.5 h-3.5 text-black" />
                      Completar Pago Simulado — Gratis
                    </>
                  )}
                </AnimatedButton>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Modal de Cancelación */}
      {showCancelModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fade-in">
          <div className="bg-[#121214] border border-zinc-800 rounded-3xl w-full max-w-sm p-6 relative shadow-2xl space-y-6 text-left">
            {/* Cabecera */}
            <div className="text-center space-y-2">
              <h3 className="text-lg font-black text-white">¿Cancelar Suscripción?</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Si cancelas, perderás el acceso inmediato a la periodización adaptativa ilimitada, métricas PMC avanzadas y exportaciones TCX ilimitadas.
              </p>
            </div>

            <div className="space-y-2">
              <AnimatedButton
                variant="secondary"
                onClick={async () => {
                  setLoading(true);
                  try {
                    const res = await updateSubscriptionStatus('free');
                    if (res && res.error) {
                      alert(res.error);
                    } else {
                      setShowCancelModal(false);
                    }
                  } catch (err) {
                    console.error(err);
                  } finally {
                    setLoading(false);
                  }
                }}
                disabled={loading}
                className="w-full py-3 text-xs font-bold bg-zinc-900 border border-zinc-800 text-red-400 hover:bg-red-500/10 hover:border-red-500/20 hover:text-red-300"
              >
                {loading ? 'Cancelando...' : 'Confirmar Cancelación'}
              </AnimatedButton>
              <AnimatedButton
                variant="primary"
                onClick={() => setShowCancelModal(false)}
                disabled={loading}
                className="w-full py-3 text-xs font-bold"
              >
                Mantener Mi Plan Pro
              </AnimatedButton>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
