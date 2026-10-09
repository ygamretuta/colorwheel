import { describe, expect, it } from 'vitest';
import { HARMONIES } from '@/features/harmony/harmony';
import { contrastRatio } from '@/shared/color/contrast';
import { hexToHsl, hexToRgb } from '@/shared/color/convert';
import { deltaE, rgbToLab } from '@/shared/color/lab';
import { suggestPairings } from './suggest';

const BASE = '#3366cc';
const lab = (hex: string) => rgbToLab(hexToRgb(hex));
const flat = (harmony: string) => suggestPairings(BASE, harmony).flatMap((s) => s.colors);

describe('suggestPairings', () => {
  it('defaults to the complementary scheme', () => {
    expect(suggestPairings(BASE)).toEqual(suggestPairings(BASE, 'complementary'));
  });

  it('changes when the wheel type changes', () => {
    const keys = Object.keys(HARMONIES).map((type) => JSON.stringify(suggestPairings(BASE, type)));
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('always offers a one-color best match and at most three suggestions', () => {
    Object.keys(HARMONIES).forEach((type) => {
      const result = suggestPairings(BASE, type);
      expect(result[0].id).toBe('best-match');
      expect(result[0].colors).toHaveLength(1);
      expect(result.length).toBeGreaterThanOrEqual(2);
      expect(result.length).toBeLessThanOrEqual(3);
      result.forEach((s) => expect(s.colors.length).toBeGreaterThanOrEqual(1));
    });
  });

  it('offers the full scheme only for wheel types with three or more partners', () => {
    expect(suggestPairings(BASE, 'complementary').map((s) => s.id)).toEqual([
      'best-match',
      'balanced-pair',
    ]);
    expect(suggestPairings(BASE, 'square').map((s) => s.id)).toEqual([
      'best-match',
      'balanced-pair',
      'full-scheme',
    ]);
  });

  it('draws colors from the selected scheme: triadic partners are 120° apart, not complements', () => {
    expect(flat('triadic')).not.toEqual(flat('complementary'));
    expect(suggestPairings(BASE, 'square').at(-1)!.colors).toHaveLength(3);
  });

  it('best match has usable contrast with the base', () => {
    Object.keys(HARMONIES).forEach((type) => {
      const [best] = suggestPairings(BASE, type);
      expect(contrastRatio(best.colors[0], BASE)).toBeGreaterThanOrEqual(3);
    });
  });

  it('handles greys, still following the wheel type', () => {
    const complementary = suggestPairings('#808080', 'complementary');
    const triadic = suggestPairings('#808080', 'triadic');
    expect(complementary).not.toEqual(triadic);
    [...complementary, ...triadic].forEach((s) =>
      s.colors.forEach((c) => expect(c).toMatch(/^#[0-9a-f]{6}$/)),
    );
  });

  it('rejects invalid input', () => {
    expect(() => suggestPairings('nope')).toThrow();
    expect(() => suggestPairings(BASE, 'nope')).toThrow();
  });
});

describe('suggestPairings with the other chosen colors', () => {
  const hue = (hex: string) => Math.round(hexToHsl(hex).h);
  const COMBO = ['#00ff00']; // with base red, triadic partners overlap: both agree on blue

  it('is unchanged when no other colors are chosen', () => {
    expect(suggestPairings(BASE, 'triadic', [])).toEqual(suggestPairings(BASE, 'triadic'));
    expect(suggestPairings(BASE, 'triadic', [BASE, 'nope'])).toEqual(
      suggestPairings(BASE, 'triadic'),
    );
  });

  it('puts the partner that several chosen colors agree on first', () => {
    const [best] = suggestPairings('#ff0000', 'triadic', COMBO);
    // blue: the triadic partner of both red and green
    expect(Math.abs(hue(best.colors[0]) - 240)).toBeLessThanOrEqual(12);
    expect(best.reason).toMatch(/2 of your 2 colors agree/);
  });

  it('adapts to the combination: different chosen colors give different suggestions', () => {
    const a = suggestPairings(BASE, 'analogous', ['#e63946']);
    const b = suggestPairings(BASE, 'analogous', ['#2d6a4f']);
    expect(JSON.stringify(a)).not.toBe(JSON.stringify(b));
    expect(JSON.stringify(a)).not.toBe(JSON.stringify(suggestPairings(BASE, 'analogous')));
  });

  it('never offers a color that just repeats one already chosen', () => {
    const chosen = ['#cc9933', '#33cc4c', '#cc33b2'];
    suggestPairings(BASE, 'square', chosen).forEach(({ colors }) =>
      colors.forEach((color) =>
        [BASE, ...chosen].forEach((taken) =>
          expect(deltaE(lab(color), lab(taken))).toBeGreaterThanOrEqual(10),
        ),
      ),
    );
  });

  it('keeps the same shape: a one-color best match first, then up to three suggestions', () => {
    const result = suggestPairings(BASE, 'square', ['#e63946']);
    expect(result[0].id).toBe('best-match');
    expect(result[0].colors).toHaveLength(1);
    expect(result.length).toBeGreaterThanOrEqual(2);
    expect(result.length).toBeLessThanOrEqual(3);
  });

  it('works when every color is grey, falling back to the neutral-friendly suggestions', () => {
    expect(suggestPairings('#808080', 'triadic', ['#cccccc'])).toEqual(
      suggestPairings('#808080', 'triadic'),
    );
  });

  it('treats grey context as a constraint, not a source of partners', () => {
    const result = suggestPairings(BASE, 'triadic', ['#808080']);
    expect(result[0].colors[0]).toMatch(/^#[0-9a-f]{6}$/);
    expect(JSON.stringify(result)).not.toBe(JSON.stringify(suggestPairings(BASE, 'triadic')));
  });

  it('offers shades instead of repeats when the chosen colors already complete the scheme', () => {
    // with #3366cc these are the whole square scheme
    const complete = ['#cc9933', '#33cc4c', '#cc33b2'];
    const result = suggestPairings(BASE, 'square', complete);
    expect(result[0].label).toBe('Add depth');
    expect(result[0].reason).toMatch(/already complete the square scheme/);
    result.forEach(({ colors }) =>
      colors.forEach((color) =>
        [BASE, ...complete].forEach((taken) =>
          expect(deltaE(lab(color), lab(taken))).toBeGreaterThanOrEqual(15),
        ),
      ),
    );
  });

  it('works across every wheel type', () => {
    Object.keys(HARMONIES).forEach((type) => {
      const result = suggestPairings(BASE, type, ['#e63946', '#f1faee']);
      expect(result.length).toBeGreaterThanOrEqual(1);
      result.forEach(({ colors }) =>
        colors.forEach((color) => expect(color).toMatch(/^#[0-9a-f]{6}$/)),
      );
    });
  });
});
