import { describe, it, expect } from 'vitest';
import { computeHeightField } from '../../src/components/Property3DViewer';

const N = 64;
const idx = (x: number, y: number) => y * N + x;

/** A luminance field that is uniform, so only the geometric shape is under test. */
const flat = (v: number) => new Float32Array(N * N).fill(v);

/** Bright square in the middle — the shape an interior photo with a window has. */
const brightCentre = () => {
  const l = new Float32Array(N * N).fill(0.15);
  for (let y = N / 2 - 8; y < N / 2 + 8; y++) {
    for (let x = N / 2 - 8; x < N / 2 + 8; x++) l[idx(x, y)] = 1;
  }
  return l;
};

describe('Tier 2 — The relief reads as a room, not as brightness', () => {
  it('sinks the middle of the frame and keeps the edges forward', () => {
    const h = computeHeightField(flat(0.5), N);
    const centre = h[idx(N / 2, N / 2)];
    const nearEdge = h[idx(N / 2, Math.round(N * 0.2))];
    const corner = h[idx(Math.round(N * 0.2), Math.round(N * 0.2))];
    // Looking *into* a room: the middle is furthest away.
    expect(centre).toBeLessThan(nearEdge);
    expect(nearEdge).toBeLessThan(corner);
  });

  it('does not let a bright window balloon toward the viewer', () => {
    // The old map displaced by raw luminance, so the brightest thing in the photo
    // — almost always a window, and the furthest thing in the room — came at you.
    const h = computeHeightField(brightCentre(), N);
    const litCentre = h[idx(N / 2, N / 2)];
    const darkCorner = h[idx(Math.round(N * 0.15), Math.round(N * 0.15))];
    expect(litCentre).toBeLessThan(darkCorner);
  });

  it('still varies with the photo, so it is not a bare dome', () => {
    const dark = computeHeightField(flat(0), N);
    const light = computeHeightField(flat(1), N);
    const p = idx(Math.round(N * 0.35), Math.round(N * 0.35));
    expect(light[p]).toBeGreaterThan(dark[p]);
    // But brightness must stay a minority of the height, or the window returns.
    expect(light[p] - dark[p]).toBeLessThan(0.3);
  });

  it('pins the border flat so the mesh cannot tear at its edge', () => {
    const h = computeHeightField(brightCentre(), N);
    for (const [x, y] of [[0, 0], [N - 1, 0], [0, N - 1], [N - 1, N - 1], [N / 2, 0], [0, N / 2]]) {
      expect(h[idx(x, y)]).toBeCloseTo(1, 5);
    }
  });

  it('stays inside the range a displacement map can express', () => {
    for (const lum of [flat(0), flat(1), brightCentre()]) {
      const h = computeHeightField(lum, N);
      for (let i = 0; i < h.length; i++) {
        expect(h[i]).toBeGreaterThanOrEqual(0);
        expect(h[i]).toBeLessThanOrEqual(1);
      }
    }
  });

  it('is symmetric, so the room does not lean', () => {
    const h = computeHeightField(flat(0.4), N);
    for (const [x, y] of [[10, 20], [5, 31], [25, 12]]) {
      expect(h[idx(x, y)]).toBeCloseTo(h[idx(N - 1 - x, y)], 6);
      expect(h[idx(x, y)]).toBeCloseTo(h[idx(x, N - 1 - y)], 6);
    }
  });
});
