'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Droplet, Zap, Save, RefreshCw, AlertCircle, Sparkles, Check, Edit2, X } from 'lucide-react'
import { ProCard } from '@/components/ui/pro-card'
import { AnimatedButton } from '@/components/ui/animated-button'
import { saveSweatTest } from '@/app/(app)/dashboard/nutrition-actions'
import { updateNutritionSettings } from '@/app/(app)/settings/actions'

interface SweatTestCardProps {
  sweatRate: number | null
  weightBefore: number | null
  weightAfter: number | null
  fluidIntake: number | null
  durationMin: number | null
  customCarbsPerHour: number | null
}

export function SweatTestCard({
  sweatRate,
  weightBefore,
  weightAfter,
  fluidIntake,
  durationMin,
  customCarbsPerHour
}: SweatTestCardProps) {
  const [isEditingSweat, setIsEditingSweat] = React.useState(false)
  const [isEditingCarbs, setIsEditingCarbs] = React.useState(false)
  const [loadingSweat, setLoadingSweat] = React.useState(false)
  const [loadingCarbs, setLoadingCarbs] = React.useState(false)
  
  // Form states for sweat test calculator
  const [sweatForm, setSweatForm] = React.useState({
    weightBefore: weightBefore?.toString() || '',
    weightAfter: weightAfter?.toString() || '',
    fluidIntake: fluidIntake?.toString() || '',
    durationMin: durationMin?.toString() || ''
  })

  // State for carbs override
  const [carbsOverrideEnabled, setCarbsOverrideEnabled] = React.useState(customCarbsPerHour !== null)
  const [carbsValue, setCarbsValue] = React.useState(customCarbsPerHour?.toString() || '60')

  // Real-time calculator for display
  const calculatedLiveSweatRate = React.useMemo(() => {
    const wb = parseFloat(sweatForm.weightBefore)
    const wa = parseFloat(sweatForm.weightAfter)
    const fi = parseInt(sweatForm.fluidIntake)
    const dm = parseInt(sweatForm.durationMin)

    if (isNaN(wb) || isNaN(wa) || isNaN(fi) || isNaN(dm) || wb <= 0 || wa <= 0 || dm <= 0) {
      return null
    }

    const weightLoss = wb - wa
    const fluidL = fi / 1000
    const durationHrs = dm / 60
    const rate = (weightLoss + fluidL) / durationHrs
    return parseFloat(Math.max(0.1, rate).toFixed(1))
  }, [sweatForm])

  const handleSaveSweat = async () => {
    const wb = parseFloat(sweatForm.weightBefore)
    const wa = parseFloat(sweatForm.weightAfter)
    const fi = parseInt(sweatForm.fluidIntake)
    const dm = parseInt(sweatForm.durationMin)

    if (isNaN(wb) || isNaN(wa) || isNaN(fi) || isNaN(dm) || wb <= 0 || wa <= 0 || dm <= 0) {
      return
    }

    setLoadingSweat(true)
    const res = await saveSweatTest({
      weightBefore: wb,
      weightAfter: wa,
      fluidIntake: fi,
      durationMin: dm
    })
    setLoadingSweat(false)
    if (res.success) {
      setIsEditingSweat(false)
    }
  }

  const handleSaveCarbs = async () => {
    setLoadingCarbs(true)
    const customCarbs = carbsOverrideEnabled ? parseInt(carbsValue) : null
    const res = await updateNutritionSettings({
      custom_carbs_per_hour: customCarbs
    })
    setLoadingCarbs(false)
    if (res.success) {
      setIsEditingCarbs(false)
    }
  }

  return (
    <div className="p-6 rounded-2xl bg-[#18181b] border border-zinc-800 shadow-xl relative h-full flex flex-col group justify-between">
      <div>
        {/* Cabecera */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <Droplet className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-100">Test de Sudoración y Pacing</h3>
              <p className="text-[10px] text-zinc-500">Calculador inteligente de hidratación y carbohidratos</p>
            </div>
          </div>
        </div>

        {/* Dos Secciones Principales */}
        <div className="space-y-6">
          
          {/* Fila 1: Tasa de Sudoración */}
          <div className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800/50 relative">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest flex items-center gap-1.5 mb-1">
                  <Droplet className="w-3.5 h-3.5 text-cyan-400" /> Tasa de Sudoración
                </span>
                <p className="text-2xl font-black text-white">
                  {sweatRate !== null ? `${sweatRate} L/h` : '0.8 L/h'}
                  {sweatRate === null && <span className="text-xs text-zinc-650 font-normal ml-2">(Estándar)</span>}
                </p>
                {durationMin && (
                  <p className="text-[9px] text-zinc-650 mt-1 font-medium">Último test: {durationMin} min | {weightBefore}kg → {weightAfter}kg</p>
                )}
              </div>
              <button 
                onClick={() => setIsEditingSweat(true)}
                className="w-7 h-7 rounded-full bg-zinc-950 border border-zinc-850 flex items-center justify-center text-zinc-400 hover:text-emerald-400 hover:border-emerald-500/30 transition-colors"
                title="Editar / Hacer Test de Sudoración"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Fila 2: Carbohidratos por hora */}
          <div className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800/50 relative">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest flex items-center gap-1.5 mb-1">
                  <Zap className="w-3.5 h-3.5 text-rose-400" /> Carbohidratos por Hora
                </span>
                <p className="text-2xl font-black text-white">
                  {customCarbsPerHour !== null ? `${customCarbsPerHour} g` : 'Auto'}
                  {customCarbsPerHour === null && <span className="text-xs text-zinc-650 font-normal ml-2">(Dinámico según duración)</span>}
                </p>
                <p className="text-[9px] text-zinc-650 mt-1 font-medium">Override manual para entrenamientos de carrera y bici.</p>
              </div>
              <button 
                onClick={() => setIsEditingCarbs(true)}
                className="w-7 h-7 rounded-full bg-zinc-950 border border-zinc-850 flex items-center justify-center text-zinc-400 hover:text-emerald-400 hover:border-emerald-500/30 transition-colors"
                title="Configurar carbohidratos"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* Alerta de sincronización */}
      <div className="mt-5 pt-4 border-t border-zinc-900/60 text-[10px] text-zinc-500 flex items-center gap-1.5 leading-relaxed">
        <Sparkles className="w-4 h-4 text-emerald-500/80 shrink-0" />
        <span>Se sincroniza automáticamente con el motor calórico del Dashboard de Triatlón Pro.</span>
      </div>

      {/* MODAL: Test de Sudoración Paso a Paso */}
      <AnimatePresence>
        {isEditingSweat && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 10 }}
              className="w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-2xl p-6 shadow-2xl relative"
            >
              <button 
                onClick={() => setIsEditingSweat(false)} 
                className="absolute top-4 right-4 text-zinc-500 hover:text-white cursor-pointer"
                title="Cerrar"
                aria-label="Cerrar"
              >
                <X className="w-4 h-4" />
              </button>
              
              <h4 className="text-base font-bold text-white mb-2 flex items-center gap-1.5">
                <Droplet className="w-5 h-5 text-cyan-400" />
                Test de Sudoración guiado
              </h4>
              <p className="text-xs text-zinc-500 mb-5 leading-relaxed">
                Realiza una sesión de 1 hora. Pésate sin ropa antes y después de entrenar, y anota el agua ingerida.
              </p>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-zinc-400 uppercase font-bold mb-1 block">Peso Antes (kg)</label>
                    <input 
                      type="number" 
                      step="0.1"
                      value={sweatForm.weightBefore} 
                      onChange={e => setSweatForm({...sweatForm, weightBefore: e.target.value})} 
                      className="w-full bg-zinc-900 border border-zinc-850 rounded-xl px-3 py-2.5 text-sm text-white focus:border-cyan-550 outline-none" 
                      placeholder="75.2" 
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-zinc-400 uppercase font-bold mb-1 block">Peso Después (kg)</label>
                    <input 
                      type="number" 
                      step="0.1"
                      value={sweatForm.weightAfter} 
                      onChange={e => setSweatForm({...sweatForm, weightAfter: e.target.value})} 
                      className="w-full bg-zinc-900 border border-zinc-850 rounded-xl px-3 py-2.5 text-sm text-white focus:border-cyan-550 outline-none" 
                      placeholder="74.4" 
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-zinc-400 uppercase font-bold mb-1 block">Agua Bebida (ml)</label>
                    <input 
                      type="number" 
                      value={sweatForm.fluidIntake} 
                      onChange={e => setSweatForm({...sweatForm, fluidIntake: e.target.value})} 
                      className="w-full bg-zinc-900 border border-zinc-850 rounded-xl px-3 py-2.5 text-sm text-white focus:border-cyan-550 outline-none" 
                      placeholder="500" 
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-zinc-400 uppercase font-bold mb-1 block">Duración (min)</label>
                    <input 
                      type="number" 
                      value={sweatForm.durationMin} 
                      onChange={e => setSweatForm({...sweatForm, durationMin: e.target.value})} 
                      className="w-full bg-zinc-900 border border-zinc-850 rounded-xl px-3 py-2.5 text-sm text-white focus:border-cyan-550 outline-none" 
                      placeholder="60" 
                    />
                  </div>
                </div>

                {calculatedLiveSweatRate !== null && (
                  <div className="p-3.5 rounded-xl bg-cyan-950/10 border border-cyan-500/15 flex items-center justify-between">
                    <span className="text-xs text-zinc-400 font-semibold flex items-center gap-1.5">
                      <RefreshCw className="w-3.5 h-3.5 text-cyan-400 animate-spin-slow" />
                      Resultado estimado:
                    </span>
                    <strong className="text-base text-cyan-400 font-black">{calculatedLiveSweatRate} L/h</strong>
                  </div>
                )}
                
                <AnimatedButton 
                  variant="primary" 
                  onClick={handleSaveSweat} 
                  disabled={loadingSweat || calculatedLiveSweatRate === null} 
                  className="w-full py-2.5 text-sm !bg-emerald-500 hover:!bg-emerald-400 !text-black flex justify-center font-bold"
                >
                  {loadingSweat ? 'Guardando...' : 'Guardar y Aplicar Pauta'}
                </AnimatedButton>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL: Configuración de Carbohidratos Override */}
      <AnimatePresence>
        {isEditingCarbs && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 10 }}
              className="w-full max-w-sm bg-zinc-950 border border-zinc-800 rounded-2xl p-6 shadow-2xl relative"
            >
              <button 
                onClick={() => setIsEditingCarbs(false)} 
                className="absolute top-4 right-4 text-zinc-500 hover:text-white cursor-pointer"
                title="Cerrar"
                aria-label="Cerrar"
              >
                <X className="w-4 h-4" />
              </button>
              
              <h4 className="text-base font-bold text-white mb-2 flex items-center gap-1.5">
                <Zap className="w-5 h-5 text-rose-400" />
                Dosificación de Carbohidratos
              </h4>
              <p className="text-xs text-zinc-550 mb-5 leading-relaxed">
                Elige si quieres que la app calcule tus carbohidratos de forma dinámica o prefiere forzar un objetivo por hora específico.
              </p>
              
              <div className="space-y-4">
                
                {/* Switch / Checkbox Override */}
                <div className="flex items-center justify-between p-3.5 rounded-xl bg-zinc-900 border border-zinc-850">
                  <label htmlFor="carbs-override-checkbox" className="text-xs text-zinc-350 font-bold cursor-pointer">
                    Activar Objetivo Fijo (Override)
                  </label>
                  <input 
                    id="carbs-override-checkbox"
                    type="checkbox" 
                    checked={carbsOverrideEnabled}
                    onChange={e => setCarbsOverrideEnabled(e.target.checked)}
                    title="Activar Objetivo Fijo (Override)"
                    className="w-4 h-4 text-emerald-500 bg-zinc-950 border-zinc-800 rounded focus:ring-emerald-500 cursor-pointer"
                  />
                </div>

                {/* Input grams */}
                <AnimatePresence>
                  {carbsOverrideEnabled && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <label className="text-[10px] text-zinc-400 uppercase font-bold mb-1.5 block">Carbohidratos por hora (g HC/h)</label>
                      <input 
                        type="number" 
                        min="20"
                        max="120"
                        value={carbsValue} 
                        onChange={e => setCarbsValue(e.target.value)} 
                        className="w-full bg-zinc-900 border border-zinc-850 rounded-xl px-3.5 py-2.5 text-sm text-white focus:border-cyan-550 outline-none" 
                        placeholder="60" 
                      />
                      <span className="text-[9px] text-zinc-650 mt-1 block">Rango recomendado: 30g a 90g por hora. Entrenos muy exigentes pueden requerir 90-120g.</span>
                    </motion.div>
                  )}
                </AnimatePresence>
                
                <AnimatedButton 
                  variant="primary" 
                  onClick={handleSaveCarbs} 
                  disabled={loadingCarbs} 
                  className="w-full py-2.5 text-sm !bg-emerald-500 hover:!bg-emerald-400 !text-black flex justify-center font-bold"
                >
                  {loadingCarbs ? 'Guardando...' : 'Guardar Configuración'}
                </AnimatedButton>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
