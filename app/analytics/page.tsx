import * as React from 'react';
import { getAnalyticsDashboardData } from './analytics-actions';
import { PerformanceChartCard } from '@/components/analytics/performance-chart-card';
import { WeeklyTssCard } from '@/components/analytics/weekly-tss-card';
import { SportDistributionCard } from '@/components/analytics/sport-distribution-card';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { AnimatedButton } from '@/components/ui/animated-button';
import { BarChart2, ArrowLeft } from 'lucide-react';

export default async function AnalyticsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Obtener perfil activo
  const { data: profile } = await supabase
    .from('profiles')
    .select('first_name, level, training_plans(name)')
    .eq('id', user.id)
    .single();

  const activePlan = profile?.training_plans;

  // Obtener datos del Bento Grid de analíticas
  const analyticsData = await getAnalyticsDashboardData();

  return (
    <div className="min-h-screen bg-[var(--color-background)] pb-24">
      
      {/* Top Navbar */}
      <header className="border-b border-[var(--color-border)] bg-[var(--color-background)]/80 backdrop-blur-md sticky top-0 z-50 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center shadow-inner">
            <BarChart2 className="w-4 h-4 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-base font-medium text-zinc-50">Analíticas Avanzadas</h1>
            <p className="text-xs text-zinc-400 capitalize">
              {activePlan?.name || 'Plan de Entrenamiento'} • Atleta: {profile?.first_name || 'Triatleta'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/dashboard">
            <AnimatedButton variant="ghost" size="sm" className="border border-zinc-800 flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              <span>Volver al Dashboard</span>
            </AnimatedButton>
          </Link>
        </div>
      </header>

      {/* Contenedor Principal Bento Grid */}
      <main className="max-w-5xl mx-auto px-6 pt-8 space-y-8">
        
        {/* Encabezado de Sección */}
        <div className="space-y-1">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-cyan-400">
            Panel de Rendimiento Unificado
          </h2>
          <p className="text-sm text-zinc-400">
            Monitoriza tu carga acumulada (TSS), evita el sobreentrenamiento y planifica tus picos de forma con precisión milimétrica.
          </p>
        </div>

        {/* Cuadrícula Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Bloque 1: PMC Chart (Ancho Completo) */}
          <PerformanceChartCard
            pmcData={analyticsData.pmcData}
            currentCtl={analyticsData.currentCtl}
            currentAtl={analyticsData.currentAtl}
            currentTsb={analyticsData.currentTsb}
          />

          {/* Bloque 2: Carga Semanal vs Objetivo */}
          <WeeklyTssCard
            actualTss={analyticsData.weeklyTssActual}
            targetTss={analyticsData.weeklyTssTarget}
          />

          {/* Bloque 3: Distribución por Deporte */}
          <SportDistributionCard
            distribution={analyticsData.sportDistribution}
          />
        </div>

      </main>
    </div>
  );
}
