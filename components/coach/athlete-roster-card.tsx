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
  assigningId: string | null;
  removingId: string | null;
  onPlanSelect: (athleteId: string, planId: string) => void;
  onRemove: (athleteId: string) => void;
}

export function AthleteRosterCard({
  athlete,
  plans,
  assigningId,
  removingId,
  onPlanSelect,
  onRemove
}: AthleteRosterCardProps) {
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
      className={`relative p-5 rounded-2xl border bg-[#121214] shadow-xl group transition-all duration-300 hover:scale-[1.02] ${
        hasAlert ? 'border-red-500/30' : 'border-zinc-800 hover:border-cyan-500/30'
      }`}
    >
      {/* Glow Effect for Alerts */}
      {hasAlert && (
        <div className="absolute inset-0 bg-red-500/5 rounded-2xl blur-xl pointer-events-none" />
      )}

      {/* Header: Avatar & Info */}
      <div className="flex justify-between items-start mb-4 relative z-10">
        <div className="flex items-center gap-3">
          <Link href={`/coach/athlete/${athlete.id}`} className="group/avatar shrink-0 relative">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg shadow-inner transition-all ${
              hasAlert ? 'bg-gradient-to-br from-red-600 to-rose-600 border border-red-400' : 'bg-gradient-to-br from-cyan-600 to-indigo-600 border border-zinc-700 group-hover/avatar:border-cyan-400'
            }`}>
              {(athlete.first_name || 'T')[0].toUpperCase()}
            </div>
            {hasAlert && (
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-red-500 border-2 border-[#121214] animate-pulse" />
            )}
          </Link>
          <div>
            <Link href={`/coach/athlete/${athlete.id}`} className="text-base font-bold text-white hover:text-cyan-400 transition-colors">
              {athlete.first_name || 'Triatleta'} {athlete.last_name || ''}
            </Link>
            <span className="text-xs text-zinc-500 block truncate max-w-[150px]">{athlete.email}</span>
          </div>
        </div>
        
        {/* Quick Actions */}
        <div className="flex items-center gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
          <Link href={`/coach/chat?athlete=${athlete.id}`}>
            <AnimatedButton variant="ghost" size="icon" className="w-8 h-8 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg">
              <MessageSquare className="w-3.5 h-3.5" />
            </AnimatedButton>
          </Link>
          <AnimatedButton
            variant="ghost"
            size="icon"
            onClick={() => onRemove(athlete.id)}
            disabled={removingId === athlete.id}
            className="w-8 h-8 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </AnimatedButton>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4 relative z-10">
        {/* Plan Select */}
        <div className="space-y-1.5 bg-zinc-900/50 p-2.5 rounded-xl border border-zinc-800/80">
          <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Plan de Entrenamiento</label>
          {assigningId === athlete.id ? (
            <div className="flex items-center gap-1.5 text-xs text-zinc-400 py-1">
              <Clock className="w-3 h-3 animate-spin" />
              <span>Asignando...</span>
            </div>
          ) : (
            <select
              value={athlete.active_plan_id || ''}
              onChange={(e) => onPlanSelect(athlete.id, e.target.value)}
              className="bg-transparent text-xs text-zinc-300 outline-none w-full cursor-pointer"
            >
              <option value="">Sin Plan Activo</option>
              {plans.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          )}
        </div>

        {/* Biometrics / Readiness */}
        <div className={`space-y-1.5 p-2.5 rounded-xl border ${hasAlert ? 'bg-red-500/10 border-red-500/20' : 'bg-zinc-900/50 border-zinc-800/80'}`}>
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-1">
              <Activity className="w-3 h-3" /> Readiness
            </label>
            {hasAlert && <AlertTriangle className="w-3 h-3 text-red-400 animate-pulse" />}
          </div>
          {bio ? (
            <div className="flex flex-col">
              <span className={`text-xs font-bold ${athlete.alerts.low_hrv ? 'text-red-400' : 'text-emerald-400'}`}>
                {bio.readiness_score || '--'}% (HRV: {bio.hrv || '--'})
              </span>
            </div>
          ) : (
            <span className="text-xs text-zinc-600 block py-0.5">Pendiente hoy</span>
          )}
        </div>
      </div>

      {/* Today's Workout */}
      <div className="mb-4 bg-zinc-950/40 p-3 rounded-xl border border-zinc-850 relative z-10">
        <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1.5 block">Sesión de Hoy</label>
        {today ? (
          <div className="flex items-start gap-2">
            <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase border shrink-0 ${
              today.status === 'completed' 
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                : today.status === 'missed'
                ? 'bg-red-500/10 text-red-400 border-red-500/20'
                : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
            }`}>
              {today.sport_type}
            </span>
            <span className="text-xs text-zinc-300 line-clamp-2 leading-relaxed">
              {today.description}
            </span>
          </div>
        ) : (
          <span className="text-xs text-zinc-500 flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-zinc-700" />
            Día de Descanso Programado
          </span>
        )}
      </div>

      {/* TSS Progress Bar */}
      <div className="pt-3 border-t border-zinc-800/60 relative z-10">
        <div className="flex justify-between items-center text-[10px] mb-1.5">
          <span className="text-zinc-500 font-medium uppercase tracking-wider">TSS Semanal</span>
          <span className={`font-bold ${alerts.high_tss ? 'text-red-400' : 'text-cyan-400'}`}>
            {weekly.actual_tss} / {weekly.target_tss || 0}
          </span>
        </div>
        <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
          <div 
            className={`h-full rounded-full transition-all duration-1000 ${
              alerts.high_tss ? 'bg-red-500' : 'bg-gradient-to-r from-cyan-500 to-blue-500'
            }`}
            style={{ width: `${tssPercentage}%` }}
          />
        </div>
      </div>
      
      {/* View Full Dashboard Button */}
      <div className="mt-4 pt-3 border-t border-zinc-800/60">
        <Link href={`/coach/athlete/${athlete.id}`}>
          <AnimatedButton variant="ghost" className="w-full py-2 bg-zinc-900/50 hover:bg-zinc-800 border border-zinc-800 text-xs font-semibold text-zinc-300 hover:text-white rounded-xl flex items-center justify-center gap-1.5">
            <Eye className="w-3.5 h-3.5" />
            Abrir Dashboard Completo
          </AnimatedButton>
        </Link>
      </div>

    </motion.div>
  );
}
