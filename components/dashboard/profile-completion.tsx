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
      className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500/20 to-cyan-600/10 border border-cyan-500/20 flex items-center justify-center">
            <User className="w-4 h-4 text-cyan-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Tu Perfil</h3>
            <p className="text-[10px] text-zinc-500 font-medium">{completed}/{total} completados</p>
          </div>
        </div>
        <span className="text-2xl font-black text-cyan-400">{percent}%</span>
      </div>

      {/* Progress bar */}
      <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden mb-4">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="h-full bg-gradient-to-r from-cyan-500 to-cyan-400 rounded-full"
        />
      </div>

      {/* Incomplete items */}
      {incomplete.length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Completar:</p>
          {incomplete.slice(0, 3).map(item => (
            <Link
              key={item.id}
              href={item.href}
              className="flex items-center gap-2 p-2 rounded-lg bg-zinc-800/50 border border-zinc-700/50 hover:border-cyan-500/30 transition-colors group"
            >
              <div className="w-5 h-5 rounded-full border border-zinc-600 flex items-center justify-center shrink-0">
                <Check className="w-3 h-3 text-zinc-600" />
              </div>
              <span className="text-xs text-zinc-400 font-medium group-hover:text-white transition-colors flex-1">
                {item.label}
              </span>
              <ArrowRight className="w-3 h-3 text-zinc-600 group-hover:text-cyan-400 transition-colors" />
            </Link>
          ))}
        </div>
      )}
    </motion.div>
  )
}