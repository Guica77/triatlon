import { GarminConnect } from 'garmin-connect';

export async function fetchGarminData(email: string, password: string, userId: string) {
  try {
    const gcClient = new GarminConnect({ username: email, password });
    await gcClient.login();

    const today = new Date();
    // Convert to YYYY-MM-DD
    const dateStr = today.toISOString().split('T')[0];

    // Fetch Sleep Data
    const sleep = await gcClient.getSleepData(today).catch(() => ({}));

    // Fetch Stats (usersummary-service)
    let stats: any = {};
    try {
      // The API endpoint used in python is usersummary-service/usersummary/daily/{username}?calendarDate={date}
      // garmin-connect has getSteps and other helpers, but let's fetch the summary directly if we can
      // We can also fetch the social profile to get the display name
      const profile = await gcClient.getUserProfile();
      const displayName = profile.displayName || profile.userName;
      if (displayName) {
        stats = await gcClient.get(`/usersummary-service/usersummary/daily/${displayName}?calendarDate=${dateStr}`).catch(() => ({} as any));
      }
    } catch (e) {
      console.warn("Could not fetch Garmin user summary stats", e);
    }

    // Fetch HRV
    let hrvData: any = {};
    try {
      hrvData = await gcClient.get(`/hrv-service/hrv/daily/${dateStr}`).catch(() => ({} as any));
    } catch (e) {
      console.warn("Could not fetch Garmin HRV", e);
    }

    // Fetch Training Status
    let trainingStatus: any = {};
    try {
      trainingStatus = await gcClient.get(`/metrics-service/metrics/trainingstatus/daily/${dateStr}`).catch(() => ({} as any));
    } catch (e) {
      console.warn("Could not fetch Garmin Training Status", e);
    }

    // Parse sleep score
    let sleepScore = null;
    let sleepSeconds = null;
    
    if (sleep && (sleep as any).dailySleepDTO) {
      const dto = (sleep as any).dailySleepDTO;
      sleepSeconds = dto.sleepTimeSeconds;
      
      if (dto.sleepScores && typeof dto.sleepScores === 'object') {
        sleepScore = dto.sleepScores.overall?.value;
      } else if (dto.sleepScore && typeof dto.sleepScore === 'object') {
        sleepScore = dto.sleepScore.value;
      } else if (dto.sleepScore) {
        sleepScore = dto.sleepScore;
      }
    } else {
      sleepScore = (sleep as any)?.sleepScore;
      sleepSeconds = (sleep as any)?.sleepTimeSeconds;
    }

    // Parse RHR
    const rhr = (stats as any).restingHeartRate || (stats as any).minHeartRate;

    const result = {
      date: dateStr,
      resting_hr: rhr,
      body_battery: (stats as any).bodyBatteryHighestValue || (stats as any).bodyBatteryHighest,
      stress: (stats as any).averageStressLevel,
      sleep_score: sleepScore,
      sleep_duration_hours: sleepSeconds ? sleepSeconds / 3600 : null,
      raw_garmin_data: {
        stats,
        sleep,
        hrv: hrvData,
        training_status: trainingStatus
      }
    };

    return { success: true, data: result };

  } catch (error: any) {
    console.error('Error fetching Garmin data natively:', error);
    return { error: error.message || 'Error de autenticación o conexión con Garmin.' };
  }
}
