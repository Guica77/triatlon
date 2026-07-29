'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users, Activity, AlertTriangle, MessageSquare,
  Trash2, UserPlus, Search, Settings,
  LogOut, Zap, UserCheck, Heart,
} from 'lucide-react'
import { LeaderboardCard } from '@/components/coach/leaderboard-card'
import { GroupTabContent } from '@/components/coach/group-tab-content'
import { assignPlanToAthlete, removeAthlete, AthleteRosterItem } from './actions'
import { AthleteRosterCard } from '@/components/coach/athlete-roster-card'
import { CoachGroupsManager } from '@/components/coach/coach-groups-manager'

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Buenos días'
  if (hour < 19) return 'Buenas tardes'
  return 'Buenas noches'
}

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
  React.useEffect(() => { setRoster(initialRoster) }, [initialRoster])
  const [searchQuery, setSearchQuery] = React.useState('')
  const [selectedGroupId, setSelectedGroupId] = React.useState<string | 'all'>('all')
  const [isGroupManagerOpen, setIsGroupManagerOpen] = React.useState(false)
  const [inviteCode, setInviteCode] = React.useState(initialInviteCode || '')
  const [inviteLoading, setInviteLoading] = React.useState(false)
  const [inviteMessage, setInviteMessage] = React.useState<{ text: string; type: 'success' | 'error' } | null>(null)
  const [assigningId, setAssigningId] = React.useState<string | null>(null)
  const [removingId, setRemovingId] = React.useState<string | null>(null)

  const filteredRoster = roster.filter(item => {
    const name = `${item.first_name || ''} ${item.last_name || ''}`.toLowerCase()
    const email = (item.email || '').toLowerCase()
    const query = searchQuery.toLowerCase()
    return (name.includes(query) || email.includes(query)) &&
      (selectedGroupId === 'all' || item.group_id === selectedGroupId)
  })

  const totalAthletes = roster.length
  const activeAlerts = roster.filter(item => item.alerts.low_hrv || item.alerts.high_tss || item.alerts.high_fatigue).length
  const activeToday = roster.filter(item => item.today_workout && item.today_workout.sport_type !== 'descanso')
  const completedToday = activeToday.filter(item => item.today_workout?.status === 'completed')
  const completionRate = activeToday.length > 0 ? Math.round((completedToday.length / activeToday.length) * 100) : 100

  // Weekly TSS (sum across all athletes)
  const weeklyTSS = roster.reduce((sum, a) => sum + (a.weekly_stats?.actual_tss || 0), 0)
  // Average readiness
  const avgReadiness = roster.length > 0
    ? Math.round(roster.reduce((sum, a) => sum + (a.today_biometrics?.readiness_score || 75), 0) / roster.length)
    : 0

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
        const textArea = document.createElement("textarea")
        textArea.value = inviteUrl
        document.body.appendChild(textArea)
        textArea.focus()
        textArea.select()
        document.execCommand('copy')
        document.body.removeChild(textArea)
        setInviteMessage({ text: '¡Enlace Mágico copiado!', type: 'success' })
      }
      setTimeout(() => setInviteMessage(null), 4000)
    } catch { setInviteMessage({ text: 'Error al copiar', type: 'error' })
    } finally { setInviteLoading(false) }
  }

  const handleGenerateCode = async () => {
    setInviteLoading(true)
    setInviteMessage(null)
    try {
      const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase()
      const newCode = `TR-${randomPart}`
      const { updateInviteCode } = await import('./actions')
      const res = await updateInviteCode(newCode)
      if (res.error) setInviteMessage({ text: res.error, type: 'error' })
      else { setInviteCode(newCode); setInviteMessage({ text: 'Código generado', type: 'success' }) }
    } catch { setInviteMessage({ text: 'Error de conexión', type: 'error' })
    } finally { setInviteLoading(false); setTimeout(() => setInviteMessage(null), 4000) }
  }

  const handlePlanSelect = async (athleteId: string, planId: string) => {
    if (!planId) return
    setAssigningId(athleteId)
    try {
      const res = await assignPlanToAthlete(athleteId, planId)
      if (!res.error) setRoster(prev => prev.map(item =>
        item.id === athleteId
          ? { ...item, active_plan_id: planId, active_plan_name: plans.find(p => p.id === planId)?.name || 'Plan Asignado' }
          : item
      ))
      else alert(res.error)
    } catch (err) { console.error(err)
    } finally { setAssigningId(null) }
  }

  const handleRemoveClick = async (athleteId: string) => {
    if (!confirm('¿Eliminar este atleta del roster?')) return
    setRemovingId(athleteId)
    try {
      const res = await removeAthlete(athleteId)
      if (!res.error) setRoster(prev => prev.filter(item => item.id !== athleteId))
      else alert(res.error)
    } catch { } finally { setRemovingId(null) }
  }

  return (
    <div className="min-h-screen bg-surface-app text-text-primary w-full overflow-x-hidden">
      <main className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-12">

        {/* ── Header: greeting with contrast fix ── */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-coral-500 flex items-center justify-center text-white font-black text-lg shadow-button shrink-0">
              {coachName.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-text-primary tracking-tight">
                {getGreeting()}, {coachName.split(' ')[0]}
              </h1>
              <p className="text-sm text-text-secondary">Panel de control de tu grupo de atletas</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a href="/admin" className="text-xs font-semibold text-text-muted hover:text-coral-500 transition-colors px-3 py-1.5 rounded-lg border border-border-default hover:border-coral-500/30">
              Business
            </a>
            <form action="/auth/signout" method="post">
              <button type="submit" className="w-9 h-9 flex items-center justify-center rounded-lg text-text-muted hover:text-run hover:bg-run/10 border border-transparent hover:border-run/20 transition-all cursor-pointer">
                <LogOut className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>

        {/* ── Stats row: Bento cards with consistent typography ── */}
        <section className="grid grid-cols-[repeat(auto-fit,minmax(250px,1fr))] gap-4 mb-8">
          {/* Atletas en Grupo */}
          <div className="bg-surface-card rounded-xl p-5 flex items-center gap-4 shadow-card transition-shadow hover:shadow-card-hover">
            <div className="w-12 h-12 rounded-lg bg-coral-500/15 flex items-center justify-center shrink-0">
              <Users className="w-5 h-5 text-coral-500" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Atletas en Grupo</p>
              <p className="text-3xl font-black text-text-primary mt-0.5">{totalAthletes}</p>
              <p className="text-[10px] text-text-muted">{selectedGroupId === 'all' ? 'En todos los grupos' : 'En este grupo'}</p>
            </div>
          </div>

          {/* Sesiones Ejecutadas */}
          <div className="bg-surface-card rounded-xl p-5 flex items-center gap-4 shadow-card transition-shadow hover:shadow-card-hover">
            <div className="w-12 h-12 rounded-lg bg-bike/15 flex items-center justify-center shrink-0">
              <Activity className="w-5 h-5 text-bike" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Sesiones Ejecutadas</p>
              <p className="text-3xl font-black text-text-primary mt-0.5">{completionRate}%</p>
              <p className="text-[10px] text-text-muted">{completedToday.length} de {activeToday.length} atletas</p>
            </div>
          </div>

          {/* TSS Semanal */}
          <div className="bg-surface-card rounded-xl p-5 flex items-center gap-4 shadow-card transition-shadow hover:shadow-card-hover">
            <div className="w-12 h-12 rounded-lg bg-swim/15 flex items-center justify-center shrink-0">
              <Zap className="w-5 h-5 text-swim" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted">TSS Semanal</p>
              <p className="text-3xl font-black text-text-primary mt-0.5">{weeklyTSS}</p>
              <p className="text-[10px] text-text-muted">Total del grupo</p>
            </div>
          </div>

          {/* Readiness */}
          <div className="bg-surface-card rounded-xl p-5 flex items-center gap-4 shadow-card transition-shadow hover:shadow-card-hover">
            <div className="w-12 h-12 rounded-lg bg-run/15 flex items-center justify-center shrink-0">
              <Heart className="w-5 h-5 text-run" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Readiness Medio</p>
              <p className="text-3xl font-black text-text-primary mt-0.5">{avgReadiness}%</p>
              <p className="text-[10px] text-text-muted">{activeAlerts > 0 ? `${activeAlerts} alertas` : 'Sin alertas'}</p>
            </div>
          </div>

          {/* Señales de Fatiga */}
          <div className="bg-surface-card rounded-xl p-5 flex items-center gap-4 shadow-card transition-shadow hover:shadow-card-hover">
            <div className="w-12 h-12 rounded-lg bg-warning/15 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5 text-warning" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Señales de Fatiga</p>
              <p className="text-3xl font-black text-text-primary mt-0.5">{activeAlerts}</p>
              <p className="text-[10px] text-text-muted">{activeAlerts > 0 ? 'Requieren atención' : 'Todo en orden'}</p>
            </div>
          </div>
        </section>

        {/* ── Filters ── */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => setSelectedGroupId('all')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all border ${
                selectedGroupId === 'all'
                  ? 'bg-surface-card border-border-default text-text-primary shadow-card'
                  : 'border-border-default/50 text-text-muted hover:text-text-secondary hover:bg-surface-hover'
              }`}
            >
              Todos
            </button>
            {groups.map(g => (
              <button
                key={g.id}
                onClick={() => setSelectedGroupId(g.id)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all border ${
                  selectedGroupId === g.id
                    ? 'bg-surface-card border-border-default text-text-primary shadow-card'
                    : 'border-border-default/50 text-text-muted hover:text-text-secondary hover:bg-surface-hover'
                }`}
              >
                {g.name}
              </button>
            ))}
            <button
              onClick={() => setIsGroupManagerOpen(true)}
              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap border border-border-default/50 text-text-muted hover:text-text-secondary hover:bg-surface-hover flex items-center gap-1.5 transition-all"
            >
              <Settings className="w-3 h-3" />
              Grupos
            </button>
          </div>

          <div className="relative w-full md:w-72 shrink-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Buscar por nombre o correo..."
              className="w-full pl-9 pr-4 py-2 bg-surface-hover border border-border-default rounded-lg text-sm text-text-primary placeholder:text-text-muted outline-none focus:border-coral-500/40 transition-colors"
            />
          </div>
        </div>

        {/* ── Main content: responsive grid ── */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          {selectedGroupId !== 'all' ? (
            <section className="mt-4">
              <GroupTabContent groupId={selectedGroupId} />
            </section>
          ) : (
            <section className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-5">
              {/* Roster cards */}
              <div className="contents">
                <AnimatePresence mode="popLayout">
                  {filteredRoster.length === 0 ? (
                    <div className="col-span-full py-12 text-center bg-surface-card rounded-xl border border-dashed border-border-default flex flex-col items-center gap-3">
                      <div className="w-14 h-14 rounded-xl bg-surface-hover flex items-center justify-center">
                        <Users className="w-7 h-7 text-text-muted" />
                      </div>
                      <div>
                        <p className="text-text-secondary text-sm font-bold">
                          {searchQuery ? 'No hay resultados' : 'Tu grupo está vacío'}
                        </p>
                        <p className="text-text-muted text-xs mt-1 max-w-xs">
                          {searchQuery ? 'Prueba con otro nombre o correo' : 'Invita a tu primer atleta con el código →'}
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

              {/* Invite + Leaderboard sidebar — flows into responsive grid */}
              <div className="space-y-5">
                {/* Vincular Atleta */}
                <div className="bg-surface-card rounded-xl p-5 shadow-card space-y-4">
                  <div className="flex items-center gap-2">
                    <UserPlus className="w-4 h-4 text-coral-500 shrink-0" />
                    <h3 className="text-sm font-bold text-text-primary">Vincular Atleta</h3>
                  </div>
                  <p className="text-xs text-text-muted leading-relaxed">
                    Pide a tus atletas que introduzcan este código al registrarse, o envíales el enlace mágico.
                  </p>
                  <div className="bg-surface-hover border border-border-subtle rounded-lg p-4 text-center">
                    <p className="text-[9px] text-text-muted mb-1.5 uppercase tracking-widest font-bold">Tu Código</p>
                    <p className="text-xl font-black tracking-widest text-coral-500">
                      {inviteCode || <span className="text-text-muted text-sm">No configurado</span>}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleGenerateCode}
                      disabled={inviteLoading}
                      className="px-3 py-2 text-xs font-semibold text-text-muted hover:text-text-secondary border border-border-default hover:border-border-default/80 rounded-lg transition-all bg-transparent cursor-pointer disabled:opacity-40"
                    >
                      {inviteCode ? 'Nuevo' : 'Generar'}
                    </button>
                    <button
                      onClick={handleCopyLink}
                      disabled={inviteLoading || !inviteCode}
                      className="flex-1 py-2 rounded-lg text-xs font-bold text-white bg-coral-500 hover:bg-coral-600 shadow-button flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-40"
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      Copiar Enlace
                    </button>
                  </div>
                  <AnimatePresence>
                    {inviteMessage && (
                      <motion.div
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className={`p-2.5 rounded-lg text-xs border ${
                          inviteMessage.type === 'success'
                            ? 'bg-bike/10 text-bike border-bike/20'
                            : 'bg-run/10 text-run border-run/20'
                        }`}
                      >
                        {inviteMessage.text}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* HRV Tips */}
                <div className="bg-surface-card rounded-xl p-5 shadow-card space-y-2">
                  <h4 className="text-xs font-bold text-text-primary">Señales de Fatiga y HRV</h4>
                  <p className="text-[11px] text-text-muted leading-relaxed">
                    El sistema avisa cuando un atleta registra HRV &lt;55ms o Readiness &lt;60%. Úsalo para ajustar entrenamientos y prevenir lesiones.
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
          )}
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
