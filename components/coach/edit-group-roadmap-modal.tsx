'use client';

<<<<<<< HEAD
import * as React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AnimatedButton } from '@/components/ui/animated-button';
import { Target, Calendar as CalendarIcon, Loader2, Plus, Trash2, Map } from 'lucide-react';
import { updateGroupRoadmap, RoadmapEvent } from '@/app/(app)/coach/group/[id]/actions';
import { format, parseISO, compareAsc } from 'date-fns';

interface EditGroupRoadmapModalProps {
  groupId: string;
  initialRoadmapEvents: RoadmapEvent[] | null;
  children: React.ReactNode;
}

export function EditGroupRoadmapModal({ groupId, initialRoadmapEvents, children }: EditGroupRoadmapModalProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [events, setEvents] = React.useState<RoadmapEvent[]>(initialRoadmapEvents || []);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (isOpen) {
      setEvents(initialRoadmapEvents || []);
    }
  }, [isOpen, initialRoadmapEvents]);

  const handleAddEvent = () => {
    const newEvent: RoadmapEvent = {
      id: crypto.randomUUID(),
      title: '',
      date: new Date().toISOString().split('T')[0],
      type: 'Other'
    };
    setEvents([...events, newEvent]);
  };

  const handleRemoveEvent = (id: string) => {
    setEvents(events.filter(e => e.id !== id));
  };

  const handleChange = (id: string, field: keyof RoadmapEvent, value: string) => {
    setEvents(events.map(e => e.id === id ? { ...e, [field]: value } : e));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Sort events by date before saving
    const sortedEvents = [...events]
      .filter(ev => ev.title.trim() !== '' && ev.date) // Remove empty ones
      .sort((a, b) => compareAsc(parseISO(a.date), parseISO(b.date)));

    await updateGroupRoadmap(groupId, sortedEvents);
    
    setLoading(false);
    setIsOpen(false);
  };

  const getTypeColor = (type: string) => {
    switch(type) {
      case 'A-Race': return 'text-red-600 bg-red-50 border-red-200';
      case 'B-Race': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'Test': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'Camp': return 'text-purple-600 bg-purple-50 border-purple-200';
      default: return 'text-zinc-600 bg-zinc-50 border-zinc-200';
    }
  };

  const sortedCurrentEvents = [...events].sort((a, b) => compareAsc(parseISO(a.date), parseISO(b.date)));

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <div className="cursor-pointer hover:opacity-80 transition-opacity">
          {children}
        </div>
      </DialogTrigger>
      <DialogContent className="max-w-2xl p-6 bg-zinc-50/50">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-black text-zinc-900">
            <Map className="w-6 h-6 text-indigo-600" />
            Roadmap de la Temporada
          </DialogTitle>
          <p className="text-sm text-zinc-500">
            Planifica los grandes hitos de la temporada del grupo. El próximo evento más cercano aparecerá automáticamente en la portada del Hub.
          </p>
        </DialogHeader>
        
        <form onSubmit={handleSave} className="space-y-6 mt-4">
          <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-zinc-100 bg-zinc-50 flex justify-between items-center">
              <h4 className="font-bold text-zinc-800 text-sm">Hitos y Carreras</h4>
              <AnimatedButton 
                type="button" 
                size="sm" 
                variant="secondary"
                onClick={handleAddEvent}
                className="h-8 rounded-lg text-xs"
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                Añadir Hito
              </AnimatedButton>
            </div>
            
            <div className="p-4 max-h-[50vh] overflow-y-auto space-y-4">
              {sortedCurrentEvents.length === 0 ? (
                <div className="text-center py-8 opacity-60">
                  <Map className="w-12 h-12 text-zinc-300 mx-auto mb-3" />
                  <p className="text-sm font-medium text-zinc-500">No hay hitos programados en el roadmap.</p>
                </div>
              ) : (
                <div className="relative">
                  {/* Timeline line */}
                  <div className="absolute left-4 top-4 bottom-4 w-px bg-zinc-200" />
                  
                  {sortedCurrentEvents.map((ev, index) => (
                    <div key={ev.id} className="flex gap-4 relative z-10 mb-4 last:mb-0">
                      {/* Timeline dot */}
                      <div className="w-8 flex justify-center pt-3 shrink-0">
                        <div className={`w-3 h-3 rounded-full border-2 border-white ring-1 ring-zinc-200 bg-indigo-500`} />
                      </div>
                      
                      <div className="flex-1 bg-white border border-zinc-200 rounded-xl p-3 shadow-sm flex items-start gap-3 transition-all hover:border-indigo-300">
                        <div className="flex-1 space-y-3">
                          <div className="flex gap-3">
                            <div className="flex-1">
                              <label htmlFor={`title-${ev.id}`} className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1 block">Título del Evento</label>
                              <input 
                                id={`title-${ev.id}`}
                                type="text"
                                value={ev.title}
                                onChange={e => handleChange(ev.id, 'title', e.target.value)}
                                placeholder="Ej: Medio Ironman Mallorca"
                                aria-label="Título del evento"
                                className="w-full border-b border-zinc-200 py-1 text-sm font-bold text-zinc-800 outline-none focus:border-indigo-500 bg-transparent"
                                required
                              />
                            </div>
                            <div className="w-32">
                              <label htmlFor={`type-${ev.id}`} className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1 block">Tipo</label>
                              <select 
                                id={`type-${ev.id}`}
                                aria-label="Tipo de evento"
                                title="Tipo de evento"
                                value={ev.type}
                                onChange={e => handleChange(ev.id, 'type', e.target.value)}
                                className={`w-full py-1.5 px-2 text-xs font-bold rounded-lg border outline-none ${getTypeColor(ev.type)}`}
                              >
                                <option value="A-Race">Competición A</option>
                                <option value="B-Race">Competición B</option>
                                <option value="Test">Semana de Test</option>
                                <option value="Camp">Training Camp</option>
                                <option value="Other">Otro Hito</option>
                              </select>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2 flex-1">
                              <CalendarIcon className="w-4 h-4 text-zinc-400" />
                              <input 
                                type="date"
                                aria-label="Fecha del evento"
                                title="Fecha del evento"
                                placeholder="Fecha"
                                value={ev.date}
                                onChange={e => handleChange(ev.id, 'date', e.target.value)}
                                className="border-none bg-transparent text-sm font-medium text-zinc-600 outline-none focus:text-indigo-600"
                                required
                              />
                            </div>
                          </div>
                        </div>
                        <button
                          type="button"
                          aria-label="Eliminar evento"
                          title="Eliminar evento"
                          onClick={() => handleRemoveEvent(ev.id)}
                          className="p-1.5 text-zinc-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-3">
            <AnimatedButton 
              type="button" 
              variant="secondary" 
              className="flex-1 rounded-xl bg-white"
              onClick={() => setIsOpen(false)}
            >
              Cancelar
            </AnimatedButton>
            <AnimatedButton 
              type="submit" 
              disabled={loading} 
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Guardar Roadmap'}
            </AnimatedButton>
          </div>
        </form>
=======
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
>>>>>>> prueba
      </DialogContent>
    </Dialog>
  );
}
