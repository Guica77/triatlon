'use client';

import * as React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { Plus, Trash2, Droplets, Activity, Flame, Dumbbell, GripVertical, FileText } from 'lucide-react';
import { AnimatedButton } from '@/components/ui/animated-button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { createLibraryTemplate, deleteLibraryTemplate } from '@/app/(app)/coach/athlete/[id]/actions';

// Icon and color helpers
const SportIcon = ({ type, className }: { type: string, className?: string }) => {
  switch (type?.toLowerCase()) {
    case 'natacion': return <Droplets className={className} />;
    case 'ciclismo': return <Activity className={className} />;
    case 'carrera': return <Flame className={className} />;
    case 'fuerza': return <Dumbbell className={className} />;
    default: return <Activity className={className} />;
  }
};

const getSportAccent = (type: string) => {
  switch (type?.toLowerCase()) {
    case 'natacion': return 'bg-[#00a2e8] text-white';
    case 'ciclismo': return 'bg-[#2ecc71] text-white';
    case 'carrera': return 'bg-[#e74c3c] text-white';
    case 'fuerza': return 'bg-purple-500 text-white';
    default: return 'bg-zinc-600 text-white';
  }
};

const StyledDiv = React.forwardRef<HTMLDivElement, any>(({ styleProps, ...props }, ref) => 
  React.createElement('div', { ref, style: styleProps, ...props })
);
StyledDiv.displayName = 'StyledDiv';

// Draggable Item Component
interface DraggableTemplateProps {
  template: any;
  onDelete: (id: string) => void;
}

