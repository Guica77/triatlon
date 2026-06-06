import * as React from 'react'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getChatParticipants } from '@/app/chat/actions'
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

  // 1. Verify user profile and coach role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, first_name')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'coach') {
    redirect('/dashboard')
  }

  // 2. Fetch conversation athletes
  const participantsRes = await getChatParticipants()
  const participants = participantsRes.data || []
  
  const params = await searchParams
  const preselectedAthleteId = params.athlete || null

  const coachName = profile.first_name || 'Entrenador'

  return (
    <div className="min-h-screen bg-[var(--color-background)] text-zinc-100 flex flex-col">
      {/* Upper Deck Header */}
      <header className="sticky top-0 z-50 bg-[var(--color-background)]/90 backdrop-blur-md border-b border-[var(--color-border)] shadow-sm shrink-0">
        <div className="px-6 py-4 flex justify-between items-center border-b border-zinc-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-zinc-800 to-zinc-900 border border-zinc-700/80 flex items-center justify-center shadow-inner shrink-0 group">
              <Trophy className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
            </div>
            <div>
              <h1 className="text-base font-semibold text-zinc-50 tracking-tight">Centro de Mensajería</h1>
              <p className="text-xs text-zinc-400 truncate flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse"></span>
                Coach: {coachName} • Plan B2B Premium
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/settings">
              <AnimatedButton variant="ghost" size="icon" className="w-9 h-9 text-zinc-400 hover:text-zinc-100 border border-zinc-800 rounded-xl">
                <Settings className="w-4 h-4" />
              </AnimatedButton>
            </Link>
            <form action="/auth/signout" method="post">
              <AnimatedButton variant="ghost" size="icon" className="w-9 h-9 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl border border-transparent">
                <LogOut className="w-4 h-4" />
              </AnimatedButton>
            </form>
          </div>
        </div>

        {/* Level 2 Navigation Bar */}
        <div className="px-6 py-2.5 bg-zinc-950/60 flex items-center justify-between border-t border-zinc-900/30">
          <div className="flex gap-2 overflow-x-auto scrollbar-none">
            <Link href="/coach/dashboard" className="shrink-0">
              <AnimatedButton variant="ghost" size="sm" className="rounded-full text-xs py-1.5 px-3.5 border border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:text-zinc-200 transition-all">
                Atletas en Roster
              </AnimatedButton>
            </Link>
            <Link href="/coach/chat" className="shrink-0">
              <AnimatedButton variant="ghost" size="sm" className="rounded-full text-xs py-1.5 px-3.5 bg-zinc-900 border border-zinc-800 text-white font-medium shadow-sm flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Mensajería Directa</span>
              </AnimatedButton>
            </Link>
          </div>
        </div>
      </header>

      {/* Reusable Chat Interface */}
      <main className="max-w-6xl mx-auto w-full px-6 pt-8 flex-1 flex flex-col justify-start">
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
