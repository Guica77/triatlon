'use client';

import * as React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AnimatedButton } from '@/components/ui/animated-button';
import { Plus, X, Trash2, Users, ArrowRight, FolderPlus, Group, Award, Zap } from 'lucide-react';
import { createCoachGroup, deleteCoachGroup } from '@/app/(app)/coach/dashboard/actions';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

interface CoachGroupsManagerProps {
  isOpen: boolean;
  onClose: () => void;
  groups: any[];
}

export function CoachGroupsManager({ isOpen, onClose, groups }: CoachGroupsManagerProps) {
  const [newGroupName, setNewGroupName] = React.useState('');
  const [newColor, setNewColor] = React.useState('#e56a00');
  const [loading, setLoading] = React.useState(false);

  const colors = [
    { value: '#e56a00', label: 'Naranja', class: 'bg-cyan-500' },
    { value: '#22c55e', label: 'Verde', class: 'bg-emerald-500' },
    { value: '#3b82f6', label: 'Azul', class: 'bg-blue-500' },
    { value: '#ef4444', label: 'Rojo', class: 'bg-red-500' },
    { value: '#a855f7', label: 'Púrpura', class: 'bg-purple-500' },
    { value: '#f59e0b', label: 'Ámbar', class: 'bg-amber-500' },
  ];

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;

    setLoading(true);
    await createCoachGroup(newGroupName, newColor);
    setNewGroupName('');
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este grupo? Los atletas no se eliminarán.')) return;
    setLoading(true);
    await deleteCoachGroup(id);
    setLoading(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md p-6 bg-surface-elevated border-border-default">
        <DialogHeader className="mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-swim/15 border border-swim/20 flex items-center justify-center">
              <Users className="w-5 h-5 text-swim" />
            </div>
            <div className="text-left">
              <DialogTitle className="text-lg font-bold text-text-primary">Gestionar Grupos</DialogTitle>
              <p className="text-xs text-text-muted">Organiza a tus atletas por nivel, objetivo o equipo</p>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleCreate} className="space-y-3 mb-6 p-4 rounded-xl bg-surface-card/60 border border-border-subtle">
          <label className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">Nuevo Grupo</label>
          <input
            type="text"
            placeholder="Ej. Elite, Sub-23, Principiantes..."
            value={newGroupName}
            onChange={e => setNewGroupName(e.target.value)}
            className="w-full bg-surface-elevated border border-border-default rounded-xl px-4 py-2.5 text-sm text-text-primary placeholder-text-muted focus:border-swim/50 outline-none transition-all"
            required
            disabled={loading}
          />

          {/* Color picker */}
          <div>
            <p className="text-[10px] text-text-secondary font-bold mb-2">Color del grupo</p>
            <div className="flex gap-2">
              {colors.map(c => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setNewColor(c.value)}
                  className={`w-8 h-8 rounded-full border-2 transition-all ${newColor === c.value ? 'border-white scale-110 shadow-card' : 'border-transparent'} ${c.class}`}
                  title={c.label}
                />
              ))}
            </div>
          </div>

          <AnimatedButton
            type="submit"
            disabled={loading || !newGroupName.trim()}
            className="w-full py-2.5 text-xs font-bold !bg-swim/10 hover:!bg-swim/20 !text-swim border border-swim/20 flex items-center justify-center gap-1.5"
          >
            <FolderPlus className="w-3.5 h-3.5" />
            {loading ? 'Creando...' : 'Crear Grupo'}
          </AnimatedButton>
        </form>

        {/* Groups list */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-[10px] text-text-secondary font-bold uppercase tracking-wider mb-2">
            <span>Grupos ({groups.length})</span>
            <span>Atletas</span>
          </div>

          <AnimatePresence>
            {groups.map((group) => (
              <motion.div
                key={group.id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0 }}
                className="flex items-center gap-3 p-3 rounded-xl bg-surface-card/60 border border-border-subtle hover:border-border-default transition-all group"
              >
                <div
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: group.color || '#e56a00' }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-text-primary truncate">{group.name}</p>
                  <p className="text-[10px] text-text-secondary">{group._count?.athletes || 0} atletas</p>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                  <Link
                    href={`/coach/group/${group.id}`}
                    className="p-2 rounded-lg text-text-muted hover:text-swim hover:bg-swim/10 transition-all"
                    title="Ir al grupo"
                  >
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                  <button
                    onClick={() => handleDelete(group.id)}
                    className="p-2 rounded-lg text-text-muted hover:text-danger hover:bg-danger/10 transition-all"
                    title="Eliminar grupo"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {groups.length === 0 && (
            <div className="text-center py-8">
              <Users className="w-8 h-8 text-text-muted mx-auto mb-2" />
              <p className="text-xs text-text-secondary font-medium">Aún no hay grupos</p>
              <p className="text-[10px] text-text-secondary mt-1">Crea tu primer grupo para organizar a tus atletas</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}