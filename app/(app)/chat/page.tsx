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
    <div className="fixed inset-0 z-50 bg-[#e5ddd5] flex flex-col overflow-hidden">
      
      {/* Top Navbar */}
      <header className="border-b border-zinc-200 bg-white/95 backdrop-blur-md sticky top-0 z-50 px-4 sm:px-6 py-3 sm:py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0 transition-all duration-300 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-cyan-50 border border-cyan-100 flex items-center justify-center shadow-sm shrink-0">
            <MessageSquare className="w-4 h-4 text-cyan-600" />
          </div>
          <div>
            <h1 className="text-sm sm:text-base font-bold text-zinc-900 tracking-tight">Chat con Entrenador</h1>
            <p className="text-[11px] sm:text-xs text-zinc-500 font-semibold">
              Comunicación directa y resolución de dudas
            </p>
          </div>
        </div>

        <Link href="/dashboard" className="w-full sm:w-auto">
          <AnimatedButton variant="ghost" className="w-full sm:w-auto border border-zinc-200 flex items-center justify-center gap-2 px-4 py-2 text-xs sm:text-sm shadow-sm bg-white hover:bg-zinc-50 text-zinc-650 hover:text-zinc-800 cursor-pointer">
            <ArrowLeft className="w-4 h-4" />
            <span className="font-semibold">Volver al Dashboard</span>
          </AnimatedButton>
        </Link>
      </header>

      {/* Main chat viewport */}
      <main className="max-w-4xl mx-auto w-full px-0 sm:px-6 pt-2 sm:pt-8 flex-1 flex flex-col overflow-hidden pb-0">
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
