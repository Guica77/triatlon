'use client'
 
import * as React from 'react'
import { ProCard } from '@/components/ui/pro-card'
import { Flame, Zap, Dumbbell, Droplet, Watch } from 'lucide-react'
import { motion } from 'framer-motion'
import { DynamicNutritionData } from '@/lib/nutrition-utility'
 
interface DailyFuelCardProps {
  nutritionData?: DynamicNutritionData | null
  error?: string | null
  loading?: boolean
}
 
export function DailyFuelCard({ nutritionData, error, loading = false }: DailyFuelCardProps) {
  if (loading) {
    return (
      <ProCard className="p-4 sm:p-6 h-[256px] flex flex-col justify-center items-center space-y-3 border-zinc-200 bg-white shadow-sm">
        <div className="w-8 h-8 rounded-full border-2 border-emerald-500/20 border-t-emerald-500 animate-spin" />
        <span className="text-xs text-zinc-500 font-medium">Calculando combustible diario...</span>
      </ProCard>
    )
  }
 
  if (error || !nutritionData) {
    return (
      <ProCard className="p-4 sm:p-6 h-[256px] flex flex-col justify-center items-center text-center p-6 border-zinc-200 bg-white shadow-sm">
        <Flame className="w-8 h-8 text-zinc-300 mb-2" />
        <h4 className="text-sm font-semibold text-zinc-700">Servicio de Nutrición Inactivo</h4>
        <p className="text-xs text-zinc-500 mt-1 max-w-[240px]">
          No pudimos calcular tus necesidades calóricas hoy. Asegúrate de configurar tu peso en Ajustes.
        </p>
      </ProCard>
    )
  }
 
  const { totalCalories, activeExpenditure, bmr, macros } = nutritionData
  const targetCalories = totalCalories
 
  // Ingesta aproximada al 74% de la carga
  const consumedCalories = Math.round(targetCalories * 0.74)
  const percentComplete = Math.min(100, Math.round((consumedCalories / targetCalories) * 100))
 
  // Circunferencia SVG = 2 * PI * r = 2 * 3.14159 * 42 = 263.89
  const strokeDashoffset = 263.89 * (1 - percentComplete / 100)
 
  return (
    <ProCard className="p-4 sm:p-6 space-y-6 relative overflow-hidden border-zinc-200 bg-white shadow-sm h-full flex flex-col justify-between">
      {/* Cabecera Premium */}
      <div className="flex justify-between items-center border-b border-zinc-100 pb-4 relative z-10">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-xs font-semibold tracking-widest text-zinc-400 uppercase">Combustible del Día</span>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] bg-emerald-50 border border-emerald-200 text-emerald-600 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
          <Watch className="w-3 h-3" />
          <span>Garmin / Health Sync</span>
        </div>
      </div>
 
      {/* Círculo de Energía y Calorías */}
      <div className="flex items-center gap-6 relative z-10 py-1">
        <div className="relative w-24 h-24 flex items-center justify-center shrink-0">
          <svg className="absolute inset-0 w-full h-full transform -rotate-90 overflow-visible" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="42"
              className="stroke-zinc-100"
              strokeWidth="6"
              fill="transparent"
            />
            <circle
              cx="50"
              cy="50"
              r="42"
              stroke="#10b981"
              strokeWidth="6"
              fill="transparent"
              strokeDasharray="263.89"
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-1000 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold tracking-tight text-zinc-900">{consumedCalories}</span>
            <span className="text-[9px] text-zinc-550 font-bold uppercase mt-0.5">/ {targetCalories} kcal</span>
          </div>
        </div>
 
        <div className="space-y-1">
          <h4 className="text-base font-semibold text-zinc-800 flex items-center gap-1.5">
            Balance Energético
          </h4>
          <p className="text-xs text-zinc-500 leading-relaxed max-w-[200px]">
            Base metabólica: <strong className="text-zinc-700">{bmr} kcal</strong>. Gasto en entrenamientos: <strong className="text-emerald-600">+{activeExpenditure} kcal</strong>.
          </p>
        </div>
      </div>
 
      {/* Desglose de Macronutrientes */}
      <div className="space-y-3 relative z-10 pt-2 border-t border-zinc-100">
        
        {/* Carbohidratos */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="font-semibold text-zinc-650 flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-rose-500" />
              Carbohidratos
            </span>
            <span className="text-zinc-500 font-mono">
              <strong className="text-rose-500">{Math.round(macros.carbs.grams * 0.74)}g</strong> / {macros.carbs.grams}g
            </span>
          </div>
          <div className="w-full h-1.5 bg-zinc-100 rounded-full overflow-hidden border border-zinc-200/50">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: '74%' }}
              transition={{ duration: 1, ease: 'easeOut' }}
              className="h-full bg-rose-500 rounded-full"
            />
          </div>
        </div>
 
        {/* Proteínas */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="font-semibold text-zinc-650 flex items-center gap-1">
              <Dumbbell className="w-3.5 h-3.5 text-sky-500" />
              Proteínas
            </span>
            <span className="text-zinc-500 font-mono">
              <strong className="text-sky-500">{Math.round(macros.protein.grams * 0.7)}g</strong> / {macros.protein.grams}g
            </span>
          </div>
          <div className="w-full h-1.5 bg-zinc-100 rounded-full overflow-hidden border border-zinc-200/50">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: '70%' }}
              transition={{ duration: 1, ease: 'easeOut', delay: 0.1 }}
              className="h-full bg-sky-500 rounded-full"
            />
          </div>
        </div>
 
        {/* Grasas */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="font-semibold text-zinc-650 flex items-center gap-1">
              <Droplet className="w-3.5 h-3.5 text-lime-500" />
              Grasas
            </span>
            <span className="text-zinc-500 font-mono">
              <strong className="text-lime-500">{Math.round(macros.fat.grams * 0.74)}g</strong> / {macros.fat.grams}g
            </span>
          </div>
          <div className="w-full h-1.5 bg-zinc-100 rounded-full overflow-hidden border border-zinc-200/50">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: '74%' }}
              transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }}
              className="h-full bg-lime-500 rounded-full"
            />
          </div>
        </div>
 
      </div>
    </ProCard>
  )
}
