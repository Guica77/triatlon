'use client';

import * as React from 'react';
import { ProCard } from '@/components/ui/pro-card';
import { Flame, Droplet, CheckCircle, XCircle, AlertTriangle, Utensils, Edit2, Check, X, Loader2 } from 'lucide-react';
import type { DynamicNutritionData } from '@/lib/nutrition-utility';
import { updateNutritionPreferences } from '@/app/(app)/dashboard/nutrition-actions';
import { AnimatedButton } from '@/components/ui/animated-button';

interface AthleteNutritionCardProps {
  athleteId?: string;
  allergies?: string[];
  preferredIngredients?: string[];
  dislikedIngredients?: string[];
  dailyNutrition?: DynamicNutritionData;
}

export function AthleteNutritionCard({
  athleteId,
  allergies = [],
  preferredIngredients = [],
  dislikedIngredients = [],
  dailyNutrition
}: AthleteNutritionCardProps) {
  const [isEditing, setIsEditing] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  
  const [prefInputs, setPrefInputs] = React.useState(preferredIngredients.join(', '));
  const [dislikeInputs, setDislikeInputs] = React.useState(dislikedIngredients.join(', '));
  const [allergyInputs, setAllergyInputs] = React.useState(allergies.join(', '));

  // Reset inputs when props change or editing is cancelled
  React.useEffect(() => {
    setPrefInputs(preferredIngredients.join(', '));
    setDislikeInputs(dislikedIngredients.join(', '));
    setAllergyInputs(allergies.join(', '));
  }, [preferredIngredients, dislikedIngredients, allergies, isEditing]);

  const handleSave = async () => {
    if (!athleteId) return;
    setIsSaving(true);
    try {
      const parsedPrefs = prefInputs.split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
      const parsedDislikes = dislikeInputs.split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
      const parsedAllergies = allergyInputs.split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
      
      const res = await updateNutritionPreferences(athleteId, {
        preferred_ingredients: parsedPrefs,
        disliked_ingredients: parsedDislikes,
        allergies: parsedAllergies
      });
      
      if (res.success) {
        setIsEditing(false);
      } else {
        alert(res.error || 'Error al guardar');
      }
    } finally {
      setIsSaving(false);
    }
  };
  
  const totalKcal = dailyNutrition?.totalCalories || 0;
  const carbs = dailyNutrition?.macros?.carbs?.grams || 0;
  const protein = dailyNutrition?.macros?.protein?.grams || 0;
  const fat = dailyNutrition?.macros?.fat?.grams || 0;

  return (
    <ProCard className="border-border shadow-card p-0">
      <div className="pb-3 border-b border-border/50 p-6">
        <div className="flex justify-between items-start sm:items-center">
          <div>
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Utensils className="h-5 w-5 text-emerald-500" />
              Perfil Nutricional del Atleta
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Preferencias, alergias y requerimientos diarios
            </p>
          </div>
          {athleteId && (
            <div className="shrink-0 mt-2 sm:mt-0">
              {isEditing ? (
                <div className="flex items-center gap-2">
                  <AnimatedButton variant="ghost" size="sm" onClick={() => setIsEditing(false)} disabled={isSaving} className="text-text-secondary border border-border-default">
                    <X className="w-4 h-4 mr-1" /> Cancelar
                  </AnimatedButton>
                  <AnimatedButton variant="primary" size="sm" onClick={handleSave} disabled={isSaving} className="bg-emerald-500 hover:bg-emerald-600 text-white">
                    {isSaving ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Check className="w-4 h-4 mr-1" />}
                    Guardar
                  </AnimatedButton>
                </div>
              ) : (
                <AnimatedButton variant="secondary" size="sm" onClick={() => setIsEditing(true)} className="text-text-secondary border-border-default bg-surface-card shadow-card hover:bg-surface-hover">
                  <Edit2 className="w-3.5 h-3.5 mr-1.5" /> Editar Perfil
                </AnimatedButton>
              )}
            </div>
          )}
        </div>
      </div>
      
      <div className="pt-5 space-y-6 p-6">
        
        {/* Diet Preferences Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <h4 className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 text-text-secondary">
              <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
              Ingredientes Preferidos
            </h4>
            {isEditing ? (
              <textarea
                value={prefInputs}
                onChange={e => setPrefInputs(e.target.value)}
                placeholder="Ej: avena, plátano, pollo, arroz"
                className="w-full text-sm p-3 bg-surface-hover border border-border-default rounded-xl focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none resize-none h-24 shadow-inner"
              />
            ) : (
              <div className="flex flex-wrap gap-2">
                {preferredIngredients.length > 0 ? (
                  preferredIngredients.map((item, idx) => (
                    <span key={idx} className="px-2.5 py-1 text-xs rounded-full bg-surface-hover text-text-primary font-medium border border-border-default/60 shadow-card flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      {item}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-text-muted italic">No especificado</span>
                )}
              </div>
            )}
          </div>

          <div className="space-y-3">
            <h4 className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 text-text-secondary">
              <XCircle className="h-3.5 w-3.5 text-rose-500" />
              Evitar / No le gusta
            </h4>
            {isEditing ? (
              <textarea
                value={dislikeInputs}
                onChange={e => setDislikeInputs(e.target.value)}
                placeholder="Ej: brócoli, pimiento, picante"
                className="w-full text-sm p-3 bg-surface-hover border border-border-default rounded-xl focus:border-rose-500 focus:ring-1 focus:ring-rose-500 outline-none resize-none h-24 shadow-inner"
              />
            ) : (
              <div className="flex flex-wrap gap-2">
                {dislikedIngredients.length > 0 ? (
                  dislikedIngredients.map((item, idx) => (
                    <span key={idx} className="px-2.5 py-1 text-xs rounded-full bg-surface-hover text-text-primary font-medium border border-border-default/60 shadow-card flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                      {item}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-text-muted italic">Ninguno reportado</span>
                )}
              </div>
            )}
          </div>
        </div>

        {(allergies.length > 0 || isEditing) && (
          <div className="p-4 bg-run/10 border border-run/20 rounded-xl space-y-3 shadow-card relative overflow-hidden">
             <div className="absolute top-0 left-0 w-1 h-full bg-rose-500"></div>
             <h4 className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 text-run">
              <AlertTriangle className="h-3.5 w-3.5" />
              Alergias / Intolerancias Severas
            </h4>
            {isEditing ? (
              <textarea
                value={allergyInputs}
                onChange={e => setAllergyInputs(e.target.value)}
                placeholder="Ej: lactosa, gluten, frutos secos"
                className="w-full text-sm p-3 bg-run/10 border border-run/30 rounded-xl focus:border-rose-500 focus:ring-1 focus:ring-rose-500 outline-none resize-none h-16 shadow-inner text-text-primary placeholder-text-muted"
              />
            ) : (
              <div className="flex flex-wrap gap-2">
                {allergies.map((item, idx) => (
                  <span key={idx} className="px-2.5 py-1 text-xs rounded-md bg-run/10 text-run font-bold uppercase tracking-wider border border-run/20 shadow-card">
                    {item}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Daily Macros Section */}
        {dailyNutrition && (
          <div className="pt-6 mt-2 border-t border-border-subtle">
            <h4 className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 text-text-secondary mb-4">
              <Flame className="h-3.5 w-3.5 text-orange-500" />
              Objetivos Diarios (Día Actual)
            </h4>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="flex flex-col p-4 bg-surface-card rounded-xl border border-border-default/60 shadow-card relative overflow-hidden group hover:border-border-default transition-colors">
                <div className="absolute top-0 left-0 w-full h-1 bg-text-secondary"></div>
                <span className="text-[10px] text-text-secondary mb-1 font-semibold uppercase tracking-wider">Calorías</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-black text-text-primary tracking-tight">{totalKcal}</span>
                  <span className="text-[10px] font-bold text-text-muted">kcal</span>
                </div>
              </div>

              <div className="flex flex-col p-4 bg-surface-card rounded-xl border border-border-default/60 shadow-card relative overflow-hidden group hover:border-swim/40 transition-colors">
                <div className="absolute top-0 left-0 w-full h-1 bg-blue-500"></div>
                <span className="text-[10px] text-text-secondary mb-1 font-semibold uppercase tracking-wider">Carbos</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-black text-text-primary tracking-tight">{carbs}</span>
                  <span className="text-[10px] font-bold text-text-muted">g</span>
                </div>
              </div>

              <div className="flex flex-col p-4 bg-surface-card rounded-xl border border-border-default/60 shadow-card relative overflow-hidden group hover:border-run/40 transition-colors">
                <div className="absolute top-0 left-0 w-full h-1 bg-rose-500"></div>
                <span className="text-[10px] text-text-secondary mb-1 font-semibold uppercase tracking-wider">Proteína</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-black text-text-primary tracking-tight">{protein}</span>
                  <span className="text-[10px] font-bold text-text-muted">g</span>
                </div>
              </div>

              <div className="flex flex-col p-4 bg-surface-card rounded-xl border border-border-default/60 shadow-card relative overflow-hidden group hover:border-warning/40 transition-colors">
                <div className="absolute top-0 left-0 w-full h-1 bg-amber-500"></div>
                <span className="text-[10px] text-text-secondary mb-1 font-semibold uppercase tracking-wider">Grasas</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-black text-text-primary tracking-tight">{fat}</span>
                  <span className="text-[10px] font-bold text-text-muted">g</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProCard>
  );
}
