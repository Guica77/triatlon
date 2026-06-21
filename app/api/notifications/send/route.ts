import { NextResponse } from 'next/server';
import webpush from 'web-push';
import { createClient } from '@/lib/supabase/server';
import { configureVapid } from '@/lib/notifications';

export async function POST(req: Request) {
  try {
    configureVapid();

    const payload = await req.json();
    // Payload should contain receiver_id, message_body, sender_name

    const { receiver_id, message_body, sender_name } = payload;

    if (!receiver_id) {
      return NextResponse.json({ error: 'Missing receiver_id' }, { status: 400 });
    }

    const supabase = await createClient();

    // 1. Get the receiver's push subscription from the database
    const { data: profile } = await supabase
      .from('profiles')
      .select('push_subscriptions, email')
      .eq('id', receiver_id)
      .single();

    if (!profile || !profile.push_subscriptions) {
      // 2. Fallback to Email if no push subscription exists!
      // Here you would trigger Resend to send an email.
      console.log(`No push token for ${receiver_id}. Triggering Email Fallback to ${profile?.email}...`);
      
      // Example Resend logic (Free tier 3000 emails/mo)
      // await resend.emails.send({ to: profile.email, subject: 'Nuevo Mensaje', text: ... })
      
      return NextResponse.json({ success: true, method: 'email_fallback' });
    }

    const pushSubscription = profile.push_subscriptions;

    // 3. Send Web Push Notification (100% Free)
    await webpush.sendNotification(
      pushSubscription as any,
      JSON.stringify({
        title: `Nuevo mensaje de ${sender_name || 'tu Coach'}`,
        body: message_body || 'Tienes un nuevo mensaje esperándote.',
        url: '/chat',
      })
    );

    return NextResponse.json({ success: true, method: 'web_push' });
  } catch (error) {
    console.error('Error sending push:', error);
    return NextResponse.json({ error: 'Server Error' }, { status: 500 });
  }
}
