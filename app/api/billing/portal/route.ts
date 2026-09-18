import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

type StripeSubscription = { customer?: string | { id?: string } };
type StripePortalSession = { url?: string };

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Inicia sesión para continuar.' }, { status: 401 });

  const { data: entitlement } = await supabase
    .from('billing_entitlements')
    .select('source,provider_reference')
    .eq('user_id', user.id)
    .maybeSingle();
  if (entitlement?.source !== 'stripe' || !entitlement.provider_reference) {
    return NextResponse.json({ error: 'No hay una suscripción web que gestionar.' }, { status: 404 });
  }

  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) return NextResponse.json({ error: 'El portal de pago aún no está configurado.' }, { status: 503 });

  const subscriptionResponse = await fetch(`https://api.stripe.com/v1/subscriptions/${encodeURIComponent(entitlement.provider_reference)}`, {
    headers: { Authorization: `Bearer ${secret}` },
    cache: 'no-store',
  });
  const subscription = await subscriptionResponse.json() as StripeSubscription;
  const customer = typeof subscription.customer === 'string' ? subscription.customer : subscription.customer?.id;
  if (!subscriptionResponse.ok || !customer) {
    return NextResponse.json({ error: 'No se ha podido localizar la suscripción.' }, { status: 502 });
  }

  const origin = new URL(request.url).origin;
  const portalResponse = await fetch('https://api.stripe.com/v1/billing_portal/sessions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${secret}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ customer, return_url: `${origin}/settings?section=suscripcion` }),
  });
  const portal = await portalResponse.json() as StripePortalSession;
  if (!portalResponse.ok || !portal.url) {
    return NextResponse.json({ error: 'No se ha podido abrir la gestión de la suscripción.' }, { status: 502 });
  }
  return NextResponse.json({ url: portal.url });
}
