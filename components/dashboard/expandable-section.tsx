'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, Sparkles, Trophy, Heart, MessageSquare, BarChart2 } from 'lucide-react'

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

  const handleToggle = () => {
    const next = !isOpen
    setIsOpen(next)
    // Smooth scroll to reveal the expanded content after it animates in
    if (next && sectionRef.current) {
      setTimeout(() => {
        sectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 150)
    }
  }

  return (
    <div ref={sectionRef} className="scroll-mt-20">
      {/* Toggle button */}
      <button
        onClick={handleToggle}
        className="w-full flex items-center justify-center gap-2 py-3 text-xs font-bold text-text-muted hover:text-text-secondary transition-colors cursor-pointer"
      >
        <Icon className="w-4 h-4" />
        {isOpen ? 'Ocultar secciones' : title}
        <motion.span animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown className="w-4 h-4" />
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="space-y-6 pt-2 pb-4">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
