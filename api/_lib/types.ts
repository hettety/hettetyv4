/**
 * Provider-neutral AI request/response shapes.
 *
 * The browser never talks to a model vendor directly — it posts one of these to
 * /api/ai, and the server picks a provider. Swapping vendors is therefore an
 * environment-variable change, not an app rewrite.
 */

/**
 * A chunk of a message: text, an inline binary, or a file the server fetches.
 *
 * fileUrl exists because Vercel rejects an inbound request body over ~4.5MB
 * before the function runs, which caps an inlined file at roughly 2.8MB. A URL
 * costs a few hundred bytes and the function does the download itself, so a
 * 15MB brochure works. The URL is resolved to inlineData before any provider
 * sees it — providers still only ever receive inline bytes.
 */
export type Part =
  | { text: string }
  | { inlineData: { mimeType: string; data: string } } // data = base64, no data: prefix
  | { fileUrl: { url: string; mimeType: string } };

export interface Message {
  role: 'user' | 'model';
  parts: Part[];
}

/** The five things this app asks a model to do. Each can use its own provider. */
export type AITask = 'chat' | 'search' | 'describe' | 'brochure' | 'ocr';

export const AI_TASKS: AITask[] = ['chat', 'search', 'describe', 'brochure', 'ocr'];

export interface AIRequest {
  /** Which job this is — drives per-task provider routing. */
  task?: AITask;
  /** Conversation so far. The last message is the current turn. */
  contents: Message[];
  /** System prompt / persona. */
  systemInstruction?: string;
  /** Ask the model for JSON rather than prose. */
  responseMimeType?: 'text/plain' | 'application/json';
  /** Optional JSON Schema the response must satisfy (best-effort per provider). */
  responseSchema?: unknown;
  /** Override the configured model for this one call. */
  model?: string;
}

export interface AIResponse {
  /** The model's reply as plain text (JSON string when JSON was requested). */
  text: string;
  /** Which provider/model actually served the request — useful for debugging. */
  provider: string;
  model: string;
}

/** True for transient "try again later" statuses (overload / rate limit). */
export const isTransientStatus = (status: number) =>
  status === 429 || status === 500 || status === 502 || status === 503 || status === 504;

/** Error carrying an HTTP status so the route can mirror the provider's status. */
export class ProviderError extends Error {
  status: number;
  /** Whether retrying could plausibly help. Misconfiguration never is. */
  transient: boolean;
  constructor(message: string, status = 502, transient?: boolean) {
    super(message);
    this.name = 'ProviderError';
    this.status = status;
    this.transient = transient ?? isTransientStatus(status);
  }
}

export interface Provider {
  readonly name: string;
  /** Can this provider accept non-image inline data (i.e. PDFs)? */
  readonly supportsPdf: boolean;
  /** Model used when the request doesn't override it. */
  readonly defaultModel: string;
  /** A cheaper/stabler model to retry on when the primary is overloaded. */
  readonly fallbackModel?: string;
  generate(req: AIRequest, model: string): Promise<string>;
}
