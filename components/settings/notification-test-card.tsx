'use client';

import * as React from 'react';
import { BellRing, CheckCircle } from 'lucide-react';
import { AnimatedButton } from '@/components/ui/animated-button';

export function NotificationTestCard() {
  const [loading, setLoading] = React.useState(false);
  const [success, setSuccess] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleTest = async () => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      if (typeof window !== 'undefined' && 'Notification' in window) {
        if (Notification.permission !== 'granted') {
          await Notification.requestPermission();
        }
      }

      const registration = await navigator.serviceWorker.ready;
      const sub = await registration.pushManager.getSubscription();
      
      if (!sub) {
        throw new Error('No estás suscrito a las notificaciones en este dispositivo. Pulsa "Permitir Avisos" primero.');
      }

      const payload = {
        title: '¡Prueba Exitosa! 🎉',
        body: 'Las notificaciones push están funcionando correctamente en tu dispositivo.',
        url: '/settings'
      };

      const res = await fetch('/api/notifications/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription: sub, payload })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Error al enviar la notificación de prueba');
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      console.error(err);
      setError(`Error: ${err.message}`);
      
      if (err.message?.includes('unexpected response code') || err.message?.includes('410') || err.message?.includes('403')) {
        try {
          const registration = await navigator.serviceWorker.ready;
          const sub = await registration.pushManager.getSubscription();
          if (sub) await sub.unsubscribe();
        } catch (e) {
          console.error("Error unsubscribing", e);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-5 rounded-2xl bg-white border border-zinc-200 shadow-sm relative h-full flex flex-col justify-between">
      <div>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl bg-cyan-50 border border-cyan-100 flex items-center justify-center text-cyan-600 shadow-sm shrink-0">
            <BellRing className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-zinc-900">Notificaciones</h3>
            <p className="text-[10px] sm:text-xs text-zinc-500 font-medium">Prueba la recepción de alertas</p>
          </div>
        </div>
        
        {error && (
          <div className="mb-3 p-3 rounded-xl bg-red-50 border border-red-150 text-xs text-red-700 font-semibold leading-normal">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-3 p-3 rounded-xl bg-green-50 border border-green-150 text-xs text-green-700 font-semibold flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-600 shrink-0" /> Notificación enviada. Deberías recibirla ahora.
          </div>
        )}
      </div>

      <AnimatedButton 
        variant="secondary" 
        className="w-full text-xs font-black py-2.5 bg-zinc-50 hover:bg-zinc-100 text-zinc-700 border border-zinc-200 shadow-sm cursor-pointer mt-4" 
        onClick={handleTest}
        disabled={loading}
      >
        {loading ? 'Enviando...' : 'Enviar Notificación'}
      </AnimatedButton>
    </div>
  );
}
