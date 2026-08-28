'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Edit2, Check, X, Zap } from 'lucide-react';
import { AnimatedButton } from '@/components/ui/animated-button';
import { updateAthleteZonesByCoach } from '@/app/(app)/coach/athlete/[id]/actions';

interface CoachAthleteZonesEditorProps {
  athleteId: string;
  initialFtp: number | null;
  initialMaxHr: number | null;
  initialSwimPace: string | null;
  initialRunPace: string | null;
}

export function CoachAthleteZonesEditor({ athleteId, initialFtp, initialMaxHr, initialSwimPace, initialRunPace }: CoachAthleteZonesEditorProps) {
  const [isEditing, setIsEditing] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  
  const [ftp, setFtp] = React.useState(initialFtp?.toString() || '');
  const [maxHr, setMaxHr] = React.useState(initialMaxHr?.toString() || '');
  const [swim, setSwim] = React.useState(initialSwimPace || '');
  const [run, setRun] = React.useState(initialRunPace || '');

  const handleSave = async () => {
    setLoading(true);
    const payload = {
      current_ftp: ftp ? parseInt(ftp, 10) : null,
      max_hr: maxHr ? parseInt(maxHr, 10) : null,
      current_swim_pace: swim || null,
      current_run_pace: run || null,
    };
    
    await updateAthleteZonesByCoach(athleteId, payload);
    setIsEditing(false);
    setLoading(false);
  };

  const handleCancel = () => {
    setFtp(initialFtp?.toString() || '');
    setMaxHr(initialMaxHr?.toString() || '');
    setSwim(initialSwimPace || '');
    setRun(initialRunPace || '');
    setIsEditing(false);
  };

  return (
    <div className="bg-surface-card rounded-2xl shadow-card border border-border-default overflow-hidden h-full flex flex-col">
      {/* Header */}
      <div className="p-5 border-b border-border-subtle flex justify-between items-center bg-surface-hover/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-coral-500/10 border border-coral-500/20 flex items-center justify-center shrink-0">
            <Zap className="w-5 h-5 text-coral-500" />
          </div>
          <div>
            <h3 className="text-sm font-black text-text-primary tracking-tight uppercase">Umbrales & Zonas</h3>
            <p className="text-[11px] font-medium text-text-secondary leading-tight mt-0.5">Define los umbrales base del atleta.</p>
          </div>
        </div>

        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            className="p-2 text-text-muted hover:text-swim hover:bg-swim/10 rounded-xl transition"
            title="Editar Umbrales"
          >
            <Edit2 className="w-4 h-4" />
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={handleCancel}
              disabled={loading}
              title="Cancelar"
              aria-label="Cancelar edición"
              className="p-2 text-text-muted hover:text-danger hover:bg-danger/10 rounded-xl transition"
            >
              <X className="w-4 h-4" />
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              title="Guardar"
              aria-label="Guardar umbrales"
              className="p-2 text-swim hover:bg-swim/10 rounded-xl transition disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="p-5 flex-1 flex flex-col justify-center space-y-4">
        {/* FTP */}
        <div className="flex justify-between items-center p-3 rounded-xl bg-surface-hover border border-border-subtle">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted">FTP Ciclismo (W)</p>
            {!isEditing ? (
              <p className="text-lg font-black text-text-primary">{ftp || 'N/A'}</p>
            ) : (
              <input 
                type="number" 
                value={ftp} 
                onChange={e => setFtp(e.target.value)}
                placeholder="Ej. 250"
                className="w-20 mt-1 bg-surface-elevated border border-border-default text-sm font-bold text-text-primary rounded px-2 py-1 outline-none focus:ring-1 focus:ring-swim"
              />
            )}
          </div>
          <Activity className="w-6 h-6 text-orange-400 opacity-20" />
        </div>

        {/* FC Max */}
        <div className="flex justify-between items-center p-3 rounded-xl bg-surface-hover border border-border-subtle">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted">FC Máxima / Umbral (ppm)</p>
            {!isEditing ? (
              <p className="text-lg font-black text-text-primary">{maxHr || 'N/A'}</p>
            ) : (
              <input 
                type="number" 
                value={maxHr} 
                onChange={e => setMaxHr(e.target.value)}
                placeholder="Ej. 185"
                className="w-20 mt-1 bg-surface-elevated border border-border-default text-sm font-bold text-text-primary rounded px-2 py-1 outline-none focus:ring-1 focus:ring-swim"
              />
            )}
          </div>
          <Activity className="w-6 h-6 text-red-400 opacity-20" />
        </div>

        {/* Ritmo Nado */}
        <div className="flex justify-between items-center p-3 rounded-xl bg-surface-hover border border-border-subtle">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Ritmo Umbral Nado (/100m)</p>
            {!isEditing ? (
              <p className="text-lg font-black text-text-primary">{swim || 'N/A'}</p>
            ) : (
              <input 
                type="text" 
                value={swim} 
                onChange={e => setSwim(e.target.value)}
                placeholder="1:45"
                className="w-20 mt-1 bg-surface-elevated border border-border-default text-sm font-bold text-text-primary rounded px-2 py-1 outline-none focus:ring-1 focus:ring-swim"
              />
            )}
          </div>
          <Activity className="w-6 h-6 text-blue-400 opacity-20" />
        </div>

        {/* Ritmo Carrera */}
        <div className="flex justify-between items-center p-3 rounded-xl bg-surface-hover border border-border-subtle">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Ritmo Umbral Carrera (/km)</p>
            {!isEditing ? (
              <p className="text-lg font-black text-text-primary">{run || 'N/A'}</p>
            ) : (
              <input 
                type="text" 
                value={run} 
                onChange={e => setRun(e.target.value)}
                placeholder="4:30"
                className="w-20 mt-1 bg-surface-elevated border border-border-default text-sm font-bold text-text-primary rounded px-2 py-1 outline-none focus:ring-1 focus:ring-swim"
              />
            )}
          </div>
          <Activity className="w-6 h-6 text-emerald-400 opacity-20" />
        </div>
      </div>
    </div>
  );
}
