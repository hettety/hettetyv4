import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { uploadDeadline } from '../../src/components/add-listing-page';

const wizard = readFileSync(resolve(__dirname, '../../src/components/add-listing-page.tsx'), 'utf-8');
const storageRules = readFileSync(resolve(__dirname, '../../storage.rules'), 'utf-8');

describe('Tier 2 — Upload limits match what Storage will actually accept', () => {
  it('gives a large file enough time to finish uploading', () => {
    // A flat 8s was chosen to detect a missing bucket fast. On a real connection
    // it guarantees failure for anything sizeable, and the base64 fallback it
    // drops into cannot hold a 10MB PDF at all.
    const tenMB = 10 * 1024 * 1024;
    expect(uploadDeadline(tenMB)).toBeGreaterThan(3 * 60 * 1000);
    // A tiny file should still fail fast when the bucket genuinely isn't there.
    expect(uploadDeadline(1024)).toBeLessThanOrEqual(30 * 1000);
    // Monotonic: a bigger file never gets less time.
    expect(uploadDeadline(5 * 1024 * 1024)).toBeGreaterThan(uploadDeadline(1024 * 1024));
  });

  it('does not treat a slow upload as a missing bucket', () => {
    // storageUnavailable is sticky for the session: setting it on a timeout
    // downgrades every later photo to the 800px base64 path.
    expect(wizard).toContain("const isMissingBucket = (err: unknown) => (err as Error)?.message !== 'storage-timeout'");
    // Every place that flips the flag has to go through that check.
    const unguarded = wizard.split('\n').filter(l =>
      l.includes('storageUnavailable = true') && !l.includes('isMissingBucket'));
    expect(unguarded).toEqual([]);
  });

  it('keeps the client video cap at or under the Storage rule', () => {
    expect(storageRules).toContain('80 * 1024 * 1024');
    expect(wizard).toContain('const MAX_VIDEO_BYTES = 80 * 1024 * 1024;');
    expect(wizard).not.toContain('Video must be under 50MB');
  });

  it('stores photos at a resolution worth showing', () => {
    // Storage accepts 15MB per image; 1920px/0.5MB were fallback-era numbers.
    const m = wizard.match(/const STORAGE_COMPRESSION = \{ maxSizeMB: ([\d.]+), maxWidthOrHeight: (\d+)/);
    expect(m).not.toBeNull();
    expect(Number(m![1])).toBeGreaterThanOrEqual(2);
    expect(Number(m![2])).toBeGreaterThanOrEqual(2560);
  });

  it('gives 360 photos a bigger budget than flat ones', () => {
    // An equirectangular image is wrapped around a whole sphere, so the same
    // pixel count reads as far softer.
    const pano = wizard.match(/const PANORAMA_COMPRESSION = \{ maxSizeMB: ([\d.]+), maxWidthOrHeight: (\d+)/);
    const flat = wizard.match(/const STORAGE_COMPRESSION = \{ maxSizeMB: ([\d.]+), maxWidthOrHeight: (\d+)/);
    expect(pano).not.toBeNull();
    expect(Number(pano![2])).toBeGreaterThan(Number(flat![2]));
    expect(Number(pano![1])).toBeGreaterThan(Number(flat![1]));
  });

  it('caps attachments where the Firestore rules cap them', () => {
    expect(wizard).toContain('const MAX_MEDIA_ITEMS = 20;');
    expect(wizard).toContain('const MAX_LEGAL_DOCS = 10;');
    expect(wizard).toContain('const MAX_PAYMENT_PLANS = 10;');
  });

  it('accepts PDFs for the property documents', () => {
    expect(wizard).toContain('accept="image/*,application/pdf"');
    expect(storageRules).toContain("request.resource.contentType == 'application/pdf'");
  });
});
