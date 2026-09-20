'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { athleteArea, matchesRoute, progressSections, trainingSections } from '@/lib/athlete-navigation'

export function AthleteSectionNav() {
  const pathname = usePathname()
  const area = athleteArea(pathname)
  const items = area === '/dashboard' ? trainingSections : area === '/resumen' ? progressSections : null
  if (!items) return null

  return (
    <nav aria-label={area === '/dashboard' ? 'Apartados de entrenamiento' : 'Apartados de progreso'} className="relative z-30 border-b border-border-subtle/80 bg-surface-elevated/84 shadow-[0_4px_18px_rgba(0,0,0,0.08)] backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4 py-2 sm:px-6">
        {items.map(item => (
          <Link key={item.href} href={item.href} aria-current={matchesRoute(pathname, item.href) ? 'page' : undefined}
            className="flex min-h-11 flex-1 items-center justify-center rounded-lg px-2 text-xs font-semibold text-text-muted transition-colors hover:bg-surface-hover hover:text-text-primary aria-[current=page]:bg-surface-hover aria-[current=page]:text-accent sm:flex-none sm:px-5">
            {item.label}
          </Link>
        ))}
      </div>
    </nav>
  )
}
