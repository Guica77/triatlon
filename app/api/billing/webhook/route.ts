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
  const object = event.data.object;
  const userId = object.metadata?.user_id || object.client_reference_id;
  const plan = object.metadata?.plan;
  if (!userId || !isBillingPlan(plan)) return NextResponse.json({ received: true });

  const isCheckout = event.type === 'checkout.session.completed';
  const isSubscription = event.type.startsWith('customer.subscription.');
  if (!isCheckout && !isSubscription) return NextResponse.json({ received: true });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  if (!supabaseUrl || !serviceKey) return NextResponse.json({ error: 'Servidor no configurado.' }, { status: 503 });
  const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const providerReference = typeof object.subscription === 'string' ? object.subscription : object.subscription?.id || object.id;
  const { error } = await admin.from('billing_entitlements').upsert({
    user_id: userId,
    plan,
    source: 'stripe',
    status: isCheckout ? 'trialing' : billingStatus(object.status),
    trial_ends_at: object.trial_end ? new Date(object.trial_end * 1000).toISOString() : null,
    period_ends_at: object.current_period_end ? new Date(object.current_period_end * 1000).toISOString() : null,
    provider_reference: providerReference,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id' });
  if (error) return NextResponse.json({ error: 'No se pudo actualizar el acceso.' }, { status: 500 });

  await admin.from('profiles').update({ subscription_status: isCheckout ? 'trialing' : billingStatus(object.status) }).eq('id', userId);
  return NextResponse.json({ received: true });
}
