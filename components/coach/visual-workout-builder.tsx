'use client';

import * as React from 'react';
import { Reorder, useDragControls } from 'framer-motion';
import { GripVertical, Trash2, Plus, Flame, HeartPulse, Coffee, Wind, Repeat, AlignLeft } from 'lucide-react';

export type BlockType = 'warmup' | 'active' | 'recovery' | 'cooldown' | 'interval';

export interface WorkoutBlock {
  id: string;
  type: BlockType;
  
  notes?: string;

  // For regular blocks
  targetType?: 'time' | 'distance';
  duration?: number; // minutes
  distance?: number; // meters/km
  zone?: number;

  // For interval blocks
  repeats?: number;
  workTargetType?: 'time' | 'distance';
  workDuration?: number;
  workDistance?: number;
  workZone?: number;
  
  restTargetType?: 'time' | 'distance';
  restDuration?: number;
  restDistance?: number;
  restZone?: number;
}

interface VisualWorkoutBuilderProps {
  blocks: WorkoutBlock[];
  onChange: (blocks: WorkoutBlock[]) => void;
  sportType?: string;
}

const blockConfig: Record<BlockType, { label: string; icon: React.ReactNode; colorClass: string; bgClass: string }> = {
  warmup: { label: 'Calentamiento', icon: <Flame className="w-4 h-4" />, colorClass: 'text-amber-500', bgClass: 'bg-amber-50 border-amber-200' },
  active: { label: 'Principal', icon: <HeartPulse className="w-4 h-4" />, colorClass: 'text-red-500', bgClass: 'bg-red-50 border-red-200' },
  recovery: { label: 'Recuperación', icon: <Coffee className="w-4 h-4" />, colorClass: 'text-emerald-500', bgClass: 'bg-emerald-50 border-emerald-200' },
  cooldown: { label: 'Enfriamiento', icon: <Wind className="w-4 h-4" />, colorClass: 'text-sky-500', bgClass: 'bg-sky-50 border-sky-200' },
  interval: { label: 'Series', icon: <Repeat className="w-4 h-4" />, colorClass: 'text-purple-500', bgClass: 'bg-purple-50 border-purple-200' }
};

function TargetInput({ 
  targetType, 
  duration, 
  distance, 
  onUpdate 
}: { 
  targetType: 'time'|'distance', 
  duration?: number, 
  distance?: number, 
  onUpdate: (targetType: 'time'|'distance', duration?: number, distance?: number) => void 
}) {
  return (
    <div className="flex gap-1">
      <select 
        value={targetType}
        onChange={(e) => onUpdate(e.target.value as 'time'|'distance', duration, distance)}
        className="bg-white border border-zinc-200 rounded-l-md px-1 py-1 text-[10px] font-semibold text-zinc-600 focus:outline-none"
      >
        <option value="time">Min</option>
        <option value="distance">Dist</option>
      </select>
      <input 
        type="number" 
        min="1" 
        className="w-full bg-white border border-zinc-200 rounded-r-md px-2 py-1 text-sm font-semibold text-zinc-800 focus:outline-none focus:border-cyan-500"
        value={targetType === 'time' ? (duration || '') : (distance || '')}
        placeholder={targetType === 'time' ? 'Min' : 'm/km'}
        onChange={(e) => {
           const val = parseInt(e.target.value) || 0;
           if (targetType === 'time') onUpdate(targetType, val, distance);
           else onUpdate(targetType, duration, val);
        }}
      />
    </div>
  );
}

