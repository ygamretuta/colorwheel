import { describe, expect, it } from 'vitest';
import { averageHex, toCanvasPoint } from './sample.js';

describe('sample', () => {
  it('averages pixels and skips transparent ones', () => {
    const data = new Uint8ClampedArray([255, 0, 0, 255, 0, 0, 255, 255, 9, 9, 9, 0]);
    expect(averageHex({ data })).toBe('#800080');
  });

  it('returns null when everything is transparent', () => {
    expect(averageHex({ data: new Uint8ClampedArray([1, 2, 3, 0]) })).toBeNull();
  });

  it('maps pointer position to canvas pixels when scaled', () => {
    const rect = { left: 10, top: 20, width: 100, height: 50 };
    const canvas = { width: 400, height: 200 };
    expect(toCanvasPoint({ clientX: 60, clientY: 45 }, rect, canvas)).toEqual({ x: 200, y: 100 });
  });
});
