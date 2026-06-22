'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import {
  calculateSweatRate,
  calculateDailyMacros,
  calculateSessionPacing,
  calculateWorkoutCalories,
  generateAlternativeMeal,
  DynamicNutritionData
} from '@/lib/nutrition-utility'
import { getForecastForLocation } from '@/lib/weather-service'

export interface SweatTestData {
  weightBefore: number
  weightAfter: number
  fluidIntake: number // in ml
  durationMin: number
}

/**
 * Guarda los resultados del test de sudoración y calcula la tasa de sudoración (L/h)
 */
export async function saveSweatTest(data: SweatTestData): Promise<{ success?: boolean; error?: string; sweatRate?: number }> {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect('/login')
  }

  const { weightBefore, weightAfter, fluidIntake, durationMin } = data

  if (weightBefore <= 0 || weightAfter <= 0 || durationMin <= 0) {
    return { error: 'Valores del test inválidos. Los pesos y la duración deben ser mayores que cero.' }
  }

  try {
    const sweatRate = calculateSweatRate(weightBefore, weightAfter, fluidIntake, durationMin)

    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        sweat_rate: sweatRate,
        sweat_test_weight_before: weightBefore,
        sweat_test_weight_after: weightAfter,
        sweat_test_fluid_intake: fluidIntake,
        sweat_test_duration_min: durationMin
      })
      .eq('id', user.id)

    if (updateError) {
      console.error('Error al guardar el test de sudoración:', updateError)
      return { error: updateError.message }
    }

    revalidatePath('/dashboard')
    revalidatePath('/settings')
    return { success: true, sweatRate }
  } catch (err: any) {
    console.error('Excepción en saveSweatTest:', err)
    return { error: err.message || 'Error interno al guardar el test.' }
  }
}

/**
 * Calcula las calorías, macros del día y la estrategia de pacing del entrenamiento
 * basado en la carga programada para la fecha y el perfil biométrico del usuario
 */
export async function getDailyNutrition(dateString: string): Promise<{ data?: DynamicNutritionData; error?: string }> {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect('/login')
  }

  try {
    // 1. Obtener perfil del atleta
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('sweat_rate, custom_carbs_per_hour')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return { error: 'No se pudo cargar el perfil del atleta.' }
    }

    // 2. Obtener peso y pasos del atleta para el día (de biometrics) o el más reciente
    const { data: latestBiometrics } = await supabase
      .from('user_biometrics')
      .select('weight, daily_steps')
      .eq('user_id', user.id)
      .order('date', { ascending: false })
      .limit(1)

    // Si no hay registro previo, usamos 72.0 kg por defecto
    const weight = Number(latestBiometrics?.[0]?.weight || 72.0)
    const dailySteps = latestBiometrics?.[0]?.daily_steps || 0

    // 3. Obtener entrenamientos del día
    const { data: workouts, error: workoutsError } = await supabase
      .from('user_workouts')
      .select('id, status, training_sessions(sport_type, duration_min, description)')
      .eq('user_id', user.id)
      .eq('scheduled_date', dateString)

    if (workoutsError) {
      console.error('Error al cargar entrenamientos para la nutrición:', workoutsError)
      return { error: 'Error al cargar los entrenamientos diarios.' }
    }

    // 4. Calcular gasto por actividad y duración total
    let activeExpenditure = 0
    let totalWorkoutHours = 0
    let hasStrengthSession = false
    let hasBrickSession = false

    const weather = await getForecastForLocation(undefined, undefined, dateString) // TODO: Pasar lat/lng del usuario si está disponible
    const sessionsPacing: Array<any> = []

    workouts?.forEach((w: any) => {
      const session = w.training_sessions
      if (!session || session.sport_type === 'descanso') return

      const durationMin = session.duration_min || 0
      const durationHours = durationMin / 60
      totalWorkoutHours += durationHours

      const sport = session.sport_type
      if (sport === 'fuerza') hasStrengthSession = true
      if (sport === 'brick') hasBrickSession = true

      // Calcular calorías quemadas
      const kcalBurned = calculateWorkoutCalories(sport, weight, durationMin)
      activeExpenditure += kcalBurned

      // Calcular pacing con integración climática
      const sweatRate = Number(profile.sweat_rate || 0.8)
      const pacing = calculateSessionPacing(sport, durationMin, sweatRate, profile.custom_carbs_per_hour, {
        temperature: weather.temperature,
        clothing: weather.clothing,
        humidity: weather.humidity
      })

      sessionsPacing.push({
        workoutId: w.id,
        sportType: sport,
        durationMin,
        hourlyFluidMl: pacing.hourlyFluidMl,
        totalFluidMl: pacing.totalFluidMl,
        hourlySodiumMg: pacing.hourlySodiumMg,
        totalSodiumMg: pacing.totalSodiumMg,
        hourlyCarbsG: pacing.hourlyCarbsG,
        totalCarbsG: pacing.totalCarbsG,
        practicalGuide: pacing.practicalGuide
      })
    })

    // 5. Calcular distribución diaria de macronutrientes
    const macrosCalc = calculateDailyMacros(
      weight,
      totalWorkoutHours,
      hasStrengthSession,
      hasBrickSession,
      activeExpenditure,
      dailySteps
    )

    const data: DynamicNutritionData = {
      bmr: macrosCalc.bmr,
      baseExpenditure: macrosCalc.baseExpenditure,
      activeExpenditure: macrosCalc.activeExpenditure,
      totalCalories: macrosCalc.totalCalories,
      weight,
      macros: {
        carbs: macrosCalc.carbs,
        protein: macrosCalc.protein,
        fat: macrosCalc.fat
      },
      sessionsPacing
    }

    return { data }
  } catch (err: any) {
    console.error('Excepción en getDailyNutrition:', err)
    return { error: err.message || 'Error interno al calcular la nutrición.' }
  }
}

