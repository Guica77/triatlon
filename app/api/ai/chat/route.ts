import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  aiChatStreamToResponse,
  generateAIEmbedding,
  getAIStatus,
  isAIAvailable,
} from '@/lib/ai-service';
import {
  appendAIContextToPrompt,
  buildAIContext,
  resolveAthleteTarget,
  validateAthleteId,
  validateAIChatMessages,
  validateDurationMinutes,
  validateSportType,
} from '@/lib/ai-context';

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

    // 2. Parse and validate the request before loading any private context.
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return Response.json(
        { error: 'El cuerpo de la solicitud no es un JSON válido.' },
        { status: 400 }
      );
    }

    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return Response.json(
        { error: 'El cuerpo de la solicitud debe ser un objeto JSON.' },
        { status: 400 }
      );
    }

    const payload = body as Record<string, unknown>;
    const contextType = payload.contextType === undefined ? 'general' : payload.contextType;
    const sportType = validateSportType(payload.sportType);
    const durationMin = validateDurationMinutes(payload.durationMin);
    const requestedAthleteId = validateAthleteId(payload.athleteId);
    const validatedMessages = validateAIChatMessages(payload.messages);

    if (!['general', 'nutrition', 'coach'].includes(String(contextType))) {
      return Response.json(
        { error: 'El tipo de contexto no es válido.' },
        { status: 400 }
      );
    }
    if (sportType === undefined) {
      return Response.json(
        { error: 'El deporte indicado no es válido.' },
        { status: 400 }
      );
    }
    if (durationMin === undefined) {
      return Response.json(
        { error: 'La duración debe estar entre 1 y 1440 minutos.' },
        { status: 400 }
      );
    }
    if (requestedAthleteId === undefined) {
      return Response.json(
        { error: 'El identificador del atleta no es válido.' },
        { status: 400 }
      );
    }
    if (!validatedMessages.ok) {
      return Response.json(
        { error: validatedMessages.error },
        { status: 400 }
      );
    }

    const { data: requesterProfile, error: requesterProfileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    if (requesterProfileError || !requesterProfile) {
      return Response.json(
        { error: 'No se pudo verificar el perfil del usuario.' },
        { status: 403 }
      );
    }

    // Resolve the target only from the authenticated role and active relationships.
    const targetResult = await resolveAthleteTarget(
      supabase,
      user.id,
      requesterProfile.role,
      requestedAthleteId,
    );
    if (!targetResult.target) {
      return Response.json(
        { error: targetResult.error || 'No autorizado para consultar este contexto.' },
        { status: 403 }
      );
    }

    const messages = validatedMessages.messages;
    const lastUserMessage = [...messages].reverse().find(message => message.role === 'user');
    if (!lastUserMessage) {
      return Response.json(
        { error: 'Se requiere al menos un mensaje del atleta o entrenador.' },
        { status: 400 }
      );
    }

    // Check provider availability only after complete request validation and authorization.
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

    // 3. Build system prompt based on context
    const queryEmbedding = await generateAIEmbedding(lastUserMessage.content);
    const athleteContext = await buildAIContext(supabase, {
      athleteId: targetResult.target.athleteId,
      query: lastUserMessage.content,
      sportType,
      queryEmbedding,
    });

    let systemPrompt = 'Eres un asistente experto en triatlón y entrenamiento deportivo. Respondes en español de forma clara y concisa.';

    if (contextType === 'nutrition') {
      systemPrompt = `Eres un nutricionista deportivo experto en triatlón. Respondes en español.

## INSTRUCCIONES
1. Proporciona consejos específicos y prácticos basados en los datos autorizados del atleta.
2. Si preguntan por comidas, sugiere opciones realistas y respeta alergias y preferencias registradas.
3. Incluye timing nutricional si aplica.
4. Sé conciso: máximo 3-4 párrafos.`;
    } else if (contextType === 'coach') {
      systemPrompt = `Eres un entrenador de triatlón experto. Respondes en español.

## INSTRUCCIONES
1. Proporciona consejos de entrenamiento específicos y basados en principios de periodización.
2. Siempre prioriza la recuperación sobre la carga cuando sea necesario.
3. Si no tienes suficientes datos, dilo explícitamente.
4. Máximo 3 párrafos.`;
    }

    if (durationMin !== null) {
      systemPrompt += `\n\n## DATO DE LA CONSULTA\nLa duración relevante indicada por el usuario es de ${durationMin} minutos.`;
    }

    systemPrompt = appendAIContextToPrompt(systemPrompt, athleteContext);

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