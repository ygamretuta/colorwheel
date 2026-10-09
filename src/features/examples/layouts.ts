/**
 * Geometry for the 60-30-10 and 60-25-10-5 examples. Each layout is a 200x300 canvas whose background
 * is the dominant color; `rects` are the other colors' blocks laid on top of it. Text and hairlines are
 * drawn separately and are treated as neutral, as the rules do.
 */
export const CANVAS = { width: 200, height: 300 };

export type Role = 'secondary' | 'accent' | 'highlight';

/** A block laid over the dominant-colored background. */
export interface Block<R extends Role = Role> {
  role: R;
  x: number;
  y: number;
  width: number;
  height: number;
}

type ThreeColorRole = 'secondary' | 'accent';

/** 60-30-10 */
export const LANDING_RECTS: Block<ThreeColorRole>[] = [
  { role: 'secondary', x: 0, y: 0, width: 200, height: 40 }, // header
  { role: 'accent', x: 0, y: 40, width: 200, height: 12 }, // accent strip
  { role: 'accent', x: 40, y: 170, width: 120, height: 30 }, // call to action
  { role: 'secondary', x: 0, y: 250, width: 200, height: 50 }, // footer
];

/** 60-30-10 */
export const POSTER_RECTS: Block<ThreeColorRole>[] = [
  { role: 'secondary', x: 0, y: 110, width: 200, height: 90 }, // band
  { role: 'accent', x: 130, y: 206, width: 60, height: 50 }, // price tag
  { role: 'accent', x: 0, y: 285, width: 200, height: 15 }, // bottom stripe
];

/** 60-25-10-5: the secondary shrinks to 25% and a rare highlight takes 5%. */
export const FOUR_LANDING_RECTS: Block[] = [
  { role: 'secondary', x: 0, y: 0, width: 200, height: 40 }, // header
  { role: 'accent', x: 0, y: 40, width: 200, height: 12 }, // accent strip
  { role: 'highlight', x: 20, y: 56, width: 60, height: 30 }, // "new" badge
  { role: 'accent', x: 40, y: 190, width: 120, height: 30 }, // call to action
  { role: 'highlight', x: 0, y: 259, width: 200, height: 6 }, // hairline above the footer
  { role: 'secondary', x: 0, y: 265, width: 200, height: 35 }, // footer
];

/** 60-25-10-5 */
export const FOUR_POSTER_RECTS: Block[] = [
  { role: 'highlight', x: 0, y: 14, width: 100, height: 30 }, // ribbon
  { role: 'secondary', x: 0, y: 110, width: 200, height: 75 }, // band
  { role: 'accent', x: 130, y: 200, width: 60, height: 50 }, // price tag
  { role: 'accent', x: 0, y: 285, width: 200, height: 15 }, // bottom stripe
];

export interface RoleShares {
  dominant: number;
  secondary: number;
  accent: number;
  highlight: number;
}

/** Share of the canvas covered by each role (the dominant background shows through the rest). */
export function roleShares(rects: Block[], { width, height } = CANVAS): RoleShares {
  const total = width * height;
  const covered: Record<Role, number> = { secondary: 0, accent: 0, highlight: 0 };
  rects.forEach(({ role, width: w, height: h }) => {
    covered[role] += w * h;
  });
  return {
    dominant: (total - covered.secondary - covered.accent - covered.highlight) / total,
    secondary: covered.secondary / total,
    accent: covered.accent / total,
    highlight: covered.highlight / total,
  };
}
