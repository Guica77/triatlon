import * as React from 'react'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { AnimatedButton } from '@/components/ui/animated-button'
import { Trophy, ArrowRight, UserPlus, LogIn } from 'lucide-react'
import { cookies } from 'next/headers'

export default async function InviteLandingPage({
  params,
}: {
  params: { coachId: string }
}) {
  const coachId = params.coachId
  const supabase = await createClient()

  // 1. Fetch coach details
  const { data: coach, error } = await supabase
    .from('profiles')
    .select('id, first_name, last_name, role')
    .or(`id.eq.${coachId},invite_code.eq.${coachId.toUpperCase()}`)
    .single()

  if (error || !coach || coach.role !== 'coach') {
    // Si el enlace es inválido, llevar a home
    redirect('/')
  }

  // 2. Set the secure cookie that will be read during the Auth Callback
  const cookieStore = await cookies()
  cookieStore.set({
    name: 'invite_coach_id',
    value: coach.id,
    httpOnly: true,
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 1 semana
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  })

  const coachName = coach.first_name 
    ? `${coach.first_name} ${coach.last_name || ''}`.trim() 
    : 'Tu Entrenador'

  return (
    <div className="min-h-screen bg-[var(--color-background)] flex items-center justify-center p-6 relative overflow-hidden">
      
      {/* Background decorations */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-cyan-500/5 rounded-full blur-[120px] pointer-events-none opacity-50"></div>
      
      <div className="relative w-full max-w-md">
        <div className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-xl relative overflow-hidden">
          
          {/* Top Edge Highlight */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-650 via-blue-500 to-indigo-500"></div>

          <div className="flex flex-col items-center text-center space-y-6">
            
            {/* Icon */}
            <div className="w-20 h-20 rounded-2xl bg-cyan-50 border border-cyan-100 flex items-center justify-center mt-2 shadow-sm shrink-0">
              <Trophy className="w-10 h-10 text-cyan-650 animate-pulse" />
            </div>

            {/* Typography */}
            <div className="space-y-2">
              <h1 className="text-2xl font-black text-zinc-900 tracking-tight leading-tight">
                Únete al equipo de <br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 to-blue-600">
                  {coachName}
                </span>
              </h1>
              <p className="text-sm text-zinc-500 font-semibold leading-relaxed max-w-sm mx-auto">
                Has sido invitado a formar parte de su roster de atletas. Conéctate para recibir tus entrenamientos, sincronizar tus dispositivos y desatar tu potencial.
              </p>
            </div>

            {/* Actions */}
            <div className="w-full space-y-3 pt-4">
              <Link href="/register" className="block w-full">
                <AnimatedButton variant="primary" className="w-full py-3.5 text-sm font-black bg-cyan-650 hover:bg-cyan-550 text-white rounded-xl flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer">
                  <UserPlus className="w-4 h-4" />
                  Soy nuevo, Registrarme
                  <ArrowRight className="w-4 h-4 ml-1" />
                </AnimatedButton>
              </Link>
              
              <Link href="/login" className="block w-full">
                <AnimatedButton variant="ghost" className="w-full py-3.5 text-sm font-black text-zinc-700 hover:text-zinc-900 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer">
                  <LogIn className="w-4 h-4 text-zinc-550" />
                  Ya tengo cuenta, Iniciar Sesión
                </AnimatedButton>
              </Link>
            </div>

          </div>
        </div>

        <p className="text-center text-xs text-zinc-400 mt-6 font-bold uppercase tracking-wider">
          Powered by B2B Training Platform
        </p>
      </div>
    </div>
  )
}
