'use client'

import * as React from 'react'
import { Info, Heart, Moon, Activity, Flame, Brain } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { DailyBiometrics } from '@/app/(app)/dashboard/biometrics-actions'
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
  const [sleepHours, setSleepHours] = React.useState(initialData?.sleep_hours !== null && initialData?.sleep_hours !== undefined ? initialData.sleep_hours.toString() : '')
  const [hrv, setHrv] = React.useState(initialData?.hrv !== null && initialData?.hrv !== undefined ? initialData.hrv.toString() : '')
  const [rhr, setRhr] = React.useState(initialData?.rhr !== null && initialData?.rhr !== undefined ? initialData.rhr.toString() : '')
  const [weight, setWeight] = React.useState(initialData?.weight !== null && initialData?.weight !== undefined ? initialData.weight.toString() : '')
  const [fatigueRating, setFatigueRating] = React.useState<number | null>(initialData?.fatigue_rating ?? null)
  const [stressLevel, setStressLevel] = React.useState<number | null>(initialData?.stress_level ?? null)
  const [loading, setLoading] = React.useState(false)
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)

  // Sincronizar estado si cambia initialData
  React.useEffect(() => {
    if (initialData) {
      setSleepHours(initialData.sleep_hours !== null && initialData.sleep_hours !== undefined ? initialData.sleep_hours.toString() : '')
      setHrv(initialData.hrv !== null && initialData.hrv !== undefined ? initialData.hrv.toString() : '')
      setRhr(initialData.rhr !== null && initialData.rhr !== undefined ? initialData.rhr.toString() : '')
      setWeight(initialData.weight !== null && initialData.weight !== undefined ? initialData.weight.toString() : '')
      setFatigueRating(initialData.fatigue_rating)
      setStressLevel(initialData.stress_level)
      setErrorMessage(null)
    }
  }, [initialData])

  if (!isOpen) return null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (loading) return

    // Validar métricas obligatorias
    if (!sleepHours || !hrv || !rhr || !weight) {
      setErrorMessage('Por favor, rellena todas las métricas objetivas (Sueño, HRV, RHR y Peso).')
      return
    }

    if (fatigueRating === null || fatigueRating === 0) {
      setErrorMessage('Por favor, selecciona tu nivel de Fatiga Muscular.')
      return
    }

    if (stressLevel === null || stressLevel === 0) {
      setErrorMessage('Por favor, selecciona tu nivel de Estrés/Carga Mental.')
      return
    }

    setLoading(true)
    setErrorMessage(null)

    try {
      await onSave({
        sleep_hours: parseFloat(sleepHours),
        hrv: parseInt(hrv, 10),
        rhr: parseInt(rhr, 10),
        weight: parseFloat(weight),
        fatigue_rating: fatigueRating,
        stress_level: stressLevel,
      })
      onClose()
    } catch (err) {
      console.error(err)
      setErrorMessage('Ocurrió un error al guardar la biometría.')
    } finally {
      setLoading(false)
    }
  }

  const currentFatigue = fatigueRating !== null && fatigueRating > 0
    ? fatigueDescriptions[fatigueRating]
    : { title: 'Sin seleccionar', desc: 'Por favor, selecciona tu nivel de fatiga para hoy (1-5).' }

  const currentStress = stressLevel !== null && stressLevel > 0
    ? stressDescriptions[stressLevel]
    : { title: 'Sin seleccionar', desc: 'Por favor, selecciona tu nivel de carga mental para hoy (1-5).' }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-6 md:p-8">
        <DialogHeader className="mb-6 text-left">
          <DialogTitle className="text-2xl font-light tracking-tight text-zinc-900">Diario Biométrico del Atleta</DialogTitle>
          <DialogDescription className="text-sm text-zinc-500 mt-1">
            Ajusta tus métricas matutinas para recalcular tu Readiness Score al instante.
          </DialogDescription>
        </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-8">
            
            {/* 1. Métricas Objetivas */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Activity className="w-4 h-4 text-emerald-600" />
                <h3 className="text-xs font-semibold uppercase tracking-widest text-zinc-500">1. Métricas Objetivas (Reloj / Sensor)</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                
                {/* Sueño */}
                <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200 space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-medium text-zinc-500 flex items-center gap-1.5">
                      <Moon className="w-3.5 h-3.5 text-zinc-450" />
                      SUEÑO (h)
                    </label>
                    <div className="group relative">
                      <Info className="w-3.5 h-3.5 text-sky-500 cursor-help" />
                      <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover:block w-48 p-2 rounded bg-zinc-800 text-[10px] text-white text-center shadow-xl z-20 pointer-events-none border border-zinc-700">
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
                    placeholder="7.5"
                    className="w-full bg-white border border-zinc-200 rounded-lg px-3 py-2 text-lg font-medium text-zinc-800 text-center focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-200 transition-colors"
                  />
                </div>

                {/* HRV */}
                <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200 space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-medium text-zinc-500 flex items-center gap-1.5">
                      <Heart className="w-3.5 h-3.5 text-zinc-450" />
                      HRV (ms)
                    </label>
                    <div className="group relative">
                      <Info className="w-3.5 h-3.5 text-sky-500 cursor-help" />
                      <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover:block w-52 p-2 rounded bg-zinc-800 text-[10px] text-white text-center shadow-xl z-20 pointer-events-none border border-zinc-700">
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
                    placeholder="65"
                    className="w-full bg-white border border-zinc-200 rounded-lg px-3 py-2 text-lg font-medium text-zinc-800 text-center focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-200 transition-colors"
                  />
                </div>

                {/* RHR */}
                <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200 space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-medium text-zinc-500 flex items-center gap-1.5">
                      <Activity className="w-3.5 h-3.5 text-zinc-450" />
                      RHR (bpm)
                    </label>
                    <div className="group relative">
                      <Info className="w-3.5 h-3.5 text-sky-500 cursor-help" />
                      <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover:block w-48 p-2 rounded bg-zinc-800 text-[10px] text-white text-center shadow-xl z-20 pointer-events-none border border-zinc-700">
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
                    placeholder="52"
                    className="w-full bg-white border border-zinc-200 rounded-lg px-3 py-2 text-lg font-medium text-zinc-800 text-center focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-200 transition-colors"
                  />
                </div>

              </div>

              {/* Peso corporal */}
              <div className="mt-4 p-4 rounded-xl bg-zinc-50 border border-zinc-200 flex justify-between items-center">
                <label className="text-xs font-medium text-zinc-500">Peso Corporal (kg)</label>
                <input
                  type="number"
                  step="0.1"
                  min="30"
                  max="200"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  placeholder="72.0"
                  className="w-28 bg-white border border-zinc-200 rounded-lg px-3 py-1.5 text-sm font-medium text-zinc-900 text-right focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>
            </div>

            {/* 2. Métricas Subjetivas (Fatiga y Estrés) */}
            <div className="space-y-6 border-t border-zinc-150 pt-6">
              <div className="flex items-center gap-2 mb-2">
                <Flame className="w-4 h-4 text-amber-500" />
                <h3 className="text-xs font-semibold uppercase tracking-widest text-zinc-500">2. Sensaciones del Atleta (Métricas Subjetivas)</h3>
              </div>

              {/* Fatiga Muscular */}
              <div className="p-5 rounded-xl bg-zinc-50 border border-zinc-200 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-semibold text-zinc-850 flex items-center gap-2">
                    <Flame className="w-4 h-4 text-amber-500" />
                    Fatiga y Dolor Muscular (RPE)
                  </span>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded bg-amber-500/10 text-amber-600 border border-amber-500/20">
                    Nivel {fatigueRating !== null && fatigueRating > 0 ? fatigueRating : 'Pendiente'} / 5
                  </span>
                </div>

                <div className="grid grid-cols-5 gap-2">
                  {[1, 2, 3, 4, 5].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setFatigueRating(num)}
                      className={`py-2.5 rounded-lg font-medium text-sm transition-all cursor-pointer ${
                        fatigueRating === num
                          ? 'bg-amber-500 text-zinc-950 font-bold shadow-lg shadow-amber-500/20 scale-105'
                          : 'bg-white border border-zinc-200 text-zinc-500 hover:border-zinc-350 hover:text-zinc-850'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>

                {/* Ayuda Dinámica */}
                <div className="p-3.5 rounded-lg bg-amber-50 border-l-2 border-amber-500 space-y-1">
                  <p className="text-xs font-semibold text-amber-600">{currentFatigue.title}</p>
                  <p className="text-xs text-zinc-500 leading-relaxed">{currentFatigue.desc}</p>
                </div>
              </div>

              {/* Nivel de Estrés Mental */}
              <div className="p-5 rounded-xl bg-zinc-50 border border-zinc-200 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-semibold text-zinc-850 flex items-center gap-2">
                    <Brain className="w-4 h-4 text-emerald-600" />
                    Nivel de Estrés Mental / Laboral
                  </span>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                    Nivel {stressLevel !== null && stressLevel > 0 ? stressLevel : 'Pendiente'} / 5
                  </span>
                </div>

                <div className="grid grid-cols-5 gap-2">
                  {[1, 2, 3, 4, 5].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setStressLevel(num)}
                      className={`py-2.5 rounded-lg font-medium text-sm transition-all cursor-pointer ${
                        stressLevel === num
                          ? 'bg-emerald-500 text-zinc-950 font-bold shadow-lg shadow-emerald-500/20 scale-105'
                          : 'bg-white border border-zinc-200 text-zinc-500 hover:border-zinc-350 hover:text-zinc-850'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>

                {/* Ayuda Dinámica */}
                <div className="p-3.5 rounded-lg bg-emerald-50 border-l-2 border-emerald-500 space-y-1">
                  <p className="text-xs font-semibold text-emerald-600">{currentStress.title}</p>
                  <p className="text-xs text-zinc-500 leading-relaxed">{currentStress.desc}</p>
                </div>
              </div>

            </div>

            {errorMessage && (
              <div className="p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-600 text-xs font-medium text-center">
                {errorMessage}
              </div>
            )}

            {/* Botón Guardar */}
            <AnimatedButton
              type="submit"
              variant="primary"
              className="w-full justify-center py-6 text-base font-medium hover:shadow-emerald-500/10"
              disabled={loading}
            >
              {loading ? 'Guardando y Recalculando...' : 'Guardar Biometría y Recalcular Readiness'}
            </AnimatedButton>

          </form>
      </DialogContent>
    </Dialog>
  )
}
