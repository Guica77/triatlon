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
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none opacity-50"></div>
      
      <div className="relative w-full max-w-md">
        <div className="bg-[#121214] border border-zinc-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
          
          {/* Top Edge Highlight */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500"></div>

          <div className="flex flex-col items-center text-center space-y-6">
            
            {/* Icon */}
            <div className="w-20 h-20 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mt-2 shadow-inner">
              <Trophy className="w-10 h-10 text-cyan-400" />
            </div>

            {/* Typography */}
            <div className="space-y-2">
              <h1 className="text-2xl font-black text-white tracking-tight">
                Únete al equipo de <br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
                  {coachName}
                </span>
              </h1>
              <p className="text-sm text-zinc-400 leading-relaxed max-w-sm mx-auto">
                Has sido invitado a formar parte de su roster de atletas. Conéctate para recibir tus entrenamientos, sincronizar tus dispositivos y desatar tu potencial.
              </p>
            </div>

            {/* Actions */}
            <div className="w-full space-y-3 pt-4">
              <Link href="/register" className="block w-full">
                <AnimatedButton variant="primary" className="w-full py-3.5 text-sm font-bold bg-cyan-500 hover:bg-cyan-400 text-black rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-cyan-500/20">
                  <UserPlus className="w-4 h-4" />
                  Soy nuevo, Registrarme
                  <ArrowRight className="w-4 h-4 ml-1" />
                </AnimatedButton>
              </Link>
              
              <Link href="/login" className="block w-full">
                <AnimatedButton variant="ghost" className="w-full py-3.5 text-sm font-bold text-zinc-300 hover:text-white bg-zinc-900/50 hover:bg-zinc-800 border border-zinc-800 rounded-xl flex items-center justify-center gap-2 transition-all">
                  <LogIn className="w-4 h-4 text-zinc-500" />
                  Ya tengo cuenta, Iniciar Sesión
                </AnimatedButton>
              </Link>
            </div>

          </div>
        </div>

        <p className="text-center text-xs text-zinc-600 mt-6 font-medium">
          Powered by B2B Training Platform
        </p>
      </div>
    </div>
  )
}
