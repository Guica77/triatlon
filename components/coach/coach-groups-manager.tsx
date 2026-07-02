'use client';

import * as React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { AnimatedButton } from '@/components/ui/animated-button';
import { Plus, X, Trash2, Users } from 'lucide-react';
import { createCoachGroup, deleteCoachGroup } from '@/app/(app)/coach/dashboard/actions';

interface CoachGroupsManagerProps {
  isOpen: boolean;
  onClose: () => void;
  groups: any[];
}

export function CoachGroupsManager({ isOpen, onClose, groups }: CoachGroupsManagerProps) {
  const [newGroupName, setNewGroupName] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;
    
    setLoading(true);
    await createCoachGroup(newGroupName);
    setNewGroupName('');
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este grupo? Los atletas no serán eliminados, solo se quedarán sin grupo asignado.')) return;
    setLoading(true);
    await deleteCoachGroup(id);
    setLoading(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md p-6">
        <DialogHeader className="mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-50 border border-cyan-100 flex items-center justify-center shrink-0">
              <Users className="w-5 h-5 text-cyan-600" />
            </div>
            <div className="text-left">
              <DialogTitle className="text-lg font-bold">Gestionar Grupos</DialogTitle>
              <DialogDescription className="text-xs">Crea carpetas o etiquetas para organizar a tus atletas.</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleCreate} className="flex gap-2 mb-6">
          <input 
            type="text" 
            placeholder="Ej. Iniciación, Élite..." 
            value={newGroupName}
            onChange={e => setNewGroupName(e.target.value)}
            className="flex-1 bg-zinc-50 border border-zinc-200 rounded-xl px-4 text-sm focus:ring-2 focus:ring-cyan-500 focus:outline-none"
            required
            disabled={loading}
          />
          <AnimatedButton type="submit" disabled={loading} className="!px-4 !py-2.5 bg-zinc-900 text-white rounded-xl text-sm font-semibold hover:bg-zinc-800 transition">
            Crear
          </AnimatedButton>
        </form>

        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 scrollbar-thin">
          {groups.length === 0 ? (
            <p className="text-center text-zinc-500 text-sm py-4">No tienes grupos creados aún.</p>
          ) : (
            groups.map(g => (
              <div key={g.id} className="flex items-center justify-between p-3 rounded-xl border border-zinc-200 bg-white shadow-sm">
                <span className="font-semibold text-sm text-zinc-800">{g.name}</span>
                <button 
                  type="button"
                  onClick={() => handleDelete(g.id)}
                  disabled={loading}
                  className="p-1.5 text-zinc-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
