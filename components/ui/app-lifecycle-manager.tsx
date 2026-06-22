'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';

/**
 * Gestor del ciclo de vida de la PWA (Progressive Web App).
 * Resuelve el problema de iOS donde la app se queda en caché indefinidamente
 * al no tener botón de recargar.
 */
export function AppLifecycleManager() {
  const router = useRouter();
  const lastActive = React.useRef<number>(Date.now());

  React.useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        const now = Date.now();
        // Si han pasado más de 1 hora (3600000 ms) en segundo plano, forzamos recarga
        // para asegurar que el atleta/entrenador tenga la última versión y datos.
        const timeDiff = now - lastActive.current;
        
        if (timeDiff > 1000 * 60 * 60) {
          // Primero actualizamos el Service Worker si hay nueva versión
          if ('serviceWorker' in navigator) {
            navigator.serviceWorker.ready.then((registration) => {
              registration.update();
            });
          }
          
          // Recarga fuerte: vacía la caché de Next.js y el DOM para traer la última versión
          window.location.reload();
        } else if (timeDiff > 1000 * 60 * 5) {
          // Si solo han pasado 5 minutos, refrescamos el router para traer nuevos datos
          // sin parpadear la pantalla
          router.refresh();
        }
        
        lastActive.current = now;
      } else {
        lastActive.current = Date.now();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [router]);

  return null;
}
