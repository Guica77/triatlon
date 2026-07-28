'use client';

import * as React from 'react';
import Link from 'next/link';
import { ChevronLeft, Users, Activity, AlertTriangle, CheckCircle, Calendar as CalendarIcon } from 'lucide-react';
import { GroupAthleteItem } from '@/app/(app)/coach/group/[id]/actions';
import { GroupCalendarWrapper } from './group-calendar-wrapper';
import { EditGroupRoadmapModal } from './edit-group-roadmap-modal';
import { CloneWeekModal } from './clone-week-modal';
import { ComplianceGrid } from './compliance-grid';
import { GroupAnnouncement } from './group-announcement';
import { RoadmapEvent } from '@/app/(app)/coach/group/[id]/actions';
import { parseISO, isAfter, isSameDay, startOfDay } from 'date-fns';
import { MessageSquare } from 'lucide-react';
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

  const today = new Date();

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <Link href="/coach/dashboard" className="text-zinc-500 hover:text-cyan-600 flex items-center gap-2 text-sm font-semibold mb-2 transition">
            <ChevronLeft className="w-4 h-4" /> Volver al Panel General
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-cyan-50 border border-cyan-100 flex items-center justify-center shrink-0">
              <Users className="w-6 h-6 text-cyan-600" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-zinc-900 tracking-tight">
                Grupo: <span className="text-cyan-600">{group.name}</span>
              </h1>
              <div className="flex items-center gap-3">
                <p className="text-sm text-zinc-500 font-medium">Dashboard y Calendario Grupal</p>
                <AnimatedButton
                  variant="secondary"
                  size="sm" 
                  onClick={() => setIsChatOpen(true)}
                  className="h-7 text-[10px] px-2 py-0 border-cyan-200 text-cyan-700 bg-cyan-50 hover:bg-cyan-100"
                >
                  <MessageSquare className="w-3 h-3 mr-1" /> Chat
                </AnimatedButton>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* KPI Cards */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-zinc-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center gap-2 text-zinc-500 mb-2">
            <Users className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-wider">Atletas</span>
          </div>
          <p className="text-2xl font-black text-zinc-800">{totalAthletes}</p>
        </div>
        
        <div className="bg-white rounded-2xl p-5 border border-zinc-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center gap-2 text-zinc-500 mb-2">
            <AlertTriangle className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-wider">Alertas</span>
          </div>
          <p className={`text-2xl font-black ${athletesWithAlerts.length > 0 ? 'text-red-600' : 'text-green-600'}`}>
            {athletesWithAlerts.length}
          </p>
        </div>

