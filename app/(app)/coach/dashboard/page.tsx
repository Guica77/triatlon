import { WelcomeReady } from '@/components/brand/authenticated-welcome'
import * as React from 'react'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { fetchCoachAthletes, getCoachGroups } from './actions'
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
  const [profileRes, rosterResult, plansRes, groupsRes, requestsRes] = await Promise.all([
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
    getCoachGroups(),
    (supabase as any).from('plan_adjustment_proposals').select('id,athlete_id,intent,created_at').eq('status', 'pending').order('created_at', { ascending: false }).limit(12),
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
  const planRequests = ((requestsRes.data || []) as any[]).map(request => {
    const athlete = roster.find(item => item.id === request.athlete_id)
    const athleteName = [athlete?.first_name, athlete?.last_name].filter(Boolean).join(' ') || athlete?.email || 'Atleta'
    return { id: request.id, athleteName, requestedDate: request.intent?.targetDate || 'fecha no indicada', createdAt: request.created_at }
  })

  return (
    <>
    <CoachDashboardView 
      initialRoster={roster} 
      plans={plans} 
      groups={groups}
      coachName={coachName} 
      coachId={user.id}
      initialInviteCode={profile.invite_code}
      initialPlanRequests={planRequests}
    />
      <WelcomeReady />
    </>
  )
}
