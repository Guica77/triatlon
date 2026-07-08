import * as React from 'react'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { fetchCoachAthletes, getCoachGroups } from './actions'
import dynamic from 'next/dynamic'

const CoachDashboardView = dynamic(() => import('./coach-dashboard-view').then(mod => mod.CoachDashboardView), { ssr: false, loading: () => <div className="min-h-screen animate-pulse bg-zinc-50 flex items-center justify-center"><div className="w-8 h-8 rounded-full border-4 border-cyan-500 border-t-transparent animate-spin"></div></div> })

export const dynamic = 'force-dynamic'

export default async function CoachDashboardPage() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (!user) {
    console.error("CoachDashboardPage: No user found! Redirecting to /login", authError);
    redirect('/login')
  }

  // 1. Fetch coach profile, roster data, and training plans in parallel
  const [profileRes, rosterResult, plansRes, groupsRes] = await Promise.all([
    supabase
      .from('profiles')
      .select('role, first_name, invite_code')
      .eq('id', user.id)
      .single(),
    fetchCoachAthletes(),
    supabase
      .from('training_plans')
      .select('id, name')
      .order('name', { ascending: true }),
    getCoachGroups()
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
  const groups = groupsRes.data || [];
  const coachName = profile.first_name || 'Entrenador';

  return (
    <CoachDashboardView 
      initialRoster={roster} 
      plans={plans} 
      groups={groups}
      coachName={coachName} 
      coachId={user.id}
      initialInviteCode={profile.invite_code}
    />
  )
}
