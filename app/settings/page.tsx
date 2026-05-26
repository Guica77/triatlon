import * as React from 'react';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { AnimatedButton } from '@/components/ui/animated-button';
import { ArrowLeft, Settings } from 'lucide-react';
import { RaceGoalCard } from '@/components/settings/race-goal-card';
import { PhysiologicalCard } from '@/components/settings/physiological-card';
import { VirtualGarageCard } from '@/components/settings/virtual-garage-card';
import { TelemetryConnectCard } from '@/components/settings/telemetry-connect-card';

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*, training_plans(name)')
    .eq('id', user.id)
    .single();

  if (!profile) {
    redirect('/onboarding');
  }

  // 1.8 Obtener todos los dispositivos conectados de la base de datos
  const { data: devices } = await supabase
    .from('user_connected_devices')
    .select('provider')
    .eq('user_id', user.id);

  const connectedProviders = [
    ...(profile.garmin_connected ? ['garmin'] : []),
    ...(profile.strava_connected ? ['strava'] : []),
    ...(devices?.map(d => d.provider.toLowerCase()) || [])
  ];

  return (
    <div className="min-h-screen bg-[var(--color-background)] pb-24">
      
      {/* Top Navbar */}
      <header className="border-b border-[var(--color-border)] bg-[var(--color-background)]/80 backdrop-blur-md sticky top-0 z-50 px-4 sm:px-6 py-3 sm:py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center shadow-inner shrink-0">
            <Settings className="w-4 h-4 text-zinc-300" />
          </div>
          <div>
            <h1 className="text-sm sm:text-base font-semibold text-zinc-50 tracking-tight">Ajustes y Perfil del Atleta</h1>
            <p className="text-[11px] sm:text-xs text-zinc-400 capitalize">
              Hiper-personalización de Entrenamientos
            </p>
          </div>
        </div>

        <Link href="/dashboard" className="w-full sm:w-auto">
          <AnimatedButton variant="ghost" className="w-full sm:w-auto border border-zinc-800 flex items-center justify-center gap-2 px-4 py-2 text-xs sm:text-sm shadow-sm bg-zinc-900/50 hover:bg-zinc-800">
            <ArrowLeft className="w-4 h-4" />
            <span className="font-semibold text-zinc-300">Volver al Dashboard</span>
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

          {/* Right Column: Physiological and Virtual Garage Grid */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            <div className="flex-1">
              <PhysiologicalCard 
                ftp={profile.current_ftp}
                swimPace={profile.current_swim_pace}
                runPace={profile.current_run_pace}
                baselineHours={profile.baseline_training_hours}
              />
            </div>
            
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="h-full">
                <VirtualGarageCard 
                  initialGarage={profile.virtual_garage || []}
                />
              </div>
              <div className="h-full">
                <TelemetryConnectCard 
                  connectedProviders={connectedProviders}
                  lastSyncTime={null}
                />
              </div>
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}
