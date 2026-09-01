'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Zap, ChevronLeft } from 'lucide-react';
import { ProCard } from '@/components/ui/pro-card';

interface StepTelemetryProps {
  loading: boolean;
  onPrev: () => void;
  handleSave: () => Promise<void>;
  handleSaveAndConnect: (provider: 'strava' | 'garmin' | 'coros') => Promise<void>;
}

export function StepTelemetry(props: StepTelemetryProps) {
  const [activeModal, setActiveModal] = React.useState<'strava' | 'garmin' | 'coros' | 'strava_confirm' | null>(null);
  const [username, setUsername] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [isConnecting, setIsConnecting] = React.useState(false);

  const handleConnectClick = (provider: 'strava' | 'garmin' | 'coros') => {
    if (provider === 'strava') {
      window.open('/api/auth/telemetry/connect?provider=strava&onboarding=true&popup=true', '_blank');
      setActiveModal('strava_confirm');
    } else {
      setActiveModal(provider);
    }
  };

  const handleConfirmConnect = async () => {
    if (!activeModal) return;
    setIsConnecting(true);
    // Simulamos un pequeño delay de validación
    await new Promise(r => setTimeout(r, 1000));
    await props.handleSaveAndConnect(activeModal === 'strava_confirm' ? 'strava' : activeModal);
    setIsConnecting(false);
    setActiveModal(null);
  };

  return (
    <motion.div key="step4" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-6">
      <ProCard className="space-y-6 bg-surface-card border border-border-default shadow-card">
        <div className="border-b border-border-default pb-4">
          <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
            <Activity className="w-5 h-5 text-coral-500 animate-pulse" /> Conectar Reloj y Telemetría
          </h2>
          <p className="text-sm text-text-secondary mt-1">
            Sincroniza tus entrenamientos reales automáticamente. La Inteligencia Artificial necesita leer tu pulso, ritmos y fatiga para ajustar tu periodización diaria.
          </p>
        </div>

        <div className="space-y-6">
          <div className="p-5 rounded-xl bg-coral-500/10 border border-coral-500/30">
            <h3 className="text-sm font-bold text-coral-500 mb-3 flex items-center gap-2">
              <Zap className="w-4 h-4" /> ¿Cómo funciona el ecosistema Triatlon Pro?
            </h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-2.5">
                <div className="w-5 h-5 rounded bg-surface-hover border border-border-default flex items-center justify-center text-xs font-bold text-text-secondary shrink-0 mt-0.5">1</div>
                <p className="text-xs text-text-secondary leading-relaxed font-semibold">
                  <strong className="text-text-primary font-bold">IA Dinámica:</strong> Cada día la Inteligencia Artificial analiza tus métricas y genera tus entrenamientos (series, ritmos, potencias) a medida en el Dashboard.
                </p>
              </li>
              <li className="flex items-start gap-2.5">
                <div className="w-5 h-5 rounded bg-surface-hover border border-border-default flex items-center justify-center text-xs font-bold text-text-secondary shrink-0 mt-0.5">2</div>
                <p className="text-xs text-text-secondary leading-relaxed font-semibold">
                  <strong className="text-text-primary font-bold">Envío a tu Reloj:</strong> Una vez completado el onboarding, en tu Dashboard tendrás un botón para <strong className="text-text-primary">"Enviar al Reloj"</strong>. Esto descargará el entrenamiento estructurado en un archivo <strong className="text-text-primary">.TCX</strong> que puedes importar manualmente en tu cuenta web de Garmin Connect o Coros Training Hub.
                </p>
              </li>
              <li className="flex items-start gap-2.5">
                <div className="w-5 h-5 rounded bg-surface-hover border border-border-default flex items-center justify-center text-xs font-bold text-text-secondary shrink-0 mt-0.5">3</div>
                <p className="text-xs text-text-secondary leading-relaxed font-semibold">
                  <strong className="text-text-primary font-bold">Entrenamiento Guiado:</strong> Simplemente dale a "Iniciar Entrenamiento" en tu reloj. Tu dispositivo te guiará y vibrará en cada serie (ej. "Rueda a 250W por 5 min").
                </p>
              </li>
              <li className="flex items-start gap-2.5">
                <div className="w-5 h-5 rounded bg-surface-hover border border-border-default flex items-center justify-center text-xs font-bold text-text-secondary shrink-0 mt-0.5">4</div>
                <p className="text-xs text-text-secondary leading-relaxed font-semibold">
                  <strong className="text-text-primary font-bold">Sincronización Mágica:</strong> Cuando terminas de sudar, tu reloj sube la actividad a Strava. Nuestra IA la lee al instante, la vincula con tu sesión planificada y recalcula tu fatiga y progreso diario.
                </p>
              </li>
            </ul>
          </div>

          <div className="p-4 rounded-xl bg-coral-500/10 border border-coral-500/30 text-xs text-coral-500 leading-relaxed font-semibold space-y-2">
            <p className="text-center text-sm font-bold text-coral-500 mb-2">¿Cómo conecto mi reloj?</p>
            <p>
              Admitimos conexión directa oficial para <strong className="text-coral-500 font-bold">Garmin</strong> y <strong className="text-coral-500 font-bold">Coros</strong>, o puedes usar <strong className="text-coral-500 font-bold">Strava</strong> como puente de sincronización universal para otras marcas (Suunto, Polar, Apple Watch).
            </p>
            <ol className="list-decimal pl-4 space-y-1.5 text-coral-500/90">
              <li>Haz click en el botón de tu reloj abajo para sincronizarlo directamente.</li>
              <li>Si usas otra marca de dispositivo, conéctalo a través de Strava Bridge.</li>
            </ol>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl mx-auto">
            {/* Garmin direct button */}
            <button
              onClick={() => handleConnectClick('garmin')}
              disabled={props.loading}
              className="flex flex-col items-center justify-center p-5 rounded-2xl border border-border-default bg-surface-hover/30 hover:bg-swim/10 hover:border-swim/50 hover:ring-1 hover:ring-swim/50 transition-all group relative overflow-hidden text-center cursor-pointer"
            >
              <span className="text-3xl mb-3 block">⌚</span>
              <span className="text-sm font-bold text-text-primary group-hover:text-swim transition-colors">Conectar Garmin</span>
              <span className="text-[10px] text-text-muted mt-1 uppercase tracking-wider font-semibold">Directo / Oficial</span>
            </button>

            {/* Strava Bridge button */}
            <button
              onClick={() => handleConnectClick('strava')}
              disabled={props.loading}
              className="flex flex-col items-center justify-center p-5 rounded-2xl border border-border-default bg-surface-hover/30 hover:bg-coral-500/10 hover:border-coral-500/50 hover:ring-1 hover:ring-coral-500/50 transition-all group relative overflow-hidden text-center cursor-pointer"
            >
              <span className="text-3xl mb-3 block">🔄</span>
              <span className="text-sm font-bold text-text-primary group-hover:text-coral-500 transition-colors">Conectar Strava</span>
              <span className="text-[10px] text-text-muted mt-1 uppercase tracking-wider font-semibold">Vía Strava Bridge</span>
            </button>
          </div>
        </div>
        
        <div className="flex justify-between pt-4 border-t border-border-default">
          <button onClick={props.onPrev} className="px-6 py-3 text-sm font-semibold text-text-secondary hover:text-text-primary transition flex items-center cursor-pointer"><ChevronLeft className="w-4 h-4 mr-1" /> Atrás</button>
          <button
            onClick={props.handleSave}
            disabled={props.loading}
            className="px-6 py-3 text-sm font-bold text-text-secondary hover:text-text-primary transition-all cursor-pointer"
          >
            {props.loading ? 'Generando IA Plan...' : 'Saltar y finalizar'}
          </button>
        </div>
      </ProCard>

      {/* Modal de Credenciales */}
      <AnimatePresence>
        {activeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-surface-app/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-surface-card rounded-2xl shadow-elevated p-6 w-full max-w-sm relative"
            >
              {activeModal === 'strava_confirm' ? (
                <div className="text-center">
                  <h3 className="text-lg font-bold text-text-primary mb-2">Conexión con Strava</h3>
                  <p className="text-sm text-text-secondary mb-6">Se ha abierto una nueva pestaña para que autorices la conexión de forma segura. Una vez hayas terminado, vuelve a esta pestaña y pulsa Continuar.</p>
                  
                  <button 
                    onClick={async () => {
                      setIsConnecting(true);
                      await props.handleSaveAndConnect('strava');
                      setIsConnecting(false);
                      setActiveModal(null);
                    }}
                    disabled={isConnecting}
                    className="w-full py-3 text-sm font-bold text-white bg-coral-500 rounded-xl hover:bg-coral-600 transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    {isConnecting ? 'Generando Plan...' : 'Ya me he conectado (Continuar)'}
                  </button>
                  <button 
                    onClick={() => setActiveModal(null)} 
                    className="w-full mt-3 py-2 text-xs font-semibold text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                </div>
              ) : (
                <>
                  <h3 className="text-lg font-bold text-text-primary mb-1 capitalize">Conectar {activeModal}</h3>
                  <p className="text-xs text-text-secondary mb-6">Introduce tus credenciales para autorizar el acceso a tus entrenamientos.</p>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-bold text-text-primary block mb-1">Email / Usuario</label>
                      <input 
                        type="text" 
                        value={username}
                        onChange={e => setUsername(e.target.value)}
                        className="w-full bg-surface-hover border border-border-default rounded-lg px-3 py-2 text-sm focus:border-coral-500 outline-none" 
                        placeholder="tu@email.com"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-text-primary block mb-1">Contraseña / API Key</label>
                      <input 
                        type="password" 
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        className="w-full bg-surface-hover border border-border-default rounded-lg px-3 py-2 text-sm focus:border-coral-500 outline-none" 
                        placeholder="••••••••"
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 mt-8">
                    <button 
                      onClick={() => setActiveModal(null)} 
                      className="flex-1 py-2.5 text-sm font-semibold text-text-secondary bg-surface-hover rounded-xl hover:bg-border-default transition-colors cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button 
                      onClick={handleConfirmConnect}
                      disabled={isConnecting || !username || !password}
                      className="flex-1 py-2.5 text-sm font-bold text-white bg-coral-500 rounded-xl hover:bg-coral-600 transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      {isConnecting ? 'Conectando...' : 'Autorizar'}
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
