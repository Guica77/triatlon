import { createClient } from '@/lib/supabase/server';

export async function syncPhysiologyFromStrava(userId: string, accessToken: string) {
  const supabase = await createClient();

  try {
    // 1. Fetch detailed athlete profile to read FTP if set
    const athleteResponse = await fetch('https://www.strava.com/api/v3/athlete', {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    let stravaFtp: number | null = null;
    if (athleteResponse.ok) {
      const athleteData = await athleteResponse.json();
      if (athleteData.ftp) {
        stravaFtp = athleteData.ftp;
      }
    }

    // 2. Fetch last 15 activities to extract actual paces
    const activitiesResponse = await fetch('https://www.strava.com/api/v3/athlete/activities?per_page=15', {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    let runPaces: number[] = []; // seconds per km
    let swimPaces: number[] = []; // seconds per 100m
    let maxRidePower = 0;

    if (activitiesResponse.ok) {
      const activities = await activitiesResponse.json();
      if (Array.isArray(activities)) {
        for (const act of activities) {
          if (act.type === 'Run' && act.average_speed) {
            const paceSec = 1000 / act.average_speed;
            if (paceSec >= 150 && paceSec <= 600) {
              runPaces.push(paceSec);
            }
          } else if (act.type === 'Swim' && act.average_speed) {
            const paceSec = 100 / act.average_speed;
            if (paceSec >= 45 && paceSec <= 240) {
              swimPaces.push(paceSec);
            }
          } else if (act.type === 'Ride' && act.device_watts) {
            const watts = act.weighted_average_watts || act.average_watts;
            if (watts && watts > maxRidePower) {
              maxRidePower = watts;
            }
          }
        }
      }
    }

    // Calculate averages
    const avgRunSec = runPaces.length > 0 ? runPaces.reduce((a, b) => a + b, 0) / runPaces.length : null;
    const avgSwimSec = swimPaces.length > 0 ? swimPaces.reduce((a, b) => a + b, 0) / swimPaces.length : null;

    // Helper to format seconds into MM:SS
    const formatPace = (totalSeconds: number | null) => {
      if (!totalSeconds) return null;
      const mins = Math.floor(totalSeconds / 60);
      const secs = Math.round(totalSeconds % 60);
      return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const finalRunPace = formatPace(avgRunSec);
    const finalSwimPace = formatPace(avgSwimSec);
    const finalFtp = stravaFtp || (maxRidePower > 0 ? Math.round(maxRidePower * 0.95) : null);

    const updatePayload: any = {};
    if (finalFtp) updatePayload.current_ftp = finalFtp;
    if (finalSwimPace) updatePayload.current_swim_pace = finalSwimPace;
    if (finalRunPace) updatePayload.current_run_pace = finalRunPace;

    if (Object.keys(updatePayload).length > 0) {
      console.log('Syncing physiology metrics from Strava:', updatePayload);
      const { error } = await supabase
        .from('profiles')
        .update(updatePayload)
        .eq('id', userId);

      if (error) {
        console.error('Error updating profile with Strava physiology:', error);
      }
    }
  } catch (error) {
    console.error('Exception during Strava physiology sync:', error);
  }
}
