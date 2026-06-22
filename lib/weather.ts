export interface WeatherData {
  temperature: number; // Celsius
  humidity: number; // Percentage
  condition: 'frio' | 'templado' | 'calor' | 'extremo';
}

export async function getCurrentWeather(lat: number, lon: number): Promise<WeatherData | null> {
  try {
    // Using Open-Meteo free API (no key required)
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m&timezone=auto`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Weather API error: ${response.statusText}`);
    }

    const data = await response.json();
    const temp = data.current.temperature_2m;
    const hum = data.current.relative_humidity_2m;

    let condition: WeatherData['condition'] = 'templado';
    if (temp < 10) condition = 'frio';
    else if (temp > 28 && temp <= 35) condition = 'calor';
    else if (temp > 35) condition = 'extremo';

    return {
      temperature: temp,
      humidity: hum,
      condition
    };
  } catch (error) {
    console.error('Error fetching weather:', error);
    return null;
  }
}
