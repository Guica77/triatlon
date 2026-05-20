import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

// Desactivar caché para asegurar ejecución dinámica
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
    console.error('Error: RESEND_API_KEY no está configurada en las variables de entorno.');
    return NextResponse.json({ error: 'Resend API key missing' }, { status: 500 });
  }

  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    return NextResponse.json({ error: 'Supabase credentials missing' }, { status: 500 });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  const resend = new Resend(RESEND_API_KEY);

  try {
    // Calcular la fecha de ayer
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

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

    // 2. Obtener perfiles de usuarios con entrenamientos pendientes ayer
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
      // 3. Buscar entrenamientos del día anterior que siguen en "pending"
      const { data: yesterdayWorkouts, error: workoutsError } = await supabase
        .from('user_workouts')
        .select('*, training_sessions(*)')
        .eq('user_id', profile.id)
        .eq('scheduled_date', yesterdayStr)
        .eq('status', 'pending');

      if (workoutsError) {
        console.error(`Error al buscar entrenamientos de ayer para el usuario ${profile.id}:`, workoutsError);
        continue;
      }

      if (yesterdayWorkouts && yesterdayWorkouts.length > 0) {
        // Encontramos entrenamientos no registrados ayer
        // Marcarlos como 'missed' en la base de datos
        const { error: updateError } = await supabase
          .from('user_workouts')
          .update({ status: 'missed' })
          .eq('user_id', profile.id)
          .eq('scheduled_date', yesterdayStr)
          .eq('status', 'pending');

        if (updateError) {
          console.error(`Error al marcar entrenamientos como missed para el usuario ${profile.id}:`, updateError);
        }

        // Obtener el correo del atleta desde la API de administración de Supabase
        const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(profile.id);
        if (authError || !authUser?.user) {
          console.error(`Error al buscar usuario en auth para el ID ${profile.id}:`, authError);
          continue;
        }

        const athleteEmail = authUser.user.email;
        if (!athleteEmail) continue;

        // Calcular el progreso semanal de la semana actual
        const { data: weekWorkouts } = await supabase
          .from('user_workouts')
          .select('*, training_sessions(*)')
          .eq('user_id', profile.id)
          .gte('scheduled_date', mondayStr)
          .lte('scheduled_date', sundayStr);

        const totalWorkouts = weekWorkouts?.filter(w => w.training_sessions?.sport_type !== 'descanso').length || 0;
        const completedWorkouts = weekWorkouts?.filter(w => w.status === 'completed').length || 0;
        const progressPercent = totalWorkouts > 0 ? Math.round((completedWorkouts / totalWorkouts) * 100) : 0;

        // Calcular días restantes hasta la carrera
        let daysRemaining = null;
        if (profile.target_race_date) {
          const raceDate = new Date(profile.target_race_date);
          const timeDiff = raceDate.getTime() - today.getTime();
          daysRemaining = Math.max(0, Math.ceil(timeDiff / (1000 * 3600 * 24)));
        }

        // Títulos de los entrenamientos no completados
        const missedSessionNames = yesterdayWorkouts
          .map(w => w.training_sessions?.sport_type?.toUpperCase() || 'ENTRENAMIENTO')
          .join(' y ');

        // Configurar remitente y receptor
        // En el sandbox de Resend, solo se puede enviar al correo del titular de la cuenta
        const toEmail = isLocalDev || athleteEmail.includes('example.com')
          ? 'guillermo.haya@alumni.mondragon.edu'
          : athleteEmail;

        const planName = profile.training_plans?.name || 'Ironman Elite Plan';

        // 4. Compilar plantilla de correo HTML
        const emailHtml = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Recordatorio de Entrenamiento</title>
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
                background-color: #09090b;
                color: #fafafa;
                margin: 0;
                padding: 0;
              }
              .container {
                max-width: 600px;
                margin: 0 auto;
                padding: 40px 20px;
              }
              .card {
                background-color: #18181b;
                border: 1px solid #27272a;
                border-radius: 24px;
                padding: 32px;
                box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.3);
              }
              .badge {
                display: inline-block;
                background-color: rgba(6, 182, 212, 0.15);
                border: 1px solid rgba(6, 182, 212, 0.3);
                color: #22d3ee;
                font-size: 10px;
                font-weight: 800;
                text-transform: uppercase;
                letter-spacing: 0.05em;
                padding: 4px 10px;
                border-radius: 9999px;
                margin-bottom: 16px;
              }
              h1 {
                font-size: 20px;
                font-weight: 800;
                color: #ffffff;
                margin-top: 0;
                margin-bottom: 12px;
                letter-spacing: -0.025em;
              }
              p {
                font-size: 14px;
                line-height: 1.6;
                color: #a1a1aa;
                margin-top: 0;
                margin-bottom: 24px;
              }
              .highlight {
                color: #ffffff;
                font-weight: 600;
              }
              .progress-container {
                background-color: #0c0a09;
                border: 1px solid #1c1917;
                border-radius: 16px;
                padding: 20px;
                margin-bottom: 24px;
              }
              .progress-header {
                display: flex;
                justify-content: space-between;
                font-size: 12px;
                font-weight: 600;
                color: #fafafa;
                margin-bottom: 8px;
              }
              .progress-bar-bg {
                background-color: #27272a;
                border-radius: 9999px;
                height: 12px;
                width: 100%;
                overflow: hidden;
              }
              .progress-bar-fill {
                background-color: #06b6d4;
                height: 100%;
                border-radius: 9999px;
              }
              .countdown-banner {
                background: linear-gradient(135deg, rgba(6, 182, 212, 0.1) 0%, rgba(16, 185, 129, 0.1) 100%);
                border: 1px solid rgba(6, 182, 212, 0.2);
                border-radius: 16px;
                padding: 16px;
                text-align: center;
                margin-bottom: 32px;
              }
              .countdown-number {
                font-size: 28px;
                font-weight: 900;
                color: #22d3ee;
                margin-bottom: 4px;
              }
              .countdown-text {
                font-size: 11px;
                font-weight: 700;
                color: #a1a1aa;
                text-transform: uppercase;
                letter-spacing: 0.05em;
              }
              .btn {
                display: block;
                text-align: center;
                background-color: #06b6d4;
                color: #000000 !important;
                font-weight: 800;
                font-size: 14px;
                text-decoration: none;
                padding: 14px 24px;
                border-radius: 14px;
                transition: background-color 0.2s;
              }
              .footer {
                text-align: center;
                margin-top: 24px;
                font-size: 11px;
                color: #52525b;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="card">
                <span class="badge">Recordatorio Diario</span>
                <h1>¡Oye, ${profile.first_name || 'Triatleta'}!</h1>
                <p>
                  Ayer tenías programada la sesión de <span class="highlight">${missedSessionNames}</span> en tu planificación. No vimos registros completados en tu panel.
                  <br><br>
                  <span class="highlight">La constancia es la única clave</span> para dominar el Ironman. Cada entreno suma de cara a tu gran día.
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

                <a href="https://triatlon-app.vercel.app/dashboard" class="btn">Entrar a mi Dashboard</a>
              </div>
              <div class="footer">
                Enviado de forma autónoma por tu Entrenador de IA. <br>
                ${planName} • Triatlón App 2026
              </div>
            </div>
          </body>
          </html>
        `;

        // 5. Enviar el correo electrónico
        const sendResult = await resend.emails.send({
          from: 'onboarding@resend.dev',
          to: toEmail,
          subject: `⚠️ ¡No dejes que el entreno de ayer te pare, ${profile.first_name || 'Triatleta'}!`,
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
    }

    return NextResponse.json({
      success: true,
      processed_date: yesterdayStr,
      results: emailResults
    });

  } catch (error: any) {
    console.error('Excepción general en cron reminders:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
