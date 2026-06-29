/**
 * Servicio de Clima (Weather Service)
 * Utilidad para obtener condiciones climáticas reales usando Open-Meteo API.
 */

export interface WeatherConditions {
  temperature: 'frio' | 'templado' | 'calor' | 'extremo'
  clothing: 'ligera' | 'normal' | 'abrigada' | 'neopreno'
  description: string
  celsius: number
  humidity: number // percentage 0-100
}

/**
 * Obtiene la previsión del clima desde Open-Meteo (API gratuita, sin API key).
 * Si no se proporcionan coordenadas, usa Madrid como fallback.
 */
export async function getForecastForLocation(
  lat?: number,
  lng?: number,
  date?: string
): Promise<WeatherConditions> {
  // Fallback to Madrid if no coordinates provided
  const useLat = lat ?? 40.4168;
  const useLng = lng ?? -3.7038;

  try {
    const res = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${useLat}&longitude=${useLng}&current=temperature_2m,relative_humidity_2m&timezone=auto`,
      { next: { revalidate: 1800 } } // Cache for 30 minutes
    );

    if (res.ok) {
      const data = await res.json();
      const celsius = data.current.temperature_2m as number;
      const humidity = data.current.relative_humidity_2m as number;

      let temperature: WeatherConditions['temperature'] = 'templado';
      let clothing: WeatherConditions['clothing'] = 'normal';
      let description = 'Cielo despejado, temperatura agradable';

      if (celsius < 10) {
        temperature = 'frio';
        clothing = 'abrigada';
        description = 'Día frío y nublado';
      } else if (celsius > 28 && celsius <= 35) {
        temperature = 'calor';
        clothing = 'ligera';
        description = 'Día soleado y caluroso';
      } else if (celsius > 35) {
        temperature = 'extremo';
        clothing = 'ligera';
        description = 'Alerta de ola de calor extremo';
      }

      return { temperature, clothing, description, celsius, humidity };
    }
  } catch (err) {
    console.error('[WeatherService] Error fetching from Open-Meteo:', err);
  }

  // Fallback: use seasonal estimation based on month (hemisphere norte)
  const currentMonth = new Date(date || new Date()).getMonth();

  let celsius = 22;
  let humidity = 60;
  let temperature: WeatherConditions['temperature'] = 'templado';
  let clothing: WeatherConditions['clothing'] = 'normal';
  let description = 'Cielo despejado, temperatura agradable';

  if (currentMonth >= 5 && currentMonth <= 8) {
    celsius = 33;
    humidity = 60;
    temperature = 'calor';
    clothing = 'ligera';
    description = 'Día soleado y caluroso';
  } else if (currentMonth >= 11 || currentMonth <= 1) {
    celsius = 8;
    humidity = 70;
    temperature = 'frio';
    clothing = 'abrigada';
    description = 'Día frío y nublado';
  }

  return { temperature, clothing, description, celsius, humidity };
}
