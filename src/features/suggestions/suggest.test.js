import { describe, expect, it } from 'vitest';
import { HARMONIES } from '@/features/harmony/harmony.js';
import { contrastRatio } from '@/shared/color/contrast.js';
import { suggestPairings } from './suggest.js';

const BASE = '#3366cc';
const flat = (harmony) => suggestPairings(BASE, harmony).flatMap((s) => s.colors);

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
    expect(suggestPairings(BASE, 'complementary').map((s) => s.id)).toEqual(['best-match', 'balanced-pair']);
    expect(suggestPairings(BASE, 'square').map((s) => s.id)).toEqual(['best-match', 'balanced-pair', 'full-scheme']);
  });

  it('draws colors from the selected scheme: triadic partners are 120° apart, not complements', () => {
    expect(flat('triadic')).not.toEqual(flat('complementary'));
    expect(suggestPairings(BASE, 'square').at(-1).colors).toHaveLength(3);
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
    [...complementary, ...triadic].forEach((s) => s.colors.forEach((c) => expect(c).toMatch(/^#[0-9a-f]{6}$/)));
  });

  it('rejects invalid input', () => {
    expect(() => suggestPairings('nope')).toThrow();
    expect(() => suggestPairings(BASE, 'nope')).toThrow();
  });
});
