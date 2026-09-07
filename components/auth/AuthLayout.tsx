'use client';

import * as React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import Image from 'next/image';
import { TriWaveXMark } from '@/components/brand/triwavex-mark';

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
    <div className={`relative flex w-full flex-col items-center justify-center overflow-x-hidden bg-surface-app px-4 py-6 font-sans selection:bg-accent/30 sm:p-6 ${lockViewport ? 'fixed inset-0 h-svh min-h-0 overflow-y-hidden overscroll-none' : 'min-h-screen'}`}>
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
            <div className="overflow-hidden rounded-2xl border border-border-default bg-bg-deep shadow-card">
              <Image
                alt="TriWaveX: tres deportes, una ruta clara"
                className="h-24 w-full object-cover object-center sm:h-32"
                height={800}
                priority
                src="/brand/triwavex-simple-visual.svg"
                width={1200}
              />
            </div>
            <div className="flex items-center justify-center gap-2">
              <TriWaveXMark className="h-8 w-8" />
              <span className="font-display text-2xl font-black leading-none tracking-tight text-text-primary">
                TRIWAVE<span className="text-accent">X</span>
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
            TriWaveX
          </motion.p>
        </motion.div>
      )}
    </div>
  );
}
