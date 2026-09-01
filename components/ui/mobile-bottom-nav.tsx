'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, BarChart2, MessageSquare, Settings, Trophy, Dumbbell, Heart, Award, MoreHorizontal } from 'lucide-react';
import { useNotifications } from '@/components/providers/notification-provider';

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  showBadge?: boolean;
};

const athletePrimaryItems: NavItem[] = [
  { href: '/dashboard', label: 'Entreno', icon: Dumbbell },
  { href: '/recuperacion', label: 'Recuperación', icon: Heart },
  { href: '/analytics', label: 'Análisis', icon: BarChart2 },
  { href: '/chat', label: 'Chat', icon: MessageSquare, showBadge: true },
];

const athleteMoreItems: NavItem[] = [
  { href: '/resumen', label: 'Resumen semanal', icon: Award },
  { href: '/exercises', label: 'Biblioteca de ejercicios', icon: Dumbbell },
  { href: '/settings', label: 'Ajustes', icon: Settings },
];

export function MobileBottomNav() {
  const pathname = usePathname();
  const [role, setRole] = React.useState<string | null>(null);
  const [isMoreOpen, setIsMoreOpen] = React.useState(false);
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

  React.useEffect(() => {
    setIsMoreOpen(false);
  }, [pathname]);

  React.useEffect(() => {
    if (!isMoreOpen) return;

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') setIsMoreOpen(false);
    }

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isMoreOpen]);

  // Ocultar en login, callback y chats
  if (
    pathname.includes('/login') ||
    pathname.includes('/auth') ||
    pathname.startsWith('/chat') ||
    pathname.startsWith('/coach/chat')
  ) {
    return null;
  }

  const navItems: NavItem[] = role === 'owner' ? [
    { href: '/admin', label: 'Business', icon: Trophy },
    { href: '/coach/dashboard', label: 'Roster', icon: Home },
    { href: '/settings', label: 'Ajustes', icon: Settings },
  ] : role === 'coach' ? [
    { href: '/coach/dashboard', label: 'Roster', icon: Home },
    { href: '/coach/chat', label: 'Mensajes', icon: MessageSquare, showBadge: true },
    { href: '/settings', label: 'Ajustes', icon: Settings },
  ] : athletePrimaryItems;

  const isAthlete = role !== 'owner' && role !== 'coach';
  const moreItems = isAthlete ? athleteMoreItems : [];
  const hasSecondaryActiveRoute = moreItems.some((item) => pathname === item.href || pathname.startsWith(`${item.href}/`));

  const isItemActive = (item: NavItem) => pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(`${item.href}/`));

  return (
    <>
      {isMoreOpen && (
        <button
          type="button"
          aria-label="Cerrar menú"
          className="sm:hidden fixed inset-0 z-40 bg-black/45"
          onClick={() => setIsMoreOpen(false)}
        />
      )}

      {moreItems.length > 0 && isMoreOpen && (
        <div
          id="mobile-more-menu"
          role="menu"
          aria-label="Más secciones"
          className="sm:hidden fixed bottom-[calc(4.75rem+env(safe-area-inset-bottom,0px))] left-4 right-4 z-50 mx-auto max-w-md overflow-hidden rounded-2xl border border-border-default bg-surface-elevated shadow-elevated"
        >
          <div className="border-b border-border-subtle px-4 py-3">
            <p className="font-display text-xs font-bold uppercase tracking-[0.18em] text-text-muted">Más secciones</p>
          </div>
          <div className="p-2">
            {moreItems.map((item) => {
              const Icon = item.icon;
              const isActive = isItemActive(item);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  role="menuitem"
                  className={`flex min-h-12 items-center gap-3 rounded-xl px-3 text-sm font-medium transition-colors ${isActive ? 'bg-surface-hover text-text-primary' : 'text-text-secondary hover:bg-surface-hover/60 hover:text-text-primary'}`}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <Icon className={`size-5 ${isActive ? 'text-accent' : 'text-text-muted'}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      <nav
        aria-label="Navegación principal"
        className="sm:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-border-default bg-surface-elevated/95 px-3 pb-[env(safe-area-inset-bottom,16px)] pt-2.5 backdrop-blur-lg"
      >
        <div className="mx-auto flex min-h-[4.25rem] w-full max-w-lg items-stretch justify-evenly gap-1">
          {navItems.map((item) => {
            const isActive = isItemActive(item);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className="group relative flex min-w-0 flex-1 flex-col items-center justify-center gap-1.5 rounded-xl px-1 py-2"
                aria-label={item.label}
                aria-current={isActive ? 'page' : undefined}
              >
                <div className="relative">
                  <Icon className={`size-[22px] transition-colors ${isActive ? 'text-accent' : 'text-text-muted group-hover:text-text-secondary'}`} />
                  {item.showBadge && unreadCount > 0 && (
                    <span className="absolute -right-2 -top-2 flex size-4 items-center justify-center rounded-full border-2 border-surface-elevated bg-run">
                      <span className="text-[9px] font-bold leading-none text-white">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    </span>
                  )}
                </div>
                <span className={`text-[11px] font-semibold tracking-wide ${isActive ? 'text-accent' : 'text-text-muted'}`}>
                  {item.label}
                </span>
              </Link>
            );
          })}

          {moreItems.length > 0 && (
            <button
              type="button"
              className={`group relative flex min-w-0 flex-1 flex-col items-center justify-center gap-1.5 rounded-xl px-1 py-2 ${isMoreOpen || hasSecondaryActiveRoute ? 'text-accent' : 'text-text-muted'}`}
              aria-label="Más secciones"
              aria-haspopup="menu"
              aria-expanded={isMoreOpen}
              aria-controls="mobile-more-menu"
              onClick={() => setIsMoreOpen((open) => !open)}
            >
              <MoreHorizontal className="size-[22px]" />
              <span className="text-[11px] font-semibold tracking-wide">Más</span>
            </button>
          )}
        </div>
      </nav>
    </>
  );
}
