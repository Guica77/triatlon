'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ProCard } from '@/components/ui/pro-card';
import { Clock, Activity, CheckCircle2, ListFilter } from 'lucide-react';

interface Suggestion {
  id: string;
  feedback_type: string;
  status: string;
  content: string;
  created_at: string;
}

interface SuggestionsListProps {
  initialSuggestions: Suggestion[];
}

export function SuggestionsList({ initialSuggestions }: SuggestionsListProps) {
  const [filter, setFilter] = useState<string>('all');

  const pendingCount = initialSuggestions.filter((s) => s.status === 'pending').length;
  const reviewedCount = initialSuggestions.filter((s) => s.status === 'reviewed').length;
  const implementedCount = initialSuggestions.filter((s) => s.status === 'implemented').length;

  const filteredSuggestions = initialSuggestions.filter((s) => {
    if (filter === 'all') return true;
    return s.status === filter;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'implemented':
        return (
          <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            Implementado
          </span>
        );
      case 'reviewed':
        return (
          <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/30 flex items-center gap-1">
            <Activity className="w-3 h-3 animate-pulse" />
            En Revisión
          </span>
        );
      default:
        return (
          <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Pendiente
          </span>
        );
    }
  };

  const getFeedbackTypeBadge = (type: string) => {
    let label = 'Sugerencia';
    switch (type) {
      case 'platform_improvement':
        label = 'Mejora de App';
        break;
      case 'plan_adjustment':
        label = 'Ajuste de Plan';
        break;
      case 'athlete_review':
        label = 'Revisión Atleta';
        break;
    }
    return (
      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800/80 border border-zinc-700/80 text-zinc-300">
        {label}
      </span>
    );
  };

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
            <ListFilter className="w-3.5 h-3.5 text-cyan-400" /> Tus Sugerencias Enviadas
          </h3>
          <span className="text-[10px] font-mono text-zinc-500">{filteredSuggestions.length} mostradas</span>
        </div>

        <div className="flex flex-wrap gap-1.5 p-1 bg-zinc-950/60 rounded-xl border border-zinc-800/60">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              filter === 'all'
                ? 'bg-zinc-800 text-white font-semibold shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Todas ({initialSuggestions.length})
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
              filter === 'pending'
                ? 'bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/30'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Pendientes ({pendingCount})
          </button>
          <button
            onClick={() => setFilter('reviewed')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
              filter === 'reviewed'
                ? 'bg-blue-500/20 text-blue-300 font-semibold border border-blue-500/30'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            En Revisión ({reviewedCount})
          </button>
          <button
            onClick={() => setFilter('implemented')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
              filter === 'implemented'
                ? 'bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Implementadas ({implementedCount})
          </button>
        </div>
      </div>

      {/* Listado con animaciones */}
      <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1 custom-scrollbar">
        <AnimatePresence mode="popLayout">
          {filteredSuggestions.length > 0 ? (
            filteredSuggestions.map((s) => (
              <motion.div
                key={s.id}
                layout
                initial={{ opacity: 0, y: 12, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -12, scale: 0.98 }}
                transition={{ duration: 0.25, ease: 'easeInOut' }}
              >
                <ProCard className="p-4 bg-zinc-900/30 border-zinc-800/60 hover:border-zinc-700/60 transition-colors space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    {getFeedbackTypeBadge(s.feedback_type)}
                    {getStatusBadge(s.status)}
                  </div>
                  <p className="text-xs text-zinc-300 leading-relaxed break-words whitespace-pre-wrap">
                    {s.content}
                  </p>
                  <p className="text-[10px] text-zinc-500 font-mono flex justify-between items-center">
                    <span>Enviado el {new Date(s.created_at).toLocaleDateString()}</span>
                    <span>ID: #{s.id.substring(0, 6)}</span>
                  </p>
                </ProCard>
              </motion.div>
            ))
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-xs text-zinc-500 italic text-center py-8 bg-zinc-900/20 rounded-2xl border border-zinc-800/40 flex flex-col items-center justify-center gap-2"
            >
              <span className="text-base">📬</span>
              <span>No hay sugerencias en esta categoría.</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
