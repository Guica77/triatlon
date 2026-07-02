'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Eye, MessageSquare, Trash2, Clock, Activity, AlertTriangle } from 'lucide-react';
import { AnimatedButton } from '@/components/ui/animated-button';
import { AthleteRosterItem } from '@/app/(app)/coach/dashboard/actions';

interface AthleteRosterCardProps {
  athlete: AthleteRosterItem;
  plans: { id: string; name: string }[];
  groups: any[];
  assigningId: string | null;
  removingId: string | null;
  onAssignPlan: (athleteId: string, planId: string) => void;
  onRemove: (athleteId: string) => void;
}

const StyledDiv = React.forwardRef<HTMLDivElement, any>(({ styleProps, ...props }, ref) => 
  React.createElement('div', { ref, style: styleProps, ...props })
);
StyledDiv.displayName = 'StyledDiv';

export function AthleteRosterCard({
  athlete,
  plans,
  groups,
  assigningId,
  removingId,
  onAssignPlan,
  onRemove
}: AthleteRosterCardProps) {
  const [isAssigningGroup, setIsAssigningGroup] = React.useState(false);
  
  const handleGroupChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newGroupId = e.target.value === 'none' ? null : e.target.value;
    setIsAssigningGroup(true);
    try {
      const { assignAthleteToGroup } = await import('@/app/(app)/coach/dashboard/actions');
      await assignAthleteToGroup(athlete.id, newGroupId);
    } catch (err) {
      console.error(err);
    } finally {
      setIsAssigningGroup(false);
    }
  };
  const today = athlete.today_workout;
  const bio = athlete.today_biometrics;
  const weekly = athlete.weekly_stats;
  const alerts = athlete.alerts;

  const hasAlert = alerts.low_hrv || alerts.high_fatigue || alerts.high_tss;
  const tssPercentage = Math.min(100, (weekly.actual_tss / (weekly.target_tss || 1)) * 100);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={`relative p-5 rounded-2xl border bg-white shadow-sm group transition-all duration-300 hover:scale-[1.02] ${
        hasAlert ? 'border-red-350' : 'border-zinc-250 hover:border-cyan-500/50'
      }`}
    >
      {/* Alert Overlay */}
      {hasAlert && (
        <div className="absolute inset-0 bg-red-500/5 rounded-2xl pointer-events-none" />
      )}

      {/* Header: Avatar & Info */}
      <div className="flex justify-between items-start mb-4 relative z-10">
        <div className="flex items-center gap-3">
          <Link href={`/coach/athlete/${athlete.id}`} className="group/avatar shrink-0 relative">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg text-white shadow-sm transition-all ${
              hasAlert ? 'bg-gradient-to-br from-red-500 to-rose-500 border border-red-400' : 'bg-gradient-to-br from-cyan-500 to-indigo-500 border-2 border-white'
            }`}>
              {(athlete.first_name || 'T')[0].toUpperCase()}
            </div>
            {hasAlert && (
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-red-500 border-2 border-white animate-pulse shadow-sm" />
            )}
          </Link>
          <div>
            <Link href={`/coach/athlete/${athlete.id}`} className="text-base font-bold text-zinc-850 hover:text-cyan-650 transition-colors">
              {athlete.first_name || 'Triatleta'} {athlete.last_name || ''}
            </Link>
            <span className="text-xs text-zinc-450 block truncate max-w-[150px] font-medium">{athlete.email}</span>
          </div>
        </div>
        
        {/* Quick Actions */}
        <div className="flex items-center gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
          <Link href={`/coach/chat?athlete=${athlete.id}`}>
            <AnimatedButton variant="ghost" size="icon" className="w-8 h-8 text-zinc-450 hover:text-zinc-800 hover:bg-zinc-100 rounded-lg">
              <MessageSquare className="w-3.5 h-3.5" />
            </AnimatedButton>
          </Link>
          <AnimatedButton
            variant="ghost"
            size="icon"
            onClick={() => onRemove(athlete.id)}
            disabled={removingId === athlete.id}
            className="w-8 h-8 text-zinc-450 hover:text-red-550 hover:bg-red-50 rounded-lg"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </AnimatedButton>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4 relative z-10">
        {/* Plan Select */}
        <div className="space-y-1.5 bg-zinc-50 p-2.5 rounded-xl border border-zinc-200/80">
          <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-450">Plan de Entrenamiento</label>
          {assigningId === athlete.id ? (
            <div className="flex items-center gap-1.5 text-xs text-zinc-500 py-1 font-medium">
              <Clock className="w-3 h-3 animate-spin" />
              <span>Asignando...</span>
            </div>
          ) : (
            <select
              aria-label="Asignar Plan"
              title="Asignar Plan"
              value={athlete.active_plan_id || ''}
              onChange={(e) => onAssignPlan(athlete.id, e.target.value)}
              disabled={assigningId === athlete.id}
              className="w-full bg-white border border-zinc-200 text-zinc-800 text-xs rounded-lg px-2 py-1.5 focus:ring-1 focus:ring-cyan-500 outline-none truncate font-medium appearance-none cursor-pointer"
            >
              <option value="">Sin plan asignado</option>
              {plans.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          )}
        </div>

        {/* Group Select */}
        <div className="space-y-1.5 bg-zinc-50 p-2.5 rounded-xl border border-zinc-200/80">
          <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-450">Grupo</label>
          {isAssigningGroup ? (
            <div className="flex items-center gap-1.5 text-xs text-zinc-500 py-1 font-medium">
              <span className="w-3 h-3 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
              Asignando...
            </div>
          ) : (
            <select
              aria-label="Asignar Grupo"
              title="Asignar Grupo"
              value={athlete.group_id || 'none'}
              onChange={handleGroupChange}
              disabled={isAssigningGroup}
              className="w-full bg-white border border-zinc-200 text-zinc-800 text-xs rounded-lg px-2 py-1.5 focus:ring-1 focus:ring-cyan-500 outline-none truncate font-medium appearance-none cursor-pointer"
            >
              <option value="none">Sin grupo</option>
              {groups.map(g => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4 relative z-10">
        {/* Biometrics / Readiness */}
        <div className={`space-y-1.5 p-2.5 rounded-xl border ${hasAlert ? 'bg-red-50 border-red-150' : 'bg-zinc-50 border-zinc-200/80'}`}>
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-450 flex items-center gap-1">
              <Activity className="w-3 h-3" /> Readiness
            </label>
            {hasAlert && <AlertTriangle className="w-3 h-3 text-red-500 animate-pulse" />}
          </div>
          {bio ? (
            <div className="flex flex-col">
              <span className={`text-xs font-black ${athlete.alerts.low_hrv ? 'text-red-650' : 'text-emerald-600'}`}>
                {bio.readiness_score || '--'}% (HRV: {bio.hrv || '--'})
              </span>
            </div>
          ) : (
            <span className="text-xs text-zinc-450 font-semibold block py-0.5">Pendiente hoy</span>
          )}
        </div>
      </div>

      {/* Today's Workout */}
      <div className="mb-4 bg-zinc-50 p-3 rounded-xl border border-zinc-200/80 relative z-10">
        <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-450 mb-1.5 block">Sesión de Hoy</label>
        {today ? (
          <div className="flex items-start gap-2">
            <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase border shrink-0 ${
              today.status === 'completed' 
                ? 'bg-emerald-50 text-emerald-700 border-emerald-150'
                : today.status === 'missed'
                ? 'bg-red-50 text-red-700 border-red-150'
                : 'bg-amber-50 text-amber-700 border-amber-150'
            }`}>
              {today.sport_type}
            </span>
            <span className="text-xs text-zinc-700 line-clamp-2 leading-relaxed font-semibold">
              {today.description}
            </span>
          </div>
        ) : (
          <span className="text-xs text-zinc-500 flex items-center gap-1.5 font-semibold">
            <div className="w-2 h-2 rounded-full bg-zinc-400" />
            Día de Descanso Programado
          </span>
        )}
      </div>

      {/* TSS Progress Bar */}
      <div className="pt-3 border-t border-zinc-200/80 relative z-10">
        <div className="flex justify-between items-center text-[10px] mb-1.5">
          <span className="text-zinc-450 font-bold uppercase tracking-wider">TSS Semanal</span>
          <span className={`font-black ${alerts.high_tss ? 'text-red-500' : 'text-cyan-600'}`}>
            {weekly.actual_tss} / {weekly.target_tss || 0}
          </span>
        </div>
        <div className="w-full h-1.5 bg-zinc-100 rounded-full overflow-hidden">
          <StyledDiv 
            className={`h-full rounded-full transition-all duration-1000 ${
              alerts.high_tss ? 'bg-red-500' : 'bg-cyan-500'
            }`}
            styleProps={{ width: `${tssPercentage}%` }}
          />
        </div>
      </div>
      
      {/* View Full Dashboard Button */}
      <div className="mt-4 pt-3 border-t border-zinc-200/80">
        <Link href={`/coach/athlete/${athlete.id}`}>
          <AnimatedButton variant="ghost" className="w-full py-2 bg-white hover:bg-zinc-50 border border-zinc-200 text-xs font-bold text-zinc-650 hover:text-zinc-850 rounded-xl flex items-center justify-center gap-1.5 shadow-sm">
            <Eye className="w-3.5 h-3.5" />
            Abrir Dashboard Completo
          </AnimatedButton>
        </Link>
      </div>

    </motion.div>
  );
}
