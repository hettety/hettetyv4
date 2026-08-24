import { describe, it, expect } from 'vitest';
import {
  fitDistance,
  fogRange,
  backingPlateZ,
  BACKING_DEPTH,
  planeAspect,
  PLANE_HEIGHT,
  DEPTH_SCALE,
  MAX_AZIMUTH,
  MAX_POLAR,
} from '../../src/components/Property3DViewer';

const FOV = 50;

/** Half the width and height the frustum spans at a given distance. */
const frustumHalf = (dist: number, fovDeg: number, canvasAspect: number) => {
  const halfH = Math.tan((fovDeg * Math.PI) / 180 / 2) * dist;
  return { halfH, halfW: halfH * canvasAspect };
};

describe('Tier 2 — the relief plane is framed to the screen it is drawn on', () => {
  it('fits inside the view whatever the photo and whatever the screen', () => {
    const canvases = [0.5, 0.75, 1, 1.33, 1.78, 1.96, 2.4];   // phone upright .. wide desktop
    const photos = [0.45, 0.561, 0.75, 1, 1.5, 1.78, 3.2];    // tall phone shot .. panorama crop

    for (const canvas of canvases) {
      for (const photo of photos) {
        const width = PLANE_HEIGHT * planeAspect(photo);
        const dist = fitDistance(width, PLANE_HEIGHT, FOV, canvas);
        const { halfW, halfH } = frustumHalf(dist, FOV, canvas);
        expect(halfH).toBeGreaterThanOrEqual(PLANE_HEIGHT / 2);
        expect(halfW).toBeGreaterThanOrEqual(width / 2);
      }
    }
  });

  it('does not leave the photo adrift in a margin of empty black', () => {
    // Whichever axis is the tight one should be nearly filled, not half used.
    for (const canvas of [0.75, 1.33, 1.96]) {
      for (const photo of [0.561, 1, 1.78]) {
        const width = PLANE_HEIGHT * planeAspect(photo);
        const dist = fitDistance(width, PLANE_HEIGHT, FOV, canvas);
        const { halfW, halfH } = frustumHalf(dist, FOV, canvas);
        const fill = Math.max(PLANE_HEIGHT / 2 / halfH, width / 2 / halfW);
        expect(fill).toBeGreaterThan(0.9);
      }
    }
  });

  it('gives a portrait phone photo more of the screen than the old fixed camera did', () => {
    // 405x722, the ONE33 exterior shot: the camera used to sit at z=4 regardless.
    const width = PLANE_HEIGHT * planeAspect(405 / 722);
    const dist = fitDistance(width, PLANE_HEIGHT, FOV, 1920 / 980);
    expect(dist).toBeLessThan(4);
    expect(dist).toBeCloseTo(3.41, 1);
  });

  it('backs off far enough for a wide frame on a narrow screen', () => {
    // Here width is the binding axis, so the distance must exceed the height fit.
    const heightOnly = fitDistance(0, PLANE_HEIGHT, FOV, 0.6);
    const wide = fitDistance(PLANE_HEIGHT * 3.2, PLANE_HEIGHT, FOV, 0.6);
    expect(wide).toBeGreaterThan(heightOnly * 2);
  });

  it('stops distorting ordinary photos to fit a clamp', () => {
    // The old clamp floored the aspect at 0.6, stretching every portrait shot.
    expect(planeAspect(405 / 722)).toBeCloseTo(0.561, 3);
    expect(planeAspect(0.75)).toBe(0.75);
    expect(planeAspect(1.78)).toBe(1.78);
  });

  it('still refuses an aspect that would make a sliver or a ribbon', () => {
    expect(planeAspect(0.05)).toBe(0.45);
    expect(planeAspect(12)).toBe(3.2);
    expect(planeAspect(0)).toBe(1);
    expect(planeAspect(NaN)).toBe(1);
  });
});

