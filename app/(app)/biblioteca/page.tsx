import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ResourceLibrary } from '@/components/library/resource-library'

export default async function BibliotecaPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const [profileResult, resourcesResult, athletesResult] = await Promise.all([
    supabase.from('profiles').select('role').eq('id', user.id).maybeSingle(),
    (supabase as any).from('triathlon_resources').select('id,title,category,resource_type,visibility,content,source_url,owner_id,created_at').eq('active', true).order('created_at', { ascending: false }),
    supabase.from('coach_athletes').select('athlete_id, profiles!coach_athletes_athlete_id_fkey(first_name,last_name)').eq('coach_id', user.id).eq('status', 'active'),
  ])
  const athletes = (athletesResult.data || []).map((row: any) => ({ id: row.athlete_id, name: [row.profiles?.first_name, row.profiles?.last_name].filter(Boolean).join(' ') || 'Atleta' }))
  return <ResourceLibrary resources={(resourcesResult.data || []) as any} athletes={athletes} isCoach={profileResult.data?.role === 'coach'} />
}
