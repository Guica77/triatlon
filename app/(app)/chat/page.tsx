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

      <header className="apple-chat-toolbar shrink-0 border-b border-border-subtle bg-surface-elevated/88 backdrop-blur-xl">
        <div className="mx-auto grid w-full max-w-4xl grid-cols-[2.75rem_1fr_2.75rem] items-center px-2 py-2 sm:px-4">
          <Link href="/dashboard" className="shrink-0" aria-label="Volver al Dashboard">
            <AnimatedButton variant="ghost" size="icon" className="h-11 w-11 rounded-full text-accent fine-hover:bg-surface-hover">
              <ArrowLeft className="h-5 w-5" />
            </AnimatedButton>
          </Link>
          <h1 className="truncate text-center text-base font-semibold text-text-primary">Mensajes</h1>
          <span aria-hidden="true" />
        </div>
      </header>

      {/* Main chat viewport */}
      <main className="apple-athlete-content mx-auto flex min-h-0 w-full max-w-4xl flex-1 flex-col overflow-hidden bg-surface-app px-0 pb-0 pt-0 sm:px-6 sm:pt-6">
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
