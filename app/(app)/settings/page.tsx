import * as React from 'react';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { AnimatedButton } from '@/components/ui/animated-button';
import { ArrowLeft, Settings } from 'lucide-react';
import { RaceGoalCard } from '@/components/settings/race-goal-card';
import { PhysiologicalCard } from '@/components/settings/physiological-card';
import { TelemetryConnectCard } from '@/components/settings/telemetry-connect-card';
import { BillingCard } from '@/components/settings/billing-card';
import { SweatTestCard } from '@/components/settings/sweat-test-card';

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Obtener perfil y dispositivos conectados en paralelo
  const [profileRes, devicesRes] = await Promise.all([
    supabase
      .from('profiles')
      .select('*, training_plans(name)')
      .eq('id', user.id)
      .single(),
    supabase
      .from('user_connected_devices')
      .select('provider')
      .eq('user_id', user.id)
  ]);

  const profile = profileRes.data;
  const devices = devicesRes.data;

  if (!profile) {
    redirect('/onboarding');
  }

  const connectedProviders = [
    ...(profile.garmin_connected ? ['garmin'] : []),
    ...(profile.strava_connected ? ['strava'] : []),
    ...(devices?.map(d => d.provider.toLowerCase()) || [])
  ];

  return (
    <div className="min-h-screen bg-[var(--color-background)] pb-24">
      
      {/* Top Navbar */}
      <header className="border-b border-zinc-200 bg-white/95 backdrop-blur-md sticky top-0 z-50 px-4 sm:px-6 py-3 sm:py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0 transition-all duration-300">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-cyan-50 border border-cyan-100 flex items-center justify-center shadow-sm shrink-0">
            <Settings className="w-4 h-4 text-cyan-500" />
          </div>
          <div>
            <h1 className="text-sm sm:text-base font-bold text-zinc-850 tracking-tight">Ajustes y Perfil del Atleta</h1>
            <p className="text-[11px] sm:text-xs text-zinc-500 font-semibold capitalize">
              Hiper-personalización de Entrenamientos
            </p>
          </div>
        </div>

        <Link href="/dashboard" className="w-full sm:w-auto">
          <AnimatedButton variant="ghost" className="w-full sm:w-auto border border-zinc-200 flex items-center justify-center gap-2 px-4 py-2 text-xs sm:text-sm shadow-sm bg-white hover:bg-zinc-50 text-zinc-650 hover:text-zinc-800">
            <ArrowLeft className="w-4 h-4" />
            <span className="font-semibold">Volver al Dashboard</span>
          </AnimatedButton>
        </Link>
      </header>

      {/* Main Grid Content */}
      <main className="max-w-5xl mx-auto px-6 pt-8 space-y-6">
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Hero Race Goal (Spans 1 col, but visually impactful) */}
          <div className="lg:col-span-1 h-[350px] lg:h-auto">
            <RaceGoalCard 
              planName={profile.training_plans?.name || 'Sin Plan'}
              targetRaceName={profile.target_race_name}
              targetRaceDate={profile.target_race_date}
              targetFinishTime={profile.target_finish_time}
              targetSwimTime={profile.target_swim_time}
              targetBikeTime={profile.target_bike_time}
              targetRunTime={profile.target_run_time}
            />
          </div>

          {/* Right Column: Physiological, Sweat Test and Tech Integrations */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="h-full">
                <PhysiologicalCard 
                  ftp={profile.current_ftp}
                  swimPace={profile.current_swim_pace}
                  runPace={profile.current_run_pace}
                  baselineHours={profile.baseline_training_hours}
                />
              </div>
              <div className="h-full">
                <SweatTestCard 
                  sweatRate={profile.sweat_rate}
                  weightBefore={profile.sweat_test_weight_before}
                  weightAfter={profile.sweat_test_weight_after}
                  fluidIntake={profile.sweat_test_fluid_intake}
                  durationMin={profile.sweat_test_duration_min}
                  customCarbsPerHour={profile.custom_carbs_per_hour}
                />
              </div>
            </div>
            
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="h-full">
                <TelemetryConnectCard 
                  connectedProviders={connectedProviders}
                  lastSyncTime={null}
                />
              </div>
              <div className="h-full">
                <BillingCard 
                  status={profile.subscription_status}
                />
              </div>
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}
