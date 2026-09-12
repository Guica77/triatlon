import * as React from 'react';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { RaceGoalCard } from '@/components/settings/race-goal-card';
import { PhysiologicalCard } from '@/components/settings/physiological-card';
import { TelemetryConnectCard } from '@/components/settings/telemetry-connect-card';
import { BillingCard } from '@/components/settings/billing-card';
import { SweatTestCard } from '@/components/settings/sweat-test-card';
import { TrainingZonesCard } from '@/components/settings/training-zones-card';
import { InjuryHistory } from '@/components/dashboard/injury-history';
import { ExportButtons } from '@/components/dashboard/export-buttons';
import { updateInjuryHistory } from '@/app/(app)/dashboard/biometrics-actions';
import { DeleteAccountCard } from '@/components/settings/delete-account-card';

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
    <div className="min-h-screen bg-bg-app w-full overflow-x-hidden">
      <main className="apple-athlete-content mx-auto max-w-2xl space-y-7 px-4 pb-24 pt-6 sm:px-6 sm:pb-8">
        <header>
          <h1 className="text-3xl font-semibold tracking-tight text-text-primary">Perfil</h1>
          <p className="mt-1 text-sm text-text-secondary">Entrenamiento y preferencias</p>
        </header>

        <RaceGoalCard
              planName={profile.training_plans?.name || 'Sin Plan'}
              targetRaceName={profile.target_race_name}
              targetRaceDate={profile.target_race_date}
              targetFinishTime={profile.target_finish_time}
              targetSwimTime={profile.target_swim_time}
              targetBikeTime={profile.target_bike_time}
              targetRunTime={profile.target_run_time}
        />

        <section className="space-y-3">
          <h2 className="px-0.5 text-sm font-medium text-text-secondary">Entrenamiento</h2>
          <PhysiologicalCard
                  ftp={profile.current_ftp}
                  swimPace={profile.current_swim_pace}
                  runPace={profile.current_run_pace}
                  baselineHours={profile.baseline_training_hours}
                  previousInjuries={profile.previous_injuries}
          />
          <TrainingZonesCard
                ftp={profile.current_ftp}
                swimPace={profile.current_swim_pace}
                runPace={profile.current_run_pace}
          />
          <SweatTestCard
                  sweatRate={profile.sweat_rate}
                  weightBefore={profile.sweat_test_weight_before}
                  weightAfter={profile.sweat_test_weight_after}
                  fluidIntake={profile.sweat_test_fluid_intake}
                  durationMin={profile.sweat_test_duration_min}
                  customCarbsPerHour={profile.custom_carbs_per_hour}
          />
        </section>

        <section className="space-y-3">
          <h2 className="px-0.5 text-sm font-medium text-text-secondary">Conexiones y cuenta</h2>
          <TelemetryConnectCard
                  connectedProviders={connectedProviders}
                  lastSyncTime={null}
          />
          <BillingCard
                  status={profile.subscription_status}
          />
          <InjuryHistory
              injuries={(profile.previous_injuries || '').split(' | ').filter(Boolean)}
              onSave={updateInjuryHistory}
          />

          <div className="rounded-2xl border border-border-default bg-surface-card p-5">
              <h3 className="text-sm font-bold text-text-primary mb-3">Exportar Datos</h3>
              <p className="text-[10px] text-text-muted font-medium mb-4">Descarga tu historial de entrenamientos en formato CSV o exporta tu calendario a tu app favorita.</p>
              <ExportButtons />
          </div>

          <form action="/auth/signout" method="post" className="rounded-2xl border border-border-default bg-surface-card p-5">
              <h3 className="text-sm font-bold text-text-primary">Cerrar sesión</h3>
              <p className="mt-1 text-xs text-text-muted">Sal de tu cuenta. Tus datos y entrenamientos se conservarán.</p>
              <button type="submit" className="mt-4 min-h-11 rounded-lg border border-border-default px-4 py-2 text-sm font-bold text-text-primary">Cerrar sesión</button>
          </form>
          <DeleteAccountCard />
        </section>

      </main>
    </div>
  );
}
