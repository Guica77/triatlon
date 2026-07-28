'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { Activity, Users, ArrowRight, Shield, Zap, Star, Sparkles, TrendingUp, Heart } from 'lucide-react';
import { motion } from 'framer-motion';

const PHRASES = [
  'Tu plan de entrenamiento personalizado te espera',
  'Transforma tu rendimiento con IA',
  'Conecta Garmin y Strava en segundos',
  'Periodización avanzada sin complicaciones',
  '1,324+ ejercicios con video incluidos',
  'Análisis de recuperación inteligente',
];

const FEATURES = [
  { icon: Sparkles, label: 'IA Coach', color: 'text-cyan-400' },
  { icon: Shield, label: 'Telemetría', color: 'text-emerald-400' },
  { icon: Activity, label: 'Garmin + Strava', color: 'text-amber-400' },
  { icon: Heart, label: 'Recuperación', color: 'text-rose-400' },
];

export default function LoginGatewayPage() {
  const router = useRouter();
  const [phraseIdx, setPhraseIdx] = React.useState(0);
  const [hoveredCard, setHoveredCard] = React.useState<string | null>(null);

  React.useEffect(() => {
    const interval = setInterval(() => setPhraseIdx(i => (i + 1) % PHRASES.length), 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <AuthLayout
      title="Triatlon Pro"
      subtitle="La plataforma de entrenamiento con IA que supera a TrainingPeaks"
    >
      <div className="space-y-6 relative z-10">
        {/* Rotating subtitle */}
        <motion.p
          key={phraseIdx}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.3 }}
          className="text-xs text-zinc-400 font-medium text-center leading-relaxed h-8"
        >
          {PHRASES[phraseIdx]}
        </motion.p>

        <div className="flex flex-col gap-3">
          {/* Athlete Card */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onMouseEnter={() => setHoveredCard('athlete')}
            onMouseLeave={() => setHoveredCard(null)}
            onClick={() => router.push('/athlete/login')}
            className="group w-full bg-gradient-to-br from-zinc-800/50 to-zinc-800/30 border border-zinc-700/50 rounded-2xl p-5 text-left transition-all hover:border-cyan-500/40 hover:shadow-lg hover:shadow-cyan-500/5 cursor-pointer flex items-center gap-4 relative overflow-hidden"
          >
            <div className="absolute -top-6 -right-6 w-24 h-24 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none group-hover:bg-cyan-500/15 transition-all duration-500" />
            {hoveredCard === 'athlete' && (
              <motion.div
                layoutId="glow-athlete"
                className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              />
            )}
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-cyan-500/30 to-cyan-600/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-sm shrink-0 group-hover:scale-110 transition-transform duration-300 relative">
              <Activity className="w-7 h-7" />
              <motion.div
                className="absolute inset-0 rounded-xl border border-cyan-400/0 group-hover:border-cyan-400/20"
                transition={{ duration: 0.3 }}
              />
            </div>
            <div className="flex-1 min-w-0 pr-2 relative">
              <h3 className="text-lg font-bold text-white tracking-tight leading-tight group-hover:text-cyan-400 transition-colors">
                Soy Atleta
              </h3>
              <p className="text-xs text-zinc-500 font-medium leading-relaxed mt-0.5">
                Entrena con planes estructurados e IA personalizada
              </p>
              <div className="flex items-center gap-2 mt-2">
                <span className="px-2 py-0.5 rounded-full bg-cyan-500/10 text-[9px] text-cyan-400 font-bold border border-cyan-500/20">
                  1,324+ ejercicios
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-[9px] text-emerald-400 font-bold border border-emerald-500/20">
                  IA Coach
                </span>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-zinc-600 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all shrink-0 ml-auto relative" />
          </motion.button>

          {/* Coach Card */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onMouseEnter={() => setHoveredCard('coach')}
            onMouseLeave={() => setHoveredCard(null)}
            onClick={() => router.push('/coach/login')}
            className="group w-full bg-gradient-to-br from-zinc-800/50 to-zinc-800/30 border border-zinc-700/50 rounded-2xl p-5 text-left transition-all hover:border-amber-500/40 hover:shadow-lg hover:shadow-amber-500/5 cursor-pointer flex items-center gap-4 relative overflow-hidden"
          >
            <div className="absolute -top-6 -right-6 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl pointer-events-none group-hover:bg-amber-500/15 transition-all duration-500" />
            {hoveredCard === 'coach' && (
              <motion.div
                layoutId="glow-coach"
                className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              />
            )}
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-amber-500/30 to-amber-600/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-sm shrink-0 group-hover:scale-110 transition-transform duration-300 relative">
              <Users className="w-7 h-7" />
              <motion.div
                className="absolute inset-0 rounded-xl border border-amber-400/0 group-hover:border-amber-400/20"
                transition={{ duration: 0.3 }}
              />
            </div>
            <div className="flex-1 min-w-0 pr-2 relative">
              <h3 className="text-lg font-bold text-white tracking-tight leading-tight group-hover:text-amber-400 transition-colors">
                Soy Entrenador
              </h3>
              <p className="text-xs text-zinc-500 font-medium leading-relaxed mt-0.5">
                Gestiona tu grupo de atletas con análisis IA
              </p>
              <div className="flex items-center gap-2 mt-2">
                <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-[9px] text-amber-400 font-bold border border-amber-500/20">
                  Reportes IA
                </span>
                <span className="px-2 py-0.5 rounded-full bg-purple-500/10 text-[9px] text-purple-400 font-bold border border-purple-500/20">
                  Leaderboard
                </span>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-zinc-600 group-hover:text-amber-400 group-hover:translate-x-1 transition-all shrink-0 ml-auto relative" />
          </motion.button>
        </div>

        {/* Feature badges */}
        <div className="flex justify-center gap-3 pt-1">
          {FEATURES.map((feat, i) => (
            <motion.div
              key={feat.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 + i * 0.1 }}
              className="flex items-center gap-1.5 text-[10px] text-zinc-600 font-medium"
            >
              <feat.icon className={`w-3 h-3 ${feat.color}`} />
              {feat.label}
            </motion.div>
          ))}
        </div>

        {/* Social proof */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
          className="flex items-center justify-center gap-3 pt-2 border-t border-zinc-800"
        >
          <div className="flex items-center gap-1">
            <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
            <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
            <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
            <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
            <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
          </div>
          <span className="text-[10px] text-zinc-600 font-medium">Usado por atletas y clubs de toda España</span>
        </motion.div>
      </div>
    </AuthLayout>
  );
}