<div className="bg-white rounded-2xl p-5 border border-zinc-200 shadow-sm flex flex-col justify-between">
          {/* Cumplimiento Hoy */}
          <div className="bg-gradient-to-br from-white to-zinc-50 rounded-2xl p-5 border border-zinc-200 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-zinc-500">
                <Activity className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wider">Cumplimiento Hoy</span>
              </div>
              <span className="px-2 py-0.5 rounded bg-cyan-100 text-cyan-700 text-[10px] font-bold uppercase">
                {completionRate}%
              </span>
            </div>
            <div className="mt-2">
              <div className="flex items-baseline gap-1 mb-1">
                <p className="text-3xl font-black text-zinc-800">{completedToday.length}</p>
                <p className="text-sm text-zinc-500 font-medium">/ {activeToday.length} atletas</p>
              </div>
              <div className="w-full bg-zinc-100 h-2.5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-cyan-500 rounded-full transition-all"
                  style={{ width: `${completionRate}%` }}
                />
              </div>
            </div>
            <p className="text-[11px] text-zinc-500 font-medium mt-3">Han completado su sesión de hoy.</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-zinc-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center gap-2 text-zinc-500 mb-2">
            <CheckCircle className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-wider">Estado</span>
          </div>
          <p className="text-lg font-bold text-zinc-800">
            {athletesWithAlerts.length === 0 ? 'Óptimo' : 'Requiere Atención'}
          </p>
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
      <section className="bg-white rounded-2xl border border-zinc-200 p-5 shadow-sm">
        <h2 className="text-sm font-bold text-zinc-800 uppercase tracking-wider mb-4 flex items-center gap-2">
          <Users className="w-4 h-4 text-cyan-600" /> Miembros del Grupo
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {athletes.map(athlete => {
            const hasAlert = athlete.alerts.low_hrv || athlete.alerts.high_fatigue;
            return (
              <div 
                key={athlete.id}
                className={`flex flex-col p-4 rounded-xl border transition group bg-white shadow-sm ${
                  hasAlert ? 'border-red-200 hover:border-red-300' : 'border-zinc-200 hover:border-cyan-300'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <Link href={`/coach/athlete/${athlete.id}`} className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-indigo-500 text-white flex items-center justify-center font-bold shadow-sm hover:scale-105 transition">
                      {(athlete.first_name || 'A')[0].toUpperCase()}
                    </Link>
                    <div>
                      <Link href={`/coach/athlete/${athlete.id}`} className="font-bold text-zinc-800 text-sm hover:text-cyan-700 transition">
                        {athlete.first_name} {athlete.last_name}
                      </Link>
                      <p className="text-[11px] text-zinc-500 truncate">{athlete.email}</p>
                    </div>
                  </div>
                  <div className="flex gap-1.5">
                    {athlete.alerts.low_hrv && (
                      <span title="HRV Bajo" className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse shadow-sm" />
                    )}
                    {athlete.alerts.high_fatigue && (
                      <span title="Fatiga Alta" className="w-2.5 h-2.5 rounded-full bg-orange-500 shadow-sm" />
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div className={`p-2 rounded-lg border ${hasAlert ? 'bg-red-50 border-red-100' : 'bg-zinc-50 border-zinc-100'}`}>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-0.5">Readiness</p>
                    <p className={`text-sm font-black ${athlete.alerts.high_fatigue ? 'text-red-600' : 'text-zinc-800'}`}>
                      {athlete.readiness_score ? `${athlete.readiness_score}%` : '--'}
                    </p>
                  </div>
                  <div className={`p-2 rounded-lg border ${athlete.alerts.low_hrv ? 'bg-red-50 border-red-100' : 'bg-zinc-50 border-zinc-100'}`}>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-0.5">HRV</p>
                    <p className={`text-sm font-black ${athlete.alerts.low_hrv ? 'text-red-600' : 'text-zinc-800'}`}>
                      {athlete.hrv ? `${athlete.hrv}ms` : '--'}
                    </p>
                  </div>
                </div>

                <div className="p-2 rounded-lg bg-zinc-50 border border-zinc-100">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1">Hoy</p>
                  {athlete.today_workout ? (
                    <div className="flex items-center gap-2">
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase border bg-white border-zinc-200 text-zinc-600">
                        {athlete.today_workout.sport_type}
                      </span>
                      <span className="text-xs text-zinc-700 truncate font-medium">
                        {athlete.today_workout.duration_min ? `${athlete.today_workout.duration_min}m` : 'Sesión'}
                      </span>
                    </div>
                  ) : (
                    <span className="text-xs text-zinc-400 font-medium">Descanso / Sin sesión</span>
                  )}
                </div>
              </div>
            );
          })}
          {athletes.length === 0 && (
            <p className="text-sm text-zinc-500 col-span-full">No hay atletas en este grupo.</p>
          )}
        </div>
      </section>

      {/* Advanced Builder (Group Level) */}
      <section className="space-y-4 pt-4 border-t border-zinc-200">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-zinc-800 flex items-center gap-2">
            <CalendarIcon className="w-4 h-4 text-cyan-600" /> 
            Calendario de Grupo
          </h2>
          <div className="flex items-center gap-3">
            <span className="hidden md:inline-flex text-xs text-zinc-500 font-semibold bg-white px-2.5 py-1 rounded-md border border-zinc-200 shadow-sm">
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
