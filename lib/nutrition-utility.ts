/**
 * Utilidades matemáticas y fisiológicas puras para el cálculo de nutrición deportiva
 */

export interface DailyMacrosResult {
  bmr: number
  baseExpenditure: number
  activeExpenditure: number
  totalCalories: number
  carbs: { grams: number; calories: number; percentage: number; ratePerKg: number }
  protein: { grams: number; calories: number; percentage: number; ratePerKg: number }
  fat: { grams: number; calories: number; percentage: number; ratePerKg: number }
}

export interface SessionPacingResult {
  hourlyFluidMl: number
  totalFluidMl: number
  hourlySodiumMg: number
  totalSodiumMg: number
  hourlyCarbsG: number
  totalCarbsG: number
  practicalGuide: string
}

export interface DynamicNutritionData {
  bmr: number
  baseExpenditure: number
  activeExpenditure: number
  totalCalories: number
  weight: number
  macros: {
    carbs: { grams: number; calories: number; percentage: number; ratePerKg: number }
    protein: { grams: number; calories: number; percentage: number; ratePerKg: number }
    fat: { grams: number; calories: number; percentage: number; ratePerKg: number }
  }
  sessionsPacing: Array<{
    workoutId: string
    sportType: string
    durationMin: number
    hourlyFluidMl: number
    totalFluidMl: number
    hourlySodiumMg: number
    totalSodiumMg: number
    hourlyCarbsG: number
    totalCarbsG: number
    practicalGuide: string
  }>
}


/**
 * Calcula la tasa de sudoración en litros por hora (L/h)
 */
export function calculateSweatRate(
  weightBefore: number,
  weightAfter: number,
  fluidIntakeMl: number,
  durationMin: number
): number {
  if (weightBefore <= 0 || weightAfter <= 0 || durationMin <= 0) return 0.8 // fallback estándar

  const weightLossKg = weightBefore - weightAfter
  const fluidIntakeL = fluidIntakeMl / 1000
  const durationHours = durationMin / 60

  const rate = (weightLossKg + fluidIntakeL) / durationHours
  return parseFloat(Math.max(0.1, rate).toFixed(1))
}

/**
 * Calcula el Metabolismo Basal (BMR) simplificado (24 kcal por kg de peso corporal)
 */
export function calculateBmr(weight: number): number {
  return Math.round(24 * weight)
}

/**
 * Calcula las calorías quemadas en una sesión en base al MET, peso corporal y duración
 */
export function calculateWorkoutCalories(
  sportType: string,
  weight: number,
  durationMin: number
): number {
  const durationHours = durationMin / 60
  
  let met = 5
  if (sportType === 'natacion') met = 7
  else if (sportType === 'ciclismo') met = 8
  else if (sportType === 'carrera') met = 10
  else if (sportType === 'fuerza') met = 4
  else if (sportType === 'brick') met = 8

  return Math.round(met * weight * durationHours)
}

/**
 * Calcula los objetivos macro nutricionales diarios en gramos, calorías y porcentajes
 */
