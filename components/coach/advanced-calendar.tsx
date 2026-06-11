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

// --- Types ---
export interface WorkoutItem {
  id: string;
  scheduled_date: string;
  status: string | null;
  training_sessions?: {
    sport_type: string | null;
    duration_min: number | null;
    description: string | null;
  } | null;
}

interface AdvancedCalendarProps {
  workouts: WorkoutItem[];
  onWorkoutMove: (workoutId: string, newDate: string) => Promise<void>;
  startDate?: Date; // Usually the Monday of the current week
  athleteId?: string; // Needed for EditWorkoutModal
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
      let mainPart = line.replace('Parte principal: ', '');
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
    case 'natacion': return 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]';
    case 'ciclismo': return 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]';
    case 'carrera': return 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]';
    case 'fuerza': return 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]';
    default: return 'bg-zinc-500';
  }
};

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
      <div 
        ref={setNodeRef} style={style} {...attributes} {...listeners}
        className={`p-2.5 rounded-xl border border-dashed border-zinc-700/50 bg-zinc-900/30 flex items-center justify-center gap-2 cursor-grab active:cursor-grabbing ${isDragging ? 'opacity-30' : 'opacity-100'}`}
      >
        <span className="text-xs text-zinc-600 font-medium tracking-wide">DESCANSO</span>
      </div>
    );
  }

  const parsed = parseDescription(session?.description || '');
  const displayTitle = parsed.title || session?.sport_type || 'Sesión';

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => onEdit(workout)}
      className={`relative p-3 pl-3.5 rounded-xl border bg-zinc-900/40 backdrop-blur-md shadow-sm cursor-grab active:cursor-grabbing group transition-all overflow-hidden ${
        isDragging ? 'opacity-50 scale-105 shadow-2xl z-50 border-cyan-500/50' : 'border-zinc-800/80 hover:border-zinc-700 hover:bg-zinc-900/60'
      }`}
    >
      {/* Accent Line */}
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${getSportAccent(session?.sport_type || '')}`} />
      
      <div className="flex flex-col gap-1.5">
        <div className="flex items-start justify-between gap-2">
          <h4 className="text-[11px] font-black text-zinc-100 uppercase tracking-tight truncate flex-1 flex items-center gap-1.5">
            <SportIcon type={session?.sport_type || ''} className="w-3 h-3 opacity-70" />
            <span className="truncate">{displayTitle}</span>
          </h4>
          <span className="text-[10px] font-black text-zinc-500 flex items-center gap-1 shrink-0 bg-zinc-950 px-1.5 py-0.5 rounded-md border border-zinc-800/50">
            {session?.duration_min}'
          </span>
        </div>
        
        <p className="text-[10px] text-zinc-400 leading-relaxed line-clamp-2 pr-1">
          {parsed.main || parsed.warmup || session?.description}
        </p>
      </div>
    </div>
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
          className="absolute inset-2 border-2 border-dashed border-zinc-800/50 rounded-xl bg-zinc-900/20 text-[10px] text-zinc-600 hover:text-cyan-400 hover:border-cyan-500/30 hover:bg-cyan-500/5 transition-all font-medium uppercase tracking-wider flex items-center justify-center cursor-pointer z-0"
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
export function AdvancedCalendar({ workouts, onWorkoutMove, startDate = new Date(), athleteId }: AdvancedCalendarProps) {
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
  const [isUpdating, setIsUpdating] = React.useState(false);
  
  // Edit Modal State
  const [editingWorkout, setEditingWorkout] = React.useState<EditWorkoutData | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = React.useState(false);

  const handleEditClick = (workout: WorkoutItem) => {
    if (!workout.training_sessions) return;
    const session = workout.training_sessions as any;
    
    const parsed = parseDescription(session.description);
    
    setEditingWorkout({
      id: workout.id,
      session_id: session.id,
      sport_type: session.sport_type || 'ciclismo',
      duration_min: session.duration_min || 60,
      title: parsed.title,
      warmup: parsed.warmup,
      main: parsed.main,
      cooldown: parsed.cooldown,
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
      scheduled_date: targetDate
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
    const { workout } = active.data.current as { workout: WorkoutItem };
    setActiveWorkout(workout);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

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
    setActiveWorkout(null);
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

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
        <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
          {days.map(day => (
            <div key={day.id} className="flex flex-col bg-zinc-950/40 rounded-2xl border border-zinc-800/80 overflow-hidden">
              {/* Day Header */}
              <div className="p-3 border-b border-zinc-800/80 bg-zinc-900/50 flex flex-col items-center justify-center">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                  {day.name}
                </span>
                <span className={`text-xl font-black ${day.id === format(new Date(), 'yyyy-MM-dd') ? 'text-cyan-400' : 'text-zinc-200'}`}>
                  {day.dayNumber}
                </span>
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
          ))}
        </div>

        <DragOverlay dropAnimation={dropAnimation}>
          {activeWorkout ? <SortableWorkoutCard workout={activeWorkout} onEdit={() => {}} /> : null}
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
