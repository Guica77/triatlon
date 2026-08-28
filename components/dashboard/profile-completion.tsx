'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import { User, Check, ArrowRight } from 'lucide-react'
import Link from 'next/link'

interface ProfileCompletionProps {
  profile: {
    first_name?: string | null
    last_name?: string | null
    email?: string | null
    current_ftp?: number | null
    current_swim_pace?: string | null
    current_run_pace?: string | null
    current_weight?: number | null
    sweat_rate?: number | null
    active_plan_id?: string | null
    coach_id?: string | null
    preferred_ingredients?: string[] | null
  }
}

interface ProfileItem {
  id: string
  label: string
  done: boolean
  href: string
}

export function ProfileCompletion({ profile }: ProfileCompletionProps) {
  const items: ProfileItem[] = [
    {
      id: 'name',
      label: 'Nombre y apellidos',
      done: Boolean(profile.first_name && profile.last_name),
      href: '/settings',
    },
    {
      id: 'weight',
      label: 'Peso corporal',
      done: Boolean(profile.current_weight),
      href: '/settings',
    },
    {
      id: 'ftp',
      label: 'FTP (Ciclismo)',
      done: Boolean(profile.current_ftp),
      href: '/settings',
    },
    {
      id: 'swim',
      label: 'Ritmo Natación (CSS)',
      done: Boolean(profile.current_swim_pace),
      href: '/settings',
    },
    {
      id: 'run',
      label: 'Ritmo Carrera',
      done: Boolean(profile.current_run_pace),
      href: '/settings',
    },
    {
      id: 'plan',
      label: 'Plan de entrenamiento',
      done: Boolean(profile.active_plan_id),
      href: '/onboarding',
    },
    {
      id: 'coach',
      label: 'Vinculado a entrenador',
      done: Boolean(profile.coach_id),
      href: '/settings',
    },
    {
      id: 'nutrition',
      label: 'Preferencias alimentarias',
      done: Boolean(profile.preferred_ingredients && profile.preferred_ingredients.length > 0),
      href: '/settings',
    },
  ]

  const completed = items.filter(i => i.done).length
  const total = items.length
  const percent = Math.round((completed / total) * 100)
  const incomplete = items.filter(i => !i.done)

  // Don't show if 100% complete
  if (percent === 100) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-surface-card border border-border-subtle rounded-2xl p-5"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-accent/15 border border-accent/20 flex items-center justify-center">
            <User className="w-4 h-4 text-accent" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-text-primary">Tu Perfil</h3>
            <p className="text-[10px] text-text-secondary font-medium">{completed}/{total} completados</p>
          </div>
        </div>
        <span className="text-2xl font-black text-accent">{percent}%</span>
      </div>

      {/* Progress bar */}
      <div className="w-full h-2 bg-surface-hover rounded-full overflow-hidden mb-4">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="h-full bg-accent rounded-full"
        />
      </div>

      {/* Incomplete items */}
      {incomplete.length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] text-text-secondary font-bold uppercase tracking-wider">Completar:</p>
          {incomplete.slice(0, 3).map(item => (
            <Link
              key={item.id}
              href={item.href}
              className="flex items-center gap-2 p-2 rounded-lg bg-surface-hover/50 border border-border-subtle/50 hover:border-accent/30 transition-colors group"
            >
              <div className="w-5 h-5 rounded-full border border-border-default flex items-center justify-center shrink-0">
                <Check className="w-3 h-3 text-text-muted" />
              </div>
              <span className="text-xs text-text-muted font-medium group-hover:text-text-primary transition-colors flex-1">
                {item.label}
              </span>
              <ArrowRight className="w-3 h-3 text-text-muted group-hover:text-accent transition-colors" />
            </Link>
          ))}
        </div>
      )}
    </motion.div>
  )
}