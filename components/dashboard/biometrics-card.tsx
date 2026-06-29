'use client'
 
import * as React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { AnimatedButton } from '@/components/ui/animated-button'
import { Activity, Moon, Heart, Settings, Flame, Brain, Watch, Loader2 } from 'lucide-react'
import { DailyBiometrics, updateBiometrics, calculateReadiness, syncGarminToDatabaseAction } from '@/app/(app)/dashboard/biometrics-actions'
import { BiometricsModal } from '@/components/dashboard/biometrics-modal'
import { DetailedBiometricsModal } from '@/components/dashboard/detailed-biometrics-modal'
import { motion } from 'framer-motion'
 
interface BiometricsCardProps {
  initialBiometrics: DailyBiometrics
  initialBiometricsHistory?: any[]
  readOnly?: boolean
  isGarminConnected?: boolean
}
 
export function BiometricsCard({ initialBiometrics, initialBiometricsHistory = [], readOnly = false, isGarminConnected = false }: BiometricsCardProps) {
  const [biometrics, setBiometrics] = React.useState<DailyBiometrics>(initialBiometrics)
  const [isModalOpen, setIsModalOpen] = React.useState(false)
  const [isDetailedModalOpen, setIsDetailedModalOpen] = React.useState(false)
  const [isSyncing, setIsSyncing] = React.useState(false)
  const [statusLabels, setStatusLabels] = React.useState({
    sleepStatus: 'Pendiente',
    hrvStatus: 'Pendiente',
    rhrStatus: 'Pendiente',
  })
 
  const isRegistered = biometrics.readiness_score !== null
 
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
 
    await updateBiometrics(formData)
  }

  async function handleSyncGarmin() {
    setIsSyncing(true)
    try {
      const res = await syncGarminToDatabaseAction() as any
      if (res.error) {
        alert(res.error)
      } else {
        alert('¡Datos sincronizados desde Garmin correctamente!')
      }
    } catch (e) {
      console.error(e)
      alert('Error inesperado al conectar con Garmin')
    } finally {
      setIsSyncing(false)
    }
  }
  
  // Auto-sync on mount if not registered
  const hasAttemptedAutoSync = React.useRef(false)
  
  React.useEffect(() => {
    if (!readOnly && isGarminConnected && !isRegistered && !hasAttemptedAutoSync.current) {
      hasAttemptedAutoSync.current = true
      handleSyncGarmin()
    }
  }, [readOnly, isGarminConnected, isRegistered])
 
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

  // Generador de sparkline para tendencias de 7 días
  const getSparklinePath = (field: 'sleep_hours' | 'hrv' | 'rhr', width = 120, height = 30) => {
    if (!initialBiometricsHistory || initialBiometricsHistory.length < 2) return null;

    const data = initialBiometricsHistory
      .map(d => ({ date: d.date, val: d[field] !== null && d[field] !== undefined ? Number(d[field]) : null }))
      .filter((d): d is { date: string; val: number } => d.val !== null && !isNaN(d.val));

    if (data.length < 2) return null;

    const values = data.map(d => d.val);
    const minVal = Math.min(...values);
    const maxVal = Math.max(...values);
    const range = maxVal - minVal || 1;

    const points = data.map((d, idx) => {
      const x = (idx / (data.length - 1)) * width;
      const y = height - 3 - ((d.val - minVal) / range) * (height - 6);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(' ');

    return {
      linePath: `M ${points}`,
      areaPath: `M ${points} L ${width},${height} L 0,${height} Z`
    };
  };

  // Extract raw garmin data if available
  const rawData = biometrics.raw_garmin_data || {}
  const stats = rawData.stats || {}
  const training = rawData.training_status || {}
  const bodyBattery = stats.bodyBatteryHighestValue || stats.bodyBatteryHighest || '--'
  const steps = stats.totalSteps ? stats.totalSteps.toLocaleString() : '--'
  const activeCals = stats.wellnessActiveKilocalories ? Math.round(stats.wellnessActiveKilocalories) : '--'
  const vo2Max = training.vo2Max || '--';
 
  return (
    <>
      <Card className="relative overflow-hidden border-zinc-200 bg-gradient-to-br from-white to-zinc-50/30 shadow-sm hover:shadow-md transition-all duration-300 h-full flex flex-col justify-between">
        <CardContent className="p-4 sm:p-6 space-y-6">
        
        {/* Cabecera */}
        <div className="flex justify-between items-center border-b border-zinc-100 pb-4 relative z-10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center shadow-sm">
              <Activity className="w-4 h-4 text-emerald-600 animate-pulse" />
            </div>
            <span className="text-xs font-bold tracking-widest text-zinc-450 uppercase">Biometría y Preparación</span>
          </div>
          <div className="flex items-center gap-2">
          {!readOnly && isGarminConnected && !isRegistered && (
            <AnimatedButton
              variant="ghost"
              size="sm"
              onClick={handleSyncGarmin}
              disabled={isSyncing}
              className="flex items-center gap-1.5 text-[10px] font-bold text-sky-600 bg-sky-50 hover:bg-sky-100 border border-sky-200 py-1.5 px-2.5 rounded-lg transition-all"
            >
              {isSyncing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Watch className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{isSyncing ? 'Conectando...' : 'Sincronizar Reloj'}</span>
              <span className="sm:hidden">{isSyncing ? '...' : 'Sincronizar'}</span>
            </AnimatedButton>
          )}
          
          {!readOnly && (
            <div className="flex items-center gap-1.5">
              <AnimatedButton
                variant="secondary"
                size="sm"
                onClick={() => setIsModalOpen(true)}
                className={`flex items-center gap-1.5 text-xs py-1.5 px-3 transition-all duration-300 cursor-pointer shadow-sm border-zinc-200 hover:border-zinc-300 text-zinc-700 bg-white hover:bg-zinc-50`}
              >
                <Settings className={`w-3.5 h-3.5 text-zinc-500`} />
                <span className="hidden sm:inline">Ajuste Manual</span>
              </AnimatedButton>
            </div>
          )}
          </div>
        </div>
 
        {/* Sección Principal: Anillo y Estado */}
        <div className="flex flex-col sm:flex-row items-center gap-6 relative z-10 py-2">
          <div 
            onClick={() => !readOnly && !isRegistered && setIsModalOpen(true)}
            className={`relative w-28 h-28 flex items-center justify-center shrink-0 group ${!readOnly && !isRegistered ? 'cursor-pointer' : ''}`}
          >
            {/* SVG del Dial con Gradientes */}
            <svg className="absolute inset-0 w-full h-full transform -rotate-90 overflow-visible" viewBox="0 0 100 100">
              <defs>
                <linearGradient id="readinessOptimal" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#10b981" />
                  <stop offset="100%" stopColor="#06b6d4" />
                </linearGradient>
                <linearGradient id="readinessModerate" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#f59e0b" />
                  <stop offset="100%" stopColor="#eab308" />
                </linearGradient>
                <linearGradient id="readinessAlert" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#f43f5e" />
                  <stop offset="100%" stopColor="#e11d48" />
                </linearGradient>
              </defs>
              
              {/* Círculo de fondo (pista de tacómetro) */}
              <circle
                cx="50"
                cy="50"
                r="42"
                className={!isRegistered ? "stroke-zinc-200/80" : "stroke-zinc-100"}
                strokeWidth={!isRegistered ? "4" : "6"}
                strokeDasharray={!isRegistered ? "5 4" : "none"}
                fill="transparent"
              />
              
              {/* Círculo activo coloreado */}
              {isRegistered && (
                <motion.circle
                  cx="50"
                  cy="50"
                  r="42"
                  stroke={isOptimal ? 'url(#readinessOptimal)' : isModerate ? 'url(#readinessModerate)' : 'url(#readinessAlert)'}
                  strokeWidth="6"
                  fill="transparent"
                  strokeDasharray="263.89"
                  initial={{ strokeDashoffset: 263.89 }}
                  animate={{ strokeDashoffset: 263.89 * (1 - (score / 100)) }}
                  transition={{ duration: 1.2, ease: 'easeOut' }}
                  strokeLinecap="round"
                />
              )}
            </svg>
            
            {/* Contenido Central */}
            <div className={`absolute inset-0 flex flex-col items-center justify-center transition-transform duration-300 ${!isRegistered && !readOnly ? 'group-hover:scale-105' : ''}`}>
              <span className="text-3xl font-black tracking-tight text-zinc-900 relative z-10 leading-none">
                {isRegistered ? score : '--'}
              </span>
              {!isRegistered && !readOnly && (
                <span className="text-[8px] text-emerald-600 font-extrabold uppercase tracking-widest mt-1.5 animate-pulse text-center leading-none">
                  REGISTRAR
                </span>
              )}
            </div>
          </div>
          <div className="text-center sm:text-left space-y-1">
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <h3 className="text-base font-bold text-zinc-800 tracking-tight leading-tight">
                {!isRegistered ? 'Métricas Pendientes' : isOptimal ? 'Readiness Óptimo' : isModerate ? 'Readiness Moderado' : 'Descanso Recomendado'}
              </h3>
              <span className={`w-2 h-2 rounded-full ${!isRegistered ? 'bg-zinc-300 animate-pulse' : isOptimal ? 'bg-emerald-500 animate-ping' : isModerate ? 'bg-amber-500' : 'bg-rose-500'}`} />
            </div>
            <p className="text-xs text-zinc-500 leading-relaxed font-semibold">
              {statusText}
            </p>
          </div>
        </div>
 
        {/* Grid de Desglose de Factores Objetivos */}
        <div className="grid grid-cols-3 gap-2.5 relative z-10">
          {/* Sueño */}
          <motion.div 
            whileHover={{ y: -2 }}
            className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-200/80 hover:border-violet-300 flex flex-col justify-between space-y-1.5 transition-all duration-300 shadow-sm"
          >
            <div className="flex items-center justify-between text-zinc-400">
              <span className="text-[9px] font-black uppercase tracking-wider text-zinc-500">SUEÑO</span>
              <Moon className="w-3.5 h-3.5 text-violet-500" />
            </div>
            <div className="flex items-baseline gap-0.5">
              <span className="text-lg font-black text-zinc-900 leading-none">{isRegistered ? biometrics.sleep_hours : '--'}</span>
              {isRegistered && <span className="text-[10px] text-zinc-450 font-bold">h</span>}
            </div>
            {/* Sparkline de Sueño */}
            {isRegistered && getSparklinePath('sleep_hours') && (
              <div className="h-6 w-full my-0.5">
                <svg className="w-full h-full overflow-visible" viewBox="0 0 120 30" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="sleepSparkGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>
                  <path d={getSparklinePath('sleep_hours')?.areaPath} fill="url(#sleepSparkGrad)" />
                  <path d={getSparklinePath('sleep_hours')?.linePath} fill="none" stroke="#8b5cf6" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            )}
            <span className={`text-[10px] font-black truncate ${isRegistered ? 'text-violet-600' : 'text-zinc-400'}`}>{statusLabels.sleepStatus}</span>
          </motion.div>
  
          {/* HRV */}
          <motion.div 
            whileHover={{ y: -2 }}
            className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-200/80 hover:border-rose-300 flex flex-col justify-between space-y-1.5 transition-all duration-300 shadow-sm"
          >
            <div className="flex items-center justify-between text-zinc-400">
              <span className="text-[9px] font-black uppercase tracking-wider text-zinc-500 cursor-help" title="Variabilidad del Ritmo Cardíaco (HRV). Un valor alto indica recuperación.">HRV</span>
              <Heart className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
            </div>
            <div className="flex items-baseline gap-0.5">
              <span className="text-lg font-black text-zinc-900 leading-none">{isRegistered ? biometrics.hrv : '--'}</span>
              {isRegistered && <span className="text-[10px] text-zinc-455 font-bold">ms</span>}
            </div>
            {/* Sparkline de HRV */}
            {isRegistered && getSparklinePath('hrv') && (
              <div className="h-6 w-full my-0.5">
                <svg className="w-full h-full overflow-visible" viewBox="0 0 120 30" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="hrvSparkGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>
                  <path d={getSparklinePath('hrv')?.areaPath} fill="url(#hrvSparkGrad)" />
                  <path d={getSparklinePath('hrv')?.linePath} fill="none" stroke="#f43f5e" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            )}
            <span className={`text-[10px] font-black truncate ${isRegistered ? 'text-rose-600' : 'text-zinc-400'}`}>{statusLabels.hrvStatus}</span>
          </motion.div>
  
          {/* RHR */}
          <motion.div 
            whileHover={{ y: -2 }}
            className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-200/80 hover:border-emerald-300 flex flex-col justify-between space-y-1.5 transition-all duration-300 shadow-sm"
          >
            <div className="flex items-center justify-between text-zinc-400">
              <span className="text-[9px] font-black uppercase tracking-wider text-zinc-500 cursor-help" title="Pulsaciones en Reposo (RHR). Un valor más bajo indica descanso.">RHR</span>
              <Activity className="w-3.5 h-3.5 text-emerald-500" />
            </div>
            <div className="flex items-baseline gap-0.5">
              <span className="text-lg font-black text-zinc-900 leading-none">{isRegistered ? biometrics.rhr : '--'}</span>
              {isRegistered && <span className="text-[10px] text-zinc-450 font-bold">bpm</span>}
            </div>
            {/* Sparkline de RHR */}
            {isRegistered && getSparklinePath('rhr') && (
              <div className="h-6 w-full my-0.5">
                <svg className="w-full h-full overflow-visible" viewBox="0 0 120 30" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="rhrSparkGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>
                  <path d={getSparklinePath('rhr')?.areaPath} fill="url(#rhrSparkGrad)" />
                  <path d={getSparklinePath('rhr')?.linePath} fill="none" stroke="#10b981" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            )}
            <span className={`text-[10px] font-black truncate ${isRegistered ? 'text-emerald-600' : 'text-zinc-400'}`}>{statusLabels.rhrStatus}</span>
          </motion.div>
 
        </div>
 
        {/* Factores Subjetivos y Extras de Garmin */}
        <div className="flex flex-col gap-3 pt-3 relative z-10 border-t border-zinc-100">
          <div className="flex flex-wrap gap-2.5">
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-zinc-50 border border-zinc-200 text-[11px] text-zinc-650 font-semibold shadow-sm">
              <Flame className="w-3.5 h-3.5 text-amber-500" />
              <span>Fatiga Muscular: <strong className="text-amber-600">{isRegistered ? `Nivel ${biometrics.fatigue_rating}/5` : 'Pendiente'}</strong></span>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-zinc-50 border border-zinc-200 text-[11px] text-zinc-650 font-semibold shadow-sm">
              <Brain className="w-3.5 h-3.5 text-emerald-500" />
              <span>Carga Mental: <strong className="text-emerald-650">{isRegistered ? `Nivel ${biometrics.stress_level}/5` : 'Pendiente'}</strong></span>
            </div>
          </div>
          
          {biometrics.raw_garmin_data && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4">
              <div className="bg-sky-50/50 border border-sky-100 rounded-xl p-2 sm:p-2.5 text-center overflow-hidden">
                <span className="text-[8px] sm:text-[9px] font-bold text-sky-600/80 uppercase tracking-wider block mb-0.5 truncate">Batería</span>
                <span className="text-sm sm:text-base font-black text-sky-700 truncate block">{bodyBattery}</span>
              </div>
              <div className="bg-orange-50/50 border border-orange-100 rounded-xl p-2 sm:p-2.5 text-center overflow-hidden">
                <span className="text-[8px] sm:text-[9px] font-bold text-orange-600/80 uppercase tracking-wider block mb-0.5 truncate">Calorías</span>
                <span className="text-sm sm:text-base font-black text-orange-700 truncate block">{activeCals}</span>
              </div>
              <div className="bg-teal-50/50 border border-teal-100 rounded-xl p-2 sm:p-2.5 text-center overflow-hidden">
                <span className="text-[8px] sm:text-[9px] font-bold text-teal-600/80 uppercase tracking-wider block mb-0.5 truncate">Pasos</span>
                <span className="text-sm sm:text-base font-black text-teal-700 truncate block">{steps}</span>
              </div>
              <div className="bg-violet-50/50 border border-violet-100 rounded-xl p-2 sm:p-2.5 text-center overflow-hidden">
                <span className="text-[8px] sm:text-[9px] font-bold text-violet-600/80 uppercase tracking-wider block mb-0.5 truncate">VO2 Max</span>
                <span className="text-sm sm:text-base font-black text-violet-700 truncate block">{vo2Max}</span>
              </div>
            </div>
          )}
        </div>
 
        </CardContent>
      </Card>
 
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
