'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Calendar, X, Clock, Check, PlusCircle, Activity } from 'lucide-react'
import { AnimatedButton } from '@/components/ui/animated-button'
import { saveCoachWorkout } from '@/app/coach/athlete/[id]/actions'
import { useRouter } from 'next/navigation'

interface SessionPlannerProps {
  athleteId: string
}

export function SessionPlanner({ athleteId }: SessionPlannerProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [success, setSuccess] = React.useState(false)

  // Default date as YYYY-MM-DD in local timezone
  const getTodayString = () => {
    const d = new Date()
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const [formData, setFormData] = React.useState({
    scheduledDate: getTodayString(),
    sportType: 'ciclismo',
    durationMin: 60,
    title: '',
    warmup: '15 min de rodaje suave Z1 + movilidad articular.',
    main: 'Series estructuradas Z3/Z4.',
    cooldown: '10 min de vuelta a la calma Z1.'
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'durationMin' ? parseInt(value) || 0 : value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const res = await saveCoachWorkout(athleteId, formData)
      if (res.error) {
        setError(res.error)
        setLoading(false)
      } else {
        setSuccess(true)
        setTimeout(() => {
          setIsOpen(false)
          setSuccess(false)
          // Reset form
          setFormData({
            scheduledDate: getTodayString(),
            sportType: 'ciclismo',
            durationMin: 60,
            title: '',
            warmup: '15 min de rodaje suave Z1 + movilidad articular.',
            main: 'Series estructuradas Z3/Z4.',
            cooldown: '10 min de vuelta a la calma Z1.'
          })
          setLoading(false)
          router.refresh()
        }, 1500)
      }
    } catch (err) {
      setError('Ocurrió un error inesperado al guardar.')
      setLoading(false)
    }
  }

  return (
    <>
      <AnimatedButton 
        variant="ghost" 
        size="sm" 
        onClick={() => setIsOpen(true)}
        className="rounded-full text-xs py-1.5 px-3.5 border border-orange-500/30 bg-orange-500/10 text-orange-400 hover:text-orange-300 hover:bg-orange-500/20 transition-all flex items-center gap-1.5 shrink-0"
      >
        <Calendar className="w-3.5 h-3.5" />
        <span>Planificar Sesión</span>
      </AnimatedButton>

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !loading && setIsOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />

            {/* Modal Body */}
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              transition={{ type: 'spring', duration: 0.4 }}
              className="relative w-full max-w-lg bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden z-10 flex flex-col max-h-[90vh]"
            >
              
              {/* Header */}
              <div className="p-5 border-b border-zinc-900 flex justify-between items-center bg-zinc-900/20">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400">
                    <PlusCircle className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-zinc-100">Nueva Sesión de Entrenamiento</h3>
                    <p className="text-[10px] text-zinc-400">Introduce los bloques para que el atleta los reciba en su reloj.</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsOpen(false)}
                  disabled={loading}
                  className="w-8 h-8 rounded-lg border border-zinc-900 flex items-center justify-center text-zinc-500 hover:text-zinc-200 hover:bg-zinc-900 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Form container */}
              <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-thin">
                
                {error && (
                  <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/15 text-red-400 text-xs leading-relaxed text-center">
                    {error}
                  </div>
                )}

                {success ? (
                  <motion.div 
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="py-12 flex flex-col items-center justify-center space-y-3"
                  >
                    <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-500/5">
                      <Check className="w-8 h-8" />
                    </div>
                    <p className="text-xs font-bold text-emerald-400 uppercase tracking-widest">¡Sesión Programada!</p>
                    <p className="text-[10px] text-zinc-500">Actualizando calendario del atleta...</p>
                  </motion.div>
                ) : (
                  <>
                    {/* Date and Sport Type split */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] text-zinc-400 uppercase tracking-wider font-semibold">Fecha de Ejecución</label>
                        <input 
                          type="date"
                          name="scheduledDate"
                          required
                          value={formData.scheduledDate}
                          onChange={handleInputChange}
                          className="w-full bg-zinc-900 border border-zinc-800 focus:border-orange-500 rounded-xl p-3 text-xs text-white outline-none transition-colors"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] text-zinc-400 uppercase tracking-wider font-semibold">Tipo de Deporte</label>
                        <select 
                          name="sportType"
                          value={formData.sportType}
                          onChange={handleInputChange}
                          className="w-full bg-zinc-900 border border-zinc-800 focus:border-orange-500 rounded-xl p-3 text-xs text-white outline-none transition-colors cursor-pointer"
                        >
                          <option value="ciclismo">🚴‍♂️ Ciclismo</option>
                          <option value="carrera">🏃‍♂️ Carrera</option>
                          <option value="natacion">🏊‍♂️ Natación</option>
                          <option value="fuerza">🏋️‍♂️ Fuerza</option>
                        </select>
                      </div>
                    </div>

                    {/* Duration and Title split */}
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-1.5 col-span-1">
                        <label className="text-[10px] text-zinc-400 uppercase tracking-wider font-semibold">Duración (min)</label>
                        <div className="relative flex items-center">
                          <input 
                            type="number"
                            name="durationMin"
                            required
                            min={5}
                            max={600}
                            value={formData.durationMin}
                            onChange={handleInputChange}
                            className="w-full bg-zinc-900 border border-zinc-800 focus:border-orange-500 rounded-xl p-3 pr-8 text-xs text-white outline-none transition-colors"
                          />
                          <Clock className="w-3.5 h-3.5 text-zinc-500 absolute right-3" />
                        </div>
                      </div>

                      <div className="space-y-1.5 col-span-2">
                        <label className="text-[10px] text-zinc-400 uppercase tracking-wider font-semibold">Título del Bloque (Opcional)</label>
                        <input 
                          type="text"
                          name="title"
                          placeholder="Ej: Intervals VO2Max"
                          value={formData.title}
                          onChange={handleInputChange}
                          className="w-full bg-zinc-900 border border-zinc-800 focus:border-orange-500 rounded-xl p-3 text-xs text-white outline-none transition-colors"
                        />
                      </div>
                    </div>

                    <div className="border-t border-zinc-900 my-2" />

                    {/* Warmup Textarea */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center">
                        <label className="text-[10px] text-zinc-400 uppercase tracking-wider font-semibold">1. Calentamiento (Warmup)</label>
                        <span className="text-[9px] text-zinc-500">Hasta botón LAP / Tiempo</span>
                      </div>
                      <textarea 
                        name="warmup"
                        rows={2}
                        value={formData.warmup}
                        onChange={handleInputChange}
                        placeholder="Ej: 15 min Z1 a Z2..."
                        className="w-full bg-zinc-900 border border-zinc-800 focus:border-orange-500 rounded-xl p-3 text-xs text-white outline-none transition-colors resize-none"
                      />
                    </div>

                    {/* Main Block Textarea */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center">
                        <label className="text-[10px] text-orange-400 uppercase tracking-wider font-semibold">2. Parte Principal (Main intervals)</label>
                        <span className="text-[9px] text-orange-500/80 font-bold">Objetivo de potencia/ritmo</span>
                      </div>
                      <textarea 
                        name="main"
                        rows={3}
                        required
                        value={formData.main}
                        onChange={handleInputChange}
                        placeholder="Ej: 5x (3 min a 220W-250W + Recup: 1 min)..."
                        className="w-full bg-zinc-900 border border-zinc-800 focus:border-orange-500 rounded-xl p-3 text-xs text-white outline-none transition-colors resize-none"
                      />
                    </div>

                    {/* Cooldown Textarea */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center">
                        <label className="text-[10px] text-zinc-400 uppercase tracking-wider font-semibold">3. Enfriamiento (Cooldown)</label>
                        <span className="text-[9px] text-zinc-500">Vuelta a la calma</span>
                      </div>
                      <textarea 
                        name="cooldown"
                        rows={2}
                        value={formData.cooldown}
                        onChange={handleInputChange}
                        placeholder="Ej: 10 min suaves Z1..."
                        className="w-full bg-zinc-900 border border-zinc-800 focus:border-orange-500 rounded-xl p-3 text-xs text-white outline-none transition-colors resize-none"
                      />
                    </div>

                    {/* Submit Button */}
                    <AnimatedButton
                      variant="primary"
                      type="submit"
                      disabled={loading}
                      className="w-full py-3.5 !bg-orange-500 hover:!bg-orange-400 !text-black shadow-lg shadow-orange-500/10 font-bold text-xs flex items-center justify-center gap-1.5"
                    >
                      {loading ? 'Programando...' : (
                        <>
                          <Activity className="w-4 h-4 text-black" />
                          Guardar y Sincronizar Calendario
                        </>
                      )}
                    </AnimatedButton>
                  </>
                )}

              </form>

            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}
