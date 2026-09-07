import { isAuthSessionMissingError } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { WelcomeRedirect } from '@/components/brand/authenticated-welcome'
import { welcomeDestination } from '@/lib/auth/welcome'

export default async function WelcomePage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const db = await createClient()
  const { data: { user }, error } = await db.auth.getUser()
  if (isAuthSessionMissingError(error)) redirect('/login')
  if (error) throw new Error('No se ha podido verificar la sesión. Inténtalo de nuevo.')
  if (!user) redirect('/login')
  const { next } = await searchParams
  return <WelcomeRedirect destination={welcomeDestination(next)} />
}
