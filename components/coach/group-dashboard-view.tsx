'use client';

import * as React from 'react';
import Link from 'next/link';
import { differenceInWeeks } from 'date-fns';
import { ChevronLeft, Users, Activity, AlertTriangle, CheckCircle, Calendar as CalendarIcon, BatteryMedium, Target, TrendingUp, Flag, Clock, Map, MessageSquare } from 'lucide-react';
import { GroupAthleteItem } from '@/app/(app)/coach/group/[id]/actions';
import { GroupCalendarWrapper } from './group-calendar-wrapper';
import { EditGroupRoadmapModal } from './edit-group-roadmap-modal';
import { CloneWeekModal } from './clone-week-modal';
import { ComplianceGrid } from './compliance-grid';
import { GroupAnnouncement } from './group-announcement';
import { RoadmapEvent } from '@/app/(app)/coach/group/[id]/actions';
import { parseISO, isAfter, isSameDay, startOfDay } from 'date-fns';
import { GroupChatPanel } from './group-chat-panel';
import { AnimatedButton } from '@/components/ui/animated-button';

interface GroupDashboardViewProps {
  group: any;
  athletes: GroupAthleteItem[];
  workouts: any[];
  libraryTemplates: any[];
  hideBackButton?: boolean;
}

export function GroupDashboardView({ group, athletes, workouts, libraryTemplates, hideBackButton }: GroupDashboardViewProps) {
  const [isChatOpen, setIsChatOpen] = React.useState(false);
  const totalAthletes = athletes.length;

  // Calculate athletes with alerts
  const athletesWithAlerts = athletes.filter(a => a.alerts.low_hrv || a.alerts.high_fatigue || a.alerts.high_tss);

  // Calculate completed today
  const activeToday = athletes.filter(a => a.today_workout && a.today_workout.sport_type !== 'descanso');
  const completedToday = activeToday.filter(a => a.today_workout?.status === 'completed');
  const completionRate = activeToday.length > 0 ? Math.round((completedToday.length / activeToday.length) * 100) : 100;

  // Calculate athletes with readiness
  const athletesWithReadiness = athletes.filter(a => a.today_biometrics?.readiness_score !== null && a.today_biometrics?.readiness_score !== undefined);
  const averageReadiness = athletesWithReadiness.length > 0
    ? Math.round(athletesWithReadiness.reduce((acc, a) => acc + (a.today_biometrics?.readiness_score || 0), 0) / athletesWithReadiness.length)
    : null;

  // Calculate planned weekly load
  const firstAthleteWorkouts = athletes.length > 0 ? workouts.filter(w => w.user_id === athletes[0].id) : [];
  const weeklyPlannedMinutes = firstAthleteWorkouts.reduce((acc, w) => acc + (w.training_sessions?.duration_min || 0), 0);
  const weeklyPlannedHours = Math.floor(weeklyPlannedMinutes / 60);
  const weeklyPlannedRemaining = weeklyPlannedMinutes % 60;
  const weeklyPlannedStr = weeklyPlannedMinutes > 0 ? `${weeklyPlannedHours}h ${weeklyPlannedRemaining > 0 ? `${weeklyPlannedRemaining}m` : ''}` : '0h';

  const today = startOfDay(new Date());
  const roadmapEvents: RoadmapEvent[] = group.roadmap_events || [];
  const nextEvent = [...roadmapEvents]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .find(ev => {
      const evDate = startOfDay(parseISO(ev.date));
      return isAfter(evDate, today) || isSameDay(evDate, today);
    });

  const getEventIconColor = (type?: string) => {
    switch(type) {
      case 'A-Race': return 'text-red-400 bg-red-500/10';
      case 'B-Race': return 'text-orange-400 bg-orange-500/10';
      case 'Test': return 'text-blue-400 bg-blue-500/10';
      case 'Camp': return 'text-purple-400 bg-purple-500/10';
      default: return 'text-indigo-400 bg-indigo-500/10';
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12 animate-fade-in">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          {!hideBackButton && (
            <Link href="/coach/dashboard" className="text-text-secondary hover:text-swim flex items-center gap-2 text-sm font-semibold mb-2 transition">
              <ChevronLeft className="w-4 h-4" /> Volver al Panel General
            </Link>
          )}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-swim/10 border border-swim/20 flex items-center justify-center shrink-0">
              <Users className="w-6 h-6 text-swim" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-text-primary tracking-tight">
                Grupo: <span className="text-swim">{group.name}</span>
              </h1>
              <div className="flex items-center gap-3">
                <p className="text-sm text-text-secondary font-medium">Dashboard y Calendario Grupal</p>
                <AnimatedButton
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsChatOpen(true)}
                  className="h-7 text-[10px] px-2 py-0 border-swim/30 text-swim bg-swim/10 hover:bg-swim/20"
                >
                  <MessageSquare className="w-3 h-3 mr-1" /> Chat
                </AnimatedButton>
              </div>
            </div>
          </div>
        </div>

        {/* Próximo Objetivo Dynamic Block */}
        <EditGroupRoadmapModal
          groupId={group.id}
          initialEvents={roadmapEvents}
          open={false}
          onOpenChange={() => {}}
        >
        </EditGroupRoadmapModal>
        {nextEvent ? (
          <div className="bg-surface-card px-4 py-3 rounded-2xl border border-border-default shadow-card flex items-center gap-3 group-hover:border-indigo-400/40 transition-colors">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${getEventIconColor(nextEvent.type)}`}>
              <Map className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-text-secondary">
                Próximo Hito • {nextEvent.type === 'A-Race' ? 'CARRERA A' : nextEvent.type === 'B-Race' ? 'CARRERA B' : nextEvent.type.toUpperCase()}
              </p>
              <p className="text-sm font-bold text-text-primary line-clamp-1">{nextEvent.title}</p>
            </div>
            <div className="ml-2 pl-3 border-l border-border-subtle flex flex-col items-center justify-center min-w-[3rem]">
              <p className="text-2xl font-black text-indigo-400 leading-none">
                {Math.max(0, differenceInWeeks(parseISO(nextEvent.date), today))}
              </p>
              <p className="text-[9px] font-bold uppercase tracking-wider text-text-secondary mt-0.5">Semanas</p>
            </div>
          </div>
        ) : (
          <div className="bg-surface-hover px-4 py-3 rounded-2xl border border-dashed border-border-default flex items-center gap-3 hover:border-indigo-400/40 hover:bg-indigo-500/10 transition-all cursor-pointer">
            <div className="w-10 h-10 rounded-xl bg-surface-elevated flex items-center justify-center text-text-muted shrink-0">
              <Map className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-text-secondary">Roadmap de Temporada</p>
              <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Planificar hitos del grupo</p>
            </div>
          </div>
        )}
      </header>

      {/* Intelligence Hub (KPIs) */}
      <section>
        <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider mb-4 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-swim" /> Intelligence Hub
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Readiness Promedio */}
          <div className="bg-surface-card rounded-2xl p-5 border border-border-default shadow-card flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-text-secondary">
                <BatteryMedium className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wider">Readiness Grupal</span>
              </div>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${averageReadiness && averageReadiness < 60 ? 'bg-danger/15 text-danger' : 'bg-bike/15 text-bike'}`}>
                {averageReadiness && averageReadiness < 60 ? 'Bajo' : 'Óptimo'}
              </span>
            </div>
            <div className="flex items-end gap-2 mt-2">
              <p className={`text-4xl font-black tracking-tight ${averageReadiness && averageReadiness < 60 ? 'text-danger' : 'text-text-primary'}`}>
                {averageReadiness !== null ? `${averageReadiness}%` : '--'}
              </p>
            </div>
            <p className="text-[11px] text-text-secondary font-medium mt-2">Promedio de los {athletesWithReadiness.length} atletas que usan Whoop/Oura.</p>
          </div>

          {/* Carga Semanal Planificada */}
          <div className="bg-surface-card rounded-2xl p-5 border border-border-default shadow-card flex flex-col justify-between">
            <div className="flex items-center gap-2 text-text-secondary mb-2">
              <Clock className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wider">Carga Semanal</span>
            </div>
            <div className="flex items-end gap-2 mt-2">
              <p className="text-4xl font-black text-text-primary tracking-tight">{weeklyPlannedStr}</p>
            </div>
            <p className="text-[11px] text-text-secondary font-medium mt-2">Volumen de entrenamiento planificado en los calendarios.</p>
          </div>

          {/* Cumplimiento Hoy */}
          <div className="bg-surface-card rounded-2xl p-5 border border-border-default shadow-card flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-text-secondary">
                <Activity className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wider">Cumplimiento Hoy</span>
              </div>
              <span className="px-2 py-0.5 rounded bg-swim/15 text-swim text-[10px] font-bold uppercase">
                {completionRate}%
              </span>
            </div>
            <div className="mt-2">
              <div className="flex items-baseline gap-1 mb-1">
                <p className="text-3xl font-black text-text-primary">{completedToday.length}</p>
                <p className="text-sm text-text-secondary font-medium">/ {activeToday.length} atletas</p>
              </div>
              <div className="w-full bg-surface-hover h-2.5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-swim rounded-full transition-all"
                  style={{ width: `${completionRate}%` }}
                />
              </div>
            </div>
            <p className="text-[11px] text-text-secondary font-medium mt-3">Han completado su sesión de hoy.</p>
          </div>

          {/* Alertas */}
          <div className={`rounded-2xl p-5 border shadow-card flex flex-col justify-between ${athletesWithAlerts.length > 0 ? 'bg-danger/10 border-danger/20' : 'bg-surface-card border-border-default'}`}>
            <div className="flex items-center gap-2 text-text-secondary mb-2">
              <AlertTriangle className={`w-4 h-4 ${athletesWithAlerts.length > 0 ? 'text-danger' : ''}`} />
              <span className={`text-xs font-bold uppercase tracking-wider ${athletesWithAlerts.length > 0 ? 'text-danger' : ''}`}>
                Atletas en Riesgo
              </span>
            </div>
            <div className="mt-2">
              {athletesWithAlerts.length > 0 ? (
                <div className="space-y-2">
                  {athletesWithAlerts.slice(0, 2).map(a => (
                    <div key={a.id} className="flex justify-between items-center text-sm">
                      <span className="font-bold text-danger truncate pr-2">{a.first_name} {a.last_name}</span>
                      <span className="text-[10px] font-bold uppercase bg-danger/20 text-danger px-1.5 py-0.5 rounded">
                        {a.alerts.low_hrv ? 'HRV' : 'Fatiga'}
                      </span>
                    </div>
                  ))}
                  {athletesWithAlerts.length > 2 && (
                    <p className="text-xs text-danger font-medium pt-1">y {athletesWithAlerts.length - 2} más...</p>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2 text-bike">
                  <CheckCircle className="w-5 h-5" />
                  <p className="text-lg font-black tracking-tight">Todo Óptimo</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Announcement & Compliance Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mt-4">
          <div className="lg:col-span-1">
            <GroupAnnouncement groupId={group.id} initialAnnouncement={group.announcement} />
          </div>
          <div className="lg:col-span-3">
            <ComplianceGrid athletes={athletes} />
          </div>
        </div>
      </section>

      {/* Group Athletes List */}
      <section className="bg-surface-card rounded-2xl border border-border-default p-5 shadow-card">
        <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider mb-4 flex items-center gap-2">
          <Users className="w-4 h-4 text-swim" /> Miembros del Grupo
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {athletes.map(athlete => {
            const hasAlert = athlete.alerts.low_hrv || athlete.alerts.high_fatigue;
            return (
              <div
                key={athlete.id}
                className={`flex flex-col p-4 rounded-xl border transition group bg-surface-card shadow-card ${
                  hasAlert ? 'border-danger/30 hover:border-danger/50' : 'border-border-default hover:border-swim/40'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <Link href={`/coach/athlete/${athlete.id}`} className="w-10 h-10 rounded-full bg-swim text-white flex items-center justify-center font-bold shadow-button hover:scale-105 transition">
                      {(athlete.first_name || 'A')[0].toUpperCase()}
                    </Link>
                    <div>
                      <Link href={`/coach/athlete/${athlete.id}`} className="font-bold text-text-primary text-sm hover:text-swim transition">
                        {athlete.first_name} {athlete.last_name}
                      </Link>
                      <p className="text-[11px] text-text-secondary truncate">{athlete.email}</p>
                    </div>
                  </div>
                  <div className="flex gap-1.5">
                    {athlete.alerts.low_hrv && (
                      <span title="HRV Bajo" className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse shadow-button" />
                    )}
                    {athlete.alerts.high_fatigue && (
                      <span title="Fatiga Alta" className="w-2.5 h-2.5 rounded-full bg-orange-500 shadow-button" />
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div className={`p-2 rounded-lg border ${hasAlert ? 'bg-danger/10 border-danger/20' : 'bg-surface-hover border-border-subtle'}`}>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-text-secondary mb-0.5">Readiness</p>
                    <p className={`text-sm font-black ${athlete.alerts.high_fatigue ? 'text-danger' : 'text-text-primary'}`}>
                      {athlete.today_biometrics?.readiness_score ? `${athlete.today_biometrics.readiness_score}%` : '--'}
                    </p>
                  </div>
                  <div className={`p-2 rounded-lg border ${athlete.alerts.low_hrv ? 'bg-danger/10 border-danger/20' : 'bg-surface-hover border-border-subtle'}`}>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-text-secondary mb-0.5">HRV</p>
                    <p className={`text-sm font-black ${athlete.alerts.low_hrv ? 'text-danger' : 'text-text-primary'}`}>
                      {athlete.today_biometrics?.hrv ? `${athlete.today_biometrics.hrv}ms` : '--'}
                    </p>
                  </div>
                </div>

                <div className="p-2 rounded-lg bg-surface-hover border border-border-subtle">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-text-secondary mb-1">Hoy</p>
                  {athlete.today_workout ? (
                    <div className="flex items-center gap-2">
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase border bg-surface-card border-border-default text-text-secondary">
                        {athlete.today_workout.sport_type}
                      </span>
                      <span className="text-xs text-text-primary truncate font-medium">
                        {athlete.today_workout.duration_min ? `${athlete.today_workout.duration_min}m` : 'Sesión'}
                      </span>
                    </div>
                  ) : (
                    <span className="text-xs text-text-muted font-medium">Descanso / Sin sesión</span>
                  )}
                </div>
              </div>
            );
          })}
          {athletes.length === 0 && (
            <p className="text-sm text-text-secondary col-span-full">No hay atletas en este grupo.</p>
          )}
        </div>
      </section>

      {/* Calendar (Group Level) */}
      <section className="space-y-4 pt-4 border-t border-border-default">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-text-primary flex items-center gap-2">
            <CalendarIcon className="w-4 h-4 text-swim" />
            Calendario de Grupo
          </h2>
          <div className="flex items-center gap-3">
            <span className="hidden md:inline-flex text-xs text-text-secondary font-semibold bg-surface-card px-2.5 py-1 rounded-md border border-border-default shadow-card">
              Arrastra para asignar a todo el equipo
            </span>
            <CloneWeekModal groupId={group.id} currentDate={today} />
          </div>
        </div>

        <GroupCalendarWrapper
          groupId={group.id}
          initialWorkouts={workouts}
          initialLibraryTemplates={libraryTemplates}
        />
      </section>

      <GroupChatPanel
        groupId={group.id}
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
      />
    </div>
  );
}