function VisualGraph({ blocks }: { blocks: WorkoutBlock[] }) {
  const expandedBlocks: { zone: number, duration: number, type: string }[] = [];
  
  const getDuration = (b: WorkoutBlock, isRest = false) => {
    const tType = isRest ? b.restTargetType : b.targetType || b.workTargetType;
    const dur = isRest ? b.restDuration : b.duration || b.workDuration;
    const dist = isRest ? b.restDistance : b.distance || b.workDistance;
    
    if (tType === 'distance' && dist) {
       // approximate time to draw proportionally: 1km = 5 min
       return dist > 1000 ? (dist / 1000) * 5 : (dist / 100) * 1.5; 
    }
    return dur || 5;
  };

  blocks.forEach(b => {
    if (b.type === 'interval') {
      const reps = b.repeats || 1;
      for (let i = 0; i < reps; i++) {
        expandedBlocks.push({ zone: b.workZone || 4, duration: getDuration(b, false), type: 'active' });
        expandedBlocks.push({ zone: b.restZone || 1, duration: getDuration(b, true), type: 'recovery' });
      }
    } else {
      expandedBlocks.push({ zone: b.zone || 1, duration: getDuration(b, false), type: b.type });
    }
  });

  const totalDuration = expandedBlocks.reduce((acc, b) => acc + b.duration, 0);
  
  if (totalDuration === 0) return null;

  return (
    <div className="w-full h-24 flex items-end gap-[1px] p-2 bg-zinc-50 border border-zinc-200 rounded-xl overflow-hidden mb-4">
      {expandedBlocks.map((b, i) => {
        const height = `${Math.max(15, (b.zone / 5) * 100)}%`;
        const width = `${(b.duration / totalDuration) * 100}%`;
        let color = 'bg-zinc-300';
        if (b.zone === 1) color = 'bg-zinc-300';
        if (b.zone === 2) color = 'bg-sky-400';
        if (b.zone === 3) color = 'bg-emerald-400';
        if (b.zone === 4) color = 'bg-amber-400';
        if (b.zone === 5) color = 'bg-red-500';
        
        return (
          <div 
            key={i} 
            style={{ width, height }} 
            className={`${color} rounded-t-sm opacity-90 transition-all hover:opacity-100`}
            title={`Zona ${b.zone} - ~${Math.round(b.duration)} min`}
          />
        );
      })}
    </div>
  );
}

