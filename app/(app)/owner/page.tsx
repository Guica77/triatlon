import * as React from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getAdminMetrics, checkAdminAccess } from './owner-actions'
import { BarChart3, Users, TrendingUp } from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'
import { KPICard } from '@/components/admin/kpi-card'
import { UserGrowthChart } from '@/components/admin/user-growth-chart'
import { ActiveUsersChart } from '@/components/admin/active-users-chart'
import { RecentUsersTable } from '@/components/admin/recent-users-table'

export const dynamic = 'force-dynamic'

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Check admin access
  const isAdmin = await checkAdminAccess()
  if (!isAdmin) redirect('/dashboard')

  let metrics
  let error: string | null = null

  try {
    metrics = await getAdminMetrics()
  } catch (e) {
    error = 'No se pudieron cargar las métricas. Intenta de nuevo.'
  }

  if (error || !metrics) {
    return (
      <div className="min-h-screen bg-zinc-950 p-6">
        <div className="max-w-6xl mx-auto space-y-8">
          <PageHeader icon={BarChart3} title="Panel de Control" subtitle="Error al cargar métricas" />
          <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-8 text-center space-y-4">
            <BarChart3 className="w-12 h-12 text-zinc-600 mx-auto" />
            <p className="text-sm text-zinc-400 font-medium">{error}</p>
            <p className="text-xs text-zinc-500">Verifica que tengas datos en la base de datos.</p>
          </div>
        </div>
      </div>
    )
  }

  const activeUserRate = metrics.totalUsers > 0
    ? Math.round((metrics.activeUsers.mau / metrics.totalUsers) * 100)
    : 0

  const userTrend = metrics.previousMonthUsers > 0
    ? Math.round(((metrics.totalUsers - metrics.previousMonthUsers) / metrics.previousMonthUsers) * 100)
    : 0

  return (
    <div className="min-h-screen bg-zinc-950 p-6">
      <main className="max-w-6xl mx-auto space-y-8">
        <PageHeader
          icon={BarChart3}
          title="Panel de Control"
          subtitle="Métricas de crecimiento, retención y actividad • Triatlon Pro Business"
        />

        {/* KPI Cards */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KPICard
            title="Usuarios Totales"
            value={metrics.totalUsers}
            subtitle={`${metrics.activeUsers.mau} activos este mes (${activeUserRate}%)`}
            trend={userTrend}
            icon={Users}
            color="bg-gradient-to-br from-cyan-500/20 to-cyan-600/10 border border-cyan-500/20 text-cyan-400"
            delay={0}
          />
          <KPICard
            title="MAU (Mensual)"
            value={metrics.activeUsers.mau}
            subtitle={`${metrics.activeUsers.wau} semanales · ${metrics.activeUsers.dau} hoy`}
            icon={BarChart3}
            color="bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 border border-emerald-500/20 text-emerald-400"
            delay={0.1}
          />
          <KPICard
            title="Retención"
            value={`${100 - metrics.churnRate.monthly}%`}
            subtitle="Retención mensual de usuarios"
            trend={metrics.churnRate.monthly > 5 ? -metrics.churnRate.monthly : undefined}
            icon={TrendingUp}
            color="bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/20 text-amber-400"
            delay={0.2}
          />
          <KPICard
            title="Entrenamientos"
            value={metrics.workoutStats.totalWorkouts}
            subtitle={`${metrics.workoutStats.completedRate}% completados · ${metrics.workoutStats.avgTss} TSS avg`}
            icon={BarChart3}
            color="bg-gradient-to-br from-blue-500/20 to-blue-600/10 border border-blue-500/20 text-blue-400"
            delay={0.3}
          />
        </section>

        {/* Charts Row */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <UserGrowthChart data={metrics.userGrowth} />
          <ActiveUsersChart
            mau={metrics.activeUsers.mau}
            wau={metrics.activeUsers.wau}
            dau={metrics.activeUsers.dau}
          />
        </section>

        {/* Subscription & Coach Stats */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5">
            <h3 className="text-sm font-bold text-white mb-3">Distribución de Planes</h3>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-zinc-400 font-medium">Gratuito</span>
                  <span className="text-white font-bold">{metrics.subscriptionStats.free}</span>
                </div>
                <div className="h-2.5 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-zinc-500 rounded-full transition-all"
                    style={{ width: `${metrics.totalUsers > 0 ? (metrics.subscriptionStats.free / metrics.totalUsers) * 100 : 0}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-zinc-400 font-medium">Premium</span>
                  <span className="text-emerald-400 font-bold">{metrics.subscriptionStats.premium}</span>
                </div>
                <div className="h-2.5 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all"
                    style={{ width: `${metrics.totalUsers > 0 ? (metrics.subscriptionStats.premium / metrics.totalUsers) * 100 : 0}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-zinc-400 font-medium">Inactivos</span>
                  <span className="text-red-400 font-bold">{metrics.subscriptionStats.churned}</span>
                </div>
                <div className="h-2.5 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-red-500/50 rounded-full transition-all"
                    style={{ width: `${metrics.totalUsers > 0 ? (metrics.subscriptionStats.churned / metrics.totalUsers) * 100 : 0}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5">
            <h3 className="text-sm font-bold text-white mb-3">Estadísticas de Entrenamiento</h3>
            <div className="space-y-4">
              <div>
                <p className="text-2xl font-black text-white">{metrics.workoutStats.completedRate}%</p>
                <p className="text-[10px] text-zinc-500 font-medium uppercase tracking-wider mt-0.5">Tasa de finalización</p>
              </div>
              <div>
                <p className="text-2xl font-black text-white">{metrics.workoutStats.avgTss}</p>
                <p className="text-[10px] text-zinc-500 font-medium uppercase tracking-wider mt-0.5">TSS promedio por sesión</p>
              </div>
              <div>
                <p className="text-2xl font-black text-white">{metrics.workoutStats.totalWorkouts}</p>
                <p className="text-[10px] text-zinc-500 font-medium uppercase tracking-wider mt-0.5">Entrenamientos registrados (90 días)</p>
              </div>
            </div>
          </div>

          <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5">
            <h3 className="text-sm font-bold text-white mb-3">Red de Entrenadores</h3>
            <div className="space-y-4">
              <div>
                <p className="text-2xl font-black text-white">{metrics.coachStats.totalCoaches}</p>
                <p className="text-[10px] text-zinc-500 font-medium uppercase tracking-wider mt-0.5">Entrenadores registrados</p>
              </div>
              <div className="flex items-center gap-3 p-3 bg-zinc-800/50 rounded-xl border border-zinc-700/50">
                <Users className="w-5 h-5 text-amber-400 shrink-0" />
                <div>
                  <p className="text-sm font-bold text-white">
                    {metrics.coachStats.avgAthletesPerCoach} atletas / coach
                  </p>
                  <p className="text-[10px] text-zinc-500 font-medium">Ratio promedio</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Recent Users */}
        <RecentUsersTable users={metrics.recentUsers} />
      </main>
    </div>
  )
}