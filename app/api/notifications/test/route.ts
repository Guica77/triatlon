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

    const sent = await sendPushNotification(user.id, {
      title: '¡Prueba exitosa! 🎉',
      body: 'Las notificaciones push están funcionando correctamente en tu dispositivo.',
      url: '/settings',
    });

    if (!sent) {
      return NextResponse.json(
        { error: 'No hay una suscripción push válida o el servicio no está configurado.' },
        { status: 503 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('Error sending test push:', error);
    return NextResponse.json({ error: 'No se pudo enviar la notificación de prueba.' }, { status: 500 });
  }
}
