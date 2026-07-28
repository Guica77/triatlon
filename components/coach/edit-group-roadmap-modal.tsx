'use client';
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AnimatedButton } from '@/components/ui/animated-button';
import { MapPin, Plus, Trash2 } from 'lucide-react';
import { updateGroupRoadmap, RoadmapEvent } from '@/app/(app)/coach/group/[id]/actions';

interface EditGroupRoadmapModalProps {
  groupId: string;
  initialEvents: RoadmapEvent[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const EVENT_TYPES = ['A-Race', 'B-Race', 'Test', 'Camp', 'Other'] as const;

export function EditGroupRoadmapModal({ groupId, initialEvents, open, onOpenChange }: EditGroupRoadmapModalProps) {
  const [events, setEvents] = useState<RoadmapEvent[]>(initialEvents || []);
  const [loading, setLoading] = useState(false);

  const addEvent = () => {
    setEvents([...events, { id: crypto.randomUUID(), title: '', date: '', type: 'Other' }]);
  };

  const removeEvent = (id: string) => {
    setEvents(events.filter(e => e.id !== id));
  };

  const updateEvent = (id: string, field: keyof RoadmapEvent, value: string) => {
    setEvents(events.map(e => e.id === id ? { ...e, [field]: value } : e));
  };

  const handleSave = async () => {
    setLoading(true);
    await updateGroupRoadmap(groupId, events);
    setLoading(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-black text-zinc-900 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-cyan-600" /> Roadmap del Grupo
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 mt-4">
          {events.map(event => (
            <div key={event.id} className="flex gap-2 items-start">
              <input
                type="text"
                value={event.title}
                onChange={e => updateEvent(event.id, 'title', e.target.value)}
                placeholder="Nombre del evento"
                className="flex-1 text-sm p-2 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
              <input
                type="date"
                value={event.date}
                onChange={e => updateEvent(event.id, 'date', e.target.value)}
                className="text-sm p-2 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
              <select
                value={event.type}
                onChange={e => updateEvent(event.id, 'type', e.target.value)}
                className="text-sm p-2 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
              >
                {EVENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <button onClick={() => removeEvent(event.id)} className="p-2 text-zinc-400 hover:text-red-500 transition">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        <div className="flex justify-between mt-4">
          <AnimatedButton variant="ghost" onClick={addEvent} className="text-sm">
            <Plus className="w-4 h-4 mr-1" /> Agregar Evento
          </AnimatedButton>
          <AnimatedButton onClick={handleSave} disabled={loading} className="text-sm">
            {loading ? 'Guardando...' : 'Guardar Roadmap'}
          </AnimatedButton>
        </div>
      </DialogContent>
    </Dialog>
  );
}
