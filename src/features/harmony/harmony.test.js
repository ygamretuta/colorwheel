import { describe, expect, it } from 'vitest';
import { hexToHsl } from '@/shared/color/convert.js';
import { HARMONIES, generateAllHarmonies, generateHarmony } from './harmony.js';

const hue = (hex) => Math.round(hexToHsl(hex).h);
const hueGap = (a, b) => Math.min(Math.abs(a - b), 360 - Math.abs(a - b));
const lightness = (hex) => hexToHsl(hex).l;

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

  it('monochromatic keeps the hue and varies lightness', () => {
    const colors = generateHarmony('#3366cc', 'monochromatic');
    colors.forEach((color) => expect(hueGap(hue(color), hue('#3366cc'))).toBeLessThanOrEqual(6)); // 8-bit rounding drifts a few degrees
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

describe('harmony output is always usable', () => {
  const BASES = ['#3366cc', '#e63946', '#ffeb3b', '#00ff00', '#ff0000', '#808080', '#ffffff', '#000000', '#f1faee', '#0a0a1a', '#fafafa', '#111111'];

  it.each(BASES)('has no repeated colors for %s in any wheel type', (base) => {
    Object.keys(HARMONIES).forEach((type) => {
      const colors = generateHarmony(base, type);
      expect(new Set(colors).size, `${base} ${type}: ${colors.join(' ')}`).toBe(colors.length);
      colors.forEach((color) => expect(color).toMatch(/^#[0-9a-f]{6}$/));
    });
  });

  it.each(BASES)('always starts with the base, %s', (base) => {
    Object.keys(HARMONIES).forEach((type) => expect(generateHarmony(base, type)[0]).toBe(base));
  });

  it('gives chromatic colors the same number of partners as before', () => {
    expect(generateHarmony('#3366cc', 'complementary')).toHaveLength(2);
    expect(generateHarmony('#3366cc', 'triadic')).toHaveLength(3);
    expect(generateHarmony('#3366cc', 'square')).toHaveLength(4);
    expect(generateHarmony('#3366cc', 'monochromatic')).toHaveLength(5);
  });
});

describe('harmony for greys, whites and blacks', () => {
  it.each(['#808080', '#ffffff', '#000000'])('gives %s real colors, not copies of itself', (base) => {
    ['complementary', 'analogous', 'triadic', 'square'].forEach((type) => {
      const colors = generateHarmony(base, type);
      expect(colors.length).toBeGreaterThan(2);
      expect(colors.slice(1).some((color) => hexToHsl(color).s > 30)).toBe(true);
    });
  });

  it('builds the scheme around a blue accent: base, accent, then the accent partners', () => {
    const [base, accent, partner] = generateHarmony('#808080', 'complementary');
    expect(base).toBe('#808080');
    expect(Math.abs(hue(accent) - 210)).toBeLessThanOrEqual(3);
    expect(hueGap(hue(partner), hue(accent))).toBeGreaterThanOrEqual(175); // complement of the accent
  });

  it('picks an accent that stands out from a light or dark neutral', () => {
    const onWhite = generateHarmony('#ffffff', 'complementary')[1];
    const onBlack = generateHarmony('#000000', 'complementary')[1];
    expect(lightness(onWhite)).toBeLessThan(lightness(onBlack));
  });

  it.each(['#f1faee', '#0a0a1a', '#fafafa'])('treats the near-neutral %s as neutral too', (base) => {
    // a barely tinted color has no usable hue, so its "complement" must not be a near copy of it
    const colors = generateHarmony(base, 'complementary');
    expect(colors.length).toBe(3);
    expect(hexToHsl(colors[1]).s).toBeGreaterThan(30);
  });

  it('monochromatic of a neutral is a grey ramp of distinct steps', () => {
    const colors = generateHarmony('#808080', 'monochromatic');
    expect(new Set(colors).size).toBe(5);
    colors.forEach((color) => expect(hexToHsl(color).s).toBeLessThan(2));
  });
});

describe('monochromatic ramp', () => {
  it.each(['#f1faee', '#0a0a1a', '#ffffff', '#000000', '#3366cc', '#ffeb3b'])('has five distinct shades for %s, light to dark after the base', (base) => {
    const colors = generateHarmony(base, 'monochromatic');
    expect(colors).toHaveLength(5);
    expect(new Set(colors).size).toBe(5);
    const shades = colors.slice(1).map(lightness);
    expect(shades).toEqual([...shades].sort((a, b) => b - a));
  });

  it('spaces the steps out instead of piling them up at the ends', () => {
    const lights = generateHarmony('#f1faee', 'monochromatic').map(lightness).sort((a, b) => a - b);
    for (let i = 1; i < lights.length; i += 1) expect(lights[i] - lights[i - 1]).toBeGreaterThan(8);
  });
});

