import * as React from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getDailyBiometrics } from '@/app/(app)/dashboard/biometrics-actions'
import { analyzeRecovery } from '@/lib/recovery-analysis'
import { RecoveryDashboard } from '@/components/dashboard/recovery-dashboard'
import { BiometricsCard } from '@/components/dashboard/biometrics-card'
import { DailyFuelCard } from '@/components/dashboard/daily-fuel-card'
import { getDailyNutrition } from '@/app/(app)/dashboard/nutrition-actions'
import { Heart, Flame } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function RecuperacionPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const todayStr = new Date().toISOString().split('T')[0]

  const [profileRes, biometricsRes, nutritionRes] = await Promise.all([
    supabase.from('profiles').select('first_name, preferred_ingredients').eq('id', user.id).single(),
    getDailyBiometrics(),
    getDailyNutrition(todayStr),
  ])

  const profile = profileRes.data
  const biometrics = biometricsRes.data || null
  const biometricsHistory = biometricsRes.history || []
  const nutritionData = nutritionRes.data || null

  const recoveryData = {
    date: todayStr,
    hrv: biometrics?.hrv || null,
    sleepHours: biometrics?.sleep_hours || null,
    sleepScore: biometrics?.sleep_score || null,
    readinessScore: biometrics?.readiness_score || null,
    fatigueRating: biometrics?.fatigue_rating || null,
    stressLevel: biometrics?.stress_level || null,
    rhr: biometrics?.rhr || null,
    weight: biometrics?.weight || null,
  }

  const recoveryHistory = (biometricsHistory || []).slice(-7).map((b: any) => ({
    date: b.date,
    hrv: b.hrv || null,
    sleepHours: b.sleep_hours || null,
    sleepScore: b.sleep_score || null,
    readinessScore: b.readiness_score || null,
    fatigueRating: b.fatigue_rating || null,
    stressLevel: b.stress_level || null,
    rhr: b.rhr || null,
    weight: b.weight || null,
  }))

  const recoveryAnalysis = analyzeRecovery(recoveryData, recoveryHistory)

  return (
    <div className="min-h-screen bg-surface-app w-full overflow-x-hidden">
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-24 sm:pb-8 space-y-6">

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-bike/10 border border-bike/20 flex items-center justify-center shrink-0">
            <Heart className="w-4 h-4 text-bike" />
          </div>
          <div>
            <h1 className="text-base font-bold text-text-primary tracking-tight">Recuperación</h1>
            <p className="text-xs text-text-muted font-medium">Tu estado de recuperación y biometría</p>
          </div>
        </div>

        {/* Recovery Dashboard */}
        <RecoveryDashboard analysis={recoveryAnalysis} />

        {/* Biometrics */}
        <div>
          <h2 className="text-sm font-bold text-text-primary mb-3">Biometría de hoy</h2>
          <BiometricsCard
            initialBiometrics={biometrics as any}
            initialBiometricsHistory={biometricsHistory}
          />
        </div>

        {/* Nutrition Fuel */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Flame className="w-4 h-4 text-coral-500" />
            <h2 className="text-sm font-bold text-text-primary">Combustible</h2>
          </div>
          <DailyFuelCard
            nutritionData={nutritionData}
            preferredIngredients={profile?.preferred_ingredients || []}
          />
        </div>
      </main>
    </div>
  )
}
