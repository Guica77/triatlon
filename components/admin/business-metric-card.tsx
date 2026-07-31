'use client'

import * as React from 'react'
import { ArrowUp, ArrowDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MetricCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: React.ComponentType<{ className?: string }>
  trend?: 'up' | 'down' | 'neutral'
  trendValue?: string
  accent?: 'coral' | 'bike' | 'swim' | 'run' | 'warning'
  format?: 'currency' | 'percent' | 'number'
}

const ACCENTS: Record<string, { iconBg: string; iconText: string; trendUp: string; trendDown: string }> = {
  coral: { iconBg: 'bg-coral-500/15', iconText: 'text-coral-500', trendUp: 'text-bike', trendDown: 'text-run' },
  bike: { iconBg: 'bg-bike/15', iconText: 'text-bike', trendUp: 'text-bike', trendDown: 'text-run' },
  swim: { iconBg: 'bg-swim/15', iconText: 'text-swim', trendUp: 'text-bike', trendDown: 'text-run' },
  run: { iconBg: 'bg-run/15', iconText: 'text-run', trendUp: 'text-bike', trendDown: 'text-run' },
  warning: { iconBg: 'bg-warning/15', iconText: 'text-warning', trendUp: 'text-bike', trendDown: 'text-run' },
}

export function MetricCard({ title, value, subtitle, icon: Icon, trend, trendValue, accent = 'coral' }: MetricCardProps) {
  const a = ACCENTS[accent] || ACCENTS.coral

  return (
    <div className="bg-surface-card rounded-xl p-4 sm:p-5 space-y-2.5 shadow-card">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[9px] font-bold uppercase tracking-wider text-text-muted truncate">{title}</p>
          <p className="text-2xl font-black text-text-primary tracking-tight mt-0.5 break-words">{value}</p>
        </div>
        <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center shrink-0', a.iconBg)}>
          <Icon className={cn('w-4 h-4', a.iconText)} />
        </div>
      </div>
      {subtitle && <p className="text-[9px] text-text-muted font-medium truncate">{subtitle}</p>}
      {trend && trendValue && (
        <div className={cn(
          'flex items-center gap-1 text-[10px] font-bold',
          trend === 'up' ? a.trendUp : trend === 'down' ? a.trendDown : 'text-text-muted'
        )}>
          {trend === 'up' ? <ArrowUp className="w-3 h-3" /> : trend === 'down' ? <ArrowDown className="w-3 h-3" /> : null}
          <span className="truncate">{trendValue}</span>
        </div>
      )}
    </div>
  )
}
