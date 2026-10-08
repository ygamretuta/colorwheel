import { describe, expect, it } from 'vitest';
import { hexToRgb } from '@/shared/color/convert.js';
import { extractPalette } from './extract.js';

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
