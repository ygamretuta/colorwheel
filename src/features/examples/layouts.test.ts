import { describe, expect, it } from 'vitest';
import { LANDING_RECTS, POSTER_RECTS, roleShares } from './layouts';

describe('60-30-10 layouts', () => {
  it.each([
    ['landing page', LANDING_RECTS],
    ['poster', POSTER_RECTS],
  ])('%s covers 60% / 30% / 10%', (_name, rects) => {
    const shares = roleShares(rects);
    expect(shares.dominant).toBeCloseTo(0.6, 3);
    expect(shares.secondary).toBeCloseTo(0.3, 3);
    expect(shares.accent).toBeCloseTo(0.1, 3);
  });

  it('keeps every block on the canvas', () => {
    [...LANDING_RECTS, ...POSTER_RECTS].forEach(({ x, y, width, height }) => {
      expect(x).toBeGreaterThanOrEqual(0);
      expect(y).toBeGreaterThanOrEqual(0);
      expect(x + width).toBeLessThanOrEqual(200);
      expect(y + height).toBeLessThanOrEqual(300);
    });
  });

  it('does not overlap blocks, so the shares are exact', () => {
    [LANDING_RECTS, POSTER_RECTS].forEach((rects) => {
      rects.forEach((a, i) =>
        rects.slice(i + 1).forEach((b) => {
          const overlaps = a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;
          expect(overlaps).toBe(false);
        }),
      );
    });
  });
});
