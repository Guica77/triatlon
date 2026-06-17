'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { createManualWorkoutAction } from '@/app/(app)/dashboard/actions';
import { DailyWorkoutCard } from '@/components/dashboard/daily-workout-card';
import { WeeklyNav } from '@/components/dashboard/weekly-nav';
import { ProCard } from '@/components/ui/pro-card';
import { AnimatedButton } from '@/components/ui/animated-button';
import { Calendar, Plus, X, Flame, Sparkles, ChevronLeft, ChevronRight, Activity, Bot, Eye, ListFilter } from 'lucide-react';
import { AIWorkoutGenerator, GeneratedWorkout } from './ai-workout-generator';
import { BiometricsCard } from '@/components/dashboard/biometrics-card';
import { DailyFuelCard } from '@/components/dashboard/daily-fuel-card';
import { FormStatusWidget } from '@/components/dashboard/form-status-widget';
import { 
  calculateDailyMacros, 
  calculateSessionPacing, 
  calculateWorkoutCalories 
} from '@/lib/nutrition-utility';
import { cn } from '@/lib/utils';

interface DashboardViewTabsProps {
  initialWorkouts: any[];
  isConnected: boolean;
  profile: any;
  readOnly?: boolean;
  initialBiometrics?: any;
  initialNutrition?: any;
  initialAnalytics?: any;
}

const sportColors: Record<string, string> = {
  natacion: 'bg-[var(--color-swim)]',
  ciclismo: 'bg-[var(--color-bike)]',
  carrera: 'bg-[var(--color-run)]',
  fuerza: 'bg-purple-550',
  brick: 'bg-amber-400',
  descanso: 'bg-zinc-650',
};

