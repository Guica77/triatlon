import webpush from 'web-push';
import { createAdminClient } from '@/lib/supabase/admin';

export function configureVapid(): boolean {
  let publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  let privateKey = process.env.VAPID_PRIVATE_KEY;
  let subject = process.env.VAPID_SUBJECT || 'mailto:support@triatlonpro.com';

  if (!publicKey || !privateKey) {
    return false;
  }

  // Clean keys (trim and strip quotes/whitespace)
  publicKey = publicKey.trim().replace(/^['"]|['"]$/g, '');
  privateKey = privateKey.trim().replace(/^['"]|['"]$/g, '');
  subject = subject.trim().replace(/^['"]|['"]$/g, '');

  try {
    webpush.setVapidDetails(subject, publicKey, privateKey);
    return true;
  } catch (error) {
    console.error('Failed to set VAPID details:', error);
    return false;
  }
}

export async function sendPushNotification(
  userId: string, 
  payload: { title: string; body: string; url?: string }
): Promise<boolean> {
  try {
    const supabase = createAdminClient();
    const { data: profile } = await supabase
      .from('profiles')
      .select('push_subscriptions')
      .eq('id', userId)
      .single();

    if (!profile || !profile.push_subscriptions) {
      console.log(`No push subscription found for user ${userId}`);
      return false;
    }

    if (configureVapid()) {
      await webpush.sendNotification(
        profile.push_subscriptions as any,
        JSON.stringify(payload)
      );
      console.log(`Push notification sent successfully to user ${userId}`);
      return true;
    } else {
      console.warn("VAPID keys not configured in environment.");
      return false;
    }
  } catch (error: any) {
    console.error(`Error sending push notification to user ${userId}:`, error);
    
    // Clear invalid/expired subscription token
    if (error.statusCode === 410 || error.statusCode === 403 || error.statusCode === 400) {
      const supabase = createAdminClient();
      await supabase
        .from('profiles')
        .update({ push_subscriptions: null })
        .eq('id', userId);
      console.log(`Cleared invalid push subscription for user ${userId} (status ${error.statusCode})`);
    }
    return false;
  }
}
