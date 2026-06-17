'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Watch, Check, RefreshCw, Smartphone } from 'lucide-react'
import { AnimatedButton } from '@/components/ui/animated-button'

interface WatchSyncModalProps {
  isOpen: boolean
  onClose: () => void
  workout: {
    scheduled_date: string
    training_sessions: {
      sport_type: string
      duration_min: number
      description: string
    }
  }
}

export function WatchSyncModal({ isOpen, onClose, workout }: WatchSyncModalProps) {
  const [progress, setProgress] = React.useState(0)
  const [syncState, setSyncState] = React.useState<'connecting' | 'syncing' | 'verifying' | 'success'>('connecting')

  React.useEffect(() => {
    if (!isOpen) {
      setProgress(0)
      setSyncState('connecting')
      return
    }

    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval)
          return 100
        }
        
        const nextProgress = prev + 1
        
        // Update states based on progress percentage
        if (nextProgress < 30) {
          setSyncState('connecting')
        } else if (nextProgress >= 30 && nextProgress < 75) {
          setSyncState('syncing')
        } else if (nextProgress >= 75 && nextProgress < 100) {
          setSyncState('verifying')
        } else if (nextProgress === 100) {
          setSyncState('success')
        }

        return nextProgress
      })
    }, 30) // 100 * 30ms = 3 seconds total

    return () => clearInterval(interval)
  }, [isOpen])

  if (!isOpen) return null

  const session = workout.training_sessions
  const sportEmoji = session.sport_type === 'ciclismo' ? '🚴‍♂️' : session.sport_type === 'carrera' ? '🏃‍♂️' : session.sport_type === 'natacion' ? '🏊‍♂️' : '🏋️‍♂️'

  const getStateText = () => {
    switch (syncState) {
      case 'connecting':
        return 'Buscando dispositivo vinculado...'
      case 'syncing':
        return 'Enviando bloques e intervalos de entrenamiento...'
      case 'verifying':
        return 'Verificando firmas de datos en Garmin Connect...'
      case 'success':
        return '¡Entrenamiento sincronizado con éxito!'
    }
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={syncState === 'success' ? onClose : undefined}
          className="absolute inset-0 bg-zinc-900/60 backdrop-blur-sm"
        />

        {/* Modal container */}
        <motion.div 
          initial={{ scale: 0.95, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 15 }}
          transition={{ type: 'spring', duration: 0.4 }}
          className="relative w-full max-w-sm bg-white border border-zinc-200 rounded-2xl shadow-2xl overflow-hidden z-10 flex flex-col p-6 items-center text-center space-y-6"
        >
          {/* Close button */}
          {syncState === 'success' && (
            <button 
              onClick={onClose}
              className="absolute top-4 right-4 w-7 h-7 rounded-lg border border-zinc-200 flex items-center justify-center text-zinc-400 hover:text-zinc-650 hover:bg-zinc-100 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Sync Animation Widget */}
          <div className="relative w-40 h-40 flex items-center justify-center">
            {/* Pulsing glow behind watch */}
            <div className={`absolute inset-4 rounded-full blur-xl transition-colors duration-500 -z-10 ${
              syncState === 'success' ? 'bg-emerald-500/10' : 'bg-orange-500/5'
            }`} />

            {/* Smartwatch Outer Case Mockup */}
            <div className="absolute inset-0 rounded-full border-4 border-zinc-250 bg-zinc-50 shadow-inner flex items-center justify-center">
              
              {/* Screen Rim */}
              <div className="w-[144px] h-[144px] rounded-full border border-zinc-200 bg-white overflow-hidden flex flex-col items-center justify-center p-4 relative">
                
                {/* Watch Content: Success State vs Syncing State */}
                <AnimatePresence mode="wait">
                  {syncState === 'success' ? (
                    <motion.div 
                      key="success"
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="flex flex-col items-center justify-center space-y-1"
                    >
                      <div className="w-11 h-11 rounded-full bg-emerald-50 border border-emerald-250 flex items-center justify-center text-emerald-600">
                        <Check className="w-6 h-6 stroke-[3]" />
                      </div>
                      <span className="text-[10px] font-black text-emerald-600 tracking-wider uppercase">¡LISTO!</span>
                      <span className="text-[8px] text-zinc-500 font-semibold truncate max-w-[110px]">Ver en tu reloj</span>
                    </motion.div>
                  ) : (
                    <motion.div 
                      key="syncing"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex flex-col items-center justify-center space-y-1.5"
                    >
                      <div className="relative">
                        <Watch className="w-10 h-10 text-orange-500" />
                        <motion.div 
                          animate={{ rotate: 360 }}
                          transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
                          className="absolute -top-1 -right-1"
                        >
                          <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
                        </motion.div>
                      </div>
                      <span className="text-[11px] font-black text-zinc-800">{progress}%</span>
                      <div className="w-16 h-1 bg-zinc-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-orange-500 transition-all duration-100"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Outer Ring Progress Arc */}
                {syncState !== 'success' && (
                  <svg className="absolute inset-0 w-full h-full transform -rotate-90">
                    <circle 
                      cx="72" 
                      cy="72" 
                      r="68" 
                      stroke="rgba(34, 211, 238, 0.15)" 
                      strokeWidth="2" 
                      fill="transparent"
                    />
                    <motion.circle 
                      cx="72" 
                      cy="72" 
                      r="68" 
                      stroke="#f97316" 
                      strokeWidth="2.5" 
                      fill="transparent"
                      strokeDasharray={2 * Math.PI * 68}
                      strokeDashoffset={2 * Math.PI * 68 * (1 - progress / 100)}
                    />
                  </svg>
                )}
              </div>
            </div>
          </div>

          {/* Sync status labels */}
          <div className="space-y-1.5 w-full">
            <h4 className="text-sm font-bold text-zinc-850 flex items-center justify-center gap-1.5">
              {syncState === 'success' ? (
                <span className="text-emerald-600">Sincronización Completada</span>
              ) : (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse"></span>
                  <span>Enviando al Reloj</span>
                </>
              )}
            </h4>
            <p className="text-[11px] text-zinc-500 min-h-[16px] max-w-[240px] mx-auto leading-relaxed">
              {getStateText()}
            </p>
          </div>

          {/* Structured block visualization preview */}
          <div className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-3 text-left space-y-2">
            <div className="flex justify-between items-center text-[10px] text-zinc-500">
              <span className="font-bold uppercase tracking-wider">Bloques Estructurados</span>
              <span className="font-semibold">{sportEmoji} {session.sport_type.toUpperCase()}</span>
            </div>
            
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] border-b border-zinc-150 pb-1">
                <span className="text-zinc-500">1. Calentamiento:</span>
                <span className="text-zinc-750 font-medium">Hasta Lap (abierto)</span>
              </div>
              <div className="flex items-center justify-between text-[11px] border-b border-zinc-150 pb-1">
                <span className="text-zinc-500">2. Intervalo Principal:</span>
                <span className="text-orange-600 font-bold">5x Repeticiones</span>
              </div>
              <div className="flex items-center justify-between text-[11px] pb-0.5">
                <span className="text-zinc-500">3. Enfriamiento:</span>
                <span className="text-zinc-750 font-medium">10 min Z1</span>
              </div>
            </div>
          </div>

          {/* Action trigger button */}
          <div className="w-full pt-2">
            {syncState === 'success' ? (
              <AnimatedButton
                variant="primary"
                onClick={onClose}
                className="w-full py-3 !bg-emerald-500 hover:!bg-emerald-400 !text-black font-bold text-xs"
              >
                Cerrar y Empezar Entreno
              </AnimatedButton>
            ) : (
              <div className="flex items-center justify-center gap-2 text-[10px] text-zinc-500">
                <Smartphone className="w-3.5 h-3.5 animate-pulse" />
                <span>Compatible con Garmin, Apple Watch y Coros</span>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
