import * as React from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getBusinessMetrics, checkAdminAccess } from './owner-actions'
import { BarChart3, Users, TrendingUp, DollarSign, UserMinus, Activity, Target, Zap, UserPlus } from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'
import { MetricCard } from '@/components/admin/business-metric-card'
import { UserGrowthChart } from '@/components/admin/user-growth-chart'
import { ActiveUsersChart } from '@/components/admin/active-users-chart'
import { RecentUsersTable } from '@/components/admin/recent-users-table'
import { CohortRetentionTable } from '@/components/admin/cohort-retention-table'
import { ChurnBreakdownCard } from '@/components/admin/churn-breakdown-card'

export const dynamic = 'force-dynamic'

export default async function BusinessDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Check admin access
  const isAdmin = await checkAdminAccess()
  if (!isAdmin) redirect('/dashboard')

  let metrics
  let error: string | null = null

  try {
    metrics = await getBusinessMetrics()
  } catch (e) {
    error = 'No se pudieron cargar las métricas. Intenta de nuevo.'
  }

  if (error || !metrics) {
    return (
      <div className="min-h-screen bg-bg-app p-4 sm:p-6">
        <div className="max-w-7xl mx-auto space-y-8">
          <PageHeader icon={BarChart3} title="Panel de Control" subtitle="Error al cargar métricas" />
          <div className="bg-bg-card/80 border border-border-default rounded-xl p-8 text-center space-y-4">
            <BarChart3 className="w-12 h-12 text-text-secondary mx-auto" />
            <p className="text-sm text-text-muted font-medium">{error}</p>
            <p className="text-xs text-text-muted">Verifica que tengas datos en la base de datos.</p>
          </div>
        </div>
      </div>
    )
  }

  const {
    totalUsers, mrr, arpu, monthlyChurnRate, ltvCacRatio,
    ltv, cac, estimatedCac, premiumConversionRate,
    userGrowthPercent, newUsersThisMonth, newUsersLastMonth,
    premiumUsers, freeUsers, churnedUsers, premiumPercent,
    mau, wau, dau, dauMauRatio, stickiness, arr,
    avgSubscriptionMonths, quarterlyChurnRate,
    userGrowth, cohortRetention, churnByMonth,
    totalCoaches, avgAthletesPerCoach, recentUsers
  } = metrics

  const userGrowthDelta = newUsersThisMonth - newUsersLastMonth
  const newUsersTrend = userGrowthDelta > 0 ? 'up' as const : userGrowthDelta < 0 ? 'down' as const : 'neutral' as const
  const userGrowthTrend = userGrowthPercent > 0 ? 'up' as const : userGrowthPercent < 0 ? 'down' as const : 'neutral' as const

  return (
    <div className="min-h-screen bg-bg-app w-full overflow-x-hidden">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-24 sm:pb-8 space-y-8">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <PageHeader
              icon={BarChart3}
              title="Business Dashboard"
              subtitle={`${totalUsers} usuarios · ${mrr}€/mes MRR`}
            />
            {estimatedCac && (
              <p className="text-[9px] text-text-muted mt-1 flex items-center gap-1">
                <Zap className="w-2.5 h-2.5" />
                CAC estimado (conecta datos de marketing para precisión real)
              </p>
            )}
          </div>
          <div className="flex items-center gap-2 text-[10px] text-text-muted bg-bg-card border border-border-default rounded-lg px-3 py-2 shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-sport-bike animate-pulse" />
            Datos en tiempo real
          </div>
        </div>

        {/* KPI Row 1 — Core Business Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <MetricCard
            title="MRR"
            value={`${mrr.toLocaleString('es-ES', { minimumFractionDigits: 2 })}€`}
            subtitle={`${arr.toLocaleString('es-ES', { minimumFractionDigits: 0 })}€/año ARR`}
            icon={DollarSign}
            trend={newUsersTrend}
            trendValue={`${premiumUsers} premium · ${premiumPercent}%`}
            accentColor="text-sport-swim"
          />
          <MetricCard
            title="ARPU"
            value={`${arpu}€`}
            subtitle="Ingreso medio por usuario"
            icon={Activity}
            accentColor="text-sport-swim"
          />
          <MetricCard
            title="Churn Mensual"
            value={`${monthlyChurnRate}%`}
            subtitle={`${quarterlyChurnRate}% trimestral · ${churnedUsers} perdidos`}
            icon={UserMinus}
            trend={monthlyChurnRate > 10 ? 'down' : monthlyChurnRate > 5 ? 'neutral' : 'up'}
            trendValue={monthlyChurnRate <= 5 ? 'Saludable' : monthlyChurnRate <= 10 ? 'Aceptable' : 'Requiere atención'}
            accentColor={monthlyChurnRate > 10 ? 'text-sport-run' : monthlyChurnRate > 5 ? 'text-warning' : 'text-sport-bike'}
          />
          <MetricCard
            title="LTV"
            value={`${ltv}€`}
            subtitle={`${avgSubscriptionMonths} meses de media`}
            icon={Target}
            accentColor="text-sport-bike"
          />
          <MetricCard
            title="CAC"
            value={`${cac}€`}
            subtitle={estimatedCac ? 'Estimado · 500€/mes marketing' : 'Real'}
            icon={TrendingUp}
            accentColor="text-sport-bike"
          />
          <MetricCard
            title="LTV / CAC"
            value={`${ltvCacRatio}x`}
            subtitle={`${ltvCacRatio >= 3 ? '✅ Saludable' : ltvCacRatio >= 1 ? '⚠️ Mínimo' : '❌ Insostenible'}`}
            icon={Zap}
            trend={ltvCacRatio >= 3 ? 'up' : ltvCacRatio >= 1 ? 'neutral' : 'down'}
            trendValue={ltvCacRatio >= 3 ? 'Óptimo (>3x)' : ltvCacRatio >= 1 ? 'Mínimo (1x)' : 'Crítico (<1x)'}
            accentColor={ltvCacRatio >= 3 ? 'text-sport-bike' : ltvCacRatio >= 1 ? 'text-warning' : 'text-sport-run'}
          />
        </div>

        {/* KPI Row 2 — Growth & Engagement */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <MetricCard
            title="Usuarios Totales"
            value={totalUsers.toLocaleString()}
            subtitle={`+${newUsersThisMonth} este mes`}
            icon={Users}
            trend={userGrowthTrend}
            trendValue={`${userGrowthPercent > 0 ? '+' : ''}${userGrowthPercent}%`}
            accentColor="text-sport-swim"
          />
          <MetricCard
            title="Nuevos (este mes)"
            value={newUsersThisMonth}
            subtitle={`${newUsersLastMonth} el mes pasado`}
            icon={UserPlus}
            trend={newUsersTrend}
            trendValue={userGrowthDelta > 0 ? `+${userGrowthDelta}` : `${userGrowthDelta}`}
            accentColor="text-sport-swim"
          />
          <MetricCard
            title="MAU"
            value={mau.toLocaleString()}
            subtitle={`${dau} hoy · ${dauMauRatio}% DAU/MAU`}
            icon={Activity}
            trend={dauMauRatio > 20 ? 'up' : dauMauRatio > 10 ? 'neutral' : 'down'}
            trendValue={`${stickiness}% semanal`}
            accentColor="text-sport-swim"
          />
          <MetricCard
            title="Conversión Premium"
            value={`${premiumConversionRate}%`}
            subtitle={`${premiumUsers} de ${totalUsers}`}
            icon={Target}
            trend={premiumConversionRate > 15 ? 'up' : premiumConversionRate > 5 ? 'neutral' : 'down'}
            trendValue={premiumConversionRate > 10 ? 'Sobre media' : 'Por mejorar'}
            accentColor="text-sport-bike"
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* User Growth Chart */}
          <div className="bg-bg-card border border-border-default rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xs font-bold text-text-primary">Crecimiento de Usuarios</h3>
                <p className="text-[10px] text-text-muted">Registros mensuales (6 meses)</p>
              </div>
            </div>
            <UserGrowthChart data={userGrowth} />
          </div>

          {/* Churn Breakdown */}
          <ChurnBreakdownCard churnByMonth={churnByMonth} />
        </div>

        {/* Cohort Retention */}
        <CohortRetentionTable data={cohortRetention} />

        {/* Active Users & Recent Users */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ActiveUsersChart mau={mau} wau={wau} dau={dau} />

          <div className="bg-bg-card border border-border-default rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xs font-bold text-text-primary">Suscripciones</h3>
                <p className="text-[10px] text-text-muted">Distribución actual</p>
              </div>
            </div>
            <div className="space-y-4">
              {/* Premium bar */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-[10px]">
                  <span className="font-bold text-text-primary">Premium</span>
                  <span className="font-medium text-text-secondary">{premiumUsers} ({premiumPercent}%)</span>
                </div>
                <div className="h-2 bg-bg-hover rounded-full overflow-hidden">
                  <div className="h-full bg-sport-swim rounded-full transition-all" style={{ width: `${premiumPercent}%` }} />
                </div>
              </div>
              {/* Free bar */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-[10px]">
                  <span className="font-bold text-text-primary">Free / Trial</span>
                  <span className="font-medium text-text-secondary">{freeUsers} ({Math.round((freeUsers / totalUsers) * 100)}%)</span>
                </div>
                <div className="h-2 bg-bg-hover rounded-full overflow-hidden">
                  <div className="h-full bg-text-muted rounded-full transition-all" style={{ width: `${(freeUsers / totalUsers) * 100}%` }} />
                </div>
              </div>
              {/* Churned bar */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-[10px]">
                  <span className="font-bold text-text-primary">Churned</span>
                  <span className="font-medium text-text-secondary">{churnedUsers} ({Math.round((churnedUsers / totalUsers) * 100)}%)</span>
                </div>
                <div className="h-2 bg-bg-hover rounded-full overflow-hidden">
                  <div className="h-full bg-sport-run rounded-full transition-all" style={{ width: `${(churnedUsers / totalUsers) * 100}%` }} />
                </div>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-border-subtle grid grid-cols-2 gap-3 text-center text-[10px]">
              <div>
                <p className="font-bold text-text-primary">{totalCoaches}</p>
                <p className="text-text-muted">Entrenadores</p>
              </div>
              <div>
                <p className="font-bold text-text-primary">{avgAthletesPerCoach}</p>
                <p className="text-text-muted">Atletas/Coach (media)</p>
              </div>
              <div>
                <p className="font-bold text-text-primary">{mrr.toLocaleString('es-ES', { minimumFractionDigits: 0 })}€</p>
                <p className="text-text-muted">MRR</p>
              </div>
              <div>
                <p className="font-bold text-text-primary">{premiumConversionRate}%</p>
                <p className="text-text-muted">Tasa conversión</p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Users Table */}
        <div className="bg-bg-card border border-border-default rounded-xl p-5">
          <h3 className="text-xs font-bold text-text-primary mb-4">Últimos Usuarios Registrados</h3>
          <RecentUsersTable users={recentUsers} />
        </div>

      </main>
    </div>
  )
}
