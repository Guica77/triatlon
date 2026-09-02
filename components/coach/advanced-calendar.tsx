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
import { Calendar, GripVertical, Activity, Flame, Droplets, Dumbbell, Clock3, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, parseISO, addDays, addMonths, startOfWeek, startOfMonth, endOfMonth, endOfWeek, isSameMonth, isToday } from 'date-fns';
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
  startDate?: Date;
  athleteId?: string;
  libraryTemplates?: any[];
  onTemplateDrop?: (templateId: string, date: string) => Promise<void>;
  onLoadRange?: (startDate: string, endDate: string) => Promise<WorkoutItem[]>;
  canMoveWorkouts?: boolean;
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
    default: return 'bg-surface-hover';
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
    if (planned === 0 && actual === 0) return 'bg-border-default';
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
      <div className="flex h-2 w-full rounded-sm overflow-hidden bg-surface-hover mt-1.5 opacity-80">
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
function SortableWorkoutCard({ workout, onEdit, moveOptions = [], onMove, canMove = true, compact = false }: { workout: WorkoutItem, onEdit: (w: WorkoutItem) => void, moveOptions?: { id: string, label: string }[], onMove?: (workout: WorkoutItem, date: string) => void, canMove?: boolean, compact?: boolean }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: workout.id, data: { type: 'Workout', workout }, disabled: !canMove });

  const dragListeners = canMove ? listeners : undefined;

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const session = workout.training_sessions;
  const isRest = session?.sport_type === 'descanso';

  if (isRest) {
    return (
      <StyledDiv 
        ref={setNodeRef} styleProps={style} {...attributes}
        className={`rounded-xl border border-dashed border-border-default bg-surface-hover ${compact ? 'p-2' : 'p-3'} ${isDragging ? 'opacity-30' : 'opacity-100'}`}
      >
        <div className="flex items-center justify-between gap-2"><span className="text-xs font-bold text-text-muted">Descanso</span><button type="button" {...dragListeners} className="flex h-11 w-11 items-center justify-center rounded-lg text-text-muted hover:bg-surface-card" aria-label="Arrastrar descanso"><GripVertical className="h-5 w-5" /></button></div>
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
      className={`relative overflow-hidden rounded-xl border bg-surface-card ${compact ? 'p-2' : 'p-3'} shadow-card transition-all ${
        isDragging ? 'opacity-50 scale-105 shadow-card-hover z-50 border-swim/50' : 'border-border-default hover:border-border-card hover:bg-surface-hover'
      }`}
    >
      {/* Background Compliance fill (TP style) */}
      {(isCompleted || workout.status === 'missed') && (
        <div className={`absolute left-0 right-0 bottom-0 h-1.5 ${complianceColor} opacity-90`} />
      )}

      {/* Header Info: Title, Sport, Duration */}
      <div className="flex flex-col gap-1">
        <div className="flex items-start justify-between gap-2">
          <button type="button" onClick={() => onEdit(workout)} className="min-w-0 flex-1 text-left">
            <div className="flex items-center gap-2">
            <div className={`h-4 w-1.5 shrink-0 rounded-full ${getSportAccent(session?.sport_type || '')}`} />
            <h4 className="truncate text-sm font-bold text-text-primary">
              {displayTitle}
            </h4>
            </div>
          </button>
          <span className="shrink-0 font-mono text-sm font-bold tabular-nums text-text-secondary">
            {isCompleted ? formatDuration(metrics.actualDuration) : formatDuration(metrics.plannedDuration)}
          </span>
        </div>

        {/* Dense Metrics Row */}
        <div className="flex items-center justify-between text-xs font-semibold">
          <div className="flex gap-1.5 text-text-secondary">
            {metrics.telemetry?.raw_payload?.average_heartrate && (
              <span className="text-red-500">{Math.round(metrics.telemetry.raw_payload.average_heartrate)}bpm</span>
            )}
            {metrics.telemetry?.raw_payload?.average_watts && (
              <span className="text-purple-600">{Math.round(metrics.telemetry.raw_payload.average_watts)}w</span>
            )}
            {!isCompleted && metrics.plannedDuration > 0 && (
              <span className="text-text-muted font-medium line-clamp-1">{parsed.main || parsed.warmup || 'Planificado'}</span>
            )}
          </div>
          
          {/* TSS/Load */}
          <div className="text-text-muted shrink-0">
            L: <span className={`font-black ${isCompleted ? 'text-text-primary' : ''}`}>{isCompleted ? metrics.actualTss : metrics.plannedTss}</span>
          </div>
        </div>

        {/* Mini Zones Chart for completed activities */}
        {isCompleted && metrics.telemetry?.hr_zones_summary && (
          <MiniZonesChart zonesSummary={metrics.telemetry.hr_zones_summary} />
        )}

        <div className="mt-2 flex items-center gap-2 border-t border-border-subtle pt-2">
          <button type="button" {...dragListeners} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-text-muted hover:bg-surface-hover hover:text-text-primary" aria-label={`Arrastrar ${displayTitle}`}><GripVertical className="h-5 w-5" /></button>
          <button type="button" onClick={() => onEdit(workout)} className="min-h-11 flex-1 rounded-lg px-3 text-left text-sm font-semibold text-text-secondary hover:bg-surface-hover hover:text-text-primary">Editar sesión</button>
          {canMove && onMove && moveOptions.length > 0 && <select aria-label={`Mover ${displayTitle} a otro día`} value={workout.scheduled_date} onChange={(event) => onMove(workout, event.target.value)} className="min-h-11 max-w-36 rounded-lg border border-border-default bg-surface-elevated px-2 text-sm text-text-secondary"><option value={workout.scheduled_date}>Mover a…</option>{moveOptions.filter((day) => day.id !== workout.scheduled_date).map((day) => <option key={day.id} value={day.id}>{day.label}</option>)}</select>}
        </div>
      </div>
    </StyledDiv>
  );
}

