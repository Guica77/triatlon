/**
 * AI Service — Central facade for all LLM operations.
 *
 * DESIGN:
 * - Default: Google Gemini (FREE tier — 60 req/min, ~1500 req/day)
 * - Optional: Anthropic Claude if ANTHROPIC_API_KEY is set
 * - Graceful fallback to rule-based logic when no API is available
 * - All user-facing text in Spanish
 */

import { GoogleGenerativeAI, type EmbedContentRequest } from '@google/generative-ai';
import Anthropic from '@anthropic-ai/sdk';

// ============================================================
// Types
// ============================================================

export interface AIChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface AIServiceResult {
  content: string;
  success: boolean;
  source: 'gemini' | 'anthropic' | 'fallback';
  error?: string;
}

export interface AIStreamCallbacks {
  onToken: (token: string) => void;
  onDone: (fullText: string) => void;
  onError: (error: string) => void;
}

// ============================================================
// Gemini (Default — FREE)
// ============================================================

let geminiClient: GoogleGenerativeAI | null = null;
let anthropicClient: Anthropic | null = null;

function getGeminiClient(): GoogleGenerativeAI | null {
  if (geminiClient) return geminiClient;

  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENAI_API_KEY;
  if (!apiKey || apiKey === '' || apiKey === 'tu-gemini-api-key') {
    return null;
  }

  try {
    geminiClient = new GoogleGenerativeAI(apiKey);
    return geminiClient;
  } catch {
    return null;
  }
}

function getAnthropicClient(): Anthropic | null {
  if (anthropicClient) return anthropicClient;

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || apiKey === '' || apiKey.startsWith('sk-ant-...')) {
    return null;
  }

  try {
    anthropicClient = new Anthropic({ apiKey });
    return anthropicClient;
  } catch {
    return null;
  }
}

export function isAIAvailable(): boolean {
  return getGeminiClient() !== null || getAnthropicClient() !== null;
}

export async function generateAIEmbedding(value: string): Promise<number[] | null> {
  const text = value.trim().slice(0, 4000)
  if (!text) return null

  const gemini = getGeminiClient()
  if (!gemini) return null

  try {
    const model = gemini.getGenerativeModel({
      model: process.env.GEMINI_EMBEDDING_MODEL || 'gemini-embedding-001',
    })
    const request: EmbedContentRequest & { outputDimensionality: number } = {
      content: { role: 'user', parts: [{ text }] },
      outputDimensionality: 768,
    }
    const result = await model.embedContent(request)
    const embedding = result.embedding.values
    if (embedding.length !== 768 || embedding.some(value => !Number.isFinite(value))) return null
    const norm = Math.hypot(...embedding)
    return norm > 0 ? embedding.map(value => value / norm) : null
  } catch (error: any) {
    console.error('[ai-service] Embedding error:', error?.message)
    return null
  }
}

export function getAIStatus(): { available: boolean; reason: string | null; provider: string } {
  if (getGeminiClient()) {
    return { available: true, reason: null, provider: 'gemini' };
  }
  if (getAnthropicClient()) {
    return { available: true, reason: null, provider: 'anthropic' };
  }
  return {
    available: false,
    reason: 'No hay API key de IA configurada. Las funciones funcionan en modo offline con reglas expertas.',
    provider: 'none',
  };
}

// ============================================================
// Chat (non-streaming)
// ============================================================

export async function aiChat(
  systemPrompt: string,
  messages: AIChatMessage[],
  options?: { temperature?: number; maxTokens?: number }
): Promise<AIServiceResult> {
  // Try Gemini first (free)
  const gemini = getGeminiClient();
  if (gemini) {
    try {
      const model = gemini.getGenerativeModel({
        model: process.env.GEMINI_MODEL || 'gemini-3.6-flash',
        systemInstruction: systemPrompt,
        generationConfig: {
          temperature: options?.temperature ?? 0.7,
          maxOutputTokens: options?.maxTokens || 1024,
        },
      });

      const result = await model.generateContent({
        contents: messages.map(m => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: m.content }],
        })),
      });

      const text = result.response.text();
      if (text) {
        return { content: text, success: true, source: 'gemini' };
      }
    } catch (error: any) {
      console.error('[ai-service] Gemini error:', error?.message);
      // Fall through to Anthropic or fallback
    }
  }

  // Try Anthropic as secondary option
  const anthropic = getAnthropicClient();
  if (anthropic) {
    const maxRetries = 1;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const response = await anthropic.messages.create({
          model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-5-20250601',
          max_tokens: options?.maxTokens || 1024,
          temperature: options?.temperature ?? 0.7,
          system: systemPrompt,
          messages: messages.map(m => ({ role: m.role, content: m.content })),
        });

        const text = response.content
          .filter((block): block is Anthropic.TextBlock => block.type === 'text')
          .map(block => block.text)
          .join('');

        if (text) {
          return { content: text, success: true, source: 'anthropic' };
        }
      } catch (error: any) {
        if (attempt < maxRetries) {
          await new Promise(r => setTimeout(r, 1000));
          continue;
        }
        console.error('[ai-service] Anthropic error:', error?.message);
      }
    }
  }

  return {
    content: '',
    success: false,
    source: 'fallback',
    error: 'No hay API de IA configurada. Usando modo offline.',
  };
}

