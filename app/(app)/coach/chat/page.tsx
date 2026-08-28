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
    <div
      className="fixed inset-x-0 top-0 h-dvh z-50 flex flex-col overflow-hidden"
      style={{
        backgroundColor: '#e5ddd5',
        backgroundImage: 'radial-gradient(#cfc8c0 1px, transparent 1px)',
        backgroundSize: '24px 24px',
      }}
    >
      {/* Upper Deck Header — safe-area top so the status bar never overlaps */}
      <header className="shrink-0 border-b border-zinc-200 bg-white/95 pt-[env(safe-area-inset-top)] shadow-sm backdrop-blur-md transition-[background-color,border-color,box-shadow,opacity] duration-200 ease-out">
        <div className="px-6 py-4 flex justify-between items-center border-b border-zinc-200/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-50 border border-cyan-100 flex items-center justify-center shadow-sm shrink-0 group">
              <Trophy className="w-4 h-4 text-cyan-600 group-hover:scale-110 transition-transform" />
            </div>
            <div>
              <h1 className="text-base font-bold text-zinc-900 tracking-tight">Centro de Mensajería</h1>
              <p className="text-xs text-zinc-500 font-semibold truncate flex items-center gap-1.5 mt-0.5">
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-600" aria-hidden="true"></span>
                Coach: {coachName} • Plan B2B Premium
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/settings">
              <AnimatedButton variant="ghost" size="icon" aria-label="Abrir ajustes" className="h-9 w-9 rounded-xl border border-zinc-200 bg-white text-zinc-500 shadow-sm hover:border-zinc-400 hover:bg-zinc-50 hover:text-zinc-800 cursor-pointer">
                <Settings className="w-4 h-4" />
              </AnimatedButton>
            </Link>
            <form action="/auth/signout" method="post">
              <AnimatedButton variant="ghost" size="icon" aria-label="Cerrar sesión" className="h-9 w-9 rounded-xl border border-zinc-200 bg-white text-zinc-600 shadow-sm hover:border-red-200 hover:bg-red-50 hover:text-red-700 cursor-pointer">
                <LogOut className="w-4 h-4" />
              </AnimatedButton>
            </form>
          </div>
        </div>

        {/* Level 2 Navigation Bar */}
        <div className="px-6 py-2.5 bg-zinc-50 flex items-center justify-between border-t border-zinc-200/30">
          <div className="flex gap-2 overflow-x-auto scrollbar-none">
            <Link href="/coach/dashboard" className="shrink-0">
              <AnimatedButton variant="ghost" size="sm" className="rounded-full border border-zinc-200 bg-white px-3.5 py-1.5 text-xs text-zinc-600 shadow-sm transition-[background-color,color,border-color,box-shadow,opacity,transform] duration-150 ease-out hover:bg-zinc-100/40 hover:text-zinc-800 active:scale-[0.98] cursor-pointer motion-reduce:transition-opacity motion-reduce:active:scale-100">
                Atletas en Roster
              </AnimatedButton>
            </Link>
            <Link href="/coach/chat" className="shrink-0">
              <AnimatedButton variant="ghost" size="sm" className="rounded-full text-xs py-1.5 px-3.5 bg-cyan-50 border border-cyan-200 text-cyan-700 font-black shadow-sm flex items-center gap-1.5 cursor-pointer">
                <MessageSquare className="w-3.5 h-3.5 text-cyan-600" aria-hidden="true" />
                <span>Mensajería Directa</span>
              </AnimatedButton>
            </Link>
          </div>
        </div>
      </header>

      {/* Reusable Chat Interface */}
      <main className="max-w-6xl mx-auto w-full px-0 sm:px-6 pt-0 sm:pt-8 flex-1 flex flex-col overflow-hidden pb-0 min-h-0">
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
