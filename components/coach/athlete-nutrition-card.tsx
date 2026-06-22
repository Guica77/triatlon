import * as React from 'react';
import { ProCard } from '@/components/ui/pro-card';
import { Flame, Droplet, CheckCircle, XCircle, AlertTriangle, Utensils } from 'lucide-react';
import type { DynamicNutritionData } from '@/lib/nutrition-utility';

interface AthleteNutritionCardProps {
  allergies?: string[];
  preferredIngredients?: string[];
  dislikedIngredients?: string[];
  dailyNutrition?: DynamicNutritionData;
}

export function AthleteNutritionCard({
  allergies = [],
  preferredIngredients = [],
  dislikedIngredients = [],
  dailyNutrition
}: AthleteNutritionCardProps) {
  
  const totalKcal = dailyNutrition?.totalCalories || 0;
  const carbs = dailyNutrition?.macros?.carbs?.grams || 0;
  const protein = dailyNutrition?.macros?.protein?.grams || 0;
  const fat = dailyNutrition?.macros?.fat?.grams || 0;

  return (
    <ProCard className="border-border shadow-sm p-0">
      <div className="pb-3 border-b border-border/50 p-6">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Utensils className="h-5 w-5 text-emerald-500" />
              Perfil Nutricional del Atleta
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Preferencias, alergias y requerimientos diarios
            </p>
          </div>
        </div>
      </div>
      
      <div className="pt-5 space-y-6 p-6">
        
        {/* Diet Preferences Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <h4 className="text-sm font-medium flex items-center gap-2 text-zinc-700 dark:text-zinc-300">
              <CheckCircle className="h-4 w-4 text-emerald-500" />
              Ingredientes Preferidos
            </h4>
            <div className="flex flex-wrap gap-2">
              {preferredIngredients.length > 0 ? (
                preferredIngredients.map((item, idx) => (
                  <span key={idx} className="px-2.5 py-1 text-xs rounded-md bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 font-medium">
                    {item}
                  </span>
                ))
              ) : (
                <span className="text-xs text-muted-foreground italic">No especificado</span>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-medium flex items-center gap-2 text-zinc-700 dark:text-zinc-300">
              <XCircle className="h-4 w-4 text-rose-500" />
              Evitar / No le gusta
            </h4>
            <div className="flex flex-wrap gap-2">
              {dislikedIngredients.length > 0 ? (
                dislikedIngredients.map((item, idx) => (
                  <span key={idx} className="px-2.5 py-1 text-xs rounded-md bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400 font-medium">
                    {item}
                  </span>
                ))
              ) : (
                <span className="text-xs text-muted-foreground italic">Ninguno reportado</span>
              )}
            </div>
          </div>
        </div>

        {allergies.length > 0 && (
          <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 rounded-lg space-y-2">
             <h4 className="text-sm font-semibold flex items-center gap-2 text-red-700 dark:text-red-400">
              <AlertTriangle className="h-4 w-4" />
              Alergias / Intolerancias
            </h4>
            <div className="flex flex-wrap gap-2">
              {allergies.map((item, idx) => (
                <span key={idx} className="px-2.5 py-1 text-xs rounded-md bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300 font-bold uppercase tracking-wider">
                  {item}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Daily Macros Section */}
        {dailyNutrition && (
          <div className="pt-4 border-t border-border/50">
            <h4 className="text-sm font-medium mb-4 flex items-center gap-2 text-zinc-700 dark:text-zinc-300">
              <Flame className="h-4 w-4 text-orange-500" />
              Objetivos Diarios (Día Actual)
            </h4>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex flex-col items-center justify-center p-3 bg-zinc-50 dark:bg-zinc-900/50 rounded-xl border border-zinc-100 dark:border-zinc-800">
                <span className="text-xs text-muted-foreground mb-1 uppercase tracking-wider font-semibold">Calorías</span>
                <span className="text-xl font-bold text-zinc-900 dark:text-zinc-50">{totalKcal} <span className="text-xs font-normal text-muted-foreground">kcal</span></span>
              </div>
              <div className="flex flex-col items-center justify-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-900/30">
                <span className="text-xs text-blue-600 dark:text-blue-400 mb-1 uppercase tracking-wider font-semibold">Carbos</span>
                <span className="text-xl font-bold text-blue-700 dark:text-blue-300">{carbs} <span className="text-xs font-normal">g</span></span>
              </div>
              <div className="flex flex-col items-center justify-center p-3 bg-rose-50 dark:bg-rose-900/20 rounded-xl border border-rose-100 dark:border-rose-900/30">
                <span className="text-xs text-rose-600 dark:text-rose-400 mb-1 uppercase tracking-wider font-semibold">Proteína</span>
                <span className="text-xl font-bold text-rose-700 dark:text-rose-300">{protein} <span className="text-xs font-normal">g</span></span>
              </div>
              <div className="flex flex-col items-center justify-center p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-100 dark:border-amber-900/30">
                <span className="text-xs text-amber-600 dark:text-amber-400 mb-1 uppercase tracking-wider font-semibold">Grasas</span>
                <span className="text-xl font-bold text-amber-700 dark:text-amber-300">{fat} <span className="text-xs font-normal">g</span></span>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProCard>
  );
}