// ============================================================
// Streaming Chat
// ============================================================

export async function aiChatStreaming(
  systemPrompt: string,
  messages: AIChatMessage[],
  callbacks: AIStreamCallbacks,
  options?: { temperature?: number; maxTokens?: number }
): Promise<void> {
  const gemini = getGeminiClient();
  if (gemini) {
    try {
      const model = gemini.getGenerativeModel({
        model: process.env.GEMINI_MODEL || 'gemini-3.6-flash',
        systemInstruction: systemPrompt,
        generationConfig: {
          temperature: options?.temperature ?? 0.7,
          maxOutputTokens: options?.maxTokens || 2048,
        },
      });

      const stream = await model.generateContentStream({
        contents: messages.map(m => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: m.content }],
        })),
      });

      let fullText = '';
      for await (const chunk of stream.stream) {
        const text = chunk.text();
        if (text) {
          fullText += text;
          callbacks.onToken(text);
        }
      }
      callbacks.onDone(fullText);
      return;
    } catch (error: any) {
      console.error('[ai-service] Gemini streaming error:', error?.message);
      callbacks.onError('Error al conectar con la IA.');
      return;
    }
  }

  // Try Anthropic streaming as fallback
  const anthropic = getAnthropicClient();
  if (anthropic) {
    try {
      const stream = await anthropic.messages.create({
        model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-5-20250601',
        max_tokens: options?.maxTokens || 2048,
        temperature: options?.temperature ?? 0.7,
        system: systemPrompt,
        messages: messages.map(m => ({ role: m.role, content: m.content })),
        stream: true,
      });

      let fullText = '';
      for await (const event of stream) {
        if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
          fullText += event.delta.text;
          callbacks.onToken(event.delta.text);
        }
      }
      callbacks.onDone(fullText);
      return;
    } catch (error: any) {
      console.error('[ai-service] Anthropic streaming error:', error?.message);
      callbacks.onError('Error al conectar con la IA.');
      return;
    }
  }

  callbacks.onError('No hay API de IA configurada. Usando modo offline.');
}

// ============================================================
// API Route Streaming Helper
// ============================================================

export async function aiChatStreamToResponse(
  systemPrompt: string,
  messages: AIChatMessage[],
  options?: { temperature?: number; maxTokens?: number }
): Promise<ReadableStream> {
  const encoder = new TextEncoder();
  const gemini = getGeminiClient();
  const anthropic = getAnthropicClient();

  return new ReadableStream({
    async start(controller) {
      let closed = false;
      let emittedToken = false;

      const close = () => {
        if (!closed) {
          closed = true;
          controller.close();
        }
      };

      const sendError = (message: string, fallback = false) => {
        if (closed) return;
        controller.enqueue(encoder.encode(JSON.stringify({ error: message, ...(fallback ? { fallback: true } : {}) })));
        close();
      };

      const streamAnthropic = async (): Promise<boolean> => {
        if (!anthropic) return false;

        try {
          const stream = await anthropic.messages.create({
            model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-5-20250601',
            max_tokens: options?.maxTokens || 2048,
            temperature: options?.temperature ?? 0.7,
            system: systemPrompt,
            messages: messages.map(m => ({ role: m.role, content: m.content })),
            stream: true,
          });

          for await (const event of stream) {
            if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
              emittedToken = true;
              controller.enqueue(encoder.encode(event.delta.text));
            }
          }

          return true;
        } catch (error: any) {
          console.error('[ai-service] Anthropic streaming error:', error?.message);
          return false;
        }
      };

      if (gemini) {
        try {
          const model = gemini.getGenerativeModel({
            model: process.env.GEMINI_MODEL || 'gemini-3.6-flash',
            systemInstruction: systemPrompt,
            generationConfig: {
              temperature: options?.temperature ?? 0.7,
              maxOutputTokens: options?.maxTokens || 2048,
            },
          });

          const stream = await model.generateContentStream({
            contents: messages.map(m => ({
              role: m.role === 'assistant' ? 'model' : 'user',
              parts: [{ text: m.content }],
            })),
          });

          for await (const chunk of stream.stream) {
            const text = chunk.text();
            if (text) {
              emittedToken = true;
              controller.enqueue(encoder.encode(text));
            }
          }

          close();
          return;
        } catch (error: any) {
          console.error('[ai-service] Gemini streaming error:', error?.message);
          // Do not append a second answer after partial Gemini output. Retry with
          // Anthropic only when Gemini failed before emitting any user-visible text.
          if (emittedToken) {
            sendError('La IA interrumpió la respuesta. Inténtalo de nuevo.');
            return;
          }
        }
      }

      if (await streamAnthropic()) {
        close();
        return;
      }

      sendError(
        gemini || anthropic
          ? 'No se pudo completar la respuesta de la IA.'
          : 'No hay API de IA configurada. Usando modo offline.',
        !gemini && !anthropic,
      );
    },
  });
}
