'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, BarChart2, MessageSquare, Settings, Trophy, BookOpen, Dumbbell, Heart, Award } from 'lucide-react';
import { useNotifications } from '@/components/providers/notification-provider';

export function MobileBottomNav() {
  const pathname = usePathname();
  const [role, setRole] = React.useState<string | null>(null);
  const { unreadCount } = useNotifications();

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
    { href: '/recuperacion', label: 'Recup.', icon: Heart },
    { href: '/exercises', label: 'Ejercicios', icon: BookOpen },
    { href: '/analytics', label: 'Análisis', icon: BarChart2 },
    { href: '/resumen', label: 'Resumen', icon: Award },
    { href: '/chat', label: 'Chat', icon: MessageSquare, showBadge: true },
    { href: '/settings', label: 'Ajustes', icon: Settings },
  ];

  return (
    <div className="sm:hidden fixed bottom-0 left-0 right-0 z-50 px-4 pb-[env(safe-area-inset-bottom, 16px)] pt-2 bg-surface-elevated/90 backdrop-blur-lg border-t border-border-default">
      <div className="flex items-center justify-evenly max-w-md mx-auto w-full">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center gap-1 py-1.5 px-3 min-w-0 relative group"
              aria-label={item.label}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 transition-colors ${isActive ? 'text-accent' : 'text-text-muted group-hover:text-text-secondary'}`} />
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
    </div>
  );
}
