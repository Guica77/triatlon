import * as React from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getBusinessMetrics, checkAdminAccess } from './actions'
import { BarChart3, Users, TrendingUp, DollarSign, UserMinus, Activity, Target, Zap, UserPlus, LayoutDashboard } from 'lucide-react'
import { MetricCard } from '@/components/admin/business-metric-card'
import { UserGrowthChart } from '@/components/admin/user-growth-chart'
import { ActiveUsersChart } from '@/components/admin/active-users-chart'
import { RecentUsersTable } from '@/components/admin/recent-users-table'
import { CohortRetentionTable } from '@/components/admin/cohort-retention-table'
import { ChurnBreakdownCard } from '@/components/admin/churn-breakdown-card'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Business Dashboard — Triatlon Pro',
  description: 'Métricas de negocio: MRR, ARPU, Churn, LTV, CAC',
}

export default async function AdminDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

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
    return <ErrorState error={error} />
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
    <div className="min-h-screen bg-bg-app">
      {/* Admin header — standalone, no app chrome */}
      <header className="sticky top-0 z-50 border-b border-border-default bg-bg-elevated/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-sport-swim/10 border border-sport-swim/20 flex items-center justify-center">
              <LayoutDashboard className="w-4 h-4 text-sport-swim" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-text-primary">Business Dashboard</h1>
              <p className="text-[9px] text-text-muted">{totalUsers} usuarios · {mrr}€ MRR</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 text-[10px] text-text-muted bg-bg-card border border-border-default rounded-lg px-3 py-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-sport-bike" />
              Tiempo real
            </span>
            <a href="/dashboard" className="text-[10px] text-sport-swim hover:text-sport-swim/80 font-bold transition-colors">
              ← Volver a la app
            </a>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-12 space-y-8">
        {estimatedCac && (
          <div className="flex items-center gap-2 text-[10px] text-text-muted bg-bg-card border border-border-subtle rounded-lg px-4 py-2">
            <Zap className="w-3 h-3 text-warning" />
            CAC estimado (500€/mes marketing) — conecta datos reales para precisión
          </div>
        )}

        {/* KPI Row 1 — Core Business */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <MetricCard title="MRR" value={`${mrr.toFixed(2)}€`} subtitle={`${arr.toFixed(0)}€/año ARR`} icon={DollarSign} trend={newUsersTrend} trendValue={`${premiumUsers} premium`} accent="swim" />
          <MetricCard title="ARPU" value={`${arpu}€`} subtitle="Ingreso medio por usuario" icon={Activity} accent="swim" />
          <MetricCard title="Churn Mensual" value={`${monthlyChurnRate}%`} subtitle={`${quarterlyChurnRate}% trimestral`} icon={UserMinus} trend={monthlyChurnRate > 10 ? 'down' : 'neutral'} trendValue={monthlyChurnRate <= 5 ? 'Saludable' : monthlyChurnRate <= 10 ? 'Aceptable' : 'Atención'} accent={monthlyChurnRate > 10 ? 'run' : monthlyChurnRate > 5 ? 'warning' : 'bike'} />
          <MetricCard title="LTV" value={`${ltv}€`} subtitle={`${avgSubscriptionMonths} meses media`} icon={Target} accent="bike" />
          <MetricCard title="CAC" value={`${cac}€`} subtitle={estimatedCac ? 'Estimado' : 'Real'} icon={TrendingUp} accent="bike" />
          <MetricCard title="LTV / CAC" value={`${ltvCacRatio}x`} subtitle={ltvCacRatio >= 3 ? 'Saludable' : ltvCacRatio >= 1 ? 'Mínimo' : 'Crítico'} icon={Zap} trend={ltvCacRatio >= 3 ? 'up' : 'neutral'} trendValue={ltvCacRatio >= 3 ? 'Óptimo >3x' : ltvCacRatio >= 1 ? '>1x' : '<1x'} accent={ltvCacRatio >= 3 ? 'bike' : ltvCacRatio >= 1 ? 'warning' : 'run'} />
        </div>

        {/* KPI Row 2 — Growth */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <MetricCard title="Usuarios Totales" value={totalUsers.toLocaleString()} subtitle={`+${newUsersThisMonth} este mes`} icon={Users} trend={userGrowthTrend} trendValue={`${userGrowthPercent > 0 ? '+' : ''}${userGrowthPercent}%`} accent="swim" />
          <MetricCard title="Nuevos (mes)" value={newUsersThisMonth} subtitle={`${newUsersLastMonth} mes pasado`} icon={UserPlus} trend={newUsersTrend} trendValue={userGrowthDelta > 0 ? `+${userGrowthDelta}` : `${userGrowthDelta}`} accent="swim" />
          <MetricCard title="MAU" value={mau.toLocaleString()} subtitle={`${dau} hoy · ${dauMauRatio}% DAU/MAU`} icon={Activity} trend={dauMauRatio > 20 ? 'up' : 'neutral'} trendValue={`${stickiness}% semanal`} accent="swim" />
          <MetricCard title="Conversión Premium" value={`${premiumConversionRate}%`} subtitle={`${premiumUsers} de ${totalUsers}`} icon={Target} trend={premiumConversionRate > 15 ? 'up' : 'neutral'} trendValue={premiumConversionRate > 10 ? 'Buena' : 'Mejorable'} accent="bike" />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-bg-card border border-border-default rounded-xl p-5">
            <h3 className="text-xs font-bold text-text-primary mb-4">Crecimiento de Usuarios</h3>
            <UserGrowthChart data={userGrowth} />
          </div>
          <ChurnBreakdownCard churnByMonth={churnByMonth} />
        </div>

        {/* Cohort Retention */}
        <CohortRetentionTable data={cohortRetention} />

        {/* Active Users + Subscriptions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ActiveUsersChart mau={mau} wau={wau} dau={dau} />

          <div className="bg-bg-card border border-border-default rounded-xl p-5">
            <h3 className="text-xs font-bold text-text-primary mb-4">Suscripciones</h3>
            <div className="space-y-4">
              <SubscriptionBar label="Premium" count={premiumUsers} total={totalUsers} color="bg-sport-swim" />
              <SubscriptionBar label="Free / Trial" count={freeUsers} total={totalUsers} color="bg-text-muted" />
              <SubscriptionBar label="Churned" count={churnedUsers} total={totalUsers} color="bg-sport-run" />
            </div>
            <div className="mt-4 pt-4 border-t border-border-subtle grid grid-cols-4 gap-3 text-center text-[10px]">
              <div><p className="font-bold text-text-primary">{totalCoaches}</p><p className="text-text-muted">Entrenadores</p></div>
              <div><p className="font-bold text-text-primary">{avgAthletesPerCoach}</p><p className="text-text-muted">Atletas/Coach</p></div>
              <div><p className="font-bold text-text-primary">{mrr.toFixed(0)}€</p><p className="text-text-muted">MRR</p></div>
              <div><p className="font-bold text-text-primary">{premiumConversionRate}%</p><p className="text-text-muted">Conversión</p></div>
            </div>
          </div>
        </div>

        {/* Recent Users */}
        <div className="bg-bg-card border border-border-default rounded-xl p-5">
          <h3 className="text-xs font-bold text-text-primary mb-4">Últimos Usuarios Registrados</h3>
          <RecentUsersTable users={recentUsers} />
        </div>
      </main>
    </div>
  )
}

function SubscriptionBar({ label, count, total, color }: { label: string; count: number; total: number; color: string }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-[10px]">
        <span className="font-bold text-text-primary">{label}</span>
        <span className="font-medium text-text-secondary">{count} ({pct}%)</span>
      </div>
      <div className="h-2 bg-bg-hover rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

function ErrorState({ error }: { error: string | null }) {
  return (
    <div className="min-h-screen bg-bg-app flex items-center justify-center p-4">
      <div className="bg-bg-card border border-border-default rounded-xl p-8 text-center space-y-4 max-w-md">
        <BarChart3 className="w-12 h-12 text-text-secondary mx-auto" />
        <p className="text-sm text-text-muted font-medium">{error || 'Error al cargar el dashboard'}</p>
        <a href="/dashboard" className="inline-block text-xs text-sport-swim hover:text-sport-swim/80 font-bold transition-colors">
          Volver a la app
        </a>
      </div>
    </div>
  )
}
