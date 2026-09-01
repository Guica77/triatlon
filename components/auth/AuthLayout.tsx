'use client';

import * as React from 'react';
import { motion } from 'framer-motion';

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
  isAthlete?: boolean;
}

export function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center p-6 overflow-hidden font-sans bg-surface-app selection:bg-accent/30">
      {/* Thin discipline bars — swim / bike / run */}
      <div className="absolute top-0 left-0 right-0 flex h-[3px]">
        <div className="flex-1 bg-swim/70" />
        <div className="flex-1 bg-bike/70" />
        <div className="flex-1 bg-run/70" />
      </div>

      {mounted && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="relative w-full max-w-sm space-y-6 z-10"
        >
          {/* Logo */}
          <div className="text-center space-y-4">
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.4 }}
              className="flex items-center justify-center gap-2"
            >
              <span className="flex items-center gap-[3px]" aria-hidden="true">
                <span className="w-1.5 h-3.5 rounded-full bg-swim" />
                <span className="w-1.5 h-3.5 rounded-full bg-bike" />
                <span className="w-1.5 h-3.5 rounded-full bg-run" />
              </span>
              <span className="font-display text-2xl font-black tracking-tight text-text-primary leading-none">
                TRIATLON&nbsp;<span className="text-accent">PRO</span>
              </span>
            </motion.div>

            <div className="space-y-1">
              <motion.h1
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.4 }}
                className="font-display text-2xl font-bold tracking-tight text-text-primary"
              >
                {title}
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.4 }}
                className="text-sm text-text-secondary"
              >
                {subtitle}
              </motion.p>
            </div>
          </div>

          {/* Card */}
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.99 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.35, duration: 0.4, ease: 'easeOut' }}
            className="p-6 sm:p-7 rounded-xl bg-surface-card border border-border-default"
          >
            {children}
          </motion.div>

          {/* Footer */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.4 }}
            className="text-center text-[10px] text-text-muted tracking-wider"
          >
            Triatlon Pro
          </motion.p>
        </motion.div>
      )}
    </div>
  );
}
