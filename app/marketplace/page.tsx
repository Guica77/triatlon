import * as React from 'react';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { AnimatedButton } from '@/components/ui/animated-button';
import { ArrowLeft, ShoppingBag, Sparkles } from 'lucide-react';
import { MarketplaceAggregatorGrid, MarketplaceItem } from '@/components/marketplace/marketplace-aggregator-grid';

export const revalidate = 60; // Refrescar caché de chollos cada 60 segundos

export default async function MarketplacePage({
  searchParams,
}: {
  searchParams?: { category?: string };
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // 1. Obtener perfil activo
  const { data: profile } = await supabase
    .from('profiles')
    .select('first_name, level, training_plans(name)')
    .eq('id', user.id)
    .single();

  const activePlan = profile?.training_plans;

  // 2. Obtener chollos activos del marketplace
  const { data: items, error } = await supabase
    .from('marketplace_items')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error al obtener chollos del marketplace:', error);
  }

  // 3. Obtener entrenamientos de la semana para extraer sugerencias de material (IA Gear Match)
  const now = new Date();
  const currentDay = now.getDay() || 7;
  const monday = new Date(now);
  monday.setDate(monday.getDate() - currentDay + 1);
  monday.setHours(0, 0, 0, 0);

  const sunday = new Date(monday);
  sunday.setDate(sunday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  const { data: workouts } = await supabase
    .from('user_workouts')
    .select('*, training_sessions(description)')
    .eq('user_id', user.id)
    .gte('scheduled_date', monday.toISOString().split('T')[0])
    .lte('scheduled_date', sunday.toISOString().split('T')[0]);

  const gearNeeded: string[] = [];
  workouts?.forEach(w => {
    const desc = w.training_sessions?.description?.toLowerCase() || '';
    if (desc.includes('palas') && !gearNeeded.includes('Palas de Natación')) gearNeeded.push('Palas de Natación');
    if (desc.includes('aletas') && !gearNeeded.includes('Aletas de Natación')) gearNeeded.push('Aletas de Natación');
    if (desc.includes('potenciometro') && !gearNeeded.includes('Potenciómetro')) gearNeeded.push('Potenciómetro');
    if (desc.includes('ruedas') && !gearNeeded.includes('Ruedas de Perfil')) gearNeeded.push('Ruedas de Perfil');
    if (desc.includes('cabra') && !gearNeeded.includes('Bicicleta Contrarreloj')) gearNeeded.push('Bicicleta Contrarreloj');
  });

  if (gearNeeded.length === 0) {
    gearNeeded.push('Palas de Natación', 'Aletas de Natación'); // Sugerencia por defecto
  }

  const initialCategory = searchParams?.category || 'todos';
  const formattedItems: MarketplaceItem[] = (items || []).map(item => ({
    ...item,
    is_active: item.is_active ?? true,
    created_at: item.created_at ?? new Date().toISOString()
  }));

  return (
    <div className="min-h-screen bg-[var(--color-background)] pb-24">
      
      {/* Top Navbar */}
      <header className="border-b border-[var(--color-border)] bg-[var(--color-background)]/80 backdrop-blur-md sticky top-0 z-50 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center shadow-inner">
            <ShoppingBag className="w-4 h-4 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-base font-medium text-zinc-50">Marketplace de Segunda Mano</h1>
            <p className="text-xs text-zinc-400 capitalize">
              {activePlan?.name || 'Plan de Entrenamiento'} • Atleta: {profile?.first_name || 'Triatleta'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/dashboard">
            <AnimatedButton variant="ghost" size="sm" className="border border-zinc-800 flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              <span>Volver al Dashboard</span>
            </AnimatedButton>
          </Link>
        </div>
      </header>

      {/* Contenedor Principal */}
      <main className="max-w-6xl mx-auto px-6 pt-8 space-y-8">
        
        {/* Encabezado de Sección */}
        <div className="space-y-1">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" /> Agregador Inteligente de Chollos (AI Scraper Hub)
          </h2>
          <p className="text-sm text-zinc-400 max-w-3xl">
            Rastreamos continuamente Wallapop, Tuvalum, TuTriatlon y BuyCycle para encontrarte el mejor material certificado de triatlón. Compra directamente al vendedor sin comisiones.
          </p>
        </div>

        {/* Grid Interactivo */}
        <MarketplaceAggregatorGrid 
          initialItems={formattedItems} 
          initialCategory={initialCategory}
          userWorkoutGearNeeded={gearNeeded}
        />

      </main>
    </div>
  );
}
