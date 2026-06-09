'use client';

import * as React from 'react';

export function PricingCalculator() {
  const [numAthletes, setNumAthletes] = React.useState(30);

  // TrainingPeaks charges $99/mo coach subscription + $9/mo per premium athlete
  const tpMonthlyCost = 99 + (numAthletes * 9);
  const triProMonthlyCost = 19; // flat €19
  const monthlySavings = tpMonthlyCost - triProMonthlyCost;
  const annualSavings = monthlySavings * 12;

  return (
    <section className="py-20 px-4 sm:px-8 max-w-4xl mx-auto space-y-12 border-t border-zinc-900/50">
      <div className="text-center max-w-xl mx-auto space-y-4">
        <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full font-black uppercase tracking-wider">
          La ventaja del Euro y la tarifa plana
        </span>
        <h2 className="text-2xl sm:text-4xl font-extrabold">¿Cuánto ahorras frente a TrainingPeaks?</h2>
        <p className="text-sm text-zinc-400 leading-relaxed">
          TrainingPeaks está diseñado en dólares (USD), cobra por atleta premium y encarece la gestión de tu club. Calcula tu cuota plana con nosotros.
        </p>
      </div>

      <div className="bg-zinc-900/20 border border-zinc-800/80 rounded-3xl p-6 sm:p-10 space-y-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <label className="text-sm font-bold text-zinc-300 font-sans">Número de atletas en tu roster:</label>
            <span className="text-lg font-black text-cyan-400 bg-cyan-400/10 px-3 py-1 rounded-lg">
              {numAthletes} atletas
            </span>
          </div>
          <input
            type="range"
            min="5"
            max="100"
            value={numAthletes}
            onChange={(e) => setNumAthletes(parseInt(e.target.value))}
            className="w-full h-2 bg-zinc-800 rounded-lg appearance-none accent-emerald-400 cursor-pointer"
          />
          <div className="flex justify-between text-xs text-zinc-500">
            <span>5 atletas</span>
            <span>50 atletas</span>
            <span>100 atletas</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-zinc-900">
          <div className="bg-zinc-950/50 p-5 rounded-2xl border border-zinc-900 text-center space-y-1">
            <span className="text-xs text-zinc-500 block font-semibold uppercase">TrainingPeaks (USD)</span>
            <span className="text-2xl font-black text-zinc-400">
              ${tpMonthlyCost} <span className="text-xs text-zinc-500">/ mes</span>
            </span>
            <span className="text-[10px] text-zinc-600 block">
              $99 base + $9/atleta premium
            </span>
          </div>
          
          <div className="bg-emerald-500/5 p-5 rounded-2xl border border-emerald-500/20 text-center space-y-1 relative">
            <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-[9px] font-black bg-emerald-400 text-black px-2 py-0.5 rounded-full uppercase tracking-wider">
              Tarifa Plana
            </div>
            <span className="text-xs text-emerald-400 block font-semibold uppercase">Triatlon Pro</span>
            <span className="text-2xl font-black text-white">
              19€ <span className="text-xs text-zinc-400">/ mes</span>
            </span>
            <span className="text-[10px] text-emerald-500 block font-bold">
              Atletas ilimitados • Soporte en Euro
            </span>
          </div>

          <div className="bg-gradient-to-br from-cyan-500/10 to-emerald-500/10 p-5 rounded-2xl border border-cyan-500/20 text-center space-y-1">
            <span className="text-xs text-cyan-400 block font-semibold uppercase">Tu Ahorro Anual</span>
            <span className="text-2xl font-black text-emerald-400">
              ~{Math.round(annualSavings)}€ <span className="text-xs text-emerald-400/70">/ año</span>
            </span>
            <span className="text-[10px] text-zinc-400 block font-medium">
              Cambio de divisa + sin límite
            </span>
          </div>
        </div>

        <div className="bg-zinc-900/40 p-4 rounded-xl border border-zinc-900/60 text-xs text-zinc-400 leading-relaxed text-center">
          🚀 <strong>Ventaja Europea:</strong> Además del ahorro económico de la tarifa plana, disfrutas de soporte y facturación en euros y plataforma completamente traducida al español para ti y tus atletas.
        </div>
      </div>
    </section>
  );
}
