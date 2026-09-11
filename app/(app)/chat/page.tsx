import { ChatViewport } from '@/components/chat/chat-viewport'
import * as React from 'react'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getChatParticipants, getAvailableCoaches } from '@/app/(app)/chat/actions'
import { ChatView } from '@/components/chat/chat-view'
import { ArrowLeft } from 'lucide-react'
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
      <header className="apple-chat-toolbar shrink-0 border-b border-border-subtle bg-surface-elevated/88 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-4xl items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="min-w-0">
              <h1 className="truncate text-xl font-semibold tracking-tight text-text-primary">Chat con tu entrenador</h1>
              <p className="mt-0.5 truncate text-sm text-text-muted">
                Comunicación directa y resolución de dudas
              </p>
            </div>
          </div>

          <Link href="/dashboard" className="shrink-0" aria-label="Volver al Dashboard">
            <AnimatedButton variant="ghost" size="icon" className="h-11 w-11 rounded-full text-text-secondary fine-hover:bg-surface-hover fine-hover:text-text-primary">
              <ArrowLeft className="h-5 w-5" />
              <span className="sr-only">Dashboard</span>
            </AnimatedButton>
          </Link>
        </div>
      </header>

      {/* Main chat viewport */}
      <main className="apple-athlete-content mx-auto flex min-h-0 w-full max-w-4xl flex-1 flex-col overflow-hidden bg-bg-deep px-0 pb-0 pt-0 sm:px-6 sm:pt-6">
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
