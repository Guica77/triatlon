import * as React from 'react';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { getCoachDashboardData } from '@/app/(app)/feedback/feedback-actions';
import { ProCard } from '@/components/ui/pro-card';
import { AnimatedButton } from '@/components/ui/animated-button';
import { CoachSuggestionForm } from '@/components/feedback/coach-suggestion-form';
import { SuggestionsList } from '@/components/feedback/suggestions-list';
import { MessageSquare, Clock, Activity, CheckCircle2, BarChart2 } from 'lucide-react';
import Link from 'next/link';

export default async function FeedbackPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { suggestions } = await getCoachDashboardData();

  const pendingCount = suggestions.filter(s => s.status === 'pending').length;
  const reviewedCount = suggestions.filter(s => s.status === 'reviewed').length;
  const implementedCount = suggestions.filter(s => s.status === 'implemented').length;

  return (
    <div className="min-h-screen bg-[var(--color-background)] pb-24 text-white">
      
      {/* Top Navbar */}
      <header className="border-b border-[var(--color-border)] bg-[var(--color-background)]/80 backdrop-blur-md sticky top-0 z-50 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-sport-swim/10 border border-sport-swim/30 flex items-center justify-center">
            <MessageSquare className="w-4 h-4 text-sport-swim" />
          </div>
          <div>
            <h1 className="text-base font-medium text-text-primary">Centro de Feedback</h1>
            <p className="text-xs text-sport-swim font-mono">Buzón de Sugerencias Pro Max</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/dashboard">
            <AnimatedButton variant="ghost" size="sm" className="border border-border-default">
              Mi Dashboard de Atleta
            </AnimatedButton>
          </Link>
          <Link href="/analytics">
            <AnimatedButton variant="ghost" size="sm" className="border border-border-default flex items-center gap-2 text-sport-swim">
              <BarChart2 className="w-4 h-4" />
              <span>Analíticas Globales</span>
            </AnimatedButton>
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 pt-8 space-y-8">
        
        {/* Bento Grid Header Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <ProCard className="bg-bg-card border-border-default">
            <div className="flex justify-between items-start">
              <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">Sugerencias Pendientes</p>
              <Clock className="w-5 h-5 text-amber-400" />
            </div>
            <p className="text-3xl font-bold text-amber-400 mt-2">{pendingCount}</p>
            <p className="text-xs text-text-muted mt-1">En espera de revisión</p>
          </ProCard>

          <ProCard className="bg-bg-card border-border-default">
            <div className="flex justify-between items-start">
              <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">En Evaluación</p>
              <Activity className="w-5 h-5 text-blue-400" />
            </div>
            <p className="text-3xl font-bold text-blue-400 mt-2">{reviewedCount}</p>
            <p className="text-xs text-text-muted mt-1">Equipo de desarrollo</p>
          </ProCard>

          <ProCard className="bg-bg-card border-border-default">
            <div className="flex justify-between items-start">
              <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">Implementadas</p>
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            </div>
            <p className="text-3xl font-bold text-emerald-400 mt-2">{implementedCount}</p>
            <p className="text-xs text-emerald-500/80 mt-1">Mejoras activas en la app</p>
          </ProCard>
        </div>

        {/* Bento Grid Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          
          {/* Columna Izquierda: Formulario de Sugerencias */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-sm font-bold uppercase tracking-wider text-text-muted flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-sport-swim" /> Proponer Mejoras a la App
              </h2>
            </div>
            <CoachSuggestionForm />
          </div>

          {/* Columna Derecha: Listado con filtros */}
          <div className="space-y-4">
            <SuggestionsList initialSuggestions={suggestions} />
          </div>

        </div>

      </main>
    </div>
  );
}
