'use client';

import * as React from 'react';
import { motion, useReducedMotion } from 'framer-motion';

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
  isAthlete?: boolean;
}

export function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  const [mounted, setMounted] = React.useState(false);
  const reduceMotion = useReducedMotion();
  React.useEffect(() => setMounted(true), []);

  return (
    <div className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-x-hidden bg-surface-app px-4 py-6 font-sans selection:bg-accent/30 sm:p-6">
      {/* Thin discipline bars — swim / bike / run */}
      <div className="absolute left-0 right-0 top-0 flex h-[3px]">
        <div className="flex-1 bg-swim/70" />
        <div className="flex-1 bg-bike/70" />
        <div className="flex-1 bg-run/70" />
      </div>

      {mounted && (
        <motion.div
          initial={{ opacity: 0, y: reduceMotion ? 0 : 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduceMotion ? 0.15 : 0.2, ease: 'easeOut' }}
          className="relative z-10 min-w-0 w-full max-w-sm space-y-6"
        >
          {/* Logo */}
          <div className="space-y-4 text-center">
            <div className="flex items-center justify-center gap-2">
              <span className="flex items-center gap-[3px]" aria-hidden="true">
                <span className="h-3.5 w-1.5 rounded-full bg-swim" />
                <span className="h-3.5 w-1.5 rounded-full bg-bike" />
                <span className="h-3.5 w-1.5 rounded-full bg-run" />
              </span>
              <span className="font-display text-2xl font-black leading-none tracking-tight text-text-primary">
                TRIATLON&nbsp;<span className="text-accent">PRO</span>
              </span>
            </div>

            <div className="space-y-1">
              <motion.h1
                initial={{ opacity: 0, y: reduceMotion ? 0 : 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: reduceMotion ? 0.15 : 0.2, ease: 'easeOut' }}
                className="font-display text-2xl font-bold tracking-tight text-text-primary"
              >
                {title}
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: reduceMotion ? 0 : 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: reduceMotion ? 0.15 : 0.2, ease: 'easeOut' }}
                className="text-sm text-text-secondary"
              >
                {subtitle}
              </motion.p>
            </div>
          </div>

          {/* Card */}
          <motion.div
            initial={{ opacity: 0, y: reduceMotion ? 0 : 6, scale: reduceMotion ? 1 : 0.99 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: reduceMotion ? 0.15 : 0.2, ease: 'easeOut' }}
            className="rounded-xl border border-border-default bg-surface-card p-6 sm:p-7"
          >
            {children}
          </motion.div>

          {/* Footer */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: reduceMotion ? 0.15 : 0.2, ease: 'easeOut' }}
            className="text-center text-[10px] tracking-wider text-text-muted"
          >
            Triatlon Pro
          </motion.p>
        </motion.div>
      )}
    </div>
  );
}
