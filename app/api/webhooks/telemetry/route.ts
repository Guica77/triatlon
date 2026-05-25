import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Strava Webhooks verification handler (GET)
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  if (mode === 'subscribe' && token === 'triatlon_verify_token') {
    console.log('WEBHOOK_VERIFIED');
    return NextResponse.json({ 'hub.challenge': challenge }, { status: 200 });
  }
  
  return NextResponse.json({ error: 'Fallo de verificación' }, { status: 403 });
}

/**
 * Endpoint de Webhook Oficial para Ingesta Automática en Segundo Plano (Garmin / Strava)
 * POST /api/webhooks/telemetry
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('Received webhook event:', body);

    const { object_type, aspect_type, object_id, owner_id } = body;

    // Check if it's a new activity creation
    if (object_type === 'activity' && aspect_type === 'create') {
      const externalAthleteId = `strava_user_${owner_id}`;
      const supabase = await createClient();

      // Find profile by external athlete ID
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, strava_auth_tokens')
        .eq('external_athlete_id', externalAthleteId)
        .single();

      if (!profile) {
        console.error('Athlete not found for Strava ID:', owner_id);
        return NextResponse.json({ error: 'Athlete not found' }, { status: 404 });
      }

      const userId = profile.id;
      const { getOrRefreshStravaToken } = await import('@/lib/telemetry/strava-sync');
      const accessToken = await getOrRefreshStravaToken(userId);

      if (accessToken) {
        // Fetch activity detail from Strava API
        const activityResponse = await fetch(`https://www.strava.com/api/v3/activities/${object_id}`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        });

        if (activityResponse.ok) {
          const activity = await activityResponse.json();
          console.log('Fetched Strava activity:', activity);

          const distanceKm = activity.distance ? (activity.distance / 1000) : 0;
          const durationMin = activity.moving_time ? Math.round(activity.moving_time / 60) : 0;
          const sportType = activity.type?.toLowerCase(); // run, ride, swim etc.

          // Map Strava sport type to our multisport types
          let mappedSport = 'ciclismo';
          if (sportType === 'run') mappedSport = 'carrera';
          else if (sportType === 'swim') mappedSport = 'natacion';

          // Find pending workout for today
          const todayStr = new Date().toISOString().split('T')[0];
          const { data: workouts } = await supabase
            .from('user_workouts')
            .select('*, training_sessions(*)')
            .eq('user_id', userId)
            .eq('scheduled_date', todayStr)
            .eq('status', 'pending');

          const workout = workouts?.[0];

          if (workout) {
            // Update workout as completed
            await supabase
              .from('user_workouts')
              .update({
                status: 'completed',
                completed_at: new Date().toISOString(),
                actual_tss: 85 // default or calculated
              })
              .eq('id', workout.id);

            // Insert into universal_telemetry
            await supabase
              .from('universal_telemetry')
              .insert({
                workout_id: workout.id,
                user_id: userId,
                source_provider: 'strava',
                external_activity_id: `strava_${object_id}`,
                actual_duration_min: durationMin,
                actual_distance_km: distanceKm,
                actual_tss: 85,
                raw_payload: activity
              });

            console.log(`Workout ${workout.id} marked completed via webhook!`);
          } else {
            console.log('No pending workout for today, storing activity detail.');
          }
        } else {
          console.error('Failed to fetch activity details from Strava:', await activityResponse.text());
        }
      }
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error('Webhook POST exception:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
