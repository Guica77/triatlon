'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
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
    <div className="overflow-hidden rounded-2xl border border-border-default bg-surface-card relative h-full">
      <div className="flex items-center justify-between px-5 py-4">
        <h3 className="text-base font-semibold tracking-tight text-text-primary">Fisiología y zonas</h3>
        <button 
          onClick={() => setIsEditing(true)}
          title="Editar métricas"
          aria-label="Editar métricas"
          className="flex min-h-11 items-center gap-1 text-sm font-medium text-accent transition-colors hover:text-accent/80"
        >
          Editar
        </button>
      </div>

      <div className="divide-y divide-border-subtle border-t border-border-subtle">
        <div className="flex items-center justify-between gap-4 px-5 py-3"><span className="text-sm text-text-secondary">FTP bici</span><span className="text-sm font-medium text-text-primary">{ftp ? `${ftp} W` : '—'}</span></div>
        <div className="flex items-center justify-between gap-4 px-5 py-3"><span className="text-sm text-text-secondary">Ritmo nado</span><span className="text-sm font-medium text-text-primary">{swimPace ? `${swimPace} /100 m` : '—'}</span></div>
        <div className="flex items-center justify-between gap-4 px-5 py-3"><span className="text-sm text-text-secondary">Ritmo carrera</span><span className="text-sm font-medium text-text-primary">{runPace ? `${runPace} /km` : '—'}</span></div>
        <div className="flex items-center justify-between gap-4 px-5 py-3"><span className="text-sm text-text-secondary">Horas base</span><span className="text-sm font-medium text-text-primary">{baselineHours ? `${baselineHours} / semana` : '—'}</span></div>
      </div>

      {previousInjuries && (
        <div className="border-t border-border-subtle px-5 py-3">
          <p className="text-xs font-medium text-danger">Lesiones / patologías previas</p>
          <p className="mt-1 text-sm text-text-secondary">{previousInjuries}</p>
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
