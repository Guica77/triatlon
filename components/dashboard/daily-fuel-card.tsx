'use client'
 
import * as React from 'react'
import { ProCard } from '@/components/ui/pro-card'
import { Flame, Zap, Dumbbell, Droplet, Watch } from 'lucide-react'
import { motion } from 'framer-motion'
import { askNutritionAI, rejectDishAndGetAlternative } from '@/app/(app)/dashboard/nutrition-actions'
import { calculatePreWorkoutMeal, calculateRecoveryMeal, DynamicNutritionData, NutritionMeal } from '@/lib/nutrition-utility'
import { Bot, Sparkles, Send, Loader2, Info, ThumbsDown } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface DailyFuelCardProps {
  nutritionData?: DynamicNutritionData | null
  error?: string | null
  loading?: boolean
  preferredIngredients?: string[]
  workouts?: any[]
  dateString?: string
}

export function DailyFuelCard({ 
  nutritionData, 
  error, 
  loading = false,
  preferredIngredients = [],
  workouts = [],
  dateString = new Date().toISOString().split('T')[0]
}: DailyFuelCardProps) {
  const [activeTab, setActiveTab] = React.useState<'macros' | 'platos'>('macros')
  const [aiQuestion, setAiQuestion] = React.useState('')
  const [aiAnswer, setAiAnswer] = React.useState('')
  const [isAiThinking, setIsAiThinking] = React.useState(false)
  const router = useRouter()
  const [localPreMeal, setLocalPreMeal] = React.useState<NutritionMeal | null>(null)
  const [localPostMeal, setLocalPostMeal] = React.useState<NutritionMeal | null>(null)
  const [isRejecting, setIsRejecting] = React.useState(false)

  if (loading) {
    return (
      <ProCard className="p-4 sm:p-6 h-[320px] flex flex-col justify-center items-center space-y-3 border-zinc-200 bg-white shadow-sm">
        <div className="w-8 h-8 rounded-full border-2 border-emerald-500/20 border-t-emerald-500 animate-spin" />
        <span className="text-xs text-zinc-500 font-medium">Calculando combustible diario...</span>
      </ProCard>
    )
  }

  if (error || !nutritionData) {
    return (
      <ProCard className="p-4 sm:p-6 h-[320px] flex flex-col justify-center items-center text-center p-6 border-zinc-200 bg-white shadow-sm">
        <Flame className="w-8 h-8 text-zinc-300 mb-2" />
        <h4 className="text-sm font-semibold text-zinc-700">Servicio de Nutrición Inactivo</h4>
        <p className="text-xs text-zinc-500 mt-1 max-w-[240px]">
          No pudimos calcular tus necesidades calóricas hoy. Asegúrate de configurar tu peso en Ajustes.
        </p>
      </ProCard>
    )
  }

  const { totalCalories, activeExpenditure, bmr, macros } = nutritionData
  const targetCalories = totalCalories

  const consumedCalories = Math.round(targetCalories * 0.74)
  const percentComplete = Math.min(100, Math.round((consumedCalories / targetCalories) * 100))

  const strokeDashoffset = 263.89 * (1 - percentComplete / 100)

  // Calcular porcentajes calóricos de cada macro para el donut
  const carbsKcal = macros.carbs.calories
  const proteinKcal = macros.protein.calories
  const fatKcal = macros.fat.calories
  const totalKcalAllocated = carbsKcal + proteinKcal + fatKcal || 1

  const carbsPercentage = Math.round((carbsKcal / totalKcalAllocated) * 100)
  const proteinPercentage = Math.round((proteinKcal / totalKcalAllocated) * 100)
  const fatPercentage = Math.round((fatKcal / totalKcalAllocated) * 100)

  // Obtener platos sugeridos según entrenamientos del día
  const activeWorkout = workouts && workouts.length > 0 ? workouts[0] : null
  const sportType = activeWorkout?.training_sessions?.sport_type || 'descanso'
  const durationMin = activeWorkout?.training_sessions?.duration_min || activeWorkout?.training_sessions?.duration_minutes || 0

  const preWorkoutMeal = localPreMeal || calculatePreWorkoutMeal(sportType, durationMin, preferredIngredients)
  const recoveryMeal = localPostMeal || calculateRecoveryMeal(sportType, durationMin, preferredIngredients)

  // Rechazar Plato
  const handleRejectMeal = async (meal: NutritionMeal, isPre: boolean) => {
    if (isRejecting) return;
    setIsRejecting(true);
    try {
      const res = await rejectDishAndGetAlternative(meal.mealName, sportType, durationMin, isPre);
      if (res.success && res.newMeal) {
        if (isPre) setLocalPreMeal(res.newMeal);
        else setLocalPostMeal(res.newMeal);
        router.refresh(); // Update the backend data without full page load
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsRejecting(false);
    }
  }

  // Manejo del Chat de IA
  const handleAskAI = async (questionText: string) => {
    if (!questionText.trim() || isAiThinking) return
    setIsAiThinking(true)
    setAiAnswer('')
    try {
      const res = await askNutritionAI(questionText, dateString, preferredIngredients)
      if (res.success && res.response) {
        // Efecto Typewriter rápido
        let currentText = ""
        let i = 0
        const fullResponse = res.response
        const typingInterval = setInterval(() => {
          // Escribimos de 3 en 3 caracteres para acelerar respuestas largas
          const charsToAppend = fullResponse.slice(i, i + 3)
          currentText += charsToAppend
          setAiAnswer(currentText)
          i += 3
          if (i >= fullResponse.length) {
            clearInterval(typingInterval)
            setIsAiThinking(false)
          }
        }, 5)
      } else {
        setAiAnswer(res.response || "No he podido responder a tu duda en este momento.")
        setIsAiThinking(false)
      }
    } catch (err) {
      console.error(err)
      setAiAnswer("Error de conexión al procesar la consulta con el asistente de IA.")
      setIsAiThinking(false)
    }
  }

  // Formato simple de Markdown a HTML
  const formatMarkdown = (text: string) => {
    if (!text) return ""
    return text
      .replace(/^### (.*$)/gim, '<h4 class="font-bold text-[11px] text-teal-950 mt-2 mb-1">$1</h4>')
      .replace(/^#### (.*$)/gim, '<h5 class="font-bold text-[10px] text-teal-900 mt-1.5 mb-0.5">$1</h5>')
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-teal-950">$1</strong>')
      .replace(/^\* (.*?)$/gim, '<span class="block text-[9.5px] italic text-teal-850 mt-1">$1</span>')
      .replace(/^- (.*?)$/gim, '<div class="flex gap-1 items-start mt-0.5 text-[9.5px] text-teal-850"><span>•</span><span>$1</span></div>')
  }

  return (
    <ProCard className="p-4 sm:p-6 space-y-4 relative overflow-hidden border-zinc-200 bg-gradient-to-br from-white to-zinc-50/30 shadow-sm hover:shadow-md transition-all duration-300 h-full flex flex-col justify-between min-h-[320px]">
      
      {/* Cabecera Premium con Tabs */}
      <div className="flex justify-between items-center border-b border-zinc-100 pb-3 relative z-10 shrink-0 gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center shadow-sm shrink-0">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
          </div>
          <span className="text-[11px] sm:text-xs font-bold tracking-wider text-zinc-455 uppercase whitespace-nowrap overflow-hidden text-ellipsis">Combustible</span>
        </div>

        {/* Selector de Pestañas */}
        <div className="flex bg-zinc-100 p-0.5 rounded-lg border border-zinc-200/80 text-[9.5px] sm:text-[10px] font-bold shrink-0">
          <button
            onClick={() => setActiveTab('macros')}
            className={`px-1.5 sm:px-2.5 py-1 rounded cursor-pointer transition-colors ${
              activeTab === 'macros' ? 'bg-white text-emerald-600 shadow-xs border border-zinc-200/50' : 'text-zinc-500 hover:text-zinc-800'
            }`}
          >
            Macros
          </button>
          <button
            onClick={() => setActiveTab('platos')}
            className={`px-1.5 sm:px-2.5 py-1 rounded cursor-pointer transition-colors flex items-center gap-0.5 ${
              activeTab === 'platos' ? 'bg-white text-emerald-600 shadow-xs border border-zinc-200/50' : 'text-zinc-500 hover:text-zinc-800'
            }`}
          >
            Platos/IA ✨
          </button>
        </div>
      </div>

      {activeTab === 'macros' ? (
        <>
          {/* Círculo de Energía y Calorías */}
          <div className="flex items-center gap-4 relative z-10 py-1 shrink-0">
            <div className="relative w-20 h-20 flex items-center justify-center shrink-0">
              <svg className="absolute inset-0 w-full h-full transform -rotate-90 overflow-visible" viewBox="0 0 100 100">
                <defs>
                  <linearGradient id="fuelProgressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#10b981" />
                    <stop offset="100%" stopColor="#06b6d4" />
                  </linearGradient>
                </defs>
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  className="stroke-zinc-100"
                  strokeWidth="6"
                  fill="transparent"
                />
                <motion.circle
                  cx="50"
                  cy="50"
                  r="42"
                  stroke="url(#fuelProgressGradient)"
                  strokeWidth="6"
                  fill="transparent"
                  strokeDasharray="263.89"
                  initial={{ strokeDashoffset: 263.89 }}
                  animate={{ strokeDashoffset }}
                  transition={{ duration: 1.2, ease: 'easeOut' }}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center select-none">
                <span className="text-xl font-black tracking-tight text-zinc-900 leading-none">{consumedCalories}</span>
                <span className="text-[8px] text-zinc-500 font-bold uppercase mt-0.5">/ {targetCalories} kcal</span>
              </div>
            </div>
      
            <div className="space-y-0.5 min-w-0">
              <h4 className="text-xs font-bold text-zinc-800 tracking-tight leading-tight">
                Balance Energético
              </h4>
              <p className="text-[10px] text-zinc-500 leading-relaxed font-semibold">
                Base metabólica: <strong className="text-zinc-700">{bmr} kcal</strong>. Gasto activo: <strong className="text-emerald-600">+{activeExpenditure} kcal</strong>.
              </p>
            </div>
          </div>
      
          {/* Desglose de Macronutrientes (Donut e Info Lateral) */}
          <div className="flex items-center gap-4 pt-3 border-t border-zinc-100 flex-1 justify-between shrink-0">
            {/* Donut SVG */}
            <div className="relative w-18 h-18 flex items-center justify-center shrink-0">
              <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                <circle cx="18" cy="18" r="15.915" fill="none" stroke="#f4f4f5" strokeWidth="4" />
                <circle cx="18" cy="18" r="15.915" fill="none" stroke="#f43f5e" strokeWidth="4.5" strokeDasharray={`${carbsPercentage} ${100 - carbsPercentage}`} strokeDashoffset={100} />
                <circle cx="18" cy="18" r="15.915" fill="none" stroke="#84cc16" strokeWidth="4.5" strokeDasharray={`${fatPercentage} ${100 - fatPercentage}`} strokeDashoffset={100 - carbsPercentage} />
                <circle cx="18" cy="18" r="15.915" fill="none" stroke="#3b82f6" strokeWidth="4.5" strokeDasharray={`${proteinPercentage} ${100 - proteinPercentage}`} strokeDashoffset={100 - carbsPercentage - fatPercentage} />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center select-none text-[8px] font-black text-zinc-800 leading-none">
                <span>{carbsPercentage}%</span>
                <span className="text-[5px] text-zinc-450 uppercase font-bold mt-0.5">HC</span>
              </div>
            </div>

            {/* Listado con barras de progreso */}
            <div className="flex-1 flex flex-col gap-2">
              {/* CHO */}
              <div className="space-y-0.5">
                <div className="flex justify-between text-[10px] font-semibold">
                  <span className="text-zinc-700 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500" /> Carbohidratos ({carbsPercentage}%)
                  </span>
                  <span className="text-zinc-550 font-bold font-mono">
                    <strong className="text-rose-600">{Math.round(macros.carbs.grams * 0.74)}g</strong> / {macros.carbs.grams}g
                  </span>
                </div>
                <div className="w-full h-1 bg-zinc-100 rounded-full overflow-hidden border border-zinc-200/50">
                  <motion.div initial={{ width: 0 }} animate={{ width: '74%' }} transition={{ duration: 1.2, ease: 'easeOut' }} className="h-full bg-gradient-to-r from-rose-400 to-rose-600 rounded-full" />
                </div>
              </div>
              
              {/* PRO */}
              <div className="space-y-0.5">
                <div className="flex justify-between text-[10px] font-semibold">
                  <span className="text-zinc-700 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500" /> Proteínas ({proteinPercentage}%)
                  </span>
                  <span className="text-zinc-550 font-bold font-mono">
                    <strong className="text-blue-600">{Math.round(macros.protein.grams * 0.7)}g</strong> / {macros.protein.grams}g
                  </span>
                </div>
                <div className="w-full h-1 bg-zinc-100 rounded-full overflow-hidden border border-zinc-200/50">
                  <motion.div initial={{ width: 0 }} animate={{ width: '70%' }} transition={{ duration: 1.2, ease: 'easeOut', delay: 0.1 }} className="h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full" />
                </div>
              </div>

              {/* FAT */}
              <div className="space-y-0.5">
                <div className="flex justify-between text-[10px] font-semibold">
                  <span className="text-zinc-700 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-lime-500" /> Grasas ({fatPercentage}%)
                  </span>
                  <span className="text-zinc-550 font-bold font-mono">
                    <strong className="text-lime-600">{Math.round(macros.fat.grams * 0.74)}g</strong> / {macros.fat.grams}g
                  </span>
                </div>
                <div className="w-full h-1 bg-zinc-100 rounded-full overflow-hidden border border-zinc-200/50">
                  <motion.div initial={{ width: 0 }} animate={{ width: '74%' }} transition={{ duration: 1.2, ease: 'easeOut', delay: 0.2 }} className="h-full bg-gradient-to-r from-lime-400 to-lime-600 rounded-full" />
                </div>
              </div>
            </div>
          </div>
        </>
      ) : (
        /* Pestaña: Platos e IA */
        <div className="flex-1 flex flex-col justify-between overflow-hidden gap-3 relative">
          <div className="flex-1 overflow-y-auto pr-1 space-y-2.5 max-h-[170px] custom-scrollbar">
            
            {/* Pre-Entreno */}
            <div className="border-l-2 border-emerald-500 pl-2 py-0.5 relative group">
              <span className="text-[8px] text-emerald-600 font-bold uppercase tracking-wider block">Combustible Pre-Entreno</span>
              <div className="flex justify-between items-start gap-2">
                <div>
                  <h5 className="text-[10px] font-black text-zinc-900 leading-tight mt-0.5">{preWorkoutMeal.mealName}</h5>
                  <p className="text-[9px] text-zinc-500 leading-relaxed mt-0.5 font-medium">{preWorkoutMeal.recipeDescription}</p>
                </div>
                <button 
                  onClick={() => handleRejectMeal(preWorkoutMeal, true)}
                  disabled={isRejecting}
                  className="shrink-0 p-1 rounded-md text-zinc-400 hover:text-rose-500 hover:bg-rose-50 transition-colors opacity-0 group-hover:opacity-100"
                  title="No me gusta este plato"
                >
                  <ThumbsDown className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Post-Entreno (Sólo si entrenó hoy) */}
            {sportType !== 'descanso' ? (
              <div className="border-l-2 border-cyan-500 pl-2 py-0.5 relative group">
                <span className="text-[8px] text-cyan-600 font-bold uppercase tracking-wider block">Recuperación Post-Entreno</span>
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <h5 className="text-[10px] font-black text-zinc-900 leading-tight mt-0.5">{recoveryMeal.mealName}</h5>
                    <p className="text-[9px] text-zinc-500 leading-relaxed mt-0.5 font-medium">{recoveryMeal.recipeDescription}</p>
                  </div>
                  <button 
                    onClick={() => handleRejectMeal(recoveryMeal, false)}
                    disabled={isRejecting}
                    className="shrink-0 p-1 rounded-md text-zinc-400 hover:text-rose-500 hover:bg-rose-50 transition-colors opacity-0 group-hover:opacity-100"
                    title="No me gusta este plato"
                  >
                    <ThumbsDown className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="border-l-2 border-zinc-400 pl-2 py-0.5 relative group">
                <span className="text-[8px] text-zinc-500 font-bold uppercase tracking-wider block">Nutrición de Base (Día Libre)</span>
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <h5 className="text-[10px] font-black text-zinc-900 leading-tight mt-0.5">{recoveryMeal.mealName}</h5>
                    <p className="text-[9px] text-zinc-500 leading-relaxed mt-0.5 font-medium">{recoveryMeal.recipeDescription}</p>
                  </div>
                  <button 
                    onClick={() => handleRejectMeal(recoveryMeal, false)}
                    disabled={isRejecting}
                    className="shrink-0 p-1 rounded-md text-zinc-400 hover:text-rose-500 hover:bg-rose-50 transition-colors opacity-0 group-hover:opacity-100"
                    title="No me gusta este plato"
                  >
                    <ThumbsDown className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* Preferencias alimentarias */}
            {preferredIngredients && preferredIngredients.length > 0 && (
              <div className="flex items-center gap-1 flex-wrap pt-1.5 border-t border-zinc-100">
                <span className="text-[8px] text-zinc-400 font-bold uppercase tracking-wider">Tus favoritos:</span>
                {preferredIngredients.map((ing) => (
                  <span key={ing} className="px-1.5 py-0.5 rounded bg-zinc-50 border border-zinc-200 text-zinc-650 text-[8px] capitalize font-semibold shadow-2xs">
                    {ing}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* AI Response Display */}
          {aiAnswer && (
            <div className="bg-teal-50 border border-teal-150 rounded-xl p-2.5 text-[9.5px] text-teal-900 relative animate-fade-in max-h-[100px] overflow-y-auto shrink-0 custom-scrollbar">
              <div className="flex items-center gap-1.5 mb-1 text-teal-700 font-bold text-[8px] uppercase tracking-wider">
                <Bot className="w-3.5 h-3.5 text-teal-600" />
                <span>IA de Nutrición</span>
              </div>
              <div className="prose prose-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: formatMarkdown(aiAnswer) }} />
              <button
                onClick={() => { setAiAnswer(''); setAiQuestion(''); }}
                className="absolute top-2 right-2 text-teal-500 hover:text-teal-750 font-black text-[8px] uppercase tracking-wider cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          )}

          {/* Chat con IA Form / Sugerencias */}
          {!aiAnswer && !isAiThinking && (
            <div className="flex gap-1 flex-wrap shrink-0">
              <button 
                type="button" 
                onClick={() => handleAskAI("¿Cómo sustituyo el pollo hoy?")}
                className="text-[8px] px-2 py-1 rounded bg-teal-50 border border-teal-150 hover:bg-teal-100 text-teal-700 font-bold transition cursor-pointer"
              >
                ¿Sustituir pollo?
              </button>
              <button 
                type="button" 
                onClick={() => handleAskAI("¿Cómo lo adapto si soy intolerante al gluten?")}
                className="text-[8px] px-2 py-1 rounded bg-teal-50 border border-teal-150 hover:bg-teal-100 text-teal-700 font-bold transition cursor-pointer"
              >
                ¿Sin gluten?
              </button>
              <button 
                type="button" 
                onClick={() => handleAskAI("¿Qué ceno si he entrenado tarde?")}
                className="text-[8px] px-2 py-1 rounded bg-teal-50 border border-teal-150 hover:bg-teal-100 text-teal-700 font-bold transition cursor-pointer"
              >
                ¿Cena entreno tarde?
              </button>
            </div>
          )}

          {/* Input Form */}
          {!aiAnswer && (
            <form 
              onSubmit={(e) => { e.preventDefault(); handleAskAI(aiQuestion); }} 
              className="flex items-center gap-1.5 pt-1.5 border-t border-zinc-150 shrink-0"
            >
              <input
                title="Preguntar a la IA de Nutrición"
                aria-label="Preguntar a la IA de Nutrición"
                type="text"
                value={aiQuestion}
                onChange={(e) => setAiQuestion(e.target.value)}
                placeholder="Pregunta algo sobre tu comida o sustitutos..."
                disabled={isAiThinking}
                className="flex-1 bg-white border border-zinc-200 focus:border-emerald-500/50 rounded-lg px-2.5 py-1.5 text-[10px] text-zinc-900 outline-none transition-colors"
              />
              <button
                type="submit"
                disabled={isAiThinking || !aiQuestion.trim()}
                className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg p-1.5 transition disabled:opacity-40 cursor-pointer shadow-sm flex items-center justify-center"
              >
                {isAiThinking ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5" />
                )}
              </button>
            </form>
          )}

        </div>
      )}
    </ProCard>
  )
}
