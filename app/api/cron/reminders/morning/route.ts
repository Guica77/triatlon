import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { isAuthorizedCronRequest } from '@/lib/cron-auth';

export const dynamic = 'force-dynamic';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export async function GET(request: Request) {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    return NextResponse.json({ error: 'Supabase credentials missing' }, { status: 500 });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  try {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    // Obtener perfiles de usuarios activos
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*, training_plans(name)')
      .not('active_plan_id', 'is', null);

    if (profilesError) {
      console.error('Error al obtener perfiles:', profilesError);
      return NextResponse.json({ error: profilesError.message }, { status: 500 });
    }

    const pushResults = [];

    for (const profile of profiles) {
      // Buscar entrenamientos programados para hoy
      const { data: todayWorkouts, error: workoutsError } = await supabase
        .from('user_workouts')
        .select('*, training_sessions(*) ')
        .eq('user_id', profile.id)
        .eq('scheduled_date', todayStr);

      if (workoutsError) {
        console.error(`Error al buscar entrenamientos de hoy para el usuario ${profile.id}:`, workoutsError);
        continue;
      }

      const activeWorkouts = todayWorkouts?.filter(w => w.training_sessions?.sport_type !== 'descanso') || [];

      // Fetch today's biometrics for personalization (readiness, sleep, HRV)
      const { data: biometrics } = await supabase
        .from('user_biometrics')
        .select('readiness_score, sleep_hours, hrv, fatigue_rating')
        .eq('user_id', profile.id)
        .eq('date', todayStr)
        .maybeSingle();

      const readiness = biometrics?.readiness_score;

      const sports = activeWorkouts.map(w => {
        const type = w.training_sessions?.sport_type;
        return type ? type.charAt(0).toUpperCase() + type.slice(1) : 'entrenamiento';
      }).join(' y ');

      let bodyText = '';
      if (activeWorkouts.length === 0) {
        bodyText = readiness
          ? `Tu readiness es ${readiness}. Hoy toca descanso — aprovecha para recuperar. 💤`
          : '¡Hoy toca descanso! Aprovecha para recuperar. Registra tus stats de hoy en la app. 💤';
      } else {
        bodyText = readiness
          ? `Tu readiness es ${readiness}${biometrics?.sleep_hours ? `, dormiste ${biometrics.sleep_hours}h` : ''}. Perfecto para tu sesión de ${sports}. 💪`
          : `¡Buenos días! Hoy tienes sesión de ${sports}. No olvides registrar tus stats matutinos antes de empezar. 🚀`;
      }

      // Enviar notificación push
      const { sendPushNotification } = await import('@/lib/notifications');
      const pushSuccess = await sendPushNotification(profile.id, {
        title: 'Plan de la Mañana 🌅',
        body: bodyText,
        url: '/dashboard'
      });

      pushResults.push({
        userId: profile.id,
        success: pushSuccess,
        method: 'web_push'
      });
    }

    return NextResponse.json({
      success: true,
      processed_date: todayStr,
      results: pushResults
    });

  } catch (error: any) {
    console.error('Excepción general en cron reminders morning:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
