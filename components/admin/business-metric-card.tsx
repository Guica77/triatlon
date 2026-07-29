'use client'

import * as React from 'react'
import { Users, TrendingUp, UserMinus, DollarSign, Activity, Target, Zap, ArrowUp, ArrowDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MetricCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: React.ComponentType<{ className?: string }>
  trend?: 'up' | 'down' | 'neutral'
  trendValue?: string
  accentColor?: string
  format?: 'currency' | 'percent' | 'number'
}

export function MetricCard({
  title, value, subtitle, icon: Icon, trend, trendValue, accentColor = 'text-sport-swim'
}: MetricCardProps) {
  return (
    <div className="bg-bg-card border border-border-default rounded-xl p-5 space-y-3">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted">{title}</p>
          <p className="text-2xl font-bold text-text-primary tracking-tight">{value}</p>
        </div>
        <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center shrink-0', accentColor.replace('text-', 'bg-').replace('swim', 'swim/15').replace('bike', 'bike/15').replace('run', 'run/15'))}>
          <Icon className={cn('w-4 h-4', accentColor)} />
        </div>
      </div>
      {subtitle && (
        <p className="text-[10px] text-text-muted font-medium">{subtitle}</p>
      )}
      {trend && trendValue && (
        <div className={cn(
          'flex items-center gap-1 text-[10px] font-bold',
          trend === 'up' ? 'text-sport-bike' : trend === 'down' ? 'text-sport-run' : 'text-text-muted'
        )}>
          {trend === 'up' ? <ArrowUp className="w-3 h-3" /> : trend === 'down' ? <ArrowDown className="w-3 h-3" /> : null}
          {trendValue}
        </div>
      )}
    </div>
  )
}
