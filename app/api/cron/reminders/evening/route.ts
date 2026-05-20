import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

export const dynamic = 'force-dynamic';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const RESEND_API_KEY = process.env.RESEND_API_KEY || '';

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

  if (!RESEND_API_KEY) {
    console.error('Error: RESEND_API_KEY no está configurada.');
    return NextResponse.json({ error: 'Resend API key missing' }, { status: 500 });
  }

  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    return NextResponse.json({ error: 'Supabase credentials missing' }, { status: 500 });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  const resend = new Resend(RESEND_API_KEY);

  try {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    // Calcular el rango de la semana actual (lunes a domingo)
    const currentDay = today.getDay() || 7;
    const monday = new Date(today);
    monday.setDate(monday.getDate() - currentDay + 1);
    monday.setHours(0, 0, 0, 0);

    const sunday = new Date(monday);
    sunday.setDate(sunday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    const mondayStr = monday.toISOString().split('T')[0];
    const sundayStr = sunday.toISOString().split('T')[0];

    // Obtener perfiles de usuarios activos
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*, training_plans(name)')
      .not('active_plan_id', 'is', null);

    if (profilesError) {
      console.error('Error al obtener perfiles:', profilesError);
      return NextResponse.json({ error: profilesError.message }, { status: 500 });
    }

    const emailResults = [];

    for (const profile of profiles) {
      // Buscar entrenamientos programados para hoy
      const { data: todayWorkouts, error: workoutsError } = await supabase
        .from('user_workouts')
        .select('*, training_sessions(*)')
        .eq('user_id', profile.id)
        .eq('scheduled_date', todayStr);

      if (workoutsError) {
        console.error(`Error al buscar entrenamientos de hoy para el usuario ${profile.id}:`, workoutsError);
        continue;
      }

      const activeWorkouts = todayWorkouts?.filter(w => w.training_sessions?.sport_type !== 'descanso') || [];
      if (activeWorkouts.length === 0) {
        // Hoy era descanso, no molestamos al usuario con recapitulaciones
        continue;
      }

      // Comprobar si hay alguno pendiente
      const pendingWorkouts = activeWorkouts.filter(w => w.status === 'pending');
      const hasPending = pendingWorkouts.length > 0;

      // Obtener el correo del usuario
      const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(profile.id);
      if (authError || !authUser?.user) {
        console.error(`Error al buscar usuario en auth para el ID ${profile.id}:`, authError);
        continue;
      }

      const athleteEmail = authUser.user.email;
      if (!athleteEmail) continue;

      const toEmail = isLocalDev || athleteEmail.includes('example.com')
        ? 'guillermo.haya@alumni.mondragon.edu'
        : athleteEmail;

      const planName = profile.training_plans?.name || 'Ironman Elite Plan';

      // Calcular el progreso semanal de la semana actual
      const { data: weekWorkouts } = await supabase
        .from('user_workouts')
        .select('*, training_sessions(*)')
        .eq('user_id', profile.id)
        .gte('scheduled_date', mondayStr)
        .lte('scheduled_date', sundayStr);

      const totalWorkouts = weekWorkouts?.filter(w => w.training_sessions?.sport_type !== 'descanso').length || 0;
      
      // Si el entrenamiento de hoy no se completó, lo marcamos como 'missed'
      if (hasPending) {
        const { error: updateError } = await supabase
          .from('user_workouts')
          .update({ status: 'missed' })
          .eq('user_id', profile.id)
          .eq('scheduled_date', todayStr)
          .eq('status', 'pending');

        if (updateError) {
          console.error(`Error al actualizar estado a missed para ${profile.id}:`, updateError);
        }
      }

      // Re-consultar entrenamientos completados incluyendo el estado actualizado
      const completedWorkouts = weekWorkouts?.filter(w => 
        w.status === 'completed' && 
        !(hasPending && w.scheduled_date === todayStr) // Excluir si acabamos de cambiarlo a missed
      ).length || 0;

      const progressPercent = totalWorkouts > 0 ? Math.round((completedWorkouts / totalWorkouts) * 100) : 0;

      // Calcular días restantes hasta la carrera
      let daysRemaining = null;
      if (profile.target_race_date) {
        const raceDate = new Date(profile.target_race_date);
        const timeDiff = raceDate.getTime() - today.getTime();
        daysRemaining = Math.max(0, Math.ceil(timeDiff / (1000 * 3600 * 24)));
      }

      // Compilar plantilla de correo según éxito o fallo
      let subject = '';
      let emailHtml = '';

      if (hasPending) {
        // Recordatorio de entrenamientos fallidos/no completados
        const missedSessionNames = pendingWorkouts
          .map(w => w.training_sessions?.sport_type?.toUpperCase() || 'ENTRENAMIENTO')
          .join(' y ');

        subject = `🌙 Recordatorio: No dejes escapar tu progreso de hoy, ${profile.first_name || 'Triatleta'}`;
        emailHtml = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Recordatorio del Día</title>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #09090b; color: #fafafa; margin: 0; padding: 0; }
              .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
              .card { background-color: #18181b; border: 1px solid #27272a; border-radius: 24px; padding: 32px; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.3); }
              .badge { display: inline-block; background-color: rgba(239, 68, 68, 0.15); border: 1px solid rgba(239, 68, 68, 0.3); color: #f87171; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; padding: 4px 10px; border-radius: 9999px; margin-bottom: 16px; }
              h1 { font-size: 20px; font-weight: 800; color: #ffffff; margin-top: 0; margin-bottom: 12px; }
              p { font-size: 14px; line-height: 1.6; color: #a1a1aa; margin-top: 0; margin-bottom: 24px; }
              .highlight { color: #ffffff; font-weight: 600; }
              .progress-container { background-color: #0c0a09; border: 1px solid #1c1917; border-radius: 16px; padding: 20px; margin-bottom: 24px; }
              .progress-bar-bg { background-color: #27272a; border-radius: 9999px; height: 12px; width: 100%; overflow: hidden; }
              .progress-bar-fill { background-color: #ef4444; height: 100%; border-radius: 9999px; }
              .countdown-banner { background: linear-gradient(135deg, rgba(6, 182, 212, 0.1) 0%, rgba(16, 185, 129, 0.1) 100%); border: 1px solid rgba(6, 182, 212, 0.2); border-radius: 16px; padding: 16px; text-align: center; margin-bottom: 32px; }
              .countdown-number { font-size: 28px; font-weight: 900; color: #22d3ee; margin-bottom: 4px; }
              .countdown-text { font-size: 11px; font-weight: 700; color: #a1a1aa; text-transform: uppercase; }
              .btn { display: block; text-align: center; background-color: #ef4444; color: #ffffff !important; font-weight: 800; font-size: 14px; text-decoration: none; padding: 14px 24px; border-radius: 14px; }
              .footer { text-align: center; margin-top: 24px; font-size: 11px; color: #52525b; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="card">
                <span class="badge">🌙 Pendiente</span>
                <h1>¡Oye, ${profile.first_name || 'Triatleta'}!</h1>
                <p>
                  Hoy tenías programada la sesión de <span class="highlight">${missedSessionNames}</span>. No hemos detectado registros completados de esta sesión.
                  <br><br>
                  Recuerda: <span class="highlight">La constancia lo es todo</span>. Si fue por falta de tiempo o cansancio, mañana la IA reajustará tu plan para compensar, pero mantente enfocado.
                </p>

                <!-- Barra de Progreso Semanal -->
                <div class="progress-container">
                  <div style="margin-bottom: 6px; font-size: 12px; font-weight: 700; color: #ffffff;">
                    Progreso Semanal: ${completedWorkouts} de ${totalWorkouts} completados (${progressPercent}%)
                  </div>
                  <div class="progress-bar-bg">
                    <div class="progress-bar-fill" style="width: ${progressPercent}%;"></div>
                  </div>
                </div>

                <!-- Banner Cuenta Atrás -->
                ${daysRemaining !== null ? `
                <div class="countdown-banner">
                  <div class="countdown-number">🏁 Quedan ${daysRemaining} días</div>
                  <div class="countdown-text">para tu gran objetivo: ${profile.target_race_name || 'Tu Ironman'}</div>
                </div>
                ` : ''}

                <a href="https://triatlon-app.vercel.app/dashboard" class="btn">Replanificar / Registrar Sesión</a>
              </div>
              <div class="footer">
                Enviado de forma autónoma por tu Entrenador de IA. <br>
                ${planName} • Triatlón App 2026
              </div>
            </div>
          </body>
          </html>
        `;
      } else {
        // Felicitaciones por entrenos completados hoy
        subject = `🎉 ¡Excelente trabajo hoy, ${profile.first_name || 'Triatleta'}! Entrenamientos completados`;
        emailHtml = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>¡Felicidades por hoy!</title>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #09090b; color: #fafafa; margin: 0; padding: 0; }
              .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
              .card { background-color: #18181b; border: 1px solid #27272a; border-radius: 24px; padding: 32px; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.3); }
              .badge { display: inline-block; background-color: rgba(16, 185, 129, 0.15); border: 1px solid rgba(16, 185, 129, 0.3); color: #34d399; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; padding: 4px 10px; border-radius: 9999px; margin-bottom: 16px; }
              h1 { font-size: 20px; font-weight: 800; color: #ffffff; margin-top: 0; margin-bottom: 12px; }
              p { font-size: 14px; line-height: 1.6; color: #a1a1aa; margin-top: 0; margin-bottom: 24px; }
              .highlight { color: #ffffff; font-weight: 600; }
              .progress-container { background-color: #0c0a09; border: 1px solid #1c1917; border-radius: 16px; padding: 20px; margin-bottom: 24px; }
              .progress-bar-bg { background-color: #27272a; border-radius: 9999px; height: 12px; width: 100%; overflow: hidden; }
              .progress-bar-fill { background-color: #10b981; height: 100%; border-radius: 9999px; }
              .countdown-banner { background: linear-gradient(135deg, rgba(6, 182, 212, 0.1) 0%, rgba(16, 185, 129, 0.1) 100%); border: 1px solid rgba(6, 182, 212, 0.2); border-radius: 16px; padding: 16px; text-align: center; margin-bottom: 32px; }
              .countdown-number { font-size: 28px; font-weight: 900; color: #22d3ee; margin-bottom: 4px; }
              .countdown-text { font-size: 11px; font-weight: 700; color: #a1a1aa; text-transform: uppercase; }
              .btn { display: block; text-align: center; background-color: #10b981; color: #000000 !important; font-weight: 800; font-size: 14px; text-decoration: none; padding: 14px 24px; border-radius: 14px; }
              .footer { text-align: center; margin-top: 24px; font-size: 11px; color: #52525b; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="card">
                <span class="badge">🎉 ¡Completado!</span>
                <h1>¡Increíble trabajo hoy, ${profile.first_name || 'Triatleta'}!</h1>
                <p>
                  Has completado y registrado todas tus sesiones de hoy con éxito. Cada paso te acerca más a cruzar la meta del Ironman.
                  <br><br>
                  Tu constancia es ejemplar. Descansa bien esta noche para permitir que tu cuerpo asimile el esfuerzo.
                </p>

                <!-- Barra de Progreso Semanal -->
                <div class="progress-container">
                  <div style="margin-bottom: 6px; font-size: 12px; font-weight: 700; color: #ffffff;">
                    Progreso Semanal: ${completedWorkouts} de ${totalWorkouts} completados (${progressPercent}%)
                  </div>
                  <div class="progress-bar-bg">
                    <div class="progress-bar-fill" style="width: ${progressPercent}%;"></div>
                  </div>
                </div>

                <!-- Banner Cuenta Atrás -->
                ${daysRemaining !== null ? `
                <div class="countdown-banner">
                  <div class="countdown-number">🏁 Quedan ${daysRemaining} días</div>
                  <div class="countdown-text">para tu gran objetivo: ${profile.target_race_name || 'Tu Ironman'}</div>
                </div>
                ` : ''}

                <a href="https://triatlon-app.vercel.app/dashboard" class="btn">Ver Estadísticas de Progreso</a>
              </div>
              <div class="footer">
                Enviado de forma autónoma por tu Entrenador de IA. <br>
                ${planName} • Triatlón App 2026
              </div>
            </div>
          </body>
          </html>
        `;
      }

      // Enviar el correo
      const sendResult = await resend.emails.send({
        from: 'onboarding@resend.dev',
        to: toEmail,
        subject: subject,
        html: emailHtml,
      });

      emailResults.push({
        userId: profile.id,
        email: toEmail,
        success: !sendResult.error,
        messageId: sendResult.data?.id || null,
        error: sendResult.error || null
      });
    }

    return NextResponse.json({
      success: true,
      processed_date: todayStr,
      results: emailResults
    });

  } catch (error: any) {
    console.error('Excepción general en cron reminders evening:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
