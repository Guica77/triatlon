import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isAuthorizedCronRequest } from '@/lib/cron-auth';
import { processQueuedStravaEvent, type StravaWebhookEvent } from '@/app/api/webhooks/telemetry/route';

export async function GET(request: NextRequest) {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const supabase = createAdminClient();
  const { data: events, error } = await (supabase as any)
    .from('strava_webhook_events')
    .select('id, payload, attempts')
    .in('status', ['pending', 'failed'])
    .lte('next_attempt_at', new Date().toISOString())
    .lt('attempts', 5)
    .order('received_at', { ascending: true })
    .limit(10);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let completed = 0;
  for (const event of events || []) {
    if (await processQueuedStravaEvent(event.id, event.payload as StravaWebhookEvent, event.attempts || 0)) {
      completed += 1;
    }
  }

  return NextResponse.json({ processed: events?.length || 0, completed });
}
