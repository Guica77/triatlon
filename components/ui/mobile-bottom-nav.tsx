'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, BarChart2, MessageSquare, Settings, Trophy, Dumbbell, UserRound } from 'lucide-react';
import { athleteArea, matchesRoute } from '@/lib/athlete-navigation';
import { useNotifications } from '@/components/providers/notification-provider';

export function MobileBottomNav() {
  const pathname = usePathname();
  const [role, setRole] = React.useState<string | null>(null);
  const [isNativeApp, setIsNativeApp] = React.useState(false);
  const { unreadCount } = useNotifications();

  React.useEffect(() => {
    setIsNativeApp(navigator.userAgent.includes('TriWaveXNative/'));
  }, []);

  React.useEffect(() => {
    async function fetchRole() {
      try {
        const { createClient } = await import('@/lib/supabase/client');
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();
          if (profile && profile.role) {
            setRole(profile.role);
          }
        }
      } catch (err) {
        console.error('Error fetching role in bottom nav:', err);
      }
    }
    fetchRole();
  }, []);

  // Ocultar en login, callback y chats
  if (
    pathname.includes('/login') ||
    pathname.includes('/auth') ||
    pathname.startsWith('/privacidad') ||
    pathname.startsWith('/chat') ||
    pathname.startsWith('/coach/chat')
  ) {
    return null;
  }

  const navItems = role === 'owner' ? [
    { href: '/admin', label: 'Business', icon: Trophy },
    { href: '/coach/dashboard', label: 'Roster', icon: Home },
    { href: '/settings', label: 'Ajustes', icon: Settings },
  ] : role === 'coach' ? [
    { href: '/coach/dashboard', label: 'Roster', icon: Home },
    { href: '/coach/chat', label: 'Mensajes', icon: MessageSquare, showBadge: true },
    { href: '/settings', label: 'Ajustes', icon: Settings },
  ] : [
    { href: '/dashboard', label: 'Entreno', icon: Dumbbell },
    { href: '/resumen', label: 'Progreso', icon: BarChart2 },
    { href: '/chat', label: 'Chat', icon: MessageSquare, showBadge: true },
    { href: '/settings', label: 'Perfil', icon: UserRound },
  ];

  return (
    <nav
      aria-label="Navegación principal"
      className={isNativeApp
        ? 'sm:hidden fixed bottom-0 left-0 right-0 z-50 px-3 pb-[calc(env(safe-area-inset-bottom,0px)+0.5rem)] pt-2'
        : 'sm:hidden fixed bottom-0 left-0 right-0 z-50 px-4 pb-[env(safe-area-inset-bottom,0px)] pt-2 bg-surface-elevated/90 backdrop-blur-lg border-t border-border-default'}
    >
      <div className={isNativeApp
        ? 'mx-auto flex w-full max-w-md items-center justify-evenly rounded-[1.4rem] border border-white/10 bg-[#18242d]/95 px-1.5 py-1.5 shadow-[0_12px_35px_rgba(0,0,0,0.42)] backdrop-blur-2xl'
        : 'flex items-center justify-evenly max-w-md mx-auto w-full'}>
        {navItems.map((item) => {
          const isActive = role === 'coach' || role === 'owner'
            ? matchesRoute(pathname, item.href)
            : athleteArea(pathname) === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex min-w-0 flex-col items-center justify-center gap-1 transition-all duration-200 ${isNativeApp ? `min-h-14 flex-1 rounded-2xl px-2 py-1.5 ${isActive ? 'bg-white/12 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]' : 'active:bg-white/8'}` : 'min-h-11 px-3 py-1.5 group'}`}
              aria-label={item.label}
              aria-current={isActive ? 'page' : undefined}
            >
              <div className="relative">
                <Icon className={`h-5 w-5 transition-colors ${isActive ? 'text-accent' : 'text-text-muted'} ${!isNativeApp ? 'group-hover:text-text-secondary' : ''}`} strokeWidth={isNativeApp && isActive ? 2.5 : 2} />
                {item.showBadge && unreadCount > 0 && (
                  <span className="absolute -top-2 -right-2 w-4 h-4 bg-run rounded-full flex items-center justify-center border-2 border-surface-elevated">
                    <span className="text-[9px] font-bold text-white leading-none">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  </span>
                )}
              </div>

              <span className={`text-[10px] font-semibold tracking-wide ${isActive ? 'text-accent' : 'text-text-muted'}`}>
                {item.label}
              </span>
            </Link>
          );
        })}

      </div>
    </nav>
  );
}
