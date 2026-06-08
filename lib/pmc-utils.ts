export interface PMCData {
  date: string;
  tss: number;
  ctl: number;
  atl: number;
  tsb: number;
}

/**
 * Calcula CTL, ATL y TSB basado en un histórico de TSS
 * Utiliza decaimiento exponencial (Exponentially Weighted Moving Average)
 */
export function calculatePMC(
  dailyTSS: { date: Date; tss: number }[],
  initialCtl = 0,
  initialAtl = 0
): PMCData[] {
  const ctlConstant = Math.exp(-1 / 42);
  const atlConstant = Math.exp(-1 / 7);

  let currentCtl = initialCtl;
  let currentAtl = initialAtl;
  let currentTsb = initialCtl - initialAtl;

  const results: PMCData[] = [];

  // Asegurarnos de que están ordenados por fecha
  const sortedData = [...dailyTSS].sort((a, b) => a.date.getTime() - b.date.getTime());

  for (const day of sortedData) {
    // TSB de hoy se basa en el CTL y ATL de ayer
    currentTsb = currentCtl - currentAtl;

    // Calcular CTL y ATL de hoy con el TSS de hoy
    currentCtl = currentCtl * ctlConstant + day.tss * (1 - ctlConstant);
    currentAtl = currentAtl * atlConstant + day.tss * (1 - atlConstant);

    results.push({
      date: day.date.toISOString(),
      tss: day.tss,
      ctl: currentCtl,
      atl: currentAtl,
      tsb: currentTsb,
    });
  }

  return results;
}

/**
 * Generador de datos simulados para mostrar el gráfico PMC
 * Simula meses de entrenamiento incremental seguido de un tapering
 */
export function generateMockPMCData(days = 150): PMCData[] {
  const data: { date: Date; tss: number }[] = [];
  const today = new Date();
  
  // Empezar X días atrás
  const startDate = new Date(today);
  startDate.setDate(today.getDate() - days);

  // Simulación:
  // Base period: incrementando TSS (media 50-70)
  // Build period: TSS más alto (media 70-100)
  // Taper: últimos 14 días TSS muy bajo (media 30)
  
  for (let i = 0; i < days; i++) {
    const currentDate = new Date(startDate);
    currentDate.setDate(startDate.getDate() + i);

    const daysUntilRace = days - i;
    
    let tss = 0;
    
    // Un día de descanso a la semana
    const isRestDay = currentDate.getDay() === 1; // Lunes descanso
    const isLongRunDay = currentDate.getDay() === 0; // Domingo largo

    if (isRestDay) {
      tss = 0;
    } else if (daysUntilRace <= 14) {
      // Tapering
      if (isLongRunDay) tss = 60 + Math.random() * 20;
      else tss = 30 + Math.random() * 20;
    } else if (daysUntilRace <= 45) {
      // Build (Pico de carga)
      if (isLongRunDay) tss = 150 + Math.random() * 40;
      else tss = 70 + Math.random() * 50;
    } else {
      // Base
      if (isLongRunDay) tss = 100 + Math.random() * 30;
      else tss = 50 + Math.random() * 30;
    }

    data.push({
      date: currentDate,
      tss: Math.round(tss)
    });
  }

  // Asumimos un nivel inicial base
  return calculatePMC(data, 30, 30);
}
