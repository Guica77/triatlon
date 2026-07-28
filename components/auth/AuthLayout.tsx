'use client';

import * as React from 'react';
import { motion } from 'framer-motion';

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
  isAthlete?: boolean;
}

export function AuthLayout({ children, title, subtitle, isAthlete = false }: AuthLayoutProps) {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center p-6 overflow-hidden font-sans bg-zinc-950">
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950" />

      {/* Tri-color gradient blobs */}
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-gradient-to-br from-blue-500/10 to-blue-600/5 blur-[120px] animate-pulse" style={{ animationDuration: '8s' }} />
      <div className="absolute bottom-[-15%] right-[-5%] w-[50%] h-[50%] rounded-full bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 blur-[120px] animate-pulse" style={{ animationDuration: '10s', animationDelay: '1s' }} />
      <div className="absolute top-[40%] right-[20%] w-[30%] h-[30%] rounded-full bg-gradient-to-br from-rose-500/8 to-rose-600/5 blur-[100px] animate-pulse" style={{ animationDuration: '6s', animationDelay: '0.5s' }} />

      {/* Grid overlay */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
        backgroundSize: '60px 60px',
      }} />

      {mounted && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="relative w-full max-w-md space-y-6 z-10"
        >
          {/* Header */}
          <div className="text-center space-y-4">
            <div className="inline-flex items-center justify-center">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 to-amber-500/20 rounded-2xl blur-xl" />
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.2, duration: 0.5, ease: 'easeOut' }}
                  className="relative p-3 rounded-2xl bg-gradient-to-br from-zinc-800 to-zinc-900 border border-zinc-700 shadow-2xl"
                >
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-cyan-400" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2L2 7l10 5 10-5-10-5z" />
                    <path d="M2 17l10 5 10-5" />
                    <path d="M2 12l10 5 10-5" />
                  </svg>
                </motion.div>
              </div>
            </div>
            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.4 }}
              className="text-2xl md:text-3xl font-bold tracking-tight text-white"
            >
              {title}
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.4 }}
              className="text-sm text-zinc-400 font-medium"
            >
              {subtitle}
            </motion.p>
          </div>

          {/* Card */}
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.5, duration: 0.5, ease: 'easeOut' }}
            className="p-6 sm:p-8 rounded-2xl bg-gradient-to-b from-zinc-900 to-zinc-900/95 border border-zinc-800 shadow-2xl relative overflow-hidden"
          >
            {/* Subtle top border accent */}
            <div className="absolute top-0 left-8 right-8 h-[1px] bg-gradient-to-r from-transparent via-cyan-500/40 to-transparent" />
            {children}
          </motion.div>

          {/* Footer */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.4 }}
            className="text-center text-[10px] text-zinc-600 font-medium tracking-wider"
          >
            Powered by <span className="text-zinc-400">TriatlonPro AI</span>
          </motion.p>
        </motion.div>
      )}
    </div>
  );
}