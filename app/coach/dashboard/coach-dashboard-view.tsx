'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Users, 
  Trophy, 
  Activity, 
  AlertTriangle, 
  MessageSquare, 
  Trash2, 
  UserPlus, 
  Check, 
  Search, 
  ChevronRight, 
  Settings, 
  LogOut, 
  Clock, 
  Zap, 
  UserCheck,
  Eye
} from 'lucide-react'
import Link from 'next/link'
import { AnimatedButton } from '@/components/ui/animated-button'
import { 
  assignPlanToAthlete, 
  addAthleteByEmail, 
  removeAthlete, 
  AthleteRosterItem 
} from './actions'

interface CoachDashboardViewProps {
  initialRoster: AthleteRosterItem[]
  plans: { id: string; name: string }[]
  coachName: string
}

export function CoachDashboardView({ initialRoster, plans, coachName }: CoachDashboardViewProps) {
  const [roster, setRoster] = React.useState<AthleteRosterItem[]>(initialRoster)
  const [searchQuery, setSearchQuery] = React.useState('')
  const [inviteEmail, setInviteEmail] = React.useState('')
  const [inviteLoading, setInviteLoading] = React.useState(false)
  const [inviteMessage, setInviteMessage] = React.useState<{ text: string; type: 'success' | 'error' } | null>(null)
  
  const [assigningId, setAssigningId] = React.useState<string | null>(null)
  const [removingId, setRemovingId] = React.useState<string | null>(null)

  // Filter roster by name or email
  const filteredRoster = roster.filter(item => {
    const name = `${item.first_name || ''} ${item.last_name || ''}`.toLowerCase()
    const email = (item.email || '').toLowerCase()
    const query = searchQuery.toLowerCase()
    return name.includes(query) || email.includes(query)
  })

  // Stats
  const totalAthletes = roster.length
  const activeAlerts = roster.filter(item => item.alerts.low_hrv || item.alerts.high_tss || item.alerts.high_fatigue).length
  
  // Calculate completed today percentage
  const activeToday = roster.filter(item => item.today_workout && item.today_workout.sport_type !== 'descanso')
  const completedToday = activeToday.filter(item => item.today_workout?.status === 'completed')
  const completionRate = activeToday.length > 0 
    ? Math.round((completedToday.length / activeToday.length) * 100) 
    : 100

  // Invite handler
  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inviteEmail.trim()) return

    setInviteLoading(true)
    setInviteMessage(null)

    try {
      const res = await addAthleteByEmail(inviteEmail)
      if (res.error) {
        setInviteMessage({ text: res.error, type: 'error' })
      } else {
        setInviteMessage({ text: 'Atleta añadido correctamente al roster.', type: 'success' })
        setInviteEmail('')
        
        // Refresh local data by calling a full reload/re-fetching roster
        // Simple client-side updates:
        window.location.reload()
      }
    } catch (err) {
      setInviteMessage({ text: 'Error al procesar la invitación', type: 'error' })
    } finally {
      setInviteLoading(false)
    }
  }

  // Plan assignment handler
  const handlePlanSelect = async (athleteId: string, planId: string) => {
    if (!planId) return
    setAssigningId(athleteId)

    try {
      const res = await assignPlanToAthlete(athleteId, planId)
      if (res.error) {
        alert(res.error)
      } else {
        // Update local state
        setRoster(prev => prev.map(item => {
          if (item.id === athleteId) {
            const planName = plans.find(p => p.id === planId)?.name || 'Plan Asignado'
            return {
              ...item,
              active_plan_id: planId,
              active_plan_name: planName
            }
          }
          return item
        }))
      }
    } catch (err) {
      console.error(err)
    } finally {
      setAssigningId(null)
    }
  }

  // Remove handler
  const handleRemoveClick = async (athleteId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar a este atleta de tu roster?')) return
    setRemovingId(athleteId)

    try {
      const res = await removeAthlete(athleteId)
      if (res.error) {
        alert(res.error)
      } else {
        setRoster(prev => prev.filter(item => item.id !== athleteId))
      }
    } catch (err) {
      console.error(err)
    } finally {
      setRemovingId(null)
    }
  }

  return (
    <div className="min-h-screen bg-[var(--color-background)] pb-24 text-zinc-100">
      
      {/* Upper Deck Header */}
      <header className="sticky top-0 z-50 bg-[var(--color-background)]/90 backdrop-blur-md border-b border-[var(--color-border)] shadow-sm">
        <div className="px-6 py-4 flex justify-between items-center border-b border-zinc-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-zinc-800 to-zinc-900 border border-zinc-700/80 flex items-center justify-center shadow-inner shrink-0 group">
              <Trophy className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
            </div>
            <div>
              <h1 className="text-base font-semibold text-zinc-50 tracking-tight">Panel del Entrenador (Roster)</h1>
              <p className="text-xs text-zinc-400 truncate flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse"></span>
                Coach: {coachName} • Plan B2B Premium
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/settings">
              <AnimatedButton variant="ghost" size="icon" className="w-9 h-9 text-zinc-400 hover:text-zinc-100 border border-zinc-800 rounded-xl">
                <Settings className="w-4 h-4" />
              </AnimatedButton>
            </Link>
            <form action="/auth/signout" method="post">
              <AnimatedButton variant="ghost" size="icon" className="w-9 h-9 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl border border-transparent">
                <LogOut className="w-4 h-4" />
              </AnimatedButton>
            </form>
          </div>
        </div>

        {/* Level 2 Navigation Bar */}
        <div className="px-6 py-2.5 bg-zinc-950/60 flex items-center justify-between border-t border-zinc-900/30">
          <div className="flex gap-2 overflow-x-auto scrollbar-none">
            <Link href="/coach/dashboard" className="shrink-0">
              <AnimatedButton variant="ghost" size="sm" className="rounded-full text-xs py-1.5 px-3.5 bg-zinc-900 border border-zinc-800 text-white font-medium shadow-sm">
                Atletas en Roster
              </AnimatedButton>
            </Link>
            <Link href="/coach/chat" className="shrink-0">
              <AnimatedButton variant="ghost" size="sm" className="rounded-full text-xs py-1.5 px-3.5 border border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:text-zinc-200 transition-all flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Mensajería Directa</span>
              </AnimatedButton>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-6xl mx-auto px-6 pt-8 space-y-8">
        
        {/* Bento stats row */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="p-5 rounded-2xl bg-[#18181b] border border-zinc-800 shadow-xl flex items-center gap-4 group"
          >
            <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 group-hover:scale-105 transition-transform">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider">Atletas en Roster</p>
              <h3 className="text-3xl font-black text-white mt-1">{totalAthletes}</h3>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="p-5 rounded-2xl bg-[#18181b] border border-zinc-800 shadow-xl flex items-center gap-4 group"
          >
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider">Completados Hoy</p>
              <h3 className="text-3xl font-black text-white mt-1">{completionRate}%</h3>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="p-5 rounded-2xl bg-[#18181b] border border-zinc-800 shadow-xl flex items-center gap-4 group"
          >
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 group-hover:scale-105 transition-transform">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider">Alertas Activas</p>
              <h3 className="text-3xl font-black text-white mt-1">{activeAlerts}</h3>
            </div>
          </motion.div>
        </section>

        {/* Search and Invite Split */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Roster Search Column */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-3 bg-zinc-900 border border-zinc-850 px-4 py-2.5 rounded-2xl">
              <Search className="w-4 h-4 text-zinc-500 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar atleta por nombre o correo..."
                className="bg-transparent border-none text-zinc-200 outline-none text-sm w-full"
              />
            </div>

            {/* Athlete Grid List */}
            <div className="bg-[#121214] border border-zinc-850 rounded-2xl overflow-hidden shadow-2xl">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="border-b border-zinc-800 bg-zinc-950/40 text-xs font-bold uppercase tracking-widest text-zinc-500">
                      <th className="px-6 py-4">Atleta</th>
                      <th className="px-6 py-4">Plan Activo</th>
                      <th className="px-6 py-4">Hoy</th>
                      <th className="px-6 py-4">Suscripción (TSS)</th>
                      <th className="px-6 py-4 text-right">Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    <AnimatePresence mode="popLayout">
                      {filteredRoster.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-6 py-12 text-center text-zinc-500 text-sm">
                            No se encontraron atletas vinculados.
                          </td>
                        </tr>
                      ) : (
                        <>
                          {filteredRoster.map(item => {
                            const today = item.today_workout;
                            const bio = item.today_biometrics;
                            const weekly = item.weekly_stats;

                            return (
                              <motion.tr 
                                key={item.id}
                                layout
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="border-b border-zinc-800/60 hover:bg-zinc-900/35 transition-colors group/row"
                              >
                                {/* Athlete cell */}
                                <td className="px-6 py-4">
                                  <div className="flex items-center gap-3">
                                    <Link href={`/coach/athlete/${item.id}`} className="group/avatar shrink-0">
                                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-cyan-600 to-indigo-600 border border-zinc-700 flex items-center justify-center font-bold text-xs shadow-inner group-hover/avatar:border-cyan-400 group-hover/avatar:scale-105 transition-all">
                                        {(item.first_name || 'T')[0].toUpperCase()}
                                      </div>
                                    </Link>
                                    <div>
                                      <div className="text-sm font-bold text-white flex items-center gap-1.5">
                                        <Link href={`/coach/athlete/${item.id}`} className="hover:text-cyan-400 hover:underline transition-colors decoration-cyan-400/50">
                                          {item.first_name || 'Triatleta'} {item.last_name || ''}
                                        </Link>
                                        
                                        {/* Alert status dots */}
                                        {(item.alerts.low_hrv || item.alerts.high_fatigue) && (
                                          <span className="w-2 h-2 rounded-full bg-red-500 animate-ping inline-block shadow-sm" title="Alerta Biológica Activada" />
                                        )}
                                      </div>
                                      <span className="text-[10px] text-zinc-500 block truncate max-w-[150px]">{item.email}</span>
                                    </div>
                                  </div>
                                </td>

                                {/* Active Plan Cell */}
                                <td className="px-6 py-4">
                                  <div className="space-y-1.5">
                                    {assigningId === item.id ? (
                                      <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                                        <Clock className="w-3.5 h-3.5 animate-spin" />
                                        <span>Asignando...</span>
                                      </div>
                                    ) : (
                                      <select
                                        value={item.active_plan_id || ''}
                                        onChange={(e) => handlePlanSelect(item.id, e.target.value)}
                                        className="bg-zinc-900 border border-zinc-800 focus:border-cyan-500 rounded-lg px-2.5 py-1.5 text-xs text-zinc-300 outline-none w-full max-w-[170px] cursor-pointer"
                                      >
                                        <option value="">Seleccionar plan...</option>
                                        {plans.map(p => (
                                          <option key={p.id} value={p.id}>
                                            {p.name}
                                          </option>
                                        ))}
                                      </select>
                                    )}
                                    {item.active_plan_name && (
                                      <p className="text-[10px] text-zinc-500 italic max-w-[170px] truncate">
                                        Activo: {item.active_plan_name}
                                      </p>
                                    )}
                                  </div>
                                </td>

                                {/* Today's Workout Cell */}
                                <td className="px-6 py-4">
                                  {today ? (
                                    <div className="space-y-1">
                                      <div className="flex items-center gap-1.5">
                                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase border ${
                                          today.status === 'completed' 
                                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                            : today.status === 'missed'
                                            ? 'bg-red-500/10 text-red-400 border-red-500/20'
                                            : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                        }`}>
                                          {today.sport_type}
                                        </span>
                                      </div>
                                      <span className="text-[10px] text-zinc-400 block truncate max-w-[130px] font-normal leading-normal">
                                        {today.description}
                                      </span>
                                    </div>
                                  ) : (
                                    <span className="text-[10px] text-zinc-650 bg-zinc-900/60 border border-zinc-850 px-2 py-0.5 rounded-full inline-block font-semibold">Descanso</span>
                                  )}
                                </td>

                                {/* Biometrics & Weekly TSS Cell */}
                                <td className="px-6 py-4">
                                  <div className="space-y-1.5">
                                    {/* Readiness/HRV Alert Indicator */}
                                    {bio ? (
                                      <div className="flex items-center gap-1.5">
                                        <span className={`text-[10px] font-bold ${
                                          item.alerts.low_hrv ? 'text-red-400' : 'text-zinc-300'
                                        }`}>
                                          HRV: {bio.hrv || '--'} ms
                                        </span>
                                        <span className={`text-[10px] font-bold ${
                                          item.alerts.low_hrv ? 'text-red-400' : 'text-zinc-300'
                                        }`}>
                                          ({bio.readiness_score || '--'}%)
                                        </span>
                                      </div>
                                    ) : (
                                      <span className="text-[10px] text-zinc-600">Sin biometría hoy</span>
                                    )}

                                    {/* TSS Bar */}
                                    <div className="space-y-1 max-w-[120px]">
                                      <div className="flex justify-between items-center text-[9px]">
                                        <span className="text-zinc-500">TSS: {weekly.actual_tss}</span>
                                        <span className="text-zinc-500">/ {weekly.target_tss}</span>
                                      </div>
                                      <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden">
                                        <div 
                                          className={`h-full rounded-full ${
                                            item.alerts.high_tss ? 'bg-red-500' : 'bg-cyan-500'
                                          }`}
                                          style={{ width: `${Math.min(100, (weekly.actual_tss / (weekly.target_tss || 1)) * 100)}%` }}
                                        />
                                      </div>
                                    </div>
                                  </div>
                                </td>

                                {/* Action Cell */}
                                <td className="px-6 py-4 text-right">
                                  <div className="flex items-center justify-end gap-2">
                                    <Link href={`/coach/athlete/${item.id}`}>
                                      <AnimatedButton 
                                        variant="ghost" 
                                        size="icon" 
                                        className="w-8 h-8 rounded-lg text-cyan-400 hover:text-cyan-300 hover:bg-zinc-800 border border-zinc-850"
                                        title="Ver Dashboard"
                                      >
                                        <Eye className="w-3.5 h-3.5" />
                                      </AnimatedButton>
                                    </Link>

                                    <Link href={`/coach/chat?athlete=${item.id}`}>
                                      <AnimatedButton 
                                        variant="ghost" 
                                        size="icon" 
                                        className="w-8 h-8 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 border border-zinc-850"
                                        title="Abrir Chat"
                                      >
                                        <MessageSquare className="w-3.5 h-3.5" />
                                      </AnimatedButton>
                                    </Link>
                                    
                                    <AnimatedButton
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => handleRemoveClick(item.id)}
                                      disabled={removingId === item.id}
                                      className="w-8 h-8 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-500/10 border border-transparent"
                                      title="Quitar Atleta"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </AnimatedButton>
                                  </div>
                                </td>
                              </motion.tr>
                            )
                          })}
                        </>
                      )}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Add/Invite Athlete Widget */}
          <div className="lg:col-span-1 space-y-6">
            
            <div className="p-6 rounded-2xl bg-[#18181b] border border-zinc-800 shadow-xl space-y-5">
              <div className="flex items-center gap-2 text-cyan-400">
                <UserPlus className="w-5 h-5 shrink-0" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-100">Vincular Atleta</h3>
              </div>

              <p className="text-xs text-zinc-400 leading-relaxed">
                Introduce el correo electrónico del atleta registrado en la plataforma para incorporarlo directamente a tu roster de entrenamiento.
              </p>

              <form onSubmit={handleInviteSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] text-zinc-400 uppercase tracking-wider font-semibold">Correo del Atleta</label>
                  <input
                    type="email"
                    required
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    disabled={inviteLoading}
                    placeholder="atleta@ejemplo.com"
                    className="w-full bg-[#121214] border border-zinc-800 focus:border-cyan-500 rounded-xl p-3 text-xs text-white outline-none transition-colors"
                  />
                </div>

                <AnimatedButton
                  variant="primary"
                  type="submit"
                  disabled={inviteLoading}
                  className="w-full py-3 text-xs font-bold !bg-cyan-500 hover:!bg-cyan-400 !text-black shadow-cyan-500/10 shadow-lg flex items-center justify-center gap-1.5"
                >
                  {inviteLoading ? 'Añadiendo...' : (
                    <>
                      <UserCheck className="w-3.5 h-3.5 text-black" />
                      Añadir Roster
                    </>
                  )}
                </AnimatedButton>
              </form>

              <AnimatePresence>
                {inviteMessage && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className={`p-3.5 rounded-xl border text-xs leading-normal ${
                      inviteMessage.type === 'success'
                        ? 'bg-emerald-500/5 text-emerald-400 border-emerald-500/15'
                        : 'bg-red-500/5 text-red-400 border-red-500/15'
                    }`}
                  >
                    {inviteMessage.text}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Quick Tips Box */}
            <div className="p-6 rounded-2xl bg-zinc-900/30 border border-zinc-850 space-y-3">
              <h4 className="text-xs font-black uppercase text-zinc-400 tracking-wider">Alertas y HRV</h4>
              <p className="text-[11px] text-zinc-500 leading-relaxed">
                El sistema avisa con un punto rojo parpadeante cuando un atleta registra un HRV por debajo de 55ms o un Readiness de Whoop/Oura menor al 60%. Úsalo para ajustar sus entrenamientos en tiempo real y evitar lesiones.
              </p>
            </div>
          </div>
        </section>

      </main>
    </div>
  )
}
