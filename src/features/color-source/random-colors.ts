import { hslToHex } from '@/shared/color/convert';

export const RANDOM_SWATCH_COUNT = 6;

const SATURATION = { min: 60, spread: 25 }; // vivid, but not neon
const LIGHTNESS = { min: 42, spread: 20 }; // never so dark or so light that a color looks like black or white
const HUE_JITTER = 0.4; // how far a hue may stray from its even slot, as a share of the slot width

/**
 * A handful of clearly different colors to start from. Instead of drawing independent random hues,
 * which can clump, the hues are spaced evenly around the wheel from a random starting point and each is
 * nudged a little, so every swatch sits in its own region. `random` returns [0, 1) and can be replaced
 * to make the result predictable.
 */
export function randomSwatches(count: number = RANDOM_SWATCH_COUNT, random: () => number = Math.random): string[] {
  const slot = 360 / count;
  const start = random() * 360;
  return Array.from({ length: count }, (_, index) =>
    hslToHex({
      h: start + index * slot + (random() - 0.5) * slot * HUE_JITTER,
      s: SATURATION.min + random() * SATURATION.spread,
      l: LIGHTNESS.min + random() * LIGHTNESS.spread,
    }),
  );
}
