'use client';

import * as React from 'react';
import { Megaphone, Edit3, Check, Loader2, X } from 'lucide-react';
import { updateGroupAnnouncement } from '@/app/(app)/coach/group/[id]/actions';

interface GroupAnnouncementProps {
  groupId: string;
  initialAnnouncement: string | null;
}

export function GroupAnnouncement({ groupId, initialAnnouncement }: GroupAnnouncementProps) {
  const [isEditing, setIsEditing] = React.useState(false);
  const [announcement, setAnnouncement] = React.useState(initialAnnouncement || '');
  const [loading, setLoading] = React.useState(false);

  const handleSave = async () => {
    setLoading(true);
    await updateGroupAnnouncement(groupId, announcement);
    setLoading(false);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setAnnouncement(initialAnnouncement || '');
    setIsEditing(false);
  };

  return (
    <div className="bg-amber-50 rounded-2xl border border-amber-200 p-5 shadow-sm relative overflow-hidden group">
      {/* Decorative accent */}
      <div className="absolute top-0 left-0 w-1.5 h-full bg-amber-400" />
      
      <div className="flex justify-between items-start mb-3 pl-2">
        <div className="flex items-center gap-2 text-amber-700">
          <Megaphone className="w-5 h-5" />
          <h3 className="text-sm font-bold uppercase tracking-wider">Pizarra del Entrenador</h3>
        </div>
        {!isEditing && (
          <button 
            onClick={() => setIsEditing(true)}
            className="p-1.5 text-amber-500 hover:text-amber-700 hover:bg-amber-100/50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
            aria-label="Editar pizarra"
            title="Editar pizarra"
          >
            <Edit3 className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="pl-2">
        {isEditing ? (
          <div className="space-y-3">
            <textarea 
              value={announcement}
              onChange={(e) => setAnnouncement(e.target.value)}
              placeholder="Escribe un anuncio o notas para la semana..."
              className="w-full min-h-[100px] p-3 text-sm text-zinc-800 bg-white border border-amber-300 rounded-xl outline-none focus:ring-2 focus:ring-warning/40 resize-none"
              autoFocus
            />
            <div className="flex gap-2 justify-end">
              <button 
                onClick={handleCancel}
                disabled={loading}
                className="px-3 py-1.5 text-xs font-bold text-amber-700 bg-amber-100 hover:bg-amber-200 rounded-lg transition-colors flex items-center gap-1"
              >
                <X className="w-3.5 h-3.5" /> Cancelar
              </button>
              <button 
                onClick={handleSave}
                disabled={loading}
                className="px-3 py-1.5 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-lg transition-colors shadow-sm flex items-center gap-1"
              >
                {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />} Guardar
              </button>
            </div>
          </div>
        ) : (
          <div 
            onClick={() => setIsEditing(true)}
            className={`text-sm ${announcement ? 'text-amber-900' : 'text-amber-600/60 italic'} min-h-[40px] cursor-pointer`}
          >
            {announcement ? (
              <p className="whitespace-pre-wrap leading-relaxed">{announcement}</p>
            ) : (
              "Haz clic aquí para escribir una nota o anuncio para todo el grupo..."
            )}
          </div>
        )}
      </div>
    </div>
  );
}
