import * as React from 'react'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { AnimatedButton } from '@/components/ui/animated-button'
import { Trophy, ArrowRight, UserPlus, LogIn } from 'lucide-react'


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

  // We cannot use cookies().set() in a Server Component.
  // Instead, we will inject a small script to set the cookie securely on the client side.

  const coachName = coach.first_name 
    ? `${coach.first_name} ${coach.last_name || ''}`.trim() 
    : 'Tu Entrenador'

  return (
    <div className="min-h-screen bg-[var(--color-background)] flex items-center justify-center p-6 relative overflow-hidden">
      
      {/* Script to set the invite cookie so auth/callback can read it after login/register */}
      <script dangerouslySetInnerHTML={{ __html: `document.cookie = "invite_coach_id=${coach.id}; path=/; max-age=604800; samesite=lax";` }} />

      <div className="relative w-full max-w-md">
        <div className="bg-surface-card border border-border-subtle rounded-3xl p-8 relative overflow-hidden">
          
          {/* Top Edge Highlight */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-swim via-blue-500 to-indigo-500"></div>

          <div className="flex flex-col items-center text-center space-y-6">
            
            {/* Icon */}
            <div className="w-20 h-20 rounded-2xl bg-swim border border-swim flex items-center justify-center mt-2 shrink-0">
              <Trophy className="w-10 h-10 text-swim animate-pulse" />
            </div>

            {/* Typography */}
            <div className="space-y-2">
              <h1 className="text-2xl font-black text-text-primary tracking-tight leading-tight">
                Únete al equipo de <br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-swim to-blue-600">
                  {coachName}
                </span>
              </h1>
              <p className="text-sm text-text-muted font-semibold leading-relaxed max-w-sm mx-auto">
                Has sido invitado a formar parte de su roster de atletas. Conéctate para recibir tus entrenamientos, sincronizar tus dispositivos y desatar tu potencial.
              </p>
            </div>

            {/* Actions */}
            <div className="w-full space-y-3 pt-4">
              <Link href="/register" className="block w-full">
                <AnimatedButton variant="primary" className="w-full py-3.5 text-sm font-black bg-swim hover:bg-swim text-white rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer">
                  <UserPlus className="w-4 h-4" />
                  Soy nuevo, Registrarme
                  <ArrowRight className="w-4 h-4 ml-1" />
                </AnimatedButton>
              </Link>
              
              <Link href="/login" className="block w-full">
                <AnimatedButton variant="ghost" className="w-full py-3.5 text-sm font-black text-text-secondary hover:text-text-primary bg-bg-elevated hover:bg-bg-hover border border-border-subtle rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer">
                  <LogIn className="w-4 h-4 text-text-muted" />
                  Ya tengo cuenta, Iniciar Sesión
                </AnimatedButton>
              </Link>
            </div>

          </div>
        </div>

        <p className="text-center text-xs text-text-muted mt-6 font-bold uppercase tracking-wider">
          Powered by B2B Training Platform
        </p>
      </div>
    </div>
  )
}
