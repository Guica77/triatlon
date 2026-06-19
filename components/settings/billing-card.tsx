'use client';

import * as React from 'react';
import { CreditCard, Check, Sparkles, RefreshCw, X, Lock } from 'lucide-react';
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
    ? 'Funciones de periodización avanzada, análisis de fatiga PMC y exportación estructurada de TCX ilimitada.'
    : 'Roster ilimitado, tarifa plana sin cobros extras, panel de control de alertas (HRV/TSS), asignación de planes y chat.';

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
      <div className="p-6 rounded-2xl bg-white border border-zinc-200 shadow-sm relative h-full flex flex-col justify-between group overflow-hidden">
        {/* Decorative ambient background */}
        {status && status !== 'free' && (
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />
        )}

        <div className="space-y-5">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shadow-sm ${
                  status && status !== 'free' ? 'bg-emerald-50 border border-emerald-100' : 'bg-zinc-50 border border-zinc-200'
                }`}>
                  <CreditCard className={`w-4 h-4 ${status && status !== 'free' ? 'text-emerald-600' : 'text-zinc-500'}`} />
                </div>
                <h3 className="text-sm sm:text-base font-bold text-zinc-900 tracking-tight leading-tight">Facturación</h3>
              </div>
              
              <span className={`text-[10px] uppercase tracking-widest font-black px-2.5 py-1 rounded-full border ${
                status && status !== 'free'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 shadow-sm' 
                  : 'bg-zinc-50 text-zinc-500 border-zinc-200'
              }`}>
                {isCoach ? 'Entrenador' : isPro ? 'Atleta Pro' : 'Plan Free'}
              </span>
            </div>

            {/* Plan Tabs Selection */}
            {(!isPro && !isCoach) && (
              <div className="grid grid-cols-2 gap-1 p-1 bg-zinc-100 rounded-xl border border-zinc-200 shadow-sm">
                <button
                  onClick={() => setActiveTab('pro')}
                  className={`py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    activeTab === 'pro' 
                      ? 'bg-white text-zinc-900 shadow-sm border border-zinc-200/50' 
                      : 'text-zinc-500 hover:text-zinc-800'
                  }`}
                >
                  Atleta
                </button>
                <button
                  onClick={() => setActiveTab('coach')}
                  className={`py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    activeTab === 'coach' 
                      ? 'bg-white text-zinc-900 shadow-sm border border-zinc-200/50' 
                      : 'text-zinc-500 hover:text-zinc-800'
                  }`}
                >
                  Entrenador
                </button>
              </div>
            )}

            {isPro && (
              <div className="flex justify-between items-center bg-cyan-50/50 border border-cyan-150 p-2.5 rounded-xl">
                <span className="text-[11px] text-zinc-650 font-semibold">¿Eres entrenador?</span>
                <button
                  onClick={() => setActiveTab('coach')}
                  className="px-2.5 py-1 bg-cyan-100 text-cyan-700 hover:bg-cyan-200 rounded-lg text-[10px] font-black border border-cyan-200 transition-colors cursor-pointer"
                >
                  Subir a Entrenador
                </button>
              </div>
            )}
          </div>

          {/* Plan price / details */}
          <div className="space-y-1">
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-black text-zinc-900">{planPrice}</span>
              <span className="text-xs text-zinc-500 font-medium">/ mes</span>
            </div>
            {currentPlanActive && (
              <p className="text-[9px] text-emerald-700 font-black tracking-wider uppercase bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md inline-block">
                Próxima renovación: 26 de Junio de 2026
              </p>
            )}
            <p className="text-xs text-zinc-500 font-medium leading-relaxed pt-1">
              {planDescription}
            </p>
          </div>

          {/* Benefits list */}
          <div className="border-t border-zinc-250/80 pt-4 space-y-2.5">
            <span className="text-[10px] text-zinc-450 uppercase tracking-widest font-black block mb-1">
              {currentPlanActive ? 'Beneficios Activos' : `Ventajas del ${planName}`}
            </span>
            
            <div className="space-y-2">
              {benefitsList.map((benefit, idx) => (
                <div key={idx} className="flex items-center gap-2 text-xs">
                  <Check className={`w-3.5 h-3.5 shrink-0 ${currentPlanActive ? 'text-emerald-600' : 'text-zinc-400'}`} />
                  <span className={`font-semibold ${currentPlanActive ? 'text-zinc-700' : 'text-zinc-550'}`}>{benefit}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-zinc-200 mt-6 shrink-0">
          <AnimatedButton
            variant={currentPlanActive ? 'ghost' : 'primary'}
            onClick={handleButtonClick}
            disabled={loading}
            className={`w-full py-3 text-xs font-black flex items-center justify-center gap-1.5 cursor-pointer ${
              currentPlanActive 
                ? 'border-zinc-200 text-zinc-650 hover:bg-rose-50 hover:border-red-200 hover:text-red-650 transition-all shadow-sm'
                : '!bg-cyan-650 hover:!bg-cyan-550 !text-white shadow-md'
            }`}
          >
            {currentPlanActive ? (
              'Cancelar Suscripción'
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                {status && status !== 'free' ? 'Cambiar a este Plan' : `Activar ${planName}`}
              </>
            )}
          </AnimatedButton>
        </div>
      </div>

      {/* Modal de Pago */}
      {showPayModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-zinc-900/45 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white border border-zinc-200 rounded-3xl w-full max-w-md p-6 relative shadow-2xl space-y-6 text-left">
            {/* Cierre */}
            <button 
              onClick={() => { if (!loading && !paymentSuccess) setShowPayModal(false); }}
              title="Cerrar modal"
              aria-label="Cerrar modal"
              className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-800 transition-colors cursor-pointer"
              disabled={loading || paymentSuccess}
            >
              <X className="w-5 h-5" />
            </button>
 
            {/* Cabecera */}
            <div className="text-center space-y-2">
              <div className="mx-auto w-12 h-12 rounded-full bg-cyan-50 border border-cyan-150 flex items-center justify-center text-cyan-600">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black text-zinc-900">Pasarela de Pago Segura</h3>
              <p className="text-xs text-zinc-500 font-medium flex items-center justify-center gap-1">
                <Lock className="w-3.5 h-3.5 text-emerald-600" /> Sincronización simulada encriptada
              </p>
            </div>

            {paymentSuccess ? (
              <div className="text-center py-6 space-y-4">
                <div className="mx-auto w-16 h-16 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
                  <Check className="w-8 h-8 stroke-[3]" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-zinc-900 font-black text-base">¡Suscripción Activada!</h4>
                  <p className="text-xs text-zinc-500 font-medium max-w-xs mx-auto">
                    Tu plan ha sido actualizado correctamente. Ya puedes usar las nuevas herramientas adaptativas.
                  </p>
                </div>
              </div>
            ) : (
              <form onSubmit={async (e) => {
                e.preventDefault();
                setLoading(true);
                await new Promise((resolve) => setTimeout(resolve, 1500));
                try {
                  const res = await updateSubscriptionStatus(activeTab);
                  if (res && res.error) {
                    alert(res.error);
                  } else {
                    setPaymentSuccess(true);
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
                {/* Tarjeta de Crédito Visual (Keep dark/sleek for realism) */}
                <div className="h-40 rounded-2xl bg-gradient-to-br from-zinc-800 to-zinc-950 border border-zinc-700/80 p-5 flex flex-col justify-between shadow-lg relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Tarifa Plana Atleta Pro</span>
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
                    <label className="text-[10px] text-zinc-500 uppercase tracking-wider font-black">Titular de la Tarjeta</label>
                    <input 
                      type="text" 
                      value={nameOnCard}
                      onChange={(e) => setNameOnCard(e.target.value)}
                      required
                      className="w-full bg-white border border-zinc-200 focus:border-cyan-550 focus:ring-1 focus:ring-cyan-550 rounded-xl p-3 text-xs text-zinc-900 outline-none transition-colors"
                      placeholder="Nombre y Apellidos"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-zinc-500 uppercase tracking-wider font-black">Número de Tarjeta (Stripe Test)</label>
                    <input 
                      type="text" 
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      maxLength={19}
                      required
                      className="w-full bg-white border border-zinc-200 focus:border-cyan-550 focus:ring-1 focus:ring-cyan-550 rounded-xl p-3 text-xs text-zinc-900 font-mono outline-none transition-colors"
                      placeholder="4242 4242 4242 4242"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] text-zinc-500 uppercase tracking-wider font-black">Vencimiento</label>
                      <input 
                        type="text" 
                        value={expiry}
                        onChange={(e) => setExpiry(e.target.value)}
                        maxLength={5}
                        required
                        className="w-full bg-white border border-zinc-200 focus:border-cyan-550 focus:ring-1 focus:ring-cyan-550 rounded-xl p-3 text-xs text-zinc-900 font-mono outline-none transition-colors"
                        placeholder="MM/AA"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-zinc-500 uppercase tracking-wider font-black">CVC</label>
                      <input 
                        type="password" 
                        value={cvc}
                        onChange={(e) => setCvc(e.target.value)}
                        maxLength={4}
                        required
                        className="w-full bg-white border border-zinc-200 focus:border-cyan-550 focus:ring-1 focus:ring-cyan-550 rounded-xl p-3 text-xs text-zinc-900 font-mono outline-none transition-colors"
                        placeholder="•••"
                      />
                    </div>
                  </div>
                </div>

                <AnimatedButton
                  variant="primary"
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 text-xs font-black !bg-cyan-650 hover:!bg-cyan-550 !text-white shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Procesando Pago Seguro...
                    </>
                  ) : (
                    <>
                      <Lock className="w-3.5 h-3.5" />
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-zinc-900/45 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white border border-zinc-200 rounded-3xl w-full max-w-sm p-6 relative shadow-2xl space-y-6 text-left">
            {/* Cabecera */}
            <div className="text-center space-y-2">
              <h3 className="text-lg font-black text-zinc-900">¿Cancelar Suscripción?</h3>
              <p className="text-xs text-zinc-500 leading-relaxed font-semibold">
                Perderás el acceso inmediato a la periodización adaptativa avanzada, PMC y exportaciones estructuradas a Garmin.
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
                className="w-full py-3 text-xs font-black bg-white border border-red-200 text-red-650 hover:bg-rose-50 hover:border-red-300 hover:text-red-700 cursor-pointer shadow-sm"
              >
                {loading ? 'Cancelando...' : 'Confirmar Cancelación'}
              </AnimatedButton>
              <AnimatedButton
                variant="primary"
                onClick={() => setShowCancelModal(false)}
                disabled={loading}
                className="w-full py-3 text-xs font-black !bg-zinc-100 hover:!bg-zinc-200 !text-zinc-850 cursor-pointer"
              >
                Mantener Mi Plan
              </AnimatedButton>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
