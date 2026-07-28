'use client'

import { motion } from 'framer-motion'
import { User, Shield, Crown } from 'lucide-react'

interface RecentUser {
  id: string
  email: string
  first_name: string | null
  last_name: string | null
  created_at: string
  role: string | null
  subscription_status: string | null
}

interface RecentUsersTableProps {
  users: RecentUser[]
}

export function RecentUsersTable({ users }: RecentUsersTableProps) {
  const getRoleIcon = (role: string | null) => {
    if (role === 'coach') return <Shield className="w-3.5 h-3.5 text-amber-400" />
    if (role === 'owner') return <Crown className="w-3.5 h-3.5 text-purple-400" />
    return <User className="w-3.5 h-3.5 text-cyan-400" />
  }

  const getRoleLabel = (role: string | null) => {
    if (role === 'coach') return 'Entrenador'
    if (role === 'owner') return 'Admin'
    return 'Atleta'
  }

  const getSubStatusColor = (status: string | null) => {
    if (status === 'premium' || status === 'active') return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
    if (status === 'cancelled' || status === 'inactive') return 'bg-red-500/10 text-red-400 border-red-500/20'
    return 'bg-zinc-800 text-zinc-400 border-zinc-700'
  }

  const getSubStatusLabel = (status: string | null) => {
    if (status === 'premium' || status === 'active') return 'Premium'
    if (status === 'cancelled' || status === 'inactive') return 'Inactivo'
    return 'Free'
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: '2-digit' })
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5"
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-white">Usuarios Recientes</h3>
          <p className="text-[10px] text-zinc-500 font-medium mt-0.5">Últimos 10 registros</p>
        </div>
        <span className="px-2.5 py-1 rounded-full bg-zinc-800 text-[10px] text-zinc-400 font-bold border border-zinc-700">
          {users.length}
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-zinc-800">
              <th className="pb-3 text-[10px] font-bold uppercase tracking-wider text-zinc-500">Usuario</th>
              <th className="pb-3 text-[10px] font-bold uppercase tracking-wider text-zinc-500">Rol</th>
              <th className="pb-3 text-[10px] font-bold uppercase tracking-wider text-zinc-500">Plan</th>
              <th className="pb-3 text-[10px] font-bold uppercase tracking-wider text-zinc-500">Registro</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user, i) => (
              <motion.tr
                key={user.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.05 * i }}
                className="border-b border-zinc-800/50 last:border-0 hover:bg-zinc-800/30 transition-colors"
              >
                <td className="py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-zinc-700 to-zinc-800 flex items-center justify-center text-xs font-bold text-white shrink-0">
                      {(user.first_name?.[0] || user.email?.[0] || '?').toUpperCase()}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">
                        {user.first_name} {user.last_name}
                      </p>
                      <p className="text-[10px] text-zinc-500 truncate max-w-[160px]">{user.email}</p>
                    </div>
                  </div>
                </td>
                <td className="py-3">
                  <div className="flex items-center gap-1.5">
                    {getRoleIcon(user.role)}
                    <span className="text-xs text-zinc-300 font-medium">{getRoleLabel(user.role)}</span>
                  </div>
                </td>
                <td className="py-3">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getSubStatusColor(user.subscription_status)}`}>
                    {getSubStatusLabel(user.subscription_status)}
                  </span>
                </td>
                <td className="py-3">
                  <span className="text-xs text-zinc-400 font-medium">{formatDate(user.created_at)}</span>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  )
}