import webpush from 'web-push';
import { createAdminClient } from '@/lib/supabase/admin';

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

    if (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
      webpush.setVapidDetails(
        process.env.VAPID_SUBJECT || 'mailto:support@triatlonpro.com',
        process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
        process.env.VAPID_PRIVATE_KEY
      );

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
