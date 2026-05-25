import { Resend } from 'resend';
import { createClient as createDirectClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const RESEND_API_KEY = process.env.RESEND_API_KEY || '';

export async function sendWorkoutCompletionEmail(
  userId: string,
  workoutId: string,
  actualTss: number,
  source: string,
  adjustmentMsg?: string | null
) {
  if (!RESEND_API_KEY) {
    console.error('Email Error: RESEND_API_KEY no configurada');
    return { error: 'Resend API key missing' };
  }

  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('Email Error: Supabase credentials missing');
    return { error: 'Supabase credentials missing' };
  }

  const supabase = createDirectClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  const resend = new Resend(RESEND_API_KEY);

  try {
    // 1. Obtener perfil de usuario
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*, training_plans(name)')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      console.error('Email Error: Perfil de usuario no encontrado', profileError);
      return { error: 'Profile not found' };
    }

    // 2. Obtener email de Auth
    const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(userId);
    if (authError || !authUser?.user) {
      console.error('Email Error: Usuario no encontrado en Auth', authError);
      return { error: 'Auth user not found' };
    }

    const athleteEmail = authUser.user.email;
    if (!athleteEmail) {
      console.error('Email Error: El usuario no tiene email configurado');
      return { error: 'User email missing' };
    }

    // Determinar destinatario
    const isLocalDev = process.env.NODE_ENV === 'development';
    const toEmail = isLocalDev || athleteEmail.includes('example.com')
      ? 'guillermo.haya@alumni.mondragon.edu'
      : athleteEmail;

    // 3. Obtener el workout y la sesión de entrenamiento asociada
    const { data: workout, error: workoutError } = await supabase
      .from('user_workouts')
      .select(`
        id,
        scheduled_date,
        completed_at,
        actual_tss,
        status,
        training_sessions (
          id,
          sport_type,
          duration_min,
          description
        )
      `)
      .eq('id', workoutId)
      .single();

    if (workoutError || !workout) {
      console.error('Email Error: Workout no encontrado', workoutError);
      return { error: 'Workout not found' };
    }

    const session = (workout as any).training_sessions;
    if (!session) {
      console.error('Email Error: Sesión de entrenamiento no encontrada para el workout');
      return { error: 'Training session not found' };
    }

    // 4. Obtener telemetría si existe
    const { data: telemetry } = await supabase
      .from('universal_telemetry')
      .select('*')
      .eq('workout_id', workoutId)
      .maybeSingle();

    // 5. Configurar diseño visual basado en el deporte
    const sport = (session.sport_type || '').toLowerCase();
    let sportLabel = 'Entrenamiento';
    let sportEmoji = '💪';
    let themeColor = '#a855f7'; // Purple default
    let badgeBg = 'rgba(168, 85, 247, 0.1)';
    let badgeBorder = 'rgba(168, 85, 247, 0.3)';

    if (sport.includes('swim') || sport.includes('natación')) {
      sportLabel = 'Natación';
      sportEmoji = '🏊‍♂️';
      themeColor = '#22d3ee'; // Cyan
      badgeBg = 'rgba(6, 182, 212, 0.1)';
      badgeBorder = 'rgba(6, 182, 212, 0.3)';
    } else if (sport.includes('bike') || sport.includes('ciclismo') || sport.includes('ciclismo_fuerza') || sport.includes('ciclismo_rodillo')) {
      sportLabel = 'Ciclismo';
      sportEmoji = '🚴‍♂️';
      themeColor = '#facc15'; // Yellow
      badgeBg = 'rgba(234, 179, 8, 0.1)';
      badgeBorder = 'rgba(234, 179, 8, 0.3)';
    } else if (sport.includes('run') || sport.includes('carrera') || sport.includes('transicion_run')) {
      sportLabel = 'Carrera';
      sportEmoji = '🏃‍♂️';
      themeColor = '#f472b6'; // Pink
      badgeBg = 'rgba(236, 72, 153, 0.1)';
      badgeBorder = 'rgba(236, 72, 153, 0.3)';
    } else if (sport.includes('fuerza') || sport.includes('strength')) {
      sportLabel = 'Fuerza';
      sportEmoji = '🏋️‍♂️';
      themeColor = '#10b981'; // Emerald
      badgeBg = 'rgba(16, 185, 129, 0.1)';
      badgeBorder = 'rgba(16, 185, 129, 0.3)';
    } else if (sport.includes('brick') || sport.includes('transición')) {
      sportLabel = 'Brick / Transición';
      sportEmoji = '🧱';
      themeColor = '#f97316'; // Orange
      badgeBg = 'rgba(249, 115, 22, 0.1)';
      badgeBorder = 'rgba(249, 115, 22, 0.3)';
    }

    // Calcular valores de comparación
    const plannedDuration = session.duration_min || 0;
    const actualDuration = telemetry?.actual_duration_min || plannedDuration;
    
    // Estimación planificada de TSS (Z2 IF 0.75)
    const plannedTss = plannedDuration > 0 ? Math.round((plannedDuration / 60) * Math.pow(0.75, 2) * 100) : 0;
    const finalActualTss = Number(actualTss) || Number(workout.actual_tss) || Number(telemetry?.actual_tss) || 0;

    // Distancia
    let distanceHtml = '';
    if (telemetry?.actual_distance_km) {
      const dist = Number(telemetry.actual_distance_km);
      if (sportLabel === 'Natación') {
        const meters = Math.round(dist * 1000);
        distanceHtml = `${meters} m`;
      } else {
        distanceHtml = `${dist.toFixed(1)} km`;
      }
    } else {
      // Estimación manual
      if (sportLabel === 'Natación') {
        distanceHtml = `${plannedDuration * 40} m (est.)`;
      } else if (sportLabel === 'Ciclismo') {
        distanceHtml = `${(plannedDuration * 0.4).toFixed(1)} km (est.)`;
      } else if (sportLabel === 'Carrera') {
        distanceHtml = `${(plannedDuration * 0.2).toFixed(1)} km (est.)`;
      } else {
        distanceHtml = '--';
      }
    }

    // Dispositivo o proveedor
    let deviceLabel = 'Registro Manual';
    if (telemetry?.source_provider) {
      const prov = telemetry.source_provider;
      const deviceName = telemetry.raw_payload?.device || '';
      deviceLabel = `${prov.charAt(0).toUpperCase() + prov.slice(1)}${deviceName ? ` (${deviceName})` : ''}`;
    } else if (source && source !== 'manual') {
      deviceLabel = source.charAt(0).toUpperCase() + source.slice(1);
    }

    // Métricas fisiológicas avanzadas si están presentes
    let advancedMetricsHtml = '';
    if (telemetry) {
      const heartRate = telemetry.avg_hr ? `${Math.round(telemetry.avg_hr)} / ${Math.round(telemetry.max_hr || 0)} ppm` : null;
      const power = telemetry.avg_power ? `${Math.round(telemetry.avg_power)} W ${telemetry.normalized_power ? `(NP: ${Math.round(telemetry.normalized_power)} W)` : ''}` : null;
      const cadence = telemetry.avg_cadence ? `${Math.round(telemetry.avg_cadence)} ${sportLabel === 'Ciclismo' ? 'rpm' : 'ppm'}` : null;
      const aerobicTe = telemetry.training_effect_aerobic ? `${telemetry.training_effect_aerobic.toFixed(1)}` : null;
      const anaerobicTe = telemetry.training_effect_anaerobic ? `${telemetry.training_effect_anaerobic.toFixed(1)}` : null;

      const items = [];
      if (heartRate) items.push({ label: 'Pulsaciones (Med/Max)', value: heartRate });
      if (power) items.push({ label: 'Potencia', value: power });
      if (cadence) items.push({ label: 'Cadencia media', value: cadence });
      
      let teValue = '';
      if (aerobicTe || anaerobicTe) {
        teValue = `Aeróbico: ${aerobicTe || '--'} • Anaeróbico: ${anaerobicTe || '--'}`;
        items.push({ label: 'Efecto de Entreno (TE)', value: teValue });
      }

      if (items.length > 0) {
        advancedMetricsHtml = `
          <div style="margin-top: 24px; border-top: 1px solid #27272a; padding-top: 20px;">
            <p style="font-size: 12px; font-weight: 800; color: #a1a1aa; text-transform: uppercase; letter-spacing: 0.05em; margin: 0 0 12px 0;">Métricas de Dispositivo</p>
            <table cellpadding="0" cellspacing="0" width="100%" style="border-collapse: collapse;">
              ${items.map(item => `
                <tr style="border-bottom: 1px solid #222;">
                  <td style="padding: 8px 0; font-size: 13px; color: #71717a; width: 45%;">${item.label}</td>
                  <td style="padding: 8px 0; font-size: 13px; color: #ffffff; font-weight: 600; text-align: right;">${item.value}</td>
                </tr>
              `).join('')}
            </table>
          </div>
        `;
      }
    }

    // AI Coach Adjustment banner
    let adjustmentHtml = '';
    if (adjustmentMsg) {
      adjustmentHtml = `
        <div style="background-color: rgba(234, 179, 8, 0.05); border: 1px solid rgba(234, 179, 8, 0.3); border-radius: 16px; padding: 20px; margin-bottom: 24px;">
          <p style="font-size: 14px; font-weight: 700; color: #facc15; margin: 0 0 6px 0;">🤖 Ajuste del Entrenador IA</p>
          <p style="font-size: 13px; color: #e4e4e7; margin: 0; line-height: 1.5;">
            ${adjustmentMsg}
          </p>
        </div>
      `;
    }

    const host = process.env.VERCEL_URL || 'triatlon-app-mocha.vercel.app';
    const baseUrl = host.startsWith('localhost') ? `http://${host}` : `https://${host}`;

    const planName = profile.training_plans?.name || 'Ironman Elite Plan';

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Actividad Sincronizada: ${sportLabel}</title>
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
            background-color: ${badgeBg};
            border: 1px solid ${badgeBorder};
            color: ${themeColor};
            font-size: 10px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            padding: 4px 10px;
            border-radius: 9999px;
            margin-bottom: 16px;
          }
          h1 {
            font-size: 22px;
            font-weight: 800;
            color: #ffffff;
            margin-top: 0;
            margin-bottom: 8px;
            letter-spacing: -0.025em;
          }
          .subtitle {
            font-size: 14px;
            color: #a1a1aa;
            margin-top: 0;
            margin-bottom: 24px;
            line-height: 1.5;
          }
          .metrics-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 24px;
          }
          .metric-box {
            background-color: #27272a;
            border: 1px solid #3f3f46;
            border-radius: 16px;
            padding: 16px;
            text-align: center;
          }
          .metric-val {
            font-size: 18px;
            font-weight: 800;
            color: #ffffff;
            margin-bottom: 4px;
          }
          .metric-lbl {
            font-size: 11px;
            color: #a1a1aa;
            text-transform: uppercase;
            font-weight: 600;
          }
          .session-desc-box {
            background-color: #09090b;
            border: 1px solid #27272a;
            border-radius: 16px;
            padding: 16px;
            margin-bottom: 24px;
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
            <span class="badge">${sportEmoji} ${sportLabel}</span>
            <h1>¡Actividad registrada, ${profile.first_name || 'Triatleta'}!</h1>
            <p class="subtitle">
              Hemos procesado los datos de tu sesión con éxito a través de <strong>${deviceLabel}</strong>. ¡Cada entrenamiento cuenta en tu camino hacia la meta!
            </p>

            ${adjustmentHtml}

            <!-- Tabla de Métricas Principales -->
            <table class="metrics-table" cellpadding="0" cellspacing="0" width="100%">
              <tr>
                <td width="31%" style="padding-right: 8px;">
                  <div class="metric-box">
                    <div class="metric-val">${actualDuration} min</div>
                    <div class="metric-lbl">Duración</div>
                  </div>
                </td>
                <td width="38%" style="padding-right: 8px; padding-left: 8px;">
                  <div class="metric-box">
                    <div class="metric-val">${distanceHtml}</div>
                    <div class="metric-lbl">Distancia</div>
                  </div>
                </td>
                <td width="31%" style="padding-left: 8px;">
                  <div class="metric-box">
                    <div class="metric-val" style="color: ${finalActualTss > plannedTss + 10 ? '#ef4444' : '#10b981'}">
                      ${finalActualTss} <span style="font-size: 10px; font-weight: 400; color: #71717a;">/ ${plannedTss}</span>
                    </div>
                    <div class="metric-lbl">TSS</div>
                  </div>
                </td>
              </tr>
            </table>

            <!-- Descripción de Sesión Planificada -->
            <div class="session-desc-box">
              <p style="font-size: 11px; font-weight: 800; text-transform: uppercase; color: #71717a; margin: 0 0 6px 0; letter-spacing: 0.05em;">Sesión Planificada</p>
              <p style="font-size: 13px; color: #d4d4d8; margin: 0; line-height: 1.5; font-weight: 500;">
                ${session.description || 'Sesión programada en tu calendario.'}
              </p>
            </div>

            <!-- Métricas avanzadas de Telemetría -->
            ${advancedMetricsHtml}

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

    const sendResult = await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: toEmail,
      subject: `${sportEmoji} ¡Entrenamiento de ${sportLabel} registrado! TSS: ${finalActualTss}`,
      html: emailHtml,
    });

    console.log(`[Email Dispatcher] Correo enviado a ${toEmail} para el workout ${workoutId}. ID:`, sendResult.data?.id || 'error');

    return {
      success: !sendResult.error,
      email: toEmail,
      messageId: sendResult.data?.id || null,
      error: sendResult.error || null
    };

  } catch (error: any) {
    console.error('Email Dispatcher Exception:', error);
    return { error: error.message || 'Error enviando el correo' };
  }
}
