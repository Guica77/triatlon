import * as React from 'react'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getChatParticipants } from '@/app/(app)/chat/actions'
import { ChatView } from '@/components/chat/chat-view'
import { Trophy, MessageSquare, Settings, LogOut } from 'lucide-react'
import Link from 'next/link'
import { AnimatedButton } from '@/components/ui/animated-button'

interface CoachChatPageProps {
  searchParams: Promise<{ athlete?: string }>
}

export default async function CoachChatPage({ searchParams }: CoachChatPageProps) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // 1. Verify user profile and fetch roster athletes in parallel
  const [profileRes, participantsRes] = await Promise.all([
    supabase
      .from('profiles')
      .select('role, first_name')
      .eq('id', user.id)
      .single(),
    getChatParticipants()
  ]);

  const profile = profileRes.data;
  if (!profile || profile.role !== 'coach') {
    redirect('/dashboard')
  }

  const participants = participantsRes.data || []
  
  const params = await searchParams
  const preselectedAthleteId = params.athlete || null

  const coachName = profile.first_name || 'Entrenador'

  return (
    <div className="relative isolate flex h-dvh min-h-0 flex-col overflow-hidden bg-bg-deep">
      {/* Upper Deck Header - the product shell owns the safe-area inset */}
      <header className="shrink-0 border-b border-border-subtle bg-surface-elevated transition-[background-color,border-color,box-shadow,opacity] duration-200 ease-out">
        <div className="flex items-center justify-between gap-3 border-b border-border-subtle px-4 py-3 sm:px-6 sm:py-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="group flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-coral-500/40 bg-run-subtle">
              <Trophy className="h-4 w-4 text-coral-400 transition-transform group-hover:scale-110" />
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-base font-bold tracking-tight text-text-primary">Centro de Mensajería</h1>
              <p className="mt-0.5 flex truncate items-center gap-1.5 text-xs font-semibold text-text-muted">
                <span className="h-1.5 w-1.5 rounded-full bg-success" aria-hidden="true"></span>
                Coach: {coachName} · Plan B2B Premium
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1 sm:gap-2">
            <Link href="/settings">
              <AnimatedButton variant="ghost" size="icon" aria-label="Abrir ajustes" className="h-10 w-10 rounded-xl border border-border-default bg-surface-card text-text-secondary fine-hover:border-text-muted fine-hover:bg-surface-hover fine-hover:text-text-primary">
                <Settings className="h-4 w-4" />
              </AnimatedButton>
            </Link>
            <form action="/auth/signout" method="post">
              <AnimatedButton variant="ghost" size="icon" aria-label="Cerrar sesión" className="h-10 w-10 rounded-xl border border-border-default bg-surface-card text-text-secondary fine-hover:border-danger/50 fine-hover:bg-surface-hover fine-hover:text-danger">
                <LogOut className="h-4 w-4" />
              </AnimatedButton>
            </form>
          </div>
        </div>

        {/* Level 2 Navigation Bar */}
        <div className="flex items-center justify-between border-t border-border-subtle bg-surface-app px-4 py-2.5 sm:px-6">
          <div className="flex gap-2 overflow-x-auto scrollbar-none">
            <Link href="/coach/dashboard" className="shrink-0">
              <AnimatedButton variant="ghost" size="sm" className="rounded-full border border-border-default bg-surface-card px-3.5 py-1.5 text-xs text-text-secondary shadow-card fine-hover:bg-surface-hover fine-hover:text-text-primary">
                Atletas en Roster
              </AnimatedButton>
            </Link>
            <Link href="/coach/chat" className="shrink-0">
              <AnimatedButton variant="ghost" size="sm" className="flex items-center gap-1.5 rounded-full border border-coral-500/40 bg-run-subtle px-3.5 py-1.5 text-xs font-bold text-coral-300 shadow-card">
                <MessageSquare className="h-3.5 w-3.5 text-coral-400" aria-hidden="true" />
                <span>Mensajería Directa</span>
              </AnimatedButton>
            </Link>
          </div>
        </div>
      </header>

      {/* Reusable Chat Interface */}
      <main className="mx-auto flex min-h-0 w-full max-w-6xl flex-1 flex-col overflow-hidden bg-bg-deep px-0 pb-0 pt-0 sm:px-6 sm:pt-6">
        <ChatView
          initialParticipants={participants}
          currentUserRole="coach"
          currentUserId={user.id}
          preselectedParticipantId={preselectedAthleteId}
        />
      </main>
    </div>
  )
}