function DraggableTemplate({ template, onDelete }: DraggableTemplateProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `template-${template.id}`,
    data: {
      type: 'Template',
      template,
    }
  });

  const style = {
    transform: CSS.Translate.toString(transform),
  };

  return (
    <StyledDiv 
      ref={setNodeRef} 
      styleProps={style} 
      className={`group flex items-center justify-between p-3 mb-2 rounded-xl border bg-white shadow-sm transition-all ${
        isDragging ? 'opacity-50 z-50 shadow-lg border-cyan-500 scale-105' : 'border-zinc-200 hover:border-cyan-300'
      }`}
    >
      <div className="flex items-center gap-3 overflow-hidden">
        <div {...listeners} {...attributes} className="cursor-grab hover:bg-zinc-100 p-1 rounded transition-colors active:cursor-grabbing">
          <GripVertical className="w-4 h-4 text-zinc-400" />
        </div>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${getSportAccent(template.sport_type)}`}>
          <SportIcon type={template.sport_type} className="w-4 h-4" />
        </div>
        <div className="truncate">
          <p className="text-sm font-bold text-zinc-800 truncate">{template.name}</p>
          <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">
            {template.duration_min} min • {template.intensity_type?.toUpperCase() || 'Z2'}
          </p>
        </div>
      </div>
      
      <button 
        title="Eliminar plantilla"
        aria-label="Eliminar plantilla"
        onClick={(e) => { e.stopPropagation(); onDelete(template.id); }}
        className="opacity-0 group-hover:opacity-100 p-1.5 text-zinc-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </StyledDiv>
  );
}

// Main Library Component
interface CoachWorkoutLibraryProps {
  initialTemplates: any[];
}

export function CoachWorkoutLibrary({ initialTemplates }: CoachWorkoutLibraryProps) {
  const [templates, setTemplates] = React.useState(initialTemplates);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  
  // Form State
  const [name, setName] = React.useState('');
  const [sportType, setSportType] = React.useState('ciclismo');
  const [duration, setDuration] = React.useState(60);
  const [intensity, setIntensity] = React.useState('z2');
  const [warmup, setWarmup] = React.useState('');
  const [main, setMain] = React.useState('');
  const [cooldown, setCooldown] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    setTemplates(initialTemplates);
  }, [initialTemplates]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const payload = {
      name,
      sport_type: sportType,
      duration_min: duration,
      intensity_type: intensity,
      warmup,
      main,
      cooldown
    };

    const res = await createLibraryTemplate(payload);
    if (res.data) {
      setTemplates([res.data, ...templates]);
      setIsModalOpen(false);
      // Reset form
      setName(''); setDuration(60); setWarmup(''); setMain(''); setCooldown('');
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar plantilla de la librería?')) return;
    setTemplates(templates.filter(t => t.id !== id));
    await deleteLibraryTemplate(id);
  };

  return (
    <div className="bg-zinc-50 rounded-2xl border border-zinc-200 h-[600px] flex flex-col overflow-hidden">
      <div className="p-4 border-b border-zinc-200 bg-white flex justify-between items-center">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-cyan-600" />
          <h3 className="font-bold text-zinc-800">Librería</h3>
        </div>
        
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <AnimatedButton size="sm" className="!p-1.5 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700">
              <Plus className="w-4 h-4" />
            </AnimatedButton>
          </DialogTrigger>
          <DialogContent className="max-w-md p-6 max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Nueva Plantilla</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4 mt-4">
              <div>
                <label htmlFor="name" className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Nombre</label>
                <input id="name" title="Nombre de la plantilla" aria-label="Nombre de la plantilla" required type="text" value={name} onChange={e => setName(e.target.value)} className="w-full mt-1 p-2 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-cyan-500" placeholder="Ej. Series 5x1000m" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="sportType" className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Deporte</label>
                  <select id="sportType" title="Seleccionar Deporte" aria-label="Seleccionar Deporte" value={sportType} onChange={e => setSportType(e.target.value)} className="w-full mt-1 p-2 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-cyan-500">
                    <option value="ciclismo">Ciclismo</option>
                    <option value="carrera">Carrera</option>
                    <option value="natacion">Natación</option>
                    <option value="fuerza">Fuerza</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="duration" className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Duración (min)</label>
                  <input id="duration" title="Duración en minutos" aria-label="Duración en minutos" required type="number" min={1} value={duration} onChange={e => setDuration(parseInt(e.target.value))} className="w-full mt-1 p-2 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-cyan-500" placeholder="60" />
                </div>
              </div>
              <div>
                <label htmlFor="intensity" className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Intensidad</label>
                <select id="intensity" title="Seleccionar Intensidad" aria-label="Seleccionar Intensidad" value={intensity} onChange={e => setIntensity(e.target.value)} className="w-full mt-1 p-2 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-cyan-500">
                  <option value="z1">Z1 - Recuperación</option>
                  <option value="z2">Z2 - Resistencia</option>
                  <option value="z3">Z3 - Tempo</option>
                  <option value="z4">Z4 - Umbral</option>
                  <option value="z5">Z5 - VO2Max</option>
                </select>
              </div>
              <div>
                <label htmlFor="warmup" className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Calentamiento</label>
                <textarea id="warmup" title="Calentamiento" aria-label="Calentamiento" value={warmup} onChange={e => setWarmup(e.target.value)} className="w-full mt-1 p-2 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-cyan-500 resize-none h-20" placeholder="Ej. 10 min suave" />
              </div>
              <div>
                <label htmlFor="main" className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Parte Principal</label>
                <textarea id="main" title="Parte Principal" aria-label="Parte Principal" required value={main} onChange={e => setMain(e.target.value)} className="w-full mt-1 p-2 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-cyan-500 resize-none h-24" placeholder="Ej. 5x1000m Z4" />
              </div>
              <div>
                <label htmlFor="cooldown" className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Enfriamiento</label>
                <textarea id="cooldown" title="Enfriamiento" aria-label="Enfriamiento" value={cooldown} onChange={e => setCooldown(e.target.value)} className="w-full mt-1 p-2 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-cyan-500 resize-none h-20" placeholder="Ej. 10 min soltar piernas" />
              </div>
              
              <AnimatedButton type="submit" disabled={loading} className="w-full py-3 bg-zinc-900 text-white rounded-xl text-sm font-semibold hover:bg-zinc-800 transition">
                {loading ? 'Guardando...' : 'Guardar Plantilla'}
              </AnimatedButton>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="p-4 overflow-y-auto flex-1 scrollbar-thin">
        {templates.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center opacity-50 space-y-3">
            <FileText className="w-10 h-10 text-zinc-400" />
            <p className="text-xs font-medium text-zinc-500 px-4">Tu librería está vacía. Crea plantillas para arrastrarlas al calendario.</p>
          </div>
        ) : (
          templates.map(t => (
            <DraggableTemplate key={t.id} template={t} onDelete={handleDelete} />
          ))
        )}
      </div>
    </div>
  );
}
