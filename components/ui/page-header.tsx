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
  iconColor = 'text-cyan-500',
  iconBg = 'bg-cyan-50 border-cyan-100',
  title,
  subtitle,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn('flex items-center justify-between', className)}>
      <div className="flex items-center gap-3">
        <div className={cn(
          'w-10 h-10 rounded-xl border flex items-center justify-center shadow-sm shrink-0',
          iconBg
        )}>
          <Icon className={cn('w-4 h-4', iconColor)} />
        </div>
        <div className="min-w-0">
          <h1 className="text-base font-bold text-zinc-850 truncate tracking-tight">{title}</h1>
          {subtitle && (
            <p className="text-xs text-zinc-500 font-semibold truncate">{subtitle}</p>
          )}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </div>
  )
}
