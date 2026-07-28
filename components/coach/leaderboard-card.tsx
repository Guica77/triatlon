'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import { Trophy, Medal, TrendingUp, Crown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LeaderboardEntry {
  id: string
  name: string
  avatar?: string
  totalTss: number
  compliance: number
  workoutsCompleted: number
}

interface LeaderboardCardProps {
  entries: LeaderboardEntry[]
}

export function LeaderboardCard({ entries }: LeaderboardCardProps) {
  const sorted = [...entries].sort((a, b) => b.totalTss - a.totalTss)

  const getMedalColor = (index: number) => {
    if (index === 0) return 'text-amber-400 bg-amber-500/10 border-amber-500/20'
    if (index === 1) return 'text-zinc-300 bg-zinc-500/10 border-zinc-500/20'
    if (index === 2) return 'text-amber-600 bg-amber-700/10 border-amber-700/20'
    return 'text-zinc-500 bg-zinc-800/50 border-zinc-700/50'
  }

  return (
    <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/20 flex items-center justify-center">
          <Trophy className="w-4 h-4 text-amber-400" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-white">Leaderboard Semanal</h3>
          <p className="text-[10px] text-zinc-500 font-medium">Ranking por volumen de entrenamiento</p>
        </div>
      </div>

      {sorted.length === 0 ? (
        <div className="text-center py-6">
          <Trophy className="w-8 h-8 text-zinc-700 mx-auto mb-2" />
          <p className="text-xs text-zinc-500 font-medium">Aún no hay datos esta semana</p>
        </div>
      ) : (
        <div className="space-y-2">
          {sorted.slice(0, 10).map((entry, i) => (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className={cn(
                'flex items-center gap-3 p-2.5 rounded-xl border transition-all',
                getMedalColor(i)
              )}
            >
              {/* Position */}
              <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 border">
                {i < 3 ? (
                  <Medal className="w-3.5 h-3.5" />
                ) : (
                  <span className="text-xs font-bold">{i + 1}</span>
                )}
              </div>

              {/* Avatar */}
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-zinc-600 to-zinc-700 flex items-center justify-center text-xs font-bold text-white shrink-0">
                {entry.name.charAt(0).toUpperCase()}
              </div>

              {/* Name + Stats */}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-white truncate">{entry.name}</p>
                <p className="text-[10px] text-zinc-500 font-medium">
                  {entry.workoutsCompleted} sesiones · {entry.compliance}% adherencia
                </p>
              </div>

              {/* TSS */}
              <div className="text-right shrink-0">
                <p className="text-sm font-black text-white">{entry.totalTss}</p>
                <p className="text-[9px] text-zinc-500 font-bold uppercase">TSS</p>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}