export function DashboardViewTabs({ 
  initialWorkouts = [], 
  isConnected, 
  profile, 
  readOnly = false,
  initialBiometrics,
  initialNutrition,
  initialAnalytics
}: DashboardViewTabsProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = React.useState<'semana' | 'mes'>('semana');
  const [isManualModalOpen, setIsManualModalOpen] = React.useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = React.useState(false);
  const [aiWorkouts, setAiWorkouts] = React.useState<GeneratedWorkout[]>([]);
  
  // Merge initialWorkouts with AI generated ones
  const allWorkouts = React.useMemo(() => {
    const mappedAiWorkouts = aiWorkouts.map((aiw, idx) => ({
      id: `ai-gen-${aiw.date}-${idx}`,
      scheduled_date: aiw.date,
      status: 'pending',
      training_sessions: {
        sport_type: aiw.sport_type,
        title: aiw.title,
        description: aiw.description,
        duration_minutes: aiw.duration_minutes,
        tss_score: aiw.tss
      }
    }));
    return [...initialWorkouts, ...mappedAiWorkouts];
  }, [initialWorkouts, aiWorkouts]);

  // State for monthly view navigation and selection
  const [currentDate, setCurrentDate] = React.useState(new Date());
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDateStr, setSelectedDateStr] = React.useState(todayStr);

  // Dynamic States for unified dashboard
  const [viewMode, setViewMode] = React.useState<'focus' | 'all'>('focus');

  // Compute selected day nutrition dynamically client-side in 0ms to avoid network round-trip delay on mobile
  const nutritionData = React.useMemo(() => {
    const sweatRate = profile?.sweat_rate || 0.8;
    const customCarbsPerHour = profile?.custom_carbs_per_hour;
    const weight = initialNutrition?.weight || 72.0;

    let activeExpenditure = 0;
    let totalWorkoutHours = 0;
    let hasStrengthSession = false;
    let hasBrickSession = false;
    const sessionsPacing: any[] = [];

    const dayWorkouts = allWorkouts.filter(w => w.scheduled_date === selectedDateStr);

    dayWorkouts.forEach((w: any) => {
      const session = w.training_sessions;
      if (!session || session.sport_type === 'descanso') return;

      const durationMin = session.duration_min || 0;
      const durationHours = durationMin / 60;
      totalWorkoutHours += durationHours;

      const sport = session.sport_type;
      if (sport === 'fuerza') hasStrengthSession = true;
      if (sport === 'brick') hasBrickSession = true;

      // Calcular calorías quemadas
      const kcalBurned = calculateWorkoutCalories(sport, weight, durationMin);
      activeExpenditure += kcalBurned;

      // Calcular pacing
      const pacing = calculateSessionPacing(sport, durationMin, sweatRate, customCarbsPerHour);

      sessionsPacing.push({
        workoutId: w.id,
        sportType: sport,
        durationMin,
        hourlyFluidMl: pacing.hourlyFluidMl,
        totalFluidMl: pacing.totalFluidMl,
        hourlySodiumMg: pacing.hourlySodiumMg,
        totalSodiumMg: pacing.totalSodiumMg,
        hourlyCarbsG: pacing.hourlyCarbsG,
        totalCarbsG: pacing.totalCarbsG,
        practicalGuide: pacing.practicalGuide
      });
    });

    const macrosCalc = calculateDailyMacros(
      weight,
      totalWorkoutHours,
      hasStrengthSession,
      hasBrickSession,
      activeExpenditure
    );

    return {
      bmr: macrosCalc.bmr,
      baseExpenditure: macrosCalc.baseExpenditure,
      activeExpenditure: macrosCalc.activeExpenditure,
      totalCalories: macrosCalc.totalCalories,
      weight,
      macros: {
        carbs: macrosCalc.carbs,
        protein: macrosCalc.protein,
        fat: macrosCalc.fat
      },
      sessionsPacing
    };
  }, [selectedDateStr, allWorkouts, profile, initialNutrition]);

  // Form states for manual workout logger
  const [formTitle, setFormTitle] = React.useState('');
  const [formSport, setFormSport] = React.useState('carrera');
  const [formDate, setFormDate] = React.useState(todayStr);
  const [formDuration, setFormDuration] = React.useState('45');
  const [formDescription, setFormDescription] = React.useState('');
  const [formStatus, setFormStatus] = React.useState<'pending' | 'completed'>('completed');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  // Reset form helper
  const resetForm = (targetDate = todayStr) => {
    setFormTitle('');
    setFormSport('carrera');
    setFormDate(targetDate);
    setFormDuration('45');
    setFormDescription('');
    setFormStatus('completed');
    setErrorMessage(null);
  };

  // Open modal helper
  const openModalForDate = (dateString: string) => {
    resetForm(dateString);
    setIsManualModalOpen(true);
  };

  // Submit handler
  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle || !formDate || !formDuration) {
      setErrorMessage('Por favor, rellena todos los campos obligatorios.');
      return;
    }
    
    setIsSubmitting(true);
    setErrorMessage(null);
    
    try {
      const res = await createManualWorkoutAction({
        title: formTitle,
        sport_type: formSport,
        duration_min: parseInt(formDuration, 10) || 0,
        scheduled_date: formDate,
        description: formDescription,
        status: formStatus,
      });

      if (res.success) {
        setIsManualModalOpen(false);
        resetForm();
        router.refresh();
      }
    } catch (err: unknown) {
      console.error(err);
      setErrorMessage(err instanceof Error ? err.message : 'Error al crear la sesión manual.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper to generate monthly grid
  const getDaysInGrid = (baseDate: Date) => {
    const year = baseDate.getFullYear();
    const month = baseDate.getMonth();
    
    // First day of baseDate month
    const firstDayOfMonth = new Date(year, month, 1);
    // Find the Monday of the week containing firstDayOfMonth
    const firstDayIdx = firstDayOfMonth.getDay() || 7; // 1 Mon ... 7 Sun
    const calendarStart = new Date(firstDayOfMonth);
    calendarStart.setDate(calendarStart.getDate() - firstDayIdx + 1);
    
    // Last day of baseDate month
    const lastDayOfMonth = new Date(year, month + 1, 0);
    // Find the Sunday of the week containing lastDayOfMonth
    const lastDayIdx = lastDayOfMonth.getDay() || 7;
    const calendarEnd = new Date(lastDayOfMonth);
    calendarEnd.setDate(calendarEnd.getDate() + (7 - lastDayIdx));
    
    const days: Date[] = [];
    const curr = new Date(calendarStart);
    while (curr <= calendarEnd) {
      days.push(new Date(curr));
      curr.setDate(curr.getDate() + 1);
    }
    return days;
  };

  const calendarDays = getDaysInGrid(currentDate);

  // Month navigation helpers
  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  // Filter workouts for weekly view (current week: Monday to Sunday)
  const getWeeklyWorkouts = () => {
    const now = new Date();
    const currentDay = now.getDay() || 7;
    const monday = new Date(now);
    monday.setDate(monday.getDate() - currentDay + 1);
    monday.setHours(0, 0, 0, 0);

    const sunday = new Date(monday);
    sunday.setDate(sunday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    const monStr = monday.toISOString().split('T')[0];
    const sunStr = sunday.toISOString().split('T')[0];

    return allWorkouts.filter(
      w => w.scheduled_date >= monStr && w.scheduled_date <= sunStr
    ).sort((a, b) => a.scheduled_date.localeCompare(b.scheduled_date));
  };

  const weeklyWorkouts = getWeeklyWorkouts();  const selectedDayWorkouts = allWorkouts.filter(w => w.scheduled_date === selectedDateStr);

  const progressPercent = React.useMemo(() => {
    const weeklyWorkouts = allWorkouts.filter(w => {
      const now = new Date();
      const currentDay = now.getDay() || 7;
      const monday = new Date(now);
      monday.setDate(monday.getDate() - currentDay + 1);
      monday.setHours(0, 0, 0, 0);

      const sunday = new Date(monday);
      sunday.setDate(sunday.getDate() + 6);
      sunday.setHours(23, 59, 59, 999);

      const monStr = monday.toISOString().split('T')[0];
      const sunStr = sunday.toISOString().split('T')[0];
      return w.scheduled_date >= monStr && w.scheduled_date <= sunStr;
    });

    const completed = weeklyWorkouts.filter(w => w.status === 'completed').length;
    const total = weeklyWorkouts.filter(w => w.training_sessions?.sport_type !== 'descanso').length;
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  }, [allWorkouts]);

  return (
    <div className="space-y-6">
      
      {/* Sección Biometría, Nutrición y Readiness Dinámica (Actualización Dinámica al cambiar de Día) */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {initialBiometrics && (
          <div className="h-full">
            <BiometricsCard initialBiometrics={initialBiometrics} />
          </div>
        )}
        <div className="h-full">
          <DailyFuelCard 
            nutritionData={nutritionData} 
            error={null} 
            loading={false}
          />
        </div>
        <div className="h-full">
          <FormStatusWidget 
            tsb={initialAnalytics?.currentTsb || 0} 
            athleteLevel={profile?.level}
            progressPercent={progressPercent}
          />
        </div>
      </section>

      {/* Tabs and Quick Actions */}
      <div className="flex justify-between items-center flex-wrap gap-3 pb-2 border-b border-zinc-205">
        <div className="flex bg-zinc-100 p-1 rounded-xl border border-zinc-200/80 shadow-sm">
          <button
            onClick={() => setActiveTab('semana')}
            className={`relative px-4 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              activeTab === 'semana' ? 'text-cyan-400 font-bold' : 'text-zinc-500 hover:text-zinc-800'
            }`}
          >
            {activeTab === 'semana' && (
              <motion.div
                layoutId="active-dashboard-tab"
                className="absolute inset-0 bg-white border border-zinc-200 shadow-sm rounded-lg"
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              />
            )}
            <span className="relative z-10">Vista Semanal</span>
          </button>
          <button
            onClick={() => setActiveTab('mes')}
            className={`relative px-4 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              activeTab === 'mes' ? 'text-cyan-400 font-bold' : 'text-zinc-500 hover:text-zinc-800'
            }`}
          >
            {activeTab === 'mes' && (
              <motion.div
                layoutId="active-dashboard-tab"
                className="absolute inset-0 bg-white border border-zinc-200 shadow-sm rounded-lg"
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              />
            )}
            <span className="relative z-10">Vista Mensual</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'semana' && (
            <a 
              href="/api/workouts/export-calendar" 
              download="calendario_semanal.ics"
              className="px-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-750 text-zinc-300 hover:text-zinc-100 text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
              title="Descargar toda la semana en tu Apple Calendar, Google Calendar o Garmin Calendar"
            >
              <Calendar className="w-3.5 h-3.5 text-orange-455" />
              <span className="hidden sm:inline">Exportar Semana (.ICS)</span>
              <span className="inline sm:hidden">.ICS</span>
            </a>
          )}
          
          {!readOnly && (
            <div className="flex items-center gap-2">
              <AnimatedButton
                variant="ghost"
                onClick={() => setIsAiModalOpen(true)}
                className="bg-cyan-950/30 hover:bg-cyan-900/50 text-cyan-400 border border-cyan-900/50 text-xs py-2 px-3 rounded-xl font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Bot className="w-4 h-4" />
                <span className="hidden sm:inline">Generar Plan AI</span>
              </AnimatedButton>
              <AnimatedButton
                variant="primary"
                onClick={() => openModalForDate(todayStr)}
                className="!bg-cyan-500 hover:!bg-cyan-400 !text-black text-xs py-2 px-4 rounded-xl font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Añadir Manual</span>
              </AnimatedButton>
            </div>
          )}
        </div>
      </div>

      {/* Main View Area */}
      <div>
        <div className={activeTab === 'semana' ? 'block' : 'hidden'}>
          <div className="space-y-6 animate-fade-in">
            {/* Weekly navigation component */}
            <WeeklyNav 
              workouts={weeklyWorkouts}
              selectedDateStr={selectedDateStr}
              onSelectDate={setSelectedDateStr}
            />

            {/* Weekly Workout list */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-550 flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-amber-500" />
                  {viewMode === 'focus' ? 'Sesión del Día Seleccionado' : 'Entrenamientos Planificados de la Semana'}
                </h2>
                
                {/* Selector de modo de vista */}
                <div className="flex bg-zinc-100 p-1 rounded-lg border border-zinc-200/80 text-[10px] font-bold shrink-0">
                  <button
                    onClick={() => setViewMode('focus')}
                    className={cn(
                      "px-2.5 py-1 rounded cursor-pointer transition-colors flex items-center gap-1",
                      viewMode === 'focus' ? "bg-white text-cyan-400 shadow-sm border border-zinc-200" : "text-zinc-550 hover:text-zinc-800"
                    )}
                  >
                    <Eye className="w-3 h-3" />
                    Día Seleccionado
                  </button>
                  <button
                    onClick={() => setViewMode('all')}
                    className={cn(
                      "px-2.5 py-1 rounded cursor-pointer transition-colors flex items-center gap-1",
                      viewMode === 'all' ? "bg-white text-cyan-400 shadow-sm border border-zinc-200" : "text-zinc-550 hover:text-zinc-800"
                    )}
                  >
                    <ListFilter className="w-3 h-3" />
                    Toda la Semana
                  </button>
                </div>
              </div>

              {viewMode === 'focus' ? (
                selectedDayWorkouts.length > 0 ? (
                  selectedDayWorkouts.map(w => (
                    <DailyWorkoutCard
                      key={w.id}
                      workout={w}
                      initialIsConnected={isConnected}
                      virtualGarage={profile?.virtual_garage || []}
                      athleteLevel={profile?.level}
                      readOnly={readOnly}
                      sweatRate={profile?.sweat_rate}
                      customCarbsPerHour={profile?.custom_carbs_per_hour}
                      preferredIngredients={profile?.preferred_ingredients || []}
                    />
                  ))
                ) : (
                  <div className="p-8 rounded-2xl bg-zinc-900/10 border border-dashed border-zinc-800/80 flex flex-col items-center justify-center text-center gap-3 relative overflow-hidden group">
                    <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform duration-500">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-zinc-300">Día de Recuperación Activa</p>
                      <p className="text-xs text-zinc-500 max-w-[250px] mx-auto leading-relaxed">
                        No hay entrenamientos de alta intensidad. Aprovecha para descansar o estirar 15 minutos.
                      </p>
                    </div>
                  </div>
                )
              ) : (
                weeklyWorkouts.length > 0 ? (
                  weeklyWorkouts.map(w => {
                    const isToday = w.scheduled_date === todayStr;
                    const tomorrow = new Date();
                    tomorrow.setDate(tomorrow.getDate() + 1);
                    const tomorrowStr = tomorrow.toISOString().split('T')[0];
                    const isTomorrow = w.scheduled_date === tomorrowStr;

                    return (
                      <div key={w.id} className={isToday ? "ring-2 ring-cyan-500/30 rounded-2xl p-0.5" : ""}>
                        {isToday && (
                          <div className="px-4 py-1.5 bg-cyan-500/10 text-cyan-400 text-[10px] font-bold uppercase tracking-wider rounded-t-xl border-x border-t border-cyan-500/20">
                            Hoy
                          </div>
                        )}
                        {isTomorrow && (
                          <div className="px-4 py-1.5 bg-zinc-800 text-zinc-400 text-[10px] font-bold uppercase tracking-wider rounded-t-xl border-x border-t border-zinc-700/30">
                            Mañana
                          </div>
                        )}
                        <DailyWorkoutCard
                          workout={w}
                          initialIsConnected={isConnected}
                          virtualGarage={profile?.virtual_garage || []}
                          athleteLevel={profile?.level}
                          readOnly={readOnly}
                          sweatRate={profile?.sweat_rate}
                          customCarbsPerHour={profile?.custom_carbs_per_hour}
                          preferredIngredients={profile?.preferred_ingredients || []}
                        />
                      </div>
                    );
                  })
                ) : (
                  <ProCard className="text-center py-12 bg-zinc-900/30">
                    <Activity className="w-8 h-8 text-zinc-650 mx-auto mb-2" />
                    <p className="text-sm font-medium text-zinc-350">No hay sesiones planificadas para esta semana</p>
                  </ProCard>
                )
              )}
            </div>
          </div>
        </div>
        <div className={activeTab === 'mes' ? 'block' : 'hidden'}>
          <div className="space-y-6 animate-fade-in">
            {/* Monthly Calendar View */}
            <ProCard className="p-5">
              
              {/* Calendar Header */}
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-sm sm:text-base font-bold text-zinc-800 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-cyan-400" />
                  <span>{monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}</span>
                </h3>
                <div className="flex items-center gap-1.5">
                  <button
                    title="Mes Anterior"
                    aria-label="Mes Anterior"
                    onClick={handlePrevMonth}
                    className="p-1.5 rounded-lg border border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50 bg-white text-zinc-500 hover:text-zinc-800 transition cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    title="Mes Siguiente"
                    aria-label="Mes Siguiente"
                    onClick={handleNextMonth}
                    className="p-1.5 rounded-lg border border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50 bg-white text-zinc-500 hover:text-zinc-800 transition cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Calendar Grid Header */}
              <div className="grid grid-cols-7 gap-1 sm:gap-2 text-center text-xs font-semibold text-zinc-500 mb-2">
                <div>Lun</div>
                <div>Mar</div>
                <div>Mié</div>
                <div>Jue</div>
                <div>Vie</div>
                <div>Sáb</div>
                <div>Dom</div>
              </div>

              {/* Calendar Grid Days */}
              <div className="grid grid-cols-7 gap-1 sm:gap-2">
                {calendarDays.map((d, idx) => {
                  const dateStr = d.toISOString().split('T')[0];
                  const isCurrentMonth = d.getMonth() === currentDate.getMonth();
                  const isToday = d.toDateString() === new Date().toDateString();
                  const isSelected = dateStr === selectedDateStr;

                  // Find sessions for this day
                  const daySessions = allWorkouts.filter(w => w.scheduled_date === dateStr);

                  // Calculate compliance color like TrainingPeaks
                  let complianceClass = '';
                  if (daySessions.length > 0) {
                    const hasCompleted = daySessions.some(w => w.status === 'completed');
                    const hasMissed = daySessions.some(w => w.status === 'missed');
                    const hasPending = daySessions.some(w => w.status === 'pending');
                    
                    if (daySessions.every(w => w.status === 'completed')) {
                      complianceClass = 'bg-[#e2f9eb] border-[#b2f0c9] text-emerald-800 hover:bg-[#d0f5dc]';
                    } else if (hasMissed) {
                      complianceClass = 'bg-[#feeef0] border-[#fccad3] text-red-800 hover:bg-[#fddde2]';
                    } else if (hasPending && daySessions.some(w => w.scheduled_date <= todayStr)) {
                      complianceClass = 'bg-[#fff8e6] border-[#ffe8b3] text-amber-800 hover:bg-[#fff0cc]';
                    } else {
                      complianceClass = 'bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-50';
                    }
                  } else {
                    complianceClass = 'bg-[#fcfcfd] border-zinc-200/80 text-zinc-400 hover:bg-zinc-50';
                  }

                  return (
                    <button
                      key={idx}
                      onClick={() => setSelectedDateStr(dateStr)}
                      className={`relative min-h-[56px] sm:min-h-[72px] p-1.5 rounded-xl border flex flex-col justify-between items-start transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-cyan-50 border-cyan-400 ring-2 ring-cyan-400/20 shadow-xs'
                          : isToday
                          ? 'bg-cyan-50/20 border-cyan-300 ring-1 ring-cyan-200'
                          : complianceClass
                      } ${!isCurrentMonth ? 'opacity-35' : ''}`}
                    >
                      {/* Day Number */}
                      <span className={`text-[10px] sm:text-xs font-bold leading-none ${
                        isToday ? 'text-cyan-600' : isSelected ? 'text-cyan-800' : 'text-zinc-650'
                      }`}>
                        {d.getDate()}
                      </span>

                      {/* Workout Sport Indicators */}
                      <div className="w-full flex flex-wrap gap-0.5 mt-auto pt-1">
                        {daySessions.map((w, wIdx) => {
                          const sport = w.training_sessions?.sport_type || 'descanso';
                          if (sport === 'descanso') return null;
                          return (
                            <span
                              key={wIdx}
                              className={`w-1.5 h-1.5 rounded-full ${sportColors[sport] || 'bg-zinc-500'}`}
                              title={w.training_sessions?.description || sport}
                            />
                          );
                        })}
                      </div>
                    </button>
                  );
                })}
              </div>
            </ProCard>

            {/* Workouts for Selected Day */}
            <div className="space-y-4 pt-2">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Sesiones del {new Date(selectedDateStr + 'T00:00:00').toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
                </h3>
                {selectedDayWorkouts.length === 0 && !readOnly && (
                  <button
                    onClick={() => openModalForDate(selectedDateStr)}
                    className="text-[11px] font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Programar aquí
                  </button>
                )}
              </div>

              {selectedDayWorkouts.length > 0 ? (
                selectedDayWorkouts.map(w => (
                  <DailyWorkoutCard
                    key={w.id}
                    workout={w}
                    initialIsConnected={isConnected}
                    virtualGarage={profile?.virtual_garage || []}
                    athleteLevel={profile?.level}
                    readOnly={readOnly}
                    sweatRate={profile?.sweat_rate}
                    customCarbsPerHour={profile?.custom_carbs_per_hour}
                    preferredIngredients={profile?.preferred_ingredients || []}
                  />
                ))
              ) : (
                <div className="p-6 rounded-2xl bg-zinc-50 border border-dashed border-zinc-200 flex flex-col items-center justify-center text-center gap-3 relative overflow-hidden group shadow-inner">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform duration-500">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-zinc-850">Día de Recuperación Activa</p>
                    <p className="text-xs text-zinc-500 max-w-[250px] mx-auto leading-relaxed">
                      No hay entrenamientos de alta intensidad. Aprovecha para estirar 15 min, caminar o simplemente descansar la musculatura.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Manual Workout Logger Modal */}
      <AnimatePresence>
        {isManualModalOpen && !readOnly && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsManualModalOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />

            {/* Modal Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-lg rounded-2xl bg-white border border-zinc-200 shadow-2xl p-6 overflow-hidden z-10"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

              {/* Modal Header */}
              <div className="flex justify-between items-center border-b border-zinc-150 pb-4 mb-4">
                <h3 className="text-base sm:text-lg font-bold text-zinc-900 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-cyan-400 animate-pulse" />
                  Registrar Sesión Manual
                </h3>
                <button
                  title="Cerrar"
                  aria-label="Cerrar"
                  onClick={() => setIsManualModalOpen(false)}
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Modal Form */}
              <form onSubmit={handleManualSubmit} className="space-y-4">
                
                {errorMessage && (
                  <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold">
                    {errorMessage}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5">
                    Título de la Sesión *
                  </label>
                  <input
                    type="text"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="Ej. Rodaje continuo, Natación técnica, HIIT"
                    required
                    className="w-full bg-white border border-zinc-200 focus:border-cyan-500/50 rounded-xl px-3.5 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 outline-none transition-colors"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5">
                      Disciplina *
                    </label>
                    <select
                      title="Disciplina"
                      aria-label="Disciplina"
                      value={formSport}
                      onChange={(e) => setFormSport(e.target.value)}
                      className="w-full bg-white border border-zinc-200 focus:border-cyan-500/50 rounded-xl px-3.5 py-2.5 text-sm text-zinc-900 outline-none transition-colors cursor-pointer"
                    >
                      <option value="carrera">🏃‍♂️ Carrera</option>
                      <option value="ciclismo">🚴‍♂️ Ciclismo</option>
                      <option value="natacion">🏊‍♂️ Natación</option>
                      <option value="fuerza">🏋️ Fuerza</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5">
                      Duración (min) *
                    </label>
                    <input
                      title="Duración en minutos"
                      aria-label="Duración en minutos"
                      placeholder="45"
                      type="number"
                      value={formDuration}
                      onChange={(e) => setFormDuration(e.target.value)}
                      min="1"
                      required
                      className="w-full bg-white border border-zinc-200 focus:border-cyan-500/50 rounded-xl px-3.5 py-2.5 text-sm text-zinc-900 outline-none transition-colors"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5">
                      Fecha Programada *
                    </label>
                    <input
                      title="Fecha Programada"
                      aria-label="Fecha Programada"
                      placeholder="YYYY-MM-DD"
                      type="date"
                      value={formDate}
                      onChange={(e) => setFormDate(e.target.value)}
                      required
                      className="w-full bg-white border border-zinc-200 focus:border-cyan-500/50 rounded-xl px-3.5 py-2.5 text-sm text-zinc-900 outline-none transition-colors cursor-pointer"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5">
                      Estado de Realización *
                    </label>
                    <select
                      title="Estado"
                      aria-label="Estado"
                      value={formStatus}
                      onChange={(e) => setFormStatus(e.target.value as 'pending' | 'completed')}
                      className="w-full bg-white border border-zinc-200 focus:border-cyan-500/50 rounded-xl px-3.5 py-2.5 text-sm text-zinc-900 outline-none transition-colors cursor-pointer"
                    >
                      <option value="completed">✓ Completado</option>
                      <option value="pending">⏳ Pendiente</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5">
                    Descripción / Notas (Opcional)
                  </label>
                  <textarea
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    placeholder="Detalles sobre las sensaciones, ritmos o series realizadas..."
                    rows={3}
                    className="w-full bg-white border border-zinc-200 focus:border-cyan-500/50 rounded-xl px-3.5 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 outline-none transition-colors resize-none"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-3 border-t border-zinc-205">
                  <AnimatedButton
                    type="button"
                    variant="ghost"
                    onClick={() => setIsManualModalOpen(false)}
                    className="px-4 py-2 border border-zinc-200 bg-zinc-50 text-zinc-600 hover:text-zinc-800 hover:bg-zinc-100 text-xs rounded-xl"
                  >
                    Cancelar
                  </AnimatedButton>
                  <AnimatedButton
                    type="submit"
                    variant="primary"
                    disabled={isSubmitting}
                    className="bg-cyan-500 hover:bg-cyan-600 text-white px-5 py-2 text-xs font-bold rounded-xl disabled:opacity-50"
                  >
                    {isSubmitting ? 'Guardando...' : 'Registrar Sesión'}
                  </AnimatedButton>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AIWorkoutGenerator 
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        onGenerate={(workouts) => setAiWorkouts(workouts)}
        currentDate={currentDate.toISOString().split('T')[0]}
      />
    </div>
  );
}
