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
  iconBg,
  title,
  subtitle,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn('flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between', className)}>
      <div className="flex min-w-0 items-center gap-3">
        <div className={cn('flex size-10 shrink-0 items-center justify-center rounded-lg border border-border-subtle bg-surface-hover', iconBg)}>
          <Icon className={cn('size-4', iconColor)} />
        </div>
        <div className="min-w-0">
          <h1 className="truncate font-display text-xl font-bold leading-tight tracking-tight text-text-primary sm:text-2xl">{title}</h1>
          {subtitle && (
            <p className="truncate text-xs font-medium text-text-muted sm:text-sm">{subtitle}</p>
          )}
        </div>
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2 sm:justify-end">{actions}</div>}
    </div>
  )
}
