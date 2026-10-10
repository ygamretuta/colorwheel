import { describe, expect, it } from 'vitest';

import { contrastRatio, luminance } from '@/shared/color/contrast';

import {
  assignFourColor,
  assignRoles,
  assignSixtyThirtyTen,
  shuffleFourColor,
  shuffleSixtyThirtyTen,
} from './roles';

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

/** A small deterministic random source, so each test sees the same numbers every run. */
const seeded = (seed: number) => {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};
const SEEDS = Array.from({ length: 40 }, (_, i) => i + 1);
const FOUR = ['#1d3557', '#457b9d', '#a8dadc', '#e63946'];

describe('shuffleSixtyThirtyTen', () => {
  const start = assignSixtyThirtyTen(FOUR)!;
  const order = (r: { dominant: string; secondary: string; accent: string }) => [
    r.dominant,
    r.secondary,
    r.accent,
  ];

  it.each(SEEDS)(
    'always gives a different arrangement from the one on screen (seed %i)',
    (seed) => {
      const next = shuffleSixtyThirtyTen(FOUR, start, seeded(seed));
      expect(order(next)).not.toEqual(order(start));
    },
  );

  it('only uses colors from the palette, each role a different color', () => {
    SEEDS.forEach((seed) => {
      const next = shuffleSixtyThirtyTen(FOUR, start, seeded(seed));
      order(next).forEach((color) => expect(FOUR).toContain(color));
      expect(new Set(order(next)).size).toBe(3);
    });
  });

  it('gives each new role text that reads on it', () => {
    SEEDS.forEach((seed) => {
      const next = shuffleSixtyThirtyTen(FOUR, start, seeded(seed));
      expect(contrastRatio(next.dominant, next.onDominant)).toBeGreaterThanOrEqual(4.5);
      expect(contrastRatio(next.accent, next.onAccent)).toBeGreaterThanOrEqual(4.5);
    });
  });

  it('never pairs a dominant and a secondary that look the same, when it can avoid it', () => {
    SEEDS.forEach((seed) => {
      const next = shuffleSixtyThirtyTen(FOUR, start, seeded(seed));
      expect(contrastRatio(next.dominant, next.secondary)).toBeGreaterThanOrEqual(1.5);
    });
  });

  it('is predictable for a given random source, and varies with it', () => {
    expect(shuffleSixtyThirtyTen(FOUR, start, seeded(5))).toEqual(
      shuffleSixtyThirtyTen(FOUR, start, seeded(5)),
    );
    const results = new Set(
      SEEDS.map((seed) => order(shuffleSixtyThirtyTen(FOUR, start, seeded(seed))).join()),
    );
    expect(results.size).toBeGreaterThan(3);
  });

  it('really uses Math.random by default', () => {
    const results = new Set(
      Array.from({ length: 30 }, () => order(shuffleSixtyThirtyTen(FOUR, start)).join()),
    );
    expect(results.size).toBeGreaterThan(1);
  });

  it('puts different colors on the 60, the 30 and the 10 over many shuffles', () => {
    const seen = {
      dominant: new Set<string>(),
      secondary: new Set<string>(),
      accent: new Set<string>(),
    };
    SEEDS.forEach((seed) => {
      const next = shuffleSixtyThirtyTen(FOUR, start, seeded(seed));
      seen.dominant.add(next.dominant);
      seen.secondary.add(next.secondary);
      seen.accent.add(next.accent);
    });
    expect(seen.dominant.size).toBeGreaterThanOrEqual(3);
    expect(seen.secondary.size).toBeGreaterThanOrEqual(3);
    expect(seen.accent.size).toBeGreaterThanOrEqual(3);
  });

  it('can bring in the color the suggestion left out', () => {
    const left = FOUR.filter((color) => !order(start).includes(color));
    expect(left).toHaveLength(1);
    const brought = SEEDS.some((seed) =>
      order(shuffleSixtyThirtyTen(FOUR, start, seeded(seed))).includes(left[0]),
    );
    expect(brought).toBe(true);
  });

  it('reaches both ends of the possibilities with the extremes of the random source', () => {
    const first = shuffleSixtyThirtyTen(FOUR, start, () => 0);
    const last = shuffleSixtyThirtyTen(FOUR, start, () => 0.999999);
    expect(order(first)).not.toEqual(order(last));
    [first, last].forEach((r) => expect(order(r)).not.toEqual(order(start)));
  });

  it('works for a palette padded up from one color', () => {
    const one = assignSixtyThirtyTen(['#3366cc'])!;
    const next = shuffleSixtyThirtyTen(['#3366cc'], one, seeded(3));
    expect(order(next)).not.toEqual(order(one));
    expect(new Set(order(next)).size).toBe(3);
  });

  it('gives the current roles back for an empty palette', () => {
    expect(shuffleSixtyThirtyTen([], start, seeded(1))).toBe(start);
  });

  it('keeps shuffling from where it is: each shuffle differs from the one before', () => {
    let current = start;
    const random = seeded(9);
    for (let i = 0; i < 10; i += 1) {
      const next = shuffleSixtyThirtyTen(FOUR, current, random);
      expect(order(next)).not.toEqual(order(current));
      current = next;
    }
  });
});

