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
  iconColor = 'text-sport-swim',
  iconBg = 'bg-sport-swim/10 border-sport-swim/20',
  title,
  subtitle,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn('flex items-center justify-between', className)}>
      <div className="flex items-center gap-3">
        <div className={cn(
          'w-10 h-10 rounded-xl border flex items-center justify-center shrink-0',
          iconBg
        )}>
          <Icon className={cn('w-4 h-4', iconColor)} />
        </div>
        <div className="min-w-0">
          <h1 className="text-base font-bold text-text-primary truncate tracking-tight">{title}</h1>
          {subtitle && (
            <p className="text-xs text-text-muted font-semibold truncate">{subtitle}</p>
          )}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </div>
  )
}
