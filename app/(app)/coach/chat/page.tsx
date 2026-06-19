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
    <div className="h-[100dvh] bg-[var(--color-background)] flex flex-col overflow-hidden pb-[env(safe-area-inset-bottom)] sm:pb-0">
      {/* Upper Deck Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-zinc-200 shadow-sm shrink-0 transition-all duration-300">
        <div className="px-6 py-4 flex justify-between items-center border-b border-zinc-200/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-50 border border-cyan-100 flex items-center justify-center shadow-sm shrink-0 group">
              <Trophy className="w-4 h-4 text-cyan-600 group-hover:scale-110 transition-transform" />
            </div>
            <div>
              <h1 className="text-base font-bold text-zinc-900 tracking-tight">Centro de Mensajería</h1>
              <p className="text-xs text-zinc-500 font-semibold truncate flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-600 animate-pulse"></span>
                Coach: {coachName} • Plan B2B Premium
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/settings">
              <AnimatedButton variant="ghost" size="icon" className="w-9 h-9 text-zinc-500 hover:text-zinc-800 border border-zinc-200 hover:border-zinc-350 bg-white hover:bg-zinc-50 rounded-xl shadow-sm cursor-pointer">
                <Settings className="w-4 h-4" />
              </AnimatedButton>
            </Link>
            <form action="/auth/signout" method="post">
              <AnimatedButton variant="ghost" size="icon" className="w-9 h-9 text-zinc-550 hover:text-red-650 hover:bg-red-50 rounded-xl border border-zinc-200 hover:border-red-200 shadow-sm bg-white cursor-pointer">
                <LogOut className="w-4 h-4" />
              </AnimatedButton>
            </form>
          </div>
        </div>

        {/* Level 2 Navigation Bar */}
        <div className="px-6 py-2.5 bg-zinc-50 flex items-center justify-between border-t border-zinc-200/30">
          <div className="flex gap-2 overflow-x-auto scrollbar-none">
            <Link href="/coach/dashboard" className="shrink-0">
              <AnimatedButton variant="ghost" size="sm" className="rounded-full text-xs py-1.5 px-3.5 border border-zinc-200 bg-white text-zinc-550 hover:text-zinc-800 hover:bg-zinc-100/40 shadow-sm cursor-pointer transition-all">
                Atletas en Roster
              </AnimatedButton>
            </Link>
            <Link href="/coach/chat" className="shrink-0">
              <AnimatedButton variant="ghost" size="sm" className="rounded-full text-xs py-1.5 px-3.5 bg-cyan-50 border border-cyan-200 text-cyan-700 font-black shadow-sm flex items-center gap-1.5 cursor-pointer">
                <MessageSquare className="w-3.5 h-3.5 text-cyan-600 animate-pulse" />
                <span>Mensajería Directa</span>
              </AnimatedButton>
            </Link>
          </div>
        </div>
      </header>

      {/* Reusable Chat Interface */}
      <main className="max-w-6xl mx-auto w-full px-0 sm:px-6 pt-0 sm:pt-8 flex-1 flex flex-col overflow-hidden pb-[4.5rem] sm:pb-0">
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
