import * as React from 'react';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { getCoachDashboardData } from '@/app/feedback/feedback-actions';
import { ProCard } from '@/components/ui/pro-card';
import { AnimatedButton } from '@/components/ui/animated-button';
import { CoachSuggestionForm } from '@/components/feedback/coach-suggestion-form';
import { Trophy, Users, MessageSquare, AlertCircle, CheckCircle2, Clock, Activity, BarChart2, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default async function CoachPortalPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { athletes, suggestions } = await getCoachDashboardData();

  const pendingCount = suggestions.filter(s => s.status === 'pending').length;
  const reviewedCount = suggestions.filter(s => s.status === 'reviewed').length;
  const implementedCount = suggestions.filter(s => s.status === 'implemented').length;

  return (
    <div className="min-h-screen bg-[var(--color-background)] pb-24 text-white">
      
      {/* Top Navbar */}
      <header className="border-b border-[var(--color-border)] bg-[var(--color-background)]/80 backdrop-blur-md sticky top-0 z-50 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center shadow-inner">
            <Users className="w-4 h-4 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-base font-medium text-zinc-50">Portal de Entrenadores</h1>
            <p className="text-xs text-cyan-400 font-mono">Modo Supervisión Pro Max</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/dashboard">
            <AnimatedButton variant="ghost" size="sm" className="border border-zinc-800">
              Mi Dashboard de Atleta
            </AnimatedButton>
          </Link>
          <Link href="/analytics">
            <AnimatedButton variant="ghost" size="sm" className="border border-zinc-800 flex items-center gap-2 text-cyan-400">
              <BarChart2 className="w-4 h-4" />
              <span>Analíticas Globales</span>
            </AnimatedButton>
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 pt-8 space-y-8">
        
        {/* Bento Grid Header Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <ProCard className="bg-gradient-to-br from-zinc-900 to-zinc-800/80 border-zinc-800">
            <div className="flex justify-between items-start">
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Atletas Asignados</p>
              <Users className="w-5 h-5 text-cyan-400" />
            </div>
            <p className="text-3xl font-bold text-white mt-2">{athletes.length}</p>
            <p className="text-xs text-zinc-500 mt-1">Supervisión en tiempo real</p>
          </ProCard>

          <ProCard className="bg-gradient-to-br from-zinc-900 to-zinc-800/80 border-zinc-800">
            <div className="flex justify-between items-start">
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Sugerencias Pendientes</p>
              <Clock className="w-5 h-5 text-amber-400" />
            </div>
            <p className="text-3xl font-bold text-amber-400 mt-2">{pendingCount}</p>
            <p className="text-xs text-zinc-500 mt-1">En espera de revisión</p>
          </ProCard>

          <ProCard className="bg-gradient-to-br from-zinc-900 to-zinc-800/80 border-zinc-800">
            <div className="flex justify-between items-start">
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">En Evaluación</p>
              <Activity className="w-5 h-5 text-blue-400" />
            </div>
            <p className="text-3xl font-bold text-blue-400 mt-2">{reviewedCount}</p>
            <p className="text-xs text-zinc-500 mt-1">Equipo de desarrollo</p>
          </ProCard>

          <ProCard className="bg-gradient-to-br from-zinc-900 to-zinc-800/80 border-zinc-800">
            <div className="flex justify-between items-start">
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Implementadas</p>
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            </div>
            <p className="text-3xl font-bold text-emerald-400 mt-2">{implementedCount}</p>
            <p className="text-xs text-emerald-500/80 mt-1">Mejoras activas en la app</p>
          </ProCard>
        </div>

        {/* Bento Grid Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* Columna Izquierda: Lista de Atletas y Feedbacks Recientes (2 Columnas del Bento) */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                <Activity className="w-4 h-4 text-cyan-400" /> Estado Biométrico y RPE de Atletas
              </h2>
              <span className="text-xs text-zinc-500">Actualizado al instante</span>
            </div>

            <div className="space-y-4">
              {athletes.map((ath) => {
                const latestFb = ath.recent_feedbacks[0];
                return (
                  <ProCard key={ath.id} className="border-zinc-800/80 bg-zinc-900/40 hover:border-zinc-700 transition-all">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800/60 pb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-lg font-bold text-white">{ath.first_name} {ath.last_name}</h3>
                          <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-zinc-800 border border-zinc-700 text-cyan-400 font-medium">
                            {ath.level}
                          </span>
                        </div>
                        {ath.target_race_name && (
                          <p className="text-xs text-zinc-400 flex items-center gap-1.5">
                            <Trophy className="w-3.5 h-3.5 text-amber-500" />
                            {ath.target_race_name} • <span className="text-zinc-500">{ath.target_race_date}</span>
                          </p>
                        )}
                      </div>

                      {/* RPE & Feeling Badge */}
                      {latestFb ? (
                        <div className="flex items-center gap-3 bg-zinc-800/40 p-3 rounded-2xl border border-zinc-700/50 self-start sm:self-auto">
                          <div className="text-center px-3 py-1 rounded-xl bg-zinc-900 border border-zinc-700">
                            <p className="text-[10px] uppercase font-semibold text-zinc-500">RPE</p>
                            <p className={`text-lg font-bold ${latestFb.rpe_score >= 8 ? 'text-rose-400' : latestFb.rpe_score >= 6 ? 'text-amber-400' : 'text-emerald-400'}`}>
                              {latestFb.rpe_score}/10
                            </p>
                          </div>
                          <div>
                            <p className="text-xs font-bold text-zinc-200 capitalize">Sensación: {latestFb.feeling}</p>
                            <p className="text-[11px] text-zinc-500 font-mono">{new Date(latestFb.created_at).toLocaleDateString()}</p>
                          </div>
                        </div>
                      ) : (
                        <div className="text-xs text-zinc-500 italic self-center">Sin evaluaciones recientes</div>
                      )}
                    </div>

                    {/* Notas del Atleta */}
                    {latestFb?.notes && (
                      <div className="pt-4">
                        <p className="text-xs font-semibold text-zinc-400 mb-1">Notas del py-atleta:</p>
                        <p className="text-sm text-zinc-300 bg-zinc-800/30 p-3.5 rounded-xl border border-zinc-800/80 italic">
                          &ldquo;{latestFb.notes}&rdquo;
                        </p>
                      </div>
                    )}

                    {/* Histórico de los últimos 5 */}
                    {ath.recent_feedbacks.length > 1 && (
                      <div className="pt-4 flex items-center gap-2 overflow-x-auto pb-1">
                        <span className="text-[11px] font-semibold text-zinc-500 uppercase mr-1">Histórico RPE:</span>
                        {ath.recent_feedbacks.slice(1).map((fb, idx) => (
                          <div key={idx} className="flex items-center gap-1 bg-zinc-800/40 px-2.5 py-1 rounded-lg border border-zinc-700/40 text-xs">
                            <span className={`font-bold ${fb.rpe_score >= 8 ? 'text-rose-400' : fb.rpe_score >= 6 ? 'text-amber-400' : 'text-emerald-400'}`}>
                              {fb.rpe_score}
                            </span>
                            <span className="text-zinc-500">({fb.feeling[0].toUpperCase()})</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </ProCard>
                );
              })}
            </div>
          </div>

          {/* Columna Derecha: Formulario de Sugerencias y Estado de Reportes (1 Columna del Bento) */}
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-cyan-400" /> Proponer Mejoras a la App
              </h2>
            </div>

            {/* Formulario Interactivo */}
            <CoachSuggestionForm athletes={athletes} />

            {/* Lista de Sugerencias Enviadas */}
            <div className="space-y-3 pt-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500">Tus Sugerencias Enviadas</h3>
              {suggestions.length > 0 ? (
                suggestions.map((s) => (
                  <ProCard key={s.id} className="p-4 bg-zinc-900/30 border-zinc-800/60 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-zinc-300">
                        {s.feedback_type === 'platform_improvement' ? 'Mejora de App' : s.feedback_type === 'plan_adjustment' ? 'Ajuste de Plan' : 'Revisión'}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        s.status === 'implemented' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' :
                        s.status === 'reviewed' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30' :
                        'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                      }`}>
                        {s.status === 'implemented' ? 'Implementado' : s.status === 'reviewed' ? 'En Revisión' : 'Pendiente'}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-300 line-clamp-3 leading-relaxed">{s.content}</p>
                    <p className="text-[10px] text-zinc-500 font-mono">{new Date(s.created_at).toLocaleDateString()}</p>
                  </ProCard>
                ))
              ) : (
                <p className="text-xs text-zinc-500 italic text-center py-6 bg-zinc-900/20 rounded-2xl border border-zinc-800/40">
                  Aún no has enviado sugerencias de mejora.
                </p>
              )}
            </div>
          </div>

        </div>

      </main>
    </div>
  );
}
