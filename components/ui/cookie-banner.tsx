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
    <div className="fixed bottom-20 left-3 right-3 z-[100] flex max-h-[calc(100dvh-1.5rem)] flex-col gap-4 overflow-y-auto rounded-2xl border border-border-default bg-surface-card/95 p-4 text-left shadow-elevated backdrop-blur-md animate-fade-in sm:bottom-6 sm:left-6 sm:right-6 sm:p-5 md:left-auto md:right-6 md:max-w-md">
      <div className="flex min-w-0 items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-swim/10 border border-swim/20 flex items-center justify-center text-swim shrink-0 ">
            <ShieldCheck className="w-4.5 h-4.5" />
          </div>
          <h4 className="min-w-0 text-sm font-bold leading-tight text-text-primary">Privacidad y Cookies</h4>
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
 
      <div className="flex min-w-0 gap-2">
        <button
          type="button"
          onClick={handleAccept}
          className="min-h-10 min-w-0 flex-1 rounded-xl bg-swim py-2.5 text-center text-xs font-black text-text-inverse transition-[background-color,color,opacity] duration-150 hover:bg-swim/90 cursor-pointer"
        >
          Aceptar Todas
        </button>
        <button
          type="button"
          onClick={handleDecline}
          className="min-h-10 shrink-0 rounded-xl border border-border-default bg-surface-hover px-4 py-2.5 text-center text-xs font-bold text-text-secondary transition-[background-color,color,opacity] duration-150 hover:bg-surface-card hover:text-text-primary cursor-pointer"
        >
          Rechazar
        </button>
      </div>
    </div>
  );
}
