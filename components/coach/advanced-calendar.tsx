'use client';

import * as React from 'react';
import { 
  DndContext, 
  DragOverlay, 
  closestCorners, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors, 
  DragStartEvent, 
  DragOverEvent, 
  DragEndEvent,
  defaultDropAnimationSideEffects
} from '@dnd-kit/core';
import { 
  SortableContext, 
  arrayMove, 
  sortableKeyboardCoordinates, 
  verticalListSortingStrategy 
} from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useDroppable } from '@dnd-kit/core';
import { Calendar, GripVertical, Activity, Flame, Droplets, Dumbbell } from 'lucide-react';
import { format, parseISO, addDays, startOfWeek } from 'date-fns';
import { es } from 'date-fns/locale';
import { EditWorkoutModal, EditWorkoutData } from './edit-workout-modal';
import { CoachWorkoutLibrary } from './coach-workout-library';

// --- Types ---
export interface WorkoutItem {
  id: string;
  scheduled_date: string;
  status: string | null;
  actual_tss?: number | null;
  rpe?: number | null;
  feelings?: string | null;
  training_sessions?: {
    sport_type: string | null;
    duration_min: number | null;
    description: string | null;
    structured_blocks?: any[] | null;
  } | null;
  universal_telemetry?: any[];
}

interface AdvancedCalendarProps {
  workouts: WorkoutItem[];
  onWorkoutMove: (workoutId: string, newDate: string) => Promise<void>;
  startDate?: Date; // Usually the Monday of the current week
  athleteId?: string; // Needed for EditWorkoutModal
  libraryTemplates?: any[];
  onTemplateDrop?: (templateId: string, date: string) => Promise<void>;
}

// --- Helper for parsing description ---
function parseDescription(desc: string | null) {
  if (!desc) return { warmup: '', main: '', cooldown: '', title: '' };
  
  let warmup = '';
  let main = '';
  let cooldown = '';
  let title = '';

  const lines = desc.split('\n');
  lines.forEach(line => {
    if (line.startsWith('Calentamiento: ')) {
      warmup = line.replace('Calentamiento: ', '');
    } else if (line.startsWith('Parte principal: ')) {
      const mainPart = line.replace('Parte principal: ', '');
      if (mainPart.startsWith('**') && mainPart.includes('** - ')) {
        const parts = mainPart.split('** - ');
        title = parts[0].replace('**', '');
        main = parts.slice(1).join('** - ');
      } else {
        main = mainPart;
      }
    } else if (line.startsWith('Enfriamiento: ')) {
      cooldown = line.replace('Enfriamiento: ', '');
    }
  });

  return { warmup, main, cooldown, title };
}

// --- Icons ---
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
    case 'natacion': return 'bg-[#00a2e8]';
    case 'ciclismo': return 'bg-[#2ecc71]';
    case 'carrera': return 'bg-[#e74c3c]';
    case 'fuerza': return 'bg-purple-500';
    default: return 'bg-zinc-300';
  }
};

const StyledDiv = React.forwardRef<HTMLDivElement, any>(({ styleProps, ...props }, ref) => 
  React.createElement('div', { ref, style: styleProps, ...props })
);
StyledDiv.displayName = 'StyledDiv';


// --- Helpers for TP Style ---
function formatDuration(minutes: number | null | undefined): string {
  if (!minutes) return '0m';
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  if (h > 0) return `${h}h${m > 0 ? ` ${m}m` : ''}`;
  return `${m}m`;
}

function calculateWorkoutMetrics(workout: WorkoutItem) {
  const session = workout.training_sessions;
  const t = workout.universal_telemetry?.[0];
  
  const plannedDuration = session?.duration_min || 0;
  const actualDuration = t?.actual_duration_min || 0;
  
  // Estimate planned TSS if not present (assuming ~60 TSS per hour for easy)
  const plannedTss = session ? Math.round((session.duration_min || 0) * (session.sport_type === 'descanso' ? 0 : 1.2)) : 0; 
  const actualTss = t?.actual_tss || 0;

  return { plannedDuration, actualDuration, plannedTss, actualTss, telemetry: t };
}

