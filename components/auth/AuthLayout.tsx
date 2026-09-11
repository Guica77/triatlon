'use client';

import * as React from 'react';
import { motion, useReducedMotion } from 'framer-motion';

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
  isAthlete?: boolean;
  lockViewport?: boolean;
}

export function AuthLayout({ children, title, subtitle, lockViewport = false }: AuthLayoutProps) {
  const [mounted, setMounted] = React.useState(false);
  const reduceMotion = useReducedMotion();
  React.useEffect(() => setMounted(true), []);

  React.useEffect(() => {
    if (!lockViewport) return;

    const previousBodyOverflow = document.body.style.overflow;
    const previousBodyOverscroll = document.body.style.overscrollBehavior;
    const previousHtmlOverflow = document.documentElement.style.overflow;
    const previousHtmlOverscroll = document.documentElement.style.overscrollBehavior;

    document.body.style.overflow = 'hidden';
    document.body.style.overscrollBehavior = 'none';
    document.documentElement.style.overflow = 'hidden';
    document.documentElement.style.overscrollBehavior = 'none';

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.body.style.overscrollBehavior = previousBodyOverscroll;
      document.documentElement.style.overflow = previousHtmlOverflow;
      document.documentElement.style.overscrollBehavior = previousHtmlOverscroll;
    };
  }, [lockViewport]);

  return (
    <div className={`relative flex w-full flex-col items-center justify-center overflow-x-hidden bg-bg-deep px-4 py-6 font-sans selection:bg-accent/30 sm:p-8 ${lockViewport ? 'fixed inset-0 h-svh min-h-0 overflow-y-auto overscroll-none' : 'min-h-screen'}`}>
      {mounted && (
        <motion.div
          initial={{ opacity: 0, y: reduceMotion ? 0 : 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduceMotion ? 0.15 : 0.2, ease: 'easeOut' }}
          className="relative z-10 min-w-0 w-full max-w-md space-y-6"
        >
          {/* Logo */}
          <div className="space-y-3 text-center">
            <p className="text-sm font-semibold text-text-primary/90">Bienvenido</p>
            <p className="font-display text-xl font-semibold tracking-tight text-text-primary">TriWaveX</p>

            <div className="space-y-1.5">
              <motion.h1
                initial={{ opacity: 0, y: reduceMotion ? 0 : 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: reduceMotion ? 0.15 : 0.2, ease: 'easeOut' }}
                className="text-4xl font-bold tracking-[-0.055em] text-text-primary sm:text-[42px]"
              >
                {title}
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: reduceMotion ? 0 : 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: reduceMotion ? 0.15 : 0.2, ease: 'easeOut' }}
                className="text-base text-text-secondary"
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
            className="rounded-2xl border border-border-card bg-surface-card p-5 shadow-card sm:p-7"
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
            TriWaveX
          </motion.p>
        </motion.div>
      )}
    </div>
  );
}
