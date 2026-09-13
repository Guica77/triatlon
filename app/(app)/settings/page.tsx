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
import { ArrowLeft, ChevronRight, CircleAlert, HeartPulse, Route, Watch, MessageCircle, ShieldCheck, Bell, Droplets, CloudSun, FileDown, HelpCircle, LogOut, BookOpen } from 'lucide-react';

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

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ section?: string }> }) {
  const section = (await searchParams).section;
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

  if (section) {
    const detail = section === 'fisiologia' ? <section className="space-y-3"><PhysiologicalCard ftp={profile.current_ftp} swimPace={profile.current_swim_pace} runPace={profile.current_run_pace} baselineHours={profile.baseline_training_hours} previousInjuries={profile.previous_injuries} /><TrainingZonesCard ftp={profile.current_ftp} swimPace={profile.current_swim_pace} runPace={profile.current_run_pace} /><SweatTestCard sweatRate={profile.sweat_rate} weightBefore={profile.sweat_test_weight_before} weightAfter={profile.sweat_test_weight_after} fluidIntake={profile.sweat_test_fluid_intake} durationMin={profile.sweat_test_duration_min} customCarbsPerHour={profile.custom_carbs_per_hour} /></section>
      : section === 'plan' ? <RaceGoalCard planName={profile.training_plans?.name || 'Sin plan'} targetRaceName={profile.target_race_name} targetRaceDate={profile.target_race_date} targetFinishTime={profile.target_finish_time} targetSwimTime={profile.target_swim_time} targetBikeTime={profile.target_bike_time} targetRunTime={profile.target_run_time} />
      : section === 'lesiones' ? <InjuryHistory injuries={(profile.previous_injuries || '').split(' | ').filter(Boolean)} onSave={updateInjuryHistory} />
      : section === 'orientacion' ? <WorkoutAIFeedback aiConfigured todayWorkout={null} />
      : section === 'dispositivos' ? <TelemetryConnectCard connectedProviders={connectedProviders} lastSyncTime={null} />
      : section === 'exportar' ? <div className="rounded-2xl border border-border-default bg-surface-card p-5"><h2 className="font-semibold text-text-primary">Exportar datos</h2><p className="mt-1 text-sm leading-relaxed text-text-secondary">Descarga tu historial de entrenamientos o llévalo a tu calendario.</p><div className="mt-5"><ExportButtons /></div></div>
      : section === 'privacidad' ? <section className="space-y-3"><BillingCard status={profile.subscription_status} /><div className="overflow-hidden rounded-2xl border border-border-default bg-surface-card divide-y divide-border-default"><SettingsRow href="/privacidad" label="Privacidad y permisos" icon={ShieldCheck} /><SettingsRow href="/soporte" label="Ayuda y soporte" icon={HelpCircle} /></div><form action="/auth/signout" method="post" className="rounded-2xl border border-border-default bg-surface-card p-5"><div className="flex items-start gap-3"><LogOut className="mt-0.5 h-5 w-5 text-text-secondary" /><div><h2 className="font-semibold text-text-primary">Cerrar sesión</h2><p className="mt-1 text-sm text-text-secondary">Tus datos y entrenamientos se conservarán.</p></div></div><button type="submit" className="mt-4 min-h-11 rounded-xl border border-border-default px-4 text-sm font-semibold text-text-primary">Cerrar sesión</button></form><DeleteAccountCard scheduledFor={profile.deletion_scheduled_for} /></section>
      : section === 'nutricion' ? <SweatTestCard sweatRate={profile.sweat_rate} weightBefore={profile.sweat_test_weight_before} weightAfter={profile.sweat_test_weight_after} fluidIntake={profile.sweat_test_fluid_intake} durationMin={profile.sweat_test_duration_min} customCarbsPerHour={profile.custom_carbs_per_hour} />
      : <div className="rounded-2xl border border-border-default bg-surface-card p-5"><CloudSun className="h-6 w-6 text-accent" /><h2 className="mt-3 font-semibold text-text-primary">Clima y ajustes</h2><p className="mt-1 text-sm leading-relaxed text-text-secondary">El tiempo se consulta en vivo desde la tarjeta de cada sesión exterior. Al tocarlo puedes ver previsión, humedad, viento y aceptar una propuesta de ajuste.</p></div>;
    const titles: Record<string, string> = { fisiologia: 'Fisiología y zonas', plan: 'Plan de entrenamiento', lesiones: 'Lesiones e historial', orientacion: 'Orientación del entrenamiento', dispositivos: 'Dispositivos conectados', exportar: 'Exportar datos', privacidad: 'Cuenta y privacidad', nutricion: 'Nutrición e hidratación', clima: 'Clima y ajustes' };
    return <div className="min-h-screen bg-bg-app"><main className="apple-athlete-content mx-auto max-w-2xl px-4 pb-24 pt-5 sm:px-6"><Link href="/settings" className="mb-5 inline-flex min-h-10 items-center gap-1 text-sm font-medium text-accent"><ArrowLeft className="h-4 w-4" />Perfil</Link><h1 className="mb-5 text-2xl font-semibold tracking-tight text-text-primary">{titles[section] || 'Ajustes'}</h1>{detail}</main></div>;
  }

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
            <Link href="/settings?section=plan" className="mt-3 inline-block text-sm font-medium text-accent">{profile.target_race_name || 'Definir objetivo'} ›</Link>
          </div>
        </section>

        {(!profile.current_ftp || !connectedProviders.length) && (
          <section>
            <p className="mb-2 px-1 text-xs font-medium uppercase tracking-wide text-text-secondary">Configuración pendiente</p>
            <Link href="/settings?section=fisiologia" className="block rounded-2xl border border-border-default bg-surface-card p-4 text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">
              <CircleAlert className="mx-auto h-5 w-5 text-orange-500" aria-hidden="true" />
              <p className="mt-1 font-semibold text-text-primary">Completa tu preparación</p>
              <p className="mt-1 text-sm text-text-secondary">Añade tus zonas y una fuente de salud para personalizar el plan.</p>
              <span className="mt-2 inline-block text-sm font-medium text-accent">Revisar ajustes</span>
            </Link>
          </section>
        )}

        <section className="space-y-2">
          <p className="px-1 text-xs font-medium uppercase tracking-wide text-text-secondary">Entrenamiento</p>
          <div className="overflow-hidden rounded-2xl border border-border-default bg-surface-card divide-y divide-border-default">
            <SettingsRow href="/settings?section=fisiologia" label="Fisiología y zonas" pending={!profile.current_ftp} icon={HeartPulse} />
            <SettingsRow href="/settings?section=plan" label="Plan de entrenamiento" icon={Route} />
            <SettingsRow href="/settings?section=lesiones" label="Lesiones e historial" />
          </div>
        </section>

        <section className="space-y-2">
          <p className="px-1 text-xs font-medium uppercase tracking-wide text-text-secondary">Entrenador y orientación</p>
          <div className="overflow-hidden rounded-2xl border border-border-default bg-surface-card divide-y divide-border-default">
            <SettingsRow href="/settings?section=orientacion" label="Orientación del entrenamiento" icon={MessageCircle} />
            <SettingsRow href="/chat" label="Tu entrenador" detail={profile.coach_id ? 'Conectado' : 'Sin entrenador'} />
          </div>
        </section>

        <section className="space-y-2">
          <p className="px-1 text-xs font-medium uppercase tracking-wide text-text-secondary">Dispositivos y datos</p>
          <div className="overflow-hidden rounded-2xl border border-border-default bg-surface-card divide-y divide-border-default">
            <SettingsRow href="/settings?section=dispositivos" label="Dispositivos conectados" detail={connectedProviders[0] || 'Pendiente'} pending={!connectedProviders.length} icon={Watch} />
            <SettingsRow href="/biblioteca" label="Biblioteca y fuentes" detail="Conocimiento para tu IA" icon={BookOpen} />
            <SettingsRow href="/settings?section=privacidad" label="Notificaciones" detail="Gestionar" icon={Bell} />
            <SettingsRow href="/settings?section=privacidad" label="Privacidad y datos" icon={ShieldCheck} />
          </div>
        </section>

        <section className="space-y-2">
          <p className="px-1 text-xs font-medium uppercase tracking-wide text-text-secondary">Preferencias</p>
          <div className="overflow-hidden rounded-2xl border border-border-default bg-surface-card divide-y divide-border-default">
            <SettingsRow href="/settings?section=nutricion" label="Nutrición e hidratación" icon={Droplets} />
            <SettingsRow href="/settings?section=clima" label="Clima y ajustes del entrenamiento" icon={CloudSun} />
            <SettingsRow href="/settings?section=exportar" label="Exportar datos" icon={FileDown} />
          </div>
        </section>

      </main>
    </div>
  );
}
