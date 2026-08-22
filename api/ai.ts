/**
 * POST /api/ai — the app's single AI entry point.
 *
 * The browser posts a provider-neutral request here; this function holds the
 * vendor key server-side and forwards it to whichever provider AI_PROVIDER
 * names. Switching vendors is an env-var change, and the key is never shipped
 * in the Vite bundle.
 *
 * Server env:
 *   AI_PROVIDER        gemini (default) | nvidia | openrouter | together | groq | openai
 *   AI_MODEL           override the provider's default model
 *   AI_FALLBACK_MODEL  retried once when the primary is overloaded
 *   GEMINI_API_KEY     for AI_PROVIDER=gemini
 *   NVIDIA_API_KEY     for AI_PROVIDER=nvidia   (or AI_API_KEY + AI_BASE_URL for any gateway)
 */
import { createGeminiProvider } from './_lib/gemini';
import { createOpenAICompatibleProvider, OPENAI_COMPATIBLE_PROVIDERS } from './_lib/openaiCompatible';
import { AIRequest, Message, Provider, ProviderError, isTransientStatus } from './_lib/types';

const MAX_BODY_CHARS = 12_000_000; // ~9MB of base64 — a brochure PDF fits, abuse doesn't.

function selectProvider(): Provider {
  const name = (process.env.AI_PROVIDER || 'gemini').toLowerCase().trim();
  if (name === 'gemini') return createGeminiProvider();
  if (OPENAI_COMPATIBLE_PROVIDERS.includes(name) || process.env.AI_BASE_URL) {
    return createOpenAICompatibleProvider(name);
  }
  throw new ProviderError(`Unknown AI_PROVIDER "${name}"`, 500, false);
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Retries transient provider failures with exponential backoff. */
async function withRetry<T>(fn: () => Promise<T>, retries = 2, baseDelayMs = 600): Promise<T> {
  let lastErr: any;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err: any) {
      lastErr = err;
      const status = err?.status ?? 0;
      if (!isTransientStatus(status) || attempt === retries) throw err;
      await sleep(baseDelayMs * Math.pow(2, attempt));
    }
  }
  throw lastErr;
}

/** Rejects malformed bodies before they reach a paid provider. */
function validate(body: any): AIRequest {
  if (!body || typeof body !== 'object') throw new ProviderError('Body must be a JSON object', 400);
  const contents = body.contents;
  if (!Array.isArray(contents) || contents.length === 0) {
    throw new ProviderError('`contents` must be a non-empty array', 400);
  }
  for (const m of contents as Message[]) {
    if (!m || (m.role !== 'user' && m.role !== 'model')) {
      throw new ProviderError('Each message needs role "user" or "model"', 400);
    }
    if (!Array.isArray(m.parts) || m.parts.length === 0) {
      throw new ProviderError('Each message needs a non-empty `parts` array', 400);
    }
  }
  if (body.responseMimeType && body.responseMimeType !== 'text/plain' && body.responseMimeType !== 'application/json') {
    throw new ProviderError('`responseMimeType` must be text/plain or application/json', 400);
  }
  return {
    contents,
    systemInstruction: typeof body.systemInstruction === 'string' ? body.systemInstruction : undefined,
    responseMimeType: body.responseMimeType,
    responseSchema: body.responseSchema,
    model: typeof body.model === 'string' ? body.model : undefined,
  };
}

export default async function handler(req: any, res: any) {
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const raw = typeof req.body === 'string' ? req.body : JSON.stringify(req.body ?? {});
    if (raw.length > MAX_BODY_CHARS) {
      return res.status(413).json({ error: 'Request too large' });
    }
    const parsed = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body;
    const aiReq = validate(parsed);

    const provider = selectProvider();
    const primary = aiReq.model || provider.defaultModel;

    let text: string;
    let used = primary;
    try {
      text = await withRetry(() => provider.generate(aiReq, primary));
    } catch (err: any) {
      // Still overloaded after retries — try the cheaper/stabler model once.
      const status = err?.status ?? 0;
      if (isTransientStatus(status) && provider.fallbackModel && provider.fallbackModel !== primary) {
        used = provider.fallbackModel;
        text = await withRetry(() => provider.generate(aiReq, provider.fallbackModel!), 1);
      } else {
        throw err;
      }
    }

    return res.status(200).json({ text, provider: provider.name, model: used });
  } catch (err: any) {
    const status = err instanceof ProviderError ? err.status : 500;
    // Misconfiguration returns 500 but is NOT worth retrying, so trust the
    // error's own flag rather than inferring it from the status code.
    const transient = err instanceof ProviderError ? err.transient : isTransientStatus(status);
    // Log server-side with detail; return a safe message to the browser.
    console.error('[api/ai]', status, err?.message);
    return res.status(status).json({
      error: err?.message || 'AI request failed',
      transient,
    });
  }
}
