import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Environment, NotificationTypeV2, SignedDataVerifier } from '@apple/app-store-server-library';

export const runtime = 'nodejs';

function adminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return url && key ? createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } }) : null;
}

function verifier() {
  const roots = process.env.APPLE_ROOT_CERTS_BASE64?.split(',').map((value) => Buffer.from(value.trim(), 'base64')).filter((value) => value.length > 0);
  const bundleId = process.env.APPLE_BUNDLE_ID;
  const appId = Number(process.env.APPLE_APP_ID);
  if (!roots?.length || !bundleId || !Number.isInteger(appId)) return null;
  return new SignedDataVerifier(roots, true, process.env.APPLE_NOTIFICATION_ENV === 'production' ? Environment.PRODUCTION : Environment.SANDBOX, bundleId, appId);
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null) as { signedPayload?: unknown } | null;
  if (!body || typeof body.signedPayload !== 'string') return NextResponse.json({ error: 'signedPayload requerido.' }, { status: 400 });
  const verify = verifier();
  if (!verify) return NextResponse.json({ error: 'Notificaciones de Apple no configuradas.' }, { status: 503 });
  let notification;
  try { notification = await verify.verifyAndDecodeNotification(body.signedPayload); }
  catch { return NextResponse.json({ error: 'Notificación de Apple no válida.' }, { status: 400 }); }

  const admin = adminClient();
  if (!admin) return NextResponse.json({ error: 'Servidor no configurado.' }, { status: 503 });
  const eventId = notification.notificationUUID || `${notification.signedDate || Date.now()}:${notification.notificationType || 'unknown'}`;
  const { error: duplicate } = await admin.from('billing_webhook_events').insert({ provider: 'app_store', event_id: eventId, event_type: notification.notificationType || 'unknown' });
  if (duplicate?.code === '23505') return NextResponse.json({ received: true, duplicate: true });
  if (duplicate) return NextResponse.json({ error: 'No se pudo registrar la notificación.' }, { status: 500 });

  const transaction = notification.data?.signedTransactionInfo ? await verify.verifyAndDecodeTransaction(notification.data.signedTransactionInfo).catch(() => null) : null;
  const transactionReference = transaction?.originalTransactionId || transaction?.transactionId;
  const revoke = [NotificationTypeV2.REFUND, NotificationTypeV2.REVOKE, NotificationTypeV2.EXPIRED, NotificationTypeV2.DID_FAIL_TO_RENEW].includes(notification.notificationType as NotificationTypeV2);
  if (transactionReference && revoke) {
    const { data: entitlement } = await admin.from('billing_entitlements').select('user_id').or(`provider_reference.eq.${transactionReference},provider_transaction_reference.eq.${transactionReference}`).maybeSingle();
    if (entitlement?.user_id) {
      await admin.from('billing_entitlements').update({ status: notification.notificationType === NotificationTypeV2.DID_FAIL_TO_RENEW ? 'past_due' : 'cancelled', updated_at: new Date().toISOString() }).eq('user_id', entitlement.user_id);
      await admin.from('profiles').update({ subscription_status: notification.notificationType === NotificationTypeV2.DID_FAIL_TO_RENEW ? 'past_due' : 'cancelled' }).eq('id', entitlement.user_id);
    }
  }
  return NextResponse.json({ received: true });
}
