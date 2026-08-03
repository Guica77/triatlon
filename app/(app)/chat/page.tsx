import * as React from 'react'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getChatParticipants, getAvailableCoaches } from '@/app/(app)/chat/actions'
import { ChatView } from '@/components/chat/chat-view'
import { ArrowLeft, MessageSquare } from 'lucide-react'
import Link from 'next/link'
import { AnimatedButton } from '@/components/ui/animated-button'

export default async function AthleteChatPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // 1. Verify user profile and fetch participants in parallel
  const [profileRes, participantsRes] = await Promise.all([
    supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single(),
    getChatParticipants()
  ]);

  const profile = profileRes.data;
  if (profile && profile.role === 'coach') {
    redirect('/coach/chat')
  }

  const participants = participantsRes.data || []

  // 2. If no coach is assigned, fetch available coaches
  let availableCoaches: any[] = []
  if (participants.length === 0) {
    const coachesRes = await getAvailableCoaches()
    availableCoaches = coachesRes.data || []
  }

  return (
    <div
      className="fixed inset-x-0 top-0 h-dvh z-50 flex flex-col overflow-hidden"
      style={{
        backgroundColor: '#e5ddd5',
        backgroundImage: 'radial-gradient(#cfc8c0 1px, transparent 1px)',
        backgroundSize: '24px 24px',
      }}
    >

      {/* Top Navbar — safe-area top so the system status bar never overlaps the title */}
      <header className="border-b border-border-subtle bg-white/95 backdrop-blur-md px-4 sm:px-6 pt-[env(safe-area-inset-top)] pb-3 sm:pb-4 flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-swim border border-swim flex items-center justify-center shrink-0">
            <MessageSquare className="w-4 h-4 text-swim" />
          </div>
          <div className="min-w-0">
            <h1 className="text-sm sm:text-base font-bold text-text-primary tracking-tight truncate">Chat con Entrenador</h1>
            <p className="text-[11px] sm:text-xs text-text-muted font-semibold truncate">
              Comunicación directa y resolución de dudas
            </p>
          </div>
        </div>

        {/* Compact back control — arrow + small label, keeps the header to one row */}
        <Link href="/dashboard" className="shrink-0" aria-label="Volver al Dashboard">
          <AnimatedButton variant="ghost" className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-xs font-semibold text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100 border border-transparent cursor-pointer transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden min-[380px]:inline">Dashboard</span>
          </AnimatedButton>
        </Link>
      </header>

      {/* Main chat viewport */}
      <main className="max-w-4xl mx-auto w-full px-0 sm:px-6 pt-2 sm:pt-8 flex-1 flex flex-col overflow-hidden pb-0 min-h-0">
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
