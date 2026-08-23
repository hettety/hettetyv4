/**
 * OpenAI-compatible provider.
 *
 * One adapter covers NVIDIA NIM, OpenRouter, Together, DeepInfra, Groq, Mistral,
 * local vLLM/Ollama — anything exposing POST /v1/chat/completions. Point it at a
 * base URL and give it a key.
 */
import { AIRequest, Message, Part, Provider, ProviderError } from './types.js';

/** Presets so AI_PROVIDER=nvidia works without also setting a base URL. */
const PRESETS: Record<string, { baseUrl: string; keyEnv: string; model: string }> = {
  nvidia: {
    baseUrl: 'https://integrate.api.nvidia.com/v1',
    keyEnv: 'NVIDIA_API_KEY',
    model: 'meta/llama-3.1-70b-instruct',
  },
  openrouter: {
    baseUrl: 'https://openrouter.ai/api/v1',
    keyEnv: 'OPENROUTER_API_KEY',
    model: 'google/gemini-2.0-flash-001',
  },
  together: {
    baseUrl: 'https://api.together.xyz/v1',
    keyEnv: 'TOGETHER_API_KEY',
    model: 'meta-llama/Llama-3.3-70B-Instruct-Turbo',
  },
  groq: {
    baseUrl: 'https://api.groq.com/openai/v1',
    keyEnv: 'GROQ_API_KEY',
    model: 'llama-3.3-70b-versatile',
  },
  openai: {
    baseUrl: 'https://api.openai.com/v1',
    keyEnv: 'OPENAI_API_KEY',
    model: 'gpt-4o-mini',
  },
};

/** Our neutral parts -> OpenAI content blocks (text + inline images as data URIs). */
function toOpenAIContent(parts: Part[]): string | any[] {
  const onlyText = parts.every((p) => 'text' in p);
  if (onlyText) return parts.map((p) => ('text' in p ? p.text : '')).join('\n');

  return parts.map((p) => {
    if ('text' in p) return { type: 'text', text: p.text };
    // fileUrl parts are resolved to inlineData in api/ai.ts before any provider
    // runs, so reaching this branch with one means the handler was bypassed.
    if (!('inlineData' in p)) {
      throw new ProviderError('Unresolved file reference reached the provider', 500, false);
    }
    const { mimeType, data } = p.inlineData;
    // PDFs are not supported by the OpenAI vision schema — most gateways only
    // accept images. Fail loudly rather than silently sending something invalid.
    if (!mimeType.startsWith('image/')) {
      throw new ProviderError(
        `This provider only accepts images inline, got "${mimeType}". Use AI_PROVIDER=gemini for PDF input.`,
        415
      );
    }
    return { type: 'image_url', image_url: { url: `data:${mimeType};base64,${data}` } };
  });
}

function toOpenAIMessages(contents: Message[], systemInstruction?: string) {
  const msgs: any[] = [];
  if (systemInstruction) msgs.push({ role: 'system', content: systemInstruction });
  for (const m of contents) {
    msgs.push({
      // our "model" role is OpenAI's "assistant"
      role: m.role === 'model' ? 'assistant' : 'user',
      content: toOpenAIContent(m.parts),
    });
  }
  return msgs;
}

export function createOpenAICompatibleProvider(providerName: string): Provider {
  const preset = PRESETS[providerName];
  const baseUrl = (process.env.AI_BASE_URL || preset?.baseUrl || '').replace(/\/$/, '');
  const apiKey = process.env.AI_API_KEY || (preset ? process.env[preset.keyEnv] : '') || '';

  if (!baseUrl) throw new ProviderError(`AI_BASE_URL is required for provider "${providerName}"`, 500, false);
  if (!apiKey) {
    throw new ProviderError(
      `No API key for "${providerName}" — set ${preset ? preset.keyEnv : 'AI_API_KEY'} on the server`,
      500,
      false
    );
  }

  return {
    name: providerName,
    supportsPdf: false, // the OpenAI vision schema is images-only
    defaultModel: process.env.AI_MODEL || preset?.model || '',
    fallbackModel: process.env.AI_FALLBACK_MODEL,

    async generate(req: AIRequest, model: string): Promise<string> {
      if (!model) throw new ProviderError('No model configured — set AI_MODEL on the server', 500, false);

      const body: Record<string, unknown> = {
        model,
        messages: toOpenAIMessages(req.contents, req.systemInstruction),
        temperature: 0.7,
      };
      // Schema-constrained JSON where supported, plain JSON mode otherwise.
      if (req.responseMimeType === 'application/json') {
        body.response_format = req.responseSchema
          ? { type: 'json_schema', json_schema: { name: 'response', schema: req.responseSchema, strict: false } }
          : { type: 'json_object' };
      }

      const res = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const detail = await res.text().catch(() => '');
        throw new ProviderError(`${providerName} ${res.status}: ${detail.slice(0, 400)}`, res.status);
      }

      const json: any = await res.json();
      const text = json?.choices?.[0]?.message?.content;
      if (typeof text !== 'string') throw new ProviderError(`${providerName} returned no message content`, 502);
      return text.trim();
    },
  };
}

export const OPENAI_COMPATIBLE_PROVIDERS = Object.keys(PRESETS);
