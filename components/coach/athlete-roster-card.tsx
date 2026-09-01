'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Eye, MessageSquare, Trash2, Activity, AlertTriangle, Clock } from 'lucide-react';
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

export function AthleteRosterCard({
  athlete, plans, groups, assigningId, removingId, onAssignPlan, onRemove
}: AthleteRosterCardProps) {
  const [isAssigningGroup, setIsAssigningGroup] = React.useState(false);

  const handleGroupChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newGroupId = e.target.value === 'none' ? null : e.target.value;
    setIsAssigningGroup(true);
    try {
      const { assignAthleteToGroup } = await import('@/app/(app)/coach/dashboard/actions');
      await assignAthleteToGroup(athlete.id, newGroupId);
    } catch (err) { console.error(err);
    } finally { setIsAssigningGroup(false); }
  };

  const today = athlete.today_workout;
  const bio = athlete.today_biometrics;
  const weekly = athlete.weekly_stats;
  const alerts = athlete.alerts;
  const hasAlert = alerts.low_hrv || alerts.high_fatigue || alerts.high_tss;
  const tssPct = Math.min(100, (weekly.actual_tss / (weekly.target_tss || 1)) * 100);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={`relative bg-surface-card rounded-xl shadow-card border ${
        hasAlert ? 'border-run/30' : 'border-border-card'
      }`}
    >
      {hasAlert && <div className="absolute inset-0 bg-run/[0.03] rounded-xl pointer-events-none" />}

      <div className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between">
          <Link href={`/coach/athlete/${athlete.id}`} className="flex items-center gap-2.5 group">
            <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm text-white shrink-0 ${
              hasAlert ? 'bg-run shadow-button' : 'bg-surface-hover text-coral-500'
            }`}>
              {(athlete.first_name || 'T')[0].toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-bold text-text-primary group-hover:text-coral-500 transition-colors leading-tight">
                {athlete.first_name || 'Triatleta'} {athlete.last_name || ''}
              </p>
              <p className="text-[10px] text-text-muted">{athlete.email}</p>
            </div>
          </Link>

          <div className="flex items-center gap-1">
            <Link href={`/coach/chat?athlete=${athlete.id}`} className="w-7 h-7 flex items-center justify-center rounded-md text-text-muted hover:text-text-secondary hover:bg-surface-hover transition-all">
              <MessageSquare className="w-3.5 h-3.5" />
            </Link>
            <button
              onClick={() => onRemove(athlete.id)}
              disabled={removingId === athlete.id}
              className="w-7 h-7 flex items-center justify-center rounded-md text-text-muted hover:text-run hover:bg-run/10 transition-all cursor-pointer disabled:opacity-40"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Plan + Grupo — compact one row */}
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-surface-hover rounded-lg p-2">
            <p className="text-[9px] font-bold uppercase tracking-wider text-text-muted mb-1">Plan</p>
            {assigningId === athlete.id ? (
              <div className="flex items-center gap-1.5 text-[10px] text-text-muted"><Clock className="w-3 h-3 animate-spin" /><span>Asignando...</span></div>
            ) : (
              <select
                aria-label="Asignar Plan"
                value={athlete.active_plan_id || ''}
                onChange={e => onAssignPlan(athlete.id, e.target.value)}
                disabled={assigningId === athlete.id}
                className="w-full bg-transparent text-text-primary text-[10px] rounded-md px-1.5 py-1 outline-none border border-border-subtle font-medium cursor-pointer disabled:opacity-40"
              >
                <option value="">Sin plan</option>
                {plans.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            )}
          </div>
          <div className="bg-surface-hover rounded-lg p-2">
            <p className="text-[9px] font-bold uppercase tracking-wider text-text-muted mb-1">Grupo</p>
            {isAssigningGroup ? (
              <div className="flex items-center gap-1.5 text-[10px] text-text-muted"><span className="w-2.5 h-2.5 border-2 border-coral-500 border-t-transparent rounded-full animate-spin" /><span>Asignando...</span></div>
            ) : (
              <select
                aria-label="Asignar Grupo"
                value={athlete.group_id || 'none'}
                onChange={handleGroupChange}
                disabled={isAssigningGroup}
                className="w-full bg-transparent text-text-primary text-[10px] rounded-md px-1.5 py-1 outline-none border border-border-subtle font-medium cursor-pointer disabled:opacity-40"
              >
                <option value="none">Sin grupo</option>
                {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
            )}
          </div>
        </div>

        {/* Readiness + Sesión de hoy — compact row */}
        <div className="grid grid-cols-2 gap-2">
          <div className={`bg-surface-hover rounded-lg p-2 ${hasAlert ? 'border border-run/20' : ''}`}>
            <div className="flex items-center justify-between">
              <p className="text-[9px] font-bold uppercase tracking-wider text-text-muted flex items-center gap-1">
                <Activity className="w-2.5 h-2.5" /> Readiness
              </p>
              {hasAlert && <AlertTriangle className="w-2.5 h-2.5 text-run" />}
            </div>
            <p className={`text-xs font-bold mt-0.5 ${hasAlert ? 'text-run' : 'text-bike'}`}>
              {bio ? `${bio.readiness_score || '--'}% (HRV: ${bio.hrv || '--'})` : 'Pendiente hoy'}
            </p>
          </div>
          <div className="bg-surface-hover rounded-lg p-2">
            <p className="text-[9px] font-bold uppercase tracking-wider text-text-muted mb-1">Sesión Hoy</p>
            {today ? (
              <div className="flex items-center gap-1.5">
                <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase border ${
                  today.status === 'completed' ? 'bg-bike/10 text-bike border-bike/20'
                  : today.status === 'missed' ? 'bg-run/10 text-run border-run/20'
                  : 'bg-warning/10 text-warning border-warning/20'
                }`}>
                  {today.sport_type}
                </span>
                <span className="text-[10px] text-text-secondary truncate">{today.description}</span>
              </div>
            ) : (
              <p className="text-[10px] text-text-muted flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-surface-hover" />
                Descanso
              </p>
            )}
          </div>
        </div>

        {/* TSS Progress */}
        <div className="pt-2 border-t border-border-subtle/50">
          <div className="flex justify-between items-center text-[10px] mb-1">
            <span className="text-text-muted font-semibold">TSS Semanal</span>
            <span className={`font-bold ${alerts.high_tss ? 'text-run' : 'text-text-primary'}`}>
              {weekly.actual_tss} / {weekly.target_tss || 0}
            </span>
          </div>
          <div className="w-full h-1.5 bg-surface-hover rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${alerts.high_tss ? 'bg-run' : 'bg-coral-500'}`}
              style={{ width: `${tssPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Footer: View Dashboard */}
      <Link href={`/coach/athlete/${athlete.id}`} className="block border-t border-border-subtle/50 p-3 text-center text-[10px] font-semibold text-text-muted hover:text-coral-500 hover:bg-surface-hover transition-all rounded-b-xl">
        <span className="flex items-center justify-center gap-1">
          <Eye className="w-3 h-3" />
          Ver Dashboard Completo
        </span>
      </Link>
    </motion.div>
  );
}
