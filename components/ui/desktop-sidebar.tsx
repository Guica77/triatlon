'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  Home, BarChart2, MessageSquare, Settings, Users, BookOpen,
  PanelLeftClose, PanelLeft, Trophy
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
  { href: '/dashboard', label: 'Inicio', icon: Home },
  { href: '/exercises', label: 'Ejercicios', icon: BookOpen },
  { href: '/analytics', label: 'Analíticas', icon: BarChart2 },
  { href: '/chat', label: 'Chat', icon: MessageSquare, showBadge: true },
  { href: '/settings', label: 'Ajustes', icon: Settings },
]

const coachItems: SidebarItem[] = [
  { href: '/coach/dashboard', label: 'Roster', icon: Users },
  { href: '/coach/chat', label: 'Mensajes', icon: MessageSquare, showBadge: true },
  { href: '/settings', label: 'Ajustes', icon: Settings },
]

const ownerItems: SidebarItem[] = [
  { href: '/owner', label: 'Panel Owner', icon: Trophy },
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
        'hidden sm:flex flex-col border-r border-zinc-200 bg-white shrink-0 transition-all duration-300 ease-in-out',
        isCollapsed ? 'w-[68px]' : 'w-56'
      )}
    >
      {/* Logo */}
      <div className={cn(
        'flex items-center gap-3 border-b border-zinc-100 shrink-0 transition-all duration-300',
        isCollapsed ? 'px-3.5 py-4 justify-center' : 'px-5 py-4'
      )}>
        <div className="w-8 h-8 rounded-lg bg-cyan-50 border border-cyan-100 flex items-center justify-center shrink-0">
          <Trophy className="w-4 h-4 text-cyan-500" />
        </div>
        {!isCollapsed && (
          <span className="text-sm font-bold text-zinc-800 tracking-tight whitespace-nowrap">Triatlon Pro</span>
        )}
      </div>

      {/* Nav Items */}
      <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
        {items.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/dashboard' && item.href !== '/coach/dashboard' && pathname.startsWith(item.href))
          const Icon = item.icon

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'relative flex items-center gap-3 rounded-xl text-sm font-medium transition-colors duration-150',
                isCollapsed ? 'px-3 py-2.5 justify-center' : 'px-3.5 py-2.5',
                isActive
                  ? 'bg-cyan-50 text-cyan-600 border border-cyan-100'
                  : 'text-zinc-500 hover:text-zinc-800 hover:bg-zinc-50 border border-transparent'
              )}
              title={isCollapsed ? item.label : undefined}
            >
              {isActive && (
                <motion.div
                  layoutId="sidebar-active"
                  className="absolute inset-0 bg-cyan-50 rounded-xl border border-cyan-100 -z-10"
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
                />
              )}

              <div className="relative shrink-0">
                <Icon className={cn('w-4.5 h-4.5', isActive ? 'text-cyan-500' : '')} />
                {item.showBadge && unreadCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center border-2 border-white">
                    <span className="text-[9px] font-bold text-white leading-none">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  </span>
                )}
              </div>

              {!isCollapsed && <span className="truncate">{item.label}</span>}
            </Link>
          )
        })}
      </nav>

      {/* Collapse Toggle */}
      <div className="border-t border-zinc-100 p-2 shrink-0">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={cn(
            'flex items-center gap-3 rounded-xl text-sm font-medium transition-colors duration-150 w-full text-zinc-400 hover:text-zinc-700 hover:bg-zinc-50 border border-transparent',
            isCollapsed ? 'px-3 py-2.5 justify-center' : 'px-3.5 py-2.5'
          )}
          title={isCollapsed ? 'Expandir sidebar' : 'Colapsar sidebar'}
        >
          {isCollapsed ? (
            <PanelLeft className="w-4 h-4" />
          ) : (
            <>
              <PanelLeftClose className="w-4 h-4" />
              <span>Colapsar</span>
            </>
          )}
        </button>
      </div>
    </div>
  )
}