function getComplianceColor(workout: WorkoutItem, actual: number, planned: number) {
  if (workout.status === 'missed') return 'bg-red-500';
  
  if (workout.status === 'completed') {
    // Si tenemos RPE o sensaciones explícitas, mandan sobre la duración
    if (workout.rpe || workout.feelings) {
      if ((workout.rpe && workout.rpe >= 8) || workout.feelings === 'fatigado' || workout.feelings === 'lesionado') {
        return 'bg-orange-500'; // Le costó mucho o acabó mal
      }
      return 'bg-green-500'; // Bien completado
    }
    
    // Si no hay feedback, calcular por ratio de duración
    if (planned === 0 && actual === 0) return 'bg-zinc-200';
    if (planned === 0 && actual > 0) return 'bg-green-500';
    
    const ratio = actual / planned;
    if (ratio >= 0.8 && ratio <= 1.2) return 'bg-green-500';
    if (ratio >= 0.5 && ratio < 0.8) return 'bg-orange-500';
    return 'bg-red-500';
  }
  
  return 'bg-transparent';
}

function MiniZonesChart({ zonesSummary }: { zonesSummary: Record<string, number> }) {
  // zonesSummary: { z1: 10, z2: 40, z3: 5, z4: 0, z5: 0 } -> total minutes
  const total = Object.values(zonesSummary).reduce((a, b) => a + b, 0);
  if (total === 0) return null;

  const getWidth = (val: number) => `${(val / total) * 100}%`;
  
  return (
    <>
      <style>{`
        .bar-z1 { width: ${getWidth(zonesSummary.z1 || 0)}; background-color: #9ca3af; }
        .bar-z2 { width: ${getWidth(zonesSummary.z2 || 0)}; background-color: #3b82f6; }
        .bar-z3 { width: ${getWidth(zonesSummary.z3 || 0)}; background-color: #22c55e; }
        .bar-z4 { width: ${getWidth(zonesSummary.z4 || 0)}; background-color: #f59e0b; }
        .bar-z5 { width: ${getWidth(zonesSummary.z5 || 0)}; background-color: #ef4444; }
      `}</style>
      <div className="flex h-2 w-full rounded-sm overflow-hidden bg-zinc-100 mt-1.5 opacity-80">
        <div className="bar-z1" />
        <div className="bar-z2" />
        <div className="bar-z3" />
        <div className="bar-z4" />
        <div className="bar-z5" />
      </div>
    </>
  );
}

