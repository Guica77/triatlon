import { NextResponse } from 'next/server'
import { isAuthorizedCronRequest } from '@/lib/cron-auth'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  if (!isAuthorizedCronRequest(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()
  const { data: profiles, error } = await admin
    .from('profiles')
    .select('id')
    .not('deletion_scheduled_for', 'is', null)
    .lte('deletion_scheduled_for', new Date().toISOString())

  if (error) return NextResponse.json({ error: 'No se han podido leer las eliminaciones programadas.' }, { status: 500 })

  const results: Array<{ id: string; deleted: boolean }> = []
  for (const profile of profiles || []) {
    const { revokeAppleAuthorization } = await import('@/lib/auth/apple-revocation')
    await revokeAppleAuthorization(profile.id, null)
    const { error: deleteError } = await admin.auth.admin.deleteUser(profile.id, false)
    results.push({ id: profile.id, deleted: !deleteError })
  }

  return NextResponse.json({ processed: results.length, results })
}
