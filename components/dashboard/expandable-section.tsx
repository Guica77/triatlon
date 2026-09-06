'use client'

import * as React from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { ChevronDown, Sparkles } from 'lucide-react'

const EASE_OUT = [0.23, 1, 0.32, 1] as const

interface ExpandableSectionProps {
  title?: string
  icon?: React.ComponentType<{ className?: string }>
  children: React.ReactNode
}

export function ExpandableSection({
  title = 'Más información',
  icon: Icon = Sparkles,
  children,
}: ExpandableSectionProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const sectionRef = React.useRef<HTMLDivElement>(null)
  const reduceMotion = useReducedMotion()
  const motionEnabled = reduceMotion !== true

  const handleToggle = () => {
    const next = !isOpen
    setIsOpen(next)
    // Reveal expanded content without forcing motion-sensitive users through a smooth scroll.
    if (next && sectionRef.current) {
      setTimeout(() => {
        sectionRef.current?.scrollIntoView({
          behavior: reduceMotion ? 'auto' : 'smooth',
          block: 'start',
        })
      }, reduceMotion ? 0 : 150)
    }
  }

  return (
    <div ref={sectionRef} className="scroll-mt-20">
      {/* Toggle button */}
      <button
        onClick={handleToggle}
        className="flex min-h-11 w-full cursor-pointer items-center justify-center gap-2 py-3 text-xs font-bold text-text-muted transition-[color] duration-150 ease-out hover:text-text-secondary focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg-app"
      >
        <Icon className="w-4 h-4" aria-hidden="true" />
        {isOpen ? 'Ocultar secciones' : title}
        <motion.span
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={motionEnabled ? { duration: 0.2, ease: EASE_OUT } : { duration: 0 }}
          aria-hidden="true"
        >
          <ChevronDown className="w-4 h-4" />
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={motionEnabled ? { duration: 0.25, ease: EASE_OUT } : { duration: 0 }}
            className="overflow-hidden"
          >
            <div className="space-y-6 pt-2 pb-4">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