export function calculateDailyMacros(
  weight: number,
  totalWorkoutHours: number,
  hasStrengthSession: boolean,
  hasBrickSession: boolean,
  activeExpenditure: number
): DailyMacrosResult {
  const bmr = calculateBmr(weight)
  const baseExpenditure = Math.round(bmr * 1.2)
  let totalCalories = baseExpenditure + activeExpenditure

  // --- Carbohidratos ---
  let carbsRate = 4.0 // g/kg para días de descanso
  if (totalWorkoutHours > 2.0) carbsRate = 8.5
  else if (totalWorkoutHours > 1.0) carbsRate = 7.0
  else if (totalWorkoutHours > 0) carbsRate = 5.5

  const carbsGrams = Math.round(weight * carbsRate)
  const carbsCalories = carbsGrams * 4

  // --- Proteínas ---
  let proteinRate = 1.6 // g/kg base
  if (hasBrickSession || totalWorkoutHours > 2.5) proteinRate = 2.0
  else if (hasStrengthSession || totalWorkoutHours > 1.5) proteinRate = 1.8

  const proteinGrams = Math.round(weight * proteinRate)
  const proteinCalories = proteinGrams * 4

  // --- Grasas (Lípidos) ---
  let fatCalories = totalCalories - (carbsCalories + proteinCalories)
  let fatGrams = Math.round(fatCalories / 9)

  const minFatGrams = Math.round(weight * 1.0)
  if (fatGrams < minFatGrams) {
    fatGrams = minFatGrams
    fatCalories = fatGrams * 9
    totalCalories = carbsCalories + proteinCalories + fatCalories
  }

  // Porcentajes
  const totalMacronutrientKcal = carbsCalories + proteinCalories + fatCalories
  const carbsPercentage = Math.round((carbsCalories / totalMacronutrientKcal) * 100)
  const proteinPercentage = Math.round((proteinCalories / totalMacronutrientKcal) * 100)
  const fatPercentage = Math.round((fatCalories / totalMacronutrientKcal) * 100)

  return {
    bmr,
    baseExpenditure,
    activeExpenditure,
    totalCalories,
    carbs: { grams: carbsGrams, calories: carbsCalories, percentage: carbsPercentage, ratePerKg: carbsRate },
    protein: { grams: proteinGrams, calories: proteinCalories, percentage: proteinPercentage, ratePerKg: proteinRate },
    fat: { grams: fatGrams, calories: fatCalories, percentage: fatPercentage, ratePerKg: parseFloat((fatGrams / weight).toFixed(1)) }
  }
}

/**
 * Calcula la estrategia de hidratación y carbohidratos intra-entrenamiento
 */
export function calculateSessionPacing(
  sportType: string,
  durationMin: number,
  sweatRate: number,
  customCarbsPerHour?: number | null
): SessionPacingResult {
  const durationHours = durationMin / 60
  
  // Hidratación recomendada (reponemos el 65% de la tasa de sudoración para evitar saturar el estómago)
  const hourlyFluidMl = Math.round((sweatRate * 0.65) * 1000)
  const totalFluidMl = Math.round(hourlyFluidMl * durationHours)

  // Sodio (700 mg de sodio por Litro de agua)
  const hourlySodiumMg = Math.round(hourlyFluidMl * 0.7)
  const totalSodiumMg = Math.round(hourlySodiumMg * durationHours)

  // Carbohidratos (g / hora)
  let hourlyCarbsG = 0
  if (customCarbsPerHour) {
    hourlyCarbsG = customCarbsPerHour
  } else {
    if (sportType === 'ciclismo') {
      if (durationMin >= 150) hourlyCarbsG = 75
      else if (durationMin >= 90) hourlyCarbsG = 60
      else if (durationMin >= 45) hourlyCarbsG = 45
    } else if (sportType === 'carrera') {
      if (durationMin >= 120) hourlyCarbsG = 60
      else if (durationMin >= 75) hourlyCarbsG = 45
      else if (durationMin >= 40) hourlyCarbsG = 30
    } else if (sportType === 'brick') {
      hourlyCarbsG = durationMin >= 120 ? 75 : 60
    } else if (sportType === 'natacion' || sportType === 'fuerza') {
      hourlyCarbsG = durationMin >= 90 ? 30 : 0
    }
  }

  const totalCarbsG = Math.round(hourlyCarbsG * durationHours)

  // Guía Práctica de Alimentos/Suplementos
  let practicalGuide = 'Hidrátate bien antes de empezar. No requiere suplementación intra-entreno.'
  if (totalCarbsG > 0) {
    if (sportType === 'ciclismo' || sportType === 'brick') {
      const totalGels = Math.ceil(totalCarbsG / 30)
      practicalGuide = `Prepara 1 bidón de 750ml con sales (${Math.round(totalCarbsG * 0.4)}g HC) y lleva ${Math.max(1, totalGels - 1)} geles de carbohidratos (${Math.round(totalCarbsG * 0.6)}g HC) para ir dosificando.`
    } else if (sportType === 'carrera') {
      const totalGels = Math.round(totalCarbsG / 30)
      practicalGuide = `Lleva cinturón de geles. Toma 1 gel energético con agua cada 30-40 minutos de carrera (${totalGels} geles en total).`
    } else {
      practicalGuide = `Lleva un bidón con isotónico ligero o un gel energético para mitad de la sesión.`
    }
  }

  return {
    hourlyFluidMl,
    totalFluidMl,
    hourlySodiumMg,
    totalSodiumMg,
    hourlyCarbsG,
    totalCarbsG,
    practicalGuide
  }
}

