'use client';

import * as React from 'react';
import { Bell, BellRing, X } from 'lucide-react';
import { AnimatedButton } from '@/components/ui/animated-button';

const urlBase64ToUint8Array = (base64String: string) => {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
};

export function PushNotificationManager() {
  const [isSupported, setIsSupported] = React.useState(false);
  const [subscription, setSubscription] = React.useState<PushSubscription | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [dismissed, setDismissed] = React.useState(false);

  React.useEffect(() => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      setIsSupported(true);
      checkSubscription();
    }
  }, []);

  const checkSubscription = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const sub = await registration.pushManager.getSubscription();
      setSubscription(sub);
    } catch (err) {
      console.error('Error checking subscription', err);
    }
  };

  const subscribeToPush = async () => {
    setLoading(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      
      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!)
      });

      setSubscription(sub);

      // Save to Supabase
      await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sub)
      });

    } catch (err) {
      console.error('Error subscribing to push', err);
      // Fallback for iOS PWA: Alert if they haven't added to home screen
      if (String(err).includes('NotAllowedError')) {
        alert('Debes dar permisos de notificación en los ajustes de tu navegador o añadir esta web a la Pantalla de Inicio en iOS.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isSupported || subscription || dismissed) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 md:left-auto md:right-6 md:w-96 bg-zinc-900 border border-cyan-500/30 rounded-2xl p-4 shadow-2xl shadow-cyan-500/10 z-[100] animate-in slide-in-from-bottom-10">
      <div className="flex items-start justify-between gap-3">
        <div className="w-10 h-10 rounded-full bg-cyan-500/10 flex items-center justify-center text-cyan-400 shrink-0">
          <BellRing className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <h4 className="text-sm font-bold text-zinc-100">Activar Notificaciones</h4>
          <p className="text-xs text-zinc-400 mt-1">
            Activa las alertas para recibir mensajes de tu entrenador al instante. (En iPhone, añade a la Pantalla de Inicio primero).
          </p>
          <div className="flex gap-2 mt-3">
            <AnimatedButton 
              variant="primary" 
              size="sm" 
              onClick={subscribeToPush}
              disabled={loading}
              className="!bg-cyan-500 hover:!bg-cyan-400 !text-black text-xs font-bold"
            >
              {loading ? 'Activando...' : 'Permitir Avisos'}
            </AnimatedButton>
            <AnimatedButton 
              variant="ghost" 
              size="sm" 
              onClick={() => setDismissed(true)}
              className="text-xs text-zinc-400 border border-zinc-800"
            >
              Más tarde
            </AnimatedButton>
          </div>
        </div>
        <button onClick={() => setDismissed(true)} className="text-zinc-500 hover:text-zinc-300 shrink-0">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
