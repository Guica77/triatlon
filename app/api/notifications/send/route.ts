import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sendPushNotification } from '@/lib/notifications';

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const payload = await req.json().catch(() => null) as { message_id?: unknown } | null;
    const messageId = typeof payload?.message_id === 'string' ? payload.message_id : '';

    if (!messageId) {
      return NextResponse.json({ error: 'Falta message_id' }, { status: 400 });
    }

    const { data: message } = await supabase
      .from('chat_messages')
      .select('id, sender_id, receiver_id, message')
      .eq('id', messageId)
      .maybeSingle();

    if (!message) {
      return NextResponse.json({ error: 'Mensaje no encontrado' }, { status: 404 });
    }

    if (message.sender_id !== user.id) {
      return NextResponse.json({ error: 'No autorizado para notificar este mensaje' }, { status: 403 });
    }

    const sent = await sendPushNotification(message.receiver_id, {
      title: 'Nuevo mensaje en Triatlón Pro',
      body: message.message.slice(0, 240),
      url: '/chat',
    });

    return NextResponse.json({ success: sent, method: sent ? 'web_push' : 'unavailable' }, { status: sent ? 200 : 503 });
  } catch (error: unknown) {
    console.error('Error sending push:', error);
    return NextResponse.json({ error: 'No se pudo enviar la notificación' }, { status: 500 });
  }
}
