import * as React from 'react';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { AnimatedButton } from '@/components/ui/animated-button';
import { Settings, ArrowLeft } from 'lucide-react';
import { RaceGoalCard } from '@/components/settings/race-goal-card';
import { PhysiologicalCard } from '@/components/settings/physiological-card';
import { TelemetryConnectCard } from '@/components/settings/telemetry-connect-card';
import { BillingCard } from '@/components/settings/billing-card';
import { SweatTestCard } from '@/components/settings/sweat-test-card';
import { TrainingZonesCard } from '@/components/settings/training-zones-card';
import { PageHeader } from '@/components/ui/page-header';
import { InjuryHistory } from '@/components/dashboard/injury-history';
import { ExportButtons } from '@/components/dashboard/export-buttons';
import { updateInjuryHistory } from '@/app/(app)/dashboard/biometrics-actions';

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
    <div className="min-h-screen bg-zinc-950">
      <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-6 pb-8 space-y-6">

        <PageHeader
          icon={Settings}
          title="Ajustes y Perfil del Atleta"
          subtitle="Hiper-personalización de Entrenamientos"
        />
        
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
                  previousInjuries={profile.previous_injuries}
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

            <div className="h-full">
              <TrainingZonesCard 
                ftp={profile.current_ftp}
                swimPace={profile.current_swim_pace}
                runPace={profile.current_run_pace}
              />
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

            {/* Injury History */}
            <InjuryHistory
              injuries={(profile.previous_injuries || '').split(' | ').filter(Boolean)}
              onSave={updateInjuryHistory}
            />

            {/* Export Data */}
            <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5">
              <h3 className="text-sm font-bold text-white mb-3">Exportar Datos</h3>
              <p className="text-[10px] text-zinc-500 font-medium mb-4">Descarga tu historial de entrenamientos en formato CSV o exporta tu calendario a tu app favorita.</p>
              <ExportButtons />
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}
