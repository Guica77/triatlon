'use client';

import * as React from 'react';
import { Reorder, useDragControls } from 'framer-motion';
import { GripVertical, Trash2, Plus, Flame, HeartPulse, Coffee, Wind } from 'lucide-react';

export type BlockType = 'warmup' | 'active' | 'recovery' | 'cooldown';

export interface WorkoutBlock {
  id: string;
  type: BlockType;
  duration: number;
  zone: number;
}

interface VisualWorkoutBuilderProps {
  blocks: WorkoutBlock[];
  onChange: (blocks: WorkoutBlock[]) => void;
}

const blockConfig: Record<BlockType, { label: string; icon: React.ReactNode; colorClass: string; bgClass: string }> = {
  warmup: { label: 'Calentamiento', icon: <Flame className="w-4 h-4" />, colorClass: 'text-amber-500', bgClass: 'bg-amber-50 border-amber-200' },
  active: { label: 'Principal', icon: <HeartPulse className="w-4 h-4" />, colorClass: 'text-red-500', bgClass: 'bg-red-50 border-red-200' },
  recovery: { label: 'Recuperación', icon: <Coffee className="w-4 h-4" />, colorClass: 'text-emerald-500', bgClass: 'bg-emerald-50 border-emerald-200' },
  cooldown: { label: 'Enfriamiento', icon: <Wind className="w-4 h-4" />, colorClass: 'text-sky-500', bgClass: 'bg-sky-50 border-sky-200' }
};

export function VisualWorkoutBuilder({ blocks, onChange }: VisualWorkoutBuilderProps) {
  
  const addBlock = (type: BlockType) => {
    const newBlock: WorkoutBlock = {
      id: crypto.randomUUID(),
      type,
      duration: type === 'warmup' || type === 'cooldown' ? 10 : 5,
      zone: type === 'active' ? 4 : (type === 'recovery' ? 1 : 2)
    };
    onChange([...blocks, newBlock]);
  };

  const updateBlock = (id: string, updates: Partial<WorkoutBlock>) => {
    onChange(blocks.map(b => b.id === id ? { ...b, ...updates } : b));
  };

  const removeBlock = (id: string) => {
    onChange(blocks.filter(b => b.id !== id));
  };

  return (
    <div className="space-y-4">
      
      {/* Blocks List */}
      {blocks.length === 0 ? (
        <div className="p-8 border-2 border-dashed border-zinc-200 rounded-xl flex flex-col items-center justify-center text-zinc-400 bg-zinc-50/50">
          <p className="text-sm font-medium mb-2">Aún no hay bloques configurados.</p>
          <p className="text-xs text-zinc-500">Añade bloques usando los botones de abajo para crear una estructura visual.</p>
        </div>
      ) : (
        <Reorder.Group axis="y" values={blocks} onReorder={onChange} className="space-y-2">
          {blocks.map((block) => (
            <BlockItem 
              key={block.id} 
              block={block} 
              onUpdate={(updates) => updateBlock(block.id, updates)} 
              onRemove={() => removeBlock(block.id)} 
            />
          ))}
        </Reorder.Group>
      )}

      {/* Add Controls */}
      <div className="pt-2 border-t border-zinc-100">
        <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">Añadir Bloque</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {(Object.keys(blockConfig) as BlockType[]).map((type) => {
            const config = blockConfig[type];
            return (
              <button
                key={type}
                type="button"
                onClick={() => addBlock(type)}
                className={`flex flex-col items-center justify-center gap-1.5 p-3 rounded-lg border transition-all hover:shadow-sm ${config.bgClass} hover:opacity-90`}
              >
                <div className={config.colorClass}>{config.icon}</div>
                <span className={`text-[10px] font-bold uppercase tracking-wide ${config.colorClass}`}>{config.label}</span>
              </button>
            )
          })}
        </div>
      </div>

    </div>
  );
}

function BlockItem({ block, onUpdate, onRemove }: { block: WorkoutBlock, onUpdate: (u: Partial<WorkoutBlock>) => void, onRemove: () => void }) {
  const controls = useDragControls();
  const config = blockConfig[block.type];

  return (
    <Reorder.Item
      value={block}
      dragListener={false}
      dragControls={controls}
      className={`relative flex items-center gap-3 p-3 rounded-xl border bg-white shadow-sm ${config.bgClass.split(' ')[1]}`}
    >
      {/* Drag Handle */}
      <div 
        className="cursor-grab active:cursor-grabbing p-1 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded transition-colors"
        onPointerDown={(e) => controls.start(e)}
      >
        <GripVertical className="w-5 h-5" />
      </div>

      {/* Icon */}
      <div className={`p-2 rounded-lg bg-white border shadow-sm ${config.colorClass} ${config.bgClass.split(' ')[1]}`}>
        {config.icon}
      </div>

      {/* Controls */}
      <div className="flex-1 grid grid-cols-2 gap-3 items-center">
        <div>
          <label className="text-[10px] font-bold text-zinc-500 uppercase block mb-1">Duración (min)</label>
          <input 
            type="number" 
            min="1" 
            className="w-full bg-zinc-50 border border-zinc-200 rounded-md px-2 py-1 text-sm font-semibold text-zinc-800 focus:outline-none focus:border-cyan-500"
            value={block.duration}
            onChange={(e) => onUpdate({ duration: parseInt(e.target.value) || 0 })}
          />
        </div>
        <div>
          <label className="text-[10px] font-bold text-zinc-500 uppercase block mb-1">Zona (1-5)</label>
          <select 
            className="w-full bg-zinc-50 border border-zinc-200 rounded-md px-2 py-1 text-sm font-semibold text-zinc-800 focus:outline-none focus:border-cyan-500"
            value={block.zone}
            onChange={(e) => onUpdate({ zone: parseInt(e.target.value) || 1 })}
          >
            <option value="1">Z1 - Suave</option>
            <option value="2">Z2 - Aeróbico</option>
            <option value="3">Z3 - Tempo</option>
            <option value="4">Z4 - Umbral</option>
            <option value="5">Z5 - V02Max</option>
          </select>
        </div>
      </div>

      {/* Remove */}
      <button 
        type="button"
        onClick={onRemove}
        className="p-2 text-zinc-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors ml-2"
        title="Eliminar bloque"
      >
        <Trash2 className="w-4 h-4" />
      </button>

    </Reorder.Item>
  );
}
