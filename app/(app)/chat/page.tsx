import { ChatViewport } from '@/components/chat/chat-viewport'
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
    <ChatViewport>

      {/* Top navigation keeps the chat identity and return action in the product shell */}
      <header className="shrink-0 border-b border-border-subtle bg-surface-elevated">
        <div className="mx-auto flex w-full max-w-4xl items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-swim/40 bg-swim-subtle shadow-card">
              <MessageSquare className="h-4 w-4 text-swim" />
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-sm font-bold tracking-tight text-text-primary sm:text-base">Chat con Entrenador</h1>
              <p className="truncate text-[11px] font-semibold text-text-muted sm:text-xs">
                Comunicación directa y resolución de dudas
              </p>
            </div>
          </div>

          <Link href="/dashboard" className="shrink-0" aria-label="Volver al Dashboard">
            <AnimatedButton variant="ghost" size="icon" className="h-10 w-10 rounded-full border border-border-default text-text-secondary fine-hover:bg-surface-hover fine-hover:text-text-primary">
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">Dashboard</span>
            </AnimatedButton>
          </Link>
        </div>
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
    </ChatViewport>
  )
}
