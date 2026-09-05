'use server'

import { createClient } from '@/lib/supabase/server'
import { after } from 'next/server'
import { Resend } from 'resend'
import { sendPushNotification } from '@/lib/notifications'
import { createAdminClient } from '@/lib/supabase/admin'

const resend = new Resend(process.env.RESEND_API_KEY || 're_dummy_key')

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

export interface ChatMessageItem {
  id: string
  sender_id: string
  receiver_id: string
  message: string
  created_at: string
  is_read?: boolean
}

export interface ChatParticipant {
  id: string
  first_name: string | null
  last_name: string | null
  email: string | null
  role: string | null
}

/**
 * Sends a message from the current user to a target user.
 */
export async function sendMessage(receiverId: string, message: string, messageId?: string): Promise<{ data?: ChatMessageItem; error?: string }> {
  if (!message || !message.trim()) {
    return { error: 'El mensaje no puede estar vacío' }
  }

  if (messageId && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(messageId)) return { error: 'Identificador inválido' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'No autorizado' }
  }

  try {
    const { data: newMessage, error } = await supabase
      .from('chat_messages')
      .insert({
        ...(messageId ? { id: messageId } : {}),
        sender_id: user.id,
        receiver_id: receiverId,
        message: message.trim(),
      })
      .select('*')
      .single()

    if (error?.code === '23505' && messageId) {
      const { data: saved } = await supabase.from('chat_messages').select('*')
        .eq('id', messageId).eq('sender_id', user.id).eq('receiver_id', receiverId).single()
      if (saved && saved.message === message.trim()) return { data: saved as ChatMessageItem }
      return { error: 'No se pudo confirmar el mensaje. Reinténtalo.' }
    }
    if (error) {
      console.error('Error inserting chat message:', error)
      return { error: 'Error al enviar el mensaje' }
    }

    // A saved message is acknowledged without waiting for notification providers.
    after(async () => {
    try {
      const { data: senderProfile } = await supabase
        .from('profiles')
        .select('first_name')
        .eq('id', user.id)
        .single()

      const senderName = senderProfile?.first_name || 'Alguien'
      const pushSent = await sendPushNotification(receiverId, {
        title: `Nuevo mensaje de ${senderName}`,
        body: message.trim().slice(0, 240),
        url: '/chat',
      })

      if (!pushSent && process.env.RESEND_API_KEY) {
        const admin = createAdminClient()
        const { data: receiverProfile } = await admin
          .from('profiles')
          .select('email')
          .eq('id', receiverId)
          .single()

        if (receiverProfile?.email) {
          await resend.emails.send({
            from: 'Triatlon Pro Notificaciones <onboarding@resend.dev>',
            to: receiverProfile.email,
            subject: `Nuevo mensaje de ${senderName}`,
            html: `<div style="font-family: sans-serif; padding: 20px;">
                    <h2>Tienes un nuevo mensaje en Triatlón Pro</h2>
                    <p><strong>Mensaje:</strong> &quot;${escapeHtml(message.trim())}&quot;</p>
                    <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/chat" style="display: inline-block; padding: 10px 20px; background-color: #22d3ee; color: #000; text-decoration: none; border-radius: 5px; font-weight: bold;">Ver en el Chat</a>
                  </div>`
          })
        }
      }
    } catch (notificationErr) {
      console.error('Error in notification trigger:', notificationErr)
      // We don't return error here because the message was successfully saved
    }

    })

    return { data: newMessage as unknown as ChatMessageItem }
  } catch (err: unknown) {
    console.error('Exception in sendMessage:', err)
    return { error: err instanceof Error ? err.message : 'Error inesperado' }
  }
}

/**
 * Fetches the conversation history between the current user and another user.
 */
export async function getMessages(otherUserId: string, before?: { created_at: string; id: string }): Promise<{ data?: ChatMessageItem[]; hasMore?: boolean; error?: string }> {
  if (before && (!/^[0-9a-f-]{36}$/i.test(before.id) || !/^\d{4}-\d{2}-\d{2}T[0-9:.]+(?:Z|[+-]\d{2}:\d{2})$/.test(before.created_at))) {
    return { error: 'Página de historial inválida' }
  }
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'No autorizado' }
  }

  try {
    let query = supabase
      .from('chat_messages')
      .select('*')
      .or(`and(sender_id.eq.${user.id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${user.id})`)
      .order('created_at', { ascending: false })
      .order('id', { ascending: false })
      .limit(51)
    if (before) query = query.or(`created_at.lt.${before.created_at},and(created_at.eq.${before.created_at},id.lt.${before.id})`)
    const { data: messages, error } = await query

    if (error) {
      console.error('Error fetching chat history:', error)
      return { error: 'Error al obtener el historial de mensajes' }
    }

    return { data: (messages || []).slice(0, 50).reverse() as ChatMessageItem[], hasMore: (messages?.length || 0) > 50 }
  } catch (err: unknown) {
    console.error('Exception in getMessages:', err)
    return { error: err instanceof Error ? err.message : 'Error inesperado' }
  }
}

