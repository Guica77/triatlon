'use client';

import * as React from 'react';
import { Share, PlusSquare, MoreVertical, Download } from 'lucide-react';

export function IosInstallPrompt() {
  const [osType, setOsType] = React.useState<'ios' | 'android' | null>(null);
  const [isStandalone, setIsStandalone] = React.useState(true); // Default true to prevent flash

  React.useEffect(() => {
    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    const isAndroidDevice = /android/.test(userAgent);
    
    // Detect Standalone (installed PWA)
    const isInStandaloneMode = ('standalone' in window.navigator) && (window.navigator as any).standalone;
    const isMatchMediaStandalone = window.matchMedia('(display-mode: standalone)').matches;

    if (isIosDevice) setOsType('ios');
    else if (isAndroidDevice) setOsType('android');
    
    setIsStandalone(isInStandaloneMode || isMatchMediaStandalone);
  }, []);

  if (!osType || isStandalone) {
    return null; // Don't show if it's not a mobile device or it's already installed
  }

  // AGGRESSIVE MODE: Block entire screen
  return (
    <div className="fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-zinc-950/90 backdrop-blur-xl p-6 text-center animate-in fade-in duration-500">
      
      {/* Decorative ambient light */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[80vw] bg-cyan-500/20 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-sm space-y-8 bg-zinc-900 border border-zinc-800 p-8 rounded-[2rem] shadow-[0_0_50px_rgba(34,211,238,0.1)]">
        
        <div className="inline-flex items-center justify-center p-4 rounded-3xl bg-zinc-950 border border-zinc-800 shadow-inner mb-2">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="url(#cyan-gradient)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <defs>
              <linearGradient id="cyan-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#22d3ee" />
                <stop offset="100%" stopColor="#818cf8" />
              </linearGradient>
            </defs>
            <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
            <line x1="12" y1="18" x2="12.01" y2="18" />
          </svg>
        </div>

        <div className="space-y-3">
          <h2 className="text-2xl font-black tracking-tight text-white">
            Instalación Requerida
          </h2>
          <p className="text-sm text-zinc-400 leading-relaxed font-medium">
            Para recibir notificaciones biométricas y chatear con tu entrenador en tiempo real, debes añadir Triatlón Pro a tu pantalla de inicio.
          </p>
        </div>

        <div className="space-y-4 pt-4 border-t border-zinc-800">
          {osType === 'ios' ? (
            <>
              <div className="flex items-center gap-4 text-left bg-zinc-950 p-4 rounded-2xl border border-zinc-800/50">
                <div className="bg-zinc-800 p-2 rounded-xl text-zinc-300">
                  <Share className="w-5 h-5" />
                </div>
                <p className="text-sm text-zinc-300 font-medium">
                  <strong className="text-white">Paso 1:</strong> Toca el botón de compartir abajo en Safari.
                </p>
              </div>

              <div className="flex items-center gap-4 text-left bg-zinc-950 p-4 rounded-2xl border border-zinc-800/50">
                <div className="bg-zinc-800 p-2 rounded-xl text-zinc-300">
                  <PlusSquare className="w-5 h-5" />
                </div>
                <p className="text-sm text-zinc-300 font-medium">
                  <strong className="text-white">Paso 2:</strong> Selecciona "Añadir a la pantalla de inicio".
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-4 text-left bg-zinc-950 p-4 rounded-2xl border border-zinc-800/50">
                <div className="bg-zinc-800 p-2 rounded-xl text-zinc-300">
                  <MoreVertical className="w-5 h-5" />
                </div>
                <p className="text-sm text-zinc-300 font-medium">
                  <strong className="text-white">Paso 1:</strong> Toca los 3 puntitos arriba a la derecha en Chrome.
                </p>
              </div>

              <div className="flex items-center gap-4 text-left bg-zinc-950 p-4 rounded-2xl border border-zinc-800/50">
                <div className="bg-zinc-800 p-2 rounded-xl text-zinc-300">
                  <Download className="w-5 h-5" />
                </div>
                <p className="text-sm text-zinc-300 font-medium">
                  <strong className="text-white">Paso 2:</strong> Selecciona "Instalar aplicación" o "Añadir a inicio".
                </p>
              </div>
            </>
          )}
        </div>

        <div className="pt-4 animate-pulse">
          <div className="h-1 w-12 bg-zinc-700 rounded-full mx-auto" />
        </div>
      </div>
      
      {/* Visual arrow pointing towards the install action area */}
      <div className={`absolute ${osType === 'ios' ? 'bottom-10 left-1/2 -translate-x-1/2' : 'top-24 right-6'} animate-bounce flex flex-col items-center gap-2 opacity-50`}>
        <span className="text-xs font-bold uppercase tracking-widest text-cyan-400">Instalar Aquí</span>
        <svg className={`w-6 h-6 text-cyan-400 ${osType === 'android' ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      </div>

    </div>
  );
}
