'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Info, Heart, Moon, Activity, Flame, Brain } from 'lucide-react'
import { DailyBiometrics } from '@/app/dashboard/biometrics-actions'
import { AnimatedButton } from '@/components/ui/animated-button'

interface BiometricsModalProps {
  isOpen: boolean
  onClose: () => void
  initialData: DailyBiometrics
  onSave: (formData: Partial<DailyBiometrics>) => Promise<void>
}

const fatigueDescriptions: Record<number, { title: string; desc: string }> = {
  1: { title: 'Nivel 1: Fresco y ligero', desc: 'Piernas totalmente recuperadas sin ningún dolor muscular. Óptimo para test de FTP o series de alta intensidad.' },
  2: { title: 'Nivel 2: Molestia leve normal', desc: 'Pequeña carga habitual del entrenamiento anterior. El cuerpo asimila bien el trabajo.' },
  3: { title: 'Nivel 3: Fatiga moderada', desc: 'Pesadez notable en las piernas. Ideal para rodajes aeróbicos en Zona 2 sin forzar el ritmo.' },
  4: { title: 'Nivel 4: Dolor muscular agudo (DOMS)', desc: 'Sobrecarga evidente y piernas muy pesadas. Considera una sesión suave de recuperación o estiramientos.' },
  5: { title: 'Nivel 5: Agotamiento extremo', desc: 'Dolor limitante y fatiga generalizada. Se recomienda descanso total para evitar lesiones.' },
}

const stressDescriptions: Record<number, { title: string; desc: string }> = {
  1: { title: 'Nivel 1: Calma total', desc: 'Mente despejada, relajada y con máxima capacidad de enfoque. El sistema nervioso asimilará perfectamente la carga.' },
  2: { title: 'Nivel 2: Día normal bajo control', desc: 'Nivel de actividad cotidiano equilibrado. Buena predisposición psicológica para entrenar.' },
  3: { title: 'Nivel 3: Estrés moderado', desc: 'Día ajetreado en el trabajo o familia. Puede afectar ligeramente tu frecuencia cardíaca basal.' },
  4: { title: 'Nivel 4: Sobrecarga mental alta', desc: 'Sensación de agobio y cansancio psicológico. Prioriza un entrenamiento que te sirva de desconexión.' },
  5: { title: 'Nivel 5: Estrés máximo', desc: 'Agotamiento mental severo. Tu cuerpo ya está lidiando con un alto nivel de cortisol; evita entrenamientos extenuantes.' },
}

