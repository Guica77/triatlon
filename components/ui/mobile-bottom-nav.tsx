'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, BarChart2, MessageSquare, Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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

  // Ocultar en login y callback
  if (pathname.includes('/login') || pathname.includes('/auth')) {
    return null;
  }

  const navItems = role === 'coach' ? [
    { href: '/coach/dashboard', label: 'Roster', icon: Home },
    { href: '/coach/chat', label: 'Mensajes', icon: MessageSquare, showBadge: true },
    { href: '/settings', label: 'Ajustes', icon: Settings },
  ] : [
    { href: '/dashboard', label: 'Inicio', icon: Home },
    { href: '/analytics', label: 'Analíticas', icon: BarChart2 },
    { href: '/chat', label: 'Chat', icon: MessageSquare, showBadge: true },
    { href: '/settings', label: 'Ajustes', icon: Settings },
  ];

  return (
    <div className="sm:hidden fixed bottom-0 left-0 right-0 z-50 px-4 pb-6 pt-2 bg-white/90 backdrop-blur-md border-t border-zinc-200 shadow-[0_-4px_12px_-4px_rgba(0,0,0,0.08)]">
      <div className="flex items-center justify-around max-w-md mx-auto relative">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link 
              key={item.href} 
              href={item.href}
              className="flex flex-col items-center gap-1 py-1.5 px-3 relative group"
              aria-label={item.label}
            >
              {isActive && (
                <motion.div 
                  layoutId="mobile-nav-bubble" 
                  className="absolute inset-0 bg-cyan-50 border border-cyan-100/50 rounded-xl -z-10"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              
              <div className="relative">
                <Icon className={`w-5 h-5 transition-colors duration-200 ${isActive ? 'text-cyan-500' : 'text-zinc-400 group-hover:text-zinc-800'}`} />
                <AnimatePresence>
                  {item.showBadge && unreadCount > 0 && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      className="absolute -top-2 -right-2 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center border-2 border-white shadow-sm"
                    >
                      <span className="text-[9px] font-bold text-white leading-none">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <span className={`text-[10px] font-semibold tracking-wide transition-colors duration-200 ${isActive ? 'text-cyan-500' : 'text-zinc-400 group-hover:text-zinc-800'}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
