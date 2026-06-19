import * as React from 'react';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { generateStructuredWorkout } from '@/app/telemetry/workout-push-actions';
import { WorkoutDetailClient } from './workout-detail-client';
import { ArrowLeft, Calendar, Watch } from 'lucide-react';
import { AnimatedButton } from '@/components/ui/animated-button';

interface WorkoutPageProps {
  params: Promise<{ id: string }>;
}

export default async function WorkoutDetailPage({ params }: WorkoutPageProps) {
  const { id } = await params;
  
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // 1. Fetch workout details
  const { data: workout } = await supabase
    .from('user_workouts')
    .select('*, training_sessions(*), universal_telemetry(*), workout_feedback(*)')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (!workout) {
    redirect('/dashboard');
  }

  // 2. Fetch profile data for gear checklist
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  // 3. Generate structured steps for interval rendering
  const structuredWorkout = await generateStructuredWorkout(id);

  return (
    <div className="min-h-screen bg-[var(--color-background)] pb-24">
      {/* Header navbar */}
      <header className="border-b border-[var(--color-border)] bg-[var(--color-background)]/85 backdrop-blur-md sticky top-0 z-50 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-cyan-400 shrink-0">
            <Watch className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-sm sm:text-base font-bold text-white leading-tight">Sesión Estructurada</h1>
            <p className="text-[10px] sm:text-xs text-zinc-400 capitalize">
              Entrenamiento Analizado por IA
            </p>
          </div>
        </div>

        <Link href="/dashboard">
          <AnimatedButton variant="ghost" className="border border-zinc-800 flex items-center gap-2 px-3 py-1.5 text-xs shadow-sm bg-zinc-900/50 hover:bg-zinc-800">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Volver al Dashboard</span>
          </AnimatedButton>
        </Link>
      </header>

      {/* Main Client Shell */}
      <main className="max-w-4xl mx-auto px-6 pt-8">
        <WorkoutDetailClient 
          workout={workout as any} 
          structured={structuredWorkout} 
          profile={profile}
        />
      </main>
    </div>
  );
}
