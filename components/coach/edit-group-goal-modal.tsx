'use client';

import * as React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AnimatedButton } from '@/components/ui/animated-button';
import { Target, Calendar as CalendarIcon, Loader2 } from 'lucide-react';
import { updateGroupGoal } from '@/app/(app)/coach/group/[id]/actions';
import { format, differenceInWeeks } from 'date-fns';

interface EditGroupGoalModalProps {
  groupId: string;
  initialTargetName: string | null;
  initialTargetDate: string | null;
  children: React.ReactNode;
}

export function EditGroupGoalModal({ groupId, initialTargetName, initialTargetDate, children }: EditGroupGoalModalProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [targetName, setTargetName] = React.useState(initialTargetName || '');
  const [targetDate, setTargetDate] = React.useState(initialTargetDate || '');
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (isOpen) {
      setTargetName(initialTargetName || '');
      setTargetDate(initialTargetDate || '');
    }
  }, [isOpen, initialTargetName, initialTargetDate]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const nameToSave = targetName.trim() === '' ? null : targetName.trim();
    const dateToSave = targetDate.trim() === '' ? null : targetDate;

    await updateGroupGoal(groupId, nameToSave, dateToSave);
    
    setLoading(false);
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <div className="cursor-pointer hover:opacity-80 transition-opacity">
          {children}
        </div>
      </DialogTrigger>
      <DialogContent className="max-w-md p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="w-5 h-5 text-indigo-600" />
            Configurar Próximo Objetivo
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSave} className="space-y-4 mt-4">
          <div>
            <label htmlFor="targetName" className="text-xs font-bold text-zinc-500 uppercase tracking-wider block mb-1">Nombre de la prueba o evento</label>
            <div className="relative">
              <Target className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input 
                id="targetName" 
                type="text" 
                value={targetName}
                onChange={e => setTargetName(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500" 
                placeholder="Ej. Ironman Vitoria 2026" 
              />
            </div>
          </div>
          
          <div>
            <label htmlFor="targetDate" className="text-xs font-bold text-zinc-500 uppercase tracking-wider block mb-1">Fecha del evento</label>
            <div className="relative">
              <CalendarIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input 
                id="targetDate" 
                type="date" 
                value={targetDate}
                onChange={e => setTargetDate(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500" 
              />
            </div>
            {targetDate && (
              <p className="text-[11px] text-zinc-500 mt-2 font-medium ml-1">
                Faltan {Math.max(0, differenceInWeeks(new Date(targetDate), new Date()))} semanas aprox.
              </p>
            )}
          </div>

          <div className="pt-4 flex gap-3">
            <AnimatedButton 
              type="button" 
              variant="secondary" 
              className="flex-1 rounded-xl"
              onClick={() => setIsOpen(false)}
            >
              Cancelar
            </AnimatedButton>
            <AnimatedButton 
              type="submit" 
              disabled={loading} 
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Guardar Objetivo'}
            </AnimatedButton>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
