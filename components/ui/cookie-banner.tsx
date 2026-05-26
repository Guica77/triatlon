'use client';

import * as React from 'react';
import Link from 'next/link';
import { ShieldCheck, X } from 'lucide-react';

export function CookieBanner() {
  const [isOpen, setIsOpen] = React.useState(false);

  React.useEffect(() => {
    const consent = localStorage.getItem('cookie-consent');
    if (!consent) {
      setIsOpen(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('cookie-consent', 'accepted');
    setIsOpen(false);
  };

  const handleDecline = () => {
    localStorage.setItem('cookie-consent', 'declined');
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-20 sm:bottom-6 left-6 right-6 md:left-auto md:right-6 md:max-w-md bg-zinc-950/90 border border-zinc-800/80 p-5 rounded-2xl shadow-2xl backdrop-blur-md z-[100] animate-fade-in flex flex-col gap-4 text-left">
      <div className="flex justify-between items-start gap-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shrink-0">
            <ShieldCheck className="w-4.5 h-4.5" />
          </div>
          <h4 className="text-sm font-bold text-white leading-tight">Privacidad y Cookies</h4>
        </div>
        <button 
          onClick={handleDecline} 
          className="text-zinc-500 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <p className="text-xs text-zinc-400 leading-relaxed">
        Utilizamos cookies propias y de terceros para optimizar tus entrenamientos, analizar el rendimiento y recopilar telemetría de tus dispositivos. Puedes aceptar o configurar tus preferencias de privacidad. Consulta nuestra{' '}
        <Link href="/privacidad" className="text-cyan-400 hover:underline">
          Política de Privacidad
        </Link>{' '}
        para más información.
      </p>

      <div className="flex gap-2">
        <button 
          onClick={handleAccept}
          className="flex-1 py-2 text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-black rounded-xl transition-all shadow-md shadow-cyan-500/10 cursor-pointer text-center"
        >
          Aceptar Todas
        </button>
        <button 
          onClick={handleDecline}
          className="px-4 py-2 text-xs font-semibold bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-300 rounded-xl transition-all cursor-pointer text-center"
        >
          Rechazar
        </button>
      </div>
    </div>
  );
}
