/**
 * Centralized Gemini AI configuration.
 * Single source of truth for the model name and API key resolution,
 * shared by the global chat, the unit assistant, AI search, description
 * generation and OCR extraction.
 */

// One model everywhere. We default to the stable GA model — the preview model
// (gemini-3-flash-preview) constantly returned 503 "high demand", breaking the
// assistant. Stability matters more than being on the bleeding edge here.
export const GEMINI_MODEL = 'gemini-2.5-flash';

// If the primary model is ever overloaded we transparently fall back to this one.
export const GEMINI_FALLBACK_MODEL = 'gemini-2.0-flash';

/** True for transient "try again later" errors (overload / rate limit). */
export function isOverloadedError(err: any): boolean {
  const code = err?.status ?? err?.error?.code ?? err?.code;
  const status = err?.error?.status ?? err?.status;
  const msg = String(err?.message ?? err?.error?.message ?? '');
  return code === 503 || code === 429 ||
    status === 'UNAVAILABLE' || status === 'RESOURCE_EXHAUSTED' ||
    /\b(503|429|overloaded|unavailable|high demand)\b/i.test(msg);
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Retries a call with exponential backoff while it keeps failing with a transient error. */
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

/**
 * Runs `ai.models.generateContent` with retry, then one retry on the stable
 * fallback model if the primary is still overloaded. `ai` is the GoogleGenAI
 * instance (loosely typed here to avoid a hard import in this config module).
 */
export async function generateContentResilient(ai: any, params: any): Promise<any> {
  const model = params.model ?? GEMINI_MODEL;
  try {
    return await withRetry(() => ai.models.generateContent({ ...params, model }));
  } catch (err) {
    if (isOverloadedError(err) && model !== GEMINI_FALLBACK_MODEL) {
      return await withRetry(() => ai.models.generateContent({ ...params, model: GEMINI_FALLBACK_MODEL }), 2);
    }
    throw err;
  }
}

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

/**
 * Resolves the Gemini API key in every supported runtime:
 * - Vite/Vercel builds: VITE_GEMINI_API_KEY (statically replaced by Vite)
 * - AI Studio applets: process.env.GEMINI_API_KEY (injected via vite `define`)
 *
 * `process.env.GEMINI_API_KEY` below is statically replaced at build time by
 * the `define` block in vite.config.ts, so it never throws in the browser.
 */
export function getGeminiApiKey(): string | undefined {
  const viteKey = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;
  if (viteKey) return viteKey;
  try {
    return process.env.GEMINI_API_KEY || undefined;
  } catch {
    // No `define` replacement happened (non-Vite runtime) — no key available.
    return undefined;
  }
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
