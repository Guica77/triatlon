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
          <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-bike/10 text-bike border border-bike/30 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            Implementado
          </span>
        );
      case 'reviewed':
        return (
          <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-swim/10 text-swim border border-swim/30 flex items-center gap-1">
            <Activity className="w-3 h-3" aria-hidden="true" />
            En Revisión
          </span>
        );
      default:
        return (
          <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-warning/10 text-warning border border-warning/30 flex items-center gap-1">
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
      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-surface-hover/80 border border-border-default text-text-muted">
        {label}
      </span>
    );
  };

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-text-muted flex items-center gap-1.5">
            <ListFilter className="w-3.5 h-3.5 text-swim" /> Tus Sugerencias Enviadas
          </h3>
          <span className="text-[10px] font-mono text-text-secondary">{filteredSuggestions.length} mostradas</span>
        </div>

        <div className="flex flex-wrap gap-1.5 p-1 bg-surface-app/60 rounded-xl border border-border-subtle/60">
          <button
            onClick={() => setFilter('all')}
            className={`min-h-9 px-3 py-1.5 rounded-lg text-xs font-medium transition-[background-color,color,border-color,opacity,transform] duration-150 ease-out active:scale-[0.98] motion-reduce:transition-opacity motion-reduce:active:scale-100 ${
              filter === 'all'
                ? 'bg-surface-hover text-text-primary font-semibold '
                : 'text-text-muted hover:text-text-muted'
            }`}
          >
            Todas ({initialSuggestions.length})
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`min-h-9 px-3 py-1.5 rounded-lg text-xs font-medium transition-[background-color,color,border-color,opacity,transform] duration-150 ease-out active:scale-[0.98] motion-reduce:transition-opacity motion-reduce:active:scale-100 flex items-center gap-1.5 ${
              filter === 'pending'
                ? 'bg-warning/20 text-warning font-semibold border border-warning/30'
                : 'text-text-muted hover:text-text-muted'
            }`}
          >
            Pendientes ({pendingCount})
          </button>
          <button
            onClick={() => setFilter('reviewed')}
            className={`min-h-9 px-3 py-1.5 rounded-lg text-xs font-medium transition-[background-color,color,border-color,opacity,transform] duration-150 ease-out active:scale-[0.98] motion-reduce:transition-opacity motion-reduce:active:scale-100 flex items-center gap-1.5 ${
              filter === 'reviewed'
                ? 'bg-swim/20 text-swim font-semibold border border-swim/30'
                : 'text-text-muted hover:text-text-muted'
            }`}
          >
            En Revisión ({reviewedCount})
          </button>
          <button
            onClick={() => setFilter('implemented')}
            className={`min-h-9 px-3 py-1.5 rounded-lg text-xs font-medium transition-[background-color,color,border-color,opacity,transform] duration-150 ease-out active:scale-[0.98] motion-reduce:transition-opacity motion-reduce:active:scale-100 flex items-center gap-1.5 ${
              filter === 'implemented'
                ? 'bg-bike/20 text-bike font-semibold border border-bike/30'
                : 'text-text-muted hover:text-text-muted'
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
                <ProCard className="p-4 bg-surface-card/30 border-border-subtle/60 hover:border-border-default transition-colors space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    {getFeedbackTypeBadge(s.feedback_type)}
                    {getStatusBadge(s.status)}
                  </div>
                  <p className="text-xs text-text-muted leading-relaxed break-words whitespace-pre-wrap">
                    {s.content}
                  </p>
                  <p className="text-[10px] text-text-secondary font-mono flex justify-between items-center">
                    <span suppressHydrationWarning>Enviado el {new Date(s.created_at).toLocaleDateString()}</span>
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
              className="text-xs text-text-secondary italic text-center py-8 bg-surface-card/20 rounded-2xl border border-border-subtle/40 flex flex-col items-center justify-center gap-2"
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
