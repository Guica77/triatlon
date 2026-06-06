import * as React from 'react'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { fetchCoachAthletes } from './actions'
import { CoachDashboardView } from './coach-dashboard-view'

export default async function CoachDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // 1. Verify user profile and coach role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, first_name')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'coach') {
    // If not a coach, send back to standard athlete dashboard
    redirect('/dashboard')
  }

  // 2. Fetch roster data (biometrics, alerts, tss, workouts)
  const rosterResult = await fetchCoachAthletes()
  if (rosterResult.error) {
    console.error('Error fetching roster for coach page:', rosterResult.error)
  }
  const roster = rosterResult.data || []

  // 3. Fetch all available training plans to display in assignments selector
  const { data: plansData } = await supabase
    .from('training_plans')
    .select('id, name')
    .order('name', { ascending: true })

  const plans = plansData || []
  const coachName = profile.first_name || 'Entrenador'

  return (
    <CoachDashboardView 
      initialRoster={roster} 
      plans={plans} 
      coachName={coachName} 
    />
  )
}
