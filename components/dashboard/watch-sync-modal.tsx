'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Watch, Check, RefreshCw } from 'lucide-react'
import { AnimatedButton } from '@/components/ui/animated-button'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'

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

function getProgressWidthClass(progress: number): string {
  if (progress >= 100) return 'w-[100%]';
  if (progress >= 95) return 'w-[95%]';
  if (progress >= 90) return 'w-[90%]';
  if (progress >= 85) return 'w-[85%]';
  if (progress >= 80) return 'w-[80%]';
  if (progress >= 75) return 'w-[75%]';
  if (progress >= 70) return 'w-[70%]';
  if (progress >= 65) return 'w-[65%]';
  if (progress >= 60) return 'w-[60%]';
  if (progress >= 55) return 'w-[55%]';
  if (progress >= 50) return 'w-[50%]';
  if (progress >= 45) return 'w-[45%]';
  if (progress >= 40) return 'w-[40%]';
  if (progress >= 35) return 'w-[35%]';
  if (progress >= 30) return 'w-[30%]';
  if (progress >= 25) return 'w-[25%]';
  if (progress >= 20) return 'w-[20%]';
  if (progress >= 15) return 'w-[15%]';
  if (progress >= 10) return 'w-[10%]';
  if (progress >= 5) return 'w-[5%]';
  return 'w-[0%]';
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
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        showCloseButton={false}
        onInteractOutside={(e) => { if (syncState !== 'success') e.preventDefault() }}
        onEscapeKeyDown={(e) => { if (syncState !== 'success') e.preventDefault() }}
        className="max-w-sm p-6 sm:rounded-2xl flex flex-col items-center text-center space-y-6 overflow-hidden border-zinc-200"
      >
        <VisuallyHidden>
          <DialogTitle>Sincronización con el reloj</DialogTitle>
        </VisuallyHidden>

        {/* Close button (solo en éxito) */}
        {syncState === 'success' && (
          <button 
            onClick={onClose}
            title="Cerrar"
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
                          className={`h-full bg-orange-500 transition-all duration-100 ${getProgressWidthClass(progress)}`}
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

          {/* Action Button */}
        <div className="w-full pt-2">
          {syncState === 'success' ? (
            <AnimatedButton
              onClick={onClose}
              variant="primary"
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-12 rounded-xl shadow-lg shadow-emerald-500/20"
            >
              Continuar
            </AnimatedButton>
          ) : (
            <AnimatedButton
              disabled
              variant="secondary"
              className="w-full bg-zinc-50 border-zinc-200 text-zinc-400 font-bold h-12 rounded-xl opacity-75"
            >
              Cancelando...
            </AnimatedButton>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
