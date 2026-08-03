'use client';

import * as React from 'react';
import { Share, PlusSquare, MoreVertical, Download, X } from 'lucide-react';

export function IosInstallPrompt() {
  const [osType, setOsType] = React.useState<'ios' | 'android' | null>(null);
  const [isStandalone, setIsStandalone] = React.useState(true); // Default true to prevent flash
  const [isDismissed, setIsDismissed] = React.useState(false);

  React.useEffect(() => {
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    const isAndroidDevice = /android/.test(userAgent);
    const isInStandaloneMode = ('standalone' in window.navigator) && (window.navigator as any).standalone;
    const isMatchMediaStandalone = window.matchMedia('(display-mode: standalone)').matches;

    if (isIosDevice) setOsType('ios');
    else if (isAndroidDevice) setOsType('android');
    setIsStandalone(isInStandaloneMode || isMatchMediaStandalone);
  }, []);

  if (!osType || isStandalone || isDismissed) {
    return null;
  }

  return (
    <div className="fixed bottom-0 inset-x-0 z-[9000] p-3 sm:p-4">
      <div className="relative max-w-md mx-auto bg-surface-elevated/95 backdrop-blur-md border border-border-default rounded-2xl shadow-elevated p-4">
        {/* Dismiss */}
        <button
          onClick={() => setIsDismissed(true)}
          title="Cerrar"
          aria-label="Cerrar"
          className="absolute top-3 right-3 text-text-muted hover:text-text-primary p-1 rounded-lg hover:bg-surface-hover transition cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-swim/10 border border-swim/20 flex items-center justify-center shrink-0">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22d3ee" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
              <line x1="12" y1="18" x2="12.01" y2="18" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-text-primary">Añade Triatlon Pro a tu inicio</p>
            <p className="text-[11px] text-text-muted mt-0.5 leading-relaxed">
              Para recibir notificaciones y usar la app a pantalla completa, añádela a tu pantalla de inicio.
            </p>
          </div>
        </div>

        <div className="mt-3 space-y-2">
          <div className="flex items-center gap-2 text-[11px] text-text-muted">
            <span className="bg-surface-hover p-1.5 rounded-lg text-text-secondary shrink-0">
              {osType === 'ios' ? <Share className="w-3 h-3" /> : <MoreVertical className="w-3 h-3" />}
            </span>
            <span>{osType === 'ios' ? 'Toca Compartir' : 'Toca los 3 puntos'} → <strong className="text-text-primary">Añadir a pantalla de inicio</strong></span>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-text-muted">
            <span className="bg-surface-hover p-1.5 rounded-lg text-text-secondary shrink-0">
              {osType === 'ios' ? <PlusSquare className="w-3 h-3" /> : <Download className="w-3 h-3" />}
            </span>
            <span><strong className="text-text-primary">Instalar</strong> la aplicación</span>
          </div>
        </div>

        <button
          onClick={() => setIsDismissed(true)}
          className="mt-3 w-full py-2 rounded-xl bg-swim hover:bg-swim/90 text-text-inverse text-xs font-bold transition cursor-pointer"
        >
          Entendido, ya lo haré
        </button>
      </div>
    </div>
  );
}
