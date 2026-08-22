/**
 * Client-side AI access.
 *
 * The browser no longer talks to a model vendor directly and holds no API key —
 * every request goes to our own /api/ai serverless function, which keeps the key
 * server-side and forwards it to whichever provider is configured (Gemini,
 * NVIDIA, OpenRouter, …). Swapping vendors is a server env-var change; nothing
 * here or in the components needs to move.
 */

/** JSON-Schema type names, replacing the vendor SDK's `Type` enum. */
export const Type = {
  STRING: 'string',
  NUMBER: 'number',
  INTEGER: 'integer',
  BOOLEAN: 'boolean',
  ARRAY: 'array',
  OBJECT: 'object',
} as const;

export type Part = { text: string } | { inlineData: { mimeType: string; data: string } };
export interface Message { role: 'user' | 'model'; parts: Part[] }

/** Vendor-SDK-shaped params, kept so call sites read the same as before. */
export interface GenerateParams {
  contents: string | Message[] | { role?: string; parts: Part[] }[];
  config?: {
    systemInstruction?: string;
    responseMimeType?: 'text/plain' | 'application/json';
    responseSchema?: unknown;
  };
  model?: string;
}

export interface GenerateResult { text: string; provider?: string; model?: string }

/** Error from /api/ai that remembers whether retrying could help. */
export class AIRequestError extends Error {
  status: number;
  transient: boolean;
  constructor(message: string, status: number, transient: boolean) {
    super(message);
    this.name = 'AIRequestError';
    this.status = status;
    this.transient = transient;
  }
}

/** True for transient "try again later" errors (overload / rate limit). */
export function isOverloadedError(err: any): boolean {
  if (err instanceof AIRequestError) return err.transient;
  const code = err?.status ?? err?.error?.code ?? err?.code;
  const status = err?.error?.status ?? err?.status;
  const msg = String(err?.message ?? err?.error?.message ?? '');
  return code === 503 || code === 429 ||
    status === 'UNAVAILABLE' || status === 'RESOURCE_EXHAUSTED' ||
    /\b(503|429|overloaded|unavailable|high demand)\b/i.test(msg);
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Retries a call with exponential backoff while it keeps failing transiently. */
export async function withRetry<T>(fn: () => Promise<T>, retries = 3, baseDelayMs = 600): Promise<T> {
  let lastErr: any;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (!isOverloadedError(err) || attempt === retries) throw err;
      await sleep(baseDelayMs * Math.pow(2, attempt));
    }
  }
  throw lastErr;
}

/** Accepts a bare string or SDK-style contents and normalises to Message[]. */
function normaliseContents(contents: GenerateParams['contents']): Message[] {
  if (typeof contents === 'string') return [{ role: 'user', parts: [{ text: contents }] }];
  return (contents as any[]).map((m) => ({
    role: m.role === 'model' ? 'model' : 'user',
    parts: m.parts,
  }));
}

/** Posts one request to our serverless AI route. */
export async function generateContent(params: GenerateParams): Promise<GenerateResult> {
  const res = await fetch('/api/ai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: normaliseContents(params.contents),
      systemInstruction: params.config?.systemInstruction,
      responseMimeType: params.config?.responseMimeType,
      responseSchema: params.config?.responseSchema,
      model: params.model,
    }),
  });

  if (!res.ok) {
    let message = `AI request failed (${res.status})`;
    let transient = res.status === 429 || res.status >= 500;
    try {
      const body = await res.json();
      if (body?.error) message = body.error;
      if (typeof body?.transient === 'boolean') transient = body.transient;
    } catch { /* non-JSON error body — keep the default message */ }
    throw new AIRequestError(message, res.status, transient);
  }

  const body = await res.json();
  return { text: body?.text ?? '', provider: body?.provider, model: body?.model };
}

/**
 * Same as generateContent — retry and model-fallback now happen server-side, so
 * this alias exists purely so existing call sites keep reading naturally.
 */
export async function generateContentResilient(params: GenerateParams): Promise<GenerateResult> {
  return generateContent(params);
}

/**
 * A stateful chat mirroring the vendor SDK's shape (`chat.sendMessage({ message })`).
 * History lives here in the browser and is replayed to the stateless endpoint
 * on every turn.
 */
export function createChat(opts: { config?: { systemInstruction?: string }; history?: Message[]; model?: string } = {}) {
  const history: Message[] = [...(opts.history || [])];
  return {
    get history() { return [...history]; },
    async sendMessage({ message }: { message: string }): Promise<GenerateResult> {
      const turn: Message = { role: 'user', parts: [{ text: message }] };
      const result = await generateContent({
        contents: [...history, turn],
        config: { systemInstruction: opts.config?.systemInstruction },
        model: opts.model,
      });
      // Only commit to history once the round-trip succeeded, so a failed send
      // doesn't poison the next turn.
      history.push(turn, { role: 'model', parts: [{ text: result.text }] });
      return result;
    },
  };
}

export type Chat = ReturnType<typeof createChat>;

/** User-facing message for AI failures, localized. */
export function aiErrorMessage(err: any, isRtl: boolean): string {
  if (isOverloadedError(err)) {
    return isRtl
      ? 'مساعد الذكاء الاصطناعي مزحوم دلوقتي 🙏 جرّب تبعت تاني بعد ثواني.'
      : 'The AI assistant is busy right now 🙏 please try again in a few seconds.';
  }
  return isRtl
    ? 'حصلت مشكلة في الاتصال بمساعد الذكاء الاصطناعي. حاول تاني.'
    : 'Something went wrong reaching the AI assistant. Please try again.';
}

/** Marker the AI emits when the user asks to view a property in 3D. */
export const SHOW_3D_MARKER = '[SHOW_3D]';

/** Strips a 3D marker (with optional :id payload) from an AI reply. */
export function extract3DMarker(text: string): { cleanText: string; show3D: boolean; propertyId: string | null } {
  const match = text.match(/\[SHOW_3D(?::([^\]\s]+))?\]/);
  if (!match) return { cleanText: text, show3D: false, propertyId: null };
  return {
    cleanText: text.replace(/\[SHOW_3D(?::[^\]\s]+)?\]/g, '').trim(),
    show3D: true,
    propertyId: match[1] || null,
  };
}
