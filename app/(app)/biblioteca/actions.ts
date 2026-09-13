'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { generateAIEmbedding } from '@/lib/ai-service'

const CATEGORIES = new Set(['natacion', 'ciclismo', 'carrera', 'fuerza', 'recuperacion', 'nutricion', 'material', 'competicion', 'planificacion'])
const TYPES = new Set(['document', 'video', 'link'])
const VISIBILITIES = new Set(['private', 'athlete', 'team'])

export async function saveTriathlonResource(input: {
  title: string; category: string; resourceType: string; visibility: string; content: string; sourceUrl?: string; athleteId?: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Tu sesión ha caducado. Vuelve a entrar.' }

  const title = input.title.trim()
  const content = input.content.trim()
  const sourceUrl = input.sourceUrl?.trim() || null
  if (title.length < 2 || title.length > 240 || content.length < 20 || content.length > 12000) return { error: 'Añade un título y unas notas de entre 20 y 12.000 caracteres.' }
  if (!CATEGORIES.has(input.category) || !TYPES.has(input.resourceType) || !VISIBILITIES.has(input.visibility)) return { error: 'Selecciona una categoría, tipo y visibilidad válidos.' }
  if (sourceUrl && !/^https?:\/\//i.test(sourceUrl)) return { error: 'El enlace debe comenzar por http:// o https://.' }
  const profileResult = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle()
  const isCoach = profileResult.data?.role === 'coach'
  if ((input.visibility === 'athlete' || input.visibility === 'team') && !input.athleteId && isCoach) return { error: 'Selecciona el atleta con quien compartir este recurso.' }
  const athleteId = input.visibility === 'private' ? null : (!input.athleteId || input.athleteId === 'self' ? user.id : input.athleteId)
  if (input.visibility !== 'private' && !isCoach && athleteId !== user.id) return { error: 'Solo puedes compartir tus propios recursos con tu entrenador.' }
  if (isCoach && athleteId) {
    const roster = await supabase.from('coach_athletes').select('id').eq('coach_id', user.id).eq('athlete_id', athleteId).eq('status', 'active').maybeSingle()
    if (!roster.data) return { error: 'Solo puedes compartir recursos con atletas de tu equipo activo.' }
  }

  const embedding = await generateAIEmbedding(`${title}\n${content}`)
  const db = supabase as any
  const { error } = await db.from('triathlon_resources').insert({
    owner_id: user.id, athlete_id: athleteId, visibility: input.visibility, resource_type: input.resourceType,
    title, category: input.category, source_url: sourceUrl, content, embedding,
  })
  if (error) return { error: 'No se ha podido guardar el recurso. Comprueba que la biblioteca está activada.' }
  revalidatePath('/biblioteca')
  return { success: true }
}

export async function archiveTriathlonResource(resourceId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autorizado.' }
  const { error } = await (supabase as any).from('triathlon_resources').update({ active: false }).eq('id', resourceId).eq('owner_id', user.id)
  if (error) return { error: 'No se ha podido retirar el recurso.' }
  revalidatePath('/biblioteca')
  return { success: true }
}