export function BiometricsModal({ isOpen, onClose, initialData, onSave }: BiometricsModalProps) {
  const [sleepHours, setSleepHours] = React.useState(initialData?.sleep_hours?.toString() || '7.5')
  const [hrv, setHrv] = React.useState(initialData?.hrv?.toString() || '65')
  const [rhr, setRhr] = React.useState(initialData?.rhr?.toString() || '52')
  const [weight, setWeight] = React.useState(initialData?.weight?.toString() || '72.0')
  const [fatigueRating, setFatigueRating] = React.useState(initialData?.fatigue_rating || 2)
  const [stressLevel, setStressLevel] = React.useState(initialData?.stress_level || 2)
  const [loading, setLoading] = React.useState(false)

  // Sincronizar estado si cambia initialData
  React.useEffect(() => {
    if (initialData) {
      setSleepHours(initialData.sleep_hours?.toString() || '7.5')
      setHrv(initialData.hrv?.toString() || '65')
      setRhr(initialData.rhr?.toString() || '52')
      setWeight(initialData.weight?.toString() || '72.0')
      setFatigueRating(initialData.fatigue_rating || 2)
      setStressLevel(initialData.stress_level || 2)
    }
  }, [initialData])

  if (!isOpen) return null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (loading) return
    setLoading(true)

    try {
      await onSave({
        sleep_hours: parseFloat(sleepHours) || 7.5,
        hrv: parseInt(hrv, 10) || 65,
        rhr: parseInt(rhr, 10) || 52,
        weight: parseFloat(weight) || 72.0,
        fatigue_rating: fatigueRating,
        stress_level: stressLevel,
      })
      onClose()
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const currentFatigue = fatigueDescriptions[fatigueRating] || fatigueDescriptions[2]
  const currentStress = stressDescriptions[stressLevel] || stressDescriptions[2]

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-2xl rounded-2xl bg-zinc-900 border border-zinc-800 p-6 md:p-8 shadow-2xl max-h-[90vh] overflow-y-auto my-8"
        >
          {/* Botón Cerrar */}
          <button
            onClick={onClose}
            className="absolute top-6 right-6 p-2 rounded-full bg-zinc-800/50 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="mb-6">
            <h2 className="text-2xl font-light tracking-tight text-zinc-50">Diario Biométrico del Atleta</h2>
            <p className="text-sm text-zinc-400 mt-1">
              Ajusta tus métricas matutinas para recalcular tu Readiness Score al instante.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            
            {/* 1. Métricas Objetivas */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Activity className="w-4 h-4 text-emerald-400" />
                <h3 className="text-xs font-semibold uppercase tracking-widest text-zinc-400">1. Métricas Objetivas (Reloj / Sensor)</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                
                {/* Sueño */}
                <div className="p-4 rounded-xl bg-zinc-950/50 border border-zinc-800/80 space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-medium text-zinc-400 flex items-center gap-1.5">
                      <Moon className="w-3.5 h-3.5 text-zinc-500" />
                      SUEÑO (h)
                    </label>
                    <div className="group relative">
                      <Info className="w-3.5 h-3.5 text-sky-400 cursor-help" />
                      <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover:block w-48 p-2 rounded bg-zinc-800 text-[10px] text-zinc-200 text-center shadow-xl z-20 pointer-events-none border border-zinc-700">
                        Meta recomendada: 8.0h para asimilación óptima de carga en triatlón.
                      </div>
                    </div>
                  </div>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="24"
                    value={sleepHours}
                    onChange={(e) => setSleepHours(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-lg font-medium text-zinc-100 text-center focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>

                {/* HRV */}
                <div className="p-4 rounded-xl bg-zinc-950/50 border border-zinc-800/80 space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-medium text-zinc-400 flex items-center gap-1.5">
                      <Heart className="w-3.5 h-3.5 text-zinc-500" />
                      HRV (ms)
                    </label>
                    <div className="group relative">
                      <Info className="w-3.5 h-3.5 text-sky-400 cursor-help" />
                      <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover:block w-52 p-2 rounded bg-zinc-800 text-[10px] text-zinc-200 text-center shadow-xl z-20 pointer-events-none border border-zinc-700">
                        Variabilidad de Frecuencia Cardíaca. Mayor valor indica mejor recuperación del sistema nervioso central.
                      </div>
                    </div>
                  </div>
                  <input
                    type="number"
                    min="1"
                    max="250"
                    value={hrv}
                    onChange={(e) => setHrv(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-lg font-medium text-zinc-100 text-center focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>

                {/* RHR */}
                <div className="p-4 rounded-xl bg-zinc-950/50 border border-zinc-800/80 space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-medium text-zinc-400 flex items-center gap-1.5">
                      <Activity className="w-3.5 h-3.5 text-zinc-500" />
                      RHR (bpm)
                    </label>
                    <div className="group relative">
                      <Info className="w-3.5 h-3.5 text-sky-400 cursor-help" />
                      <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover:block w-48 p-2 rounded bg-zinc-800 text-[10px] text-zinc-200 text-center shadow-xl z-20 pointer-events-none border border-zinc-700">
                        Frecuencia Cardíaca en Reposo. Menor valor indica menor fatiga cardiovascular acumulada.
                      </div>
                    </div>
                  </div>
                  <input
                    type="number"
                    min="30"
                    max="150"
                    value={rhr}
                    onChange={(e) => setRhr(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-lg font-medium text-zinc-100 text-center focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>

              </div>

              {/* Peso corporal */}
              <div className="mt-4 p-4 rounded-xl bg-zinc-950/50 border border-zinc-800/80 flex justify-between items-center">
                <label className="text-xs font-medium text-zinc-400">Peso Corporal (kg)</label>
                <input
                  type="number"
                  step="0.1"
                  min="30"
                  max="200"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  className="w-28 bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-1.5 text-sm font-medium text-zinc-100 text-right focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>
            </div>

            {/* 2. Métricas Subjetivas (Fatiga y Estrés) */}
            <div className="space-y-6 border-t border-zinc-800/80 pt-6">
              <div className="flex items-center gap-2 mb-2">
                <Flame className="w-4 h-4 text-amber-500" />
                <h3 className="text-xs font-semibold uppercase tracking-widest text-zinc-400">2. Sensaciones del Atleta (Métricas Subjetivas)</h3>
              </div>

              {/* Fatiga Muscular */}
              <div className="p-5 rounded-xl bg-zinc-950/40 border border-zinc-800/80 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-zinc-200 flex items-center gap-2">
                    <Flame className="w-4 h-4 text-amber-500" />
                    Fatiga y Dolor Muscular (RPE)
                  </span>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    Nivel {fatigueRating} / 5
                  </span>
                </div>

                <div className="grid grid-cols-5 gap-2">
                  {[1, 2, 3, 4, 5].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setFatigueRating(num)}
                      className={`py-2.5 rounded-lg font-medium text-sm transition-all ${
                        fatigueRating === num
                          ? 'bg-amber-500 text-zinc-950 font-bold shadow-lg shadow-amber-500/20 scale-105'
                          : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>

                {/* Ayuda Dinámica */}
                <div className="p-3.5 rounded-lg bg-amber-500/5 border-l-2 border-amber-500 space-y-1">
                  <p className="text-xs font-semibold text-amber-400">{currentFatigue.title}</p>
                  <p className="text-xs text-zinc-400 leading-relaxed">{currentFatigue.desc}</p>
                </div>
              </div>

              {/* Nivel de Estrés Mental */}
              <div className="p-5 rounded-xl bg-zinc-950/40 border border-zinc-800/80 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-zinc-200 flex items-center gap-2">
                    <Brain className="w-4 h-4 text-emerald-400" />
                    Nivel de Estrés Mental / Laboral
                  </span>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    Nivel {stressLevel} / 5
                  </span>
                </div>

                <div className="grid grid-cols-5 gap-2">
                  {[1, 2, 3, 4, 5].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setStressLevel(num)}
                      className={`py-2.5 rounded-lg font-medium text-sm transition-all ${
                        stressLevel === num
                          ? 'bg-emerald-500 text-zinc-950 font-bold shadow-lg shadow-emerald-500/20 scale-105'
                          : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>

                {/* Ayuda Dinámica */}
                <div className="p-3.5 rounded-lg bg-emerald-500/5 border-l-2 border-emerald-500 space-y-1">
                  <p className="text-xs font-semibold text-emerald-400">{currentStress.title}</p>
                  <p className="text-xs text-zinc-400 leading-relaxed">{currentStress.desc}</p>
                </div>
              </div>

            </div>

            {/* Botón Guardar */}
            <AnimatedButton
              type="submit"
              variant="primary"
              className="w-full justify-center py-6 text-base font-medium"
              disabled={loading}
            >
              {loading ? 'Guardando y Recalculando...' : 'Guardar Biometría y Recalcular Readiness'}
            </AnimatedButton>

          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
