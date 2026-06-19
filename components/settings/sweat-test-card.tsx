'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Droplet, Zap, RefreshCw, Sparkles, Edit2, X } from 'lucide-react'
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
    <div className="p-6 rounded-2xl bg-white border border-zinc-200 shadow-sm relative h-full flex flex-col group justify-between">
      <div>
        {/* Cabecera */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center shadow-sm">
              <Droplet className="w-4 h-4 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-zinc-900 tracking-tight leading-tight">Test de Sudoración</h3>
              <p className="text-[10px] text-zinc-500 font-medium">Hidratación y carbohidratos personalizados</p>
            </div>
          </div>
        </div>

        {/* Dos Secciones Principales */}
        <div className="space-y-4">
          
          {/* Fila 1: Tasa de Sudoración */}
          <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200/80 relative shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] text-zinc-450 uppercase font-black tracking-widest flex items-center gap-1.5 mb-1">
                  <Droplet className="w-3.5 h-3.5 text-cyan-600" /> Tasa de Sudoración
                </span>
                <p className="text-xl font-black text-zinc-900">
                  {sweatRate !== null ? `${sweatRate} L/h` : '0.8 L/h'}
                  {sweatRate === null && <span className="text-xs text-zinc-450 font-normal ml-2">(Estándar)</span>}
                </p>
                {durationMin && (
                  <p className="text-[9px] text-zinc-500 mt-1 font-semibold">Último test: {durationMin} min | {weightBefore}kg → {weightAfter}kg</p>
                )}
              </div>
              <button 
                onClick={() => setIsEditingSweat(true)}
                className="w-7 h-7 rounded-full bg-white border border-zinc-250 flex items-center justify-center text-zinc-500 hover:text-cyan-600 hover:border-cyan-550 hover:bg-cyan-50/50 transition-colors cursor-pointer"
                title="Editar / Hacer Test de Sudoración"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Fila 2: Carbohidratos por hora */}
          <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200/80 relative shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] text-zinc-450 uppercase font-black tracking-widest flex items-center gap-1.5 mb-1">
                  <Zap className="w-3.5 h-3.5 text-rose-500" /> Carb por Hora
                </span>
                <p className="text-xl font-black text-zinc-900">
                  {customCarbsPerHour !== null ? `${customCarbsPerHour} g` : 'Auto'}
                  {customCarbsPerHour === null && <span className="text-xs text-zinc-450 font-normal ml-2">(Dinámico)</span>}
                </p>
                <p className="text-[9px] text-zinc-500 mt-1 font-semibold">Objetivo manual para bici y carrera a pie.</p>
              </div>
              <button 
                onClick={() => setIsEditingCarbs(true)}
                className="w-7 h-7 rounded-full bg-white border border-zinc-250 flex items-center justify-center text-zinc-500 hover:text-cyan-600 hover:border-cyan-550 hover:bg-cyan-50/50 transition-colors cursor-pointer"
                title="Configurar carbohidratos"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* Alerta de sincronización */}
      <div className="mt-5 pt-4 border-t border-zinc-200 text-[10px] text-zinc-500 flex items-center gap-1.5 leading-relaxed font-medium">
        <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
        <span>Se sincroniza con el motor calórico en el Dashboard principal.</span>
      </div>

      {/* MODAL: Test de Sudoración Paso a Paso */}
      <AnimatePresence>
        {isEditingSweat && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/45 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 10 }}
              className="w-full max-w-md bg-white border border-zinc-200 rounded-2xl p-6 shadow-2xl relative text-left"
            >
              <button 
                onClick={() => setIsEditingSweat(false)} 
                className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-800 cursor-pointer"
                title="Cerrar"
                aria-label="Cerrar"
              >
                <X className="w-4 h-4" />
              </button>
              
              <h4 className="text-base font-bold text-zinc-900 mb-2 flex items-center gap-1.5">
                <Droplet className="w-5 h-5 text-cyan-600" />
                Test de Sudoración guiado
              </h4>
              <p className="text-xs text-zinc-500 mb-5 leading-relaxed font-medium">
                Pésate sin ropa antes y después de una sesión de 1 hora, e introduce el líquido que hayas ingerido.
              </p>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3 text-left">
                  <div>
                    <label className="text-[10px] text-zinc-500 uppercase font-black mb-1 block">Peso Antes (kg)</label>
                    <input 
                      type="number" 
                      step="0.1"
                      value={sweatForm.weightBefore} 
                      onChange={e => setSweatForm({...sweatForm, weightBefore: e.target.value})} 
                      className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-2 text-sm text-zinc-900 focus:border-cyan-550 focus:ring-1 focus:ring-cyan-550 outline-none" 
                      placeholder="75.2" 
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-zinc-500 uppercase font-black mb-1 block">Peso Después (kg)</label>
                    <input 
                      type="number" 
                      step="0.1"
                      value={sweatForm.weightAfter} 
                      onChange={e => setSweatForm({...sweatForm, weightAfter: e.target.value})} 
                      className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-2 text-sm text-zinc-900 focus:border-cyan-550 focus:ring-1 focus:ring-cyan-550 outline-none" 
                      placeholder="74.4" 
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-zinc-500 uppercase font-black mb-1 block">Agua Bebida (ml)</label>
                    <input 
                      type="number" 
                      value={sweatForm.fluidIntake} 
                      onChange={e => setSweatForm({...sweatForm, fluidIntake: e.target.value})} 
                      className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-2 text-sm text-zinc-900 focus:border-cyan-550 focus:ring-1 focus:ring-cyan-550 outline-none" 
                      placeholder="500" 
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-zinc-500 uppercase font-black mb-1 block">Duración (min)</label>
                    <input 
                      type="number" 
                      value={sweatForm.durationMin} 
                      onChange={e => setSweatForm({...sweatForm, durationMin: e.target.value})} 
                      className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-2 text-sm text-zinc-900 focus:border-cyan-550 focus:ring-1 focus:ring-cyan-550 outline-none" 
                      placeholder="60" 
                    />
                  </div>
                </div>

                {calculatedLiveSweatRate !== null && (
                  <div className="p-3.5 rounded-xl bg-cyan-50/50 border border-cyan-200 flex items-center justify-between">
                    <span className="text-xs text-zinc-650 font-semibold flex items-center gap-1.5">
                      <RefreshCw className="w-3.5 h-3.5 text-cyan-600 animate-spin-slow" />
                      Resultado estimado:
                    </span>
                    <strong className="text-base text-cyan-700 font-black">{calculatedLiveSweatRate} L/h</strong>
                  </div>
                )}
                
                <AnimatedButton 
                  variant="primary" 
                  onClick={handleSaveSweat} 
                  disabled={loadingSweat || calculatedLiveSweatRate === null} 
                  className="w-full py-2.5 text-xs font-black !bg-cyan-650 hover:!bg-cyan-550 !text-white flex justify-center shadow-md cursor-pointer"
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
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/45 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 10 }}
              className="w-full max-w-sm bg-white border border-zinc-200 rounded-2xl p-6 shadow-2xl relative text-left"
            >
              <button 
                onClick={() => setIsEditingCarbs(false)} 
                className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-800 cursor-pointer"
                title="Cerrar"
                aria-label="Cerrar"
              >
                <X className="w-4 h-4" />
              </button>
              
              <h4 className="text-base font-bold text-zinc-900 mb-2 flex items-center gap-1.5">
                <Zap className="w-5 h-5 text-rose-500" />
                Dosificación de Carbohidratos
              </h4>
              <p className="text-xs text-zinc-500 mb-5 leading-relaxed font-medium">
                Elige si quieres que la app calcule tus carbohidratos de forma dinámica o prefiere forzar un objetivo manual por hora.
              </p>
              
              <div className="space-y-4">
                
                {/* Switch / Checkbox Override */}
                <div className="flex items-center justify-between p-3.5 rounded-xl bg-zinc-50 border border-zinc-200">
                  <label htmlFor="carbs-override-checkbox" className="text-xs text-zinc-700 font-bold cursor-pointer">
                    Activar Objetivo Fijo (Override)
                  </label>
                  <input 
                    id="carbs-override-checkbox"
                    type="checkbox" 
                    checked={carbsOverrideEnabled}
                    onChange={e => setCarbsOverrideEnabled(e.target.checked)}
                    title="Activar Objetivo Fijo (Override)"
                    className="w-4 h-4 text-cyan-600 bg-white border-zinc-350 rounded focus:ring-cyan-550 cursor-pointer"
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
                      <label className="text-[10px] text-zinc-500 uppercase font-black mb-1.5 block">Carbohidratos por hora (g HC/h)</label>
                      <input 
                        type="number" 
                        min="20"
                        max="120"
                        value={carbsValue} 
                        onChange={e => setCarbsValue(e.target.value)} 
                        className="w-full bg-white border border-zinc-200 rounded-xl px-3.5 py-2 text-sm text-zinc-900 focus:border-cyan-550 focus:ring-1 focus:ring-cyan-550 outline-none" 
                        placeholder="60" 
                      />
                      <span className="text-[9px] text-zinc-450 mt-1 block font-semibold">Rango sugerido: 30g a 90g. Sesiones intensas pueden requerir 90-120g.</span>
                    </motion.div>
                  )}
                </AnimatePresence>
                
                <AnimatedButton 
                  variant="primary" 
                  onClick={handleSaveCarbs} 
                  disabled={loadingCarbs} 
                  className="w-full py-2.5 text-xs font-black !bg-cyan-650 hover:!bg-cyan-550 !text-white flex justify-center shadow-md cursor-pointer"
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
