import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const subscription = await req.json();

    if (!subscription || !subscription.endpoint) {
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
  } catch (error) {
    console.error('Subscription error:', error);
    return NextResponse.json({ error: 'Error de servidor' }, { status: 500 });
  }
}
