import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { resolveFileUrls } from '../../api/_lib/fetchFile';
import { Message } from '../../api/_lib/types';

const BUCKET = 'test-project.firebasestorage.app';
const good = `https://firebasestorage.googleapis.com/v0/b/${BUCKET}/o/properties%2Fuid%2Fbrochure.pdf?alt=media&token=t`;

const msg = (url: string, mimeType = 'application/pdf'): Message[] => ([
  { role: 'user', parts: [{ text: 'read this' }, { fileUrl: { url, mimeType } }] },
]);

const okFetch = (bytes = Buffer.from('%PDF-1.4 hello')) =>
  vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    headers: { get: () => String(bytes.byteLength) },
    arrayBuffer: async () => bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength),
  });

describe('Tier 2 — Fetching a staged file for the AI', () => {
  const realFetch = globalThis.fetch;

  beforeEach(() => { delete process.env.STORAGE_BUCKET; });
  afterEach(() => { globalThis.fetch = realFetch; delete process.env.STORAGE_BUCKET; });

  it('leaves a conversation without file references untouched', async () => {
    globalThis.fetch = vi.fn() as any;
    const plain: Message[] = [{ role: 'user', parts: [{ text: 'hi' }] }];
    await expect(resolveFileUrls(plain)).resolves.toBe(plain);
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it('turns a staged Storage file into inline bytes for the provider', async () => {
    globalThis.fetch = okFetch() as any;
    const out = await resolveFileUrls(msg(good));
    const part = out[0].parts[1] as any;
    // Providers only ever see inline data — the URL never reaches them.
    expect(part.inlineData.mimeType).toBe('application/pdf');
    expect(Buffer.from(part.inlineData.data, 'base64').toString()).toBe('%PDF-1.4 hello');
    expect(out[0].parts[0]).toEqual({ text: 'read this' });
  });

  it.each([
    ['plain http', `http://firebasestorage.googleapis.com/v0/b/${BUCKET}/o/x`],
    ['another host', 'https://evil.example.com/brochure.pdf'],
    ['host that merely starts the same', 'https://firebasestorage.googleapis.com.evil.com/x'],
    ['a local address', 'https://169.254.169.254/latest/meta-data/'],
    ['not a URL at all', 'not-a-url'],
  ])('refuses to fetch %s', async (_label, url) => {
    globalThis.fetch = vi.fn() as any;
    await expect(resolveFileUrls(msg(url))).rejects.toThrow();
    // The point is that nothing is requested, not merely that it errors after.
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it('pins the fetch to this project when the bucket is configured', async () => {
    process.env.STORAGE_BUCKET = BUCKET;
    globalThis.fetch = vi.fn() as any;
    const otherBucket = 'https://firebasestorage.googleapis.com/v0/b/someone-else.appspot.com/o/x';
    await expect(resolveFileUrls(msg(otherBucket))).rejects.toThrow(/storage bucket/i);
    expect(globalThis.fetch).not.toHaveBeenCalled();

    globalThis.fetch = okFetch() as any;
    await expect(resolveFileUrls(msg(good))).resolves.toBeTruthy();
  });

  it('refuses a file larger than Storage would have accepted', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true, status: 200,
      headers: { get: () => String(20 * 1024 * 1024) },
      arrayBuffer: async () => new ArrayBuffer(8),
    }) as any;
    await expect(resolveFileUrls(msg(good))).rejects.toThrow(/too large/i);
  });

  it('reports a download that failed instead of sending an empty file', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false, status: 404, headers: { get: () => '0' }, arrayBuffer: async () => new ArrayBuffer(0),
    }) as any;
    await expect(resolveFileUrls(msg(good))).rejects.toThrow(/could not read/i);
  });

  it('requires a mime type — the provider cannot guess one', async () => {
    globalThis.fetch = vi.fn() as any;
    await expect(resolveFileUrls(msg(good, ''))).rejects.toThrow(/mimeType/i);
  });
});
