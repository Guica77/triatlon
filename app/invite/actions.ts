'use server'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export async function acceptInvitation(form: FormData) {
  const invite = form.get('invite')
  if (typeof invite !== 'string' || !/^[a-zA-Z0-9_-]{4,64}$/.test(invite)) redirect('/dashboard')
  const db = await createClient()
  const { data: { user } } = await db.auth.getUser()
  if (!user) redirect('/login')
  if (form.get('consent') !== 'yes') redirect(`/invite/${encodeURIComponent(invite)}?error=consent`)
  const { error } = await (db as any).rpc('accept_coach_invite', { invite })
  if (error) redirect(`/invite/${encodeURIComponent(invite)}?error=accept`)
  ;(await cookies()).delete('invite_coach_id')
  redirect('/dashboard')
}
