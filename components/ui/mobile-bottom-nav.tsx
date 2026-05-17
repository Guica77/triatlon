'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, BarChart2, Users, Settings } from 'lucide-react';
import { motion } from 'framer-motion';

export function MobileBottomNav() {
  const pathname = usePathname();

  // Ocultar en login y callback
  if (pathname.includes('/login') || pathname.includes('/auth')) {
    return null;
  }

  const navItems = [
    { href: '/dashboard', label: 'Inicio', icon: Home },
    { href: '/analytics', label: 'Analíticas', icon: BarChart2 },
    { href: '/coach-portal', label: 'Entrenador', icon: Users },
    { href: '/onboarding', label: 'Ajustes', icon: Settings },
  ];

  return (
    <div className="sm:hidden fixed bottom-0 left-0 right-0 z-50 px-4 pb-6 pt-2 bg-zinc-950/80 backdrop-blur-xl border-t border-zinc-800/80 shadow-lg shadow-black/50">
      <div className="flex items-center justify-around max-w-md mx-auto relative">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link 
              key={item.href} 
              href={item.href}
              className="flex flex-col items-center gap-1 py-1 px-3 relative group"
              aria-label={item.label}
            >
              {isActive && (
                <motion.div 
                  layoutId="mobile-nav-bubble" 
                  className="absolute inset-0 bg-white/10 rounded-2xl -z-10"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              <Icon className={`w-5 h-5 transition-colors duration-200 ${isActive ? 'text-white' : 'text-zinc-500 group-hover:text-zinc-400'}`} />
              <span className={`text-[10px] font-medium tracking-wide transition-colors duration-200 ${isActive ? 'text-white font-semibold' : 'text-zinc-500 group-hover:text-zinc-400'}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
