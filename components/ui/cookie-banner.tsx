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
    <div className="fixed bottom-20 sm:bottom-6 left-6 right-6 md:left-auto md:right-6 md:max-w-md bg-surface-card/95 border border-border-default p-5 rounded-2xl shadow-elevated backdrop-blur-md z-[100] animate-fade-in flex flex-col gap-4 text-left">
      <div className="flex justify-between items-start gap-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-swim/10 border border-swim/20 flex items-center justify-center text-swim shrink-0 ">
            <ShieldCheck className="w-4.5 h-4.5" />
          </div>
          <h4 className="text-sm font-bold text-text-primary leading-tight">Privacidad y Cookies</h4>
        </div>
        <button 
          onClick={handleDecline} 
          title="Cerrar aviso de cookies"
          aria-label="Cerrar aviso de cookies"
          className="text-text-muted hover:text-text-primary transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
 
      <p className="text-xs text-text-secondary leading-relaxed font-semibold">
        Utilizamos cookies para optimizar tus entrenamientos, analizar tu rendimiento y sincronizar la telemetría de tus dispositivos. Puedes aceptar o configurar tus opciones. Consulta nuestra{' '}
        <Link href="/privacidad" className="text-swim hover:text-swim underline font-bold">
          Política de Privacidad
        </Link>{' '}
        para más información.
      </p>
 
      <div className="flex gap-2">
        <button 
          onClick={handleAccept}
          className="flex-1 py-2.5 text-xs font-black bg-swim hover:bg-swim/90 text-text-inverse rounded-xl transition-all  cursor-pointer text-center"
        >
          Aceptar Todas
        </button>
        <button 
          onClick={handleDecline}
          className="px-4 py-2.5 text-xs font-bold bg-surface-hover border border-border-default hover:bg-surface-card text-text-secondary hover:text-text-primary rounded-xl transition-all cursor-pointer text-center "
        >
          Rechazar
        </button>
      </div>
    </div>
  );
}
