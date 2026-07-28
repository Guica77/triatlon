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

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Buenos días'
  if (hour < 19) return 'Buenas tardes'
  return 'Buenas noches'
}
import { PageHeader } from '@/components/ui/page-header'
import { LeaderboardCard } from '@/components/coach/leaderboard-card'
import { 
  assignPlanToAthlete, 
  addAthleteByEmail, 
  removeAthlete, 
  AthleteRosterItem
} from './actions'
import { AthleteRosterCard } from '@/components/coach/athlete-roster-card'
import { CoachGroupsManager } from '@/components/coach/coach-groups-manager'

interface CoachDashboardViewProps {
  initialRoster: AthleteRosterItem[]
  plans: { id: string; name: string }[]
  groups: any[]
  coachName: string
  coachId: string
  initialInviteCode?: string | null
}

export function CoachDashboardView({ initialRoster, plans, groups, coachName, coachId, initialInviteCode }: CoachDashboardViewProps) {
  const [roster, setRoster] = React.useState<AthleteRosterItem[]>(initialRoster)
  const [searchQuery, setSearchQuery] = React.useState('')
  const [selectedGroupId, setSelectedGroupId] = React.useState<string | 'all'>('all')
  const [isGroupManagerOpen, setIsGroupManagerOpen] = React.useState(false)
  const [inviteCode, setInviteCode] = React.useState(initialInviteCode || '')
  const [inviteLoading, setInviteLoading] = React.useState(false)
  const [inviteMessage, setInviteMessage] = React.useState<{ text: string; type: 'success' | 'error' } | null>(null)
  
  const [assigningId, setAssigningId] = React.useState<string | null>(null)
  const [removingId, setRemovingId] = React.useState<string | null>(null)

  // Filter roster by name or email AND group
  const filteredRoster = roster.filter(item => {
    const name = `${item.first_name || ''} ${item.last_name || ''}`.toLowerCase()
    const email = (item.email || '').toLowerCase()
    const query = searchQuery.toLowerCase()
    const matchesSearch = name.includes(query) || email.includes(query)
    const matchesGroup = selectedGroupId === 'all' || item.group_id === selectedGroupId
    return matchesSearch && matchesGroup
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

  // Invite handler (Magic Link)
  const handleCopyLink = async () => {
    setInviteLoading(true)
    setInviteMessage(null)

    try {
      const codeToUse = inviteCode || coachId
      const inviteUrl = `${window.location.origin}/invite/${codeToUse}`
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(inviteUrl)
        setInviteMessage({ text: '¡Enlace Mágico copiado!', type: 'success' })
      } else {
        // Fallback for non-secure contexts (like testing on local IP)
        const textArea = document.createElement("textarea");
        textArea.value = inviteUrl;
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        try {
          document.execCommand('copy');
          setInviteMessage({ text: '¡Enlace Mágico copiado!', type: 'success' })
        } catch (err) {
          setInviteMessage({ text: 'No se pudo copiar automáticamente. Por favor, cópialo a mano del recuadro.', type: 'error' })
        }
        document.body.removeChild(textArea);
      }
      
      // Auto hide success message
      setTimeout(() => setInviteMessage(null), 4000)
    } catch (err) {
      setInviteMessage({ text: 'Error al copiar el enlace', type: 'error' })
    } finally {
      setInviteLoading(false)
    }
  }

  const handleGenerateCode = async () => {
    setInviteLoading(true)
    setInviteMessage(null)
    try {
      // Generar código aleatorio tipo: TR-8A2F9B
      const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase()
      const newCode = `TR-${randomPart}`

      const { updateInviteCode } = await import('./actions')
      const res = await updateInviteCode(newCode)
      if (res.error) {
        setInviteMessage({ text: res.error, type: 'error' })
      } else {
        setInviteCode(newCode)
        setInviteMessage({ text: 'Código generado y actualizado con éxito', type: 'success' })
      }
    } catch (err) {
      setInviteMessage({ text: 'Error de conexión', type: 'error' })
    } finally {
      setInviteLoading(false)
      setTimeout(() => setInviteMessage(null), 4000)
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
    <div className="min-h-screen bg-[var(--color-background)] text-zinc-900">

      <main className="max-w-[1400px] mx-auto px-4 sm:px-6 pt-6 pb-8">
        {/* Header with greeting */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center text-white font-black text-lg shadow-lg shadow-amber-500/20">
              {coachName.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl font-black text-zinc-900 tracking-tight">
                {getGreeting()}, {coachName.split(' ')[0]} 👋
              </h1>
              <p className="text-sm text-zinc-500 font-medium">Panel de control de tu grupo de atletas</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a href="/owner" className="px-3 py-2 text-xs font-bold text-zinc-500 hover:text-amber-600 transition-colors rounded-xl border border-zinc-200 hover:border-amber-300">
              🏢 Owner
            </a>
            <form action="/auth/signout" method="post">
              <AnimatedButton variant="ghost" size="icon" className="w-9 h-9 text-zinc-450 hover:text-red-500 hover:bg-red-50 rounded-xl border border-transparent hover:border-red-100">
                <LogOut className="w-4 h-4" />
              </AnimatedButton>
            </form>
          </div>
        </div>
        
        {/* Filters and Search Bar */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 scrollbar-none">
            <button
              onClick={() => setSelectedGroupId('all')}
              className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition ${selectedGroupId === 'all' ? 'bg-zinc-900 text-white shadow-sm' : 'bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-50'}`}
            >
              Todos los Atletas
            </button>
            {groups.map(g => (
              <button
                key={g.id}
                onClick={() => setSelectedGroupId(g.id)}
                className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition ${selectedGroupId === g.id ? 'bg-zinc-900 text-white shadow-sm' : 'bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-50'}`}
              >
                {g.name}
              </button>
            ))}
            
            <button
              onClick={() => setIsGroupManagerOpen(true)}
              className="px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition bg-cyan-50 border border-cyan-200 text-cyan-700 hover:bg-cyan-100 flex items-center gap-1.5"
            >
              <Settings className="w-3.5 h-3.5" />
              Grupos
            </button>
          </div>

          <div className="relative w-full md:w-80 shrink-0">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por nombre o correo..."
              className="w-full pl-9 pr-4 py-2 bg-white border border-zinc-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
            />
          </div>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="space-y-8"
        >
          {/* Bento stats row */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-5 rounded-2xl bg-white border border-zinc-200 shadow-sm flex items-center gap-4 group hover:shadow-md hover:border-cyan-200 transition-all">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-cyan-600 flex items-center justify-center text-white group-hover:scale-105 transition-transform shadow-sm shadow-cyan-500/20">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] text-zinc-450 font-bold uppercase tracking-wider">Atletas en Grupo</p>
                <h3 className="text-3xl font-black text-zinc-900 mt-1">{totalAthletes}</h3>
                <p className="text-[10px] text-zinc-500 font-medium">{selectedGroupId === 'all' ? 'En todos los grupos' : 'En este grupo'}</p>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-zinc-200 shadow-sm flex items-center gap-4 group hover:shadow-md hover:border-emerald-200 transition-all">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-white group-hover:scale-105 transition-transform shadow-sm shadow-emerald-500/20">
                <Activity className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] text-zinc-450 font-bold uppercase tracking-wider">Sesiones Ejecutadas Hoy</p>
                <h3 className="text-3xl font-black text-zinc-900 mt-1">{completionRate}%</h3>
                <p className="text-[10px] text-zinc-500 font-medium">{completedToday.length} de {activeToday.length} atletas</p>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-zinc-200 shadow-sm flex items-center gap-4 group hover:shadow-md hover:border-amber-200 transition-all">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center text-white group-hover:scale-105 transition-transform shadow-sm shadow-amber-500/20">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] text-zinc-450 font-bold uppercase tracking-wider">Señales de Fatiga</p>
                <h3 className="text-3xl font-black text-zinc-900 mt-1">{activeAlerts}</h3>
                <p className="text-[10px] text-zinc-500 font-medium">{activeAlerts > 0 ? 'Requieren atención' : 'Todo en orden'}</p>
              </div>
            </div>
          </section>

          {/* Search and Invite Split */}
          <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Roster Search Column */}
            <div className="lg:col-span-2 space-y-4">
              {/* Athlete Bento Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <AnimatePresence mode="popLayout">
                  {filteredRoster.length === 0 ? (
                    <div className="col-span-full py-12 text-center bg-zinc-50 rounded-2xl border border-dashed border-zinc-300 flex flex-col items-center gap-3">
                      <div className="w-16 h-16 rounded-2xl bg-zinc-100 flex items-center justify-center">
                        <Users className="w-8 h-8 text-zinc-400" />
                      </div>
                      <div>
                        <p className="text-zinc-700 text-sm font-bold">
                          {searchQuery ? 'No hay resultados para tu búsqueda' : 'Tu grupo de atletas está vacío'}
                        </p>
                        <p className="text-zinc-400 text-xs mt-1 max-w-xs">
                          {searchQuery ? 'Intenta con otro nombre o correo electrónico' : 'Invita a tu primer atleta usando el código de invitación o el enlace mágico →'}
                        </p>
                      </div>
                    </div>
                  ) : (
                    filteredRoster.map(item => (
                      <AthleteRosterCard 
                        key={item.id}
                        athlete={item}
                        plans={plans}
                        groups={groups}
                        assigningId={assigningId}
                        removingId={removingId}
                        onAssignPlan={handlePlanSelect}
                        onRemove={handleRemoveClick}
                      />
                    ))
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Add/Invite Athlete Widget */}
            <div className="lg:col-span-1 space-y-6">
              
              <div className="p-6 rounded-2xl bg-white border border-zinc-200 shadow-sm space-y-5">
                <div className="flex items-center gap-2 text-cyan-600">
                  <UserPlus className="w-5 h-5 shrink-0" />
                  <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-800">Vincular Atleta</h3>
                </div>

                <p className="text-xs text-zinc-500 leading-relaxed font-medium">
                  Pide a tus atletas que introduzcan este código cuando se registren, o envíales el enlace mágico para que se vinculen automáticamente.
                </p>

                <div className="space-y-4">
                  <div className="flex flex-col gap-3">
                    <div className="bg-zinc-50 border border-zinc-150 rounded-xl p-4 text-center relative overflow-hidden group">
                      <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/0 via-cyan-500/3 to-cyan-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                      <p className="text-[10px] text-zinc-450 mb-2 uppercase tracking-widest font-bold">Tu Código de Entrenador</p>
                      
                      <div className="text-2xl font-black tracking-widest text-zinc-800">
                        {inviteCode ? (
                          <span className="text-cyan-600">{inviteCode}</span>
                        ) : (
                          <span className="text-zinc-400 text-lg">No configurado</span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <AnimatedButton
                        variant="ghost"
                        onClick={handleGenerateCode}
                        disabled={inviteLoading}
                        className="px-4 py-3 text-xs font-bold text-zinc-650 hover:text-zinc-800 border border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50 rounded-xl transition-all"
                      >
                        {inviteCode ? 'Generar Nuevo' : 'Generar Código'}
                      </AnimatedButton>
                      <AnimatedButton
                        variant="primary"
                        onClick={handleCopyLink}
                        disabled={inviteLoading || !inviteCode}
                        className="flex-1 py-3 text-xs font-bold !bg-cyan-600 hover:!bg-cyan-500 !text-white shadow-md flex items-center justify-center gap-1.5"
                      >
                        <UserCheck className="w-3.5 h-3.5 text-white" />
                        Copiar Enlace
                      </AnimatedButton>
                    </div>
                  </div>
                </div>

                <AnimatePresence>
                  {inviteMessage && (
                    <motion.div
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className={`p-3.5 rounded-xl border text-xs leading-normal ${
                        inviteMessage.type === 'success'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-150'
                          : 'bg-red-50 text-red-700 border-red-150'
                      }`}
                    >
                      {inviteMessage.text}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Quick Tips Box */}
              <div className="p-6 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-3">
                <h4 className="text-xs font-black uppercase text-zinc-450 tracking-wider">Señales de Fatiga y HRV</h4>
                <p className="text-[11px] text-zinc-500 leading-relaxed font-medium">
                  El sistema avisa cuando un atleta registra un HRV por debajo de 55ms o un Readiness menor al 60%. Úsalo para ajustar sus entrenamientos en tiempo real y prevenir lesiones.
                </p>
              </div>

              {/* Leaderboard */}
              <LeaderboardCard
                entries={filteredRoster.map(item => ({
                  id: item.id,
                  name: `${item.first_name || ''} ${item.last_name || ''}`.trim() || item.email || 'Atleta',
                  totalTss: item.weekly_stats?.actual_tss || 0,
                  compliance: item.weekly_stats?.total_workouts
                    ? Math.round((item.weekly_stats.completed_workouts / item.weekly_stats.total_workouts) * 100)
                    : 0,
                  workoutsCompleted: item.weekly_stats?.completed_workouts || 0,
                }))}
              />
            </div>
          </section>
        </motion.div>
      </main>
      
      <CoachGroupsManager 
        isOpen={isGroupManagerOpen}
        onClose={() => setIsGroupManagerOpen(false)}
        groups={groups}
      />
    </div>
  )
}
