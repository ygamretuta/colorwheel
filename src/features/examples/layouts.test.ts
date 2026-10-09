import { describe, expect, it } from 'vitest';

import {
  FOUR_LANDING_RECTS,
  FOUR_POSTER_RECTS,
  LANDING_RECTS,
  POSTER_RECTS,
  roleShares,
} from './layouts';

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
          const overlaps =
            a.x < b.x + b.width &&
            b.x < a.x + a.width &&
            a.y < b.y + b.height &&
            b.y < a.y + a.height;
          expect(overlaps).toBe(false);
        }),
      );
    });
  });
});

describe('60-25-10-5 layouts', () => {
  it.each([
    ['landing page', FOUR_LANDING_RECTS],
    ['poster', FOUR_POSTER_RECTS],
  ])('%s covers exactly 60% / 25% / 10% / 5%', (_name, rects) => {
    const shares = roleShares(rects);
    expect(shares.dominant).toBeCloseTo(0.6, 4);
    expect(shares.secondary).toBeCloseTo(0.25, 4);
    expect(shares.accent).toBeCloseTo(0.1, 4);
    expect(shares.highlight).toBeCloseTo(0.05, 4);
  });

  it('the shares add up to the whole canvas', () => {
    [FOUR_LANDING_RECTS, FOUR_POSTER_RECTS].forEach((rects) => {
      const { dominant, secondary, accent, highlight } = roleShares(rects);
      expect(dominant + secondary + accent + highlight).toBeCloseTo(1, 10);
    });
  });

  it('keeps every block on the canvas and none overlapping, so the shares are exact', () => {
    [FOUR_LANDING_RECTS, FOUR_POSTER_RECTS].forEach((rects) => {
      rects.forEach((a, i) => {
        expect(a.x).toBeGreaterThanOrEqual(0);
        expect(a.y).toBeGreaterThanOrEqual(0);
        expect(a.x + a.width).toBeLessThanOrEqual(200);
        expect(a.y + a.height).toBeLessThanOrEqual(300);
        rects.slice(i + 1).forEach((b) => {
          const overlaps =
            a.x < b.x + b.width &&
            b.x < a.x + a.width &&
            a.y < b.y + b.height &&
            b.y < a.y + a.height;
          expect(overlaps).toBe(false);
        });
      });
    });
  });

  it('uses all three block roles, and leaves the 60-30-10 layouts without a highlight', () => {
    [FOUR_LANDING_RECTS, FOUR_POSTER_RECTS].forEach((rects) => {
      expect(new Set(rects.map((r) => r.role))).toEqual(
        new Set(['secondary', 'accent', 'highlight']),
      );
    });
    expect(roleShares(LANDING_RECTS).highlight).toBe(0);
    expect(roleShares(POSTER_RECTS).highlight).toBe(0);
  });
});
