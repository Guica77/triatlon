import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { BILLING_PLANS, isBillingPlan } from '@/lib/billing';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Inicia sesión para continuar.' }, { status: 401 });

  const body: unknown = await request.json().catch(() => null);
  const plan = typeof body === 'object' && body !== null ? (body as { plan?: unknown }).plan : null;
  if (!isBillingPlan(plan)) return NextResponse.json({ error: 'Plan no válido.' }, { status: 400 });

  const { data: existingEntitlement } = await supabase
    .from('billing_entitlements')
    .select('source,status,trial_ends_at')
    .eq('user_id', user.id)
    .maybeSingle();
  if (existingEntitlement?.source === 'stripe' && ['trialing', 'active', 'past_due'].includes(existingEntitlement.status)) {
    return NextResponse.json({ error: 'Ya tienes una suscripción. Utiliza “Gestionar suscripción” para cambiarla o cancelarla.' }, { status: 409 });
  }

  const price = process.env[BILLING_PLANS[plan].priceEnv];
  const secret = process.env.STRIPE_SECRET_KEY;
  if (!price || !secret) return NextResponse.json({ error: 'El cobro seguro aún no está configurado.' }, { status: 503 });

  const origin = new URL(request.url).origin;
  const form = new URLSearchParams({
    mode: 'subscription', 'line_items[0][price]': price, 'line_items[0][quantity]': '1',
    'client_reference_id': user.id,
    'customer_email': user.email || '',
    'metadata[user_id]': user.id,
    'metadata[plan]': plan,
    'subscription_data[metadata][user_id]': user.id,
    'subscription_data[metadata][plan]': plan,
    success_url: `${origin}/settings?section=suscripcion&checkout=success`,
    cancel_url: `${origin}/settings?section=suscripcion&checkout=cancelled`,
  });
  if (!existingEntitlement) form.set('subscription_data[trial_period_days]', '7');
  const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST', headers: { Authorization: `Bearer ${secret}`, 'Content-Type': 'application/x-www-form-urlencoded' }, body: form,
  });
  const data = await response.json() as { url?: string };
  if (!response.ok || !data.url) return NextResponse.json({ error: 'No se ha podido iniciar el pago seguro.' }, { status: 502 });
  return NextResponse.json({ url: data.url });
}
