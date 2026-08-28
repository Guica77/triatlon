'use client'

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
    if (role === 'coach') return <Shield className="w-3.5 h-3.5 text-bike" />
    if (role === 'owner') return <Crown className="w-3.5 h-3.5 text-coral-500" />
    return <User className="w-3.5 h-3.5 text-swim" />
  }

  const getRoleLabel = (role: string | null) => {
    if (role === 'coach') return 'Entrenador'
    if (role === 'owner') return 'Admin'
    return 'Atleta'
  }

  const getSubStatusColor = (status: string | null) => {
    if (status === 'premium' || status === 'active') return 'bg-bike/10 text-bike border-bike/20'
    if (status === 'cancelled' || status === 'inactive') return 'bg-run/10 text-run border-run/20'
    return 'bg-surface-hover text-text-muted border-border-default'
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
    <div className="overflow-x-auto">
      <table className="w-full text-left min-w-[500px]">
        <thead>
          <tr className="border-b border-border-subtle">
            <th className="pb-3 text-[10px] font-bold uppercase tracking-wider text-text-muted">Usuario</th>
            <th className="pb-3 text-[10px] font-bold uppercase tracking-wider text-text-muted">Rol</th>
            <th className="pb-3 text-[10px] font-bold uppercase tracking-wider text-text-muted">Plan</th>
            <th className="pb-3 text-[10px] font-bold uppercase tracking-wider text-text-muted">Registro</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id} className="border-b border-border-subtle/50 last:border-0 hover:bg-surface-hover transition-colors">
              <td className="py-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-surface-hover flex items-center justify-center text-xs font-bold text-coral-500 shrink-0 border border-border-subtle">
                    {(user.first_name?.[0] || user.email?.[0] || '?').toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-text-primary truncate">{user.first_name} {user.last_name}</p>
                    <p className="text-[10px] text-text-muted truncate max-w-[160px]">{user.email}</p>
                  </div>
                </div>
              </td>
              <td className="py-3">
                <div className="flex items-center gap-1.5">
                  {getRoleIcon(user.role)}
                  <span className="text-xs text-text-secondary font-medium">{getRoleLabel(user.role)}</span>
                </div>
              </td>
              <td className="py-3">
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold border whitespace-nowrap ${getSubStatusColor(user.subscription_status)}`}>
                  {getSubStatusLabel(user.subscription_status)}
                </span>
              </td>
              <td className="py-3">
                <span className="text-xs text-text-muted font-medium whitespace-nowrap">{formatDate(user.created_at)}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
