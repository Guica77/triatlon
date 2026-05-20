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
    const host = request.headers.get('host') || 'triatlon-app-mocha.vercel.app';
    const protocol = host.includes('localhost') ? 'http' : 'https';
    const baseUrl = `${protocol}://${host}`;

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

    const emailResults = [];

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

      // Determinar el contenido según si hay o no entrenamientos
      let workoutsListHtml = '';
      const activeWorkouts = todayWorkouts?.filter(w => w.training_sessions?.sport_type !== 'descanso') || [];

      if (activeWorkouts.length === 0) {
        workoutsListHtml = `
          <div style="background-color: rgba(16, 185, 129, 0.05); border: 1px dashed rgba(16, 185, 129, 0.2); border-radius: 16px; padding: 20px; text-align: center; margin-bottom: 24px;">
            <p style="font-size: 16px; font-weight: 700; color: #10b981; margin: 0;">💤 ¡Hoy toca descanso!</p>
            <p style="font-size: 13px; color: #a1a1aa; margin: 8px 0 0 0;">Día de recuperación o "full relax". Aprovecha para recargar pilas, estirar y alimentarte bien.</p>
          </div>
        `;
      } else {
        // Ordenar entrenamientos (si es posible, por orden de creación o tipo)
        workoutsListHtml = activeWorkouts.map((w, index) => {
          const sport = w.training_sessions?.sport_type?.toUpperCase() || 'ENTRENAMIENTO';
          const duration = w.training_sessions?.duration_min ? `${w.training_sessions.duration_min} min` : 'Volumen libre';
          const desc = w.training_sessions?.description || 'Sesión de entrenamiento planificada.';
          const timingLabel = index === 0 ? '🌅 Sesión Mañana' : '🌙 Sesión Noche';

          let sportBg = 'rgba(6, 182, 212, 0.1)';
          let sportBorder = 'rgba(6, 182, 212, 0.3)';
          let sportColor = '#22d3ee';

          if (sport.includes('CARRERA')) {
            sportBg = 'rgba(236, 72, 153, 0.1)';
            sportBorder = 'rgba(236, 72, 153, 0.3)';
            sportColor = '#f472b6';
          } else if (sport.includes('CICLISMO')) {
            sportBg = 'rgba(234, 179, 8, 0.1)';
            sportBorder = 'rgba(234, 179, 8, 0.3)';
            sportColor = '#facc15';
          }

          return `
            <div style="background-color: #27272a; border: 1px solid #3f3f46; border-radius: 16px; padding: 20px; margin-bottom: 16px;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                <span style="font-size: 11px; font-weight: 800; text-transform: uppercase; color: #a1a1aa;">${timingLabel}</span>
                <span style="background-color: ${sportBg}; border: 1px solid ${sportBorder}; color: ${sportColor}; font-size: 10px; font-weight: 800; padding: 2px 8px; border-radius: 9999px;">
                  ${sport} (${duration})
                </span>
              </div>
              <p style="font-size: 13px; color: #e4e4e7; margin: 0; line-height: 1.5; font-weight: 500;">
                ${desc}
              </p>
            </div>
          `;
        }).join('');
      }

      // Compilar plantilla de correo de mañana
      const emailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Tu Plan de Hoy</title>
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
              margin-bottom: 8px;
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
              margin-top: 24px;
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
              <span class="badge">🌅 Plan de la Mañana</span>
              <h1>¡Buenos días, ${profile.first_name || 'Triatleta'}!</h1>
              <p>
                Aquí tienes la planificación de sesiones asignadas para hoy. Prepárate mentalmente y organiza tu alimentación e hidratación.
              </p>

              <!-- Listado de Entrenamientos -->
              ${workoutsListHtml}

              <a href="${baseUrl}/dashboard" class="btn">Abrir mi Dashboard</a>
            </div>
            <div class="footer">
              Enviado de forma autónoma por tu Entrenador de IA. <br>
              ${planName} • Triatlón App 2026
            </div>
          </div>
        </body>
        </html>
      `;

      // Enviar el correo
      const sendResult = await resend.emails.send({
        from: 'onboarding@resend.dev',
        to: toEmail,
        subject: `🌅 ¡Buenos días, ${profile.first_name || 'Triatleta'}! Tu plan de hoy`,
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
    console.error('Excepción general en cron reminders morning:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
