/**
 * Servicio de Clima (Weather Service)
 * Utilidad para obtener o simular condiciones climáticas para integrarlas con el cálculo nutricional.
 */

export interface WeatherConditions {
  temperature: 'frio' | 'templado' | 'calor' | 'extremo'
  clothing: 'ligera' | 'normal' | 'abrigada' | 'neopreno'
  description: string
  celsius: number
  humidity: number // percentage 0-100
}

/**
 * Obtiene la previsión del clima.
 * TODO: Integrar con una API real como OpenWeatherMap o WeatherAPI.
 * Actualmente retorna condiciones simuladas basadas en la fecha o simplemente un mock.
 */
export async function getForecastForLocation(
  lat?: number,
  lng?: number,
  date?: string
): Promise<WeatherConditions> {
  // Simulación: podríamos cambiar este estado para probar las notificaciones o la nutrición.
  // En este momento forzaremos 'calor' para ver su efecto en la hidratación y notificaciones.
  
  const currentMonth = new Date(date || new Date()).getMonth();
  
  // Lógica básica simulada por temporada en el hemisferio norte (para demostración)
  let celsius = 22;
  let humidity = 60;
  let temperature: 'frio' | 'templado' | 'calor' | 'extremo' = 'templado';
  let clothing: 'ligera' | 'normal' | 'abrigada' | 'neopreno' = 'normal';
  let description = 'Cielo despejado, temperatura agradable';

  if (currentMonth >= 5 && currentMonth <= 8) { // Junio a Septiembre
    celsius = 33;
    humidity = 85; // Simular alta humedad en verano
    temperature = 'calor';
    clothing = 'ligera';
    description = 'Día soleado y caluroso con alta humedad';
  } else if (currentMonth >= 11 || currentMonth <= 1) { // Diciembre a Febrero
    celsius = 8;
    humidity = 70;
    temperature = 'frio';
    clothing = 'abrigada';
    description = 'Día frío y nublado';
  }

  // Descomentar para forzar calor extremo para pruebas:
  // celsius = 38;
  // temperature = 'extremo';
  // clothing = 'ligera';
  // description = 'Alerta de ola de calor extremo';

  return {
    temperature,
    clothing,
    description,
    celsius,
    humidity
  }
}
