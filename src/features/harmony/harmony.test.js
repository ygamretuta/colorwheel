import { describe, expect, it } from 'vitest';
import { hexToHsl } from '@/shared/color/convert.js';
import { HARMONIES, generateAllHarmonies, generateHarmony } from './harmony.js';

const hue = (hex) => Math.round(hexToHsl(hex).h);

describe('harmony', () => {
  it('complementary is 180° away', () => {
    expect(generateHarmony('#ff0000', 'complementary')).toEqual(['#ff0000', '#00ffff']);
  });

  it('triadic is evenly spaced by 120°', () => {
    expect(generateHarmony('#ff0000', 'triadic').map(hue)).toEqual([0, 120, 240]);
  });

  it('square is evenly spaced by 90°', () => {
    expect(generateHarmony('#ff0000', 'square').map(hue)).toEqual([0, 90, 180, 270]);
  });

  it('analogous surrounds the base', () => {
    expect(generateHarmony('#ff0000', 'analogous').map(hue)).toEqual([0, 330, 30]);
  });

  it('monochromatic keeps hue and varies lightness', () => {
    const colors = generateHarmony('#3366cc', 'monochromatic');
    expect(new Set(colors.map(hue)).size).toBe(1);
    expect(new Set(colors).size).toBe(colors.length);
  });

  it('always starts with the normalized base', () => {
    Object.keys(HARMONIES).forEach((type) => {
      expect(generateHarmony('F00', type)[0]).toBe('#ff0000');
    });
  });

  it('rejects bad input', () => {
    expect(() => generateHarmony('nope', 'triadic')).toThrow();
    expect(() => generateHarmony('#fff', 'nope')).toThrow();
  });

  it('generates every scheme', () => {
    expect(generateAllHarmonies('#3366cc')).toHaveLength(Object.keys(HARMONIES).length);
  });
});

describe('harmony metadata', () => {
  it('describes every scheme', () => {
    Object.values(HARMONIES).forEach((scheme) => expect(scheme.description).toBeTruthy());
  });
});
