import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

function isValidPushSubscription(value: unknown): value is {
  endpoint: string;
  expirationTime?: number | null;
  keys: { p256dh: string; auth: string };
} {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Record<string, unknown>;
  const keys = candidate.keys as Record<string, unknown> | undefined;

  if (typeof candidate.endpoint !== 'string' || candidate.endpoint.length > 2048) return false;
  try {
    if (new URL(candidate.endpoint).protocol !== 'https:') return false;
  } catch {
    return false;
  }

  return Boolean(
    keys
    && typeof keys.p256dh === 'string'
    && keys.p256dh.length > 0
    && keys.p256dh.length <= 512
    && typeof keys.auth === 'string'
    && keys.auth.length > 0
    && keys.auth.length <= 512
  );
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const subscription = await req.json();

    if (!isValidPushSubscription(subscription)) {
      return NextResponse.json({ error: 'Suscripción inválida' }, { status: 400 });
    }

    // Upsert the subscription into the user's profile
    // Assuming we added a push_subscriptions JSONB column to profiles
    const { error } = await supabase
      .from('profiles')
      .update({ 
        push_subscriptions: subscription 
      })
      .eq('id', user.id);

    if (error) {
      console.error('Error saving subscription:', error);
      return NextResponse.json({ error: 'Error al guardar la suscripción' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('Subscription error:', error);
    return NextResponse.json({ error: 'Error de servidor' }, { status: 500 });
  }
}
