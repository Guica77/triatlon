'use client'

import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'

interface KPICardProps {
  title: string
  value: string | number
  subtitle?: string
  trend?: number // percentage change
  icon: React.ComponentType<{ className?: string }>
  color: string // tailwind color classes
  delay?: number
}

export function KPICard({ title, value, subtitle, trend, icon: Icon, color, delay = 0 }: KPICardProps) {
  const trendColor = trend && trend > 0
    ? 'text-emerald-400'
    : trend && trend < 0
      ? 'text-red-400'
      : 'text-zinc-500'

  const TrendIcon = trend && trend > 0
    ? TrendingUp
    : trend && trend < 0
      ? TrendingDown
      : Minus

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
      className={cn(
        'bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5 relative overflow-hidden',
        'hover:border-zinc-700 transition-colors duration-200'
      )}
    >
      {/* Background glow */}
      <div className={cn('absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-5', color)} />

      <div className="flex items-start justify-between mb-3">
        <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center', color)}>
          <Icon className="w-4.5 h-4.5" />
        </div>
        {trend !== undefined && trend !== 0 && (
          <div className={cn('flex items-center gap-1 text-xs font-bold', trendColor)}>
            <TrendIcon className="w-3 h-3" />
            {Math.abs(trend)}%
          </div>
        )}
      </div>

      <div className="space-y-1">
        <p className="text-2xl font-black text-white tracking-tight">
          {typeof value === 'number' ? value.toLocaleString('es-ES') : value}
        </p>
        <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider">{title}</p>
        {subtitle && (
          <p className="text-[10px] text-zinc-600 font-medium">{subtitle}</p>
        )}
      </div>
    </motion.div>
  )
}