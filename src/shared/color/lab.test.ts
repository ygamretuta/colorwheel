import { describe, expect, it } from 'vitest';
import { deltaE, rgbToLab } from './lab';

describe('lab', () => {
  it('maps black and white to the ends of the lightness scale', () => {
    expect(rgbToLab({ r: 0, g: 0, b: 0 }).l).toBeCloseTo(0, 1);
    expect(rgbToLab({ r: 255, g: 255, b: 255 }).l).toBeCloseTo(100, 1);
  });

  it('keeps greys neutral', () => {
    const grey = rgbToLab({ r: 128, g: 128, b: 128 });
    expect(Math.abs(grey.a)).toBeLessThan(0.5);
    expect(Math.abs(grey.b)).toBeLessThan(0.5);
  });

  it('matches known reference values for pure red', () => {
    const red = rgbToLab({ r: 255, g: 0, b: 0 });
    expect(red.l).toBeCloseTo(53.24, 1);
    expect(red.a).toBeCloseTo(80.09, 0);
    expect(red.b).toBeCloseTo(67.2, 0);
  });

  it('measures distance: identical = 0, near < far', () => {
    const a = rgbToLab({ r: 200, g: 50, b: 50 });
    expect(deltaE(a, a)).toBe(0);
    expect(deltaE(a, rgbToLab({ r: 202, g: 52, b: 50 }))).toBeLessThan(
      deltaE(a, rgbToLab({ r: 30, g: 30, b: 200 })),
    );
  });
});
