'use client'
 
import * as React from 'react'
import { ProCard } from '@/components/ui/pro-card'
import { AnimatedButton } from '@/components/ui/animated-button'
import { Activity, Moon, Heart, Settings, Flame, Brain } from 'lucide-react'
import { DailyBiometrics, updateBiometrics, calculateReadiness } from '@/app/(app)/dashboard/biometrics-actions'
import { BiometricsModal } from '@/components/dashboard/biometrics-modal'
 
interface BiometricsCardProps {
  initialBiometrics: DailyBiometrics
  readOnly?: boolean
}
 
export function BiometricsCard({ initialBiometrics, readOnly = false }: BiometricsCardProps) {
  const [biometrics, setBiometrics] = React.useState<DailyBiometrics>(initialBiometrics)
  const [isModalOpen, setIsModalOpen] = React.useState(false)
  const [statusLabels, setStatusLabels] = React.useState({
    sleepStatus: 'Pendiente',
    hrvStatus: 'Pendiente',
    rhrStatus: 'Pendiente',
  })
 
  const isRegistered = biometrics.readiness_score !== null
 
  // Calcular etiquetas de estado cuando las métricas son reales
  React.useEffect(() => {
    async function loadStatus() {
      if (biometrics && biometrics.readiness_score !== null && biometrics.hrv !== null) {
        const res = await calculateReadiness(
          biometrics.hrv,
          biometrics.rhr || 52,
          biometrics.sleep_hours || 7.5,
          biometrics.fatigue_rating || 2,
          biometrics.stress_level || 2
        )
        if (res?.data) {
          setStatusLabels({
            sleepStatus: res.data.sleepStatus,
            hrvStatus: res.data.hrvStatus,
            rhrStatus: res.data.rhrStatus,
          })
          if (biometrics.readiness_score !== res.data.readiness_score) {
            setBiometrics(prev => ({ ...prev, readiness_score: res.data.readiness_score }))
          }
        }
      } else {
        setStatusLabels({
          sleepStatus: 'Pendiente',
          hrvStatus: 'Pendiente',
          rhrStatus: 'Pendiente',
        })
      }
    }
    loadStatus()
  }, [biometrics?.hrv, biometrics?.rhr, biometrics?.sleep_hours, biometrics?.fatigue_rating, biometrics?.stress_level, biometrics?.readiness_score])
 
  if (!biometrics) return null
 
  async function handleSaveBiometrics(formData: Partial<DailyBiometrics>) {
    const hrv = formData.hrv ?? 65
    const rhr = formData.rhr ?? 52
    const sleep_hours = formData.sleep_hours ?? 7.5
    const fatigue_rating = formData.fatigue_rating ?? 2
    const stress_level = formData.stress_level ?? 2
 
    const res = await calculateReadiness(hrv, rhr, sleep_hours, fatigue_rating, stress_level)
    const readiness_score = res.data?.readiness_score ?? 85
 
    if (res?.data) {
      setStatusLabels({
        sleepStatus: res.data.sleepStatus,
        hrvStatus: res.data.hrvStatus,
        rhrStatus: res.data.rhrStatus,
      })
    }
 
    const updated: DailyBiometrics = {
      ...biometrics,
      ...formData,
      readiness_score,
    }
    setBiometrics(updated)
 
    // Llamar a Server Action
    await updateBiometrics(formData)
  }
 
  const score = biometrics.readiness_score || 85
  const isOptimal = score >= 80
  const isModerate = score >= 60 && score < 80
 
  const statusText = !isRegistered
    ? 'Completa tu registro matutino para calcular tu Readiness y recibir recomendaciones.'
    : isOptimal
    ? 'Cuerpo recuperado y listo para alta intensidad'
    : isModerate
    ? 'Recuperación moderada. Prioriza rodajes aeróbicos'
    : 'Fatiga acumulada. Se recomienda descanso o recuperación activa'
 
  return (
    <>
      <ProCard className="p-4 sm:p-6 space-y-6 relative overflow-hidden border-zinc-200 bg-white shadow-sm">
        {/* Cabecera */}
        <div className="flex justify-between items-center border-b border-zinc-100 pb-4 relative z-10">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-600" />
            <span className="text-xs font-semibold tracking-widest text-zinc-400 uppercase">Biometría y Preparación</span>
          </div>
          {!readOnly && (
            <AnimatedButton
              variant={isRegistered ? 'secondary' : 'primary'}
              size="sm"
              onClick={() => setIsModalOpen(true)}
              className={`flex items-center gap-1.5 text-xs py-1.5 px-3 transition-all duration-300 ${
                !isRegistered
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white font-bold border-transparent'
                  : 'border-zinc-300 hover:border-zinc-400 text-zinc-700'
              }`}
            >
              <Settings className={`w-3.5 h-3.5 ${!isRegistered ? 'text-white' : 'text-zinc-500'}`} />
              <span>{isRegistered ? 'Ajustar Diario' : 'Registrar Hoy'}</span>
            </AnimatedButton>
          )}
        </div>
 
        {/* Sección Principal: Anillo y Estado */}
        <div className="flex flex-col md:flex-row items-center gap-6 relative z-10 py-2">
          <div 
            onClick={() => !readOnly && !isRegistered && setIsModalOpen(true)}
            className={`relative w-28 h-28 flex items-center justify-center shrink-0 group ${!readOnly && !isRegistered ? 'cursor-pointer' : ''}`}
          >
            {/* SVG del Dial */}
            <svg className="absolute inset-0 w-full h-full transform -rotate-90 overflow-visible" viewBox="0 0 100 100">
              {/* Círculo de fondo (pista) */}
              <circle
                cx="50"
                cy="50"
                r="42"
                className={!isRegistered ? "stroke-zinc-200" : "stroke-zinc-100"}
                strokeWidth={!isRegistered ? "4" : "6"}
                strokeDasharray={!isRegistered ? "8 6" : "none"}
                fill="transparent"
              />
              {/* Círculo activo coloreado */}
              {isRegistered && (
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  stroke={isOptimal ? '#10b981' : isModerate ? '#f59e0b' : '#ef4444'}
                  strokeWidth="6"
                  fill="transparent"
                  strokeDasharray="263.89"
                  strokeDashoffset={263.89 * (1 - (score / 100))}
                  strokeLinecap="round"
                  className="transition-all duration-1000 ease-out"
                />
              )}
            </svg>
            
            {/* Contenido Central */}
            <div className={`absolute inset-0 flex flex-col items-center justify-center transition-transform duration-300 ${!isRegistered && !readOnly ? 'group-hover:scale-105' : ''}`}>
              <span className="text-3xl font-bold tracking-tight text-zinc-900 relative z-10">
                {isRegistered ? score : '--'}
              </span>
              {!isRegistered && !readOnly && (
                <span className="text-[8px] text-emerald-600 font-bold uppercase tracking-wider mt-0.5 animate-pulse text-center leading-none">
                  REGISTRAR
                </span>
              )}
            </div>
          </div>
          <div className="text-center md:text-left space-y-1">
            <div className="flex items-center justify-center md:justify-start gap-2">
              <h3 className="text-xl font-bold text-zinc-800">
                {!isRegistered ? 'Métricas Pendientes' : isOptimal ? 'Readiness Óptimo' : isModerate ? 'Readiness Moderado' : 'Descanso Recomendado'}
              </h3>
              <span className={`w-2 h-2 rounded-full ${!isRegistered ? 'bg-zinc-350 animate-pulse' : isOptimal ? 'bg-emerald-500' : isModerate ? 'bg-amber-500' : 'bg-rose-500'}`} />
            </div>
            <p className="text-sm text-zinc-500 max-w-sm leading-relaxed">
              {statusText}
            </p>
          </div>
        </div>
 
        {/* Grid de Desglose de Factores Objetivos */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 relative z-10">
          
          {/* Sueño */}
          <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200 flex flex-col justify-between space-y-1">
            <div className="flex items-center justify-between text-zinc-400">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">SUEÑO</span>
              <Moon className="w-3.5 h-3.5" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-bold text-zinc-900">{isRegistered ? biometrics.sleep_hours : '--'}</span>
              {isRegistered && <span className="text-xs text-zinc-400">h</span>}
            </div>
            <span className={`text-[11px] font-bold ${isRegistered ? 'text-emerald-600' : 'text-zinc-400'}`}>{statusLabels.sleepStatus}</span>
          </div>
 
          {/* HRV */}
          <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200 flex flex-col justify-between space-y-1">
            <div className="flex items-center justify-between text-zinc-400">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 cursor-help" title="Variabilidad del Ritmo Cardíaco (HRV): Mide el tiempo entre latidos. Un valor alto indica que tu sistema nervioso está recuperado y listo para entrenar.">HRV</span>
              <Heart className="w-3.5 h-3.5" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-bold text-zinc-900">{isRegistered ? biometrics.hrv : '--'}</span>
              {isRegistered && <span className="text-xs text-zinc-400">ms</span>}
            </div>
            <span className={`text-[11px] font-bold ${isRegistered ? 'text-emerald-600' : 'text-zinc-400'}`}>{statusLabels.hrvStatus}</span>
          </div>
 
          {/* RHR */}
          <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200 flex flex-col justify-between space-y-1">
            <div className="flex items-center justify-between text-zinc-400">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 cursor-help" title="Pulsaciones en Reposo (RHR): Mide tus latidos mínimos por minuto. Un valor más bajo suele indicar que tu corazón está bien descansado.">RHR</span>
              <Activity className="w-3.5 h-3.5" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-bold text-zinc-900">{isRegistered ? biometrics.rhr : '--'}</span>
              {isRegistered && <span className="text-xs text-zinc-400">bpm</span>}
            </div>
            <span className={`text-[11px] font-bold ${isRegistered ? 'text-emerald-600' : 'text-zinc-400'}`}>{statusLabels.rhrStatus}</span>
          </div>
 
        </div>
 
        {/* Factores Subjetivos (Atleta) */}
        <div className="flex flex-wrap gap-3 pt-2 relative z-10 border-t border-zinc-100 mt-4">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-50 border border-zinc-200 text-xs text-zinc-650">
            <Flame className="w-3.5 h-3.5 text-amber-500" />
            <span>Fatiga Muscular: <strong className="text-amber-600">{isRegistered ? `Nivel ${biometrics.fatigue_rating}/5` : 'Pendiente'}</strong></span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-50 border border-zinc-200 text-xs text-zinc-650">
            <Brain className="w-3.5 h-3.5 text-emerald-500" />
            <span>Carga Mental: <strong className="text-emerald-650">{isRegistered ? `Nivel ${biometrics.stress_level}/5` : 'Pendiente'}</strong></span>
          </div>
        </div>
 
      </ProCard>
 
      {/* Modal Interactivo */}
      {!readOnly && (
        <BiometricsModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          initialData={biometrics}
          onSave={handleSaveBiometrics}
        />
      )}
    </>
  )
}
