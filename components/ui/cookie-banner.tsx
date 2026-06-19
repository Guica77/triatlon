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
    <div className="fixed bottom-20 sm:bottom-6 left-6 right-6 md:left-auto md:right-6 md:max-w-md bg-white/95 border border-zinc-200 p-5 rounded-2xl shadow-xl backdrop-blur-md z-[100] animate-fade-in flex flex-col gap-4 text-left">
      <div className="flex justify-between items-start gap-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-cyan-50 border border-cyan-100 flex items-center justify-center text-cyan-600 shrink-0 shadow-sm">
            <ShieldCheck className="w-4.5 h-4.5" />
          </div>
          <h4 className="text-sm font-bold text-zinc-900 leading-tight">Privacidad y Cookies</h4>
        </div>
        <button 
          onClick={handleDecline} 
          title="Cerrar aviso de cookies"
          aria-label="Cerrar aviso de cookies"
          className="text-zinc-400 hover:text-zinc-700 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
 
      <p className="text-xs text-zinc-550 leading-relaxed font-semibold">
        Utilizamos cookies para optimizar tus entrenamientos, analizar tu rendimiento y sincronizar la telemetría de tus dispositivos. Puedes aceptar o configurar tus opciones. Consulta nuestra{' '}
        <Link href="/privacidad" className="text-cyan-600 hover:text-cyan-700 underline font-bold">
          Política de Privacidad
        </Link>{' '}
        para más información.
      </p>
 
      <div className="flex gap-2">
        <button 
          onClick={handleAccept}
          className="flex-1 py-2.5 text-xs font-black bg-cyan-400 hover:bg-cyan-500 text-white rounded-xl transition-all shadow-md cursor-pointer text-center"
        >
          Aceptar Todas
        </button>
        <button 
          onClick={handleDecline}
          className="px-4 py-2.5 text-xs font-bold bg-zinc-50 border border-zinc-200 hover:bg-zinc-100 text-zinc-650 hover:text-zinc-800 rounded-xl transition-all cursor-pointer text-center shadow-sm"
        >
          Rechazar
        </button>
      </div>
    </div>
  );
}
