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
      // Pedir permiso si no se ha pedido (por si acaso)
      if (typeof window !== 'undefined' && 'Notification' in window) {
        if (Notification.permission !== 'granted') {
          await Notification.requestPermission();
        }
      }

      // 1. Get current subscription from service worker
      const registration = await navigator.serviceWorker.ready;
      const sub = await registration.pushManager.getSubscription();
      
      if (!sub) {
        throw new Error('No estás suscrito a las notificaciones en este dispositivo. Pulsa "Permitir Avisos" primero.');
      }

      // 2. Send test notification directly
      const payload = {
        title: '¡Prueba Exitosa! 🎉',
        body: 'Las notificaciones push están funcionando correctamente en tu dispositivo.',
        url: '/settings'
      };

      // Call our API to send it to ourselves using our own sub
      // Since we don't have a direct "send to myself" route without knowing our own user ID, 
      // let's create a quick API route or just use the subscription directly?
      // Wait, we need the server to send the push using VAPID keys.
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
      
      // Si el servidor de push (Google/Apple) rechaza la firma, significa que las claves VAPID 
      // con las que se creó la suscripción ya no coinciden con las del servidor actual.
      if (err.message?.includes('unexpected response code') || err.message?.includes('410') || err.message?.includes('403')) {
        setError("Suscripción caducada o inválida. Se ha reseteado. Por favor, refresca la página y vuelve a darle a 'Permitir Avisos'.");
        try {
          const registration = await navigator.serviceWorker.ready;
          const sub = await registration.pushManager.getSubscription();
          if (sub) await sub.unsubscribe();
        } catch (e) {
          console.error("Error unsubscribing", e);
        }
      } else {
        setError(err.message || 'Error desconocido');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 shadow-xl">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
          <BellRing className="w-4 h-4" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-white">Prueba de Notificaciones</h3>
          <p className="text-xs text-zinc-400">Verifica si tu dispositivo recibe alertas</p>
        </div>
      </div>
      
      {error && (
        <div className="mb-3 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-3 p-3 rounded-xl bg-green-500/10 border border-green-500/20 text-xs text-green-400 flex items-center gap-2">
          <CheckCircle className="w-4 h-4" /> Notificación enviada. Debería sonarte ahora.
        </div>
      )}

      <AnimatedButton 
        variant="secondary" 
        className="w-full text-xs py-2 bg-zinc-800 hover:bg-zinc-700" 
        onClick={handleTest}
        disabled={loading}
      >
        {loading ? 'Enviando...' : 'Enviar Notificación de Prueba'}
      </AnimatedButton>
    </div>
  );
}
