'use server'

import { createClient } from '@/lib/supabase/server'

// ============================================================
// Business Metrics — Churn, CAC, LTV, MRR, Cohort Analysis
// ============================================================

export interface BusinessMetrics {
  // Core KPIs
  totalUsers: number
  previousMonthUsers: number
  userGrowthPercent: number

  // Revenue
  mrr: number
  arr: number
  arpu: number
  premiumConversionRate: number

  // Churn
  monthlyChurnRate: number
  quarterlyChurnRate: number
  churnedUsers: number
  churnByMonth: { month: string; rate: number; lost: number }[]

  // Acquisition
  cac: number      // Customer Acquisition Cost (placeholder — connect to ad spend)
  estimatedCac: boolean  // true if using placeholder data

  // Lifetime Value
  ltv: number
  ltvCacRatio: number
  avgSubscriptionMonths: number

  // Engagement
  mau: number
  wau: number
  dau: number
  dauMauRatio: number
  stickiness: number

  // Subscriptions
  freeUsers: number
  premiumUsers: number
  totalChurned: number
  premiumPercent: number

  // Growth trend
  userGrowth: { date: string; signups: number; total: number }[]
  newUsersThisMonth: number
  newUsersLastMonth: number

  // Coach stats
  totalCoaches: number
  avgAthletesPerCoach: number

  // Cohort retention (simulated from available data)
  cohortRetention: { cohort: string; week1: number; week4: number; week12: number }[]

  // Recent users
  recentUsers: {
    id: string
    email: string
    first_name: string | null
    last_name: string | null
    created_at: string
    role: string | null
    subscription_status: string | null
  }[]
}

// ============================================================
// Fetch & Calculate Business Metrics
// ============================================================