describe('Tier 2 — the orbit stays inside what a depth map can honestly show', () => {
  it('keeps the stretch at a depth edge to a small part of the frame', () => {
    // A displaced photo has nothing behind its near objects. Turning the camera
    // drags that emptiness into a smear as wide as the depth step times sin(angle).
    const width = PLANE_HEIGHT * planeAspect(0.561);
    const smear = DEPTH_SCALE * Math.sin(MAX_AZIMUTH);
    expect(smear / width).toBeLessThan(0.1);
  });

  it('still swings far enough for the parallax to be visible at all', () => {
    const smear = DEPTH_SCALE * Math.sin(MAX_AZIMUTH);
    expect(smear).toBeGreaterThan(0.1);       // world units of near-vs-far travel
    expect(MAX_AZIMUTH).toBeGreaterThan(0.2);
  });

  it('never lets the plane turn far enough to read as a tilted board', () => {
    expect(MAX_AZIMUTH).toBeLessThan(0.35);   // ~20 degrees
    expect(MAX_POLAR).toBeLessThan(MAX_AZIMUTH);
  });
});

describe('Tier 2 — fog must sit behind the picture, not on it', () => {
  /** The furthest point of the displaced plane from a camera on the axis. */
  const furthest = (dist: number, width: number) =>
    Math.hypot(width / 2, PLANE_HEIGHT / 2, dist + DEPTH_SCALE * 0.55);

  it('never begins before the furthest corner of the plane', () => {
    for (const canvas of [0.5, 0.75, 0.942, 1.21, 1.33, 1.78, 1.96, 2.4]) {
      for (const photo of [0.45, 0.561, 1, 1.683, 1.78, 3.2]) {
        const width = PLANE_HEIGHT * planeAspect(photo);
        const dist = fitDistance(width, PLANE_HEIGHT, FOV, canvas);
        const [near, far] = fogRange(dist, width, PLANE_HEIGHT);
        expect(near).toBeGreaterThan(furthest(dist, width));
        expect(far).toBeGreaterThan(near);
      }
    }
  });

  it('shows why a fixed range could not work once the camera moved', () => {
    // The measured case: a 685x407 photo on a 654x694 canvas put the camera at
    // 6.09 while fog started at 6, so the plane rendered inside it.
    const width = PLANE_HEIGHT * planeAspect(685 / 407);
    const dist = fitDistance(width, PLANE_HEIGHT, FOV, 654.4 / 694.4);
    expect(dist).toBeCloseTo(6.09, 1);

    const OLD_FOG_NEAR = 6;
    expect(furthest(dist, width)).toBeGreaterThan(OLD_FOG_NEAR);   // the bug
    expect(fogRange(dist, width, PLANE_HEIGHT)[0]).toBeGreaterThan(furthest(dist, width));
  });
});

describe('Tier 2 — the backing plate must stay behind the picture', () => {
  it('clears the deepest point the photo can recede to', () => {
    // displacementBias is negative: unlit, distant parts of the photo are pushed
    // away from the viewer. A plate in front of that point cuts through the image.
    for (const scale of [0.2, 0.35, 0.5, 0.8, 1.2]) {
      const deepest = -(scale * 0.55);
      const frontFace = backingPlateZ(scale) + BACKING_DEPTH / 2;
      expect(frontFace).toBeLessThan(deepest);
    }
  });

  it('reproduces the geometry that hid all but the foreground', () => {
    // What shipped: plate centred at -0.06, 0.08 thick, so its face sat at -0.02
    // while the surface reached -0.275. Everything behind -0.02 was swallowed.
    const shippedFrontFace = -0.06 + 0.08 / 2;
    const deepest = -(DEPTH_SCALE * 0.55);
    expect(shippedFrontFace).toBeGreaterThan(deepest);          // the bug
    expect(backingPlateZ() + BACKING_DEPTH / 2).toBeLessThan(deepest);
  });

  it('does not push the plate so far back it stops framing the photo', () => {
    expect(backingPlateZ()).toBeGreaterThan(-1);
  });
});
