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
    <div className="relative min-h-screen flex flex-col items-center justify-center p-6 overflow-hidden font-sans bg-bg-app">
      {/* Subtle ambient light from the bottom */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[80%] h-[40%] bg-gradient-to-t from-sport-swim/[0.04] to-transparent pointer-events-none" />

      {/* Three thin sport-color bars at the top — the triathlon signature */}
      <div className="absolute top-0 left-0 right-0 flex h-1">
        <div className="flex-1 bg-sport-swim/60" />
        <div className="flex-1 bg-sport-bike/60" />
        <div className="flex-1 bg-sport-run/60" />
      </div>

      {mounted && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="relative w-full max-w-md space-y-6 z-10"
        >
          {/* Header */}
          <div className="text-center space-y-5">
            {/* Logo mark — simple wordmark "T3" for Triatlon */}
            <div className="inline-flex items-center justify-center">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.15, duration: 0.4, ease: 'easeOut' }}
                className="relative"
              >
                <span className="text-3xl font-extrabold tracking-tighter text-text-primary select-none">
                  <span className="text-sport-swim">T</span>
                  <span className="text-sport-bike">3</span>
                </span>
                <span className="absolute -top-1 -right-3 text-[8px] font-bold text-text-muted tracking-widest">
                  PRO
                </span>
              </motion.div>
            </div>

            <div className="space-y-1.5">
              <motion.h1
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25, duration: 0.4 }}
                className="text-2xl md:text-3xl font-bold tracking-tight text-text-primary"
              >
                {title}
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35, duration: 0.4 }}
                className="text-sm text-text-secondary font-medium"
              >
                {subtitle}
              </motion.p>
            </div>
          </div>

          {/* Card */}
          <motion.div
            initial={{ opacity: 0, y: 15, scale: 0.99 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.4, duration: 0.4, ease: 'easeOut' }}
            className="p-6 sm:p-8 rounded-2xl bg-bg-card border border-border-subtle relative overflow-hidden"
          >
            {children}
          </motion.div>

          {/* Footer */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.4 }}
            className="text-center text-[10px] text-text-muted font-medium tracking-wider"
          >
            Triatlon Pro
          </motion.p>
        </motion.div>
      )}
    </div>
  );
}
