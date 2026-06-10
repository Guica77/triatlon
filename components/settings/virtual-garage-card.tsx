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
    <div className="p-6 rounded-2xl bg-[#18181b] border border-zinc-800 shadow-xl relative h-full flex flex-col group">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
            <Wrench className="w-4 h-4 text-amber-400" />
          </div>
          <h3 className="text-base font-bold text-zinc-100">Garaje Virtual</h3>
        </div>
        <button 
          onClick={() => setIsEditing(true)}
          className="w-8 h-8 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-amber-400 hover:border-amber-500/30 transition-colors"
        >
          <Edit2 className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="flex-1">
        {initialGarage.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-zinc-500 text-sm text-center py-4">
            <p>Tu garaje está vacío.</p>
            <p className="text-xs mt-1">Añade material para el IA Gear Match.</p>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {initialGarage.map(item => {
              const matched = VIRTUAL_GARAGE_ITEMS.find(g => g.id === item);
              return (
                <div key={item} className="px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center gap-1.5 shadow-sm">
                  <span className="text-sm">{matched?.icon || '🎒'}</span>
                  <span className="text-xs font-semibold text-zinc-300">{matched?.label || item}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <AnimatePresence>
        {isEditing && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm rounded-2xl"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 10 }}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl p-5 shadow-2xl relative flex flex-col"
            >
              <button onClick={() => { setGarage(initialGarage); setIsEditing(false); }} className="absolute top-4 right-4 text-zinc-500 hover:text-white">
                <X className="w-4 h-4" />
              </button>
              
              <h4 className="text-lg font-bold text-white mb-4">Editar Garaje</h4>
              
              <div className="grid grid-cols-2 gap-2 mb-6 max-h-[200px] overflow-y-auto scrollbar-none">
                {VIRTUAL_GARAGE_ITEMS.map(item => {
                  const isSelected = garage.includes(item.id);
                  return (
                    <button
                      key={item.id}
                      onClick={() => toggleGear(item.id)}
                      className={`flex items-center gap-2 p-2.5 rounded-xl border transition-all text-left ${
                        isSelected 
                          ? 'bg-amber-500/10 border-amber-500/50 text-amber-400' 
                          : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                      }`}
                    >
                      <span className="text-lg">{item.icon}</span>
                      <span className="text-xs font-bold flex-1">{item.label}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 shrink-0" />}
                    </button>
                  );
                })}
              </div>
              
              <AnimatedButton variant="primary" onClick={handleSave} disabled={loading} className="w-full mt-auto py-2.5 text-sm !bg-amber-500 hover:!bg-amber-400 !text-black flex justify-center">
                {loading ? 'Guardando...' : 'Confirmar Garaje'}
              </AnimatedButton>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
