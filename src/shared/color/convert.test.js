import { describe, expect, it } from 'vitest';
import { hexToHsl, hexToRgb, hslToHex, normalizeHex, rgbToHex, rotateHue } from './convert.js';

describe('convert', () => {
  it('normalizes hex input', () => {
    expect(normalizeHex('ABC')).toBe('#aabbcc');
    expect(normalizeHex(' #3366CC ')).toBe('#3366cc');
    expect(normalizeHex('xyz')).toBeNull();
    expect(normalizeHex('#12345')).toBeNull();
  });

  it('converts hex <-> rgb', () => {
    expect(hexToRgb('#ff8000')).toEqual({ r: 255, g: 128, b: 0 });
    expect(rgbToHex({ r: 255, g: 128, b: 0 })).toBe('#ff8000');
    expect(() => hexToRgb('nope')).toThrow();
  });

  it('converts known colors to hsl', () => {
    expect(hexToHsl('#ff0000')).toMatchObject({ h: 0, s: 100, l: 50 });
    expect(hexToHsl('#00ff00').h).toBeCloseTo(120);
    expect(hexToHsl('#0000ff').h).toBeCloseTo(240);
    expect(hexToHsl('#808080')).toMatchObject({ s: 0 });
  });

  it('round-trips through hsl', () => {
    ['#3366cc', '#e91e63', '#00bcd4', '#ffeb3b', '#101010'].forEach((hex) => {
      expect(hslToHex(hexToHsl(hex))).toBe(hex);
    });
  });

  it('rotates hue, wrapping around', () => {
    expect(rotateHue('#ff0000', 120)).toBe('#00ff00');
    expect(rotateHue('#ff0000', -120)).toBe('#0000ff');
  });
});
