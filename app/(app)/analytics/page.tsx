import * as React from 'react';
import { getAnalyticsDashboardData } from './analytics-actions';
import { PerformanceChartCard } from '@/components/analytics/performance-chart-card';
import { WeeklyTssCard } from '@/components/analytics/weekly-tss-card';
import { SportDistributionCard } from '@/components/analytics/sport-distribution-card';
import { PacePowerHistoryCard } from '@/components/analytics/pace-power-history-card';
import { TrainingZonesCard } from '@/components/analytics/training-zones-card';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { BarChart2 } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';

export default async function AnalyticsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Obtener perfil activo y analíticas en paralelo
  const [profileRes, analyticsData] = await Promise.all([
    supabase
      .from('profiles')
      .select('first_name, level, training_plans(name)')
      .eq('id', user.id)
      .single(),
    getAnalyticsDashboardData()
  ]);

  const profile = profileRes.data;
  const activePlan = profile?.training_plans;

  const title = profile?.level === 'principiante' ? 'Mi Progreso y Constancia' : 'Métricas de Rendimiento';
  const subtitle = `${activePlan?.name || 'Plan de Periodización'} • ${profile?.first_name || 'Triatleta'}`;

  return (
    <div className="min-h-screen bg-bg-app w-full overflow-x-hidden">
      <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-6 pb-24 sm:pb-8 space-y-6">
        <PageHeader icon={BarChart2} title={title} subtitle={subtitle} />

        {/* Encabezado de Sección */}
        <div className="space-y-1">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-cyan-500">
            {profile?.level === 'principiante' ? 'Mi Semana de Entrenamiento' : 'Panel de Rendimiento Unificado'}
          </h2>
          <p className="text-sm text-zinc-400">
            {profile?.level === 'principiante'
              ? 'Sigue tus sesiones, tu adherencia al plan y la distribución de los tres deportes.'
              : 'Monitoriza tu volumen acumulado (CTL), gestionа tu fatiga (ATL) y planifica tus picos de forma (TSB) con precisión.'}
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
            athleteLevel={profile?.level || 'intermedio'}
          />

          {/* Bloque 2: Carga Semanal vs Objetivo */}
          <WeeklyTssCard
            actualTss={analyticsData.weeklyTssActual}
            targetTss={analyticsData.weeklyTssTarget}
            athleteLevel={profile?.level || 'intermedio'}
          />

          {/* Bloque 3: Distribución por Deporte */}
          <SportDistributionCard
            distribution={analyticsData.sportDistribution}
            weeklyDistance={analyticsData.weeklyDistance}
          />

          {/* Bloque 4: Historial de Ritmos y FTP (Ancho Completo) */}
          <div className="md:col-span-2">
            <PacePowerHistoryCard history={analyticsData.pacePowerHistory} />
          </div>

          {/* Bloque 5: Zonas de Entrenamiento (Ancho Completo) */}
          <div className="md:col-span-2">
            <TrainingZonesCard zones={analyticsData.hrZoneDistribution} athleteLevel={profile?.level || 'intermedio'} />
          </div>
        </div>

      </main>
    </div>
  );
}
