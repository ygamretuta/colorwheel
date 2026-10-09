import { describe, expect, it } from 'vitest';
import { contrastRatio, ensureContrast, readableTextColor } from './contrast';

describe('contrast', () => {
  it('matches WCAG reference values', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 0);
    expect(contrastRatio('#777777', '#777777')).toBeCloseTo(1);
  });

  it('picks readable text', () => {
    expect(readableTextColor('#ffffff')).toBe('#000000');
    expect(readableTextColor('#000000')).toBe('#ffffff');
  });

  it('ensureContrast reaches the target when possible', () => {
    const adjusted = ensureContrast('#7799dd', '#6688cc', 3);
    expect(contrastRatio(adjusted, '#6688cc')).toBeGreaterThanOrEqual(3);
  });
});
