/**
 * Centralized Gemini AI configuration.
 * Single source of truth for the model name and API key resolution,
 * shared by the global chat, the unit assistant, AI search, description
 * generation and OCR extraction.
 */

// One model everywhere — previously the codebase mixed 'gemini-3-flash-preview'
// and 'gemini-2.5-flash' which made behavior inconsistent between features.
export const GEMINI_MODEL = 'gemini-3-flash-preview';

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
