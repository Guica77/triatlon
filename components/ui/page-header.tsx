import * as React from 'react'
import { type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PageHeaderProps {
  icon: LucideIcon
  iconColor?: string
  iconBg?: string
  title: string
  subtitle?: string
  actions?: React.ReactNode
  className?: string
}

export function PageHeader({
  icon: Icon,
  iconColor = 'text-text-secondary',
  title,
  subtitle,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn('flex items-center justify-between', className)}>
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-9 h-9 rounded-lg bg-surface-hover border border-border-subtle flex items-center justify-center shrink-0">
          <Icon className={cn('w-4 h-4', iconColor)} />
        </div>
        <div className="min-w-0">
          <h1 className="font-display text-xl font-bold tracking-tight text-text-primary truncate leading-tight">{title}</h1>
          {subtitle && (
            <p className="text-xs text-text-muted font-medium truncate">{subtitle}</p>
          )}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </div>
  )
}
