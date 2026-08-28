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
    <div className="relative isolate flex h-dvh min-h-0 flex-col overflow-hidden bg-bg-deep">

      {/* Top navigation keeps the chat identity and return action in the product shell */
      <header className="shrink-0 border-b border-border-subtle bg-surface-elevated px-4 sm:px-6 pb-3 sm:pb-4 pt-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-swim/40 bg-swim-subtle">
            <MessageSquare className="h-4 w-4 text-swim" />
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
          <AnimatedButton variant="ghost" className="flex items-center gap-1.5 rounded-lg border border-transparent px-2.5 py-2 text-xs font-semibold text-text-secondary fine-hover:bg-surface-hover fine-hover:text-text-primary">
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden min-[380px]:inline">Dashboard</span>
          </AnimatedButton>
        </Link>
      </header>

      {/* Main chat viewport */}
      <main className="mx-auto flex min-h-0 w-full max-w-4xl flex-1 flex-col overflow-hidden bg-bg-deep px-0 pb-0 pt-0 sm:px-6 sm:pt-6">
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
