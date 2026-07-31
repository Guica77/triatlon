'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, ChevronLeft, ChevronRight } from 'lucide-react';
import { ProCard } from '@/components/ui/pro-card';
import { AnimatedButton } from '@/components/ui/animated-button';

interface StepPhysiologyProps {
  wantsCoach: boolean;
  setWantsCoach: (v: boolean) => void;
  inviteCode?: string;
  setInviteCode?: (v: string) => void;
  onNext: () => void;
  onPrev: () => void;
  preferredIngredients: string[];
  setPreferredIngredients: (v: string[]) => void;
  allergies: string[];
  setAllergies: (v: string[]) => void;
  dislikedIngredients: string[];
  setDislikedIngredients: (v: string[]) => void;
  isFirstStep?: boolean;
}

const INGREDIENTS_OPTIONS = [
  // Carbohidratos
  { id: 'pasta', label: 'Pasta', category: 'Carbohidratos' },
  { id: 'arroz', label: 'Arroz', category: 'Carbohidratos' },
  { id: 'patata', label: 'Patatas', category: 'Carbohidratos' },
  { id: 'avena', label: 'Avena', category: 'Carbohidratos' },
  { id: 'quinoa', label: 'Quinoa', category: 'Carbohidratos' },
  { id: 'boniato', label: 'Boniato', category: 'Carbohidratos' },
  { id: 'pan_integral', label: 'Pan Integral', category: 'Carbohidratos' },
  { id: 'cuscus', label: 'Cuscús', category: 'Carbohidratos' },
  
  // Frutas (Alta y Baja fructosa)
  { id: 'platano', label: 'Plátano', category: 'Frutas' },
  { id: 'manzana', label: 'Manzana', category: 'Frutas' },
  { id: 'frutos_rojos', label: 'Frutos Rojos', category: 'Frutas' },
  { id: 'naranja', label: 'Naranja / Cítricos', category: 'Frutas' },
  { id: 'kiwi', label: 'Kiwi', category: 'Frutas' },
  { id: 'pina', label: 'Piña', category: 'Frutas' },
  { id: 'melon_sandia', label: 'Melón / Sandía', category: 'Frutas' },
  
  // Verduras
  { id: 'espinacas', label: 'Espinacas / Hoja Verde', category: 'Verduras' },
  { id: 'zanahoria', label: 'Zanahoria', category: 'Verduras' },
  { id: 'calabacin', label: 'Calabacín', category: 'Verduras' },
  { id: 'berenjena', label: 'Berenjena', category: 'Verduras' },
  { id: 'calabaza', label: 'Calabaza', category: 'Verduras' },
  
  // Proteínas Animales
  { id: 'pollo', label: 'Pollo', category: 'Proteínas' },
  { id: 'pavo', label: 'Pavo', category: 'Proteínas' },
  { id: 'salmon', label: 'Salmón', category: 'Proteínas' },
  { id: 'pescado_blanco', label: 'Pescado Blanco', category: 'Proteínas' },
  { id: 'atun', label: 'Atún', category: 'Proteínas' },
  { id: 'ternera', label: 'Ternera', category: 'Proteínas' },
  { id: 'cerdo_magro', label: 'Cerdo (Magro)', category: 'Proteínas' },
  { id: 'huevo', label: 'Huevos', category: 'Proteínas' },
  
  // Proteínas Vegetales / Legumbres
  { id: 'tofu', label: 'Tofu / Tempeh', category: 'Proteína Veg.' },
  { id: 'soja', label: 'Soja Texturizada', category: 'Proteína Veg.' },
  { id: 'lentejas', label: 'Lentejas', category: 'Legumbres' },
  { id: 'garbanzos', label: 'Garbanzos', category: 'Legumbres' },
  { id: 'alubias', label: 'Alubias', category: 'Legumbres' },
  
  // Grasas Saludables
  { id: 'aguacate', label: 'Aguacate', category: 'Grasas' },
  { id: 'frutos_secos', label: 'Frutos Secos', category: 'Grasas' },
  { id: 'aceite_oliva', label: 'Aceite de Oliva', category: 'Grasas' },
  { id: 'semillas', label: 'Semillas (Chía, Lino)', category: 'Grasas' },
  
  // Lácteos
  { id: 'queso', label: 'Queso', category: 'Lácteos' },
  { id: 'yogur', label: 'Yogur / Kéfir', category: 'Lácteos' },
  { id: 'leche', label: 'Leche', category: 'Lácteos' },
  
  // Suplementos & Recuperación Rápida
  { id: 'whey', label: 'Proteína Whey', category: 'Suplementos' },
  { id: 'creatina', label: 'Creatina', category: 'Suplementos' },
  { id: 'magnesio', label: 'Magnesio', category: 'Suplementos' },
  { id: 'omega3', label: 'Omega 3', category: 'Suplementos' },
  { id: 'vitamina_c', label: 'Vitamina C', category: 'Vitaminas' },
  { id: 'hierro', label: 'Hierro', category: 'Vitaminas' },
  { id: 'bcaa', label: 'BCAAs / Aminoácidos', category: 'Suplementos' },
  { id: 'geles', label: 'Geles Deportivos', category: 'Intra-Entreno' },
  { id: 'iso', label: 'Bebida Isotónica', category: 'Intra-Entreno' },
];

