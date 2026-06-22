import * as React from 'react'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { fetchCoachAthletes } from './actions'
import { CoachDashboardView } from './coach-dashboard-view'

export const dynamic = 'force-dynamic'

export default async function CoachDashboardPage() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (!user) {
    console.error("CoachDashboardPage: No user found! Redirecting to /login", authError);
    redirect('/login')
  }

  // 1. Fetch coach profile, roster data, and training plans in parallel
  const [profileRes, rosterResult, plansRes] = await Promise.all([
    supabase
      .from('profiles')
      .select('role, first_name, invite_code')
      .eq('id', user.id)
      .single(),
    fetchCoachAthletes(),
    supabase
      .from('training_plans')
      .select('id, name')
      .order('name', { ascending: true })
  ]);

  const profile = profileRes.data;
  if (!profile || profile.role !== 'coach') {
    redirect('/dashboard');
  }

  if (rosterResult.error) {
    console.error('Error fetching roster for coach page:', rosterResult.error);
  }
  const roster = rosterResult.data || [];
  const plans = plansRes.data || [];
  const coachName = profile.first_name || 'Entrenador';

  return (
    <CoachDashboardView 
      initialRoster={roster} 
      plans={plans} 
      coachName={coachName} 
      coachId={user.id}
      initialInviteCode={profile.invite_code}
    />
  )
}
