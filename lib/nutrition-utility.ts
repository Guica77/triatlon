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
  activeExpenditure: number,
  dailySteps?: number | null
): DailyMacrosResult {
  const bmr = calculateBmr(weight)
  const baseExpenditure = Math.round(bmr * 1.2)
  
  // Calcular gasto extra por NEAT (Pasos)
  // Aproximadamente 40 kcal por cada 1000 pasos por encima de la base (asumiendo 5000 como base del factor 1.2)
  let stepsExpenditure = 0;
  if (dailySteps && dailySteps > 5000) {
    stepsExpenditure = Math.round(((dailySteps - 5000) / 1000) * 40);
  }

  let totalCalories = baseExpenditure + activeExpenditure + stepsExpenditure

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
  customCarbsPerHour?: number | null,
  options?: {
    temperature?: 'frio' | 'templado' | 'calor' | 'extremo'
    clothing?: 'ligera' | 'normal' | 'abrigada' | 'neopreno'
    humidity?: number // 0-100 percentage
  }
): SessionPacingResult {
  const durationHours = durationMin / 60
  
  // 1. Factores de ajuste por clima y equipación
  let tempMultiplier = 1.0
  let tempCarbMultiplier = 1.0
  if (options?.temperature === 'frio') {
    tempMultiplier = 0.8
  } else if (options?.temperature === 'calor') {
    tempMultiplier = 1.25 // Aumento de 25% en sudoración
    tempCarbMultiplier = 1.10 // Aumento de 10% en necesidad de carbohidratos
  } else if (options?.temperature === 'extremo') {
    tempMultiplier = 1.45 // Aumento de 45% en sudoración
    tempCarbMultiplier = 1.20 // Aumento de 20% en necesidad de carbohidratos
  }

  let clothingMultiplier = 1.0
  if (options?.clothing === 'ligera') {
    clothingMultiplier = 0.95
  } else if (options?.clothing === 'abrigada') {
    clothingMultiplier = 1.18 // Ropa abrigada calienta y aumenta la sudoración
  } else if (options?.clothing === 'neopreno') {
    if (sportType === 'natacion' || sportType === 'brick') {
      clothingMultiplier = 1.12 // El neopreno en natación retiene calor
    }
  }

  // Factor de humedad: Si la humedad es muy alta (>75%), el sudor no evapora bien y el cuerpo
  // suda más para intentar enfriarse sin éxito. Aumentamos hidratación un 15% extra.
  let humidityMultiplier = 1.0;
  if (options?.humidity && options.humidity > 75) {
    humidityMultiplier = 1.15;
  }

  // Tasa de sudoración ajustada
  const adjustedSweatRate = sweatRate * tempMultiplier * clothingMultiplier * humidityMultiplier

  // Hidratación recomendada (reponemos el 65% de la tasa de sudoración para evitar saturar el estómago)
  const hourlyFluidMl = Math.round((adjustedSweatRate * 0.65) * 1000)
  const totalFluidMl = Math.round(hourlyFluidMl * durationHours)

  // Sodio (700 mg de sodio por Litro de agua)
  const hourlySodiumMg = Math.round(hourlyFluidMl * 0.7)
  const totalSodiumMg = Math.round(hourlySodiumMg * durationHours)

  // Carbohidratos (g / hora)
  let hourlyCarbsG = 0
  if (customCarbsPerHour) {
    hourlyCarbsG = customCarbsPerHour
  } else {
    // Si la duración no encaja exactamente, añadimos pasos intermedios para un escalado más suave
    if (sportType === 'ciclismo') {
      if (durationMin >= 150) hourlyCarbsG = 75
      else if (durationMin >= 120) hourlyCarbsG = 68
      else if (durationMin >= 90) hourlyCarbsG = 60
      else if (durationMin >= 65) hourlyCarbsG = 52
      else if (durationMin >= 45) hourlyCarbsG = 45
    } else if (sportType === 'carrera') {
      if (durationMin >= 120) hourlyCarbsG = 60
      else if (durationMin >= 95) hourlyCarbsG = 52
      else if (durationMin >= 75) hourlyCarbsG = 45
      else if (durationMin >= 55) hourlyCarbsG = 38
      else if (durationMin >= 40) hourlyCarbsG = 30
    } else if (sportType === 'brick') {
      if (durationMin >= 120) hourlyCarbsG = 75
      else if (durationMin >= 80) hourlyCarbsG = 65
      else hourlyCarbsG = 60
    } else if (sportType === 'natacion' || sportType === 'fuerza') {
      hourlyCarbsG = durationMin >= 90 ? 30 : 0
    }
  }

  // Aplicar ajuste de carbohidratos por temperatura (más consumo de glucógeno con calor)
  hourlyCarbsG = Math.round(hourlyCarbsG * tempCarbMultiplier)
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

  // Si hay calor o calor extremo, añadir advertencia/pauta sobre electrolitos
  if (options?.temperature === 'calor' || options?.temperature === 'extremo') {
    practicalGuide += ` ⚠️ ALERTA CLIMA: Por la temperatura elevada, prioriza el consumo de sales minerales (sodio) y no te saltes ninguna toma de líquido para prevenir la deshidratación.`
  }
  
  if (options?.humidity && options.humidity > 75) {
    practicalGuide += ` 💧 ALERTA HUMEDAD (${options.humidity}%): La alta humedad impide que el sudor te enfríe bien. Tu necesidad de agua ha aumentado. ¡Bebe más a menudo!`
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

/**
 * Genera una sugerencia de comida pre-entrenamiento en base a las preferencias y la sesión
 */
export function calculatePreWorkoutMeal(
  sportType: string,
  durationMin: number,
  preferredIngredients: string[] | null
): { mealName: string; macronutrientFocus: string; recipeDescription: string } {
  if (sportType === 'descanso') {
    return {
      mealName: 'Desayuno/Comida equilibrada base',
      macronutrientFocus: 'Macronutrientes equilibrados',
      recipeDescription: 'Día de descanso. Mantén tu pauta habitual rica en fibra y grasas saludables sin necesidad de cargas rápidas de energía.'
    };
  }

  // Ingredientes seleccionados (con fallbacks si no hay ninguno)
  const ingredients = preferredIngredients && preferredIngredients.length > 0
    ? preferredIngredients
    : ['avena', 'platano']; // fallbacks estándar de pre-entreno

  // Buscar carbohidratos de asimilación rápida/media
  const quickCarb = ingredients.find(i => ['platano', 'avena', 'arroz', 'pasta', 'patata'].includes(i)) || 'platano';

  const ingredientLabels: Record<string, string> = {
    pasta: 'Pasta blanca con un toque de aceite',
    arroz: 'Arroz blanco ligero',
    patata: 'Patata cocida blanda',
    avena: 'Porridge de avena templada',
    platano: 'Plátano maduro con miel'
  };

  const carbLabel = ingredientLabels[quickCarb] || 'Plátano maduro con miel';

  let mealName = '';
  let recipeDescription = '';
  let macronutrientFocus = '';

  if (sportType === 'carrera' || sportType === 'brick') {
    macronutrientFocus = 'Carbohidratos de asimilación rápida (Cero molestias gástricas / Flato)';
    mealName = `Carga Pre-Carrera: ${carbLabel}`;
    recipeDescription = `Para salir a correr y evitar flato o pesadez estomacal: Consumir 60-90 minutos antes del entrenamiento. Toma 1 porción de ${carbLabel}. Evita totalmente lácteos, grasas, proteínas pesadas y exceso de fibra en esta ventana previa.`;
  } else {
    macronutrientFocus = 'Energía sostenida (Carbohidratos de fácil digestión)';
    mealName = `Combustible Pre-Entreno: ${carbLabel}`;
    recipeDescription = `Consumir 90-120 minutos antes de comenzar la sesión de ${sportType === 'ciclismo' ? 'bici' : sportType}. Prepara una porción de ${carbLabel} para saturar tus depósitos de glucógeno y evitar pájaras durante tu sesión de ${durationMin} min.`;
  }

  return {
    mealName,
    macronutrientFocus,
    recipeDescription
  };
}

/**
 * Genera una receta/plato completamente alternativo, asegurando evitar ingredientes no deseados
 * y rotando los ingredientes preferidos para dar variedad.
 */
export function generateAlternativeMeal(
  sportType: string,
  durationMin: number,
  preferredIngredients: string[] | null,
  dislikedIngredients: string[] | null,
  isPostWorkout: boolean = true
): { mealName: string; macronutrientFocus: string; recipeDescription: string } {
  const prefs = preferredIngredients || [];
  const dislikes = dislikedIngredients || [];

  // Mapear ID de ingredientes a etiquetas legibles en español
  const ingredientLabels: Record<string, string> = {
    pasta: 'Pasta',
    arroz: 'Arroz',
    patata: 'Patata',
    boniato: 'Boniato',
    quinoa: 'Quinoa',
    avena: 'Avena',
    platano: 'Plátano',
    pollo: 'Pollo',
    pavo: 'Pavo',
    ternera: 'Ternera magra',
    pescado_blanco: 'Pescado blanco',
    salmon: 'Salmón',
    atun: 'Atún',
    tofu: 'Tofu',
    soja: 'Soja texturizada',
    huevo: 'Huevo',
    aguacate: 'Aguacate',
    frutos_secos: 'Frutos secos',
    aceite_oliva: 'Aceite de Oliva Extra Virgen',
    queso: 'Queso fresco',
    yogur: 'Yogur natural',
    lentejas: 'Lentejas',
    garbanzos: 'Garbanzos'
  };

  // Categorías base (ampliadas para más variedad)
  const allCarbs = ['pasta', 'arroz', 'patata', 'boniato', 'quinoa', 'avena', 'platano', 'lentejas', 'garbanzos'];
  const allProteins = ['pollo', 'pavo', 'ternera', 'pescado_blanco', 'salmon', 'atun', 'tofu', 'soja', 'huevo'];
  const allFats = ['aguacate', 'frutos_secos', 'aceite_oliva', 'queso'];

  // Función para elegir un ingrediente que NO esté en dislikes. 
  // Prioriza los que están en prefs, si no, uno aleatorio.
  const pickIngredient = (categoryList: string[], currentPrefs: string[], currentDislikes: string[]) => {
    const safeOptions = categoryList.filter(i => !currentDislikes.includes(i));
    if (safeOptions.length === 0) return categoryList[0]; // Fallback extremo
    
    // Buscar en preferencias primero
    const preferredSafe = safeOptions.filter(i => currentPrefs.includes(i));
    if (preferredSafe.length > 0) {
      // Devolver uno aleatorio de los preferidos para dar variedad
      return preferredSafe[Math.floor(Math.random() * preferredSafe.length)];
    }
    
    // Si no hay preferidos seguros, devolver uno aleatorio de los seguros
    return safeOptions[Math.floor(Math.random() * safeOptions.length)];
  };

  const isHighCarbs = durationMin >= 60;
  
  // En post-entreno priorizamos reparación. En pre-entreno, digestión fácil (menos grasa/fibra).
  
  // Elegimos ingredientes
  let carbSelection = pickIngredient(allCarbs, prefs, dislikes);
  let proteinSelection = pickIngredient(allProteins, prefs, dislikes);
  let fatSelection = pickIngredient(allFats, prefs, dislikes);

  // Si es pre-entreno y eligió legumbres (lentejas/garbanzos), forzamos un cambio por digestión
  if (!isPostWorkout && ['lentejas', 'garbanzos'].includes(carbSelection)) {
    const easyCarbs = ['arroz', 'pasta', 'patata', 'avena', 'platano'];
    carbSelection = pickIngredient(easyCarbs, prefs, dislikes);
  }

  const carbLabel = ingredientLabels[carbSelection] || carbSelection;
  const proteinLabel = ingredientLabels[proteinSelection] || proteinSelection;
  const fatLabel = ingredientLabels[fatSelection] || fatSelection;

  let mealName = '';
  let recipeDescription = '';
  let macronutrientFocus = '';

  if (isPostWorkout) {
    if (isHighCarbs) {
      macronutrientFocus = 'Reposición de Glucógeno + Síntesis Proteica';
      mealName = `Bowl Alternativo: ${proteinLabel} al estilo ${carbLabel}`;
      recipeDescription = `Hemos evitado tus ingredientes no deseados. Disfruta de un bowl nutritivo con una base abundante de ${carbLabel} (120g en crudo), acompañado de ${proteinLabel} (150-180g) a la plancha o al horno. Añade un toque de ${fatLabel} para aportar ácidos grasos esenciales y reducir la inflamación tras tus ${durationMin} min de ${sportType}.`;
    } else {
      macronutrientFocus = 'Estructural: Proteína limpia + Grasas saludables (Bajo CHO)';
      mealName = `Plato Ligero de Recuperación: ${proteinLabel} y ${fatLabel}`;
      recipeDescription = `Dado que la sesión ha sido más corta, limitamos los carbohidratos. Toma 180-200g de ${proteinLabel} cocinado de forma ligera, servido con una porción generosa de verduras de temporada y ${fatLabel}. Perfecto para una recuperación muscular óptima sin excesos calóricos.`;
    }
  } else {
    // Pre-workout
    macronutrientFocus = 'Energía de rápida/media asimilación (Fácil Digestión)';
    mealName = `Carga Alternativa Pre-Entreno: ${carbLabel}`;
    recipeDescription = `Adaptado a tus gustos y evitando lo que no toleras. Para rendir en tu sesión de ${sportType}, prepara una ración moderada de ${carbLabel} unas 2 horas antes de empezar. Puedes acompañarlo con un poco de ${proteinLabel} muy limpio si tienes hambre, pero evita el exceso de ${fatLabel} ahora para no retrasar el vaciado gástrico.`;
  }

  return {
    mealName,
    macronutrientFocus,
    recipeDescription
  };
}
