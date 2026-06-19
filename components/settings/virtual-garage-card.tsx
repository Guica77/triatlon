'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wrench, Edit2, X, Check } from 'lucide-react';
import { updateVirtualGarage } from '@/app/(app)/settings/actions';
import { AnimatedButton } from '@/components/ui/animated-button';

const VIRTUAL_GARAGE_ITEMS = [
  { id: 'Bici Carretera', label: 'Bici Carretera', icon: '🚴‍♂️' },
  { id: 'Cabra Triatlón', label: 'Cabra', icon: '🚴‍♂️' },
  { id: 'Neopreno', label: 'Neopreno', icon: '🩱' },
  { id: 'Ruedas de Perfil', label: 'Ruedas Aero', icon: '⭕' },
  { id: 'Potenciómetro', label: 'Vatios', icon: '⚡' },
  { id: 'Casco Aero', label: 'Casco Aero', icon: '🪖' },
  { id: 'Palas de Natación', label: 'Palas', icon: '🎒' },
  { id: 'Aletas de Natación', label: 'Aletas', icon: '🎒' },
];

export function VirtualGarageCard({ initialGarage = [] }: { initialGarage: string[] }) {
  const [isEditing, setIsEditing] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [garage, setGarage] = React.useState<string[]>(initialGarage);

  const toggleGear = (id: string) => {
    setGarage(prev => prev.includes(id) ? prev.filter(g => g !== id) : [...prev, id]);
  };

  const handleSave = async () => {
    setLoading(true);
    await updateVirtualGarage(garage);
    setLoading(false);
    setIsEditing(false);
  };

  return (
    <div className="p-6 rounded-2xl bg-white border border-zinc-200 shadow-sm relative h-full flex flex-col group justify-between">
      <div>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center shadow-sm shrink-0">
              <Wrench className="w-4 h-4 text-amber-600" />
            </div>
            <h3 className="text-sm sm:text-base font-bold text-zinc-900 tracking-tight leading-tight">Garaje Virtual</h3>
          </div>
          <button 
            onClick={() => setIsEditing(true)}
            title="Editar garaje"
            aria-label="Editar garaje"
            className="w-8 h-8 rounded-full bg-zinc-50 border border-zinc-200 flex items-center justify-center text-zinc-500 hover:text-cyan-600 hover:border-cyan-550 hover:bg-cyan-50/50 transition-colors cursor-pointer"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex-1 min-h-[80px]">
          {initialGarage.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-zinc-500 text-xs text-center py-4 font-medium">
              <p>Tu garaje está vacío.</p>
              <p className="text-[10px] text-zinc-400 mt-1">Añade material para el IA Gear Match.</p>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {initialGarage.map(item => {
                const matched = VIRTUAL_GARAGE_ITEMS.find(g => g.id === item);
                return (
                  <div key={item} className="px-3 py-1.5 rounded-lg bg-zinc-50 border border-zinc-200 flex items-center gap-1.5 shadow-sm">
                    <span className="text-sm">{matched?.icon || '🎒'}</span>
                    <span className="text-xs font-semibold text-zinc-700">{matched?.label || item}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {isEditing && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/45 backdrop-blur-sm rounded-2xl"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 10 }}
              className="w-full bg-white border border-zinc-200 rounded-2xl p-5 shadow-2xl relative flex flex-col text-left"
            >
              <button 
                onClick={() => { setGarage(initialGarage); setIsEditing(false); }} 
                title="Cerrar modal"
                aria-label="Cerrar modal"
                className="absolute top-4 right-4 text-zinc-450 hover:text-zinc-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
              
              <h4 className="text-base font-bold text-zinc-900 mb-4">Editar Garaje</h4>
              
              <div className="grid grid-cols-2 gap-2 mb-6 max-h-[200px] overflow-y-auto custom-scrollbar">
                {VIRTUAL_GARAGE_ITEMS.map(item => {
                  const isSelected = garage.includes(item.id);
                  return (
                    <button
                      key={item.id}
                      onClick={() => toggleGear(item.id)}
                      className={`flex items-center gap-2 p-2.5 rounded-xl border transition-all text-left cursor-pointer ${
                        isSelected 
                          ? 'bg-amber-50 border-amber-250 text-amber-700' 
                          : 'bg-zinc-50 border-zinc-200 text-zinc-600 hover:border-zinc-350 hover:bg-zinc-100/50'
                      }`}
                    >
                      <span className="text-sm">{item.icon}</span>
                      <span className="text-xs font-bold flex-1">{item.label}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 shrink-0 text-amber-600" />}
                    </button>
                  );
                })}
              </div>
              
              <AnimatedButton 
                variant="primary" 
                onClick={handleSave} 
                disabled={loading} 
                className="w-full mt-auto py-2.5 text-xs font-black !bg-cyan-650 hover:!bg-cyan-550 !text-white flex justify-center shadow-md cursor-pointer"
              >
                {loading ? 'Guardando...' : 'Confirmar Garaje'}
              </AnimatedButton>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
