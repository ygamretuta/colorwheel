import { describe, expect, it } from 'vitest';
import {
  chroma,
  hexToHsl,
  hexToRgb,
  hslToHex,
  isNeutral,
  normalizeHex,
  rgbToHex,
  rotateHue,
} from './convert';

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

describe('chroma and isNeutral', () => {
  it('measures channel spread, independent of lightness', () => {
    expect(chroma('#808080')).toBe(0);
    expect(chroma('#ffffff')).toBe(0);
    expect(chroma('#ff0000')).toBe(1);
    expect(chroma('#3366cc')).toBeCloseTo(0.6, 1);
  });

  it('calls greys, whites, blacks and faint tints neutral', () => {
    ['#808080', '#ffffff', '#000000', '#f1faee', '#0a0a1a', '#fafafa'].forEach((hex) =>
      expect(isNeutral(hex)).toBe(true),
    );
  });

  it('keeps real colors, including dark and pale ones, non-neutral', () => {
    ['#3366cc', '#e63946', '#ffeb3b', '#a8dadc', '#1d3557', '#fff3b0'].forEach((hex) =>
      expect(isNeutral(hex)).toBe(false),
    );
  });
});