export async function getBusinessMetrics(): Promise<BusinessMetrics> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autorizado')

  const now = new Date()
  const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)

  // Fetch all profiles with their data
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, email, created_at, role, subscription_status, last_name, first_name')
    .order('created_at', { ascending: false })

  const allProfiles = profiles || []

  // Fetch workout data for engagement metrics
  const { data: workouts } = await supabase
    .from('user_workouts')
    .select('id, user_id, scheduled_date, created_at, status')
    .gte('created_at', ninetyDaysAgo.toISOString())

  const allWorkouts = workouts || []

  // Fetch coach-athlete relationships
  const { data: coachAthletes } = await supabase
    .from('coach_athletes')
    .select('coach_id, athlete_id, created_at')

  const allCoachAthletes = coachAthletes || []

  // ============================================================
  // 1. USER GROWTH (6 months)
  // ============================================================
  const userGrowth: { date: string; signups: number; total: number }[] = []
  let cumulativeTotal = 0

  for (let i = 5; i >= 0; i--) {
    const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59)

    const signups = allProfiles.filter(p => {
      const created = new Date(p.created_at)
      return created >= monthStart && created <= monthEnd
    }).length

    cumulativeTotal += signups
    const label = monthStart.toLocaleDateString('es-ES', { month: 'short', year: '2-digit' })
    userGrowth.push({ date: label, signups, total: cumulativeTotal })
  }

  const totalUsers = allProfiles.length

  // Previous month total
  const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const prevMonthTotal = allProfiles.filter(p => new Date(p.created_at) < prevMonthStart).length
  const userGrowthPercent = prevMonthTotal > 0
    ? Math.round(((totalUsers - prevMonthTotal) / prevMonthTotal) * 100)
    : 0

  // ============================================================
  // 2. NEW USERS
  // ============================================================
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59)

  const newUsersThisMonth = allProfiles.filter(p => new Date(p.created_at) >= thisMonthStart).length
  const newUsersLastMonth = allProfiles.filter(p => {
    const d = new Date(p.created_at)
    return d >= lastMonthStart && d <= lastMonthEnd
  }).length

  // ============================================================
  // 3. SUBSCRIPTION & REVENUE METRICS
  // ============================================================
  const freeUsers = allProfiles.filter(p =>
    !p.subscription_status || p.subscription_status === 'free' || p.subscription_status === 'trial'
  ).length
  const premiumUsers = allProfiles.filter(p =>
    p.subscription_status === 'premium' || p.subscription_status === 'active'
  ).length
  const totalChurned = allProfiles.filter(p =>
    p.subscription_status === 'cancelled' || p.subscription_status === 'inactive' || p.subscription_status === 'churned'
  ).length

  const premiumPercent = totalUsers > 0 ? Math.round((premiumUsers / totalUsers) * 100) : 0

  // MRR: assume €12.99/mo per premium user (standard triathlon app pricing)
  const MONTHLY_PRICE = 12.99
  const mrr = Math.round(premiumUsers * MONTHLY_PRICE * 100) / 100
  const arr = Math.round(mrr * 12 * 100) / 100
  const arpu = totalUsers > 0 ? Math.round((mrr / totalUsers) * 100) / 100 : 0
  const premiumConversionRate = totalUsers > 0 ? Math.round((premiumUsers / totalUsers) * 1000) / 10 : 0

  // ============================================================
  // 4. CHURN RATE (monthly)
  // ============================================================
  const churnByMonth: { month: string; rate: number; lost: number }[] = []

  for (let i = 5; i >= 0; i--) {
    const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59)
    const prevMonthEnd = new Date(monthStart.getTime() - 1)

    const usersBefore = allProfiles.filter(p => new Date(p.created_at) <= prevMonthEnd).length
    const churnedThisMonth = allProfiles.filter(p => {
      if (!p.subscription_status) return false
      // If status is cancelled/inactive and they existed before this month
      const isChurned = p.subscription_status === 'cancelled' || p.subscription_status === 'inactive' || p.subscription_status === 'churned'
      const createdBefore = new Date(p.created_at) <= monthEnd
      return isChurned && createdBefore
    }).length

    // Also: users who haven't worked out in 30+ days as "silent churn"
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const usersNoActivity = allProfiles.filter(p => {
      if (p.subscription_status === 'cancelled' || p.subscription_status === 'churned' || p.subscription_status === 'inactive') return false
      const userWorkouts = allWorkouts.filter(w => w.user_id === p.id && new Date(w.created_at || w.scheduled_date) >= thirtyDaysAgo)
      return userWorkouts.length === 0
    }).length

    const totalChurn = churnedThisMonth + Math.round(usersNoActivity * 0.3) // estimate
    const churnRate = usersBefore > 0 ? Math.round((totalChurn / usersBefore) * 1000) / 10 : 0

    const label = monthStart.toLocaleDateString('es-ES', { month: 'short', year: '2-digit' })
    churnByMonth.push({ month: label, rate: churnRate, lost: totalChurn })
  }

  const avgMonthlyChurn = churnByMonth.length > 0
    ? Math.round((churnByMonth.reduce((s, m) => s + m.rate, 0) / churnByMonth.length) * 10) / 10
    : 0

  const monthlyChurnRate = avgMonthlyChurn
  const quarterlyChurnRate = Math.round((1 - Math.pow(1 - monthlyChurnRate / 100, 3)) * 1000) / 10

  // ============================================================
  // 5. CAC (Customer Acquisition Cost)
  // ============================================================
  // Placeholder: assumes €500/mo marketing spend — replace with real data
  const MONTHLY_MARKETING_SPEND = 500
  const avgNewUsersPerMonth = newUsersThisMonth > 0 ? newUsersThisMonth : Math.max(newUsersLastMonth, 1)
  const cac = Math.round((MONTHLY_MARKETING_SPEND / avgNewUsersPerMonth) * 100) / 100

  // ============================================================
  // 6. LTV (Lifetime Value)
  // ============================================================
  const avgSubscriptionMonths = monthlyChurnRate > 0
    ? Math.round((1 / (monthlyChurnRate / 100)) * 10) / 10
    : 12 // default assumption
  const ltv = Math.round(MONTHLY_PRICE * avgSubscriptionMonths * 100) / 100
  const ltvCacRatio = cac > 0 ? Math.round((ltv / cac) * 10) / 10 : 0

  // ============================================================
  // 7. ENGAGEMENT (DAU/MAU)
  // ============================================================
  const mauDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  const wauDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const dauDate = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000)

  const userActivityMap = new Map<string, Set<string>>()
  for (const w of allWorkouts) {
    const date = (w.created_at || w.scheduled_date).split('T')[0]
    if (!userActivityMap.has(w.user_id)) userActivityMap.set(w.user_id, new Set())
    userActivityMap.get(w.user_id)!.add(date)
  }

  const mau = allProfiles.filter(p => {
    const dates = userActivityMap.get(p.id)
    if (!dates) return false
    return Array.from(dates).some(d => new Date(d) >= mauDate)
  }).length

  const wau = allProfiles.filter(p => {
    const dates = userActivityMap.get(p.id)
    if (!dates) return false
    return Array.from(dates).some(d => new Date(d) >= wauDate)
  }).length

  const dau = allProfiles.filter(p => {
    const dates = userActivityMap.get(p.id)
    if (!dates) return false
    return Array.from(dates).some(d => new Date(d) >= dauDate)
  }).length

  const dauMauRatio = mau > 0 ? Math.round((dau / mau) * 1000) / 10 : 0
  const stickiness = mau > 0 ? Math.round((wau / mau) * 1000) / 10 : 0

  // ============================================================
  // 8. COHORT RETENTION (simulated from profile/workout data)
  // ============================================================
  const cohortRetention: { cohort: string; week1: number; week4: number; week12: number }[] = []

  for (let i = 5; i >= 0; i--) {
    const cohortStart = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const cohortEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59)

    const cohortUsers = allProfiles.filter(p => {
      const d = new Date(p.created_at)
      return d >= cohortStart && d <= cohortEnd
    })

    if (cohortUsers.length === 0) {
      const label = cohortStart.toLocaleDateString('es-ES', { month: 'short', year: '2-digit' })
      cohortRetention.push({ cohort: label, week1: 0, week4: 0, week12: 0 })
      continue
    }

    const week1Cutoff = new Date(cohortStart.getTime() + 7 * 24 * 60 * 60 * 1000)
    const week4Cutoff = new Date(cohortStart.getTime() + 28 * 24 * 60 * 60 * 1000)
    const week12Cutoff = new Date(cohortStart.getTime() + 84 * 24 * 60 * 60 * 1000)

    const week1 = cohortUsers.filter(p => {
      const dates = userActivityMap.get(p.id)
      if (!dates) return false
      return Array.from(dates).some(d => new Date(d) >= cohortStart && new Date(d) <= week1Cutoff)
    }).length

    const week4 = cohortUsers.filter(p => {
      const dates = userActivityMap.get(p.id)
      if (!dates) return false
      return Array.from(dates).some(d => new Date(d) >= cohortStart && new Date(d) <= week4Cutoff)
    }).length

    const week12 = cohortUsers.filter(p => {
      const dates = userActivityMap.get(p.id)
      if (!dates) return false
      return Array.from(dates).some(d => new Date(d) >= cohortStart && new Date(d) <= week12Cutoff)
    }).length

    const cohortLabel = cohortStart.toLocaleDateString('es-ES', { month: 'short', year: '2-digit' })
    cohortRetention.push({
      cohort: cohortLabel,
      week1: Math.round((week1 / cohortUsers.length) * 100),
      week4: Math.round((week4 / cohortUsers.length) * 100),
      week12: Math.round((week12 / cohortUsers.length) * 100),
    })
  }

  // ============================================================
  // 9. COACH STATS
  // ============================================================
  const uniqueCoaches = new Set(allCoachAthletes.map(c => c.coach_id))
  const totalCoaches = uniqueCoaches.size
  const avgAthletesPerCoach = totalCoaches > 0
    ? Math.round((allCoachAthletes.length / totalCoaches) * 10) / 10
    : 0

  const recentUsers = allProfiles.slice(0, 10).map(p => ({
    id: p.id,
    email: p.email || '',
    first_name: p.first_name,
    last_name: p.last_name,
    created_at: p.created_at,
    role: p.role,
    subscription_status: p.subscription_status,
  }))

  return {
    totalUsers,
    previousMonthUsers: prevMonthTotal,
    userGrowthPercent,
    mrr,
    arr,
    arpu,
    premiumConversionRate,
    monthlyChurnRate,
    quarterlyChurnRate,
    churnedUsers: totalChurned,
    churnByMonth,
    cac,
    estimatedCac: true,
    ltv,
    ltvCacRatio,
    avgSubscriptionMonths,
    mau,
    wau,
    dau,
    dauMauRatio,
    stickiness,
    freeUsers,
    premiumUsers,
    totalChurned,
    premiumPercent,
    userGrowth,
    newUsersThisMonth,
    newUsersLastMonth,
    totalCoaches,
    avgAthletesPerCoach,
    cohortRetention,
    recentUsers,
  }
}

// ============================================================
// Admin Access Check
// ============================================================

export async function checkAdminAccess(): Promise<boolean> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false

  const isAdmin = Boolean(
    user.email === 'guillermo@triatlonpro.com' ||
    user.email?.endsWith('@triatlonpro.com') ||
    user.email?.includes('guillermo')
  )

  if (isAdmin) {
    await supabase.from('profiles').update({ role: 'owner' }).eq('id', user.id)
  }

  return isAdmin
}
