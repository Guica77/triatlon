import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getForecastForLocation } from '@/lib/weather-service';
import { calculatePreWorkoutMeal, generateAlternativeMeal } from '@/lib/nutrition-utility';

export const dynamic = 'force-dynamic';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export async function GET(request: Request) {
  // 1. Verificación de seguridad de Vercel Cron
  const authHeader = request.headers.get('authorization');
  const isLocalDev = process.env.NODE_ENV === 'development';
  
  if (
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}` &&
    !isLocalDev
  ) {
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
      .select('id, preferred_ingredients, disliked_ingredients, active_plan_id')
      .not('active_plan_id', 'is', null);

    if (profilesError) {
      console.error('Error al obtener perfiles:', profilesError);
      return NextResponse.json({ error: profilesError.message }, { status: 500 });
    }

    const pushResults = [];
    const weather = await getForecastForLocation(undefined, undefined, todayStr);

    for (const profile of profiles) {
      // Buscar entrenamientos programados para hoy
      const { data: todayWorkouts, error: workoutsError } = await supabase
        .from('user_workouts')
        .select('*, training_sessions(sport_type, duration_min)')
        .eq('user_id', profile.id)
        .eq('scheduled_date', todayStr);

      if (workoutsError) {
        continue;
      }

      // Buscar biométricos del usuario
      const { data: biometrics } = await supabase
        .from('user_biometrics')
        .select('sleep_hours, sleep_score, daily_steps')
        .eq('user_id', profile.id)
        .order('date', { ascending: false })
        .limit(1);

      const latestBio: any = biometrics?.[0] || {};
      const sleepHours = latestBio.sleep_hours || 8;
      const sleepScore = latestBio.sleep_score || 80;
      const dailySteps = latestBio.daily_steps || 0;

      const activeWorkouts = todayWorkouts?.filter(w => w.training_sessions?.sport_type !== 'descanso') || [];

      if (activeWorkouts.length > 0) {
        const primarySession = activeWorkouts[0].training_sessions;
        const sportType = primarySession?.sport_type || 'entrenamiento';
        const durationMin = primarySession?.duration_min || 60;
        
        let title = '';
        let bodyText = '';
        
        // Determinar si necesitamos forzar un cambio de menú por mala recuperación o clima extremo
        const poorSleep = sleepHours < 6 || sleepScore < 60;
        const extremeHumidity = weather.humidity > 80;
        const extremeSteps = dailySteps > 15000;

        if (poorSleep || extremeHumidity || extremeSteps) {
          // DIETISTA AUTÓNOMO: Intervención requerida
          let reason = '';
          if (poorSleep) reason = `tu mal descanso (${sleepHours}h)`;
          else if (extremeHumidity) reason = `la humedad extrema (${weather.humidity}%)`;
          else if (extremeSteps) reason = `tu alto desgaste (${dailySteps} pasos)`;

          const altMeal = generateAlternativeMeal(sportType, durationMin, profile.preferred_ingredients, profile.disliked_ingredients, false);
          
          title = '🤖 Cambio Automático de Menú';
          bodyText = `Debido a ${reason}, he modificado tu comida pre-entreno a algo más fácil de asimilar: ${altMeal.mealName}. Revisa la app para ver los detalles.`;
        } else if (weather.temperature === 'calor' || weather.temperature === 'extremo') {
          // Prioridad 2: Alerta Climática Severa
          title = '🔥 Alerta de Calor: Nutrición Extra';
          bodyText = `Hoy hace ${weather.celsius}ºC. Para tu sesión de ${sportType}, aumenta tu ingesta de sodio (sal) e hidratación en un 25% para evitar la deshidratación.`;
        } else {
          // Prioridad 3: Alerta Pre-entreno normal
          const preMeal = calculatePreWorkoutMeal(sportType, durationMin, profile.preferred_ingredients);
          title = `Tu Pre-Entreno para hoy 🔋`;
          bodyText = `Recuerda comer tu ${preMeal.mealName} unas 2 horas antes de empezar tu sesión de ${durationMin} min. ¡A tope!`;
        }

        // Enviar notificación push
        const { sendPushNotification } = await import('@/lib/notifications');
        const pushSuccess = await sendPushNotification(profile.id, {
          title: title,
          body: bodyText,
          url: '/dashboard'
        });

        pushResults.push({
          userId: profile.id,
          success: pushSuccess,
          method: 'web_push'
        });
      }
    }

    return NextResponse.json({
      success: true,
      processed_date: todayStr,
      weather_injected: weather.temperature,
      results: pushResults
    });

  } catch (error: any) {
    console.error('Excepción general en cron reminders nutrition:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
