/**
 * Geometry for the 60-30-10 examples. Each layout is a 200x300 canvas whose background is
 * the dominant color; `rects` are the secondary and accent blocks laid on top of it.
 * Text and hairlines are drawn separately and are treated as neutral, as the rule does.
 */
export const CANVAS = { width: 200, height: 300 };

export type Role = 'secondary' | 'accent';

/** A block laid over the dominant-colored background. */
export interface Block {
  role: Role;
  x: number;
  y: number;
  width: number;
  height: number;
}

export const LANDING_RECTS: Block[] = [
  { role: 'secondary', x: 0, y: 0, width: 200, height: 40 }, // header
  { role: 'accent', x: 0, y: 40, width: 200, height: 12 }, // accent strip
  { role: 'accent', x: 40, y: 170, width: 120, height: 30 }, // call to action
  { role: 'secondary', x: 0, y: 250, width: 200, height: 50 }, // footer
];

export const POSTER_RECTS: Block[] = [
  { role: 'secondary', x: 0, y: 110, width: 200, height: 90 }, // band
  { role: 'accent', x: 130, y: 206, width: 60, height: 50 }, // price tag
  { role: 'accent', x: 0, y: 285, width: 200, height: 15 }, // bottom stripe
];

/** Share of the canvas covered by each role (the dominant background shows through the rest). */
export function roleShares(
  rects: Block[],
  { width, height } = CANVAS,
): { dominant: number; secondary: number; accent: number } {
  const total = width * height;
  const covered: Record<Role, number> = { secondary: 0, accent: 0 };
  rects.forEach(({ role, width: w, height: h }) => {
    covered[role] += w * h;
  });
  return {
    dominant: (total - covered.secondary - covered.accent) / total,
    secondary: covered.secondary / total,
    accent: covered.accent / total,
  };
}
