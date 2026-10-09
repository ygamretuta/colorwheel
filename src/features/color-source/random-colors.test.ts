import { describe, expect, it } from 'vitest';
import { deltaE, rgbToLab } from '@/shared/color/lab';
import { hexToHsl, hexToRgb } from '@/shared/color/convert';
import { RANDOM_SWATCH_COUNT, randomSwatches } from './random-colors';

/** A small deterministic random source, so each test sees the same numbers every run. */
const seeded = (seed: number) => {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
};

const lab = (hex: string) => rgbToLab(hexToRgb(hex));
const gap = (a: number, b: number) => Math.min(Math.abs(a - b), 360 - Math.abs(a - b));

describe('randomSwatches', () => {
  it('gives the default number of valid hex colors', () => {
    const colors = randomSwatches(undefined, seeded(1));
    expect(colors).toHaveLength(RANDOM_SWATCH_COUNT);
    colors.forEach((color) => expect(color).toMatch(/^#[0-9a-f]{6}$/));
  });

  it('honors a custom count', () => {
    expect(randomSwatches(4, seeded(1))).toHaveLength(4);
    expect(randomSwatches(9, seeded(1))).toHaveLength(9);
  });

  it('is predictable for a given random source and different for another', () => {
    expect(randomSwatches(6, seeded(7))).toEqual(randomSwatches(6, seeded(7)));
    expect(randomSwatches(6, seeded(7))).not.toEqual(randomSwatches(6, seeded(8)));
  });

  it('really varies with Math.random by default', () => {
    const draws = new Set(Array.from({ length: 5 }, () => randomSwatches().join()));
    expect(draws.size).toBeGreaterThan(1);
  });

  it.each([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])('never repeats a color, and every pair looks clearly different (seed %i)', (seed) => {
    const colors = randomSwatches(6, seeded(seed));
    expect(new Set(colors).size).toBe(colors.length);
    colors.forEach((a, i) =>
      colors.slice(i + 1).forEach((b) => expect(deltaE(lab(a), lab(b))).toBeGreaterThan(20)),
    );
  });

  it.each([11, 12, 13, 14, 15])('spreads the hues around the whole wheel, not in one corner (seed %i)', (seed) => {
    const hues = randomSwatches(6, seeded(seed)).map((color) => hexToHsl(color).h);
    const sorted = [...hues].sort((a, b) => a - b);
    const gaps = sorted.map((hue, i) => gap(hue, sorted[(i + 1) % sorted.length]));
    // with 6 swatches the even slot is 60°; jitter only moves a hue ±12°, so neighbors stay well apart
    gaps.forEach((g) => expect(g).toBeGreaterThan(30));
    expect(Math.max(...gaps)).toBeLessThan(100);
  });

  it.each([21, 22, 23, 24, 25])('keeps the colors vivid but neither near-black nor near-white (seed %i)', (seed) => {
    randomSwatches(6, seeded(seed)).forEach((color) => {
      const { s, l } = hexToHsl(color);
      expect(s).toBeGreaterThan(50);
      expect(l).toBeGreaterThan(35);
      expect(l).toBeLessThan(70);
    });
  });

  it('works with a random source at its extremes', () => {
    expect(() => randomSwatches(6, () => 0)).not.toThrow();
    expect(() => randomSwatches(6, () => 0.999999)).not.toThrow();
    randomSwatches(6, () => 0.999999).forEach((color) => expect(color).toMatch(/^#[0-9a-f]{6}$/));
  });
});
