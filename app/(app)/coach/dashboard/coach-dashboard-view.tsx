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
import { AthleteRosterCard } from '@/components/coach/athlete-roster-card'

interface CoachDashboardViewProps {
  initialRoster: AthleteRosterItem[]
  plans: { id: string; name: string }[]
  coachName: string
  coachId: string
  initialInviteCode?: string | null
}

export function CoachDashboardView({ initialRoster, plans, coachName, coachId, initialInviteCode }: CoachDashboardViewProps) {
  const [roster, setRoster] = React.useState<AthleteRosterItem[]>(initialRoster)
  const [searchQuery, setSearchQuery] = React.useState('')
  const [inviteCode, setInviteCode] = React.useState(initialInviteCode || '')
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
    <div className="min-h-screen bg-[var(--color-background)] pb-24 text-zinc-900">
      
      {/* Upper Deck Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-zinc-200 shadow-sm transition-all duration-300">
        <div className="px-6 py-4 flex justify-between items-center border-b border-zinc-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-50 border border-cyan-100 flex items-center justify-center shadow-sm shrink-0 group hover:border-cyan-500/40 transition-colors">
              <Trophy className="w-4 h-4 text-cyan-500 group-hover:scale-110 transition-transform duration-300" />
            </div>
            <div>
              <h1 className="text-base font-bold text-zinc-850 truncate tracking-tight">Panel del Entrenador (Roster)</h1>
              <p className="text-xs text-zinc-500 font-semibold truncate flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse shrink-0"></span>
                Coach: {coachName} • Plan B2B Premium
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/settings">
              <AnimatedButton variant="ghost" size="icon" className="w-9 h-9 text-zinc-450 hover:text-zinc-850 hover:bg-zinc-50 border border-zinc-200 rounded-xl">
                <Settings className="w-4 h-4" />
              </AnimatedButton>
            </Link>
            <form action="/auth/signout" method="post">
              <AnimatedButton variant="ghost" size="icon" className="w-9 h-9 text-zinc-450 hover:text-red-500 hover:bg-red-50 rounded-xl border border-transparent hover:border-red-100">
                <LogOut className="w-4 h-4" />
              </AnimatedButton>
            </form>
          </div>
        </div>

        {/* Level 2 Navigation Bar */}
        <div className="px-6 py-2.5 bg-zinc-50/50 flex items-center justify-between border-t border-zinc-100">
          <div className="flex gap-2 overflow-x-auto scrollbar-none">
            <Link href="/coach/dashboard" className="shrink-0">
              <AnimatedButton variant="ghost" size="sm" className="rounded-full text-xs py-1.5 px-3.5 bg-white border border-zinc-200 text-zinc-800 font-bold shadow-sm">
                Atletas en Roster
              </AnimatedButton>
            </Link>
            <Link href="/coach/chat" className="shrink-0">
              <AnimatedButton variant="ghost" size="sm" className="rounded-full text-xs py-1.5 px-3.5 border border-zinc-200 bg-white text-zinc-650 hover:text-zinc-850 hover:bg-zinc-50 transition-all flex items-center gap-1.5">
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
            className="p-5 rounded-2xl bg-white border border-zinc-200 shadow-sm flex items-center gap-4 group"
          >
            <div className="w-12 h-12 rounded-xl bg-cyan-50 border border-cyan-100 flex items-center justify-center text-cyan-500 group-hover:scale-105 transition-transform">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-zinc-450 font-bold uppercase tracking-wider">Atletas en Roster</p>
              <h3 className="text-3xl font-black text-zinc-900 mt-1">{totalAthletes}</h3>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="p-5 rounded-2xl bg-white border border-zinc-200 shadow-sm flex items-center gap-4 group"
          >
            <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 group-hover:scale-105 transition-transform">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-zinc-450 font-bold uppercase tracking-wider">Completados Hoy</p>
              <h3 className="text-3xl font-black text-zinc-900 mt-1">{completionRate}%</h3>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="p-5 rounded-2xl bg-white border border-zinc-200 shadow-sm flex items-center gap-4 group"
          >
            <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 group-hover:scale-105 transition-transform">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-zinc-450 font-bold uppercase tracking-wider">Alertas Activas</p>
              <h3 className="text-3xl font-black text-zinc-900 mt-1">{activeAlerts}</h3>
            </div>
          </motion.div>
        </section>

        {/* Search and Invite Split */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Roster Search Column */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-3 bg-white border border-zinc-200 px-4 py-2.5 rounded-2xl shadow-sm focus-within:border-cyan-500/50 transition-colors">
              <Search className="w-4 h-4 text-zinc-400 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar atleta por nombre o correo..."
                className="bg-transparent border-none text-zinc-800 outline-none text-sm w-full placeholder-zinc-400"
              />
            </div>

            {/* Athlete Bento Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-5">
              <AnimatePresence mode="popLayout">
                {filteredRoster.length === 0 ? (
                  <div className="col-span-full py-12 text-center bg-zinc-50 rounded-2xl border border-dashed border-zinc-250 flex flex-col items-center gap-3">
                    <Users className="w-8 h-8 text-zinc-400" />
                    <p className="text-zinc-500 text-sm">No se encontraron atletas vinculados a tu roster.</p>
                  </div>
                ) : (
                  filteredRoster.map(item => (
                    <AthleteRosterCard
                      key={item.id}
                      athlete={item}
                      plans={plans}
                      assigningId={assigningId}
                      removingId={removingId}
                      onPlanSelect={handlePlanSelect}
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
              <h4 className="text-xs font-black uppercase text-zinc-450 tracking-wider">Alertas y HRV</h4>
              <p className="text-[11px] text-zinc-500 leading-relaxed font-medium">
                El sistema avisa con un punto rojo parpadeante cuando un atleta registra un HRV por debajo de 55ms o un Readiness de Whoop/Oura menor al 60%. Úsalo para ajustar sus entrenamientos en tiempo real y evitar lesiones.
              </p>
            </div>
          </div>
        </section>

      </main>
    </div>
  )
}
