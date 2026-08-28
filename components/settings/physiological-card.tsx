'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Edit2, X, Zap, Waves, Footprints, Clock } from 'lucide-react';
import { updatePhysiologicalData } from '@/app/(app)/settings/actions';
import { AnimatedButton } from '@/components/ui/animated-button';

interface PhysiologicalCardProps {
  ftp: number | null;
  swimPace: string | null;
  runPace: string | null;
  baselineHours: string | null;
  previousInjuries: string | null;
}

export function PhysiologicalCard({ ftp, swimPace, runPace, baselineHours, previousInjuries }: PhysiologicalCardProps) {
  const [isEditing, setIsEditing] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  
  const [form, setForm] = React.useState({
    current_ftp: ftp?.toString() || '',
    current_swim_pace: swimPace || '',
    current_run_pace: runPace || '',
    baseline_training_hours: baselineHours || '7-10h',
    previous_injuries: previousInjuries || '',
  });

  const handleSave = async () => {
    setLoading(true);
    await updatePhysiologicalData({
      current_ftp: form.current_ftp ? parseInt(form.current_ftp) : null,
      current_swim_pace: form.current_swim_pace || null,
      current_run_pace: form.current_run_pace || null,
      baseline_training_hours: form.baseline_training_hours,
      previous_injuries: form.previous_injuries || null,
    });
    setLoading(false);
    setIsEditing(false);
  };

  return (
    <div className="p-6 rounded-2xl bg-surface-card border border-border-default shadow-card relative h-full flex flex-col group">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-bike/10 border border-bike/20 flex items-center justify-center ">
            <Activity className="w-4 h-4 text-bike" />
          </div>
          <h3 className="text-sm sm:text-base font-bold text-text-primary tracking-tight leading-tight">Fisiología y Zonas</h3>
        </div>
        <button 
          onClick={() => setIsEditing(true)}
          title="Editar métricas"
          aria-label="Editar métricas"
          className="w-8 h-8 rounded-full bg-surface-hover border border-border-default flex items-center justify-center text-text-secondary hover:text-swim hover:border-swim hover:bg-swim/10 transition-colors cursor-pointer"
        >
          <Edit2 className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 flex-1 mb-4">
        <div className="p-4 rounded-xl bg-surface-hover border border-border-subtle/80 flex flex-col justify-center ">
          <div className="flex items-center gap-1.5 text-text-muted mb-1">
            <Zap className="w-3.5 h-3.5 text-warning" />
            <span className="text-[10px] uppercase tracking-widest font-black">FTP Bici</span>
          </div>
          <p className="text-xl font-black text-text-primary">{ftp ? `${ftp} W` : '---'}</p>
        </div>
        <div className="p-4 rounded-xl bg-surface-hover border border-border-subtle/80 flex flex-col justify-center ">
          <div className="flex items-center gap-1.5 text-text-muted mb-1">
            <Waves className="w-3.5 h-3.5 text-swim" />
            <span className="text-[10px] uppercase tracking-widest font-black">Ritmo Nado</span>
          </div>
          <p className="text-xl font-black text-text-primary">{swimPace ? `${swimPace}` : '---'}</p>
          <p className="text-[9px] text-text-secondary mt-0.5">/ 100m</p>
        </div>
        <div className="p-4 rounded-xl bg-surface-hover border border-border-subtle/80 flex flex-col justify-center ">
          <div className="flex items-center gap-1.5 text-text-muted mb-1">
            <Footprints className="w-3.5 h-3.5 text-run" />
            <span className="text-[10px] uppercase tracking-widest font-black">Ritmo Carrera</span>
          </div>
          <p className="text-xl font-black text-text-primary">{runPace ? `${runPace}` : '---'}</p>
          <p className="text-[9px] text-text-secondary mt-0.5">/ km</p>
        </div>
        <div className="p-4 rounded-xl bg-surface-hover border border-border-subtle/80 flex flex-col justify-center ">
          <div className="flex items-center gap-1.5 text-text-muted mb-1">
            <Clock className="w-3.5 h-3.5 text-purple-500" />
            <span className="text-[10px] uppercase tracking-widest font-black">Horas Base</span>
          </div>
          <p className="text-xl font-black text-text-primary">{baselineHours || '---'}</p>
          <p className="text-[9px] text-text-secondary mt-0.5">/ semana</p>
        </div>
      </div>

      {previousInjuries && (
        <div className="mt-2 p-3 bg-danger/10 border border-danger/20 rounded-xl">
          <p className="text-[10px] font-bold text-danger uppercase tracking-widest mb-1">Lesiones / Patologías Previas</p>
          <p className="text-xs text-danger">{previousInjuries}</p>
        </div>
      )}

      <AnimatePresence>
        {isEditing && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-surface-app/70 backdrop-blur-sm rounded-2xl"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 10 }}
              className="w-full bg-surface-card border border-border-default rounded-2xl p-5 shadow-elevated relative"
            >
              <button 
                onClick={() => setIsEditing(false)} 
                className="absolute top-4 right-4 text-text-muted hover:text-text-primary cursor-pointer"
                title="Cerrar"
              >
                <X className="w-4 h-4" />
              </button>
              
              <h4 className="text-base font-bold text-text-primary mb-4">Editar Métricas Fisiológicas</h4>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="ftpInput" className="text-[10px] text-text-secondary uppercase font-black mb-1 block">FTP Ciclismo</label>
                    <input 
                      id="ftpInput"
                      type="number" 
                      value={form.current_ftp} 
                      onChange={e => setForm({...form, current_ftp: e.target.value})} 
                      className="w-full bg-surface-card border border-border-default rounded-xl px-3 py-2 text-sm text-text-primary focus:border-swim focus:ring-1 focus:ring-swim outline-none" 
                      placeholder="250" 
                      title="FTP Ciclismo"
                    />
                  </div>
                  <div>
                    <label htmlFor="swimPaceInput" className="text-[10px] text-text-secondary uppercase font-black mb-1 block">Ritmo Natación</label>
                    <input 
                      id="swimPaceInput"
                      type="text" 
                      value={form.current_swim_pace} 
                      onChange={e => setForm({...form, current_swim_pace: e.target.value})} 
                      className="w-full bg-surface-card border border-border-default rounded-xl px-3 py-2 text-sm text-text-primary focus:border-swim focus:ring-1 focus:ring-swim outline-none" 
                      placeholder="01:45" 
                      title="Ritmo Natación"
                    />
                  </div>
                  <div>
                    <label htmlFor="runPaceInput" className="text-[10px] text-text-secondary uppercase font-black mb-1 block">Ritmo Carrera</label>
                    <input 
                      id="runPaceInput"
                      type="text" 
                      value={form.current_run_pace} 
                      onChange={e => setForm({...form, current_run_pace: e.target.value})} 
                      className="w-full bg-surface-card border border-border-default rounded-xl px-3 py-2 text-sm text-text-primary focus:border-swim focus:ring-1 focus:ring-swim outline-none" 
                      placeholder="04:30" 
                      title="Ritmo Carrera"
                    />
                  </div>
                  <div>
                    <label htmlFor="baselineHours" className="text-[10px] text-text-secondary uppercase font-black mb-1 block">Horas Base</label>
                    <select 
                      id="baselineHours"
                      value={form.baseline_training_hours} 
                      onChange={e => setForm({...form, baseline_training_hours: e.target.value})} 
                      className="w-full bg-surface-card border border-border-default rounded-xl px-3 py-2.5 text-sm text-text-primary focus:border-swim focus:ring-1 focus:ring-swim outline-none"
                      title="Horas base"
                    >
                      <option value="4-6h">4-6h</option>
                      <option value="7-10h">7-10h</option>
                      <option value="12+h">12+h</option>
                    </select>
                  </div>
                </div>
                
                <div className="mt-2">
                  <label htmlFor="injuriesInput" className="text-[10px] text-text-secondary uppercase font-black mb-1 block">Lesiones / Patologías Previas</label>
                  <textarea 
                    id="injuriesInput"
                    value={form.previous_injuries} 
                    onChange={e => setForm({...form, previous_injuries: e.target.value})} 
                    className="w-full bg-surface-card border border-border-default rounded-xl px-3 py-2 text-sm text-text-primary focus:border-swim focus:ring-1 focus:ring-swim outline-none min-h-[60px]" 
                    placeholder="Ej. Condromalacia, esguince..." 
                  />
                </div>
                
                <AnimatedButton 
                  variant="primary" 
                  onClick={handleSave} 
                  disabled={loading} 
                  className="w-full py-2.5 text-xs font-black !bg-swim hover:!bg-swim/90 !text-white flex justify-center  cursor-pointer"
                >
                  {loading ? 'Guardando...' : 'Guardar Cambios'}
                </AnimatedButton>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