/**
 * Loads the active list of conversation partners:
 * - For a coach, this is all athletes in their roster.
 * - For an athlete, this is their assigned coach.
 */
export async function getChatParticipants(): Promise<{ data?: ChatParticipant[]; role?: string; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'No autorizado' }
  }

  try {
    // Determine current user role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, coach_id')
      .eq('id', user.id)
      .single()

    if (!profile) {
      return { error: 'Perfil no encontrado' }
    }

    const currentRole = profile.role || 'athlete'
    const historicalIds = new Set<string>()
    for (let offset = 0; ; offset += 500) {
      const { data: page, error } = await supabase.from('chat_messages')
        .select('sender_id, receiver_id').or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order('created_at').order('id').range(offset, offset + 499)
      if (error) throw error
      for (const row of page || []) historicalIds.add(row.sender_id === user.id ? row.receiver_id : row.sender_id)
      if (!page || page.length < 500) break
    }
    const withHistory = async (current: ChatParticipant[]) => {
      const ids = [...historicalIds].filter(id => !current.some(p => p.id === id))
      if (!ids.length) return current
      const { data, error } = await createAdminClient().from('profiles')
        .select('id, first_name, last_name, email, role').in('id', ids)
      if (error) throw error
      return [...current, ...(data || [])]
    }

    if (currentRole === 'coach') {
      // Fetch athletes connected in roster
      const { data: links } = await supabase
        .from('coach_athletes')
        .select('athlete_id')
        .eq('coach_id', user.id)

      if (!links || links.length === 0) {
        return { data: await withHistory([]), role: 'coach' }
      }

      const athleteIds = links.map(l => l.athlete_id)

      const { createAdminClient } = await import('@/lib/supabase/admin')
      const supabaseAdmin = createAdminClient()

      const { data: athletes, error: athletesError } = await supabaseAdmin
        .from('profiles')
        .select('id, first_name, last_name, email, role')
        .in('id', athleteIds)

      if (athletesError) {
        console.error('Error fetching coach athletes for chat:', athletesError)
        return { error: 'Error al obtener atletas' }
      }

      return { data: await withHistory(athletes || []), role: 'coach' }
    } else {
      // Fetch coach details
      // Attempt 1: coach_id from profiles
      let coachId = (profile as Record<string, unknown>).coach_id as string | null

      // Attempt 2: coach from coach_athletes link
      if (!coachId) {
        const { data: link } = await supabase
          .from('coach_athletes')
          .select('coach_id')
          .eq('athlete_id', user.id)
          .maybeSingle()
        if (link) {
          coachId = link.coach_id
        }
      }

      if (!coachId) {
        return { data: await withHistory([]), role: 'athlete' }
      }

      const { createAdminClient } = await import('@/lib/supabase/admin')
      const supabaseAdmin = createAdminClient()

      const { data: coach, error: coachError } = await supabaseAdmin
        .from('profiles')
        .select('id, first_name, last_name, email, role')
        .eq('id', coachId)
        .single()

      if (coachError) {
        console.error('Error fetching coach profile for chat:', coachError)
        return { error: 'Error al obtener datos del entrenador' }
      }

      return { data: await withHistory([coach]), role: 'athlete' }
    }
  } catch (err: unknown) {
    console.error('Exception in getChatParticipants:', err)
    return { error: err instanceof Error ? err.message : 'Error inesperado' }
  }
}

/**
 * Fetches all available coaches for the directory.
 */
export async function getAvailableCoaches(): Promise<{ data?: ChatParticipant[]; error?: string }> {
  const supabase = await createClient()
  
  try {
    const { createAdminClient } = await import('@/lib/supabase/admin')
    const supabaseAdmin = createAdminClient()

    const { data: coaches, error } = await supabaseAdmin
      .from('profiles')
      .select('id, first_name, last_name, email, role, level')
      .eq('role', 'coach')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching available coaches:', error)
      return { error: 'Error al obtener la lista de entrenadores' }
    }

    return { data: coaches as any[] }
  } catch (err: unknown) {
    console.error('Exception in getAvailableCoaches:', err)
    return { error: err instanceof Error ? err.message : 'Error inesperado' }
  }
}

/**
 * Links the current athlete to a specific coach.
 */
export async function linkCoachByAthlete(coachId: string): Promise<{ success?: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'No autorizado' }
  }

  try {
    const { createAdminClient } = await import('@/lib/supabase/admin')
    const supabaseAdmin = createAdminClient()

    // Insert the link
    const { error: linkError } = await supabaseAdmin
      .from('coach_athletes')
      .insert({
        coach_id: coachId,
        athlete_id: user.id,
        status: 'active'
      })

    if (linkError && linkError.code !== '23505') {
      console.error('Error linking to coach:', linkError)
      return { error: 'Error al vincular con el entrenador' }
    }

    // Update profile
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({ coach_id: coachId })
      .eq('id', user.id)

    if (profileError) {
      console.error('Error updating profile with coach:', profileError)
      return { error: 'Error al actualizar el perfil' }
    }

    const { revalidatePath } = await import('next/cache')
    revalidatePath('/chat')
    revalidatePath('/dashboard')

    return { success: true }
  } catch (err: unknown) {
    console.error('Exception in linkCoachByAthlete:', err)
    return { error: err instanceof Error ? err.message : 'Error inesperado' }
  }
}

