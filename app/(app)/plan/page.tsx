import * as React from 'react'
import { redirect } from 'next/navigation'
import { CalendarDays, ChevronRight, UserRound } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { DashboardViewTabs } from '@/components/dashboard/dashboard-view-tabs'

export const dynamic = 'force-dynamic'

export default async function PlanPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*, training_plans(*)')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/onboarding')
  if (profile.role === 'coach') redirect('/coach/dashboard')
  if (!profile.active_plan_id && !profile.coach_id) redirect('/onboarding')

  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), 1)
  start.setDate(start.getDate() - 7)
  const end = new Date(now.getFullYear(), now.getMonth() + 2, 0)

  const [{ data: workouts }, { data: devices }] = await Promise.all([
    supabase
      .from('user_workouts')
      .select('*, training_sessions(*), universal_telemetry(*), workout_feedback(*)')
      .eq('user_id', user.id)
      .gte('scheduled_date', start.toISOString().split('T')[0])
      .lte('scheduled_date', end.toISOString().split('T')[0])
      .order('scheduled_date', { ascending: true }),
    supabase
      .from('user_connected_devices')
      .select('provider')
      .eq('user_id', user.id),
  ])

  const assignedByCoach = Boolean(profile.coach_id)
  const planName = profile.training_plans?.name || profile.target_race_name || 'Plan de entrenamiento'
  const isConnected = Boolean(profile.garmin_connected || profile.strava_connected || (devices && devices.length > 0))

  return (
    <div className="min-h-screen bg-bg-app">
      <main className="mx-auto max-w-5xl px-4 pb-24 pt-6 sm:px-6 sm:pb-8 lg:px-8">
        <header className="mb-6">
          <h1 className="text-3xl font-semibold tracking-tight text-text-primary">Plan</h1>
          <p className="mt-1 text-sm text-text-secondary">Tu calendario y las sesiones programadas.</p>
        </header>

        <section className="mb-6 overflow-hidden rounded-2xl border border-border-default bg-surface-card">
          <div className="flex items-center gap-3 px-5 py-4">
            <CalendarDays className="h-5 w-5 text-accent" aria-hidden="true" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-text-primary">{planName}</p>
              <p className="mt-0.5 text-xs text-text-secondary">{assignedByCoach ? 'Plan asignado por tu entrenador' : 'Plan recomendado para tu objetivo y disponibilidad'}</p>
            </div>
            {assignedByCoach ? <UserRound className="h-4 w-4 text-text-muted" aria-label="Gestionado por entrenador" /> : <Link href="/onboarding" className="flex items-center gap-1 text-sm font-medium text-accent">Cambiar <ChevronRight className="h-4 w-4" /></Link>}
          </div>
        </section>

        <DashboardViewTabs
          variant="plan"
          initialWorkouts={workouts || []}
          isConnected={isConnected}
          profile={profile}
          readOnly={assignedByCoach}
        />
      </main>
    </div>
  )
}