const ALLERGIES_OPTIONS = [
  // Los 14 Alérgenos principales (Reglamento UE)
  { id: 'gluten', label: 'Gluten / Cereales', category: 'Alérgeno (UE)' },
  { id: 'crustaceos', label: 'Crustáceos', category: 'Alérgeno (UE)' },
  { id: 'huevos', label: 'Huevos', category: 'Alérgeno (UE)' },
  { id: 'pescado', label: 'Pescado', category: 'Alérgeno (UE)' },
  { id: 'cacahuetes', label: 'Cacahuetes', category: 'Alérgeno (UE)' },
  { id: 'soja', label: 'Soja', category: 'Alérgeno (UE)' },
  { id: 'lactosa', label: 'Lácteos / Lactosa', category: 'Alérgeno (UE)' },
  { id: 'frutos_secos', label: 'Frutos de Cáscara', category: 'Alérgeno (UE)' },
  { id: 'apio', label: 'Apio', category: 'Alérgeno (UE)' },
  { id: 'mostaza', label: 'Mostaza', category: 'Alérgeno (UE)' },
  { id: 'sesamo', label: 'Sésamo', category: 'Alérgeno (UE)' },
  { id: 'sulfitos', label: 'Sulfitos', category: 'Alérgeno (UE)' },
  { id: 'altramuces', label: 'Altramuces', category: 'Alérgeno (UE)' },
  { id: 'moluscos', label: 'Moluscos', category: 'Alérgeno (UE)' },
  // Intolerancias comunes adicionales
  { id: 'fructosa', label: 'Fructosa', category: 'Intolerancia' },
  { id: 'histamina', label: 'Histamina', category: 'Intolerancia' },
  { id: 'sorbitol', label: 'Sorbitol', category: 'Intolerancia' },
];

const DISLIKED_OPTIONS = [
  { id: 'ajo_cebolla', label: 'Ajo / Cebolla', category: 'Vegetales Fuertes' },
  { id: 'brocoli', label: 'Brócoli / Col', category: 'Vegetales Fuertes' },
  { id: 'cilantro', label: 'Cilantro', category: 'Hierbas' },
  { id: 'pescado_azul', label: 'Pescado Azul', category: 'Pescado' },
  { id: 'carne_roja', label: 'Carne Roja', category: 'Carne' },
  { id: 'picante', label: 'Comida Picante', category: 'Especias' },
  { id: 'tomate', label: 'Tomate', category: 'Vegetales' },
  { id: 'champiñones', label: 'Setas / Champiñones', category: 'Vegetales' },
  { id: 'aceitunas', label: 'Aceitunas', category: 'Encurtidos' },
  { id: 'pimiento', label: 'Pimiento', category: 'Vegetales Fuertes' },
  { id: 'berpimiento', label: 'Berenjena', category: 'Vegetales' },
  { id: 'legumbres_enteras', label: 'Legumbres Enteras', category: 'Legumbres' },
  { id: 'queso_fuerte', label: 'Quesos Fuertes/Azules', category: 'Lácteos' },
  { id: 'cafe', label: 'Café / Cafeína', category: 'Bebidas' },
  { id: 'endulzantes', label: 'Edulcorantes Artif.', category: 'Aditivos' },
];

