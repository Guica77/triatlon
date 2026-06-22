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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <h4 className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 text-zinc-500">
              <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
              Ingredientes Preferidos
            </h4>
            <div className="flex flex-wrap gap-2">
              {preferredIngredients.length > 0 ? (
                preferredIngredients.map((item, idx) => (
                  <span key={idx} className="px-2.5 py-1 text-xs rounded-full bg-zinc-100 text-zinc-700 font-medium border border-zinc-200/60 shadow-sm flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    {item}
                  </span>
                ))
              ) : (
                <span className="text-xs text-zinc-400 italic">No especificado</span>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 text-zinc-500">
              <XCircle className="h-3.5 w-3.5 text-rose-500" />
              Evitar / No le gusta
            </h4>
            <div className="flex flex-wrap gap-2">
              {dislikedIngredients.length > 0 ? (
                dislikedIngredients.map((item, idx) => (
                  <span key={idx} className="px-2.5 py-1 text-xs rounded-full bg-zinc-100 text-zinc-700 font-medium border border-zinc-200/60 shadow-sm flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                    {item}
                  </span>
                ))
              ) : (
                <span className="text-xs text-zinc-400 italic">Ninguno reportado</span>
              )}
            </div>
          </div>
        </div>

        {allergies.length > 0 && (
          <div className="p-4 bg-white border border-rose-100 rounded-xl space-y-3 shadow-sm relative overflow-hidden">
             <div className="absolute top-0 left-0 w-1 h-full bg-rose-500"></div>
             <h4 className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 text-rose-600">
              <AlertTriangle className="h-3.5 w-3.5" />
              Alergias / Intolerancias Severas
            </h4>
            <div className="flex flex-wrap gap-2">
              {allergies.map((item, idx) => (
                <span key={idx} className="px-2.5 py-1 text-xs rounded-md bg-rose-50 text-rose-700 font-bold uppercase tracking-wider border border-rose-100">
                  {item}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Daily Macros Section */}
        {dailyNutrition && (
          <div className="pt-6 mt-2 border-t border-zinc-100">
            <h4 className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 text-zinc-500 mb-4">
              <Flame className="h-3.5 w-3.5 text-orange-500" />
              Objetivos Diarios (Día Actual)
            </h4>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="flex flex-col p-4 bg-white rounded-xl border border-zinc-200/60 shadow-sm relative overflow-hidden group hover:border-zinc-300 transition-colors">
                <div className="absolute top-0 left-0 w-full h-1 bg-zinc-800"></div>
                <span className="text-[10px] text-zinc-500 mb-1 font-semibold uppercase tracking-wider">Calorías</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-black text-zinc-900 tracking-tight">{totalKcal}</span>
                  <span className="text-[10px] font-bold text-zinc-400">kcal</span>
                </div>
              </div>

              <div className="flex flex-col p-4 bg-white rounded-xl border border-zinc-200/60 shadow-sm relative overflow-hidden group hover:border-blue-200 transition-colors">
                <div className="absolute top-0 left-0 w-full h-1 bg-blue-500"></div>
                <span className="text-[10px] text-zinc-500 mb-1 font-semibold uppercase tracking-wider">Carbos</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-black text-zinc-900 tracking-tight">{carbs}</span>
                  <span className="text-[10px] font-bold text-zinc-400">g</span>
                </div>
              </div>

              <div className="flex flex-col p-4 bg-white rounded-xl border border-zinc-200/60 shadow-sm relative overflow-hidden group hover:border-rose-200 transition-colors">
                <div className="absolute top-0 left-0 w-full h-1 bg-rose-500"></div>
                <span className="text-[10px] text-zinc-500 mb-1 font-semibold uppercase tracking-wider">Proteína</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-black text-zinc-900 tracking-tight">{protein}</span>
                  <span className="text-[10px] font-bold text-zinc-400">g</span>
                </div>
              </div>

              <div className="flex flex-col p-4 bg-white rounded-xl border border-zinc-200/60 shadow-sm relative overflow-hidden group hover:border-amber-200 transition-colors">
                <div className="absolute top-0 left-0 w-full h-1 bg-amber-500"></div>
                <span className="text-[10px] text-zinc-500 mb-1 font-semibold uppercase tracking-wider">Grasas</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-black text-zinc-900 tracking-tight">{fat}</span>
                  <span className="text-[10px] font-bold text-zinc-400">g</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProCard>
  );
}
