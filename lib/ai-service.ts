/**
 * AI Service — Central facade for all LLM operations.
 *
 * DESIGN:
 * - Default: Google Gemini (FREE tier — 60 req/min, ~1500 req/day)
 * - Optional: Anthropic Claude if ANTHROPIC_API_KEY is set
 * - Graceful fallback to rule-based logic when no API is available
 * - All user-facing text in Spanish
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
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
        model: process.env.GEMINI_MODEL || 'gemini-2.0-flash',
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
        model: process.env.GEMINI_MODEL || 'gemini-2.0-flash',
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

  if (!gemini) {
    return new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode(JSON.stringify({ error: 'IA no disponible. Configura GEMINI_API_KEY en .env.local para activarla.', fallback: true })));
        controller.close();
      },
    });
  }

  return new ReadableStream({
    async start(controller) {
      try {
        const model = gemini!.getGenerativeModel({
          model: process.env.GEMINI_MODEL || 'gemini-2.0-flash',
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
            controller.enqueue(encoder.encode(text));
          }
        }

        controller.close();
      } catch (error: any) {
        controller.enqueue(encoder.encode(JSON.stringify({ error: error?.message || 'Error de streaming' })));
        controller.close();
      }
    },
  });
}