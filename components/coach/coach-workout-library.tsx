'use client';

import * as React from 'react';
import { createPortal } from 'react-dom';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { createPortal } from 'react-dom';
import { Plus, Trash2, Droplets, Activity, Flame, Dumbbell, GripVertical, FileText, Search } from 'lucide-react';
import { AnimatedButton } from '@/components/ui/animated-button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { createLibraryTemplate, deleteLibraryTemplate, seedDefaultTemplates } from '@/app/(app)/coach/athlete/[id]/actions';

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
  const [isOpen, setIsOpen] = React.useState(false);
  const [isHovered, setIsHovered] = React.useState(false);
  const [hoverCoords, setHoverCoords] = React.useState({ top: 0, left: 0 });
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `template-${template.id}`,
    data: {
      type: 'Template',
      template,
    }
  });
  const [isOpen, setIsOpen] = React.useState(false);
  const [isHovered, setIsHovered] = React.useState(false);
  const [hoverCoords, setHoverCoords] = React.useState({ top: 0, left: 0 });
  const containerRef = React.useRef<HTMLDivElement>(null);

  const style = {
    transform: CSS.Translate.toString(transform),
  };

  const handleMouseEnter = () => {
    if (typeof window !== 'undefined' && window.innerWidth >= 1024 && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setHoverCoords({ top: rect.top, left: rect.right + 10 });
      setIsHovered(true);
    }
  };

  return (
    <>
<<<<<<< HEAD
      <StyledDiv 
        ref={(node: HTMLDivElement) => {
          setNodeRef(node);
          if (node) containerRef.current = node;
        }}
        styleProps={style} 
        onMouseEnter={handleMouseEnter}
        onMouseLeave={() => setIsHovered(false)}
        className={`group flex items-center justify-between p-2 mb-1.5 rounded-lg border bg-white shadow-sm transition-all ${
          isDragging ? 'opacity-50 z-50 shadow-lg border-cyan-500 scale-105' : 'border-zinc-200 hover:border-cyan-300'
        }`}
      >
        <div className="flex items-center gap-2 overflow-hidden flex-1">
          <div {...listeners} {...attributes} className="cursor-grab hover:bg-zinc-100 p-0.5 rounded transition-colors active:cursor-grabbing shrink-0">
            <GripVertical className="w-3.5 h-3.5 text-zinc-400" />
          </div>
          <div 
            className="flex items-center gap-2 flex-1 cursor-pointer truncate"
            onClick={() => setIsOpen(true)}
          >
            <div className={`w-6 h-6 rounded flex items-center justify-center shrink-0 ${getSportAccent(template.sport_type)}`}>
              <SportIcon type={template.sport_type} className="w-3.5 h-3.5" />
            </div>
            <div className="truncate">
              <p className="text-xs font-bold text-zinc-800 truncate group-hover:text-cyan-700 transition-colors">{template.name}</p>
              <p className="text-[9px] text-zinc-500 uppercase tracking-wider font-semibold">
                {template.duration_min} min • {template.intensity_type?.toUpperCase() || 'Z2'}
              </p>
            </div>
          </div>
        </div>
        
        <button 
          title="Eliminar plantilla"
          aria-label="Eliminar plantilla"
          onClick={(e) => { e.stopPropagation(); onDelete(template.id); }}
          className="opacity-0 group-hover:opacity-100 p-1 text-zinc-400 hover:text-red-500 hover:bg-red-50 rounded transition shrink-0"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </StyledDiv>
=======
    <StyledDiv
      ref={setNodeRef}
      styleProps={style}
      onClick={() => setIsOpen(true)}
      onMouseEnter={(e: React.MouseEvent) => {
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        setHoverCoords({ top: rect.top, left: rect.right + 8 });
        setIsHovered(true);
      }}
      onMouseLeave={() => setIsHovered(false)}
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
>>>>>>> prueba

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-sm p-6">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${getSportAccent(template.sport_type)}`}>
                <SportIcon type={template.sport_type} className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-lg font-black text-zinc-900 leading-tight">{template.name}</DialogTitle>
                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mt-1">
                  {template.sport_type} • {template.duration_min} MIN • {template.intensity_type?.toUpperCase() || 'Z2'}
                </p>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-3 mt-2">
            {template.warmup && (
              <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-100">
                <p className="text-[10px] font-black uppercase text-zinc-400 mb-1 tracking-wider">Calentamiento</p>
                <p className="text-xs text-zinc-700 font-medium whitespace-pre-wrap">{template.warmup}</p>
              </div>
            )}
            
            {template.main && (
              <div className="p-3 bg-cyan-50 rounded-xl border border-cyan-100">
                <p className="text-[10px] font-black uppercase text-cyan-600 mb-1 tracking-wider">Parte Principal</p>
                <p className="text-sm text-zinc-800 font-bold whitespace-pre-wrap leading-relaxed">{template.main}</p>
              </div>
            )}
            
            {template.cooldown && (
              <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-100">
                <p className="text-[10px] font-black uppercase text-zinc-400 mb-1 tracking-wider">Enfriamiento</p>
                <p className="text-xs text-zinc-700 font-medium whitespace-pre-wrap">{template.cooldown}</p>
              </div>
            )}
            
            {!template.warmup && !template.main && !template.cooldown && (
              <p className="text-sm text-zinc-500 italic text-center py-4">No hay descripción detallada para esta plantilla.</p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Hover Card para Desktop */}
      {isHovered && typeof document !== 'undefined' && createPortal(
<<<<<<< HEAD
        <div 
=======
        <div
>>>>>>> prueba
          style={{ top: hoverCoords.top, left: hoverCoords.left }}
          className="fixed z-[100] w-80 bg-white rounded-xl shadow-2xl border border-zinc-200 p-5 pointer-events-none animate-in fade-in zoom-in-95 duration-200"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${getSportAccent(template.sport_type)}`}>
              <SportIcon type={template.sport_type} className="w-4 h-4" />
            </div>
            <div>
              <p className="text-sm font-black text-zinc-900 leading-tight">{template.name}</p>
              <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider mt-0.5">
                {template.sport_type} • {template.duration_min} MIN • {template.intensity_type?.toUpperCase() || 'Z2'}
              </p>
            </div>
          </div>
          <div className="space-y-2">
            {template.warmup && (
              <div className="p-2 bg-zinc-50 rounded-lg border border-zinc-100">
                <p className="text-[9px] font-black uppercase text-zinc-400 mb-0.5 tracking-wider">Calentamiento</p>
                <p className="text-xs text-zinc-700 font-medium whitespace-pre-wrap">{template.warmup}</p>
              </div>
            )}
            {template.main && (
              <div className="p-2 bg-cyan-50 rounded-lg border border-cyan-100">
                <p className="text-[9px] font-black uppercase text-cyan-600 mb-0.5 tracking-wider">Parte Principal</p>
                <p className="text-xs text-zinc-800 font-bold whitespace-pre-wrap leading-relaxed">{template.main}</p>
              </div>
            )}
            {template.cooldown && (
              <div className="p-2 bg-zinc-50 rounded-lg border border-zinc-100">
                <p className="text-[9px] font-black uppercase text-zinc-400 mb-0.5 tracking-wider">Enfriamiento</p>
                <p className="text-xs text-zinc-700 font-medium whitespace-pre-wrap">{template.cooldown}</p>
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </>
  );
}

// Main Library Component
interface CoachWorkoutLibraryProps {
  initialTemplates: any[];
}

export function CoachWorkoutLibrary({ initialTemplates }: CoachWorkoutLibraryProps) {
  const [templates, setTemplates] = React.useState(initialTemplates);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  
  // Search and Filters
  const [searchQuery, setSearchQuery] = React.useState('');
  const [sportFilter, setSportFilter] = React.useState('all');
  const [intensityFilter, setIntensityFilter] = React.useState('all');
  
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

  const filteredTemplates = templates.filter(t => {
    const matchesSearch = t.name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSport = sportFilter === 'all' || t.sport_type?.toLowerCase() === sportFilter;
    const matchesIntensity = intensityFilter === 'all' || t.intensity_type?.toLowerCase() === intensityFilter;
    return matchesSearch && matchesSport && matchesIntensity;
  });

  return (
    <div className="bg-zinc-50 rounded-2xl border border-zinc-200 h-[600px] flex flex-col overflow-hidden">
      <div className="p-3 border-b border-zinc-200 bg-white flex flex-col gap-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-cyan-600" />
            <h3 className="font-bold text-zinc-800 text-sm">Librería</h3>
          </div>
          
          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogTrigger asChild>
              <AnimatedButton size="sm" className="!p-1 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700">
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

        {/* Filters and Search */}
        <div className="flex flex-col gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input 
              type="text" 
              placeholder="Buscar entrenamiento..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-zinc-50 border border-zinc-200 rounded-lg outline-none focus:ring-1 focus:ring-cyan-500"
            />
          </div>
          <div className="flex gap-2">
            <select 
              aria-label="Filtro de Deporte"
              title="Filtro de Deporte"
              value={sportFilter} 
              onChange={e => setSportFilter(e.target.value)}
              className="flex-1 text-[10px] uppercase font-bold text-zinc-600 bg-zinc-50 border border-zinc-200 rounded-lg py-1 px-2 outline-none"
            >
              <option value="all">Deporte</option>
              <option value="carrera">Carrera</option>
              <option value="ciclismo">Ciclismo</option>
              <option value="natacion">Natación</option>
              <option value="fuerza">Fuerza</option>
            </select>
            <select 
              aria-label="Filtro de Intensidad"
              title="Filtro de Intensidad"
              value={intensityFilter} 
              onChange={e => setIntensityFilter(e.target.value)}
              className="w-20 text-[10px] uppercase font-bold text-zinc-600 bg-zinc-50 border border-zinc-200 rounded-lg py-1 px-2 outline-none"
            >
              <option value="all">Intens</option>
              <option value="z1">Z1</option>
              <option value="z2">Z2</option>
              <option value="z3">Z3</option>
              <option value="z4">Z4</option>
              <option value="z5">Z5</option>
            </select>
          </div>
        </div>
      </div>

      <div className="p-3 overflow-y-auto flex-1 scrollbar-thin">
        {filteredTemplates.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center opacity-70 space-y-4 p-4">
            <FileText className="w-10 h-10 text-zinc-300" />
            <p className="text-xs font-medium text-zinc-500">
              {templates.length === 0 ? 'Tu librería está vacía. Crea plantillas para arrastrarlas al calendario.' : 'No hay plantillas que coincidan con los filtros.'}
            </p>
            {templates.length === 0 && (
              <AnimatedButton 
                variant="ghost" 
                size="sm" 
                className="text-xs font-semibold mt-4 border border-cyan-200 text-cyan-600 hover:bg-cyan-50"
                onClick={async () => {
                  await seedDefaultTemplates();
                  window.location.reload();
                }}
              >
                Cargar Entrenos Profesionales (TP)
              </AnimatedButton>
            )}
          </div>
        ) : (
          filteredTemplates.map(t => (
            <DraggableTemplate key={t.id} template={t} onDelete={handleDelete} />
          ))
        )}
      </div>
    </div>
  );
}
