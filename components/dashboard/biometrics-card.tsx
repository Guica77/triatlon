'use client'

import * as React from 'react'
import { ProCard } from '@/components/ui/pro-card'
import { AnimatedButton } from '@/components/ui/animated-button'
import { Activity, Moon, Heart, Settings, Flame, Brain } from 'lucide-react'
import { DailyBiometrics, updateBiometrics, calculateReadiness } from '@/app/dashboard/biometrics-actions'
import { BiometricsModal } from '@/components/dashboard/biometrics-modal'

interface BiometricsCardProps {
  initialBiometrics: DailyBiometrics
}

export function BiometricsCard({ initialBiometrics }: BiometricsCardProps) {
  const [biometrics, setBiometrics] = React.useState<DailyBiometrics>(initialBiometrics)
  const [isModalOpen, setIsModalOpen] = React.useState(false)
  const [statusLabels, setStatusLabels] = React.useState({
    sleepStatus: 'Óptimo',
    hrvStatus: '+12% vs Media',
    rhrStatus: 'Óptimo',
  })

  // Calcular etiquetas de estado iniciales
  React.useEffect(() => {
    async function loadStatus() {
      if (biometrics) {
        const res = await calculateReadiness(
          biometrics.hrv || 68,
          biometrics.rhr || 48,
          biometrics.sleep_hours || 7.8,
          biometrics.fatigue_rating || 2,
          biometrics.stress_level || 2
        )
        if (res?.data) {
          setStatusLabels({
            sleepStatus: res.data.sleepStatus,
            hrvStatus: res.data.hrvStatus,
            rhrStatus: res.data.rhrStatus,
          })
          setBiometrics(prev => ({ ...prev, readiness_score: res.data.readiness_score }))
        }
      }
    }
    loadStatus()
  }, [biometrics?.hrv, biometrics?.rhr, biometrics?.sleep_hours, biometrics?.fatigue_rating, biometrics?.stress_level])

  if (!biometrics) return null

  async function handleSaveBiometrics(formData: Partial<DailyBiometrics>) {
    // Actualizar estado local optimista
    const updated: DailyBiometrics = {
      ...biometrics,
      ...formData,
    }
    setBiometrics(updated)

    // Llamar a Server Action
    await updateBiometrics(formData)
  }

  const score = biometrics.readiness_score || 85
  const isOptimal = score >= 80
  const isModerate = score >= 60 && score < 80

  const ringColor = isOptimal
    ? 'border-emerald-500 text-emerald-400 bg-emerald-500/10'
    : isModerate
    ? 'border-amber-500 text-amber-400 bg-amber-500/10'
    : 'border-rose-500 text-rose-400 bg-rose-500/10'

  const statusText = isOptimal
    ? 'Cuerpo recuperado y listo para alta intensidad'
    : isModerate
    ? 'Recuperación moderada. Prioriza rodajes aeróbicos'
    : 'Fatiga acumulada. Se recomienda descanso o recuperación activa'

  return (
    <>
      <ProCard className="space-y-6 relative overflow-hidden border-zinc-800/80 bg-zinc-900/60 backdrop-blur-xl">
        {/* Esquina decorativa de brillo */}
        <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-emerald-500/5 blur-3xl pointer-events-none" />

        {/* Cabecera */}
        <div className="flex justify-between items-center border-b border-zinc-800/80 pb-4 relative z-10">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-semibold tracking-widest text-zinc-400 uppercase">Biometría y Preparación</span>
          </div>
          <AnimatedButton
            variant="secondary"
            size="sm"
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 text-xs py-1.5 px-3 border-zinc-700 hover:border-zinc-600"
          >
            <Settings className="w-3.5 h-3.5 text-zinc-400" />
            <span>Ajustar Diario</span>
          </AnimatedButton>
        </div>

        {/* Sección Principal: Anillo y Estado */}
        <div className="flex flex-col md:flex-row items-center gap-6 relative z-10 py-2">
          <div className={`w-24 h-24 rounded-full border-8 flex items-center justify-center shadow-lg ${ringColor}`}>
            <span className="text-3xl font-light tracking-tight text-zinc-50">{score}</span>
          </div>
          <div className="text-center md:text-left space-y-1">
            <div className="flex items-center justify-center md:justify-start gap-2">
              <h3 className="text-xl font-medium text-zinc-50">
                {isOptimal ? 'Readiness Óptimo' : isModerate ? 'Readiness Moderado' : 'Descanso Recomendado'}
              </h3>
              <span className={`w-2 h-2 rounded-full ${isOptimal ? 'bg-emerald-400 shadow-lg shadow-emerald-400/50' : isModerate ? 'bg-amber-400' : 'bg-rose-400'}`} />
            </div>
            <p className="text-sm text-zinc-400 max-w-sm leading-relaxed">
              {statusText}
            </p>
          </div>
        </div>

        {/* Grid de Desglose de Factores Objetivos */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 relative z-10">
          
          {/* Sueño */}
          <div className="p-4 rounded-xl bg-zinc-950/40 border border-zinc-800/60 flex flex-col justify-between space-y-1">
            <div className="flex items-center justify-between text-zinc-500">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">SUEÑO</span>
              <Moon className="w-3.5 h-3.5" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-semibold text-zinc-100">{biometrics.sleep_hours}</span>
              <span className="text-xs text-zinc-500">h</span>
            </div>
            <span className="text-[11px] font-medium text-emerald-400">{statusLabels.sleepStatus}</span>
          </div>

          {/* HRV */}
          <div className="p-4 rounded-xl bg-zinc-950/40 border border-zinc-800/60 flex flex-col justify-between space-y-1">
            <div className="flex items-center justify-between text-zinc-500">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">HRV</span>
              <Heart className="w-3.5 h-3.5" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-semibold text-zinc-100">{biometrics.hrv}</span>
              <span className="text-xs text-zinc-500">ms</span>
            </div>
            <span className="text-[11px] font-medium text-emerald-400">{statusLabels.hrvStatus}</span>
          </div>

          {/* RHR */}
          <div className="p-4 rounded-xl bg-zinc-950/40 border border-zinc-800/60 flex flex-col justify-between space-y-1">
            <div className="flex items-center justify-between text-zinc-500">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">RHR</span>
              <Activity className="w-3.5 h-3.5" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-semibold text-zinc-100">{biometrics.rhr}</span>
              <span className="text-xs text-zinc-500">bpm</span>
            </div>
            <span className="text-[11px] font-medium text-emerald-400">{statusLabels.rhrStatus}</span>
          </div>

        </div>

        {/* Factores Subjetivos (Atleta) */}
        <div className="flex flex-wrap gap-3 pt-2 relative z-10 border-t border-zinc-800/60 mt-4">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-950/40 border border-zinc-800 text-xs text-zinc-300">
            <Flame className="w-3.5 h-3.5 text-amber-500" />
            <span>Fatiga Muscular: <strong className="text-amber-400">Nivel {biometrics.fatigue_rating}/5</strong></span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-950/40 border border-zinc-800 text-xs text-zinc-300">
            <Brain className="w-3.5 h-3.5 text-emerald-400" />
            <span>Carga Mental: <strong className="text-emerald-400">Nivel {biometrics.stress_level}/5</strong></span>
          </div>
        </div>

      </ProCard>

      {/* Modal Interactivo */}
      <BiometricsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialData={biometrics}
        onSave={handleSaveBiometrics}
      />
    </>
  )
}
