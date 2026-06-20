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
  const [dismissed, setDismissed] = React.useState(true); // Default to true to prevent flashing during hydration
  const [permission, setPermission] = React.useState<NotificationPermission | null>(null);

  const checkSubscription = React.useCallback(async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const sub = await registration.pushManager.getSubscription();
      setSubscription(sub);

      if (sub) {
        // Asegurar de que la suscripción existente esté sincronizada en la BD de Supabase
        const lastSynced = localStorage.getItem('push_sub_synced_token');
        const currentTokenStr = JSON.stringify(sub);
        if (lastSynced !== currentTokenStr) {
          const res = await fetch('/api/notifications/subscribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: currentTokenStr
          });
          if (res.ok) {
            localStorage.setItem('push_sub_synced_token', currentTokenStr);
          }
        }
      } else if (Notification.permission === 'granted') {
        // Auto-subscribe in background if permission is already granted but subscription got lost/not stored
        const publicVapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
        if (publicVapidKey) {
          const newSub = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(publicVapidKey)
          });
          setSubscription(newSub);
          const currentTokenStr = JSON.stringify(newSub);
          const res = await fetch('/api/notifications/subscribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: currentTokenStr
          });
          if (res.ok) {
            localStorage.setItem('push_sub_synced_token', currentTokenStr);
          }
        }
      }
    } catch (err) {
      console.error('Error checking subscription', err);
    }
  }, []);

  React.useEffect(() => {
    // Read persisted dismissed state on client mount
    const isDismissed = localStorage.getItem('push_notifications_dismissed') === 'true';
    setDismissed(isDismissed);

    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermission(Notification.permission);
    }

    const timer = setTimeout(() => {
      if ('serviceWorker' in navigator && 'PushManager' in window) {
        setIsSupported(true);
        checkSubscription();
      }
    }, 0);
    return () => clearTimeout(timer);
  }, [checkSubscription]);

  const subscribeToPush = async () => {
    setLoading(true);
    try {
      if (!('serviceWorker' in navigator)) throw new Error('Service Worker no soportado.');
      
      const registration = await navigator.serviceWorker.ready;
      if (!registration) throw new Error('No se encontró el Service Worker.');
      
      const publicVapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!publicVapidKey) {
        throw new Error("La clave pública VAPID no está configurada.");
      }

      // Explicitly request browser notification permission
      const permResult = await Notification.requestPermission();
      setPermission(permResult);
      if (permResult !== 'granted') {
        throw new Error('Permiso de notificaciones denegado.');
      }

      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicVapidKey)
      });

      setSubscription(sub);

      // Save to Supabase
      const currentTokenStr = JSON.stringify(sub);
      const res = await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: currentTokenStr
      });
      
      if (!res.ok) {
        throw new Error('Error al guardar la suscripción en la base de datos.');
      } else {
        localStorage.setItem('push_sub_synced_token', currentTokenStr);
      }

    } catch (err) {
      console.error('Error subscribing to push', err);
      alert('Error activando notificaciones: ' + String(err));
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = () => {
    localStorage.setItem('push_notifications_dismissed', 'true');
    setDismissed(true);
  };

  if (!isSupported || subscription || dismissed || permission === 'granted' || permission === 'denied') return null;

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
              onClick={handleDismiss}
              className="text-xs text-zinc-400 border border-zinc-800"
            >
              Más tarde
            </AnimatedButton>
          </div>
        </div>
        <button title="Cerrar" aria-label="Cerrar" onClick={handleDismiss} className="text-zinc-500 hover:text-zinc-300 shrink-0">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
