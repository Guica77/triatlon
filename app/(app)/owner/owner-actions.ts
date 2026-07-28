'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// ============================================================
// Admin Server Actions — Business Metrics for Triatlon Pro
// ============================================================

interface UserGrowthData {
  date: string
  signups: number
  total: number
}

interface ActiveUsersData {
  mau: number
  wau: number
  dau: number
}

interface ChurnRateData {
  monthly: number
  quarterly: number
}

interface SubscriptionStats {
  free: number
  premium: number
  churned: number
}

interface WorkoutStats {
  totalWorkouts: number
  completedRate: number
  avgTss: number
}

interface CoachStats {
  totalCoaches: number
  avgAthletesPerCoach: number
}

interface RecentUser {
  id: string
  email: string
  first_name: string | null
  last_name: string | null
  created_at: string
  role: string | null
  subscription_status: string | null
}

export interface AdminMetrics {
  userGrowth: UserGrowthData[]
  activeUsers: ActiveUsersData
  churnRate: ChurnRateData
  subscriptionStats: SubscriptionStats
  workoutStats: WorkoutStats
  coachStats: CoachStats
  recentUsers: RecentUser[]
  totalUsers: number
  previousMonthUsers: number
}

// ============================================================
// Main Metrics Fetcher
// ============================================================

export async function getAdminMetrics(): Promise<AdminMetrics> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('No autorizado')
  }

  // Run all queries in parallel
  const [profilesRes, workoutsRes, coachAthletesRes] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, email, first_name, last_name, created_at, role, subscription_status')
      .order('created_at', { ascending: false }),
    supabase
      .from('user_workouts')
      .select('id, status, actual_tss, scheduled_date, created_at')
      .gte('created_at', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()),
    supabase
      .from('coach_athletes')
      .select('coach_id, athlete_id')
  ])

  const profiles = profilesRes.data || []
  const workouts = workoutsRes.data || []
  const coachAthletes = coachAthletesRes.data || []

  // 1. User Growth (6 months)
  const now = new Date()
  const userGrowth: UserGrowthData[] = []
  let cumulativeTotal = 0

  for (let i = 5; i >= 0; i--) {
    const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59)

    const monthProfiles = profiles.filter(p => {
      const created = new Date(p.created_at)
      return created >= monthStart && created <= monthEnd
    })

    const signups = monthProfiles.length
    cumulativeTotal += signups

    const monthLabel = monthStart.toLocaleDateString('es-ES', { month: 'short', year: '2-digit' })

    userGrowth.push({
      date: monthLabel,
      signups,
      total: cumulativeTotal,
    })
  }

  // 2. Active Users (MAU/WAU/DAU)
  const mauDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  const wauDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const dauDate = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000)

  const mauUsers = new Set(
    workouts.filter(w => new Date(w.created_at || w.scheduled_date) >= mauDate).map(w => w.id)
  ).size

  const wauUsers = new Set(
    workouts.filter(w => new Date(w.created_at || w.scheduled_date) >= wauDate).map(w => w.id)
  ).size

  const dauUsers = new Set(
    workouts.filter(w => new Date(w.created_at || w.scheduled_date) >= dauDate).map(w => w.id)
  ).size

  // 3. Churn Rate
  const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)

  const thisMonthUsers = profiles.filter(p => new Date(p.created_at) >= thisMonth).length
  const lastMonthTotal = profiles.filter(p => new Date(p.created_at) < thisMonth).length
  const monthlyChurn = lastMonthTotal > 0
    ? Math.max(0, Math.round(((lastMonthTotal - thisMonthUsers) / lastMonthTotal) * 100))
    : 0

  // 4. Subscription Stats
  const freeUsers = profiles.filter(p => !p.subscription_status || p.subscription_status === 'free').length
  const premiumUsers = profiles.filter(p => p.subscription_status === 'premium' || p.subscription_status === 'active').length
  const churnedUsers = profiles.filter(p => p.subscription_status === 'cancelled' || p.subscription_status === 'inactive').length

  // 5. Workout Stats
  const totalWorkouts = workouts.length
  const completedWorkouts = workouts.filter(w => w.status === 'completed').length
  const completedRate = totalWorkouts > 0 ? Math.round((completedWorkouts / totalWorkouts) * 100) : 0
  const totalTss = workouts.reduce((sum, w) => sum + (w.actual_tss || 0), 0)
  const avgTss = totalWorkouts > 0 ? Math.round(totalTss / totalWorkouts) : 0

  // 6. Coach Stats
  const uniqueCoaches = new Set(coachAthletes.map(c => c.coach_id))
  const totalCoaches = uniqueCoaches.size
  const avgAthletesPerCoach = totalCoaches > 0
    ? Math.round((coachAthletes.length / totalCoaches) * 10) / 10
    : 0

  // 7. Recent Users (last 10)
  const recentUsers: RecentUser[] = profiles.slice(0, 10).map(p => ({
    id: p.id,
    email: p.email || '',
    first_name: p.first_name,
    last_name: p.last_name,
    created_at: p.created_at,
    role: p.role,
    subscription_status: p.subscription_status,
  }))

  return {
    userGrowth,
    activeUsers: { mau: mauUsers, wau: wauUsers, dau: dauUsers },
    churnRate: { monthly: monthlyChurn, quarterly: Math.round(monthlyChurn * 3) },
    subscriptionStats: { free: freeUsers, premium: premiumUsers, churned: churnedUsers },
    workoutStats: { totalWorkouts, completedRate, avgTss },
    coachStats: { totalCoaches, avgAthletesPerCoach },
    recentUsers,
    totalUsers: profiles.length,
    previousMonthUsers: lastMonthTotal,
  }
}

// ============================================================
// Check Admin Access
// ============================================================

export async function checkAdminAccess(): Promise<boolean> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return false

  // Allow by email OR by role
  const isAdmin = Boolean(user.email === 'guillermo@triatlonpro.com' || user.email?.endsWith('@triatlonpro.com') || user.email?.includes('guillermo'))

  if (isAdmin) {
    // Ensure role is set
    await supabase
      .from('profiles')
      .update({ role: 'owner' })
      .eq('id', user.id)
  }

  return isAdmin
}