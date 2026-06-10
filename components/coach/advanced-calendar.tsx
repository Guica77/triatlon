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
import { Calendar, GripVertical, Activity, Flame, Droplets, Dumbbell } from 'lucide-react';
import { format, parseISO, addDays, startOfWeek } from 'date-fns';
import { es } from 'date-fns/locale';

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

const getSportColor = (type: string) => {
  switch (type?.toLowerCase()) {
    case 'natacion': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
    case 'ciclismo': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
    case 'carrera': return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
    case 'fuerza': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    default: return 'bg-zinc-800 text-zinc-400 border-zinc-700';
  }
};

// --- Sortable Item Component ---
function SortableWorkoutCard({ workout }: { workout: WorkoutItem }) {
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

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`p-3 rounded-xl border bg-[#18181b] shadow-sm cursor-grab active:cursor-grabbing group transition-colors ${
        isDragging ? 'opacity-50 scale-105 shadow-xl z-50 border-cyan-500/50' : 'border-zinc-800 hover:border-zinc-700'
      }`}
    >
      <div className="flex items-start gap-2">
        <div className="mt-0.5 text-zinc-600 group-hover:text-zinc-400 transition-colors cursor-grab">
          <GripVertical className="w-3.5 h-3.5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 mb-1.5">
            <span className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider border flex items-center gap-1 ${getSportColor(session?.sport_type || '')}`}>
              <SportIcon type={session?.sport_type || ''} className="w-2.5 h-2.5" />
              {session?.sport_type}
            </span>
            <span className="text-[10px] font-medium text-zinc-500">{session?.duration_min} min</span>
          </div>
          <p className="text-xs text-zinc-300 leading-snug line-clamp-2">
            {session?.description}
          </p>
        </div>
      </div>
    </div>
  );
}

// --- Main Calendar Component ---
export function AdvancedCalendar({ workouts, onWorkoutMove, startDate = new Date() }: AdvancedCalendarProps) {
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
                <div className="flex-1 p-2 min-h-[150px] flex flex-col gap-2">
                  {columns[day.id]?.map(workout => (
                    <SortableWorkoutCard key={workout.id} workout={workout} />
                  ))}
                  {(!columns[day.id] || columns[day.id].length === 0) && (
                    <div className="flex-1 flex items-center justify-center border-2 border-dashed border-zinc-800/50 rounded-xl bg-zinc-900/20 text-[10px] text-zinc-600 font-medium uppercase tracking-wider">
                      Soltar Aquí
                    </div>
                  )}
                </div>
              </SortableContext>
            </div>
          ))}
        </div>

        <DragOverlay dropAnimation={dropAnimation}>
          {activeWorkout ? <SortableWorkoutCard workout={activeWorkout} /> : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
