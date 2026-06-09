'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Zap } from 'lucide-react';
import { AnimatedButton } from '@/components/ui/animated-button';

export function LandingNavbar() {
  const router = useRouter();

  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-zinc-950/60 border-b border-zinc-900/80 px-4 sm:px-8 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-emerald-500 flex items-center justify-center shadow-[0_0_15px_rgba(34,211,238,0.3)]">
            <Zap className="w-4 h-4 text-black stroke-[3]" />
          </div>
          <span className="text-lg font-black tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-emerald-400 to-cyan-500 uppercase">
            Triatlon Pro
          </span>
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.push('/login')} 
            className="text-sm font-semibold text-zinc-400 hover:text-white transition-colors"
          >
            Iniciar Sesión
          </button>
          <AnimatedButton 
            variant="primary"
            onClick={() => router.push('/login?mode=signup')}
            className="px-4 py-2 text-xs"
          >
            Comenzar Gratis
          </AnimatedButton>
        </div>
      </div>
    </header>
  );
}
