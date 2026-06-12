import * as React from 'react'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getChatParticipants, getAvailableCoaches } from '@/app/(app)/chat/actions'
import { ChatView } from '@/components/chat/chat-view'
import { Trophy, ArrowLeft, MessageSquare } from 'lucide-react'
import Link from 'next/link'
import { AnimatedButton } from '@/components/ui/animated-button'

export default async function AthleteChatPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // 1. Verify user profile (and prevent coaches from accessing the athlete endpoint directly)
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile && profile.role === 'coach') {
    redirect('/coach/chat')
  }

  // 2. Fetch athlete's assigned coach
  const participantsRes = await getChatParticipants()
  const participants = participantsRes.data || []

  // 3. If no coach is assigned, fetch available coaches
  let availableCoaches: any[] = []
  if (participants.length === 0) {
    const coachesRes = await getAvailableCoaches()
    availableCoaches = coachesRes.data || []
  }

  return (
    <div className="h-[100dvh] bg-[var(--color-background)] text-zinc-100 flex flex-col pb-[env(safe-area-inset-bottom)] sm:pb-0 overflow-hidden">
      
      {/* Top Navbar */}
      <header className="border-b border-[var(--color-border)] bg-[var(--color-background)]/80 backdrop-blur-md sticky top-0 z-50 px-4 sm:px-6 py-3 sm:py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center shadow-inner shrink-0">
            <MessageSquare className="w-4 h-4 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-sm sm:text-base font-semibold text-zinc-50 tracking-tight">Chat con Entrenador</h1>
            <p className="text-[11px] sm:text-xs text-zinc-400">
              Comunicación directa y resolución de dudas
            </p>
          </div>
        </div>

        <Link href="/dashboard" className="w-full sm:w-auto">
          <AnimatedButton variant="ghost" className="w-full sm:w-auto border border-zinc-800 flex items-center justify-center gap-2 px-4 py-2 text-xs sm:text-sm shadow-sm bg-zinc-900/50 hover:bg-zinc-800">
            <ArrowLeft className="w-4 h-4" />
            <span className="font-semibold text-zinc-300">Volver al Dashboard</span>
          </AnimatedButton>
        </Link>
      </header>

      {/* Main chat viewport */}
      <main className="max-w-4xl mx-auto w-full px-0 sm:px-6 pt-2 sm:pt-8 flex-1 flex flex-col overflow-hidden pb-[4.5rem] sm:pb-0">
        <ChatView
          initialParticipants={participants}
          availableCoaches={availableCoaches}
          currentUserRole="athlete"
          currentUserId={user.id}
        />
      </main>
    </div>
  )
}
