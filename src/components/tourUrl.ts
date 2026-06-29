/**
 * Pure helpers for Matterport / Polycam tour links. Kept separate from the
 * (lazy-loaded) TourEmbed component so the add-listing form can validate links
 * without pulling the viewer into the main bundle.
 */

/** True when the URL is a recognised Matterport/Polycam tour link we can embed. */
export function isLikelyTourUrl(raw: string): boolean {
  try {
    const host = new URL((raw || '').trim()).hostname.replace(/^www\./, '');
    return host.endsWith('matterport.com') || host.endsWith('poly.cam');
  } catch {
    return false;
  }
}

/** Turns a pasted Matterport/Polycam share URL into an embeddable URL. */
export function toEmbedUrl(raw: string): string {
  const url = (raw || '').trim();
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, '');

    // Matterport: my.matterport.com/show/?m=<id>  (already embeddable)
    if (host.endsWith('matterport.com')) {
      const m = u.searchParams.get('m');
      if (m) return `https://my.matterport.com/show/?m=${m}&play=1`;
      return url;
    }

    // Polycam: poly.cam/capture/<id> -> poly.cam/capture/<id>/embed
    if (host.endsWith('poly.cam')) {
      if (/\/embed\/?$/.test(u.pathname)) return url;
      return `${u.origin}${u.pathname.replace(/\/$/, '')}/embed`;
    }
  } catch {
    /* not a parseable URL — fall through and use as-is */
  }
  return url;
}
