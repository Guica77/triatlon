'use client'

import * as React from 'react'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'

export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const reduceMotion = useReducedMotion()

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        initial={{ opacity: 0, y: reduceMotion ? 0 : 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: reduceMotion ? 0 : -8 }}
        transition={{ duration: reduceMotion ? 0.15 : 0.2, ease: 'easeOut' }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}