/**
 * Looks up a coach by invite code.
 */
export async function lookupCoachByCode(code: string): Promise<{ success?: boolean; error?: string; coach?: any }> {
  if (!code || !code.trim()) {
    return { error: 'El código no puede estar vacío' }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'No autorizado' }
  }

  try {
    const formattedCode = code.trim().toUpperCase()

    const { createAdminClient } = await import('@/lib/supabase/admin')
    const supabaseAdmin = createAdminClient()

    // Find the coach with this code
    const { data: coachProfile, error: searchError } = await supabaseAdmin
      .from('profiles')
      .select('id, role, first_name, last_name')
      .eq('invite_code' as any, formattedCode)
      .maybeSingle()

    if (searchError) {
      console.error('Error looking up coach by code:', searchError)
      return { error: 'Error al buscar el código' }
    }

    if (!coachProfile || coachProfile.role !== 'coach') {
      return { error: 'Código de entrenador inválido' }
    }

    return { 
      success: true, 
      coach: {
        id: coachProfile.id,
        first_name: coachProfile.first_name,
        last_name: coachProfile.last_name
      }
    }
  } catch (err: unknown) {
    console.error('Exception in lookupCoachByCode:', err)
    return { error: err instanceof Error ? err.message : 'Error inesperado' }
  }
}

/**
 * Links the current athlete to a coach using an invite code.
 */
export async function linkCoachByCode(code: string): Promise<{ success?: boolean; error?: string }> {
  if (!code || !code.trim()) {
    return { error: 'El código no puede estar vacío' }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'No autorizado' }
  }

  try {
    const formattedCode = code.trim().toUpperCase()

    const { createAdminClient } = await import('@/lib/supabase/admin')
    const supabaseAdmin = createAdminClient()

    // Find the coach with this code (use admin client to bypass RLS since users can't read coach profiles by default)
    const { data: coachProfile, error: searchError } = await supabaseAdmin
      .from('profiles')
      .select('id, role')
      .eq('invite_code' as any, formattedCode)
      .maybeSingle()

    if (searchError) {
      console.error('Error looking up coach by code:', searchError)
      return { error: 'Error al buscar el código' }
    }

    if (!coachProfile || coachProfile.role !== 'coach') {
      return { error: 'Código de entrenador inválido' }
    }

    return await linkCoachByAthlete(coachProfile.id)
  } catch (err: unknown) {
    console.error('Exception in linkCoachByCode:', err)
    return { error: err instanceof Error ? err.message : 'Error inesperado' }
  }
}

/**
 * Fetches the public directory of available coaches.
 */
export async function getCoachDirectory(): Promise<{ success?: boolean; error?: string; coaches?: any[] }> {
  try {
    const { createAdminClient } = await import('@/lib/supabase/admin')
    const supabaseAdmin = createAdminClient()

    const { data: coaches, error } = await supabaseAdmin
      .from('profiles')
      .select('id, first_name, last_name, role, level, goal_distance, bio, achievements, invite_code')
      .eq('role', 'coach')
      .not('invite_code' as any, 'is', null)

    if (error) {
      console.error('Error fetching coach directory:', error)
      return { error: 'Error al cargar el directorio de entrenadores' }
    }

    return { success: true, coaches: coaches || [] }
  } catch (err: unknown) {
    console.error('Exception in getCoachDirectory:', err)
    return { error: err instanceof Error ? err.message : 'Error inesperado' }
  }
}

/**
 * Marks all messages from a specific sender to the current user as read.
 */
export async function markMessagesAsRead(senderId: string) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'No autorizado' }

    // Use admin client if RLS prevents update
    const { createAdminClient } = await import('@/lib/supabase/admin')
    const supabaseAdmin = createAdminClient()

    const { error } = await supabaseAdmin
      .from('chat_messages')
      .update({ is_read: true } as any)
      .eq('receiver_id', user.id)
      .eq('sender_id', senderId)
      .eq('is_read' as any, false)

    if (error) throw error

    return { success: true }
  } catch (err: unknown) {
    console.error('Exception in markMessagesAsRead:', err)
    return { error: err instanceof Error ? err.message : 'Error inesperado' }
  }
}

/**
 * Fetches the total count of unread messages for the current user.
 */
export async function getUnreadCount() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { count: 0 }

    const { count, error } = await supabase
      .from('chat_messages')
      .select('*', { count: 'exact', head: true })
      .eq('receiver_id', user.id)
      .eq('is_read' as any, false)

    if (error) throw error

    return { count: count || 0 }
  } catch (err: unknown) {
    console.error('Exception in getUnreadCount:', err)
    return { count: 0 }
  }
}
