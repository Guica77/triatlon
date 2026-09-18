import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyStripeWebhook } from '@/lib/stripe-webhook';
import { isBillingPlan } from '@/lib/billing';

type StripeObject = {
  id: string;
  status?: string;
  client_reference_id?: string | null;
  metadata?: Record<string, string>;
  subscription?: string | { id: string } | null;
  current_period_end?: number;
  trial_end?: number | null;
  customer?: string | { id?: string } | null;
};

type StripeEvent = { type: string; data: { object: StripeObject } };

const acceptedStatuses = new Set(['trialing', 'active', 'past_due', 'canceled', 'unpaid']);

function billingStatus(status?: string) {
  if (status === 'canceled') return 'cancelled';
  if (status === 'unpaid') return 'past_due';
  return acceptedStatuses.has(status || '') ? status! : 'expired';
}

export async function POST(request: NextRequest) {
  const payload = await request.text();
  const secret = process.env.STRIPE_WEBHOOK_SECRET || '';
  const valid = await verifyStripeWebhook(payload, request.headers.get('stripe-signature'), secret);
  if (!valid) return NextResponse.json({ error: 'Firma de Stripe no válida.' }, { status: 400 });

  const event = JSON.parse(payload) as StripeEvent;
  if (!event?.type || !event?.data?.object?.id) return NextResponse.json({ error: 'Evento no válido.' }, { status: 400 });
  const object = event.data.object;
  const isCheckout = event.type === 'checkout.session.completed';
  const isSubscription = event.type.startsWith('customer.subscription.');
  const isRefund = event.type === 'charge.refunded' || event.type === 'refund.updated';
  const isPaymentFailure = event.type === 'invoice.payment_failed';
  if (!isCheckout && !isSubscription && !isRefund && !isPaymentFailure) return NextResponse.json({ received: true });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  if (!supabaseUrl || !serviceKey) return NextResponse.json({ error: 'Servidor no configurado.' }, { status: 503 });
  const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { error: eventError } = await admin.from('billing_webhook_events').insert({ provider: 'stripe', event_id: object.id, event_type: event.type });
  if (eventError?.code === '23505') return NextResponse.json({ received: true, duplicate: true });
  if (eventError) return NextResponse.json({ error: 'No se pudo registrar el evento.' }, { status: 500 });
  const customerReference = typeof object.customer === 'string' ? object.customer : object.customer?.id || null;
  const providerReference = typeof object.subscription === 'string' ? object.subscription : object.subscription?.id || object.id;
  let userId = object.metadata?.user_id || object.client_reference_id;
  const plan = object.metadata?.plan;
  if (!userId) {
    const { data } = await admin.from('billing_entitlements').select('user_id,plan').or(`provider_reference.eq.${providerReference},provider_customer_reference.eq.${customerReference || 'none'}`).maybeSingle();
    userId = data?.user_id;
  }
  const { data: current } = userId ? await admin.from('billing_entitlements').select('plan').eq('user_id', userId).maybeSingle() : { data: null };
  const resolvedPlan = isBillingPlan(plan) ? plan : current?.plan;
  if (!userId || !isBillingPlan(resolvedPlan)) return NextResponse.json({ received: true });
  const shouldRevoke = isRefund || event.type === 'customer.subscription.deleted';
  const nextStatus = shouldRevoke ? 'cancelled' : isPaymentFailure ? 'past_due' : (isCheckout ? 'trialing' : billingStatus(object.status));
  const { error } = await admin.from('billing_entitlements').upsert({
    user_id: userId,
    plan: resolvedPlan,
    source: 'stripe',
    status: nextStatus,
    trial_ends_at: object.trial_end ? new Date(object.trial_end * 1000).toISOString() : null,
    period_ends_at: object.current_period_end ? new Date(object.current_period_end * 1000).toISOString() : null,
    provider_reference: providerReference,
    provider_customer_reference: customerReference,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id' });
  if (error) return NextResponse.json({ error: 'No se pudo actualizar el acceso.' }, { status: 500 });

  await admin.from('profiles').update({ subscription_status: nextStatus }).eq('id', userId);
  return NextResponse.json({ received: true });
}