/**
 * Genera una sugerencia de plato de recuperación post-entrenamiento en base a las preferencias y la duración de la sesión
 */
export function calculateRecoveryMeal(
  sportType: string,
  durationMin: number,
  preferredIngredients: string[] | null
): { mealName: string; macronutrientFocus: string; recipeDescription: string } {
  if (sportType === 'descanso') {
    return {
      mealName: 'Comida ligera base',
      macronutrientFocus: 'Proteína moderada & Grasas saludables',
      recipeDescription: 'Día de descanso. Mantén una ingesta moderada de carbohidratos. Elige verduras frescas con proteínas limpias.'
    }
  }

  // Ingredientes seleccionados (con fallbacks si no hay ninguno)
  const ingredients = preferredIngredients && preferredIngredients.length > 0
    ? preferredIngredients
    : ['arroz', 'pollo', 'aguacate']; // fallbacks estándar

  // Determinar foco según deporte y duración
  const isHighCarbs = durationMin >= 60;
  
  // Buscar qué ingredientes preferidos encajan
  const carbSelection = ingredients.find(i => ['pasta', 'arroz', 'patata', 'avena', 'platano'].includes(i)) || 'arroz';
  const proteinSelection = ingredients.find(i => ['pollo', 'salmon', 'tofu', 'huevo'].includes(i)) || 'pollo';
  const fatSelection = ingredients.find(i => ['aguacate'].includes(i)) || 'aguacate';

  // Mapear ID de ingredientes a etiquetas legibles en español
  const ingredientLabels: Record<string, string> = {
    pasta: 'Pasta integral',
    arroz: 'Arroz basmati',
    patata: 'Patatas asadas',
    avena: 'Porridge de avena',
    platano: 'Plátano',
    pollo: 'Pechuga de pollo',
    salmon: 'Filete de salmón',
    tofu: 'Tofu salteado',
    huevo: 'Huevos revueltos',
    aguacate: 'Aguacate'
  };

  const carbLabel = ingredientLabels[carbSelection];
  const proteinLabel = ingredientLabels[proteinSelection];
  const fatLabel = ingredientLabels[fatSelection];

  let mealName = '';
  let recipeDescription = '';
  let macronutrientFocus = '';

  if (isHighCarbs) {
    macronutrientFocus = 'Alta carga de Carbohidratos (Glucógeno) + Proteína de rápida asimilación';
    mealName = `Bowl de Recuperación: ${carbLabel} con ${proteinLabel}`;
    recipeDescription = `Ideal para reponer reservas después de ${durationMin} min de ${sportType}. Prepara un plato con 120g de ${carbLabel}, 150g de ${proteinLabel} y añade rodajas de ${fatLabel} para un aporte graso antiinflamatorio.`;
  } else {
    macronutrientFocus = 'Proteína limpia para reparación de fibras + Grasas saludables';
    mealName = `Plato de Regeneración: ${proteinLabel} y ${fatLabel}`;
    recipeDescription = `Enfoque en recuperación muscular estructural. Prepara 180g de ${proteinLabel} acompañado de medio ${fatLabel} con ensalada verde, reduciendo los carbohidratos al ser una sesión más corta.`;
  }

  return {
    mealName,
    macronutrientFocus,
    recipeDescription
  };
}

