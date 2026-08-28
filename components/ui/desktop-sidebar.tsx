'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Home, BarChart2, MessageSquare, Settings, Users, BookOpen,
  PanelLeftClose, PanelLeft, Trophy, Dumbbell, Heart, Award
} from 'lucide-react'
import { useNotifications } from '@/components/providers/notification-provider'
import { cn } from '@/lib/utils'

interface SidebarItem {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  showBadge?: boolean
}

const athleteItems: SidebarItem[] = [
  { href: '/dashboard', label: 'Entrenamiento', icon: Dumbbell },
  { href: '/recuperacion', label: 'Recuperación', icon: Heart },
  { href: '/exercises', label: 'Ejercicios', icon: BookOpen },
  { href: '/analytics', label: 'Analíticas', icon: BarChart2 },
  { href: '/resumen', label: 'Resumen', icon: Award },
  { href: '/chat', label: 'Chat', icon: MessageSquare, showBadge: true },
  { href: '/settings', label: 'Ajustes', icon: Settings },
]

const coachItems: SidebarItem[] = [
  { href: '/coach/dashboard', label: 'Roster', icon: Users },
  { href: '/coach/chat', label: 'Mensajes', icon: MessageSquare, showBadge: true },
  { href: '/settings', label: 'Ajustes', icon: Settings },
]

const ownerItems: SidebarItem[] = [
  { href: '/admin', label: 'Business', icon: Trophy },
  { href: '/coach/dashboard', label: 'Roster', icon: Users },
  { href: '/settings', label: 'Ajustes', icon: Settings },
]

export function DesktopSidebar() {
  const pathname = usePathname()
  const [role, setRole] = React.useState<string | null>(null)
  const [isCollapsed, setIsCollapsed] = React.useState(false)
  const { unreadCount } = useNotifications()

  React.useEffect(() => {
    async function fetchRole() {
      try {
        const { createClient } = await import('@/lib/supabase/client')
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()
          if (profile && profile.role) {
            setRole(profile.role)
          }
        }
      } catch (err) {
        console.error('Error fetching role in sidebar:', err)
      }
    }
    fetchRole()
  }, [])

  // Hide on auth/callback/login pages
  if (pathname.includes('/login') || pathname.includes('/auth') || pathname.includes('/register')) {
    return null
  }

  const items = role === 'owner' ? ownerItems : role === 'coach' ? coachItems : athleteItems

  return (
    <div
      className={cn(
        'hidden sm:flex flex-col bg-surface-elevated shrink-0 transition-[width,background-color,border-color] duration-200 ease-out z-40 border-r border-border-subtle',
        isCollapsed ? 'w-[68px]' : 'w-56'
      )}
    >
      {/* Logo — the three lanes as a start-line mark */}
      <div className={cn(
        'flex items-center gap-3 shrink-0 transition-[padding,justify-content] duration-200 ease-out',
        isCollapsed ? 'px-3.5 py-5 justify-center' : 'px-5 py-5'
      )}>
        <div className="w-9 h-9 rounded-lg bg-surface-hover border border-border-subtle flex flex-col items-center justify-center gap-[3px] shrink-0">
          <span className="w-4 h-[3px] rounded-full bg-swim" />
          <span className="w-4 h-[3px] rounded-full bg-bike" />
          <span className="w-4 h-[3px] rounded-full bg-run" />
        </div>
        {!isCollapsed && (
          <span className="font-display text-lg font-bold tracking-wide text-text-primary leading-none whitespace-nowrap">
            TRIATLON&nbsp;<span className="text-accent">PRO</span>
          </span>
        )}
      </div>

      {/* Nav Items */}
      <nav className="flex-1 py-2 px-2.5 space-y-0.5 overflow-y-auto">
        {items.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/dashboard' && item.href !== '/coach/dashboard' && pathname.startsWith(item.href))
          const Icon = item.icon

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'relative flex min-h-11 items-center gap-3 rounded-lg text-sm font-medium transition-[background-color,color,opacity] duration-150 ease-out',
                isCollapsed ? 'px-3 py-2.5 justify-center' : 'px-3.5 py-2.5',
                isActive
                  ? 'bg-surface-hover/70 text-text-primary'
                  : 'text-text-muted hover:text-text-secondary hover:bg-surface-hover/50'
              )}
              title={isCollapsed ? item.label : undefined}
              aria-current={isActive ? 'page' : undefined}
            >
              {isActive && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-full bg-accent" aria-hidden="true" />
              )}
              <div className="relative shrink-0">
                <Icon className={cn('w-4.5 h-4.5', isActive ? 'text-accent' : '')} />
                {item.showBadge && unreadCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-run rounded-full flex items-center justify-center border-2 border-surface-elevated">
                    <span className="text-[9px] font-bold text-white leading-none">{unreadCount > 9 ? '9+' : unreadCount}</span>
                  </span>
                )}
              </div>
              {!isCollapsed && <span className="truncate">{item.label}</span>}
            </Link>
          )
        })}
      </nav>

      {/* Collapse Toggle */}
      <div className="p-2.5 shrink-0 border-t border-border-subtle">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={cn(
            'flex min-h-11 items-center gap-3 rounded-lg text-sm font-medium transition-[background-color,color,opacity] duration-150 ease-out w-full text-text-muted hover:text-text-secondary hover:bg-surface-hover/50',
            isCollapsed ? 'px-3 py-2.5 justify-center' : 'px-3.5 py-2.5'
          )}
          title={isCollapsed ? 'Expandir sidebar' : 'Colapsar sidebar'}
          aria-label={isCollapsed ? 'Expandir sidebar' : 'Colapsar sidebar'}
          aria-expanded={!isCollapsed}
        >
          {isCollapsed ? <PanelLeft className="w-4 h-4" /> : <><PanelLeftClose className="w-4 h-4" /><span>Colapsar</span></>}
        </button>
      </div>
    </div>
  )
}
