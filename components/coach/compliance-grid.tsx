'use client';

import * as React from 'react';
import { GroupAthleteItem } from '@/app/(app)/coach/group/[id]/actions';
import { format, parseISO, startOfWeek, addDays, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { Check, X, Minus, Activity } from 'lucide-react';

interface ComplianceGridProps {
  athletes: GroupAthleteItem[];
}

export function ComplianceGrid({ athletes }: ComplianceGridProps) {
  const today = new Date();
  const weekStart = startOfWeek(today, { weekStartsOn: 1 });
  
  // Generate the 7 days of the current week
  const weekDays = Array.from({ length: 7 }).map((_, i) => addDays(weekStart, i));

  const getWorkoutStatusForDay = (athlete: GroupAthleteItem, date: Date) => {
    // Note: week_workouts contains the workouts for the current week
    const dateStr = date.toISOString().split('T')[0];
    const workout = athlete.week_workouts?.find(w => w.scheduled_date === dateStr);
    
    if (!workout) return 'none';
    if (workout.status === 'completed') return 'completed';
    if (workout.status === 'skipped' || workout.status === 'missed') return 'missed';
    return 'pending'; // scheduled but not completed or missed
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-emerald-500 border-emerald-600 shadow-[0_0_8px_rgba(16,185,129,0.4)]';
      case 'missed': return 'bg-red-500 border-red-600 shadow-[0_0_8px_rgba(239,68,68,0.4)]';
      case 'pending': return 'bg-amber-400 border-amber-500 shadow-[0_0_8px_rgba(251,191,36,0.4)]';
      default: return 'bg-zinc-100 border-zinc-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <Check className="w-3 h-3 text-white" />;
      case 'missed': return <X className="w-3 h-3 text-white" />;
      case 'pending': return <Minus className="w-3 h-3 text-white" />;
      default: return null;
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
      <div className="p-4 border-b border-zinc-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
            <Activity className="w-4 h-4 text-indigo-600" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-zinc-900">Matriz de Cumplimiento</h3>
            <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold">Semana Actual</p>
          </div>
        </div>
        <div className="flex items-center gap-4 text-xs font-medium text-zinc-500">
          <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Completado</div>
          <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-amber-400" /> Pendiente</div>
          <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-red-500" /> Saltado</div>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-zinc-50 border-b border-zinc-100 text-xs font-bold text-zinc-500 uppercase">
            <tr>
              <th className="px-4 py-3 min-w-[150px]">Atleta</th>
              {weekDays.map((day, i) => (
                <th key={i} className={`px-2 py-3 text-center ${isSameDay(day, today) ? 'bg-indigo-50/50 text-indigo-700' : ''}`}>
                  {format(day, 'EEEEEE', { locale: es })}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {athletes.map(athlete => (
              <tr key={athlete.id} className="hover:bg-zinc-50/50 transition-colors">
                <td className="px-4 py-3 font-semibold text-zinc-800">
                  {athlete.first_name} {athlete.last_name}
                </td>
                {weekDays.map((day, i) => {
                  const status = getWorkoutStatusForDay(athlete, day);
                  return (
                    <td key={i} className={`px-2 py-2 text-center ${isSameDay(day, today) ? 'bg-indigo-50/10' : ''}`}>
                      <div className="flex justify-center">
                        <div 
                          title={`${format(day, 'EEEE', { locale: es })}: ${status}`}
                          className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all hover:scale-110 cursor-help ${getStatusColor(status)}`}
                        >
                          {getStatusIcon(status)}
                        </div>
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
            {athletes.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-zinc-500 font-medium">
                  No hay atletas en este grupo.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
