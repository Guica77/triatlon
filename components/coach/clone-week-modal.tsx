'use client';

import * as React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AnimatedButton } from '@/components/ui/animated-button';
import { Copy, Loader2, Calendar as CalendarIcon, ArrowRight } from 'lucide-react';
import { cloneGroupWeek } from '@/app/(app)/coach/group/[id]/actions';
import { format, parseISO, startOfWeek, addWeeks } from 'date-fns';
import { es } from 'date-fns/locale';

interface CloneWeekModalProps {
  groupId: string;
  currentDate: Date;
  children?: React.ReactNode;
}

export function CloneWeekModal({ groupId, currentDate, children }: CloneWeekModalProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  
  const currentWeekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  
  const [sourceWeek, setSourceWeek] = React.useState(format(currentWeekStart, 'yyyy-MM-dd'));
  const [targetWeek, setTargetWeek] = React.useState(format(addWeeks(currentWeekStart, 1), 'yyyy-MM-dd'));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sourceWeek || !targetWeek) return;
    
    setLoading(true);
    await cloneGroupWeek(groupId, sourceWeek, targetWeek);
    setLoading(false);
    setIsOpen(false);
  };

  const formatWeekStr = (dateStr: string) => {
    if (!dateStr) return '';
    const date = parseISO(dateStr);
    const start = startOfWeek(date, { weekStartsOn: 1 });
    return `Semana del ${format(start, "d 'de' MMMM", { locale: es })}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children || (
          <AnimatedButton variant="secondary" size="sm" className="h-9 px-3 border-border-default">
            <Copy className="w-4 h-4 mr-2 text-text-secondary" />
            <span className="text-sm font-medium">Clonar Semana</span>
          </AnimatedButton>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md p-6 bg-surface-elevated">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-black text-text-primary">
            <Copy className="w-6 h-6 text-indigo-400" />
            Clonar Semana
          </DialogTitle>
          <p className="text-sm text-text-secondary">
            Copia todos los entrenamientos de una semana y pégalos en otra. Ideal para estructurar bloques de carga.
          </p>
        </DialogHeader>
        
        <form onSubmit={handleSave} className="space-y-6 mt-4">
          <div className="flex flex-col gap-4">
            <div className="bg-surface-card p-4 rounded-xl border border-border-default shadow-card">
              <label htmlFor="sourceWeek" className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-2 block">
                Origen (Copiar)
              </label>
              <div className="flex items-center gap-3">
                <CalendarIcon className="w-5 h-5 text-indigo-400" />
                <div className="flex-1">
                  <input
                    id="sourceWeek"
                    type="date"
                    title="Semana de Origen"
                    aria-label="Semana de Origen"
                    placeholder="Selecciona fecha de origen"
                    value={sourceWeek}
                    onChange={(e) => {
                      const d = new Date(e.target.value);
                      if (!isNaN(d.getTime())) {
                        setSourceWeek(format(startOfWeek(d, { weekStartsOn: 1 }), 'yyyy-MM-dd'));
                      } else {
                        setSourceWeek(e.target.value);
                      }
                    }}
                    className="w-full text-sm font-bold text-text-primary outline-none bg-transparent"
                    required
                  />
                  <p className="text-xs text-text-secondary mt-1">{formatWeekStr(sourceWeek)}</p>
                </div>
              </div>
            </div>

            <div className="flex justify-center -my-2 relative z-10">
              <div className="w-8 h-8 rounded-full bg-surface-card border border-border-default flex items-center justify-center shadow-card">
                <ArrowRight className="w-4 h-4 text-text-muted rotate-90 md:rotate-0" />
              </div>
            </div>

            <div className="bg-surface-card p-4 rounded-xl border border-indigo-500/30 shadow-card ring-1 ring-indigo-500/20">
              <label htmlFor="targetWeek" className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider mb-2 block">
                Destino (Pegar)
              </label>
              <div className="flex items-center gap-3">
                <CalendarIcon className="w-5 h-5 text-indigo-400" />
                <div className="flex-1">
                  <input
                    id="targetWeek"
                    type="date"
                    title="Semana de Destino"
                    aria-label="Semana de Destino"
                    placeholder="Selecciona fecha de destino"
                    value={targetWeek}
                    onChange={(e) => {
                      const d = new Date(e.target.value);
                      if (!isNaN(d.getTime())) {
                        setTargetWeek(format(startOfWeek(d, { weekStartsOn: 1 }), 'yyyy-MM-dd'));
                      } else {
                        setTargetWeek(e.target.value);
                      }
                    }}
                    className="w-full text-sm font-bold text-indigo-300 outline-none bg-transparent"
                    required
                  />
                  <p className="text-xs text-indigo-300/70 mt-1">{formatWeekStr(targetWeek)}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <AnimatedButton
              type="button"
              variant="secondary"
              className="flex-1 rounded-xl bg-surface-card"
              onClick={() => setIsOpen(false)}
            >
              Cancelar
            </AnimatedButton>
            <AnimatedButton 
              type="submit" 
              disabled={loading} 
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Clonar a Destino'}
            </AnimatedButton>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
