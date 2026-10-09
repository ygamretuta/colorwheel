import { describe, expect, it } from 'vitest';
import { hexToRgb } from '@/shared/color/convert.js';
import { deltaE, rgbToLab } from '@/shared/color/lab.js';
import { extractPalette, extractPaletteWithShares } from './extract.js';

/** Build ImageData-like pixels from [r, g, b, count] runs. */
const image = (...runs) => {
  const data = [];
  runs.forEach(([r, g, b, count, a = 255]) => {
    for (let i = 0; i < count; i += 1) data.push(r, g, b, a);
  });
  return { data: new Uint8ClampedArray(data) };
};

const close = (hex, [r, g, b], tolerance = 6) => {
  const c = hexToRgb(hex);
  return Math.abs(c.r - r) <= tolerance && Math.abs(c.g - g) <= tolerance && Math.abs(c.b - b) <= tolerance;
};

describe('extractPalette', () => {
  it('finds each distinct color, most common first', () => {
    const palette = extractPalette(image([255, 0, 0, 50], [0, 0, 255, 30], [0, 255, 0, 10]), 3);
    expect(palette).toHaveLength(3);
    expect(close(palette[0], [255, 0, 0])).toBe(true);
    expect(close(palette[1], [0, 0, 255])).toBe(true);
    expect(close(palette[2], [0, 255, 0])).toBe(true);
  });

  it('returns a single color for a flat image', () => {
    expect(extractPalette(image([10, 20, 30, 40]), 6)).toEqual(['#0a141e']);
  });

  it('never returns more than the requested count', () => {
    const runs = Array.from({ length: 12 }, (_, i) => [i * 20, 255 - i * 20, (i * 70) % 255, 10]);
    expect(extractPalette(image(...runs), 4).length).toBeLessThanOrEqual(4);
  });

  it('drops near-duplicate colors', () => {
    const palette = extractPalette(image([200, 50, 50, 40], [202, 52, 50, 40], [30, 30, 200, 20]), 6);
    expect(palette).toHaveLength(2);
  });

  it('ignores transparent pixels and handles empty images', () => {
    expect(extractPalette(image([255, 0, 0, 20, 0], [0, 255, 0, 5]), 3)).toEqual(['#00ff00']);
    expect(extractPalette({ data: new Uint8ClampedArray() })).toEqual([]);
    expect(extractPalette(image([1, 2, 3, 5, 0]))).toEqual([]);
  });
});

// --- accuracy on realistic images -------------------------------------------------


const lab = (hex) => rgbToLab(hexToRgb(hex));
const BANDS = [[230, 57, 70], [241, 250, 238], [168, 218, 220], [69, 123, 157], [29, 53, 87]];

/** A strip of flat bands; `edge` blends the last column of each band 50/50 into the next, as a downscale does. */
const strip = ({ width = 100, edge = false, jitter = 0, seed = 1 } = {}) => {
  let state = seed;
  const random = () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
  const data = [];
  const bandWidth = width / BANDS.length;
  for (let x = 0; x < width; x += 1) {
    const band = Math.min(BANDS.length - 1, Math.floor(x / bandWidth));
    const isEdge = edge && band < BANDS.length - 1 && x === Math.round((band + 1) * bandWidth) - 1;
    for (let y = 0; y < 40; y += 1) {
      const color = BANDS[band].map((v, k) => (isEdge ? (v + BANDS[band + 1][k]) / 2 : v) + (random() - 0.5) * 2 * jitter);
      data.push(...color.map((v) => Math.min(255, Math.max(0, Math.round(v)))), 255);
    }
  }
  return { data: new Uint8ClampedArray(data) };
};

const matches = (palette, rgb) => palette.some((hex) => deltaE(lab(hex), rgbToLab({ r: rgb[0], g: rgb[1], b: rgb[2] })) < 6);

describe('extractPalette accuracy', () => {
  it('returns only real colors when band edges are blended (no muddy in-between swatch)', () => {
    const palette = extractPalette(strip({ edge: true }), 6);
    expect(palette).toHaveLength(5);
    BANDS.forEach((rgb) => expect(matches(palette, rgb)).toBe(true));
  });

  it('recovers the true colors through photographic noise', () => {
    const palette = extractPalette(strip({ jitter: 8 }), 6);
    expect(palette).toHaveLength(5);
    BANDS.forEach((rgb) => expect(matches(palette, rgb)).toBe(true));
  });

  it('weights by coverage: the biggest area comes first', () => {
    const image = [[255, 0, 0, 10], [0, 0, 255, 60], [0, 160, 0, 30]].flatMap(([r, g, b, n]) => Array.from({ length: n }, () => [r, g, b, 255]).flat());
    const result = extractPaletteWithShares({ data: new Uint8ClampedArray(image) }, 3);
    expect(result.map(({ share }) => Math.round(share * 100))).toEqual([60, 30, 10]);
    expect(result[0].hex).toBe('#0000ff');
  });

  it('shares are fractions of the opaque image and sum to 1, dropped colors included', () => {
    const result = extractPaletteWithShares(strip({ jitter: 4, edge: true }), 6);
    const total = result.reduce((sum, { share }) => sum + share, 0);
    expect(total).toBeCloseTo(1, 5);
    expect(result.map(({ share }) => share)).toEqual([...result.map(({ share }) => share)].sort((a, b) => b - a));
  });

  const solid = (...runs) => ({ data: new Uint8ClampedArray(runs.flatMap(([r, g, b, n]) => Array.from({ length: n }, () => [r, g, b, 255]).flat())) });

  it('drops specks under 1% of the image, even if they are a very different color', () => {
    expect(extractPalette(solid([20, 120, 220, 199], [250, 10, 10, 1]), 6)).toEqual(['#1478dc']);
  });

  it('keeps a small but clearly different accent (like a sun in a landscape)', () => {
    const palette = extractPalette(solid([20, 90, 160, 123], [255, 243, 176, 2]), 6); // 1.6% pale yellow on blue
    expect(palette).toHaveLength(2);
    expect(palette).toContain('#fff3b0');
  });

  it('drops a small patch that is only a variant of a bigger color', () => {
    const palette = extractPalette(solid([20, 90, 160, 123], [30, 100, 170, 2]), 6); // 1.6%, barely different
    expect(palette).toEqual(['#145aa0']);
  });

  it('keeps a large mid-tone even though it lies between two other colors', () => {
    const image = [[0, 0, 0, 35], [128, 128, 128, 30], [255, 255, 255, 35]].flatMap(([r, g, b, n]) => Array.from({ length: n }, () => [r, g, b, 255]).flat());
    expect(extractPalette({ data: new Uint8ClampedArray(image) }, 3)).toHaveLength(3);
  });

  it('turns a smooth gradient into a few clearly different colors', () => {
    const data = [];
    for (let i = 0; i < 256; i += 1) data.push(i, Math.round(i / 2), 255 - i, 255);
    const palette = extractPalette({ data: new Uint8ClampedArray(data) }, 4);
    expect(palette.length).toBeGreaterThan(0);
    expect(palette.length).toBeLessThanOrEqual(4);
    palette.forEach((a, i) => palette.slice(i + 1).forEach((b) => expect(deltaE(lab(a), lab(b))).toBeGreaterThanOrEqual(12)));
  });

  it('is deterministic', () => {
    const image = strip({ jitter: 6, edge: true, seed: 7 });
    expect(extractPalette(image, 6)).toEqual(extractPalette(image, 6));
  });

  it('returns just the dominant color when asked for one', () => {
    expect(extractPalette(strip({ jitter: 3 }), 1)).toHaveLength(1);
  });
});