// --- Droppable Background Component ---
function DroppableBackground({ id, isEmpty, onAddClick, children, compact = false }: { id: string, isEmpty: boolean, onAddClick: (dateStr: string) => void, children: React.ReactNode, compact?: boolean }) {
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
      className={`flex-1 ${compact ? 'p-1 min-h-[96px]' : 'p-2 min-h-[150px]'} flex flex-col gap-2 relative group cursor-pointer`}
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
          className="absolute inset-2 z-0 flex cursor-pointer items-center justify-center rounded-xl border-2 border-dashed border-border-default bg-surface-hover/50 text-sm font-bold text-text-muted transition-all hover:border-swim/30 hover:bg-swim/10 hover:text-swim"
        >
          Crear sesión
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
export function AdvancedCalendar({ workouts, onWorkoutMove, startDate = new Date(), athleteId, libraryTemplates, onTemplateDrop, onLoadRange, canMoveWorkouts = true }: AdvancedCalendarProps) {
  const [viewMode, setViewMode] = React.useState<'week' | 'month'>('week');
  const [currentDate, setCurrentDate] = React.useState(() => startDate);

  const visibleDays = React.useMemo(() => {
    if (viewMode === 'week') {
      const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
      return Array.from({ length: 7 }).map((_, i) => {
        const date = addDays(weekStart, i);
        return {
          id: format(date, 'yyyy-MM-dd'),
          date,
          name: format(date, 'EEEE', { locale: es }),
          dayNumber: format(date, 'd'),
          isCurrentMonth: true
        };
      });
    }

    const monthStart = startOfMonth(currentDate);
    const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const gridEnd = endOfWeek(endOfMonth(currentDate), { weekStartsOn: 1 });
    const days: Array<{ id: string; date: Date; name: string; dayNumber: string; isCurrentMonth: boolean }> = [];
    let date = gridStart;

    while (date <= gridEnd) {
      days.push({
        id: format(date, 'yyyy-MM-dd'),
        date,
        name: format(date, 'EEEE', { locale: es }),
        dayNumber: format(date, 'd'),
        isCurrentMonth: isSameMonth(date, currentDate)
      });
      date = addDays(date, 1);
    }

    return days;
  }, [currentDate, viewMode]);

  const range = React.useMemo(() => ({
    start: visibleDays[0]?.id,
    end: visibleDays[visibleDays.length - 1]?.id
  }), [visibleDays]);

  // Local state for optimistic UI updates during drag
  const [columns, setColumns] = React.useState<Record<string, WorkoutItem[]>>({});
  const [activeWorkout, setActiveWorkout] = React.useState<WorkoutItem | null>(null);
  const [activeTemplate, setActiveTemplate] = React.useState<any | null>(null);
  const [isUpdating, setIsUpdating] = React.useState(false);
  const [isLoadingRange, setIsLoadingRange] = React.useState(false);
  const [loadedWorkouts, setLoadedWorkouts] = React.useState<WorkoutItem[]>(workouts);
  const previousRangeRef = React.useRef<string>('');
  const pendingMovesRef = React.useRef<Record<string, { previousDate: string; newDate: string }>>({});
  const dragOriginRef = React.useRef<{ workoutId: string; date: string } | null>(null);

  const days = visibleDays; // Alias kept for the existing card and metric rendering.
  const monthLabel = format(currentDate, 'MMMM yyyy', { locale: es });
  const dayLabels = Array.from({ length: 7 }, (_, index) =>
    format(addDays(startOfWeek(currentDate, { weekStartsOn: 1 }), index), 'EEEEEE', { locale: es })
  );
  const isCurrentPeriod = viewMode === 'month'
    ? isSameMonth(currentDate, new Date())
    : format(startOfWeek(currentDate, { weekStartsOn: 1 }), 'yyyy-MM-dd') === format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');
  const movePeriod = (amount: number) => {
    setCurrentDate((date) => viewMode === 'month' ? addMonths(date, amount) : addDays(date, amount * 7));
  };
  const goToToday = () => setCurrentDate(new Date());

  // Edit Modal State
  const [editingWorkout, setEditingWorkout] = React.useState<EditWorkoutData | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = React.useState(false);

  React.useEffect(() => {
    setLoadedWorkouts((current) => {
      const incomingById = new Map(workouts.map((workout) => [workout.id, workout]));
      const currentById = new Map(current.map((workout) => [workout.id, workout]));
      incomingById.forEach((workout, id) => {
        const pendingMove = pendingMovesRef.current[id];
        currentById.set(
          id,
          pendingMove ? { ...workout, scheduled_date: pendingMove.newDate } : workout
        );
      });
      return Array.from(currentById.values());
    });
  }, [workouts]);

  React.useEffect(() => {
    if (!range.start || !range.end || !onLoadRange) return;
    const rangeKey = `${range.start}:${range.end}`;
    if (previousRangeRef.current === rangeKey) return;
    previousRangeRef.current = rangeKey;

    let cancelled = false;
    setIsLoadingRange(true);
    onLoadRange(range.start, range.end)
      .then((nextWorkouts) => {
        if (cancelled) return;
        setLoadedWorkouts((current) => {
          const merged = new Map(current.map((workout) => [workout.id, workout]));
          nextWorkouts.forEach((workout) => {
            const pendingMove = pendingMovesRef.current[workout.id];
            merged.set(
              workout.id,
              pendingMove ? { ...workout, scheduled_date: pendingMove.newDate } : workout
            );
          });
          return Array.from(merged.values());
        });
      })
      .catch((error) => {
        if (!cancelled) console.error('Failed to load calendar range', error);
      })
      .finally(() => {
        if (!cancelled) setIsLoadingRange(false);
      });

    return () => {
      cancelled = true;
    };
  }, [onLoadRange, range.end, range.start]);

  React.useEffect(() => {
    if (!isUpdating) return;
    const timeout = window.setTimeout(() => setIsUpdating(false), 15000);
    return () => window.clearTimeout(timeout);
  }, [isUpdating]);

  const syncMovedWorkout = (workoutId: string, newDate: string, previousDate: string) => {
    pendingMovesRef.current[workoutId] = { previousDate, newDate };
    setLoadedWorkouts((current) => current.map((workout) =>
      workout.id === workoutId ? { ...workout, scheduled_date: newDate } : workout
    ));
    setColumns((current) => {
      const movedWorkout = current[previousDate]?.find((workout) => workout.id === workoutId)
        || current[newDate]?.find((workout) => workout.id === workoutId);
      if (!movedWorkout) return current;
      return {
        ...current,
        [previousDate]: (current[previousDate] || []).filter((workout) => workout.id !== workoutId),
        [newDate]: [
          ...(current[newDate] || []).filter((workout) => workout.id !== workoutId),
          { ...movedWorkout, scheduled_date: newDate },
        ],
      };
    });
  };

  const rollbackMovedWorkout = (workoutId: string, failedDate: string) => {
    const pendingMove = pendingMovesRef.current[workoutId];
    if (!pendingMove || pendingMove.newDate !== failedDate) return;

    delete pendingMovesRef.current[workoutId];
    setLoadedWorkouts((current) => current.map((workout) =>
      workout.id === workoutId
        ? { ...workout, scheduled_date: pendingMove.previousDate }
        : workout
    ));
    setColumns((current) => {
      const movedWorkout = Object.values(current).flat().find((workout) => workout.id === workoutId);
      if (!movedWorkout) return current;

      const restoredWorkout = { ...movedWorkout, scheduled_date: pendingMove.previousDate };
      return {
        ...current,
        [failedDate]: (current[failedDate] || []).filter((workout) => workout.id !== workoutId),
        [pendingMove.previousDate]: [
          ...(current[pendingMove.previousDate] || []).filter((workout) => workout.id !== workoutId),
          restoredWorkout,
        ],
      };
    });
  };

  const getDropDate = (overId: string | number) => {
    const id = overId.toString();
    return Object.keys(columns).find((date) => columns[date].some((workout) => workout.id === id))
      || (columns[id] ? id : null);
  };

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

  const handleAccessibleMove = async (workout: WorkoutItem, newDate: string) => {
    if (!canMoveWorkouts || newDate === workout.scheduled_date) return;

    const previousDate = workout.scheduled_date;
    syncMovedWorkout(workout.id, newDate, previousDate);
    setIsUpdating(true);

    try {
      await onWorkoutMove(workout.id, newDate);
    } catch (error) {
      console.error('Failed to move workout', error);
      rollbackMovedWorkout(workout.id, newDate);
    } finally {
      setIsUpdating(false);
    }
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

  // Initialize columns from the workouts currently loaded for the visible range
  React.useEffect(() => {
    const newCols: Record<string, WorkoutItem[]> = {};
    days.forEach(d => {
      newCols[d.id] = loadedWorkouts.filter(w => w.scheduled_date === d.id);
    });
    setColumns(newCols);
  }, [days, loadedWorkouts]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const type = active.data.current?.type;

    if (type === 'Template') {
      setActiveTemplate(active.data.current?.template);
      return;
    }

    if (!canMoveWorkouts) return;
    const workout = active.data.current?.workout as WorkoutItem | undefined;
    if (workout) {
      dragOriginRef.current = { workoutId: workout.id, date: workout.scheduled_date };
      setActiveWorkout(workout);
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over || active.data.current?.type === 'Template' || !canMoveWorkouts) return;

    const activeId = active.id.toString();
    const overId = over.id.toString();
    if (activeId === overId) return;

    const activeContainer = Object.keys(columns).find((date) =>
      columns[date].some((workout) => workout.id === activeId)
    );
    const overContainer = getDropDate(overId);

    if (!activeContainer || !overContainer || activeContainer === overContainer) return;

    setColumns((previous) => {
      const activeItems = previous[activeContainer] || [];
      const overItems = previous[overContainer] || [];
      const activeIndex = activeItems.findIndex((workout) => workout.id === activeId);
      if (activeIndex < 0) return previous;

      const overIndex = overItems.findIndex((workout) => workout.id === overId);
      const movedWorkout = { ...activeItems[activeIndex], scheduled_date: overContainer };
      const newIndex = overIndex >= 0 ? overIndex : overItems.length;

      return {
        ...previous,
        [activeContainer]: activeItems.filter((workout) => workout.id !== activeId),
        [overContainer]: [
          ...overItems.slice(0, newIndex),
          movedWorkout,
          ...overItems.slice(newIndex),
        ],
      };
    });
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveWorkout(null);
    setActiveTemplate(null);
    if (!over) {
      dragOriginRef.current = null;
      return;
    }

    const activeId = active.id.toString();
    const targetDate = getDropDate(over.id);

    if (active.data.current?.type === 'Template') {
      const template = active.data.current?.template;
      if (targetDate && template && onTemplateDrop) {
        setIsUpdating(true);
        try {
          await onTemplateDrop(template.id, targetDate);
        } catch (error) {
          console.error('Failed to drop template', error);
        } finally {
          setIsUpdating(false);
        }
      }
      dragOriginRef.current = null;
      return;
    }

    if (!canMoveWorkouts || !targetDate) {
      dragOriginRef.current = null;
      return;
    }

    const currentWorkout = Object.values(columns).flat().find((workout) => workout.id === activeId);
    const previousDate = dragOriginRef.current?.workoutId === activeId
      ? dragOriginRef.current.date
      : pendingMovesRef.current[activeId]?.newDate || currentWorkout?.scheduled_date;
    dragOriginRef.current = null;
    if (!previousDate) return;

    if (previousDate === targetDate) {
      const activeIndex = columns[targetDate]?.findIndex((workout) => workout.id === activeId) ?? -1;
      const overIndex = columns[targetDate]?.findIndex((workout) => workout.id === over.id.toString()) ?? -1;
      if (activeIndex >= 0 && overIndex >= 0 && activeIndex !== overIndex) {
        setColumns((previous) => ({
          ...previous,
          [targetDate]: arrayMove(previous[targetDate], activeIndex, overIndex),
        }));
      }
      return;
    }

    syncMovedWorkout(activeId, targetDate, previousDate);
    setIsUpdating(true);
    try {
      await onWorkoutMove(activeId, targetDate);
    } catch (error) {
      console.error('Failed to move workout', error);
      rollbackMovedWorkout(activeId, targetDate);
    } finally {
      setIsUpdating(false);
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
        <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-border-default bg-surface-card p-3 shadow-card sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-2">
            <button type="button" onClick={() => movePeriod(-1)} aria-label="Periodo anterior" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border-default text-text-secondary transition hover:bg-surface-hover hover:text-text-primary">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="min-w-0 flex-1 text-center sm:text-left">
              <p className="truncate text-sm font-bold capitalize text-text-primary">{viewMode === 'month' ? monthLabel : `${format(visibleDays[0].date, 'd MMM', { locale: es })} – ${format(visibleDays[visibleDays.length - 1].date, 'd MMM yyyy', { locale: es })}`}</p>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">{isLoadingRange ? 'Cargando sesiones…' : `${loadedWorkouts.filter((workout) => visibleDays.some((day) => day.id === workout.scheduled_date)).length} sesiones visibles`}</p>
            </div>
            <button type="button" onClick={() => movePeriod(1)} aria-label="Siguiente periodo" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border-default text-text-secondary transition hover:bg-surface-hover hover:text-text-primary">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-end">
            <div className="flex rounded-xl border border-border-default bg-surface-hover p-1" role="group" aria-label="Vista del calendario">
              {(['week', 'month'] as const).map((mode) => (
                <button key={mode} type="button" onClick={() => setViewMode(mode)} aria-pressed={viewMode === mode} className={`min-h-11 rounded-lg px-3 text-xs font-bold transition ${viewMode === mode ? 'bg-surface-card text-swim shadow-card' : 'text-text-muted hover:text-text-primary'}`}>
                  {mode === 'week' ? 'Semana' : 'Mes'}
                </button>
              ))}
            </div>
            <button type="button" onClick={goToToday} disabled={isCurrentPeriod} className="min-h-11 rounded-xl border border-swim/30 bg-swim/10 px-3 text-xs font-bold text-swim transition hover:bg-swim/20 disabled:cursor-default disabled:opacity-50">
              {viewMode === 'month' ? 'Mes actual' : 'Hoy'}
            </button>
          </div>
        </div>
        {viewMode === 'month' && (
          <div className="mb-2 grid grid-cols-7 gap-1 px-1 text-center text-[10px] font-bold uppercase tracking-wider text-text-muted">
            {dayLabels.map((label) => <span key={label}>{label}</span>)}
          </div>
        )}
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="w-full lg:w-1/5 shrink-0 hidden md:block">
            {libraryTemplates && (
              <CoachWorkoutLibrary initialTemplates={libraryTemplates} />
            )}
          </div>

          <div className={`grid w-full gap-2 ${viewMode === 'month' ? 'grid-cols-7' : 'grid-cols-1 md:grid-cols-8'} lg:w-4/5`}>
            {/* Weekly Summary Column */}
            <div className={`${viewMode === 'month' ? 'hidden' : 'hidden md:flex'} flex-col bg-surface-card/50 rounded-2xl overflow-hidden shadow-card`}>
              <div className="p-3 border-b border-border-default bg-surface-hover/60 flex flex-col items-center justify-center">
                <span className="text-[10px] font-bold uppercase tracking-wider text-text-secondary">{viewMode === 'month' ? 'Mes' : 'Semana'}</span>
                <span className="text-xl font-black text-text-primary">Total</span>
              </div>
              <div className="p-3 flex flex-col gap-3 text-[10px]">
                <div className="flex flex-col">
                  <span className="text-text-secondary font-bold uppercase tracking-wider mb-1">Duración</span>
                  <div className="flex justify-between items-end border-b border-border-default pb-1">
                    <span className="font-medium text-text-muted">Plan:</span>
                    <span className="font-bold text-text-primary">{formatDuration(weeklyMetrics.plannedTotalDur)}</span>
                  </div>
                  <div className="flex justify-between items-end mt-1">
                    <span className="font-medium text-text-muted">Real:</span>
                    <span className={`font-black ${weeklyMetrics.actualTotalDur >= weeklyMetrics.plannedTotalDur * 0.9 ? 'text-bike' : 'text-text-primary'}`}>
                      {formatDuration(weeklyMetrics.actualTotalDur)}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col mt-2">
                  <span className="text-text-secondary font-bold uppercase tracking-wider mb-1">Carga (Load)</span>
                  <div className="flex justify-between items-end border-b border-border-default pb-1">
                    <span className="font-medium text-text-muted">Plan:</span>
                    <span className="font-bold text-text-primary">{weeklyMetrics.plannedTotalTss}</span>
                  </div>
                  <div className="flex justify-between items-end mt-1">
                    <span className="font-medium text-text-muted">Real:</span>
                    <span className={`font-black ${weeklyMetrics.actualTotalTss >= weeklyMetrics.plannedTotalTss * 0.9 ? 'text-bike' : 'text-text-primary'}`}>
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
              <div key={day.id} className="flex flex-col bg-surface-card rounded-2xl border border-border-default overflow-hidden shadow-card">
                {/* Day Header */}
                <div className="p-2 border-b border-border-default bg-surface-hover/60 flex flex-col items-center justify-center relative">
                  <span className="text-xs font-bold capitalize text-text-secondary">
                    {day.name}
                  </span>
                  <span className={`text-lg font-black ${day.id === format(new Date(), 'yyyy-MM-dd') ? 'text-swim' : 'text-text-primary'}`}>
                    {day.dayNumber}
                  </span>

                  {/* Daily Metric Summary */}
                  <div className="mt-1 flex w-full justify-between px-1 text-xs font-semibold">
                    <div className="flex flex-col items-center text-text-secondary">
                      <span className="flex items-center gap-1"><Clock3 className="h-3.5 w-3.5" /> {dm.aDur > 0 ? formatDuration(dm.aDur) : formatDuration(dm.pDur)}</span>
                    </div>
                    <div className="flex flex-col items-center text-text-secondary">
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
                  <DroppableBackground
                    id={day.id}
                    onAddClick={handleCreateClick}
                    isEmpty={(!columns[day.id] || columns[day.id].length === 0)}
                    compact={viewMode === 'month'}
                  >
                    {columns[day.id]?.map(workout => (
                      <SortableWorkoutCard
                        key={workout.id}
                        workout={workout}
                        onEdit={handleEditClick}
                        onMove={handleAccessibleMove}
                        moveOptions={days.map((option) => ({ id: option.id, label: `${option.name} ${option.dayNumber}` }))}
                        compact={viewMode === 'month'}
                        canMove={canMoveWorkouts}
                      />
                    ))}
                  </DroppableBackground>
                </SortableContext>
              </div>
              );
            })}
          </div>
        </div>

        <DragOverlay dropAnimation={dropAnimation}>
          {activeWorkout ? <SortableWorkoutCard workout={activeWorkout} onEdit={() => {}} compact={viewMode === 'month'} canMove={canMoveWorkouts} /> : null}
          {activeTemplate ? (
            <div className="bg-surface-elevated p-3 rounded-xl border border-swim/50 shadow-elevated scale-105 opacity-90 flex items-center gap-3 w-48">
              <span className="font-bold text-text-primary text-sm truncate">{activeTemplate.name}</span>
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
