import { NextResponse } from 'next/server';
import webpush from 'web-push';

export async function POST(req: Request) {
  try {
    if (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
      webpush.setVapidDetails(
        process.env.VAPID_SUBJECT || 'mailto:support@triatlonpro.com',
        process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
        process.env.VAPID_PRIVATE_KEY
      );
    } else {
      throw new Error('VAPID keys missing on server');
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
