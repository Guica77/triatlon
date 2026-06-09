import * as React from 'react';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { AnimatedButton } from '@/components/ui/animated-button';
import { ArrowLeft, ShoppingBag, Sparkles } from 'lucide-react';
import { MarketplaceAggregatorGrid, MarketplaceItem } from '@/components/marketplace/marketplace-aggregator-grid';
import { SellItemButton } from '@/components/marketplace/sell-item-button';

export const revalidate = 60; // Refrescar caché de chollos cada 60 segundos

export default async function MarketplacePage({
  searchParams,
}: {
  searchParams?: { category?: string; search?: string };
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // 1. Obtener perfil activo
  const { data: profile } = await supabase
    .from('profiles')
    .select('first_name, level, virtual_garage, training_plans(name)')
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
    .select('*, training_sessions(description, gear_needed)')
    .eq('user_id', user.id)
    .gte('scheduled_date', monday.toISOString().split('T')[0])
    .lte('scheduled_date', sunday.toISOString().split('T')[0]);

  const virtualGarage = profile?.virtual_garage || [];
  const gearNeeded: string[] = [];
  workouts?.forEach(w => {
    const sessionGear = w.training_sessions?.gear_needed || [];
    sessionGear.forEach((gear: string) => {
      if (!virtualGarage.includes(gear) && !gearNeeded.includes(gear)) {
        gearNeeded.push(gear);
      }
    });
    
    // Fallback Legacy
    const desc = w.training_sessions?.description?.toLowerCase() || '';
    if (desc.includes('palas') && !virtualGarage.includes('Palas de Natación') && !gearNeeded.includes('Palas de Natación')) gearNeeded.push('Palas de Natación');
    if (desc.includes('aletas') && !virtualGarage.includes('Aletas de Natación') && !gearNeeded.includes('Aletas de Natación')) gearNeeded.push('Aletas de Natación');
  });

  const initialCategory = searchParams?.category || 'todos';
  const initialSearchQuery = searchParams?.search || '';
  const formattedItems: MarketplaceItem[] = (items || []).map(item => ({
    ...item,
    is_active: item.is_active ?? true,
    created_at: item.created_at ?? new Date().toISOString()
  }));

  return (
    <div className="min-h-screen bg-[var(--color-background)] pb-24">
      
      {/* Top Navbar */}
      <header className="border-b border-[var(--color-border)] bg-[var(--color-background)]/80 backdrop-blur-md sticky top-0 z-50 px-4 sm:px-6 py-3 sm:py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0">
        <div className="flex items-center justify-between w-full sm:w-auto gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center shadow-inner shrink-0">
              <ShoppingBag className="w-4 h-4 text-cyan-400" />
            </div>
            <div>
              <h1 className="text-sm sm:text-base font-semibold text-zinc-50 tracking-tight">Marketplace de Segunda Mano</h1>
              <p className="text-[11px] sm:text-xs text-zinc-400 capitalize line-clamp-1">
                {activePlan?.name || 'Plan de Entrenamiento'} • Atleta: {profile?.first_name || 'Triatleta'}
              </p>
            </div>
          </div>
          <Link href="/dashboard" className="sm:hidden">
            <AnimatedButton variant="ghost" size="sm" className="border border-zinc-800 flex items-center gap-1 px-2.5 py-1 text-xs">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Dashboard</span>
            </AnimatedButton>
          </Link>
        </div>

        <div className="hidden sm:flex items-center gap-3">
          <Link href="/dashboard">
            <AnimatedButton variant="ghost" size="sm" className="border border-zinc-800 flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              <span>Volver al Dashboard</span>
            </AnimatedButton>
          </Link>
          <SellItemButton virtualGarage={virtualGarage} />
        </div>
      </header>

      {/* Contenedor Principal */}
      <main className="max-w-6xl mx-auto px-6 pt-8 space-y-8">
        
        {/* Encabezado de Sección */}
        <div className="space-y-1">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5 flex-wrap">
            <Sparkles className="w-3.5 h-3.5" /> Comunidad Triatlón Pro
            <span className="bg-emerald-500/10 text-emerald-400 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-emerald-500/20 uppercase tracking-wider">
              100% Sin Comisiones
            </span>
          </h2>
          <p className="text-sm text-zinc-400 max-w-3xl leading-relaxed">
            Compra y vende material certificado directamente a otros atletas de la plataforma. Sin intermediarios, sin comisiones ocultas y con la seguridad de la comunidad.
          </p>
        </div>

        {/* Grid Interactivo */}
        <MarketplaceAggregatorGrid 
          initialItems={formattedItems} 
          initialCategory={initialCategory}
          initialSearchQuery={initialSearchQuery}
          userWorkoutGearNeeded={gearNeeded}
        />

      </main>
    </div>
  );
}