// --- Sortable Item Component ---
function SortableWorkoutCard({ workout, onEdit }: { workout: WorkoutItem, onEdit: (w: WorkoutItem) => void }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: workout.id, data: { type: 'Workout', workout } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const session = workout.training_sessions;
  const isRest = session?.sport_type === 'descanso';

  if (isRest) {
    return (
      <StyledDiv 
        ref={setNodeRef} styleProps={style} {...attributes} {...listeners}
        className={`p-2.5 rounded-xl border border-dashed border-zinc-300 bg-zinc-50 flex items-center justify-center gap-2 cursor-grab active:cursor-grabbing ${isDragging ? 'opacity-30' : 'opacity-100'}`}
      >
        <span className="text-[10px] text-zinc-400 font-bold tracking-wider">DESCANSO</span>
      </StyledDiv>
    );
  }

  const parsed = parseDescription(session?.description || '');
  const displayTitle = parsed.title || session?.sport_type || 'Sesión';
  const isCompleted = workout.status === 'completed';
  const metrics = calculateWorkoutMetrics(workout);
  const complianceColor = getComplianceColor(workout, metrics.actualDuration, metrics.plannedDuration);

  return (
    <StyledDiv
      ref={setNodeRef}
      styleProps={style}
      {...attributes}
      {...listeners}
      onClick={() => onEdit(workout)}
      className={`relative p-2 rounded-xl border bg-white shadow-sm cursor-grab active:cursor-grabbing group transition-all overflow-hidden ${
        isDragging ? 'opacity-50 scale-105 shadow-md z-50 border-cyan-500/50' : 'border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50'
      }`}
    >
      {/* Background Compliance fill (TP style) */}
      {(isCompleted || workout.status === 'missed') && (
        <div className={`absolute left-0 right-0 bottom-0 h-1.5 ${complianceColor} opacity-90`} />
      )}

      {/* Header Info: Title, Sport, Duration */}
      <div className="flex flex-col gap-1">
        <div className="flex items-start justify-between gap-1">
          <div className="flex items-center gap-1 min-w-0">
            <div className={`w-1.5 h-3 rounded-full shrink-0 ${getSportAccent(session?.sport_type || '')}`} />
            <h4 className="text-[10px] font-bold text-zinc-800 uppercase tracking-tight truncate">
              {displayTitle}
            </h4>
          </div>
          <span className="text-[9px] font-black text-zinc-500 shrink-0">
            {isCompleted ? formatDuration(metrics.actualDuration) : formatDuration(metrics.plannedDuration)}
          </span>
        </div>

        {/* Dense Metrics Row */}
        <div className="flex items-center justify-between text-[9px] font-bold">
          <div className="flex gap-1.5 text-zinc-600">
            {metrics.telemetry?.raw_payload?.average_heartrate && (
              <span className="text-red-500">{Math.round(metrics.telemetry.raw_payload.average_heartrate)}bpm</span>
            )}
            {metrics.telemetry?.raw_payload?.average_watts && (
              <span className="text-purple-600">{Math.round(metrics.telemetry.raw_payload.average_watts)}w</span>
            )}
            {!isCompleted && metrics.plannedDuration > 0 && (
              <span className="text-zinc-400 font-medium line-clamp-1">{parsed.main || parsed.warmup || 'Planificado'}</span>
            )}
          </div>
          
          {/* TSS/Load */}
          <div className="text-zinc-400 shrink-0">
            L: <span className={`font-black ${isCompleted ? 'text-zinc-700' : ''}`}>{isCompleted ? metrics.actualTss : metrics.plannedTss}</span>
          </div>
        </div>

        {/* Mini Zones Chart for completed activities */}
        {isCompleted && metrics.telemetry?.hr_zones_summary && (
          <MiniZonesChart zonesSummary={metrics.telemetry.hr_zones_summary} />
        )}
      </div>
    </StyledDiv>
  );
}

// --- Droppable Background Component ---
function DroppableBackground({ id, isEmpty, onAddClick, children }: { id: string, isEmpty: boolean, onAddClick: (dateStr: string) => void, children: React.ReactNode }) {
  const { setNodeRef } = useDroppable({
    id,
    data: {
      type: 'Column',
      container: id
    }
  });

  return (
    <div 
      ref={setNodeRef} 
      className="flex-1 p-2 min-h-[150px] flex flex-col gap-2 relative group cursor-pointer"
      onClick={(e) => {
        // Only trigger creation if clicking on the empty background, not on a card
        if (e.target === e.currentTarget) {
          onAddClick(id);
        }
      }}
    >
      {isEmpty && (
        <div 
          onClick={(e) => {
            e.stopPropagation();
            onAddClick(id);
          }}
          className="absolute inset-2 border-2 border-dashed border-zinc-200 rounded-xl bg-zinc-50/50 text-[10px] text-zinc-450 hover:text-cyan-600 hover:border-cyan-500/30 hover:bg-cyan-50 transition-all font-bold uppercase tracking-wider flex items-center justify-center cursor-pointer z-0"
        >
          Crear Aquí ➕
        </div>
      )}
      <div className="z-10 flex flex-col gap-2 relative pointer-events-none">
        <div className="pointer-events-auto flex flex-col gap-2">
          {children}
        </div>
      </div>
    </div>
  );
}