export function VisualWorkoutBuilder({ blocks, onChange, sportType }: VisualWorkoutBuilderProps) {
  
  const addBlock = (type: BlockType) => {
    const isSwim = sportType === 'natacion';
    const defaultTargetType = isSwim ? 'distance' : 'time';
    
    let newBlock: WorkoutBlock = {
      id: crypto.randomUUID(),
      type,
      notes: '',
    };

    if (type === 'interval') {
      newBlock = {
        ...newBlock,
        repeats: 4,
        workTargetType: defaultTargetType,
        workDuration: 3,
        workDistance: isSwim ? 100 : 400,
        workZone: 4,
        restTargetType: defaultTargetType,
        restDuration: 1,
        restDistance: isSwim ? 25 : 100,
        restZone: 1
      };
    } else {
      newBlock = {
        ...newBlock,
        targetType: defaultTargetType,
        duration: type === 'warmup' || type === 'cooldown' ? 10 : 5,
        distance: isSwim ? 400 : 1000,
        zone: type === 'active' ? 4 : (type === 'recovery' ? 1 : 2)
      };
    }

    onChange([...blocks, newBlock]);
  };

  const updateBlock = (id: string, updates: Partial<WorkoutBlock>) => {
    onChange(blocks.map(b => b.id === id ? { ...b, ...updates } : b));
  };

  const removeBlock = (id: string) => {
    onChange(blocks.filter(b => b.id !== id));
  };

  return (
    <div className="space-y-2">
      
      {/* Visual Graph */}
      {blocks.length > 0 && <VisualGraph blocks={blocks} />}

      {/* Blocks List */}
      {blocks.length === 0 ? (
        <div className="p-8 border-2 border-dashed border-zinc-200 rounded-xl flex flex-col items-center justify-center text-zinc-400 bg-zinc-50/50 mb-4">
          <p className="text-sm font-medium mb-2">Aún no hay bloques configurados.</p>
          <p className="text-xs text-zinc-500">Añade bloques usando los botones de abajo para crear una estructura visual.</p>
        </div>
      ) : (
        <Reorder.Group axis="y" values={blocks} onReorder={onChange} className="space-y-2 mb-4">
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
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
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
      className={`relative flex items-stretch gap-3 p-3 rounded-xl border bg-white shadow-sm ${config.bgClass.split(' ')[1]}`}
    >
      {/* Drag Handle */}
      <div 
        className="cursor-grab active:cursor-grabbing p-1 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded transition-colors flex items-center"
        onPointerDown={(e) => controls.start(e)}
      >
        <GripVertical className="w-5 h-5" />
      </div>

      {/* Icon */}
      <div className="flex flex-col items-center justify-start py-1">
        <div className={`p-2 rounded-lg bg-white border shadow-sm ${config.colorClass} ${config.bgClass.split(' ')[1]}`}>
          {config.icon}
        </div>
      </div>

      {/* Controls */}
      <div className="flex-1 flex flex-col justify-center gap-2">
        {block.type === 'interval' ? (
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-zinc-700">Repeticiones:</label>
              <input 
                type="number" 
                min="1" 
                value={block.repeats || 4} 
                onChange={e => onUpdate({ repeats: parseInt(e.target.value) || 1 })} 
                className="w-16 bg-zinc-50 border border-zinc-200 rounded px-2 py-1 text-sm font-semibold focus:outline-none focus:border-cyan-500" 
              />
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-red-50/50 p-2 rounded-lg border border-red-100">
                 <label className="text-[10px] font-bold text-red-600 uppercase block mb-1">Trabajo</label>
                 <div className="space-y-1.5">
                    <TargetInput 
                      targetType={block.workTargetType || 'time'} 
                      duration={block.workDuration} 
                      distance={block.workDistance} 
                      onUpdate={(t, dur, dist) => onUpdate({ workTargetType: t, workDuration: dur, workDistance: dist })} 
                    />
                    <select value={block.workZone || 4} onChange={e => onUpdate({ workZone: parseInt(e.target.value)||4 })} className="w-full bg-white border border-red-200 rounded px-2 py-1 text-xs font-semibold text-zinc-800 focus:outline-none">
                      <option value="1">Z1 - Suave</option>
                      <option value="2">Z2 - Aeróbico</option>
                      <option value="3">Z3 - Tempo</option>
                      <option value="4">Z4 - Umbral</option>
                      <option value="5">Z5 - V02Max</option>
                    </select>
                 </div>
              </div>
              <div className="bg-emerald-50/50 p-2 rounded-lg border border-emerald-100">
                 <label className="text-[10px] font-bold text-emerald-600 uppercase block mb-1">Recuperación</label>
                 <div className="space-y-1.5">
                    <TargetInput 
                      targetType={block.restTargetType || 'time'} 
                      duration={block.restDuration} 
                      distance={block.restDistance} 
                      onUpdate={(t, dur, dist) => onUpdate({ restTargetType: t, restDuration: dur, restDistance: dist })} 
                    />
                    <select value={block.restZone || 1} onChange={e => onUpdate({ restZone: parseInt(e.target.value)||1 })} className="w-full bg-white border border-emerald-200 rounded px-2 py-1 text-xs font-semibold text-zinc-800 focus:outline-none">
                      <option value="1">Z1 - Suave</option>
                      <option value="2">Z2 - Aeróbico</option>
                      <option value="3">Z3 - Tempo</option>
                      <option value="4">Z4 - Umbral</option>
                    </select>
                 </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 items-center">
            <div>
              <label className="text-[10px] font-bold text-zinc-500 uppercase block mb-1">Objetivo</label>
              <TargetInput 
                targetType={block.targetType || 'time'} 
                duration={block.duration} 
                distance={block.distance} 
                onUpdate={(t, dur, dist) => onUpdate({ targetType: t, duration: dur, distance: dist })} 
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-zinc-500 uppercase block mb-1">Zona (1-5)</label>
              <select 
                title="Zona de entrenamiento"
                className="w-full bg-zinc-50 border border-zinc-200 rounded-md px-2 py-1 text-sm font-semibold text-zinc-800 focus:outline-none focus:border-cyan-500"
                value={block.zone || 1}
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
        )}

        {/* Notes Toggle */}
        <div className="flex items-center gap-2 mt-1 px-1">
          <AlignLeft className="w-3 h-3 text-zinc-400" />
          <input 
            type="text"
            placeholder="Añadir notas (opcional)..."
            className="w-full bg-transparent border-none text-[11px] text-zinc-600 focus:ring-0 p-0 placeholder:text-zinc-400 focus:outline-none"
            value={block.notes || ''}
            onChange={e => onUpdate({ notes: e.target.value })}
          />
        </div>
      </div>

      {/* Remove */}
      <div className="flex items-start">
        <button 
          type="button"
          onClick={onRemove}
          className="p-2 text-zinc-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors ml-1"
          title="Eliminar bloque"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

    </Reorder.Item>
  );
}
