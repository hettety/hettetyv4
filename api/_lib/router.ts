/**
 * Per-task provider routing.
 *
 * Different jobs want different models: chat wants fast and fluent, search wants
 * cheap and structured, brochure import *must* accept PDFs. So each task can
 * name its own provider and model, falling back to the global default.
 *
 *   AI_PROVIDER                 global default (gemini)
 *   AI_MODEL                    global default model
 *   AI_TASK_<TASK>_PROVIDER     per-task override — TASK = CHAT|SEARCH|DESCRIBE|BROCHURE|OCR
 *   AI_TASK_<TASK>_MODEL        per-task model override
 *
 * Two safety nets on top:
 *  1. Capability routing — a request carrying a PDF is redirected to a
 *     PDF-capable provider instead of failing with a 415.
 *  2. Provider fallback — if the task's provider is misconfigured or down, the
 *     global default is used rather than the whole feature breaking.
 */
import { createGeminiProvider } from './gemini.js';
import { createOpenAICompatibleProvider, OPENAI_COMPATIBLE_PROVIDERS } from './openaiCompatible.js';
import { AIRequest, AITask, Provider, ProviderError } from './types.js';

const DEFAULT_PROVIDER = 'gemini';

/** Builds a provider by name. Throws if that provider isn't configured. */
export function buildProvider(name: string): Provider {
  const key = (name || '').toLowerCase().trim();
  if (key === 'gemini') return createGeminiProvider();
  if (OPENAI_COMPATIBLE_PROVIDERS.includes(key) || process.env.AI_BASE_URL) {
    return createOpenAICompatibleProvider(key);
  }
  throw new ProviderError(`Unknown AI provider "${name}"`, 500, false);
}

/** True when the request carries inline data that isn't an image (i.e. a PDF). */
export function needsPdfSupport(req: AIRequest): boolean {
  return req.contents.some((m) =>
    m.parts.some((p) => 'inlineData' in p && !p.inlineData.mimeType.startsWith('image/'))
  );
}

function envFor(task: AITask | undefined, suffix: 'PROVIDER' | 'MODEL'): string | undefined {
  if (!task) return undefined;
  return process.env[`AI_TASK_${task.toUpperCase()}_${suffix}`] || undefined;
}

export interface Resolved {
  provider: Provider;
  model: string;
  /** Set when we didn't use the first choice, so the response can say why. */
  note?: string;
}

/**
 * Picks the provider+model for this request, honouring per-task config and
 * degrading sensibly rather than erroring when something isn't available.
 */
export function resolve(req: AIRequest): Resolved {
  const globalName = process.env.AI_PROVIDER || DEFAULT_PROVIDER;
  const wantedName = envFor(req.task, 'PROVIDER') || globalName;
  const wantedModel = req.model || envFor(req.task, 'MODEL') || undefined;

  const attempts: string[] = [wantedName];
  // Keep the global default as a backstop, then Gemini (the PDF-capable one).
  if (globalName.toLowerCase() !== wantedName.toLowerCase()) attempts.push(globalName);
  if (!attempts.some((a) => a.toLowerCase() === DEFAULT_PROVIDER)) attempts.push(DEFAULT_PROVIDER);

  const pdfNeeded = needsPdfSupport(req);
  const errors: string[] = [];
  /** Why the first choice was rejected — surfaced so misconfig is debuggable. */
  let skipReason = '';

  for (const name of attempts) {
    const isFirstChoice = name === wantedName && !skipReason;
    let provider: Provider;
    try {
      provider = buildProvider(name);
    } catch (err: any) {
      const why = err?.message || 'not configured';
      errors.push(`${name}: ${why}`);
      if (!skipReason) skipReason = `${name} is not configured`;
      continue;
    }
    // Skip a provider that physically cannot read this request's attachment.
    if (pdfNeeded && !provider.supportsPdf) {
      errors.push(`${name}: cannot accept PDF input`);
      if (!skipReason) skipReason = `${name} cannot accept PDF input`;
      continue;
    }
    // Only reuse the requested model when it belongs to the provider we landed on.
    const model = isFirstChoice ? (wantedModel || provider.defaultModel) : provider.defaultModel;
    return { provider, model, note: isFirstChoice ? undefined : `${skipReason} — routed to ${name}` };
  }

  throw new ProviderError(
    pdfNeeded
      ? `No configured provider can accept PDF input. Set AI_TASK_BROCHURE_PROVIDER=gemini (with GEMINI_API_KEY). Tried — ${errors.join('; ')}`
      : `No AI provider is configured. Tried — ${errors.join('; ')}`,
    500,
    false
  );
}
