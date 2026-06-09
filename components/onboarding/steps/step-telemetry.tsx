'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { Activity, Zap, ChevronLeft } from 'lucide-react';
import { ProCard } from '@/components/ui/pro-card';

interface StepTelemetryProps {
  loading: boolean;
  onPrev: () => void;
  handleSave: () => Promise<void>;
  handleSaveAndConnect: (provider: 'strava' | 'garmin') => Promise<void>;
}

export function StepTelemetry(props: StepTelemetryProps) {
  return (
    <motion.div key="step4" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-6">
      <ProCard className="space-y-6">
        <div className="border-b border-zinc-800/80 pb-4">
          <h2 className="text-xl font-medium text-zinc-100 flex items-center gap-2">
            <Activity className="w-5 h-5 text-orange-500 animate-pulse" /> Conectar Reloj y Telemetría
          </h2>
          <p className="text-sm text-zinc-400 mt-1">
            Sincroniza tus entrenamientos reales automáticamente. La Inteligencia Artificial necesita leer tu pulso, ritmos y fatiga para ajustar tu periodización diaria.
          </p>
        </div>

        <div className="space-y-6">
          <div className="p-5 rounded-xl bg-orange-500/5 border border-orange-500/20">
            <h3 className="text-sm font-bold text-orange-400 mb-3 flex items-center gap-2">
              <Zap className="w-4 h-4" /> ¿Cómo funciona el ecosistema Triatlon Pro?
            </h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-2.5">
                <div className="w-5 h-5 rounded bg-zinc-900 border border-zinc-700 flex items-center justify-center text-xs font-bold text-zinc-300 shrink-0 mt-0.5">1</div>
                <p className="text-xs text-zinc-300 leading-relaxed">
                  <strong className="text-white">IA Dinámica:</strong> Cada día la Inteligencia Artificial analiza tus métricas y genera tus entrenamientos (series, ritmos, potencias) a medida en el Dashboard.
                </p>
              </li>
              <li className="flex items-start gap-2.5">
                <div className="w-5 h-5 rounded bg-zinc-900 border border-zinc-700 flex items-center justify-center text-xs font-bold text-zinc-300 shrink-0 mt-0.5">2</div>
                <p className="text-xs text-zinc-300 leading-relaxed">
                  <strong className="text-white">Envío a tu Reloj:</strong> Una vez completado el onboarding, en la pestaña <strong>Configuración</strong> tendrás un botón para "Enviar Entrenos a Garmin/Coros". Esto volcará toda la semana en tu reloj.
                </p>
              </li>
              <li className="flex items-start gap-2.5">
                <div className="w-5 h-5 rounded bg-zinc-900 border border-zinc-700 flex items-center justify-center text-xs font-bold text-zinc-300 shrink-0 mt-0.5">3</div>
                <p className="text-xs text-zinc-300 leading-relaxed">
                  <strong className="text-white">Entrenamiento Guiado:</strong> Simplemente dale a "Iniciar Entrenamiento" en tu reloj. Tu dispositivo te guiará y vibrará en cada serie (ej. "Rueda a 250W por 5 min").
                </p>
              </li>
              <li className="flex items-start gap-2.5">
                <div className="w-5 h-5 rounded bg-zinc-900 border border-zinc-700 flex items-center justify-center text-xs font-bold text-zinc-300 shrink-0 mt-0.5">4</div>
                <p className="text-xs text-zinc-300 leading-relaxed">
                  <strong className="text-white">Marketplace IA:</strong> Si te falta material (ej. Neopreno), nuestro rastreador automático de Wallapop te buscará chollos rebajados.
                </p>
              </li>
              <li className="flex items-start gap-2.5">
                <div className="w-5 h-5 rounded bg-zinc-900 border border-zinc-700 flex items-center justify-center text-xs font-bold text-zinc-300 shrink-0 mt-0.5">5</div>
                <p className="text-xs text-zinc-300 leading-relaxed">
                  <strong className="text-white">Sincronización Mágica:</strong> Cuando terminas de sudar, tu reloj sube la actividad a Strava. Nuestra IA la lee al instante, la vincula con tu sesión planificada y recalcula tu fatiga y progreso diario.
                </p>
              </li>
            </ul>
          </div>

          <div className="p-4 rounded-xl bg-orange-500/10 border border-orange-500/30 text-xs text-orange-200/90 leading-relaxed font-medium space-y-2">
            <p className="text-center text-sm font-bold text-white mb-2">¿Cómo conecto mi reloj?</p>
            <p>
              Usamos <strong>Strava</strong> como puente universal y seguro. Sigue estos 2 pasos:
            </p>
            <ol className="list-decimal pl-4 space-y-1.5 text-orange-100/80">
              <li>Haz click en uno de los botones de abajo. Te redirigiremos de forma segura a Strava.</li>
              <li>Inicia sesión con tu cuenta de Strava y dale a "Autorizar". ¡Listo!</li>
            </ol>
            <p className="pt-1 text-orange-300/80 italic text-[11px]">
              * Si tienes un Garmin, Coros o Apple Watch, asegúrate de que tu reloj esté vinculado a tu app de Strava para que podamos leer tus datos a través de ella.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Garmin Connect button */}
            <button
              onClick={() => props.handleSaveAndConnect('garmin')}
              disabled={props.loading}
              className="flex flex-col items-center justify-center p-6 rounded-2xl border border-zinc-800/80 bg-zinc-950/40 hover:bg-orange-500/5 hover:border-orange-500/30 transition-all group relative overflow-hidden"
            >
              <span className="text-3xl mb-3 block">🛰️</span>
              <span className="text-sm font-bold text-white group-hover:text-orange-400 transition-colors">Conectar Garmin</span>
              <span className="text-[10px] text-zinc-500 mt-1 uppercase tracking-wider font-semibold">Vía Garmin Connect</span>
            </button>

            {/* Coros/Suunto/Otros button */}
            <button
              onClick={() => props.handleSaveAndConnect('strava')}
              disabled={props.loading}
              className="flex flex-col items-center justify-center p-6 rounded-2xl border border-zinc-800/80 bg-zinc-950/40 hover:bg-orange-500/5 hover:border-orange-500/30 transition-all group relative overflow-hidden"
            >
              <span className="text-3xl mb-3 block">⌚</span>
              <span className="text-sm font-bold text-white group-hover:text-orange-400 transition-colors">Conectar Coros / Suunto</span>
              <span className="text-[10px] text-zinc-500 mt-1 uppercase tracking-wider font-semibold">Vía Strava Bridge</span>
            </button>
          </div>
        </div>
        
        <div className="flex justify-between pt-4 border-t border-zinc-800/80">
          <button onClick={props.onPrev} className="px-6 py-3 text-sm font-semibold text-zinc-400 hover:text-white transition flex items-center"><ChevronLeft className="w-4 h-4 mr-1" /> Atrás</button>
          <button
            onClick={props.handleSave}
            disabled={props.loading}
            className="px-6 py-3 text-sm font-semibold text-zinc-500 hover:text-zinc-300 transition-all"
          >
            {props.loading ? 'Generando IA Plan...' : 'Saltar y finalizar'}
          </button>
        </div>
      </ProCard>
    </motion.div>
  );
}
