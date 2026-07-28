import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { aiChatStreamToResponse, isAIAvailable, getAIStatus } from '@/lib/ai-service';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return Response.json(
        { error: 'No autorizado. Inicia sesión para usar el asistente IA.' },
        { status: 401 }
      );
    }

    // 2. Parse request
    const body = await request.json();
    const { messages, contextType = 'general', sportType, durationMin } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return Response.json(
        { error: 'Se requiere al menos un mensaje.' },
        { status: 400 }
      );
    }

    // 3. Check AI availability
    if (!isAIAvailable()) {
      const status = getAIStatus();
      return Response.json(
        {
          error: status.reason,
          fallback: true,
          available: false,
          provider: status.provider,
        },
        { status: 503 }
      );
    }

    // 4. Build system prompt based on context
    let systemPrompt = 'Eres un asistente experto en triatlón y entrenamiento deportivo. Respondes en español de forma clara y concisa.';

    if (contextType === 'nutrition') {
      // Fetch nutrition context
      const { data: profile } = await supabase
        .from('profiles')
        .select('first_name, last_name, current_weight, preferred_ingredients, disliked_ingredients, allergies')
        .eq('id', user.id)
        .single();

      const name = profile?.first_name || 'Atleta';
      const weight = profile?.current_weight || 72;
      const preferredIngredients = profile?.preferred_ingredients || [];
      const dislikedIngredients = profile?.disliked_ingredients || [];
      const allergies = profile?.allergies || [];

      systemPrompt = `Eres un nutricionista deportivo experto en triatlón. Respondes en español.

## CONTEXTO DEL ATLETA
- Atleta: ${name}
- Peso: ${weight} kg
- Ingredientes preferidos: ${preferredIngredients.join(', ') || 'Sin preferencias'}
- Ingredientes a evitar: ${dislikedIngredients.join(', ') || 'Ninguno'}
${allergies.length > 0 ? `- Alergias: ${allergies.join(', ')}` : ''}

## INSTRUCCIONES
1. Proporciona consejos específicos y prácticos.
2. Si preguntan por comidas, sugiere opciones realistas.
3. Incluye timing nutricional si aplica.
4. Sé conciso: máximo 3-4 párrafos.`;
    } else if (contextType === 'coach') {
      // Fetch athlete context for coaching
      const { data: profile } = await supabase
        .from('profiles')
        .select('first_name, last_name')
        .eq('id', user.id)
        .single();

      systemPrompt = `Eres un entrenador de triatlón experto. Respondes en español.

## INSTRUCCIONES
1. Proporciona consejos de entrenamiento específicos y basados en principios de periodización.
2. Siempre prioriza la recuperación sobre la carga cuando sea necesario.
3. Si no tienes suficientes datos, dilo explícitamente.
4. Máximo 3 párrafos.`;
    }

    // 5. Stream response
    const stream = await aiChatStreamToResponse(systemPrompt, messages, {
      temperature: 0.7,
      maxTokens: 2048,
    });

    // 6. Return streaming response
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'X-Accel-Buffering': 'no',
      },
    });
  } catch (error: any) {
    console.error('[AI Chat API] Error:', error);
    return Response.json(
      { error: 'Error interno del servidor al procesar la solicitud.' },
      { status: 500 }
    );
  }
}