import { describe, expect, it } from 'vitest';
import { contrastRatio, luminance } from '@/shared/color/contrast.js';
import { assignRoles } from './roles.js';

const PALETTE = ['#1d3557', '#457b9d', '#a8dadc', '#f1faee', '#e63946'];

describe('assignRoles', () => {
  it('returns null for an empty palette', () => {
    expect(assignRoles([])).toBeNull();
    expect(assignRoles(['nope'])).toBeNull();
  });

  it('puts the extremes at dark and light', () => {
    const roles = assignRoles(PALETTE);
    expect(roles.dark).toBe('#1d3557');
    expect(roles.light).toBe('#f1faee');
    expect(luminance(roles.dark)).toBeLessThan(luminance(roles.light));
  });

  it('picks the most vivid remaining color as the accent', () => {
    const roles = assignRoles(PALETTE);
    expect(roles.accent).toBe('#e63946');
    expect(PALETTE).toContain(roles.mid);
    expect(roles.mid).not.toBe(roles.accent);
  });

  it('only uses colors from the palette when it is big enough', () => {
    const roles = assignRoles(PALETTE);
    [roles.dark, roles.light, roles.accent, roles.mid].forEach((color) => expect(PALETTE).toContain(color));
  });

  it('pads a single color into a usable set of distinct roles', () => {
    const roles = assignRoles(['#3366cc']);
    const distinct = new Set([roles.dark, roles.light, roles.accent, roles.mid]);
    expect(distinct.size).toBeGreaterThanOrEqual(3);
    expect(luminance(roles.dark)).toBeLessThan(luminance(roles.light));
  });

  it('normalizes and de-duplicates input', () => {
    const roles = assignRoles(['#ABC', '#aabbcc', '#AABBCC']);
    expect(roles.dark).toMatch(/^#[0-9a-f]{6}$/);
  });

  it('provides readable text colors for every role', () => {
    const roles = assignRoles(PALETTE);
    expect(contrastRatio(roles.dark, roles.onDark)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(roles.light, roles.onLight)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(roles.accent, roles.onAccent)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(roles.mid, roles.onMid)).toBeGreaterThanOrEqual(4.5);
  });
});
