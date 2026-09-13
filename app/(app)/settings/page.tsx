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
import { WorkoutAIFeedback } from '@/components/dashboard/workout-ai-feedback';
import { ChevronRight, CircleAlert, HeartPulse, Route, Watch, MessageCircle, ShieldCheck, Bell, Droplets, CloudSun, FileDown, HelpCircle, LogOut } from 'lucide-react';

function SettingsRow({ href, label, detail, pending, icon: Icon }: { href: string; label: string; detail?: string; pending?: boolean; icon?: typeof HeartPulse }) {
  return (
    <Link href={href} className="flex min-h-14 items-center gap-3 px-4 text-[17px] text-text-primary transition-colors hover:bg-surface-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">
      {Icon ? <Icon className="h-5 w-5 shrink-0 text-text-secondary" aria-hidden="true" /> : null}
      <span className="min-w-0 flex-1">{label}</span>
      {pending ? <span className="text-sm text-orange-500">Pendiente</span> : detail ? <span className="truncate text-sm text-text-secondary">{detail}</span> : null}
      <ChevronRight className="h-4 w-4 shrink-0 text-text-muted" aria-hidden="true" />
    </Link>
  );
}

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
        <header className="text-center">
          <h1 className="text-3xl font-semibold tracking-tight text-text-primary">Perfil</h1>
          <p className="mt-1 text-sm text-text-secondary">Entrenamiento y preferencias</p>
        </header>

        <section className="space-y-2">
          <div className="rounded-2xl border border-border-default bg-surface-card p-5 text-center">
            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-bg-hover text-lg text-text-secondary">{profile.first_name?.[0] || 'A'}</div>
            <p className="text-lg font-semibold text-text-primary">{profile.first_name || 'Atleta'}</p>
            <p className="text-sm text-text-secondary">Atleta</p>
            <a href="#objetivo" className="mt-3 inline-block text-sm font-medium text-accent">{profile.target_race_name || 'Definir objetivo'} ›</a>
          </div>
        </section>

        {(!profile.current_ftp || !connectedProviders.length) && (
          <section>
            <p className="mb-2 px-1 text-xs font-medium uppercase tracking-wide text-text-secondary">Configuración pendiente</p>
            <Link href="#entrenamiento" className="block rounded-2xl border border-border-default bg-surface-card p-4 text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">
              <CircleAlert className="mx-auto h-5 w-5 text-orange-500" aria-hidden="true" />
              <p className="mt-1 font-semibold text-text-primary">Completa tu preparación</p>
              <p className="mt-1 text-sm text-text-secondary">Añade tus zonas y una fuente de salud para personalizar el plan.</p>
              <span className="mt-2 inline-block text-sm font-medium text-accent">Revisar ajustes</span>
            </Link>
          </section>
        )}

        <section id="entrenamiento" className="space-y-2 scroll-mt-6">
          <p className="px-1 text-xs font-medium uppercase tracking-wide text-text-secondary">Entrenamiento</p>
          <div className="overflow-hidden rounded-2xl border border-border-default bg-surface-card divide-y divide-border-default">
            <SettingsRow href="#fisiologia" label="Fisiología y zonas" pending={!profile.current_ftp} icon={HeartPulse} />
            <SettingsRow href="#objetivo" label="Plan de entrenamiento" icon={Route} />
            <SettingsRow href="#lesiones" label="Lesiones e historial" />
          </div>
        </section>

        <section className="space-y-2">
          <p className="px-1 text-xs font-medium uppercase tracking-wide text-text-secondary">Entrenador y orientación</p>
          <div className="overflow-hidden rounded-2xl border border-border-default bg-surface-card divide-y divide-border-default">
            <SettingsRow href="#orientacion" label="Orientación del entrenamiento" icon={MessageCircle} />
            <SettingsRow href="/chat" label="Tu entrenador" detail={profile.coach_id ? 'Conectado' : 'Sin entrenador'} />
          </div>
        </section>

        <section className="space-y-2">
          <p className="px-1 text-xs font-medium uppercase tracking-wide text-text-secondary">Dispositivos y datos</p>
          <div className="overflow-hidden rounded-2xl border border-border-default bg-surface-card divide-y divide-border-default">
            <SettingsRow href="#conexiones" label="Dispositivos conectados" detail={connectedProviders[0] || 'Pendiente'} pending={!connectedProviders.length} icon={Watch} />
            <SettingsRow href="#conexiones" label="Notificaciones" detail="Gestionar" icon={Bell} />
            <SettingsRow href="#privacidad" label="Privacidad y datos" icon={ShieldCheck} />
          </div>
        </section>

        <section className="space-y-2">
          <p className="px-1 text-xs font-medium uppercase tracking-wide text-text-secondary">Preferencias</p>
          <div className="overflow-hidden rounded-2xl border border-border-default bg-surface-card divide-y divide-border-default">
            <SettingsRow href="#fisiologia" label="Nutrición e hidratación" icon={Droplets} />
            <SettingsRow href="#orientacion" label="Clima y ajustes del entrenamiento" icon={CloudSun} />
            <SettingsRow href="#exportar" label="Exportar datos" icon={FileDown} />
          </div>
        </section>

        <section id="orientacion" className="scroll-mt-6">
          <WorkoutAIFeedback aiConfigured todayWorkout={null} />
        </section>

        <div id="objetivo" className="scroll-mt-6"><RaceGoalCard
              planName={profile.training_plans?.name || 'Sin Plan'}
              targetRaceName={profile.target_race_name}
              targetRaceDate={profile.target_race_date}
              targetFinishTime={profile.target_finish_time}
              targetSwimTime={profile.target_swim_time}
              targetBikeTime={profile.target_bike_time}
              targetRunTime={profile.target_run_time}
        /></div>

        <section id="fisiologia" className="scroll-mt-6 space-y-3">
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
          <h2 className="px-0.5 text-sm font-medium text-text-secondary">Conexiones</h2>
          <div id="conexiones" className="scroll-mt-6"><TelemetryConnectCard
                  connectedProviders={connectedProviders}
                  lastSyncTime={null}
          /></div>
          <div id="lesiones" className="scroll-mt-6"><InjuryHistory
              injuries={(profile.previous_injuries || '').split(' | ').filter(Boolean)}
              onSave={updateInjuryHistory}
          /></div>

          <div id="exportar" className="rounded-2xl border border-border-default bg-surface-card p-5 scroll-mt-6">
              <h3 className="text-sm font-bold text-text-primary mb-3">Exportar Datos</h3>
              <p className="text-[10px] text-text-muted font-medium mb-4">Descarga tu historial de entrenamientos en formato CSV o exporta tu calendario a tu app favorita.</p>
              <ExportButtons />
          </div>

        </section>

        <section id="privacidad" className="space-y-3 scroll-mt-6">
          <h2 className="px-0.5 text-sm font-medium text-text-secondary">Cuenta y privacidad</h2>
          <BillingCard status={profile.subscription_status} />
          <div className="overflow-hidden rounded-2xl border border-border-default bg-surface-card divide-y divide-border-default">
            <SettingsRow href="/privacidad" label="Privacidad y permisos" icon={ShieldCheck} />
            <SettingsRow href="/soporte" label="Soporte" icon={HelpCircle} />
          </div>
          <form action="/auth/signout" method="post" className="rounded-2xl border border-border-default bg-surface-card p-5">
              <div className="flex items-start gap-3"><LogOut className="mt-0.5 h-5 w-5 text-text-secondary" /><div><h3 className="text-sm font-bold text-text-primary">Cerrar sesión</h3><p className="mt-1 text-xs text-text-muted">Sal de tu cuenta. Tus datos y entrenamientos se conservarán.</p></div></div>
              <button type="submit" className="mt-4 min-h-11 rounded-lg border border-border-default px-4 py-2 text-sm font-bold text-text-primary">Cerrar sesión</button>
          </form>
          <Link href="/soporte" className="flex min-h-14 items-center justify-between rounded-2xl border border-border-default bg-surface-card px-4 text-[17px] text-text-primary"><span className="flex items-center gap-3"><HelpCircle className="h-5 w-5 text-text-secondary" />Ayuda y soporte</span><ChevronRight className="h-4 w-4 text-text-muted" /></Link>
          <DeleteAccountCard scheduledFor={profile.deletion_scheduled_for} />
        </section>

      </main>
    </div>
  );
}