export function StepPhysiology(props: StepPhysiologyProps) {
  return (
    <motion.div key="step2" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-6">
      <ProCard className="space-y-6 bg-surface-card border border-border-default shadow-card">
        <div className="border-b border-border-default pb-4">
          <h2 className="text-xl font-bold text-text-primary flex items-center gap-2"><Activity className="w-5 h-5 text-swim" /> Calibración Fisiológica</h2>
          <p className="text-sm text-text-secondary mt-1">Introduce tus zonas actuales. Si no las sabes, las estimaremos automáticamente por IA.</p>
        </div>

        <div className="space-y-4">
          <label className="text-xs font-bold text-text-muted block uppercase tracking-wider">Modalidad de Entrenamiento</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={() => props.setWantsCoach(false)}
              className={`p-4 rounded-xl border text-left transition-all flex flex-col gap-1.5 cursor-pointer ${
                !props.wantsCoach 
                  ? 'bg-swim/10 border-swim text-swim ring-1 ring-swim ' 
                  : 'bg-surface-hover/30 border-border-default text-text-secondary hover:border-border-default'
              }`}
            >
              <div className="flex justify-between items-center w-full">
                <span className="font-bold text-sm">IA Autónoma</span>
                {!props.wantsCoach && <div className="w-2 h-2 rounded-full bg-swim animate-pulse" />}
              </div>
              <span className="text-[10px] opacity-80 font-semibold">Planificación 100% generada por IA</span>
            </button>
            
            <button
              onClick={() => props.setWantsCoach(true)}
              className={`p-4 rounded-xl border text-left transition-all flex flex-col gap-1.5 cursor-pointer ${
                props.wantsCoach 
                  ? 'bg-coral-500/10 border-coral-500 text-coral-500 ring-1 ring-coral-500 ' 
                  : 'bg-surface-hover/30 border-border-default text-text-secondary hover:border-border-default'
              }`}
            >
              <div className="flex justify-between items-center w-full">
                <span className="font-bold text-sm">Entrenador Humano</span>
                {props.wantsCoach && <div className="w-2 h-2 rounded-full bg-coral-500 animate-pulse" />}
              </div>
              <span className="text-[10px] opacity-80 font-semibold">Solicitar conexión con un Coach (Recomendado)</span>
            </button>
          </div>
        </div>

        <AnimatePresence mode="popLayout">
          {props.wantsCoach && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="pt-4 border-t border-border-default text-center space-y-2"
            >
              <p className="text-sm text-text-primary font-medium">Has elegido entrenar con un profesional.</p>
              <p className="text-xs text-text-secondary">Saltaremos la calibración automática y el garaje. En el siguiente paso podrás usar tu código o buscar uno.</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Sección de Preferencias de Alimentos para Nutrición */}
        <div className="pt-6 border-t border-border-default space-y-6">
          {/* 1. Ingredientes Preferidos */}
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-text-secondary block uppercase tracking-wider">
                Ingredientes Preferidos para Recuperación
              </label>
              <p className="text-xs text-text-secondary mt-1">
                Selecciona tus alimentos favoritos. La IA los priorizará al sugerir tus comidas post-entrenamiento.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
              {INGREDIENTS_OPTIONS.map((ing) => {
                const isSelected = props.preferredIngredients.includes(ing.id);
                return (
                  <button
                    key={ing.id}
                    type="button"
                    onClick={() => {
                      if (isSelected) {
                        props.setPreferredIngredients(props.preferredIngredients.filter(x => x !== ing.id));
                      } else {
                        props.setPreferredIngredients([...props.preferredIngredients, ing.id]);
                      }
                    }}
                    className={`p-3 rounded-xl border text-center transition-all cursor-pointer flex flex-col justify-between items-center ${
                      isSelected
                        ? 'bg-bike/10 border-bike text-bike ring-1 ring-bike  font-semibold'
                        : 'bg-surface-hover/50 border-border-default text-text-secondary hover:bg-surface-hover hover:border-border-default'
                    }`}
                  >
                    <span className="text-xs font-bold">{ing.label}</span>
                    <span className="text-[9px] text-text-muted uppercase font-bold mt-1 tracking-wider">{ing.category}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Alergias Alimentarias */}
          <div className="space-y-4 pt-4 border-t border-border-default">
            <div>
              <label className="text-xs font-bold text-danger/90 block uppercase tracking-wider">
                Alergias o Intolerancias Alimentarias
              </label>
              <p className="text-xs text-text-secondary mt-1">
                Indica si sufres de alguna intolerancia. Excluiremos automáticamente cualquier ingrediente relacionado de tus sugerencias de combustible.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-6 gap-2.5">
              {ALLERGIES_OPTIONS.map((alg) => {
                const isSelected = props.allergies.includes(alg.id);
                return (
                  <button
                    key={alg.id}
                    type="button"
                    onClick={() => {
                      if (isSelected) {
                        props.setAllergies(props.allergies.filter(x => x !== alg.id));
                      } else {
                        props.setAllergies([...props.allergies, alg.id]);
                      }
                    }}
                    className={`p-3 rounded-xl border text-center transition-all cursor-pointer flex flex-col justify-between items-center ${
                      isSelected
                        ? 'bg-danger/10 border-danger/40 text-danger ring-1 ring-danger/40  font-semibold'
                        : 'bg-surface-hover/50 border-border-default text-text-secondary hover:bg-surface-hover hover:border-border-default'
                    }`}
                  >
                    <span className="text-xs font-bold">{alg.label}</span>
                    <span className="text-[9px] text-danger/50 uppercase font-bold mt-1 tracking-wider">{alg.category}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Ingredientes a Evitar */}
          <div className="space-y-4 pt-4 border-t border-border-default">
            <div>
              <label className="text-xs font-bold text-warning/90 block uppercase tracking-wider">
                Ingredientes que prefieres evitar
              </label>
              <p className="text-xs text-text-secondary mt-1">
                Alimentos que no te gustan o prefieres no incluir en tu plan de nutrición.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-6 gap-2.5">
              {DISLIKED_OPTIONS.map((dis) => {
                const isSelected = props.dislikedIngredients.includes(dis.id);
                return (
                  <button
                    key={dis.id}
                    type="button"
                    onClick={() => {
                      if (isSelected) {
                        props.setDislikedIngredients(props.dislikedIngredients.filter(x => x !== dis.id));
                      } else {
                        props.setDislikedIngredients([...props.dislikedIngredients, dis.id]);
                      }
                    }}
                    className={`p-3 rounded-xl border text-center transition-all cursor-pointer flex flex-col justify-between items-center ${
                      isSelected
                        ? 'bg-warning/10 border-warning/40 text-warning ring-1 ring-warning/40  font-semibold'
                        : 'bg-surface-hover/50 border-border-default text-text-secondary hover:bg-surface-hover hover:border-border-default'
                    }`}
                  >
                    <span className="text-xs font-bold">{dis.label}</span>
                    <span className="text-[9px] text-warning/50 uppercase font-bold mt-1 tracking-wider">{dis.category}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
        
        <div className="flex justify-between pt-4 border-t border-border-default">
          {!props.isFirstStep ? (
            <button onClick={props.onPrev} className="px-6 py-3 text-sm font-semibold text-text-secondary hover:text-text-primary transition flex items-center cursor-pointer"><ChevronLeft className="w-4 h-4 mr-1" /> Atrás</button>
          ) : (
            <div />
          )}
          <AnimatedButton variant="primary" onClick={() => {
            if (props.preferredIngredients.length < 3) {
              alert('Por favor, selecciona al menos 3 ingredientes preferidos para que la IA pueda generar tus recetas.');
              return;
            }
            props.onNext();
          }} className="px-8 py-3 text-sm !bg-swim hover:!bg-swim/90 !text-white">
            {props.wantsCoach ? 'Siguiente' : 'Continuar'} <ChevronRight className="w-4 h-4 ml-1" />
          </AnimatedButton>
        </div>
      </ProCard>
    </motion.div>
  );
}
