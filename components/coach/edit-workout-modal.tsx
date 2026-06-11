'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Clock, Check, Activity, Edit3 } from 'lucide-react'
import { AnimatedButton } from '@/components/ui/animated-button'
import { updateCoachWorkoutDetails, saveCoachWorkout } from '@/app/(app)/coach/athlete/[id]/actions'
import { useRouter } from 'next/navigation'

export interface EditWorkoutData {
  id: string
  session_id: string
  sport_type: string
  duration_min: number
  title: string
  warmup: string
  main: string
  cooldown: string
  scheduled_date?: string
}

interface EditWorkoutModalProps {
  athleteId: string
  workout: EditWorkoutData | null
  isOpen: boolean
  onClose: () => void
}

export function EditWorkoutModal({ athleteId, workout, isOpen, onClose }: EditWorkoutModalProps) {
  const router = useRouter()
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [success, setSuccess] = React.useState(false)

  const [formData, setFormData] = React.useState({
    sportType: 'ciclismo',
    durationMin: 60,
    title: '',
    warmup: '',
    main: '',
    cooldown: ''
  })

  React.useEffect(() => {
    if (workout && isOpen) {
      setFormData({
        sportType: workout.sport_type || 'ciclismo',
        durationMin: workout.duration_min || 60,
        title: workout.title || '',
        warmup: workout.warmup || '',
        main: workout.main || '',
        cooldown: workout.cooldown || ''
      })
      setError(null)
      setSuccess(false)
    }
  }, [workout, isOpen])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'durationMin' ? parseInt(value) || 0 : value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!workout) return

    setLoading(true)
    setError(null)

    try {
      const isNew = workout.id === 'new'
      
      let res;
      if (isNew) {
        res = await saveCoachWorkout(athleteId, {
          scheduledDate: workout.scheduled_date || new Date().toISOString().split('T')[0],
          sportType: formData.sportType,
          durationMin: formData.durationMin,
          title: formData.title,
          warmup: formData.warmup,
          main: formData.main,
          cooldown: formData.cooldown
        })
      } else {
        res = await updateCoachWorkoutDetails(athleteId, workout.id, workout.session_id, formData)
      }

      if (res.error) {
        setError(res.error)
        setLoading(false)
      } else {
        setSuccess(true)
        setTimeout(() => {
          onClose()
          setLoading(false)
          router.refresh()
        }, 1500)
      }
    } catch (err) {
      setError('Ocurrió un error inesperado al procesar la solicitud.')
      setLoading(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && workout && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => !loading && onClose()}
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
                <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                  <Edit3 className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-zinc-100">{workout.id === 'new' ? 'Crear Nuevo Entrenamiento' : 'Editar Entrenamiento'}</h3>
                  <p className="text-[10px] text-zinc-400">{workout.id === 'new' ? 'Configura el bloque para tu atleta.' : 'Modifica los detalles del bloque seleccionado.'}</p>
                </div>
              </div>
              <button 
                onClick={onClose}
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
                  <p className="text-xs font-bold text-emerald-400 uppercase tracking-widest">¡Actualizado!</p>
                  <p className="text-[10px] text-zinc-500">Recalculando carga en el calendario...</p>
                </motion.div>
              ) : (
                <>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-1.5 col-span-2">
                      <label className="text-[10px] text-zinc-400 uppercase tracking-wider font-semibold">Tipo de Deporte</label>
                      <select 
                        name="sportType"
                        value={formData.sportType}
                        onChange={handleInputChange}
                        className="w-full bg-zinc-900 border border-zinc-800 focus:border-cyan-500 rounded-xl p-3 text-xs text-white outline-none transition-colors cursor-pointer"
                      >
                        <option value="ciclismo">🚴‍♂️ Ciclismo</option>
                        <option value="carrera">🏃‍♂️ Carrera</option>
                        <option value="natacion">🏊‍♂️ Natación</option>
                        <option value="fuerza">🏋️‍♂️ Fuerza</option>
                      </select>
                    </div>

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
                          className="w-full bg-zinc-900 border border-zinc-800 focus:border-cyan-500 rounded-xl p-3 pr-8 text-xs text-white outline-none transition-colors"
                        />
                        <Clock className="w-3.5 h-3.5 text-zinc-500 absolute right-3" />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] text-zinc-400 uppercase tracking-wider font-semibold">Título del Bloque</label>
                    <input 
                      type="text"
                      name="title"
                      placeholder="Ej: Intervals VO2Max"
                      value={formData.title}
                      onChange={handleInputChange}
                      className="w-full bg-zinc-900 border border-zinc-800 focus:border-cyan-500 rounded-xl p-3 text-xs text-white outline-none transition-colors"
                    />
                  </div>

                  <div className="border-t border-zinc-900 my-2" />

                  {/* Warmup */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] text-zinc-400 uppercase tracking-wider font-semibold">1. Calentamiento (Warmup)</label>
                    </div>
                    <textarea 
                      name="warmup"
                      rows={2}
                      value={formData.warmup}
                      onChange={handleInputChange}
                      className="w-full bg-zinc-900 border border-zinc-800 focus:border-cyan-500 rounded-xl p-3 text-xs text-white outline-none transition-colors resize-none"
                    />
                  </div>

                  {/* Main */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] text-cyan-400 uppercase tracking-wider font-semibold">2. Parte Principal</label>
                    </div>
                    <textarea 
                      name="main"
                      rows={3}
                      required
                      value={formData.main}
                      onChange={handleInputChange}
                      className="w-full bg-zinc-900 border border-zinc-800 focus:border-cyan-500 rounded-xl p-3 text-xs text-white outline-none transition-colors resize-none"
                    />
                  </div>

                  {/* Cooldown */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] text-zinc-400 uppercase tracking-wider font-semibold">3. Enfriamiento (Cooldown)</label>
                    </div>
                    <textarea 
                      name="cooldown"
                      rows={2}
                      value={formData.cooldown}
                      onChange={handleInputChange}
                      className="w-full bg-zinc-900 border border-zinc-800 focus:border-cyan-500 rounded-xl p-3 text-xs text-white outline-none transition-colors resize-none"
                    />
                  </div>

                  {/* Submit Button */}
                  <AnimatedButton
                    variant="primary"
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 !bg-cyan-500 hover:!bg-cyan-400 !text-black shadow-lg shadow-cyan-500/10 font-bold text-xs flex items-center justify-center gap-1.5"
                  >
                    {loading ? 'Guardando...' : (
                      <>
                        <Activity className="w-4 h-4 text-black" />
                        Guardar Cambios
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
  )
}