// --- Main Calendar Component ---
export function AdvancedCalendar({ workouts, onWorkoutMove, startDate = new Date(), athleteId, libraryTemplates, onTemplateDrop }: AdvancedCalendarProps) {
  // Normalize start date to Monday
  const weekStart = startOfWeek(startDate, { weekStartsOn: 1 });
  
  // Create an array of 7 days (Monday to Sunday)
  const days = Array.from({ length: 7 }).map((_, i) => {
    const d = addDays(weekStart, i);
    return {
      id: format(d, 'yyyy-MM-dd'),
      date: d,
      name: format(d, 'EEEE', { locale: es }),
      dayNumber: format(d, 'd')
    };
  });

  // Local state for optimistic UI updates during drag
  const [columns, setColumns] = React.useState<Record<string, WorkoutItem[]>>({});
  const [activeWorkout, setActiveWorkout] = React.useState<WorkoutItem | null>(null);
  const [activeTemplate, setActiveTemplate] = React.useState<any | null>(null);
  const [isUpdating, setIsUpdating] = React.useState(false);
  
  // Edit Modal State
  const [editingWorkout, setEditingWorkout] = React.useState<EditWorkoutData | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = React.useState(false);

  const weeklyMetrics = React.useMemo(() => {
    let plannedTotalDur = 0, actualTotalDur = 0;
    let plannedTotalTss = 0, actualTotalTss = 0;

    Object.values(columns).flat().forEach(w => {
      const m = calculateWorkoutMetrics(w);
      plannedTotalDur += m.plannedDuration;
      actualTotalDur += m.actualDuration;
      plannedTotalTss += m.plannedTss;
      actualTotalTss += m.actualTss;
    });
    
    return { plannedTotalDur, actualTotalDur, plannedTotalTss, actualTotalTss };
  }, [columns]);

  const getDayMetrics = (dayId: string) => {
    let pDur = 0, aDur = 0, pTss = 0, aTss = 0;
    (columns[dayId] || []).forEach(w => {
      const m = calculateWorkoutMetrics(w);
      pDur += m.plannedDuration; aDur += m.actualDuration; pTss += m.plannedTss; aTss += m.actualTss;
    });
    return { pDur, aDur, pTss, aTss };
  };

  const handleEditClick = (workout: WorkoutItem) => {
    if (!workout.training_sessions) return;
    const session = workout.training_sessions as any;
    
    const parsed = parseDescription(session.description);
    
    setEditingWorkout({
      id: workout.id,
      session_id: workout.training_sessions ? (workout as any).session_id : '',
      sport_type: session.sport_type || 'ciclismo',
      duration_min: session.duration_min || 60,
      title: parsed.title,
      warmup: parsed.warmup,
      main: parsed.main,
      cooldown: parsed.cooldown,
      scheduled_date: workout.scheduled_date,
      status: workout.status,
      telemetry: workout.universal_telemetry?.[0] || null,
      structured_blocks: session.structured_blocks || []
    });
    setIsEditModalOpen(true);
  };

  const handleCreateClick = (dateStr?: string) => {
    const targetDate = dateStr || format(startDate, 'yyyy-MM-dd');
    setEditingWorkout({
      id: 'new',
      session_id: 'new',
      sport_type: 'ciclismo',
      duration_min: 60,
      title: 'Nuevo Entrenamiento',
      warmup: '',
      main: '',
      cooldown: '',
      scheduled_date: targetDate,
      structured_blocks: []
    });
    setIsEditModalOpen(true);
  };

  // Initialize columns from props
  React.useEffect(() => {
    const newCols: Record<string, WorkoutItem[]> = {};
    days.forEach(d => {
      newCols[d.id] = workouts.filter(w => w.scheduled_date === d.id);
    });
    setColumns(newCols);
  }, [workouts]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const type = active.data.current?.type;
    
    if (type === 'Template') {
      setActiveTemplate(active.data.current?.template);
    } else {
      const { workout } = active.data.current as { workout: WorkoutItem };
      setActiveWorkout(workout);
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;
    
    if (active.data.current?.type === 'Template') return; // Don't sort templates while dragging over

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    // Find containers
    const activeContainer = Object.keys(columns).find(key => columns[key].some(w => w.id === activeId));
    // over can be a container (day id) or another item
    const overContainer = Object.keys(columns).find(key => columns[key].some(w => w.id === overId)) || overId.toString();

    if (!activeContainer || !overContainer || activeContainer === overContainer) {
      return;
    }

    setColumns((prev) => {
      const activeItems = prev[activeContainer];
      const overItems = prev[overContainer] || [];
      const activeIndex = activeItems.findIndex(w => w.id === activeId);
      const overIndex = overItems.findIndex(w => w.id === overId);

      const newIndex = overIndex >= 0 ? overIndex : overItems.length + 1;

      return {
        ...prev,
        [activeContainer]: [
          ...prev[activeContainer].filter(item => item.id !== activeId)
        ],
        [overContainer]: [
          ...prev[overContainer].slice(0, newIndex),
          activeItems[activeIndex],
          ...prev[overContainer].slice(newIndex, prev[overContainer].length)
        ]
      };
    });
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveWorkout(null);
    setActiveTemplate(null);
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    // Handle dropping a Template
    if (active.data.current?.type === 'Template') {
      const template = active.data.current?.template;
      // overId might be the day string directly, or a workout inside the day
      const targetDay = Object.keys(columns).find(key => columns[key].some(w => w.id === overId)) || overId.toString();
      
      // Ensure targetDay is one of the valid columns (a date)
      if (columns[targetDay] && onTemplateDrop) {
        setIsUpdating(true);
        try {
          await onTemplateDrop(template.id, targetDay);
        } catch (err) {
          console.error("Failed to drop template", err);
        } finally {
          setIsUpdating(false);
        }
      }
      return;
    }

    // Handle dropping a Workout
    const activeContainer = Object.keys(columns).find(key => columns[key].some(w => w.id === activeId));
    const overContainer = Object.keys(columns).find(key => columns[key].some(w => w.id === overId)) || overId.toString();

    if (!activeContainer || !overContainer) return;

    // Local reorder within the same container
    if (activeContainer === overContainer) {
      const activeIndex = columns[activeContainer].findIndex(w => w.id === activeId);
      const overIndex = columns[overContainer].findIndex(w => w.id === overId);

      if (activeIndex !== overIndex) {
        setColumns((prev) => ({
          ...prev,
          [activeContainer]: arrayMove(prev[activeContainer], activeIndex, overIndex),
        }));
      }
    }

    // Database update if moved to a new day
    const originalWorkout = workouts.find(w => w.id === activeId);
    if (originalWorkout && originalWorkout.scheduled_date !== overContainer) {
      setIsUpdating(true);
      try {
        await onWorkoutMove(activeId.toString(), overContainer);
      } catch (error) {
        console.error("Failed to move workout", error);
        // Revert on failure could be implemented here
      } finally {
        setIsUpdating(false);
      }
    }
  };

  const dropAnimation = {
    sideEffects: defaultDropAnimationSideEffects({ styles: { active: { opacity: '0.5' } } }),
  };

  return (
    <div className={`transition-opacity duration-300 ${isUpdating ? 'opacity-50 pointer-events-none' : ''}`}>
      <DndContext 
        sensors={sensors} 
        collisionDetection={closestCorners} 
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="w-full lg:w-1/5 shrink-0 hidden md:block">
            {libraryTemplates && (
              <CoachWorkoutLibrary initialTemplates={libraryTemplates} />
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-8 gap-2 w-full lg:w-4/5">
            {/* Weekly Summary Column */}
            <div className="hidden md:flex flex-col bg-zinc-50/50 rounded-2xl overflow-hidden shadow-sm">
              <div className="p-3 border-b border-zinc-200 bg-zinc-100/60 flex flex-col items-center justify-center">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Semana</span>
                <span className="text-xl font-black text-zinc-800">Total</span>
              </div>
              <div className="p-3 flex flex-col gap-3 text-[10px]">
                <div className="flex flex-col">
                  <span className="text-zinc-500 font-bold uppercase tracking-wider mb-1">Duración</span>
                  <div className="flex justify-between items-end border-b border-zinc-200 pb-1">
                    <span className="font-medium text-zinc-400">Plan:</span>
                    <span className="font-bold text-zinc-700">{formatDuration(weeklyMetrics.plannedTotalDur)}</span>
                  </div>
                  <div className="flex justify-between items-end mt-1">
                    <span className="font-medium text-zinc-400">Real:</span>
                    <span className={`font-black ${weeklyMetrics.actualTotalDur >= weeklyMetrics.plannedTotalDur * 0.9 ? 'text-green-600' : 'text-zinc-800'}`}>
                      {formatDuration(weeklyMetrics.actualTotalDur)}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col mt-2">
                  <span className="text-zinc-500 font-bold uppercase tracking-wider mb-1">Carga (Load)</span>
                  <div className="flex justify-between items-end border-b border-zinc-200 pb-1">
                    <span className="font-medium text-zinc-400">Plan:</span>
                    <span className="font-bold text-zinc-700">{weeklyMetrics.plannedTotalTss}</span>
                  </div>
                  <div className="flex justify-between items-end mt-1">
                    <span className="font-medium text-zinc-400">Real:</span>
                    <span className={`font-black ${weeklyMetrics.actualTotalTss >= weeklyMetrics.plannedTotalTss * 0.9 ? 'text-green-600' : 'text-zinc-800'}`}>
                      {weeklyMetrics.actualTotalTss}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Days Columns */}
            {days.map(day => {
              const dm = getDayMetrics(day.id);
              return (
              <div key={day.id} className="flex flex-col bg-zinc-50 rounded-2xl border border-zinc-200 overflow-hidden shadow-sm">
                {/* Day Header */}
                <div className="p-2 border-b border-zinc-200 bg-zinc-100/60 flex flex-col items-center justify-center relative">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-500">
                    {day.name}
                  </span>
                  <span className={`text-lg font-black ${day.id === format(new Date(), 'yyyy-MM-dd') ? 'text-cyan-600' : 'text-zinc-800'}`}>
                    {day.dayNumber}
                  </span>
                  
                  {/* Daily Metric Summary */}
                  <div className="flex w-full justify-between px-1 mt-1 text-[9px] font-semibold">
                    <div className="flex flex-col items-center text-zinc-500">
                      <span>⏱ {dm.aDur > 0 ? formatDuration(dm.aDur) : formatDuration(dm.pDur)}</span>
                    </div>
                    <div className="flex flex-col items-center text-zinc-500">
                      <span>L: {dm.aTss > 0 ? dm.aTss : dm.pTss}</span>
                    </div>
                  </div>
                </div>

                {/* Day Drop Zone */}
                <SortableContext 
                  id={day.id} 
                  items={columns[day.id]?.map(w => w.id) || []} 
                  strategy={verticalListSortingStrategy}
                >
                  <DroppableBackground id={day.id} onAddClick={handleCreateClick} isEmpty={(!columns[day.id] || columns[day.id].length === 0)}>
                    {columns[day.id]?.map(workout => (
                      <SortableWorkoutCard key={workout.id} workout={workout} onEdit={handleEditClick} />
                    ))}
                  </DroppableBackground>
                </SortableContext>
              </div>
              );
            })}
          </div>
        </div>

        <DragOverlay dropAnimation={dropAnimation}>
          {activeWorkout ? <SortableWorkoutCard workout={activeWorkout} onEdit={() => {}} /> : null}
          {activeTemplate ? (
            <div className="bg-white p-3 rounded-xl border border-cyan-500 shadow-xl scale-105 opacity-90 flex items-center gap-3 w-48">
              <span className="font-bold text-zinc-800 text-sm truncate">{activeTemplate.name}</span>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {athleteId && (
        <EditWorkoutModal 
          athleteId={athleteId}
          workout={editingWorkout}
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
        />
      )}
    </div>
  );
}
