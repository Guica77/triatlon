'use client'

import * as React from 'react'
import { Activity, Moon, Heart, Battery, Flame, ActivitySquare } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'

interface DetailedBiometricsModalProps {
  isOpen: boolean
  onClose: () => void
  rawGarminData: any
}

export function DetailedBiometricsModal({ isOpen, onClose, rawGarminData }: DetailedBiometricsModalProps) {
  if (!isOpen || !rawGarminData) return null

  const stats = rawGarminData.stats || {}
  const sleep = rawGarminData.sleep || {}
  const hrv = rawGarminData.hrv || {}
  const training = rawGarminData.training_status || {}

  const hrvAvg = hrv.hrvSummary?.lastNightAvg || hrv.lastNightAvg || '--'
  const vo2Max = training.vo2Max || '--'
  const trainingLoad = training.trainingLoad || '--'
  const trainingStatus = training.trainingStatus || 'Sin datos'

  const steps = stats.totalSteps || 0
  const activeCals = Math.round(stats.wellnessActiveKilocalories || 0)
  const totalCals = Math.round(stats.totalKilocalories || 0)
  const maxHr = stats.maxHeartRate || 0
  const minHr = stats.minHeartRate || 0
  const rhr = stats.restingHeartRate || 0
  const bodyBatteryMax = stats.bodyBatteryHighestValue || 0
  const bodyBatteryMin = stats.bodyBatteryLowestValue || 0

  const formatHours = (seconds: number) => {
    if (!seconds) return '0h'
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    return `${h}h ${m}m`
  }

  const deepSleep = formatHours(sleep.dailySleepDTO?.deepSleepSeconds || 0)
  const lightSleep = formatHours(sleep.dailySleepDTO?.lightSleepSeconds || 0)
  const remSleep = formatHours(sleep.dailySleepDTO?.remSleepSeconds || 0)
  const awakeSleep = formatHours(sleep.dailySleepDTO?.awakeSleepSeconds || 0)
  const totalSleep = formatHours(sleep.dailySleepDTO?.sleepTimeSeconds || 0)

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-hidden p-0 flex flex-col gap-0 border-zinc-200">
          {/* Header */}
          <DialogHeader className="p-5 border-b border-zinc-100 flex-row items-center justify-between shrink-0 bg-zinc-50/50 m-0">
            <div className="flex items-center gap-3 text-sky-600">
              <div className="w-10 h-10 rounded-xl bg-sky-100 flex items-center justify-center">
                <ActivitySquare className="w-5 h-5" />
              </div>
              <div className="text-left space-y-0.5">
                <DialogTitle className="font-bold text-zinc-900 text-lg leading-tight">Telemetría Completa</DialogTitle>
                <DialogDescription className="text-xs font-medium text-zinc-500">Datos en crudo extraídos de Garmin</DialogDescription>
              </div>
            </div>
          </DialogHeader>
          
          <div className="p-5 overflow-y-auto custom-scrollbar flex-1 space-y-6">
            {/* Actividad */}
            <section>
              <h4 className="flex items-center gap-2 text-sm font-bold text-zinc-900 mb-3 uppercase tracking-wider">
                <Flame className="w-4 h-4 text-orange-500" /> Actividad Diaria
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-orange-50/50 border border-orange-100 rounded-2xl p-4">
                  <span className="text-[10px] font-bold text-orange-600/80 uppercase tracking-wider block mb-1">Pasos Totales</span>
                  <span className="text-2xl font-black text-orange-700">{steps.toLocaleString('es-ES')}</span>
                </div>
                <div className="bg-orange-50/50 border border-orange-100 rounded-2xl p-4">
                  <span className="text-[10px] font-bold text-orange-600/80 uppercase tracking-wider block mb-1">Calorías Activas</span>
                  <span className="text-2xl font-black text-orange-700">{activeCals} <span className="text-sm">kcal</span></span>
                </div>
              </div>
            </section>

            {/* Frecuencia Cardíaca y Estrés */}
            <section>
              <h4 className="flex items-center gap-2 text-sm font-bold text-zinc-900 mb-3 uppercase tracking-wider">
                <Heart className="w-4 h-4 text-rose-500" /> Sistema Nervioso
              </h4>
              <div className="grid grid-cols-3 gap-3 mb-3">
                <div className="bg-rose-50/50 border border-rose-100 rounded-2xl p-3 text-center">
                  <span className="text-[10px] font-bold text-rose-600/80 uppercase tracking-wider block mb-0.5">Máx.</span>
                  <span className="text-lg font-black text-rose-700">{maxHr} <span className="text-[10px]">bpm</span></span>
                </div>
                <div className="bg-rose-50/50 border border-rose-100 rounded-2xl p-3 text-center">
                  <span className="text-[10px] font-bold text-rose-600/80 uppercase tracking-wider block mb-0.5">Reposo</span>
                  <span className="text-lg font-black text-rose-700">{rhr} <span className="text-[10px]">bpm</span></span>
                </div>
                <div className="bg-rose-50/50 border border-rose-100 rounded-2xl p-3 text-center">
                  <span className="text-[10px] font-bold text-rose-600/80 uppercase tracking-wider block mb-0.5">Mín.</span>
                  <span className="text-lg font-black text-rose-700">{minHr} <span className="text-[10px]">bpm</span></span>
                </div>
              </div>
              <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                    <Battery className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-zinc-800 block">Body Battery</span>
                    <span className="text-[10px] font-medium text-zinc-500">Recarga del día</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-lg font-black text-emerald-600 block">{bodyBatteryMax}%</span>
                  <span className="text-[10px] font-bold text-zinc-400">Mín: {bodyBatteryMin}%</span>
                </div>
              </div>
            </section>

            {/* Sueño Detallado */}
            <section>
              <h4 className="flex items-center gap-2 text-sm font-bold text-zinc-900 mb-3 uppercase tracking-wider">
                <Moon className="w-4 h-4 text-indigo-500" /> Fases del Sueño
              </h4>
              <div className="bg-indigo-50/50 border border-indigo-100 rounded-2xl overflow-hidden">
                <div className="p-4 border-b border-indigo-100/50 flex justify-between items-center">
                  <span className="text-xs font-bold text-indigo-900">Tiempo Total</span>
                  <span className="text-lg font-black text-indigo-700">{totalSleep}</span>
                </div>
                <div className="p-4 grid grid-cols-2 gap-y-4">
                  <div>
                    <span className="text-[10px] font-bold text-indigo-600/80 uppercase tracking-wider block mb-0.5">Profundo</span>
                    <span className="text-sm font-black text-indigo-900">{deepSleep}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-indigo-600/80 uppercase tracking-wider block mb-0.5">REM</span>
                    <span className="text-sm font-black text-indigo-900">{remSleep}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-indigo-600/80 uppercase tracking-wider block mb-0.5">Ligero</span>
                    <span className="text-sm font-black text-indigo-900">{lightSleep}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-indigo-600/80 uppercase tracking-wider block mb-0.5">Despierto</span>
                    <span className="text-sm font-black text-indigo-900">{awakeSleep}</span>
                  </div>
                </div>
              </div>
            </section>

            {/* Rendimiento (HRV y Training) */}
            <section>
              <h4 className="flex items-center gap-2 text-sm font-bold text-zinc-900 mb-3 uppercase tracking-wider">
                <Activity className="w-4 h-4 text-violet-500" /> Rendimiento y Carga
              </h4>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div className="bg-violet-50/50 border border-violet-100 rounded-2xl p-4 flex flex-col justify-center items-center">
                  <span className="text-[10px] font-bold text-violet-600/80 uppercase tracking-wider block mb-1">VFC (HRV)</span>
                  <span className="text-2xl font-black text-violet-700">{hrvAvg} <span className="text-xs">ms</span></span>
                </div>
                <div className="bg-violet-50/50 border border-violet-100 rounded-2xl p-4 flex flex-col justify-center items-center">
                  <span className="text-[10px] font-bold text-violet-600/80 uppercase tracking-wider block mb-1">VO2 Max</span>
                  <span className="text-2xl font-black text-violet-700">{vo2Max}</span>
                </div>
              </div>
              <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-violet-100 text-violet-600 flex items-center justify-center">
                    <ActivitySquare className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-zinc-800 block">Training Status</span>
                    <span className="text-[10px] font-medium text-zinc-500">Estado general</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-sm font-black text-violet-600 block uppercase">{trainingStatus}</span>
                  <span className="text-[10px] font-bold text-zinc-400">Carga: {trainingLoad}</span>
                </div>
              </div>
            </section>
          </div>
      </DialogContent>
    </Dialog>
  )
}
