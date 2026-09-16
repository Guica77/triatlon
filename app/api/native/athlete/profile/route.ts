import { createClient } from '@/lib/supabase/server'

const reply = (body: object, status = 200) => Response.json(body, {
  status,
  headers: { 'Cache-Control': 'no-store', Vary: 'Cookie' },
})

export async function GET(request: Request) {
  const origin = request.headers.get('origin')
  if (request.headers.get('x-triwavex-native') !== '1' || (origin !== null && origin !== new URL(request.url).origin)) {
    return reply({ error: 'Solicitud no permitida' }, 403)
  }

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return reply({ error: 'Tu sesión ha caducado.' }, 401)

    const [{ data: profile, error: profileError }, { data: devices, error: devicesError }, { data: biometrics, error: biometricsError }] = await Promise.all([
      supabase.from('profiles').select('first_name,last_name,level,subscription_status,target_race_name,target_race_date,current_ftp,current_swim_pace,current_run_pace,baseline_training_hours,previous_injuries,strava_connected,garmin_connected').eq('id', user.id).maybeSingle(),
      supabase.from('user_connected_devices').select('provider').eq('user_id', user.id),
      supabase.from('user_biometrics').select('readiness_score,hrv,sleep_hours,fatigue_rating').eq('user_id', user.id).order('date', { ascending: false }).limit(1).maybeSingle(),
    ])

    if (profileError || devicesError || biometricsError) return reply({ error: 'No se ha podido cargar el perfil.' }, 503)
    if (!profile) return reply({ error: 'Perfil no disponible.' }, 404)

    const providers = new Set((devices || []).map(device => device.provider.toLowerCase()))
    return reply({
      athlete: {
        firstName: profile.first_name || 'Atleta', lastName: profile.last_name || null,
        level: profile.level || null, subscriptionStatus: profile.subscription_status || null,
      },
      goal: { name: profile.target_race_name || null, date: profile.target_race_date || null },
      physiology: { ftp: profile.current_ftp || null, swimPace: profile.current_swim_pace || null, runPace: profile.current_run_pace || null, baselineHours: profile.baseline_training_hours || null, injuries: profile.previous_injuries || null },
      recovery: biometrics ? { readiness: biometrics.readiness_score, hrv: biometrics.hrv, sleepHours: biometrics.sleep_hours, fatigue: biometrics.fatigue_rating } : null,
      connections: {
        strava: profile.strava_connected || providers.has('strava'),
        garmin: profile.garmin_connected || providers.has('garmin'),
        polar: providers.has('polar'),
        coros: providers.has('coros'),
        suunto: providers.has('suunto'),
        amazfit: providers.has('amazfit'),
      },
    })
  } catch {
    return reply({ error: 'Servicio no disponible.' }, 503)
  }
}