/**
 * Server Action que simula respuestas de alta fidelidad para el Asistente de IA de Nutrición Deportiva.
 * Integra de forma precisa el peso del usuario, macros recomendadas para el día, entrenamientos y sus ingredientes preferidos.
 */
export async function askNutritionAI(
  question: string,
  dateString: string,
  preferredIngredients: string[] = []
): Promise<{ response: string; success: boolean }> {
  try {
    const nutritionRes = await getDailyNutrition(dateString)
    const nutrition = nutritionRes.data

    if (!nutrition) {
      return {
        success: false,
        response: "Lo siento, no he podido recuperar tus datos nutricionales y de peso para hoy. Por favor, asegúrate de tener tu perfil biométrico al día en los Ajustes."
      }
    }

    // Obtener preferencias completas del usuario
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    let dislikes: string[] = []
    let preferences = preferredIngredients
    if (user) {
      const { data: profileData } = await supabase.from('profiles').select('disliked_ingredients, preferred_ingredients').eq('id', user.id).single()
      if (profileData) {
        dislikes = profileData.disliked_ingredients || []
        // Si no se pasaron desde el cliente, usarlas de la BD
        if (preferences.length === 0 && profileData.preferred_ingredients) {
          preferences = profileData.preferred_ingredients
        }
      }
    }

    const q = question.toLowerCase().trim()
    let response = ""

    // Identificar el deporte principal del día
    let workoutSport = "descanso"
    let workoutDuration = 0
    if (nutrition.sessionsPacing && nutrition.sessionsPacing.length > 0) {
      workoutSport = nutrition.sessionsPacing[0].sportType
      workoutDuration = nutrition.sessionsPacing[0].durationMin
    }

    const hasWorkout = workoutSport !== "descanso" && workoutDuration > 0
    const carbGrams = nutrition.macros.carbs.grams
    const proteinGrams = nutrition.macros.protein.grams
    const totalKcal = nutrition.totalCalories

    // Caso 1.5: Cambiar plato completo (Nueva funcionalidad)
    if (q.includes("cambia mi plato") || q.includes("cambiar plato") || q.includes("otro plato") || q.includes("no me gusta") || q.includes("generar plato") || q.includes("nueva receta")) {
      const isPost = !q.includes("antes") && !q.includes("pre-entreno");
      const altMeal = generateAlternativeMeal(workoutSport, workoutDuration, preferences, dislikes, isPost);
      
      response = `### 🔄 Nueva Propuesta Nutricional
      
He generado una alternativa completamente diferente para ti, evitando los ingredientes que no toleras y respetando tus macros de hoy (${proteinGrams}g Proteína, ${carbGrams}g Carbohidratos).

**${altMeal.mealName}**
*Foco:* ${altMeal.macronutrientFocus}

${altMeal.recipeDescription}

¿Te parece bien esta opción o prefieres que ajustemos algo más?`;

    // Caso 1: Pregunta sobre sustitución de ingredientes (pollo, arroz, etc.)
    } else if (q.includes("sustitu") || q.includes("cambiar") || q.includes("pollo") || q.includes("salmon") || q.includes("tofu") || q.includes("ingrediente")) {
      const proteins = preferences.filter(i => ["pollo", "salmon", "tofu", "huevo"].includes(i))
      const carbs = preferences.filter(i => ["pasta", "arroz", "patata", "avena", "platano"].includes(i))
      
      const pAlternatives = proteins.length > 0 
        ? proteins.map(p => `- **${p.toUpperCase()}**: Una de tus fuentes favoritas del onboarding. Aporta aproximadamente la misma densidad proteica de alta biodisponibilidad.`).join("\n")
        : "- **Huevo o Tofu**: Fuentes excelentes de proteína para reparar tus fibras musculares.\n- **Salmón**: Excelente alternativa antiinflamatoria rica en grasas saludables Omega-3."

      const cAlternatives = carbs.length > 0
        ? carbs.map(c => `- **${c.toUpperCase()}**: Tu carbohidrato de confianza. Ideal para recargar glucógeno hoy.`).join("\n")
        : "- **Patata cocida o Boniato**: Carbohidratos complejos de fácil digestión.\n- **Quinoa o Arroz integral**: Aportan energía sostenida y fibra."

      response = `### 🍳 Sustituciones Inteligentes para Hoy

Considerando que hoy tienes planificado un entrenamiento de **${workoutSport}** de **${workoutDuration} min** y un objetivo proteico de **${proteinGrams}g**, aquí tienes las mejores alternativas para adaptar tu plato:

#### Para la proteína (reemplazo de pollo/salmón/tofu):
${pAlternatives}

#### Para el carbohidrato (reemplazo de arroz/pasta/patata):
${cAlternatives}

*💡 Consejo del Coach Nutricional: Intenta mantener las proporciones. Si cambias 150g de pechuga de pollo, sustitúyelo por 150g de salmón o 180g de tofu firme para no desbalancear tus **${proteinGrams}g** de proteína diaria.*`

    // Caso 2: Intolerancia al Gluten / Celíaco
    } else if (q.includes("gluten") || q.includes("celiac") || q.includes("intoleran") || q.includes("alergia")) {
      response = `### 🌾 Adaptación para Intolerancias y Celíacos

Para cumplir con tu objetivo de **${carbGrams}g de carbohidratos** hoy de forma 100% libre de gluten o alérgenos molestos para el estómago del triatleta:

1. **Sustituye la pasta o trigo**: Utiliza **Arroz basmati** (que es uno de tus favoritos), **Quinoa** o **Patata asada**. Son naturalmente libres de gluten y muy fáciles de digerir antes de tu sesión de **${workoutSport}**.
2. **Post-entreno limpio**: Para tu comida de recuperación, utiliza arroz blanco o patata cocida como base de carbohidrato, acompañado de tu proteína favorita (pechuga de pollo a la plancha o huevo).
3. **Cuidado con los suplementos**: Si tomas geles o isotónicos intra-entreno hoy, asegúrate de que lleven el sello *Gluten-Free* para evitar irritación intestinal y flato durante la sesión.

¿Quieres que te sugiera una receta específica para hoy con arroz o patata en base a tu entrenamiento?`

    // Caso 3: Entrenamiento tardío y cenas
    } else if (q.includes("cena") || q.includes("tarde") || q.includes("noche") || q.includes("tardio")) {
      response = `### 🌙 Estrategia para Entrenamientos Tardíos

Entrenar tarde influye directamente en tu cena y en la calidad del sueño. Con tu objetivo de hoy de **${totalKcal} Kcal**:

- **Si entrenaste duro por la tarde/noche**: Necesitas recuperar glucógeno pero sin saturar la digestión. Cena una porción moderada de **Arroz basmati o puré de patatas** (hidratos rápidos y suaves) junto con una fuente de proteína limpia como **Tofu salteado** o **Huevo cocido**.
- **Evita grasas pesadas**: Reduce el aguacate o los frutos secos en la cena si vas a dormir en menos de 2 horas. Las grasas ralentizan el vaciado gástrico y pueden interrumpir el sueño profundo.
- **Hidratación**: Asegúrate de reponer el líquido perdido estimado según tu tasa de sudoración sin beber grandes volúmenes de golpe justo antes de acostarte para evitar despertarte por la noche.`

    // Fallback: Respuesta general personalizada
    } else {
      const workoutText = hasWorkout
        ? `tienes programada una sesión de **${workoutSport}** de **${workoutDuration} minutos**`
        : `es tu día de descanso activo`

      response = `### 🤖 Asistente de IA Nutricional Triatlón Pro

Hola. Analizando tu perfil para la fecha seleccionada:
- Tu peso registrado es de **${nutrition.weight} kg**.
- Hoy **${workoutText}**.
- Tus necesidades calóricas totales son de **${totalKcal} kcal** (metabolismo basal de ${nutrition.bmr} kcal + gasto activo).
- Tus macros objetivos son: **${carbGrams}g CHO** | **${proteinGrams}g PRO** | **${nutrition.macros.fat.grams}g FAT**.

Tus ingredientes preferidos son: *${preferences.join(", ")}*.
${dislikes.length > 0 ? `Ingredientes que evitamos: *${dislikes.join(", ")}*.` : ''}

¿En qué puedo ayudarte hoy? Puedes preguntarme sobre:
1. *¿Cómo sustituir un ingrediente de mi plato de hoy?*
2. *¿Qué debería comer/cenar si mi entrenamiento se retrasa?*
3. *¿Cómo adaptar el plan si tengo molestias estomacales o acidez?*`
    }

    return {
      success: true,
      response
    }
  } catch (err: any) {
    console.error("Excepción en askNutritionAI server action:", err)
    return {
      success: false,
      response: "Ha ocurrido un error inesperado al procesar la consulta con el asistente de IA."
    }
  }
}

