import { describe, expect, it } from 'vitest';

import { contrastRatio, luminance } from '@/shared/color/contrast';

import { assignFourColor, assignRoles, assignSixtyThirtyTen } from './roles';

const PALETTE = ['#1d3557', '#457b9d', '#a8dadc', '#f1faee', '#e63946'];

describe('assignRoles', () => {
  it('returns null for an empty palette', () => {
    expect(assignRoles([])).toBeNull();
    expect(assignRoles(['nope'])).toBeNull();
  });

  it('puts the extremes at dark and light', () => {
    const roles = assignRoles(PALETTE)!;
    expect(roles.dark).toBe('#1d3557');
    expect(roles.light).toBe('#f1faee');
    expect(luminance(roles.dark)).toBeLessThan(luminance(roles.light));
  });

  it('picks the most vivid remaining color as the accent', () => {
    const roles = assignRoles(PALETTE)!;
    expect(roles.accent).toBe('#e63946');
    expect(PALETTE).toContain(roles.mid);
    expect(roles.mid).not.toBe(roles.accent);
  });

  it('only uses colors from the palette when it is big enough', () => {
    const roles = assignRoles(PALETTE)!;
    [roles.dark, roles.light, roles.accent, roles.mid].forEach((color) =>
      expect(PALETTE).toContain(color),
    );
  });

  it('pads a single color into a usable set of distinct roles', () => {
    const roles = assignRoles(['#3366cc'])!;
    const distinct = new Set([roles.dark, roles.light, roles.accent, roles.mid]);
    expect(distinct.size).toBeGreaterThanOrEqual(3);
    expect(luminance(roles.dark)).toBeLessThan(luminance(roles.light));
  });

  it('normalizes and de-duplicates input', () => {
    const roles = assignRoles(['#ABC', '#aabbcc', '#AABBCC'])!;
    expect(roles.dark).toMatch(/^#[0-9a-f]{6}$/);
  });

  it('provides readable text colors for every role', () => {
    const roles = assignRoles(PALETTE)!;
    expect(contrastRatio(roles.dark, roles.onDark)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(roles.light, roles.onLight)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(roles.accent, roles.onAccent)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(roles.mid, roles.onMid)).toBeGreaterThanOrEqual(4.5);
  });
});

describe('assignFourColor', () => {
  it('returns null for an empty palette', () => {
    expect(assignFourColor([])).toBeNull();
    expect(assignFourColor(['nope'])).toBeNull();
  });

  it('gives four different colors, all from a four-color palette', () => {
    const roles = assignFourColor(PALETTE.slice(0, 4))!;
    const four = [roles.dominant, roles.secondary, roles.accent, roles.highlight];
    expect(new Set(four).size).toBe(4);
    four.forEach((color) => expect(PALETTE.slice(0, 4)).toContain(color));
  });

  it('keeps dominant, secondary and accent exactly as 60-30-10 chooses them', () => {
    const palette = ['#1d3557', '#457b9d', '#a8dadc', '#e63946'];
    const four = assignFourColor(palette)!;
    const three = assignSixtyThirtyTen(palette)!;
    expect(four.dominant).toBe(three.dominant);
    expect(four.secondary).toBe(three.secondary);
    expect(four.accent).toBe(three.accent);
  });

  it('makes the color that is left over the highlight', () => {
    const palette = ['#1d3557', '#457b9d', '#a8dadc', '#e63946'];
    const roles = assignFourColor(palette)!;
    const used = new Set([roles.dominant, roles.secondary, roles.accent]);
    expect(palette.filter((color) => !used.has(color))).toEqual([roles.highlight]);
  });

  it('gives each role text that reads on it', () => {
    const roles = assignFourColor(PALETTE.slice(0, 4))!;
    expect(contrastRatio(roles.highlight, roles.onHighlight)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(roles.accent, roles.onAccent)).toBeGreaterThanOrEqual(4.5);
  });

  it('pads a small palette into four distinct roles', () => {
    const one = assignFourColor(['#3366cc'])!;
    expect(new Set([one.dominant, one.secondary, one.accent, one.highlight]).size).toBe(4);
    const two = assignFourColor(['#3366cc', '#cc9933'])!;
    expect(new Set([two.dominant, two.secondary, two.accent, two.highlight]).size).toBe(4);
  });

  it('copes with a palette bigger than four', () => {
    const roles = assignFourColor(PALETTE)!; // five colors
    expect(new Set([roles.dominant, roles.secondary, roles.accent, roles.highlight]).size).toBe(4);
  });
});
