import { NextResponse } from 'next/server';
import webpush from 'web-push';
import { configureVapid } from '@/lib/notifications';

export async function POST(req: Request) {
  try {
    if (!configureVapid()) {
      throw new Error('VAPID keys missing or invalid on server');
    }

    const { subscription, payload } = await req.json();

    if (!subscription || !subscription.endpoint) {
      return NextResponse.json({ error: 'Suscripción inválida' }, { status: 400 });
    }

    await webpush.sendNotification(
      subscription,
      JSON.stringify(payload)
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error sending test push:', error);
    return NextResponse.json({ 
      error: error.message || 'Server Error',
      statusCode: error.statusCode || null,
      body: error.body || null
    }, { status: 500 });
  }
}
