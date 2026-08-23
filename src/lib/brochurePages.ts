/**
 * Picks the pages of a brochure worth sending to the model, and renders them as
 * images.
 *
 * Two problems this solves, both measured against real developer brochures:
 *
 *  1. Size. A Madinet Masr catalogue is 237 pages and 39MB, of which 12 pages
 *     carry unit data. Vercel refuses a request body over ~4.5MB and Storage
 *     caps a PDF at 15MB, so the whole file cannot be sent at all — but the 12
 *     pages that matter come to about 1.3MB.
 *
 *  2. Signal. Even when a brochure does fit, 225 pages of brand story dilute the
 *     dozen pages that describe units.
 *
 * Pages are rendered to JPEG rather than passed through as PDF because Arabic
 * brochures extract badly: the text layer of حدائق النصر returns "المساحة الكلية
 * ٣٦ م٢" where the page plainly reads 136. Reading the rendered page avoids the
 * whole class of RTL digit-reordering bugs.
 */

/** Signals that a page carries unit, area, price or payment data. */
const SIGNAL = new RegExp(
  [
    String.raw`\d{2,4}\s*(?:m2|m²|sqm|sq\.?\s?m|متر|م٢|م2)`,   // an area
    String.raw`\bBUA\b|\bbuilt[- ]?up\b`,
    String.raw`\b(?:no\.?\s*of\s*)?(?:BR|bedrooms?|baths?|bathrooms?)\b`,
    String.raw`\b(?:unit|floor|typical)\s*(?:type|plan|distribution|area)\b`,
    String.raw`\b(?:price|payment\s*plan|down\s*payment|installments?|maintenance)\b`,
    String.raw`\b(?:studio|duplex|penthouse|townhouse|twin\s?house|s-?villa|loft|chalet|clinic)\b`,
    String.raw`غرف|غرفة|مساحة|سعر|تقسيط|مقدم|نموذج|الدور|شقة|فيلا|شاليه|عيادة`,
    String.raw`\d{1,3}(?:,\d{3}){2,}`,                          // a price-shaped number
  ].join('|'),
  'gi'
);

export interface PickedPages {
  /** JPEG data URLs, in page order. */
  images: string[];
  /** 1-based page numbers, in the order they were rendered. */
  pageNumbers: number[];
  /** Pages in the source document. */
  totalPages: number;
  /** Roughly what the payload will weigh, in bytes. */
  approxBytes: number;
}

/** Rendered wide enough for a floor-plan table to stay legible. */
const RENDER_WIDTH = 1400;
const JPEG_QUALITY = 0.82;
/** Comfortably inside the ~4.5MB request-body limit once base64 is counted. */
const BUDGET_BYTES = Math.floor(2.6 * 1024 * 1024);

/** pdf.js is ~1MB; it is only ever needed when someone imports a brochure. */
async function loadPdfJs() {
  const pdfjs = await import('pdfjs-dist');
  // Vite resolves this to a hashed asset URL at build time.
  const worker = await import('pdfjs-dist/build/pdf.worker.min.mjs?url');
  pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
  return pdfjs;
}

function renderToJpeg(canvas: HTMLCanvasElement): string {
  return canvas.toDataURL('image/jpeg', JPEG_QUALITY);
}

/** Bytes a data URL will occupy once decoded from base64. */
function dataUrlBytes(dataUrl: string): number {
  const b64 = dataUrl.slice(dataUrl.indexOf(',') + 1);
  return Math.floor(b64.length * 0.75);
}

/**
 * Reads the PDF, scores every page, and renders the highest-scoring ones (plus
 * the cover, which usually carries the project name) until the budget is spent.
 *
 * @param maxPages hard ceiling on pages rendered, whatever the budget allows.
 */
export async function pickBrochurePages(file: File, maxPages = 12): Promise<PickedPages> {
  const pdfjs = await loadPdfJs();
  const buf = await file.arrayBuffer();
  const doc = await pdfjs.getDocument({ data: buf }).promise;

  try {
    const scores: { page: number; score: number }[] = [];
    for (let n = 1; n <= doc.numPages; n++) {
      const page = await doc.getPage(n);
      try {
        const content = await page.getTextContent();
        const text = content.items.map((i: any) => ('str' in i ? i.str : '')).join(' ');
        scores.push({ page: n, score: (text.match(SIGNAL) || []).length });
      } finally {
        page.cleanup();
      }
    }

    const ranked = [...scores].sort((a, b) => b.score - a.score || a.page - b.page);
    const chosen = new Set<number>();
    // The cover names the project even when it carries no unit data at all.
    chosen.add(1);
    for (const { page, score } of ranked) {
      if (chosen.size >= maxPages) break;
      if (score > 0) chosen.add(page);
    }
    // A brochure with no signal anywhere: take the opening spread rather than
    // sending nothing, since the project identity is still worth having.
    if (chosen.size === 1) {
      for (let n = 2; n <= Math.min(6, doc.numPages); n++) chosen.add(n);
    }

    const pageNumbers = [...chosen].sort((a, b) => a - b);
    const images: string[] = [];
    const rendered: number[] = [];
    let total = 0;

    for (const n of pageNumbers) {
      const page = await doc.getPage(n);
      try {
        const base = page.getViewport({ scale: 1 });
        const viewport = page.getViewport({ scale: Math.min(RENDER_WIDTH / base.width, 2.5) });
        const canvas = document.createElement('canvas');
        canvas.width = Math.ceil(viewport.width);
        canvas.height = Math.ceil(viewport.height);
        const ctx = canvas.getContext('2d');
        if (!ctx) continue;
        // JPEG has no alpha; without this, transparent artwork renders black.
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        await page.render({ canvas, canvasContext: ctx, viewport } as any).promise;

        const jpeg = renderToJpeg(canvas);
        const bytes = dataUrlBytes(jpeg);
        // Always keep the first page, then stop once the budget is spent.
        if (images.length > 0 && total + bytes > BUDGET_BYTES) break;
        images.push(jpeg);
        rendered.push(n);
        total += bytes;
      } finally {
        page.cleanup();
      }
    }

    return { images, pageNumbers: rendered, totalPages: doc.numPages, approxBytes: total };
  } finally {
    await doc.destroy();
  }
}

/** Exported for tests: which pages would be chosen for this text, in order. */
export function scorePageText(text: string): number {
  return (text.match(SIGNAL) || []).length;
}
