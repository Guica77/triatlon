import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import webpush from 'web-push';

// Permite simular desde el navegador si pasamos un secret
export const maxDuration = 300;

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');
    const isCronRequest = authHeader === `Bearer ${process.env.CRON_SECRET}`;

    // Permitir acceso vía navegador si se pasa la clave secreta por query
    const url = new URL(req.url);
    const isManualOverride = url.searchParams.get('secret') === process.env.CRON_SECRET;

    if (!isCronRequest && !isManualOverride) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
      webpush.setVapidDetails(
        process.env.VAPID_SUBJECT || 'mailto:support@triatlonpro.com',
        process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
        process.env.VAPID_PRIVATE_KEY
      );
    } else {
      console.warn("Faltan las claves VAPID para enviar notificaciones push.");
    }

    const adminSupabase = createAdminClient();

    // 1. Obtener la fecha de hoy en formato YYYY-MM-DD
    const today = new Date().toISOString().split('T')[0];

    // 2. Buscar entrenamientos pendientes para hoy
    const { data: workouts, error: workoutError } = await adminSupabase
      .from('user_workouts')
      .select(`
        id,
        user_id,
        training_sessions ( sport_type )
      `)
      .eq('scheduled_date', today)
      .eq('status', 'pending');

    if (workoutError) throw workoutError;
    if (!workouts || workouts.length === 0) {
      return NextResponse.json({ success: true, message: 'No hay entrenamientos pendientes para hoy.' });
    }

    // 3. Agrupar por user_id y obtener suscripciones push
    const usersToNotify = new Map<string, { sportType: string }>();
    workouts.forEach(w => {
      // Ignoramos descansos
      if (w.training_sessions?.sport_type && w.training_sessions.sport_type !== 'descanso') {
        usersToNotify.set(w.user_id, { sportType: w.training_sessions.sport_type });
      }
    });

    if (usersToNotify.size === 0) {
      return NextResponse.json({ success: true, message: 'Solo hay descansos programados hoy.' });
    }

    const userIds = Array.from(usersToNotify.keys());
    const { data: profiles, error: profileError } = await adminSupabase
      .from('profiles')
      .select('id, push_subscriptions')
      .in('id', userIds)
      .not('push_subscriptions', 'is', null);

    if (profileError) throw profileError;

    let successCount = 0;
    let failCount = 0;

    // 4. Enviar notificaciones a los que tengan suscripción
    if (profiles && profiles.length > 0) {
      const promises = profiles.map(async (profile) => {
        const sub = profile.push_subscriptions as any;
        const sportInfo = usersToNotify.get(profile.id);
        const sportType = sportInfo ? sportInfo.sportType.charAt(0).toUpperCase() + sportInfo.sportType.slice(1) : 'Entrenamiento';

        const payload = JSON.stringify({
          title: 'Triatlon Pro: Entreno del Día',
          body: `¡Buenos días! Tienes sesión de ${sportType} programada para hoy. ¡Vamos a por ello! 🚀`,
          url: '/dashboard',
        });

        try {
          await webpush.sendNotification(sub, payload);
          successCount++;
        } catch (pushErr: any) {
          console.error(`Error enviando push a ${profile.id}:`, pushErr);
          failCount++;
          // Si el error es 410 (Gone), la suscripción expiró y podríamos borrarla
          if (pushErr.statusCode === 410) {
             await adminSupabase.from('profiles').update({ push_subscriptions: null }).eq('id', profile.id);
          }
        }
      });

      await Promise.all(promises);
    }

    return NextResponse.json({ 
      success: true, 
      message: `Enviadas ${successCount} notificaciones. Fallaron ${failCount}.` 
    });

  } catch (error: any) {
    console.error('Error en Cron Job Diario:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
