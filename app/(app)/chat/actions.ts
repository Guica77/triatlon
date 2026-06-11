'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import webpush from 'web-push'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY || 're_dummy_key')

// Set VAPID Details
webpush.setVapidDetails(
  process.env.VAPID_SUBJECT || 'mailto:support@triatlonpro.com',
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '',
  process.env.VAPID_PRIVATE_KEY || ''
)

export interface ChatMessageItem {
  id: string
  sender_id: string
  receiver_id: string
  message: string
  created_at: string
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
export async function sendMessage(receiverId: string, message: string): Promise<{ data?: ChatMessageItem; error?: string }> {
  if (!message || !message.trim()) {
    return { error: 'El mensaje no puede estar vacío' }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'No autorizado' }
  }

  try {
    const { data: newMessage, error } = await supabase
      .from('chat_messages')
      .insert({
        sender_id: user.id,
        receiver_id: receiverId,
        message: message.trim(),
      })
      .select('*')
      .single()

    if (error) {
      console.error('Error inserting chat message:', error)
      return { error: 'Error al enviar el mensaje' }
    }

    // --- PUSH NOTIFICATION TRIGGER ---
    try {
      const { data: receiverProfile } = await supabase
        .from('profiles')
        .select('push_subscriptions, first_name, email')
        .eq('id', receiverId)
        .single()

      if (receiverProfile && receiverProfile.push_subscriptions) {
        // Fetch sender name for the notification
        const { data: senderProfile } = await supabase
          .from('profiles')
          .select('first_name')
          .eq('id', user.id)
          .single()

        const senderName = senderProfile?.first_name || 'Alguien'

        await webpush.sendNotification(
          receiverProfile.push_subscriptions as any,
          JSON.stringify({
            title: `Nuevo mensaje de ${senderName}`,
            body: message.trim(),
            url: '/chat',
          })
        )
      } else {
        // Trigger Resend email fallback
        console.log(`No push token for ${receiverId}. Triggering Email Fallback...`);
        if (receiverProfile?.email) {
          try {
            await resend.emails.send({
              from: 'Triatlon Pro Notificaciones <onboarding@resend.dev>',
              to: receiverProfile.email,
              subject: `Nuevo mensaje de ${user.email}`,
              html: `<div style="font-family: sans-serif; padding: 20px;">
                      <h2>Tienes un nuevo mensaje en Triatlón Pro</h2>
                      <p><strong>Mensaje:</strong> "${message.trim()}"</p>
                      <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/chat" style="display: inline-block; padding: 10px 20px; background-color: #22d3ee; color: #000; text-decoration: none; border-radius: 5px; font-weight: bold;">Ver en el Chat</a>
                    </div>`
            });
            console.log(`Email fallback sent successfully to ${receiverProfile.email}`);
          } catch (emailErr) {
            console.error('Error sending fallback email:', emailErr);
          }
        }
      }
    } catch (pushErr) {
      console.error('Error triggering push notification:', pushErr)
      // We don't return error here because the message was successfully saved
    }

    return { data: newMessage as any }
  } catch (err: any) {
    console.error('Exception in sendMessage:', err)
    return { error: err.message || 'Error inesperado' }
  }
}

/**
 * Fetches the conversation history between the current user and another user.
 */
export async function getMessages(otherUserId: string): Promise<{ data?: ChatMessageItem[]; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'No autorizado' }
  }

  try {
    const { data: messages, error } = await supabase
      .from('chat_messages')
      .select('*')
      .or(`and(sender_id.eq.${user.id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${user.id})`)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching chat history:', error)
      return { error: 'Error al obtener el historial de mensajes' }
    }

    return { data: messages as any }
  } catch (err: any) {
    console.error('Exception in getMessages:', err)
    return { error: err.message || 'Error inesperado' }
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

    if (currentRole === 'coach') {
      // Fetch athletes connected in roster
      const { data: links } = await supabase
        .from('coach_athletes')
        .select('athlete_id')
        .eq('coach_id', user.id)

      if (!links || links.length === 0) {
        return { data: [], role: 'coach' }
      }

      const athleteIds = links.map(l => l.athlete_id)

      const { data: athletes, error: athletesError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email, role')
        .in('id', athleteIds)

      if (athletesError) {
        console.error('Error fetching coach athletes for chat:', athletesError)
        return { error: 'Error al obtener atletas' }
      }

      return { data: athletes, role: 'coach' }
    } else {
      // Fetch coach details
      // Attempt 1: coach_id from profiles
      let coachId = (profile as any).coach_id

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
        return { data: [], role: 'athlete' }
      }

      const { data: coach, error: coachError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email, role')
        .eq('id', coachId)
        .single()

      if (coachError) {
        console.error('Error fetching coach profile for chat:', coachError)
        return { error: 'Error al obtener datos del entrenador' }
      }

      return { data: [coach], role: 'athlete' }
    }
  } catch (err: any) {
    console.error('Exception in getChatParticipants:', err)
    return { error: err.message || 'Error inesperado' }
  }
}