describe('shuffleFourColor', () => {
  const start = assignFourColor(FOUR)!;
  const order = (r: { dominant: string; secondary: string; accent: string; highlight: string }) => [
    r.dominant,
    r.secondary,
    r.accent,
    r.highlight,
  ];

  it.each(SEEDS)(
    'always gives a different arrangement from the one on screen (seed %i)',
    (seed) => {
      const next = shuffleFourColor(FOUR, start, seeded(seed));
      expect(order(next)).not.toEqual(order(start));
    },
  );

  it('hands the same four colors to different roles', () => {
    SEEDS.forEach((seed) => {
      const next = shuffleFourColor(FOUR, start, seeded(seed));
      expect([...order(next)].sort()).toEqual([...FOUR].sort());
    });
  });

  it('gives each new role text that reads on it, including the highlight', () => {
    SEEDS.forEach((seed) => {
      const next = shuffleFourColor(FOUR, start, seeded(seed));
      expect(contrastRatio(next.highlight, next.onHighlight)).toBeGreaterThanOrEqual(4.5);
      expect(contrastRatio(next.secondary, next.onSecondary)).toBeGreaterThanOrEqual(4.5);
    });
  });

  it('is predictable for a given random source, and varies with it', () => {
    expect(shuffleFourColor(FOUR, start, seeded(4))).toEqual(
      shuffleFourColor(FOUR, start, seeded(4)),
    );
    const results = new Set(
      SEEDS.map((seed) => order(shuffleFourColor(FOUR, start, seeded(seed))).join()),
    );
    expect(results.size).toBeGreaterThan(5);
  });

  it('puts each color in several different roles over many shuffles', () => {
    FOUR.forEach((color) => {
      const roles = new Set(
        SEEDS.map((seed) => order(shuffleFourColor(FOUR, start, seeded(seed))).indexOf(color)),
      );
      expect(roles.size).toBeGreaterThanOrEqual(3);
    });
  });

  it('avoids a dominant and secondary that look the same when the palette has such a pair', () => {
    const twins = ['#111111', '#121212', '#e63946', '#a8dadc'];
    const current = assignFourColor(twins)!;
    SEEDS.forEach((seed) => {
      const next = shuffleFourColor(twins, current, seeded(seed));
      expect(contrastRatio(next.dominant, next.secondary)).toBeGreaterThanOrEqual(1.5);
    });
  });

  it('works for a palette padded up from one color', () => {
    const one = assignFourColor(['#3366cc'])!;
    const next = shuffleFourColor(['#3366cc'], one, seeded(2));
    expect(order(next)).not.toEqual(order(one));
    expect(new Set(order(next)).size).toBe(4);
  });

  it('gives the current roles back for an empty palette', () => {
    expect(shuffleFourColor([], start, seeded(1))).toBe(start);
  });
});
